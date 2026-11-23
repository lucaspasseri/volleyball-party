import "server-only";
import { getGuest } from "@/lib/auth/server";
import { queryValue } from "@/lib/db";
import { organizerRowSchema, type OrganizerRow } from "./organizer";

export async function getOrganizerRows(): Promise<OrganizerRow[] | null> {
  const guest = await getGuest();
  if (!guest) return null;
  const data = await queryValue("select pesca.organizer_rows($1) as value", [
    guest.id,
  ]);
  return organizerRowSchema.array().nullable().parse(data);
}
