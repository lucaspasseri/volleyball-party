import sharp from "sharp";
import { z } from "zod";
import { getGuest, siteOrigin } from "@/lib/auth/server";
import { queryValue } from "@/lib/db";
import {
  importProfilePhoto,
  PhotoInputError,
  readPhotoBody,
} from "@/lib/character-photo";

function failure(message: string, status: number) {
  return Response.json({ message }, { status });
}
export async function POST(request: Request) {
  if (request.headers.get("origin") !== siteOrigin())
    return new Response(null, { status: 403 });
  try {
    const guest = await getGuest();
    if (!guest) return failure("Entre novamente para usar sua foto.", 401);
    const previous = request.headers.get("x-previous-photo");
    if (previous && !z.uuid().safeParse(previous).success)
      return failure("Foto inválida.", 400);
    if (
      !(await queryValue("select pesca.begin_character_photo($1) as value", [
        guest.id,
      ]))
    )
      return failure(
        "Confira sua presença ou tente novamente em um minuto.",
        429,
      );
    const image =
      new URL(request.url).searchParams.get("source") === "google"
        ? await importProfilePhoto(guest.avatar)
        : await readPhotoBody(request);
    const { width, height } = await sharp(image).metadata();
    const aspect = width / height;
    const id = await queryValue(
      "select pesca.store_character_photo($1,$2,$3,$4) as value",
      [guest.id, image, aspect, previous],
    );
    return id
      ? Response.json({ photoId: id, aspect })
      : failure("Sua foto mudou. Recarregue a página e tente novamente.", 409);
  } catch (error) {
    return error instanceof PhotoInputError
      ? failure(error.message, 400)
      : failure("Não deu para guardar a foto. Tente novamente.", 503);
  }
}
