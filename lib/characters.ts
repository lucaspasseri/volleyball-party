import { z } from "zod";
import type { ZoneId } from "./beach";
import art from "./character-art.json";
import { stickers, stickerIds, type StickerId } from "./stickers";

export const maxPhotoBytes = 5 * 1024 * 1024;

type Body = keyof typeof art;
export type CharacterId = `meu-${Body}`;
export type SceneStickerId = StickerId | CharacterId;
export const characterIds = (Object.keys(art) as Body[]).map(
  (body): CharacterId => `meu-${body}`,
);
export const sceneStickerIds = [...stickerIds, ...characterIds];
export function isCharacter(id: SceneStickerId): id is CharacterId {
  return id.startsWith("meu-");
}
function makeTemplate(id: CharacterId) {
  const body = id.slice(4) as Body;
  const entry = art[body];
  return {
    ...entry,
    reference: entry.reference as StickerId,
    src: `/beach/characters/${body}.webp`,
    intrinsicWidth: 256,
    intrinsicHeight: 256,
    zone: entry.zone as ZoneId,
  };
}
const bodies = Object.fromEntries(
  characterIds.map((id) => [id, makeTemplate(id)]),
) as Record<CharacterId, ReturnType<typeof makeTemplate>>;
export function template(id: CharacterId) {
  return bodies[id];
}
export function sceneSticker(id: SceneStickerId) {
  return isCharacter(id) ? template(id) : stickers[id];
}

export const faceSchema = z.strictObject({
  zoom: z.number().min(1).max(4),
  x: z.number().min(-1).max(1),
  y: z.number().min(-1).max(1),
  rotation: z.number().min(-45).max(45),
});
export type Face = z.infer<typeof faceSchema>;
export const defaultFace: Face = { zoom: 1.22, x: 0, y: 0, rotation: 0 };
export const photoSchema = z.strictObject({
  photoId: z.uuid(),
  aspect: z.number().positive().max(1024),
});
export type Photo = z.infer<typeof photoSchema>;
export const characterSchema = photoSchema.extend({ face: faceSchema });
export function photoFrame(
  width: number,
  height: number,
  aspect: number,
  angle: number,
  face: Face,
) {
  const radians = ((angle + face.rotation) * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians)),
    sin = Math.abs(Math.sin(radians));
  // Fit the rotated opening inside the original photo. Panning uses only the spare margin.
  const coverWidth = width * cos + height * sin;
  const coverHeight = height * cos + width * sin;
  const h = Math.max(coverHeight, coverWidth / aspect) * face.zoom;
  const w = h * aspect;
  return {
    width: w,
    height: h,
    x: (-w + face.x * (w - coverWidth)) / 2,
    y: (-h + face.y * (h - coverHeight)) / 2,
  };
}
export type Character = z.infer<typeof characterSchema>;
