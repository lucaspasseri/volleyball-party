// Test-only Managed Better Auth upstream. RSVP and sticker data use real PostgreSQL.
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import {
  placementAt,
  suggestSpot,
  zones,
  zoneAt,
  type GroundPosition,
} from "../../lib/beach";
import { stickerIds, stickers, type StickerId } from "../../lib/stickers";
import { Pool } from "pg";
import { basename, isAbsolute } from "node:path";

const ownerUrl = process.env.PESCA_TEST_OWNER_URL;
if (!ownerUrl) throw new Error("Use npm run test:e2e:rsvp.");
const connection = new URL(ownerUrl);
const socket = connection.searchParams.get("host") ?? "";
if (
  connection.username !== "pesca_test_owner" ||
  !isAbsolute(socket) ||
  !basename(socket).startsWith("pesca-test-")
)
  throw new Error("The fixture needs a disposable PostgreSQL test socket.");
const db = new Pool({ connectionString: ownerUrl });
const guest = "guest-test-maria";
const organizer = "guest-test-organizer";
const secondGuest = "guest-test-elisa";
const cookiePrefix = "__Secure-neon-auth.";
const cookieOptions = "; Path=/; Secure; HttpOnly; SameSite=Lax";
const tokens = new Map<string, string>();
const challenges = new Map<
  string,
  { actor: string; callback: string; verifier: string }
>();
let nextActor = guest;
let missingProfile = false;

const initialized = db.query(`
  insert into pesca.organizers values ('guest-test-organizer');
  create table pesca.test_controls(fail_save boolean default false, delay_save integer default 0);
  insert into pesca.test_controls default values;
  create function pesca.test_write_fault() returns trigger
  language plpgsql as $$
  declare controls pesca.test_controls;
  begin
    select * into controls from pesca.test_controls;
    perform pg_sleep(controls.delay_save / 1000.0);
    if controls.fail_save then raise exception 'Simulated write failure'; end if;
    return new;
  end;
  $$;
  create trigger test_write_fault before insert on pesca.rsvps
    for each row execute function pesca.test_write_fault();
  create trigger test_write_fault before insert on pesca.sticker_placements
    for each row execute function pesca.test_write_fault();
`);

function session(token: string, actor: string) {
  const now = new Date().toISOString();
  return {
    session: {
      id: token,
      token,
      userId: actor,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    },
    user: {
      id: actor,
      email: "private@example.com",
      emailVerified: true,
      name: missingProfile
        ? ""
        : actor === secondGuest
          ? "Elisa Souza"
          : "Maria Silva",
      image: missingProfile ? null : "https://lh3.googleusercontent.com/photo",
      createdAt: now,
      updatedAt: now,
    },
  };
}

async function populateBeach(composition: boolean | "crowded" | "perspective") {
  const samples = [
    ["Lia", "paredao", "quadras", 0],
    ["Rafa", "foguete", "quadras", 1],
    ["Caio", "capivara", "torcida", 0],
    ["Bia", "surfista", "gazebo", 0],
    ["Davi", "coco", "cadeiras", 0],
    ["Iara", "salva-vidas", "coolers", 0],
  ] as const;
  const guests: { name: string; sticker: StickerId; spot: GroundPosition }[] =
    [];
  if (composition === "perspective") {
    // Master-art coordinates keep comparisons repeatable as zone suggestions evolve.
    const cast: [StickerId, number, number][] = [
      ["crawl", 475, 207], ["tchibum", 693, 181],
      ["capita", 330, 287], ["capita", 389, 523], ["capita", 316, 980],
      ["hinata", 170, 462], ["nishinoya", 190, 592],
      ["emanuel", 690, 465], ["bloqueio", 791, 554], ["levantadora", 652, 588],
      ["brinde", 1370, 450], ["capita-do-coco", 1341, 526],
      ["dj-do-isopor", 1460, 545], ["sanfona-de-sol", 1217, 405],
      ["salva-vidas", 1309, 393], ["ronin-do-milho", 406, 851],
      ["milho", 1101, 824], ["roshi", 865, 720],
      ["siri", 171, 558], ["goku", 729, 517],
    ];
    for (const [sticker, x, y] of cast) {
      const point = { x: x / 1536, y: y / 1024 };
      guests.push({ name: `Praia ${guests.length + 1}`, sticker,
        spot: { ...point, zone_id: zoneAt(point) } });
    }
  } else if (composition === "crowded") {
    for (const sticker of stickerIds) {
      const spot = suggestSpot(
        stickers[sticker].zone,
        guests.map((guest) => guest.spot),
        sticker,
      );
      guests.push({ name: `Convidado ${guests.length + 1}`, sticker, spot });
    }
  } else {
    for (const [name, sticker, zone, index] of samples) {
      guests.push({
        name,
        sticker,
        spot: { ...zones[zone].anchors[index], zone_id: zone },
      });
    }
  }
  for (const { name, sticker, spot } of guests) {
    const { x, y, zone_id } = placementAt(spot, sticker);
    const actor = `sample-${name}`;
    await db.query("select pesca.save_rsvp($1,$2::jsonb,'')", [
      actor,
      {
        full_name: name,
        attendance_status: "going",
        companions_count: 0,
        contribution: "",
        message: "",
        public_visibility_consent: true,
        avatar_visibility_consent: false,
      },
    ]);
    await db.query("select pesca.save_beach_sticker($1,$2,$3,$4,$5)", [
      actor,
      sticker,
      zone_id,
      x,
      y,
    ]);
  }
}

