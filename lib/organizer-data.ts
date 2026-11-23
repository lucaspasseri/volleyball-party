import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { organizerRowSchema, type OrganizerRow } from "./organizer";

export async function getOrganizerRows(
  db: SupabaseClient,
): Promise<OrganizerRow[]> {
  const rows: OrganizerRow[] = [];
  for (let offset = 0; ; offset += 500) {
    const result = await db
      .from("rsvps")
      .select("*,guest_profiles(full_name)")
      .order("created_at")
      .order("id")
      .range(offset, offset + 499);
    if (result.error) throw new Error("Não foi possível carregar a lista.");
    const batch = organizerRowSchema.array().parse(result.data);
    rows.push(...batch);
    if (batch.length < 500) return rows;
  }
}
