import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import sharp from "sharp";
import {
  characterIds,
  defaultFace,
  faceSchema,
  photoFrame,
  template,
} from "../lib/characters";
import {
  feet,
  placementAt,
  placementSchema,
  suggestSpot,
  zoneIds,
} from "../lib/beach";
import { stickers } from "../lib/stickers";
import { stickerProfile, stickerWidth } from "../lib/beach-perspective";
import {
  importProfilePhoto,
  normalizePhoto,
  maxPhotoBytes,
} from "../lib/character-photo";

const character = {
  aspect: 1,
  photoId: "550e8400-e29b-41d4-a716-446655440000",
  face: defaultFace,
};
test("all 20 facial openings and grounds lie within their transparent WebP; every zone restores the same ground", async () => {
  assert.equal(characterIds.length, 20);
  for (const id of characterIds) {
    const pose = template(id);
    assert.ok(
      zoneIds.includes(pose.zone) && Object.hasOwn(stickers, pose.reference),
    );
    const { width, height, hasAlpha } = await sharp(
      "public" + pose.src,
    ).metadata();
    assert.deepEqual(
      [width, height, hasAlpha],
      [pose.intrinsicWidth, pose.intrinsicHeight, true],
    );
    assert.ok(
      pose.width > 0.09 &&
        pose.height > 0.1 &&
        pose.x - pose.width / 2 > 0 &&
        pose.x + pose.width / 2 < 1,
    );
    assert.ok(
      pose.y > pose.height / 2 &&
        pose.y + pose.height / 2 < pose.ground.y &&
        pose.ground.y <= 1,
    );
    assert.match(pose.maskPath, /^M[\d .L]+Z$/);
    assert.ok(Math.abs(pose.rotation) <= 45);
    const ground = stickerProfile(id).anchor;
    assert.ok(ground.y >= pose.ground.y && ground.x === pose.ground.x);
    assert.ok(
      stickerWidth({ x: 0.4, y: 0.19 }, id) <
        stickerWidth({ x: 0.4, y: 0.9 }, id),
    );
    for (const zone of zoneIds) {
      const p = suggestSpot(zone, [], id);
      const placement = { ...placementAt(p, id), character };
      assert.ok(placementSchema.safeParse(placement).success);
      assert.ok(Math.abs(feet(placement).y - p.y) < 1e-10);
    }
  }
});
test("compositions require a recognized body, an asset id and bounded finite face controls", () => {
  const p = {
    ...placementAt(suggestSpot("quadras", []), "meu-capita"),
    character,
  };
  for (const changes of [
    { sticker_id: "meu-outro" },
    { sticker_id: "capita" },
    { character: undefined },
    { character: { ...character, photoId: "https://example.com/img" } },
  ])
    assert.equal(
      placementSchema.safeParse({ ...p, ...changes }).success,
      false,
    );
  for (const changes of [
    { rotation: 46 },
    { zoom: 0.9 },
    { zoom: 5 },
    { x: Infinity },
    { y: -1.01 },
    { extra: 1 },
  ])
    assert.equal(
      faceSchema.safeParse({ ...defaultFace, ...changes }).success,
      false,
    );
});
test("trusted session avatar uses a bounded, redirect-free fetch; upload and Google produce the same sanitized image", async () => {
  const portrait = await readFile("tests/fixtures/portraits/sol.jpg");
  const avatar = "https://lh3.googleusercontent.com/example";
  const image = await importProfilePhoto(avatar, async (url, options) => {
    assert.equal(url, avatar);
    assert.equal(options?.redirect, "error");
    assert.equal(options?.credentials, "omit");
    return new Response(new Uint8Array(portrait), {
      headers: { "content-type": "image/jpeg" },
    });
  });
  assert.deepEqual(image, await normalizePhoto(portrait, "image/jpeg"));
  const meta = await sharp(image).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(meta.exif, undefined);
  let unsafeRequests = 0;
  for (const url of [
    null,
    "http://localhost/test",
    "https://lh3.googleusercontent.com.evil.example/photo",
    "https://lh3.googleusercontent.com:333/photo",
  ])
    await assert.rejects(
      importProfilePhoto(url, () => {
        unsafeRequests++;
        return Promise.resolve(new Response(null, { status: 404 }));
      }),
      /enviar uma imagem/,
    );
  assert.equal(unsafeRequests, 0);
  await assert.rejects(
    importProfilePhoto(avatar, async () => new Response(null, { status: 404 })),
    /indisponível/,
  );
});
test("photo intake rejects spoofed content, extreme dimensions and oversized uploads; preserves aspect ratio", async () => {
  const png = (width: number, height: number) =>
    sharp({ create: { width, height, channels: 3, background: "#fed" } })
      .png()
      .toBuffer();
  for (const [input, mime] of [
    [await png(48, 50), "image/jpeg"],
    [await png(40, 100), "image/png"],
    [await png(8200, 48), "image/png"],
    [Buffer.from("<svg/>"), "image/svg+xml"],
    [Buffer.alloc(maxPhotoBytes + 1), "image/png"],
  ] as const)
    await assert.rejects(normalizePhoto(input, mime));
  const { width, height } = await sharp(
    await normalizePhoto(await png(600, 900), "image/png"),
  ).metadata();
  assert.deepEqual([width, height], [341, 512]);
});

test("portrait and landscape crops cover the entire rotated mask, even at maximum pan", () => {
  for (const aspect of [0.35, 1, 2.8]) {
    for (const rotation of [-45, 0, 45]) {
      for (const pan of [-1, 0, 1]) {
        const face = { zoom: 1, x: pan, y: -pan, rotation };
        const frame = photoFrame(44, 60, aspect, 15, face);
        assert.ok(Math.abs(frame.width / frame.height - aspect) < 1e-9);
        const a = (-(rotation + 15) * Math.PI) / 180;
        for (const x of [-22, 22])
          for (const y of [-30, 30]) {
            const u = x * Math.cos(a) - y * Math.sin(a);
            const v = x * Math.sin(a) + y * Math.cos(a);
            assert.ok(u >= frame.x - 1e-9 && u <= frame.x + frame.width + 1e-9);
            assert.ok(
              v >= frame.y - 1e-9 && v <= frame.y + frame.height + 1e-9,
            );
          }
      }
    }
  }
});
