import { expect, test, type Page } from "@playwright/test";

const mock = "http://127.0.0.1:54326";
const origin = "http://localhost:3101";
async function enterAlbum(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Continuar com Google" }).click();
  await page.getByLabel(/Quero aparecer na lista/).check();
  await page.getByRole("button", { name: "Salvar minha resposta" }).click();
  await page.getByRole("button", { name: "Escolher figurinha" }).click();
  await page
    .getByRole("button", { name: "Meu personagem", exact: true })
    .click();
}
async function place(page: Page, zone: string) {
  await page.getByRole("button", { name: "Adicionar ao cenário" }).click();
  const save = page.getByRole("button", { name: "Guardar lugar" });
  await expect(save).toBeDisabled();
  await page.getByRole("button", { name: zone, exact: true }).click();
  await page
    .getByRole("checkbox", { name: /Ao adicionar seu personagem/ })
    .check();
  await save.click();
  await expect(page.locator(".beach-feedback")).toHaveText("Lugar guardado!");
}

test("two guests customize, publish, revisit and withdraw their characters from the shared beach", async ({
  page,
  browser,
  request,
}, info) => {
  await request.post(mock + "/__reset");
  await request.post(mock + "/__control", { data: { populateBeach: true } });
  await enterAlbum(page);
  const album = page.getByRole("dialog");
  const screenshot = {
    scale: "css" as const,
    animations: "disabled" as const,
    style: "nextjs-portal {display:none!important}",
  };
  await expect(
    album.getByRole("group", { name: "Poses" }).getByRole("button"),
  ).toHaveCount(20);
  await expect(
    album.getByRole("button", { name: "Usar minha foto de perfil" }),
  ).toBeVisible();
  await expect(
    album.getByRole("button", { name: "Adicionar ao cenário" }),
  ).toBeDisabled();
  await album.screenshot({
    ...screenshot,
    path: info.outputPath("selector.png"),
  });
  await album
    .locator("input[type=file]")
    .setInputFiles("tests/fixtures/portraits/sol.jpg");
  await expect(album.getByRole("status")).toContainText("Foto pronta");
  const photo = (await album
    .locator(".character-preview image")
    .first()
    .getAttribute("href"))!;
  expect((await request.get(origin + photo)).status()).toBe(404);
  expect((await page.request.get(photo)).headers()["cache-control"]).toContain(
    "no-store",
  );
  for (const name of [
    "Cortada no ar",
    "Leitura na cadeira",
    "Um brinde!",
    "Banho de mar",
    "Bola debaixo do braço",
  ]) {
    await album.getByRole("button", { name, exact: true }).click();
    await expect(album.locator(".character-preview strong")).toHaveText(name);
    await expect(
      album.locator(".character-preview image").first(),
    ).toHaveAttribute("href", photo);
    await album
      .locator(".character-preview")
      .screenshot({ ...screenshot, path: info.outputPath(`pose-${name}.png`) });
  }
  await album.getByText("Ajustar foto", { exact: true }).click();
  await album.getByRole("slider", { name: "Horizontal" }).press("ArrowRight");
  await album.screenshot({
    ...screenshot,
    path: info.outputPath("customization.png"),
  });
  await album.getByRole("button", { name: "Adicionar ao cenário" }).click();
  const stage = page.locator(".beach-stage");
  for (const zone of [
    "Quadras",
    "Gazebo",
    "Coolers",
    "Bancos",
    "Cadeiras",
    "Areia livre",
    "Mar",
    "Calçadão",
  ]) {
    await page.getByRole("button", { name: zone, exact: true }).click();
    const box = await stage
      .locator(".draft-anchor .character-art")
      .boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    expect(box!.height).toBeCloseTo(box!.width, 0);
  }
  await page
    .getByRole("button", { name: /Mover .* com as setas/ })
    .press("ArrowRight");
  const save = page.getByRole("button", { name: "Guardar lugar" });
  await expect(save).toBeDisabled();
  await page
    .getByRole("checkbox", { name: /Ao adicionar seu personagem/ })
    .check();
  await save.click();
  await expect(page.locator(".beach-feedback")).toHaveText("Lugar guardado!");
  const second = await browser.newPage({
    baseURL: origin,
    viewport: page.viewportSize(),
  });
  try {
    await request.post(mock + "/__control", { data: { nextGuest: true } });
    await enterAlbum(second);
    await second
      .locator("input[type=file]")
      .setInputFiles("tests/fixtures/portraits/mar.jpg");
    await second
      .getByRole("button", { name: "Banho de mar", exact: true })
      .click();
    await place(second, "Mar");
    expect(
      (await second.request.delete(photo, { headers: { origin } })).status(),
    ).toBe(404);
    await page.reload();
    const camera = page.locator(".beach-camera");
    await expect(camera.locator(".placed-sticker .character-art")).toHaveCount(
      2,
    );
    await expect(camera.locator(".placed-sticker img")).toHaveCount(6);
    await expect(
      camera
        .getByRole("button", { name: "Figurinha de Maria" })
        .locator("image")
        .first(),
    ).toHaveAttribute("href", photo);
    await camera.scrollIntoViewIfNeeded();
    await camera.screenshot({
      ...screenshot,
      path: info.outputPath("shared-beach.png"),
    });
    expect((await request.get(origin + photo)).status()).toBe(200);
    // On a missing asset the illustrated head still renders and the sticker remains selectable.
    await page.route("**" + photo, (route) => route.fulfill({ status: 404 }));
    await page.reload();
    const fallback = camera.getByRole("button", { name: "Figurinha de Maria" });
    await expect(fallback.locator("image")).toHaveCount(1);
    await expect(fallback.locator("image")).toHaveAttribute(
      "href",
      "/beach/characters/capita.webp",
    );
    await page.unroute("**" + photo);
    await page.reload();
    await page.getByRole("button", { name: "Editar meu lugar" }).click();
    await expect(
      album.locator(".character-preview image").first(),
    ).toHaveAttribute("href", photo);
    await album.getByRole("button", { name: "Remover minha foto" }).click();
    await album.getByRole("button", { name: "Confirmar remoção" }).click();
    await expect(album.getByRole("status")).toContainText("removidos");
    expect((await request.get(origin + photo)).status()).toBe(404);
    await second.reload();
    await expect(
      second.getByRole("button", { name: "Figurinha de Maria" }),
    ).toHaveCount(0);
    await expect(
      second.getByRole("button", { name: "Figurinha de Elisa" }),
    ).toBeVisible();
  } finally {
    await second.close();
  }
});

