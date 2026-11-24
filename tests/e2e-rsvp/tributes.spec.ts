import { expect, test } from "@playwright/test";
import { stickerCollections } from "../../lib/stickers";
import { tributes } from "../../lib/tribute-stickers";

const mock = "http://127.0.0.1:54326";
test("guest browses the tribute collections, places a sticker and restores it", async ({
  page,
  request,
}) => {
  await request.post(mock + "/__reset");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Continuar com Google" }).click();
  await page.getByRole("button", { name: "Salvar minha resposta" }).click();
  await page.getByRole("button", { name: "Escolher figurinha" }).click();
  const album = page.getByRole("dialog");
  await album.getByRole("button", { name: "Todos", exact: true }).click();
  await expect(album.locator(".album-grid button")).toHaveCount(78);
  for (const collection of stickerCollections.slice(2)) {
    await album
      .getByRole("button", { name: collection.name, exact: true })
      .click();
    await expect(album.locator(".album-grid button")).toHaveCount(
      collection.ids.length,
    );
    const images = album.locator(".album-grid img");
    const widths = await images.evaluateAll(async (els) =>
      Promise.all(
        els.map(async (el) => {
          const img = el as HTMLImageElement;
          await img.decode();
          return img.naturalWidth;
        }),
      ),
    );
    expect(widths.every((w) => w === 256)).toBe(true);
  }
  const id = "hinata";
  const sticker = tributes[id];
  await album.getByRole("button", { name: "Haikyu!!", exact: true }).click();
  await album
    .getByRole("button", { name: sticker.name, exact: true })
    .click();
  await expect(album.locator(".album-preview img")).toHaveAttribute(
    "alt",
    sticker.description,
  );
  expect(await album.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await album.getByRole("button", { name: "Usar esta figurinha" }).click();
  await page
    .getByRole("button", { name: `Mover ${sticker.name} com as setas` })
    .press("ArrowRight");
  await page.getByRole("button", { name: "Guardar lugar" }).click();
  await expect(page.locator(".beach-feedback")).toHaveText("Lugar guardado!");
  await page.reload();
  const own = page.getByRole("button", { name: "Figurinha de Maria" });
  await expect(own.locator("img")).toHaveAttribute(
    "src",
    `/beach/stickers/${id}.webp`,
  );
});
