import sharp from "sharp";
import { maxPhotoBytes } from "./characters";
import { safeAvatarUrl } from "./rsvp";

const formats: Record<string, string> = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
};
export class PhotoInputError extends Error {}
export async function normalizePhoto(input: Buffer, mime: string) {
  if (
    !input.length ||
    input.length > maxPhotoBytes ||
    !Object.hasOwn(formats, mime)
  )
    throw new PhotoInputError("Envie uma foto JPG, PNG ou WebP de até 5 MB.");
  try {
    const image = sharp(input, {
      limitInputPixels: 16_000_000,
      failOn: "warning",
    });
    const meta = await image.metadata();
    if (
      meta.format !== formats[mime] ||
      (meta.pages ?? 1) !== 1 ||
      Math.min(meta.width, meta.height) < 48 ||
      Math.max(meta.width, meta.height) > 8192
    )
      throw new Error();
    // Keep the framing available for the editor. Re-encoding strips EXIF and other metadata.
    return await image
      .autoOrient()
      .resize(512, 512, { fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#f6e9cd" })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    throw new PhotoInputError(
      "Escolha uma foto estática válida, com pelo menos 48 px e até 16 megapixels.",
    );
  }
}

export async function readPhotoBody(body: Request | Response) {
  const reader = body.body?.getReader();
  if (!reader) throw new PhotoInputError("A imagem está vazia.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxPhotoBytes) {
        await reader.cancel();
        throw new PhotoInputError("Escolha uma imagem de até 5 MB.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return normalizePhoto(
    Buffer.concat(chunks),
    (body.headers.get("content-type") ?? "").split(";")[0].trim(),
  );
}

export async function importProfilePhoto(avatar: unknown, fetchImage = fetch) {
  const url = safeAvatarUrl(avatar);
  const fallback =
    "A foto do Google está indisponível. Você pode enviar uma imagem.";
  if (!url) throw new PhotoInputError(fallback);
  try {
    const res = await fetchImage(url, {
      redirect: "error",
      cache: "no-store",
      credentials: "omit",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error();
    return await readPhotoBody(res);
  } catch {
    throw new PhotoInputError(fallback);
  }
}
