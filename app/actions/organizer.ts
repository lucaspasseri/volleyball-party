"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { organizerClient } from "@/lib/rsvp-data";

export async function moderateRsvp(input: unknown) {
  const parsed = z
    .object({ id: z.uuid(), hidden: z.boolean() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, message: "Resposta inválida." };
  try {
    const db = await organizerClient();
    if (!db) return { ok: false, message: "Acesso restrito ao organizador." };
    const { data, error } = await db.rpc("moderate_rsvp", {
      p_id: parsed.data.id,
      p_hidden: parsed.data.hidden,
    });
    if (error || data?.ok !== true)
      return {
        ok: false,
        message:
          data?.code === "rate_limited"
            ? "Espere um minuto antes de tentar novamente."
            : "Não foi possível atualizar a resposta.",
      };
    revalidatePath("/");
    revalidatePath("/organizador");
    return {
      ok: true,
      message: parsed.data.hidden
        ? "Resposta ocultada da lista e das contagens."
        : "Resposta restaurada.",
    };
  } catch {
    return { ok: false, message: "Falha de conexão. Tente novamente." };
  }
}
