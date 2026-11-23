"use server";

import { revalidatePath } from "next/cache";
import { getGuest } from "@/lib/auth/server";
import { queryValue } from "@/lib/db";
import { persistRsvp } from "@/lib/rsvp-mutation";
import type { MutationResult } from "@/lib/rsvp";

export async function saveRsvp(input: unknown): Promise<MutationResult> {
  const result = await persistRsvp(input, {
    user: getGuest,
    save: (actor, data, code) =>
      queryValue("select pesca.save_rsvp($1, $2::jsonb, $3) as value", [
        actor,
        data,
        code,
      ]),
  });
  if (result.ok) {
    revalidatePath("/");
    revalidatePath("/organizador");
  }
  return result;
}
