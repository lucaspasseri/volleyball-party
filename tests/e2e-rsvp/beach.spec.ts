import { test, expect } from "@playwright/test";
import { zones } from "../../lib/beach";

const mock = "http://127.0.0.1:54326";

test("exploration, consent, gallery, intentional placement, reload and reposition", async ({
  page,
  request,
  browser,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await request.post(mock + "/__reset");
  await request.post(mock + "/__control", { data: { populateBeach: true } });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#expectativas");
  const art = page.locator(".beach-art");
  await art.scrollIntoViewIfNeeded();
  await expect
    .poll(() => art.evaluate((el: HTMLImageElement) => el.naturalWidth))
    .toBeGreaterThan(0);
  const capture = {
    style: ".skip-link:not(:focus), nextjs-portal { display: none !important }",
    scale: "css" as const,
  };
  const scene = page.locator(".beach-experience");
  await expect(scene.locator(".placed-sticker")).toHaveCount(4);
  await page
    .locator("#expectativas > .container")
    .screenshot({ ...capture, path: info.outputPath("populated.png") });
  await scene.getByRole("button", { name: "Gazebo", exact: true }).click();
  await expect(scene.locator(".beach-discovery")).toContainText("Na sombra");
  await scene.getByRole("button", { name: "Figurinha de Bia" }).click();
  await expect(scene.locator(".beach-discovery")).toContainText("Surfista");
  await scene.getByRole("button", { name: "Ver figurinhas" }).click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Usar esta figurinha" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Fechar álbum" }).click();
  await page.getByRole("button", { name: "Continuar com Google" }).click();
  await page.getByLabel(/Quero aparecer na lista/).check();
  await page.getByRole("button", { name: "Salvar minha resposta" }).click();
  await page
    .getByRole("link", { name: "Escolher meu lugar na praia!" })
    .click();
  await scene.getByRole("button", { name: "Escolher figurinha" }).click();
  await page
    .getByRole("button", { name: "Siri do saque", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").locator(".album-preview"),
  ).toContainText("Siri do saque");
  await page
    .getByRole("dialog")
    .screenshot({ ...capture, path: info.outputPath("album.png") });
  await page.getByRole("button", { name: "Usar esta figurinha" }).click();
  await scene.getByRole("button", { name: "Gazebo", exact: true }).click();
  await scene.getByRole("button", { name: "Aumentar zoom" }).click();
  await scene
    .getByRole("button", { name: "Centralizar minha figurinha" })
    .click();
  const draft = scene.locator(".draft-sticker");
  await draft.scrollIntoViewIfNeeded();
  const box = (await draft.boundingBox())!;
  const stage = (await scene.locator(".beach-stage").boundingBox())!;
  const start = { x: box.x + box.width * 0.42, y: box.y + box.height * 0.6 };
  const delta = { x: -49, y: 43 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + delta.x, start.y + delta.y, { steps: 12 });
  await page.screenshot({ ...capture, path: info.outputPath("dragging.png") });
  await page.mouse.up();
  await expect
    .poll(
      async () =>
        Object.keys(
          (await (await request.get(mock + "/__state")).json()).placements,
        ).length,
    )
    .toBe(4);
  await scene.getByRole("button", { name: "Guardar lugar" }).click();
  await expect(scene.locator(".beach-feedback")).toHaveText("Lugar guardado!");
  const owner = "guest-test-maria";
  const saved = (await (await request.get(mock + "/__state")).json())
    .placements[owner];
  expect(saved.x).toBeCloseTo(zones.gazebo.x + delta.x / stage.width, 2);
  expect(saved.y).toBeCloseTo(zones.gazebo.y + delta.y / stage.height, 2);
  await page.reload();
  const own = scene.getByRole("button", { name: "Figurinha de Maria" });
  await expect(own).toBeVisible();
  await expect(own.locator("img")).toHaveAttribute(
    "src",
    "/beach/stickers/siri.webp",
  );
  await scene.getByRole("button", { name: "Editar meu lugar" }).click();
  await page.getByRole("button", { name: "Coco gelado", exact: true }).click();
  await page.getByRole("button", { name: "Usar esta figurinha" }).click();
  await scene.getByRole("button", { name: "Cadeiras", exact: true }).click();
  const camera = scene.locator(".beach-camera");
  await camera.scrollIntoViewIfNeeded();
  const rendered = (await scene.locator(".beach-stage").boundingBox())!;
  const windowBox = (await camera.boundingBox())!;
  const tap = {
    x: Math.round(windowBox.x + windowBox.width * 0.46),
    y: Math.round(windowBox.y + windowBox.height * 0.71),
  };
  if (info.project.name === "mobile") await page.touchscreen.tap(tap.x, tap.y);
  else await page.mouse.click(tap.x, tap.y);
  await draft.press("ArrowLeft");
  await request.post(mock + "/__control", { data: { failSave: true } });
  await scene.getByRole("button", { name: "Guardar lugar" }).click();
  await expect(scene.locator(".beach-feedback")).toContainText("Tente de novo");
  await expect(draft).toBeVisible();
  await request.post(mock + "/__control", { data: { failSave: false } });
  await scene.getByRole("button", { name: "Guardar lugar" }).click();
  await expect(own.locator("img")).toHaveAttribute(
    "src",
    "/beach/stickers/coco.webp",
  );
  const moved = (await (await request.get(mock + "/__state")).json())
    .placements[owner];
  expect(moved.id).toBe(saved.id);
  expect(moved.x).toBeCloseTo((tap.x - rendered.x) / rendered.width - 0.008, 2);
  expect(moved.y).toBeCloseTo((tap.y - rendered.y) / rendered.height, 2);
  const visitor = await browser.newPage();
  try {
    await visitor.goto("http://localhost:3101/#expectativas");
    await expect(
      visitor.getByRole("button", { name: "Figurinha de Maria" }),
    ).toBeVisible();
    await expect(
      visitor.getByRole("button", { name: "Editar meu lugar" }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Editar minha resposta" }).click();
    await page.getByRole("radio", { name: "Talvez", exact: true }).check();
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(
      scene.getByRole("button", { name: "Editar meu lugar" }),
    ).toHaveCount(0);
    await visitor.reload();
    await expect(
      visitor.getByRole("button", { name: "Figurinha de Maria" }),
    ).toHaveCount(0);
  } finally {
    await visitor.close();
  }
  expect(errors).toEqual([]);
});
