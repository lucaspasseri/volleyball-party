import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  destination,
  feet,
  nearbyAnchor,
  placementAt,
  placementSchema,
  playable,
  scenePoint,
  suggestSpot,
  zoneAt,
  zoneIds,
  zones,
  type Point,
} from "../lib/beach";
import { stickerCollections, stickerIds } from "../lib/stickers";

test("the saved center restores the same feet after panning, zooming and resizing", () => {
  for (const id of zoneIds) {
    for (const sticker of stickerIds) {
      const point = suggestSpot(id, []);
      const saved = placementAt(point, sticker);
      const ground = feet(
        placementSchema.parse(JSON.parse(JSON.stringify(saved))),
      );
      assert.ok(Math.abs(ground.y - point.y) < 1e-12);
      for (const rect of [
        { left: 25, top: 70, width: 1200, height: 800 },
        { left: 16, top: 30, width: 360, height: 240 },
        { left: -207, top: -55, width: 720, height: 480 },
      ]) {
        const client = {
          x: rect.left + ground.x * rect.width,
          y: rect.top + ground.y * rect.height,
        };
        const actual = scenePoint(client, rect);
        assert.ok(Math.abs(actual.x - point.x) < 1e-12);
        assert.ok(Math.abs(actual.y - point.y) < 1e-12);
      }
    }
  }
});

test("each landmark's anchors fall within its painted area, including both courts", () => {
  for (const id of zoneIds) {
    for (const a of zones[id].anchors) {
      assert.equal(zoneAt(a), id);
      assert.deepEqual(playable(a), a);
    }
    const first = suggestSpot(id, []);
    const next = suggestSpot(id, [first]);
    assert.equal(next.zone_id, id);
    assert.notDeepEqual(first, next);
  }
  assert.equal(zoneAt({ x: 0.33, y: 0.5 }), "beira-mar"); // gap between nets
  assert.equal(zoneAt({ x: 0.51, y: 0.72 }), "beira-mar");
});

test("a nearby free seat snaps, occupied seats and open sand allow fine placement", () => {
  const seat = zones.cadeiras.anchors[0];
  const close = { x: seat.x + 0.008, y: seat.y + 0.006 };
  assert.deepEqual(nearbyAnchor(close, []), seat);
  assert.deepEqual(destination(close, [], true), {
    ...seat,
    zone_id: "cadeiras",
  });
  assert.deepEqual(destination(close, [seat], true), {
    ...close,
    zone_id: "cadeiras",
  });
  assert.deepEqual(destination(close, [], false), {
    ...close,
    zone_id: "cadeiras",
  });
  const free = zones["beira-mar"].anchors[0];
  assert.equal(nearbyAnchor(free, []), undefined);
  assert.deepEqual(destination(free, [], true), {
    ...free,
    zone_id: "beira-mar",
  });
  const full = suggestSpot("cadeiras", zones.cadeiras.anchors);
  assert.ok(
    zones.cadeiras.anchors.every(
      (a) => Math.hypot(full.x - a.x, full.y - a.y) > 0.04,
    ),
  );
});

test("four guests can gather at the coolers and the occupied small bench has no snap point", () => {
  const group: Point[] = [];
  for (const anchor of zones.coolers.anchors) {
    const next = suggestSpot("coolers", group);
    assert.deepEqual(next, { ...anchor, zone_id: "coolers" });
    assert.deepEqual(nearbyAnchor(anchor, group), anchor);
    group.push(next);
  }
  assert.equal(group.length, 4);
  const occupiedBench = { x: 168 / 1536, y: 802 / 1024 };
  assert.equal(nearbyAnchor(occupiedBench, []), undefined);
});

test("the water and promenade accept placements and every bounded center fits the database", () => {
  for (const id of ["mar", "calcadao"] as const) {
    const point = zones[id].anchors[0];
    assert.deepEqual(destination(point, [], false), { ...point, zone_id: id });
  }
  for (const x of [-4, 0.32, 0.63, 0.85, 3]) {
    for (const y of [-5, 0.5, 2]) {
      const point = destination({ x, y }, [], true);
      assert.ok(point.y > 0.1 && point.y < 0.98);
      if (x >= 0.85) assert.ok(point.y > 0.34);
      for (const sticker of stickerIds)
        assert.ok(
          placementSchema.safeParse(placementAt(point, sticker)).success,
        );
    }
  }
});
test("both collections group every sticker exactly once with a distinct asset", () => {
  const [beach, pop] = stickerCollections;
  assert.equal(beach.ids.length, 30);
  assert.equal(pop.ids.length, 26);
  assert.deepEqual(
    pop.groups.map(({ name }) => name),
    ["Anime", "Esportes", "Música", "Cinema e games"],
  );
  const grouped = stickerCollections.flatMap(({ groups }) =>
    groups.flatMap(({ ids }) => ids),
  );
  assert.deepEqual(grouped.sort(), [...stickerIds].sort());
  const dir = "public/beach/stickers";
  assert.deepEqual(
    readdirSync(dir)
      .filter((file) => file.endsWith(".webp"))
      .sort(),
    stickerIds.map((id) => `${id}.webp`).sort(),
  );
  const hashes = stickerIds.map((id) =>
    createHash("sha256")
      .update(readFileSync(`${dir}/${id}.webp`))
      .digest("hex"),
  );
  assert.equal(new Set(hashes).size, stickerIds.length);
});

test("all previous IDs and centers remain readable and invalid payloads are rejected", () => {
  for (const sticker_id of [
    "levantadora",
    "foguete",
    "paredao",
    "salva-vidas",
    "surfista",
    "capivara",
    "siri",
    "coco",
    "gaivota",
    "capita",
    "soneca",
    "mergulho",
  ])
    assert.ok(
      placementSchema.safeParse({
        x: 0.4,
        y: 0.6,
        zone_id: "quadras",
        sticker_id,
      }).success,
    );
  for (const id of zoneIds) {
    assert.ok(
      placementSchema.safeParse({
        x: 0.03,
        y: 0.045,
        sticker_id: "siri",
        zone_id: id,
      }).success,
    );
  }
  const valid = { x: 0.4, y: 0.6, sticker_id: "siri", zone_id: "quadras" };
  for (const invalid of [
    { guest_id: "another" },
    { x: Infinity },
    { y: 1 },
    { sticker_id: "unknown" },
    { zone_id: null },
  ])
    assert.ok(!placementSchema.safeParse({ ...valid, ...invalid }).success);
});