test("a private RSVP explains portrait visibility and restores the character for its owner", async ({
  page,
  request,
}) => {
  await request.post(mock + "/__reset");
  await page.goto("/#presenca");
  await page.getByRole("button", { name: "Continuar com Google" }).click();
  await page.getByRole("button", { name: "Salvar minha resposta" }).click();
  await page.getByRole("button", { name: "Escolher figurinha" }).click();
  await page.getByRole("button", { name: "Meu personagem", exact: true }).click();
  const album = page.getByRole("dialog");
  await album.locator("input[type=file]").setInputFiles("tests/fixtures/portraits/sol.jpg");
  await album.getByRole("button", { name: "Adicionar ao cenário" }).click();
  const save = page.getByRole("button", { name: "Guardar lugar" });
  await expect(save).toBeDisabled();
  await page.getByRole("checkbox", { name: /Só eu vejo meu personagem/ }).check();
  await save.click();
  await expect(page.locator(".beach-feedback")).toHaveText("Lugar guardado!");
  await page.reload();
  const portrait = page.locator(".placed-sticker .character-art image").first();
  await expect(portrait).toHaveAttribute("href", /^\/api\/character-photo\//);
  const path = (await portrait.getAttribute("href"))!;
  expect((await page.request.get(path)).status()).toBe(200);
  expect((await request.get(origin + path)).status()).toBe(404);
});
