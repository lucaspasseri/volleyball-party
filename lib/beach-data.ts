import "server-only";
import { getRsvpView } from "@/lib/rsvp-data";
import { getGuest } from "@/lib/auth/server";
import { queryValue } from "@/lib/db";
import { sceneRowsSchema, type SceneRow } from "@/lib/beach";

export async function getBeachView() {
  const view = await getRsvpView();
  let rows: SceneRow[] = [];
  let unavailable = false;
  if (view.configured) {
    try {
      const guest = await getGuest();
      rows = sceneRowsSchema.parse(
        await queryValue("select pesca.beach_scene($1) as value", [
          guest?.id ?? null,
        ]),
      );
    } catch {
      unavailable = true;
    }
  }
  return {
    rows,
    unavailable,
    canEdit: view.attendanceState.canPlaceSticker && !unavailable,
    shared: view.rsvp?.public_visibility_consent ?? false,
    identity: view.rsvp?.id ?? "visitor",
  };
}
