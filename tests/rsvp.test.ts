import { test } from "node:test";
import assert from "node:assert/strict";
import { persistRsvp, type MutationDependencies } from "../lib/rsvp-mutation";
import {
  deriveAttendanceState,
  rsvpInputSchema,
  safeAvatarUrl,
  type RsvpInput,
  type SavedRsvp,
} from "../lib/rsvp";
import { attendanceCsv } from "../lib/organizer";

const input: RsvpInput = {
  full_name: "  Maria Silva  ",
  attendance_status: "going",
  message: "Feliz aniversário!",
  contribution: "Gelo",
  companions_count: 1,
  public_visibility_consent: false,
  avatar_visibility_consent: false,
  invite_code: "praia",
};
const saved: SavedRsvp = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  guest_id: "11111111-1111-4111-8111-111111111111",
  ...input,
  hidden: false,
  created_at: "2026-11-23T00:00:00Z",
  updated_at: "2026-11-23T00:00:00Z",
};
const dependencies: MutationDependencies = {
  user: async () => ({
    id: saved.guest_id,
    avatar: "https://lh3.googleusercontent.com/photo",
  }),
  save: async () => ({ error: null, data: { ok: true, rsvp: saved } }),
};

test("server mutation requires a verified session before writing", async () => {
  let writes = 0;
  const result = await persistRsvp(input, {
    ...dependencies,
    user: async () => null,
    save: async () => {
      writes++;
      return { data: null, error: null };
    },
  });
  assert.equal(result.ok, false);
  assert.equal(writes, 0);
  assert.match(result.message, /sessão/);
});
test("valid save waits for persistence, strips submitted ownership and uses trusted avatar", async () => {
  let sent: Record<string, unknown> | undefined;
  const result = await persistRsvp(
    { ...input, guest_id: "victim", avatar_url: "https://evil.example/photo" },
    {
      ...dependencies,
      save: async (args) => {
        sent = args;
        return { error: null, data: { ok: true, rsvp: saved } };
      },
    },
  );
  assert.equal(result.ok, true);
  assert.equal((sent!.p_input as Record<string, unknown>).guest_id, undefined);
  assert.equal(
    (sent!.p_input as Record<string, unknown>).full_name,
    "Maria Silva",
  );
  assert.equal(
    (sent!.p_input as Record<string, unknown>).avatar_url,
    "https://lh3.googleusercontent.com/photo",
  );
  assert.equal(sent!.p_invite_code, "praia");
  assert.equal(
    (sent!.p_input as Record<string, unknown>).invite_code,
    undefined,
  );
});
test("validation rejects malformed names, statuses, lengths, companions, contributions and consent", async () => {
  for (const invalid of [
    { full_name: "   " },
    { full_name: "x".repeat(101) },
    { attendance_status: "yes" },
    { message: "x".repeat(501) },
    { companions_count: -1 },
    { companions_count: 1.5 },
    { companions_count: 6 },
    { companions_count: "2" },
    { contribution: "dinheiro" },
    { avatar_visibility_consent: true },
    { public_visibility_consent: "true" },
    { invite_code: "x".repeat(129) },
  ]) {
    let wrote = false;
    const result = await persistRsvp(
      { ...input, ...invalid },
      {
        ...dependencies,
        save: async () => {
          wrote = true;
          return { data: null, error: null };
        },
      },
    );
    assert.equal(result.ok, false, JSON.stringify(invalid));
    assert.equal(wrote, false);
    assert.ok(result.fieldErrors);
  }
});
test("omitted private consent is not silently enabled", () => {
  assert.equal(
    rsvpInputSchema.safeParse({
      ...input,
      public_visibility_consent: undefined,
    }).success,
    false,
  );
});
test("upsert responses preserve the existing RSVP identity when editing", async () => {
  const result = await persistRsvp(
    { ...input, attendance_status: "maybe" },
    {
      ...dependencies,
      save: async () => ({
        error: null,
        data: { ok: true, rsvp: { ...saved, attendance_status: "maybe" } },
      }),
    },
  );
  assert.equal(result.rsvp?.id, saved.id);
  assert.equal(result.rsvp?.attendance_status, "maybe");
});
test("database/network failures never produce success", async () => {
  for (const save of [
    async () => ({ error: new Error("offline"), data: null }),
    async () => {
      throw new Error("network");
    },
    async () => ({ error: null, data: { ok: true } }),
  ]) {
    const result = await persistRsvp(input, { ...dependencies, save });
    assert.equal(result.ok, false);
    assert.equal(result.rsvp, undefined);
  }
});
test("rate limits and invite errors produce friendly Portuguese feedback", async () => {
  for (const [code, expected] of [
    ["rate_limited", /um minuto/],
    ["invite_required", /código/],
    ["unauthenticated", /sessão/],
  ] as const) {
    const result = await persistRsvp(input, {
      ...dependencies,
      save: async () => ({ error: null, data: { ok: false, code } }),
    });
    assert.equal(result.ok, false);
    assert.match(result.message, expected);
  }
});
test("only authenticated, confirmed, unhidden guests qualify for Goal 3", () => {
  assert.equal(deriveAttendanceState(true, saved).canPlaceSticker, true);
  for (const state of [
    deriveAttendanceState(false, saved),
    deriveAttendanceState(true, null),
    deriveAttendanceState(true, { ...saved, hidden: true }),
    deriveAttendanceState(true, { ...saved, attendance_status: "maybe" }),
    deriveAttendanceState(true, { ...saved, attendance_status: "not_going" }),
  ])
    assert.equal(state.canPlaceSticker, false);
});
test("avatar URLs are restricted to HTTPS Google image hosts without credentials", () => {
  assert.equal(
    safeAvatarUrl("https://lh3.googleusercontent.com/a/photo"),
    "https://lh3.googleusercontent.com/a/photo",
  );
  for (const url of [
    "javascript:alert(1)",
    "http://lh3.googleusercontent.com/a",
    "https://lh3.googleusercontent.com.evil.org/a",
    "https://evil.org",
    "https://user@lh3.googleusercontent.com/a",
    "https://lh3.googleusercontent.com:123/a",
    null,
  ])
    assert.equal(safeAvatarUrl(url), null);
});
test("CSV preserves quotes and newlines and neutralizes spreadsheet formulas", () => {
  const csv = attendanceCsv([
    {
      ...saved,
      guest_profiles: { full_name: '  =HYPERLINK("evil")' },
      message: 'Oi, "Pesca"\nPraia!',
    },
  ]);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"\'  =HYPERLINK(""evil"")"'));
  assert.ok(csv.includes('"Oi, ""Pesca""\nPraia!"'));
  assert.equal(csv.includes(saved.guest_id), false);
});
