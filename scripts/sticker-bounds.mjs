// Refresh the scene hit areas after adding or replacing a 256 × 256 sticker.
import { readdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const directory = "public/beach/stickers";
const lines = [];
for (const file of (await readdir(directory))
  .filter((f) => f.endsWith(".webp"))
  .sort()) {
  const { data, info } = await sharp(`${directory}/${file}`)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.width !== 256 || info.height !== 256)
    throw new Error(`Unexpected dimensions for ${file}`);
  let left = info.width,
    top = info.height,
    right = 0,
    bottom = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] <= 96) continue;
      left = Math.min(x, left);
      top = Math.min(y, top);
      right = Math.max(x + 1, right);
      bottom = Math.max(y + 1, bottom);
    }
  }
  lines.push(
    `  "${file.slice(0, -5)}": [${left}, ${top}, ${right}, ${bottom}]`,
  );
}
await writeFile("lib/sticker-bounds.json", "{\n" + lines.join(",\n") + "\n}\n");
