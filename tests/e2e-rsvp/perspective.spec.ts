import { expect, test } from "@playwright/test";

test("perspective composition across the beach", async ({
  page,
  request,
}, info) => {
  const mock = "http://127.0.0.1:54326";
  await request.post(mock + "/__reset");
  await request.post(mock + "/__control", {
    data: { populateBeach: "perspective" },
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#expectativas");
  const camera = page.locator(".beach-camera");
  await expect(camera.locator(".placed-sticker")).toHaveCount(20);
  await camera.scrollIntoViewIfNeeded();
  await camera
    .locator("img")
    .evaluateAll((imgs) =>
      Promise.all(imgs.map((img) => (img as HTMLImageElement).decode())),
    );
  await camera.locator(".beach-foreground").first().waitFor();
  await page.evaluate(async () => {
    const atlas = new Image();
    atlas.src = "/beach/foreground.webp";
    await atlas.decode();
  });
  await camera.screenshot({
    scale: "css",
    style: ".skip-link:not(:focus), nextjs-portal { display: none !important }",
    path: info.outputPath("perspective.png"),
  });
  const captains = camera.locator(".beach-sticker-anchor").filter({
    has: page.locator('img[src="/beach/stickers/capita.webp"]'),
  });
  const bodies = await captains.evaluateAll((nodes) =>
    nodes
      .map((node) => ({
        order: Number(getComputedStyle(node).zIndex),
        width: node.getBoundingClientRect().width,
      }))
      .sort((a, b) => a.order - b.order),
  );
  expect(bodies).toHaveLength(3);
  expect(bodies[0].width).toBeLessThan(bodies[1].width);
  expect(bodies[1].width).toBeLessThan(bodies[2].width);
  const behindNet = camera.locator(".placed-sticker").filter({
    has: page.locator('img[src="/beach/stickers/hinata.webp"]'),
  });
  await behindNet.click();
  await expect(behindNet).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "Fechar detalhes" }).click();
});
