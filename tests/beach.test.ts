import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bound,
  dropPoint,
  nearestZone,
  placementSchema,
  scenePoint,
  suggestSpot,
  stickerIds,
  zoneIds,
  zones,
} from "../lib/beach";
import { existsSync } from "node:fs";

test("scene positions round-trip through scaled and scrolled art with an off-center grip", () => {
  const point = { x: 0.35, y: 0.62 },
    grip = { x: -0.012, y: 0.021 };
  for (const rect of [
    { left: 25, top: 70, width: 1200, height: 800 },
    { left: -207, top: -55, width: 700, height: 700 / 1.5 },
    { left: -450, top: -340, width: 2400, height: 1600 },
  ]) {
    const client = {
      x: rect.left + (point.x + grip.x) * rect.width,
      y: rect.top + (point.y + grip.y) * rect.height,
    };
    assert.deepEqual(dropPoint(client, rect, grip), point);
    assert.deepEqual(scenePoint({ x: rect.left, y: rect.top }, rect), {
      x: 0,
      y: 0,
    });
  }
});
test("the complete sticker stays inside the art at the edges", () => {
  assert.deepEqual(bound({ x: -3, y: 2 }), { x: 0.03, y: 0.955 });
  assert.deepEqual(bound({ x: 9, y: -0.05 }), { x: 0.97, y: 0.045 });
  for (const id of zoneIds) assert.equal(nearestZone(zones[id]), id);
});
test("all allowed stickers have local artwork, and only catalogued placements pass validation", () => {
  for (const id of stickerIds)
    assert.ok(existsSync(`public/beach/stickers/${id}.webp`));
  const valid = { x: 0.4, y: 0.6, sticker_id: "siri", zone_id: "quadras" };
  assert.ok(placementSchema.safeParse(valid).success);
  for (const invalid of [
    { guest_id: "another" },
    { x: Infinity },
    { y: 1 },
    { sticker_id: "https://example.com" },
    { zone_id: null },
  ])
    assert.ok(!placementSchema.safeParse({ ...valid, ...invalid }).success);
});

test("zone shortcuts offer an open spot in the same area", () => {
  for (const id of zoneIds) {
    const first = suggestSpot(id, []);
    assert.equal(nearestZone(first), id);
    const second = suggestSpot(id, [first]);
    assert.notDeepEqual(second, first);
    assert.equal(nearestZone(second), id);
  }
});
