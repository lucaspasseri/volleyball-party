// Test-only HTTP double. Never imported by application code or production builds.
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const guestId = "11111111-1111-4111-8111-111111111111";
const organizerId = "33333333-3333-4333-8333-333333333333";
let rows: Record<string, any> = {};
let profiles: Record<string, any> = {};
let failSave = false;
let delaySave = 0;
let nextOrganizer = false;
let missingProfile = false;
let failReads = false;
function user(id: string) {
  return {
    id,
    aud: "authenticated",
    role: "authenticated",
    email: "private@example.com",
    app_metadata: { provider: "google", providers: ["google"] },
    user_metadata: missingProfile
      ? {}
      : {
          full_name: "Maria Silva",
          avatar_url: "https://lh3.googleusercontent.com/photo",
        },
    created_at: new Date().toISOString(),
  };
}
function session(id: string) {
  const encoded = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");
  const access_token = `${encoded({ alg: "HS256", typ: "JWT" })}.${encoded({ sub: id, aud: "authenticated", role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) })}.test-signature`;
  return {
    access_token,
    token_type: "bearer",
    expires_in: 3600,
    refresh_token: `refresh-${id}`,
    user: user(id),
  };
}
function caller(authorization?: string) {
  try {
    return JSON.parse(
      Buffer.from(authorization!.split(".")[1], "base64url").toString(),
    ).sub as string;
  } catch {
    return null;
  }
}
createServer(async (req, res) => {
  const url = new URL(req.url!, "http://127.0.0.1:54326");
  let body: any = {};
  for await (const chunk of req)
    body =
      typeof body === "string" ? body + chunk.toString() : chunk.toString();
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const send = (data: unknown, status = 200) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  };
  if (url.pathname === "/__reset") {
    rows = {};
    profiles = {};
    failSave = false;
    delaySave = 0;
    nextOrganizer = false;
    missingProfile = false;
    failReads = false;
    return send({ ok: true });
  }
  if (url.pathname === "/__control") {
    failSave = body.failSave ?? failSave;
    delaySave = body.delaySave ?? delaySave;
    nextOrganizer = body.nextOrganizer ?? nextOrganizer;
    missingProfile = body.missingProfile ?? missingProfile;
    failReads = body.failReads ?? failReads;
    return send({ ok: true });
  }
  if (url.pathname === "/__state") return send({ rows, profiles });
  if (url.pathname === "/health") return send({ ok: true });
  if (url.pathname === "/auth/v1/authorize") {
    res.writeHead(302, {
      Location: `${url.searchParams.get("redirect_to")}?code=test-code`,
    });
    return res.end();
  }
  if (url.pathname === "/auth/v1/token") {
    if (body.auth_code === "test-code" || body.refresh_token)
      return send(session(nextOrganizer ? organizerId : guestId));
    return send(
      { error: "invalid_grant", error_description: "Test invalid code" },
      400,
    );
  }
  const id = caller(req.headers.authorization);
  if (url.pathname === "/auth/v1/user")
    return id
      ? send(user(id))
      : send({ message: "Invalid JWT", code: "bad_jwt" }, 401);
  if (url.pathname === "/auth/v1/logout") {
    res.writeHead(204);
    return res.end();
  }
  if (failReads && url.pathname.startsWith("/rest/"))
    return send({ message: "Read unavailable" }, 503);
  if (url.pathname.endsWith("/rpc/invitation_required")) return send(false);
  if (url.pathname.endsWith("/rpc/is_organizer"))
    return send(id === organizerId);
  if (url.pathname.endsWith("/rpc/public_attendance")) {
    const all = Object.values(rows).filter((r) => !r.hidden);
    const going = all.filter((r) => r.attendance_status === "going");
    return send({
      going: going.length,
      maybe: all.filter((r) => r.attendance_status === "maybe").length,
      companions: going.reduce((sum, r) => sum + r.companions_count, 0),
      guests: going
        .filter((r) => r.public_visibility_consent)
        .map((r) => ({
          display_name: profiles[r.guest_id].display_name,
          avatar_url: r.avatar_visibility_consent
            ? profiles[r.guest_id].avatar_url
            : null,
        })),
    });
  }
  if (url.pathname.endsWith("/rpc/save_rsvp")) {
    if (delaySave)
      await new Promise((resolve) => setTimeout(resolve, delaySave));
    if (failSave) return send({ message: "Simulated database failure" }, 503);
    if (!id) return send({ ok: false, code: "unauthenticated" });
    const { avatar_url, full_name, ...input } = body.p_input;
    profiles[id] = {
      full_name,
      display_name: full_name.trim().split(/\s+/)[0],
      avatar_url,
    };
    rows[id] = {
      id: rows[id]?.id ?? randomUUID(),
      guest_id: id,
      ...input,
      hidden: rows[id]?.hidden ?? false,
      created_at: rows[id]?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return send({ ok: true, rsvp: rows[id] });
  }
  if (url.pathname.endsWith("/rpc/moderate_rsvp")) {
    if (id !== organizerId) return send({ ok: false, code: "forbidden" });
    const row = Object.values(rows).find((row) => row.id === body.p_id);
    if (row) row.hidden = body.p_hidden;
    return send({ ok: Boolean(row) });
  }
  if (url.pathname === "/rest/v1/rsvps") {
    let result = Object.values(rows).filter(
      (r) => id === organizerId || r.guest_id === id,
    );
    const filter = url.searchParams.get("guest_id");
    if (filter) result = result.filter((r) => r.guest_id === filter.slice(3));
    if (url.searchParams.get("select")?.includes("guest_profiles"))
      result = result.map((r) => ({
        ...r,
        guest_profiles: { full_name: profiles[r.guest_id].full_name },
      }));
    return send(result);
  }
  if (url.pathname === "/rest/v1/guest_profiles")
    return send(profiles[id!] ? [profiles[id!]] : []);
  return send({ message: `Unhandled mock path ${url.pathname}` }, 404);
}).listen(54326, "127.0.0.1", () =>
  process.stdout.write("Supabase mock on 54326\n"),
);
