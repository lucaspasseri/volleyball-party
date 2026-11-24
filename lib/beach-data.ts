import "server-only";
import { photoSchema, type Photo } from "./characters";
import { getRsvpView } from "@/lib/rsvp-data";
import { getGuest } from "@/lib/auth/server";
import { queryValue } from "@/lib/db";
import { sceneRowsSchema, type SceneRow } from "@/lib/beach";

export async function getBeachView() {
  const view = await getRsvpView();
  let rows: SceneRow[] = [];
  let photo: Photo | null = null;
  let unavailable = false;
  if (view.configured) {
    try {
      const guest = await getGuest();
      const [scene, asset] = await Promise.all([
        queryValue("select pesca.character_beach_scene($1) as value", [
          guest?.id ?? null,
        ]),
        guest
          ? queryValue("select pesca.own_character_photo($1) as value", [
              guest.id,
            ])
          : null,
      ]);
      rows = sceneRowsSchema.parse(scene);
      photo = photoSchema.nullable().parse(asset);
    } catch {
      unavailable = true;
    }
  }
  return {
    rows,
    photo,
    hasProfilePhoto: Boolean(view.user?.avatarUrl),
    unavailable,
    canEdit: view.attendanceState.canPlaceSticker && !unavailable,
    shared: view.rsvp?.public_visibility_consent ?? false,
    identity: view.rsvp?.id ?? "visitor",
  };
}
