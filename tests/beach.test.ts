import { adultWidth, beachDepth, depthOrder, perspectiveLimits, stickerProfile, stickerWidth } from "../lib/beach-perspective";
import { tributeIds, tributes } from "../lib/tribute-stickers";
import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { existsSync, readdirSync, readFileSync } from "node:fs";
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
import {
  stickerCollections,
  stickerIds,
  stickers,
  stickerSrc,
} from "../lib/stickers";

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
test("original collections retain every public image and ID", () => {
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
  const originalIds = grouped.sort();
  const dir = "public/beach/stickers";
  assert.deepEqual(
    originalIds.filter((id) => existsSync(`${dir}/${id}.webp`)),
    originalIds,
  );
  const hashes = originalIds.map((id) =>
    createHash("sha256")
      .update(readFileSync(`${dir}/${id}.webp`))
      .digest("hex"),
  );
  assert.equal(new Set(hashes).size, 56);
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

test("the full album has 78 unique IDs across seven populated collections", () => {
  assert.equal(stickerIds.length, 78);
  assert.deepEqual(stickerCollections.map(({ ids }) => ids.length), [30, 26, 6, 6, 3, 3, 4]);
  assert.deepEqual(stickerCollections.flatMap(({ ids }) => ids).sort(), [...stickerIds].sort());
  for (const id of tributeIds) {
    assert.equal(stickerSrc(id), `/beach/stickers/${id}.webp`);
    assert.ok(tributes[id].description.length > 15);
  }
});

test("the reference manifest matches the SQL allowlist and published WebP artwork", async () => {
  const manifest = JSON.parse(
    readFileSync("docs/art/tribute-manifest.json", "utf8"),
  ) as {
    stickers: {
      id: string;
      references: string[];
      asset: string | null;
      publicationApproved: boolean;
    }[];
  };
  assert.equal(
    new Set(manifest.stickers.map(({ id }) => id)).size,
    manifest.stickers.length,
  );
  const ready = manifest.stickers.filter((entry) => entry.asset);
  assert.deepEqual(ready.map(({ id }) => id).sort(), [...tributeIds].sort());
  const sql = readFileSync("db/004_tribute_stickers.sql", "utf8");
  assert.deepEqual(
    Array.from(sql.matchAll(/'([^']+)'/g), ([, id]) => id).sort(),
    [...stickerIds].sort(),
  );
  assert.deepEqual(
    readdirSync("public/beach/stickers").filter((file) => file.endsWith(".webp")).sort(),
    stickerIds.map((id) => id + ".webp").sort(),
  );
  for (const entry of manifest.stickers) {
    assert.ok(entry.references.length);
    assert.equal(entry.publicationApproved, Boolean(entry.asset));
    if (!entry.asset) continue;
    assert.equal(entry.asset, `public/beach/stickers/${entry.id}.webp`);
    const meta = await sharp(entry.asset).metadata();
    assert.deepEqual(
      [meta.format, meta.width, meta.height, meta.hasAlpha],
      ["webp", 256, 256, true],
    );
    assert.equal((await sharp(entry.asset).stats()).isOpaque, false);
  }
});

test("adult scale follows measured sloping depth lines and stays within its limits", () => {
  const west = { x: 0, y: 515 / 1024 };
  const east = { x: 1, y: 442 / 1024 };
  assert.equal(beachDepth(west), beachDepth(east));
  assert.equal(depthOrder(west), depthOrder(east));
  assert.ok(beachDepth({ ...west, x: 1 }) > beachDepth(west));
  for (const x of [0, .25, .5, .75, 1]) {
    let previous = 0;
    for (let y = 0; y <= 1; y += .001) {
      const width = stickerWidth({ x, y }, "capita");
      assert.ok(width >= previous);
      if (previous > 0) assert.ok(width - previous < .001);
      previous = width;
    }
  }
  assert.equal(adultWidth(0), perspectiveLimits.min);
  assert.equal(adultWidth(5), perspectiveLimits.max);
  assert.equal(adultWidth(2, { min: .10, max: .12 }), .10);
});

test("pose, body size and airborne lift share a ground reference", () => {
  const ground = { x: .3, y: .52 };
  assert.ok(stickerProfile("hinata").anchor.y > 1);
  assert.ok(stickerProfile("milho").anchor.y < stickerProfile("capita").anchor.y);
  assert.equal(stickerProfile("crawl").shadowOpacity, 0);
  assert.equal(stickerProfile("krillin").shadowOpacity, 0);
  assert.ok(stickerWidth(ground, "siri") < stickerWidth(ground, "alison") / 3);
  assert.deepEqual(feet({ x: .31, y: .45, zone_id: "quadras", sticker_id: "capita" }),
    { x: .31, y: .45 + .068 * 1.5 * (250 / 256 - .5) });
});

test("a portable chair is suggested beside furniture and a cross-legged guest can take the seat", () => {
  for (const zone of ["torcida", "cadeiras"] as const) {
    const seated = suggestSpot(zone, [], "milho");
    const portable = suggestSpot(zone, [], "roshi");
    assert.notDeepEqual(seated, portable);
    assert.equal(zoneAt(portable), zone);
    assert.deepEqual(destination(portable, [], true, "roshi"), portable);
    assert.deepEqual(destination(seated, [], false, "roshi"), seated);
  }
});

test("depth ordering crosses the net at the ground point, even for an airborne player", () => {
  const net = depthOrder({ x: 258 / 1536, y: 497 / 1024 });
  assert.ok(depthOrder({ x: 170 / 1536, y: 462 / 1024 }) < net);
  assert.ok(depthOrder({ x: 190 / 1536, y: 592 / 1024 }) > net);
});

test("the full catalog still finds distinct suggested places as the beach fills", () => {
  const points: Point[] = [];
  for (const id of stickerIds) {
    const next = suggestSpot(stickers[id].zone, points, id);
    assert.ok(points.every((point) => point.x !== next.x || point.y !== next.y));
    points.push(next);
  }
});
