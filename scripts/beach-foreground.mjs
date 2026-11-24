// Rebuild registered foreground fragments after changing the production painting.
import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const paint = "public/beach/copacabana.webp";
const { data, info } = await sharp(paint)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const patches = [];
function patch(id, box, contact, silhouette, mesh) {
  patches.push({ id, box, contact, silhouette, mesh });
}
const path = (d) => `<path fill="white" d="${d}"/>`;
const line = (d, width) =>
  `<path fill="none" stroke="white" stroke-linejoin="round" stroke-width="${width}" d="${d}"/>`;

patch(
  "west-net",
  [23, 299, 473, 220],
  [258, 497],
  path("M33 319l10 1-7 197-11-1z M484 301l10 0-1 175-10-1z") +
    line(
      "M38 338L55 349Q180 378 372 348Q436 336 469 325L489 313 M31 437L53 420Q180 427 316 412L470 392L490 402 M54 349L53 420 M471 325L470 392",
      4,
    ),
  "M53 348Q180 377 372 348Q436 336 471 323L471 394Q226 433 52 422Z",
);
patch(
  "east-net",
  [515, 305, 378, 176],
  [704, 474],
  path("M520 315h9l-2 163h-9z M880 308h10l-2 165h-9z") +
    line(
      "M524 326L539 337Q696 357 868 326L883 317 M523 401L539 392Q694 402 868 385L883 392 M539 337V392 M869 326V385",
      4,
    ),
  "M538 335Q696 357 869 324V386Q694 404 538 394Z",
);
patch(
  "canopy",
  [1102, 121, 378, 133],
  [1264, 436],
  path(
    "M1105 208Q1200 173 1297 124Q1380 175 1476 207L1477 241L1451 236L1422 248Q1301 224 1197 246L1160 237L1106 249Z",
  ) +
    line(
      "M1108 250L1155 236L1196 250L1247 236L1301 249L1350 235L1419 250L1450 235L1474 243",
      3,
    ),
);
patch(
  "canopy-left-post",
  [1102, 245, 14, 199],
  [1109, 440],
  path("M1105 246h7v191l3 2-2 3h-10l-1-4 3-1z"),
);
patch(
  "canopy-right-post",
  [1414, 243, 13, 168],
  [1420, 412],
  path("M1417 244h6v165h-7z"),
);
patch(
  "coolers",
  [1335, 379, 168, 96],
  [1420, 469],
  path(
    "M1339 416l18-10 10 0-2-13 12-1-1 15h5l-1-13 5-1 5-14 2 1-4 13 10-1-2 16 16 1 11-5 69 5 7 5 1 43-6 10-13 5-63-5-6-3-11 3-61-5z",
  ),
);
patch(
  "stone-bench",
  [229, 832, 344, 118],
  [411, 850],
  path(
    "M232 852l44-18 294 26-6 42-1 46-25-3v-45l-237-24v29l-26 12-27-3v-44l-16-2z",
  ),
);
for (const [id, x, y] of [
  ["left-chair", 0, 0],
  ["right-chair", 235, 20],
]) {
  patch(
    id + "-seat",
    [1033 + x, 701 + y, 171, 193],
    [1116 + x, 809 + y],
    `<g transform="translate(${x} ${y})">` +
      path(
        "M1045 822l38-11 29-98q1-11 11-10l71 5q9 1 7 12l-30 102-25 12-99-6z",
      ) +
      line(
        "M1050 826l-12 47q-1 5 4 5l92 12q7 0 9-6l23-88 M1083 823l10 32 100 12q5 1 4-5l-20-66",
        4,
      ) +
      "</g>",
  );
  // The foreground arm and rail can pass in front of a guest on the fabric.
  patch(
    id,
    [1033 + x, 777 + y, 165, 119],
    [1120 + x, 881 + y],
    `<g transform="translate(${x} ${y})">` +
      path("M1150 786l37-7q6-1 5 5l-3 4-37 8-4-3z") +
      line("M1168 791l-25 93q-1 7-10 6l-90-12q-7-1-6-8l11-43", 4) +
      "</g>",
  );
}
patch(
  "parasol",
  [1131, 560, 311, 300],
  [1261, 854],
  path(
    "M1134 641l8-15q53-45 136-57l10-1q2-8 9-2l3 4q81 19 132 63l5 21-12 8-17-4-11 9-30-2-10 7-31 0-10-6-12 7-34-1-10-8-13 6-32-4-11-7-10 3-24-8-4-7-13 5z",
  ) + line("M1280 667l-19 186", 6),
);