async function handle(
  req: import("node:http").IncomingMessage,
  res: import("node:http").ServerResponse,
) {
  const origin = "http://127.0.0.1:54326";
  const url = new URL(req.url!, origin);
  const send = (data: unknown, status = 200) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  };
  const read = async () => {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    return JSON.parse(raw || "{}");
  };
  const cookies = new Map(
    (req.headers.cookie ?? "").split(/;\s*/).map((pair) => {
      const at = pair.indexOf("=");
      return [pair.slice(0, at), pair.slice(at + 1)];
    }),
  );
  const token = cookies.get(cookiePrefix + "session_token") ?? "";
  const challenge = cookies.get(cookiePrefix + "session_challenge") ?? "";
  switch (url.pathname) {
    case "/health":
      return send({ ok: true });
    case "/__reset":
      await db.query(
        "truncate pesca.guest_profiles, pesca.rsvps, pesca.sticker_placements, pesca.mutation_limits; update pesca.test_controls set fail_save=false, delay_save=0",
      );
      tokens.clear();
      challenges.clear();
      nextActor = guest;
      missingProfile = false;
      return send({ ok: true });
    case "/__control": {
      const body = await read();
      if (body.nextOrganizer) nextActor = organizer;
      if (body.nextGuest) nextActor = secondGuest;
      if (body.revokeSessions) tokens.clear();
      missingProfile = body.missingProfile ?? missingProfile;
      await db.query(
        "update pesca.test_controls set fail_save=coalesce($1,fail_save), delay_save=coalesce($2,delay_save)",
        [body.failSave ?? null, body.delaySave ?? null],
      );
      if (body.populateBeach)
        await populateBeach(body.populateBeach);
      return send({ ok: true });
    }
    case "/__state": {
      const [rsvps, stickers] = await Promise.all([
        db.query("select * from pesca.rsvps"),
        db.query(
          "select *, x::float8 as x, y::float8 as y from pesca.sticker_placements",
        ),
      ]);
      return send({
        rows: Object.fromEntries(rsvps.rows.map((row) => [row.guest_id, row])),
        placements: Object.fromEntries(
          stickers.rows.map((row) => [row.guest_id, row]),
        ),
      });
    }
    case "/test/auth/sign-in/social": {
      const { provider, callbackURL } = await read();
      if (
        provider !== "google" ||
        callbackURL !== "http://localhost:3101/auth/callback"
      )
        return send({ message: "Unexpected OAuth configuration" }, 400);
      const id = randomUUID();
      challenges.set(id, {
        actor: nextActor,
        callback: callbackURL,
        verifier: randomUUID(),
      });
      res.setHeader(
        "Set-Cookie",
        cookiePrefix + "session_challenge=" + id + cookieOptions,
      );
      return send({
        url: `${origin}/__oauth?challenge=${id}`,
        redirect: false,
      });
    }
    case "/__oauth": {
      const entry = challenges.get(url.searchParams.get("challenge") ?? "");
      if (!entry) return send({ message: "Invalid challenge" }, 400);
      const callback = new URL(entry.callback);
      callback.searchParams.set("neon_auth_session_verifier", entry.verifier);
      res.writeHead(302, { Location: callback.href }).end();
      return;
    }
    case "/test/auth/get-session": {
      const verifier = url.searchParams.get("neon_auth_session_verifier");
      if (verifier) {
        const entry = challenges.get(challenge);
        if (entry?.verifier !== verifier)
          return send({ message: "Invalid verifier" }, 401);
        challenges.delete(challenge);
        const issued = randomUUID();
        tokens.set(issued, entry.actor);
        res.setHeader("Set-Cookie", [
          cookiePrefix + "session_token=" + issued + cookieOptions,
          cookiePrefix + "session_challenge=; Max-Age=0" + cookieOptions,
        ]);
        return send(session(issued, entry.actor));
      }
      const actor = tokens.get(token);
      return send(actor ? session(token, actor) : null);
    }
    case "/test/auth/sign-out":
      tokens.delete(token);
      res.setHeader(
        "Set-Cookie",
        cookiePrefix + "session_token=; Max-Age=0" + cookieOptions,
      );
      return send({ success: true });
    default:
      return send({ message: "Unhandled Auth fixture endpoint" }, 404);
  }
}

createServer((req, res) => {
  initialized
    .then(() => handle(req, res))
    .catch((error) => {
      process.stderr.write(`${error}\n`);
      res.writeHead(500).end();
    });
}).listen(54326, "127.0.0.1");
