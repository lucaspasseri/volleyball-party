import { tributeIds } from "../../lib/tribute-stickers";
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydrat|server rendered|didn't match/i.test(message.text())
    ) {
      errors.push(message.text());
    }
  });
  await page.exposeFunction("__pageErrors", () => errors);
  // Deterministic network fixture; production never uses sample weather.
  await page.route("**/api/weather", (route) =>
    route.fulfill({
      status: 200,
      json: {
        weather: {
          kind: "current",
          temperature: 27,
          code: 2,
          wind: 12,
          observedAt: "2026-11-23T09:15:00-03:00",
        },
      },
    }),
  );
  await page.goto("/");
});

test.afterEach(async ({ page }) => {
  expect(
    await page.evaluate(() =>
      (
        window as unknown as { __pageErrors: () => Promise<string[]> }
      ).__pageErrors(),
    ),
  ).toEqual([]);
});

test("six sections, correct date, RSVP setup state and no overflow", async ({
  page,
}) => {
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page.locator("h1")).toContainText("VÔLEI");
  for (const id of [
    "inicio",
    "quando",
    "onde",
    "como",
    "presenca",
    "expectativas",
  ]) {
    await expect(page.locator(`section#${id}`)).toHaveCount(1);
  }
  await expect(page.locator(".calendar-selected")).toContainText("7");
  await expect(page.locator(".calendar-top")).toContainText("2027");
  await expect(
    page.getByText("Condições atuais", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Este é o clima de agora.", { exact: false }),
  ).toBeVisible();
  await expect(page.locator("#presenca")).toContainText("As confirmações estão sendo preparadas");
  await expect(page.locator("#presenca")).toContainText("Nenhuma informação é enviada");
  await expect(page.locator("#expectativas")).toContainText(
    "Seu lugar na areia.",
  );
  await expect(page.locator(".map-top")).toContainText("MAPA GERAL");
  await expect(
    page.getByRole("link", { name: "Abrir no Google Maps" }),
  ).toHaveAttribute("href", /Praia\+de\+Copacabana/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() =>
      (
        window as unknown as { __pageErrors: () => Promise<string[]> }
      ).__pageErrors(),
    ),
  ).toEqual([]);
});

test("hero navigation and calendar download work", async ({ page }) => {
  await page.getByRole("link", { name: "Explorar a festa" }).click();
  await expect(page).toHaveURL(/#quando$/);
  await expect(page.locator("#when-heading")).toBeInViewport();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Adicionar ao calendário" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("volei-do-pesca.ics");
  await page
    .getByRole("link", { name: "Confirmar presença", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/#presenca$/);
  await expect(page.locator("#rsvp-heading")).toBeInViewport();
});

test("section links frame their incoming waves and flat edges", async ({ page }) => {
  const menu = page.getByRole("button", { name: "Abrir menu" });
  const mobile = await menu.isVisible();
  const nav = page.locator(mobile ? "#mobile-nav" : ".desktop-nav");
  for (const id of ["quando", "como", "onde"]) {
    if (mobile) await menu.click();
    await nav.locator(`a[href="#${id}"]`).click();
    if (mobile) await expect(nav).toHaveCount(0);

    const section = page.locator(`#${id}`);
    await expect(section.getByRole("heading", { level: 2 })).toBeInViewport({
      ratio: 1,
    });
    if (id === "onde") {
      await expect
        .poll(() => section.evaluate(el => Math.abs(el.getBoundingClientRect().top)))
        .toBeLessThan(2);
    } else {
      const wave = page.locator(id === "quando" ? ".hero-wave" : ".how-wave");
      // The hero clips the bottom pixel of its SVG to hide the seam.
      await expect(wave).toBeInViewport({ ratio: 0.95 });
      await expect
        .poll(() => wave.evaluate(el => el.getBoundingClientRect().top))
        .toBeLessThan(18);
    }
  }
});

test("a fresh Onde deep link stays aligned as the weather loads", async ({ page }) => {
  let releaseWeather!: () => void;
  const pendingWeather = new Promise<void>(resolve => {
    releaseWeather = resolve;
  });
  await page.route("**/api/weather", async route => {
    await pendingWeather;
    await route.fallback();
  });
  const top = () => page.locator("#onde").evaluate(
    el => Math.abs(el.getBoundingClientRect().top),
  );
  try {
    // Load a new document so this exercises initial fragment positioning.
    await page.goto("about:blank");
    await page.goto("/#onde", { waitUntil: "domcontentloaded" });
    await expect.poll(top).toBeLessThan(2);
  } finally {
    releaseWeather();
  }
  await expect(page.locator(".weather-value")).toBeAttached();
  await expect.poll(top).toBeLessThan(2);
});

test("weather errors are readable without made-up temperatures", async ({
  page,
}) => {
  await page.route("**/api/weather", (route) =>
    route.fulfill({ status: 503, json: { weather: null } }),
  );
  await page.reload();
  await expect(page.getByText("O céu fez uma pausa por aqui.")).toBeVisible();
  await expect(page.locator(".weather-value")).toHaveCount(0);
});

test("event forecast is explicitly labeled", async ({ page }) => {
  await page.route("**/api/weather", (route) =>
    route.fulfill({
      status: 200,
      json: {
        weather: {
          kind: "forecast",
          temperature: 30,
          minimum: 23,
          code: 0,
          wind: 10,
          observedAt: "2027-01-01T12:00:00Z",
        },
      },
    }),
  );
  await page.reload();
  await expect(page.getByText("Previsão para o dia da festa")).toBeVisible();
  await expect(page.getByText("Condições atuais", { exact: true })).toHaveCount(
    0,
  );
});

test("mobile menu navigates, closes and supports Escape", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile navigation only");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page
    .getByRole("navigation", { name: "Navegação móvel" })
    .getByRole("link", { name: "Onde", exact: true })
    .click();
  await expect(page).toHaveURL(/#onde$/);
  await expect(
    page.getByRole("button", { name: "Abrir menu" }),
  ).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Abrir menu" }),
  ).toHaveAttribute("aria-expanded", "false");
});

test("reduced motion and narrow screens remain usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.reload();
  await expect(page.locator("h1")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Explorar a festa" }).click();
  await expect(page).toHaveURL(/#quando$/);
});

test("visitors can open every available sticker in the regular album", async ({ page }) => {
  await page.getByRole("button", { name: "Ver figurinhas" }).click();
  const album = page.getByRole("dialog");
  await album.getByRole("button", { name: "Todos", exact: true }).click();
  const images = album.locator(".album-grid img");
  await expect(images).toHaveCount(78);
  const urls = await images.evaluateAll(async (elements) => Promise.all(elements.map(async (el) => {
    const img = el as HTMLImageElement;
    img.loading = "eager";
    await img.decode();
    if (img.naturalWidth !== 256 || img.naturalHeight !== 256) throw new Error(img.src);
    return img.getAttribute("src");
  })));
  expect(new Set(urls).size).toBe(urls.length);
  expect(urls).toEqual(expect.arrayContaining(tributeIds.map((id) => `/beach/stickers/${id}.webp`)));
});
