"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getGuest } from "@/lib/auth/server";
import { queryValue } from "@/lib/db";

export async function moderateRsvp(input: unknown) {
  const parsed = z
    .object({ id: z.uuid(), hidden: z.boolean() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, message: "Resposta inválida." };
  try {
    const actor = await getGuest();
    if (!actor)
      return { ok: false, message: "Acesso restrito ao organizador." };
    const data = z
      .object({ ok: z.boolean(), code: z.string().optional() })
      .parse(
        await queryValue("select pesca.moderate_rsvp($1, $2, $3) as value", [
          actor.id,
          parsed.data.id,
          parsed.data.hidden,
        ]),
      );
    if (data.code === "forbidden")
      return { ok: false, message: "Acesso restrito ao organizador." };
    if (!data.ok)
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
