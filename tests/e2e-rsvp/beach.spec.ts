import { test, expect } from "@playwright/test";
import { stickerProfile, stickerWidth } from "../../lib/beach-perspective";
import { feet, zones } from "../../lib/beach";
import { stickerCollections, stickerIds, stickers } from "../../lib/stickers";

const mock = "http://127.0.0.1:54326";

test("a full beach renders all seven collections within the sticker transfer budget", async ({
  page,
  request,
}, info) => {
  await request.post(mock + "/__reset");
  await request.post(mock + "/__control", {
    data: { populateBeach: "crowded" },
  });
  await page.goto("/#expectativas");
  const map = page.locator(".beach-map");
  const images = map.locator(".placed-sticker img");
  await expect(images).toHaveCount(stickerIds.length);
  const bytes = await images.evaluateAll(async (elements) => {
    await Promise.all(elements.map((el) => (el as HTMLImageElement).decode()));
    return performance
      .getEntriesByType("resource")
      .filter((entry) =>
        new URL(entry.name).pathname.startsWith("/beach/stickers/"),
      )
      .reduce(
        (sum, entry) =>
          sum + (entry as PerformanceResourceTiming).encodedBodySize,
        0,
      );
  });
  await map.locator(".beach-camera").scrollIntoViewIfNeeded();
  await map.locator(".beach-art").evaluate((img: HTMLImageElement) => img.decode());
  await map.locator(".beach-foreground").first().waitFor();
  await page.evaluate(async () => {
    const atlas = new Image();
    atlas.src = "/beach/foreground.webp";
    await atlas.decode();
  });
  await map.locator(".beach-camera").screenshot({
    scale: "css",
    style: ".skip-link:not(:focus), nextjs-portal { display: none !important }",
    path: info.outputPath("crowded.png"),
  });
  expect(bytes).toBeGreaterThan(0);
  expect(bytes).toBeLessThan(2 * 1024 * 1024);
  await map.getByRole("button", { name: "Aumentar zoom" }).click();
  await map.getByRole("button", { name: "Gazebo", exact: true }).click();
  await expect(map.locator(".beach-discovery")).toContainText("Na sombra");
});

