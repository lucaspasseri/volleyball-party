import { z } from "zod";
import { getGuest, siteOrigin } from "@/lib/auth/server";
import { queryValue } from "@/lib/db";

type Context = { params: Promise<{ id: string }> };
const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  "Cross-Origin-Resource-Policy": "same-origin",
};
export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success)
    return new Response(null, { status: 404, headers });
  const read = (owner: string | null) =>
    queryValue("select pesca.read_character_photo($1,$2) as value", [
      owner,
      id,
    ]);
  // Shared portraits can be served without one hosted auth check per guest on the map.
  let bytes = await read(null);
  if (!bytes) {
    const guest = await getGuest();
    if (guest) bytes = await read(guest.id);
  }
  return Buffer.isBuffer(bytes)
    ? new Response(new Uint8Array(bytes), {
        headers: { ...headers, "Content-Type": "image/webp" },
      })
    : new Response(null, { status: 404, headers });
}
export async function DELETE(request: Request, context: Context) {
  if (request.headers.get("origin") !== siteOrigin())
    return new Response(null, { status: 403 });
  const guest = await getGuest();
  if (!guest) return new Response(null, { status: 401 });
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success)
    return new Response(null, { status: 404 });
  const removed = await queryValue(
    "select pesca.remove_character_photo($1,$2) as value",
    [guest.id, id],
  );
  return new Response(null, { status: removed ? 204 : 404, headers });
}
