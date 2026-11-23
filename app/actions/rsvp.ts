"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { persistRsvp } from "@/lib/rsvp-mutation";
import type { MutationResult } from "@/lib/rsvp";

export async function saveRsvp(input: unknown): Promise<MutationResult> {
  const result = await persistRsvp(input, {
    user: async () => {
      const db = await createClient();
      const { data, error } = await db.auth.getUser();
      return !error && data.user
        ? { id: data.user.id, avatar: data.user.user_metadata.avatar_url }
        : null;
    },
    save: async (args) => (await createClient()).rpc("save_rsvp", args),
  });
  if (result.ok) {
    revalidatePath("/");
    revalidatePath("/organizador");
  }
  return result;
}
