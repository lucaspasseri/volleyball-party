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

test("six sections, correct date, honest previews and no overflow", async ({
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
  await expect(page.getByLabel("Como você se chama?")).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Confirmações em breve" }),
  ).toBeDisabled();
  await expect(page.locator("#presenca")).toContainText(
    "nenhum dado será enviado",
  );
  await expect(page.locator("#expectativas")).toContainText(
    "EXPERIÊNCIA EM BREVE",
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
