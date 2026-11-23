"use server";

import { revalidatePath } from "next/cache";
import { placementSchema } from "@/lib/beach";
import { getGuest } from "@/lib/auth/server";
import { queryValue } from "@/lib/db";
import { z } from "zod";

export async function saveBeachSticker(input: unknown) {
  const parsed = placementSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      message: "Escolha uma figurinha e um ponto dentro da praia.",
    };
  try {
    const guest = await getGuest();
    if (!guest)
      return { ok: false, message: "Entre novamente para guardar seu lugar." };
    const p = parsed.data;
    const data = z
      .object({ ok: z.boolean(), code: z.string().optional() })
      .parse(
        await queryValue(
          "select pesca.save_beach_sticker($1, $2, $3, $4, $5) as value",
          [guest.id, p.sticker_id, p.zone_id, p.x, p.y],
        ),
      );
    if (!data?.ok)
      return {
        ok: false,
        message:
          data?.code === "rate_limited"
            ? "Espere um minuto antes de salvar de novo."
            : "Confira sua confirmação de presença antes de salvar.",
      };
    revalidatePath("/");
    return { ok: true, message: "Lugar guardado!" };
  } catch {
    return { ok: false, message: "Não deu para guardar agora. Tente de novo." };
  }
}