// The three painted walkers cross the seating area in projection. Traces are
// local to a 520 × 380 detail of the promenade, including gaps between limbs.
function walker(id, box, contact, outline) {
  patch(
    id,
    box,
    contact,
    '<g transform="translate(504 634)">' + path(outline) + "</g>",
  );
}
walker(
  "walker-left",
  [516, 652, 186, 348],
  [600, 991],
  "M92 24Q116 13 135 38L137 51Q136 67 117 73L117 80Q139 85 148 109L159 133L170 132Q183 156 184 177Q183 194 155 200L166 236L193 269Q187 282 168 286L169 302L183 331Q190 331 192 343L165 356L149 362L142 358L146 352L162 338L140 300L136 294Q111 302 89 295L78 314L68 341L69 356L54 364L22 365L14 361L18 355L43 346L52 332L64 293L54 292L64 256L67 222L66 178L45 181L39 199L35 202L38 210L34 215L25 208L24 197L34 180L48 158L63 132Q59 114 73 99L91 85L92 74L82 69L78 59L78 52L83 44L82 38L91 32Z",
);
walker(
  "walker-hat",
  [737, 637, 158, 365],
  [820, 991],
  "M289 40L299 30L294 19Q305 7 328 5L337 21L350 18L350 22L336 29L344 43L340 48L342 53L335 62L330 63L329 69L341 75L345 107Q360 108 355 117L345 126L352 132L356 155L357 176L363 193L359 207L349 214L346 210L351 197L346 183L342 163L339 197L333 210L338 241L334 248L337 275L341 303L350 333L360 344L387 354L389 360L381 365L357 366L337 361L338 345L331 313L315 277L312 250L305 253L303 266L288 281L267 317L266 329L284 339L290 344L289 349L281 351L258 345L237 338L239 329L246 318L257 291L265 269L278 245L277 239L282 207L273 189L274 168L261 170L244 166L240 155L241 127L247 99L259 93L263 81L276 69L299 61L307 53L302 43Z",
);
walker(
  "walker-white",
  [871, 659, 142, 332],
  [940, 974],
  "M401 32Q421 20 438 31Q454 42 454 59L452 75L445 83Q460 83 462 101L469 137L481 160L491 169L499 190L496 200Q502 215 483 225Q466 234 455 219L453 210L446 212L453 234L458 258L466 292L476 323L484 335L502 337L507 341L502 348L479 354L468 352L464 339L449 308L439 285L432 260L427 252L417 269L402 293L390 320L395 328L413 335L418 340L414 346L400 345L377 337L371 332L374 324L381 313L389 281L405 248L410 215L400 213L394 190L398 162L406 145L408 130L406 116L399 130L391 153L383 183L386 193L389 207L385 218L380 217L374 210L372 202L375 187L377 156L382 127L387 102L378 101L382 93L375 91L382 80L381 68L389 61L391 45Z",
);

// Pack the trimmed fragments together. Mesh alpha follows the painted thread
// contrast against the local sand, leaving each opening transparent.
const layers = [];
const regions = [];
const atlasWidth = 512;
let top = 0;
for (const {
  id,
  box: [x, y, w, h],
  contact,
  silhouette,
  mesh,
} of patches) {
  const mask = async (shapes) =>
    sharp(
      Buffer.from(
        `<svg width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}">${shapes}</svg>`,
      ),
    )
      .ensureAlpha()
      .raw()
      .toBuffer();
  const solid = await mask(silhouette);
  const net = mesh && (await mask(path(mesh)));
  const pixels = Buffer.alloc(w * h * 4);
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const target = (row * w + col) * 4;
      const src = ((row + y) * info.width + x + col) * 3;
      let alpha = solid[target + 3];
      if (net && net[target + 3]) {
        const red = data[src];
        let sand = red;
        for (const dy of [-3, 0, 3])
          for (const dx of [-3, 0, 3])
            sand = Math.max(sand, data[src + (dy * info.width + dx) * 3]);
        alpha = Math.max(alpha, Math.min(255, Math.max(0, sand - red - 7) * 3));
      }
      data.copy(pixels, target, src, src + 3);
      pixels[target + 3] = alpha;
    }
  }
  layers.push({
    input: await sharp(pixels, { raw: { width: w, height: h, channels: 4 } })
      .png()
      .toBuffer(),
    left: 0,
    top,
  });
  regions.push({ id, x, y, w, h, top, contact });
  top += h + 2;
}
await sharp({
  create: {
    width: atlasWidth,
    height: top,
    channels: 4,
    background: "#00000000",
  },
})
  .composite(layers)
  .webp({ quality: 90, alphaQuality: 100 })
  .toFile("public/beach/foreground.webp");
await writeFile(
  "lib/beach-foreground.json",
  JSON.stringify({ width: atlasWidth, height: top, regions }, null, 2) + "\n",
);