test("exploration, consent, gallery, intentional placement, reload and reposition", async ({
  page,
  request,
  browser,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await request.post(mock + "/__reset");
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
  const map = scene.locator(".beach-map");
  await expect(scene.locator(".placed-sticker")).toHaveCount(0);
  await map.screenshot({ ...capture, path: info.outputPath("empty.png") });
  await request.post(mock + "/__control", { data: { populateBeach: true } });
  await page.reload();
  await expect(scene.locator(".placed-sticker")).toHaveCount(6);
  await map.screenshot({ ...capture, path: info.outputPath("populated.png") });
  await scene.getByRole("button", { name: "Gazebo", exact: true }).click();
  await expect(scene.locator(".beach-discovery")).toContainText("Na sombra");
  await scene.getByRole("button", { name: "Figurinha de Bia" }).click();
  await expect(scene.locator(".beach-discovery")).toContainText("Surfista");
  await scene.getByRole("button", { name: "Ver figurinhas" }).click();
  const album = page.getByRole("dialog");
  await expect(album).toBeVisible();
  expect(await album.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  for (const collection of stickerCollections) {
    await album
      .getByRole("button", { name: collection.name, exact: true })
      .click();
    if (collection.showAll) {
      await expect(
        album
          .getByRole("group", { name: "Figurinhas · Todas" })
          .getByRole("button"),
      ).toHaveCount(collection.ids.length);
    }
    for (const group of collection.groups) {
      await album
        .getByRole("button", { name: group.name, exact: true })
        .click();
      const grid = album.getByRole("group", {
        name: `Figurinhas · ${group.name}`,
      });
      await expect(grid.getByRole("button")).toHaveCount(group.ids.length);
      for (const id of group.ids) {
        const tile = grid.getByRole("button", {
          name: stickers[id].name,
          exact: true,
        });
        await expect
          .poll(() =>
            tile
              .locator("img")
              .evaluate((img: HTMLImageElement) => img.naturalWidth),
          )
          .toBe(256);
      }
    }
  }
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
  await album.getByRole("button", { name: "Cultura pop", exact: true }).click();
  await album.getByRole("button", { name: "Música", exact: true }).click();
  await album
    .getByRole("button", { name: "DJ do isopor", exact: true })
    .click();
  await album.getByRole("button", { name: "Todas", exact: true }).click();
  await expect(album.locator(".album-preview")).toContainText("DJ do isopor");
  await album.screenshot({
    ...capture,
    path: info.outputPath("cultura-pop.png"),
  });
  await page.getByRole("button", { name: "Usar esta figurinha" }).click();
  await scene.getByRole("button", { name: "Gazebo", exact: true }).click();
  const zoomIn = scene.getByRole("button", { name: "Aumentar zoom" });
  if (await zoomIn.isEnabled()) await zoomIn.click();
  await scene
    .getByRole("button", { name: "Centralizar minha figurinha" })
    .click();
  if (info.project.name === "desktop")
    await page.emulateMedia({ reducedMotion: "no-preference" });
  const draft = scene.locator(".draft-sticker");
  await draft.scrollIntoViewIfNeeded();
  const box = (await draft.boundingBox())!;
  const stage = (await scene.locator(".beach-stage").boundingBox())!;
  const start = { x: box.x + box.width * 0.42, y: box.y + box.height * 0.6 };
  // The first gazebo spot is occupied by Bia. Drag from the second to the fourth
  // with an off-center grip, releasing slightly beside the target to exercise snap.
  const from = zones.gazebo.anchors[1],
    to = zones.gazebo.anchors[3];
  const end = {
    x: start.x + (to.x - from.x + 0.006) * stage.width,
    y: start.y + (to.y - from.y + 0.004) * stage.height,
  };
  const touch =
    info.project.name === "mobile"
      ? await page.context().newCDPSession(page)
      : null;
  if (touch) {
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [start],
    });
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [end],
    });
  } else {
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 12 });
  }
  await expect(scene.locator(".beach-snap-target")).toBeVisible();
  await page.screenshot({ ...capture, path: info.outputPath("dragging.png") });
  if (touch)
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  else await page.mouse.up();
  await expect(scene.locator(".beach-snap-target")).toHaveCount(0);
  await expect
    .poll(async () => {
      const anchor = await scene
        .locator(".draft-anchor")
        .evaluate((el) => (el as HTMLElement).style.left);
      return parseFloat(anchor) / 100;
    })
    .toBeCloseTo(to.x, 4);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(
      async () =>
        Object.keys(
          (await (await request.get(mock + "/__state")).json()).placements,
        ).length,
    )
    .toBe(6);
  await scene.getByRole("button", { name: "Guardar lugar" }).click();
  await expect(scene.locator(".beach-feedback")).toHaveText("Lugar guardado!");
  const owner = "guest-test-maria";
  const saved = (await (await request.get(mock + "/__state")).json())
    .placements[owner];
  expect(feet(saved).x).toBeCloseTo(to.x, 5);
  expect(feet(saved).y).toBeCloseTo(to.y, 5);
  await page.reload();
  const own = scene.getByRole("button", { name: "Figurinha de Maria" });
  await expect(own).toBeVisible();
  await expect(own.locator("img")).toHaveAttribute(
    "src",
    "/beach/stickers/dj-do-isopor.webp",
  );
  const viewport = page.viewportSize()!;
  for (const width of [viewport.width === 390 ? 900 : 390, viewport.width]) {
    await page.setViewportSize({ width, height: viewport.height });
    // Read both boxes in the same frame as the mobile viewport reflows.
    const actual = await own.evaluate((button, anchor) => {
      const artBox = button
        .closest(".beach-stage")!
        .querySelector(".beach-art")!
        .getBoundingClientRect();
      const placed = button.getBoundingClientRect();
      return {
        x: (placed.x + placed.width * anchor.x - artBox.x) / artBox.width,
        y: (placed.y + placed.height * anchor.y - artBox.y) / artBox.height,
        width: placed.width / artBox.width,
      };
    }, stickerProfile(saved.sticker_id).anchor);
    expect(actual.x).toBeCloseTo(feet(saved).x, 3);
    expect(actual.y).toBeCloseTo(feet(saved).y, 3);
    expect(actual.width).toBeCloseTo(stickerWidth(feet(saved), saved.sticker_id), 3);
  }
  await scene.getByRole("button", { name: "Editar meu lugar" }).click();
  await expect(
    album.getByRole("button", { name: "Música", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(album.locator(".album-preview")).toContainText("DJ do isopor");
  await album
    .getByRole("button", { name: "Turma da praia", exact: true })
    .click();
  await album.getByRole("button", { name: "Praia e mar", exact: true }).click();
  await album.getByRole("button", { name: "De braçada", exact: true }).click();
  await expect(album.locator(".album-preview")).toContainText("De braçada");
  await album.screenshot({ ...capture, path: info.outputPath("album.png") });
  await page.getByRole("button", { name: "Usar esta figurinha" }).click();
  const groundAfterSwap = await scene
    .locator(".draft-anchor")
    .evaluate((el) => parseFloat((el as HTMLElement).style.top) / 100);
  expect(groundAfterSwap).toBeCloseTo(feet(saved).y, 4);
  await scene.getByRole("button", { name: "Mar", exact: true }).click();
  await scene.getByRole("button", { name: "Restaurar vista inicial" }).click();
  const camera = scene.locator(".beach-camera");
  await camera.scrollIntoViewIfNeeded();
  const rendered = (await scene.locator(".beach-stage").boundingBox())!;
  const windowBox = (await camera.boundingBox())!;
  const tap = {
    x: Math.round(windowBox.x + windowBox.width * 0.55),
    y: Math.round(windowBox.y + windowBox.height * 0.18),
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
    "/beach/stickers/crawl.webp",
  );
  const moved = (await (await request.get(mock + "/__state")).json())
    .placements[owner];
  expect(moved.id).toBe(saved.id);
  expect(moved.zone_id).toBe("mar");
  expect(moved.x).toBeCloseTo((tap.x - rendered.x) / rendered.width - 0.008, 2);
  expect(feet(moved).y).toBeCloseTo((tap.y - rendered.y) / rendered.height, 2);
  const visitor = await browser.newPage();
  try {
    await visitor.goto("http://localhost:3101/#expectativas");
    await expect(
      visitor.getByRole("button", { name: "Figurinha de Maria" }),
    ).toBeVisible();
    await expect(
      visitor
        .getByRole("button", { name: "Figurinha de Maria" })
        .locator("img"),
    ).toHaveAttribute("src", "/beach/stickers/crawl.webp");
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
