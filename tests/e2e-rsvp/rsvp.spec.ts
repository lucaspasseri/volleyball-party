import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";

const mock = "http://127.0.0.1:54326";
const control = (request: APIRequestContext, values: Record<string, unknown>) =>
  request.post(`${mock}/__control`, { data: values });
async function login(page: Page) {
  await page.goto("/#presenca");
  await page.getByRole("button", { name: "Continuar com Google" }).click();
  await expect(page.getByLabel("Nome", { exact: false }).first()).toBeVisible();
  await expect(page).toHaveURL(/\/#presenca$/);
}

test.beforeEach(async ({ page, request }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydrat|didn't match|server rendered/i.test(message.text())
    )
      errors.push(message.text());
  });
  await page.exposeFunction("__rsvpErrors", () => errors);
  await request.post(`${mock}/__reset`);
  await page.route("**/api/weather", (route) =>
    route.fulfill({ status: 503, json: { weather: null } }),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test.afterEach(async ({ page }) => {
  expect(
    await page.evaluate(() =>
      (
        window as unknown as { __rsvpErrors: () => Promise<string[]> }
      ).__rsvpErrors(),
    ),
  ).toEqual([]);
});

test("public invitation, mocked OAuth callback, private RSVP, edits, counts and sign-out", async ({
  page,
  request,
}, testInfo) => {
  await page.goto("/");
  await expect(page.locator("section")).toHaveCount(6);
  await expect(
    page.getByRole("button", { name: "Continuar com Google" }),
  ).toBeVisible();
  await login(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .locator("#presenca")
    .screenshot({ path: testInfo.outputPath("rsvp-form.png") });
  await expect(page.getByLabel("Nome", { exact: false }).first()).toHaveValue(
    "Maria Silva",
  );
  await expect(page.getByLabel(/Quero aparecer na lista/)).not.toBeChecked();
  await page.getByRole("button", { name: "Salvar minha resposta" }).click();
  await expect(page.getByText("Seu lugar ao sol tá garantido!")).toBeVisible();
  await expect(page.locator(".attendance-count")).toContainText(
    "1 pessoa confirmada",
  );
  await expect(page.locator(".guest-chips li")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("private@example.com");
  await page
    .getByRole("link", { name: "Escolher meu lugar na praia!" })
    .click();
  await expect(page).toHaveURL(/#expectativas$/);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Editar minha resposta" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Editar minha resposta" }).click();
  await page.getByLabel(/Quero aparecer na lista/).check();
  await page.getByText("Mais um carinho?").click();
  await page
    .getByLabel(/Mensagem para o aniversariante/)
    .fill('<script>alert("xss")</script>');
  await page.getByLabel(/O que posso levar/).selectOption("Gelo");
  await page.getByLabel(/Acompanhantes/).fill("2");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.locator(".guest-chips li")).toHaveText("MMaria");
  await expect(page.locator(".attendance-meta").first()).toContainText(
    "2 acompanhantes",
  );
  let state = await (await request.get(`${mock}/__state`)).json();
  expect(Object.keys(state.rows)).toHaveLength(1);
  await page.getByRole("button", { name: "Editar minha resposta" }).click();
  await page.getByRole("radio", { name: "Talvez", exact: true }).check();
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Vamos torcer pra você vir!")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Escolher meu lugar na praia!" }),
  ).toHaveCount(0);
  await expect(page.locator(".attendance-count")).toContainText(
    "0 pessoas confirmadas",
  );
  await expect(page.locator(".guest-chips li")).toHaveCount(0);
  await page.getByRole("button", { name: "Editar minha resposta" }).click();
  await page.getByRole("radio", { name: "Não vou", exact: true }).check();
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Você vai fazer falta!")).toBeVisible();
  state = await (await request.get(`${mock}/__state`)).json();
  expect(Object.keys(state.rows)).toHaveLength(1);
  expect(Object.values(state.rows)[0]).toMatchObject({
    attendance_status: "not_going",
  });
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Continuar com Google" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("failed persistence preserves fields and pending state waits for the server", async ({
  page,
  request,
}) => {
  await login(page);
  await page.getByLabel("Nome", { exact: false }).first().fill("   ");
  await page.getByRole("button", { name: "Salvar minha resposta" }).click();
  await expect(page.getByText("Conta pra gente seu nome.")).toBeVisible();
  await page.getByLabel("Nome", { exact: false }).first().fill("Ana Costa");
  await control(request, { failSave: true, delaySave: 800 });
  await page.getByRole("button", { name: "Salvar minha resposta" }).click();
  await expect(
    page.getByRole("button", { name: "Guardando sua resposta…" }),
  ).toBeDisabled();
  await expect(page.getByText("Seu lugar ao sol tá garantido!")).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText(
    "Não conseguimos salvar agora",
  );
  await expect(page.getByLabel("Nome", { exact: false }).first()).toHaveValue(
    "Ana Costa",
  );
  await expect(
    page.getByRole("link", { name: "Escolher meu lugar na praia!" }),
  ).toHaveCount(0);
  await control(request, { failSave: false, delaySave: 0 });
  await page.route("**/", (route) =>
    route.request().method() === "POST"
      ? route.abort("internetdisconnected")
      : route.continue(),
  );
  await page.getByRole("button", { name: "Salvar minha resposta" }).click();
  await expect(page.locator(".rsvp-feedback")).toContainText(
    "A conexão deu uma pausa",
  );
  await expect(page.getByLabel("Nome", { exact: false }).first()).toHaveValue(
    "Ana Costa",
  );
  await page.unroute("**/");
  await page.getByRole("button", { name: "Salvar minha resposta" }).click();
  await expect(page.getByText("Seu lugar ao sol tá garantido!")).toBeVisible();
});

test("revoked Neon session is rejected even with a previously signed session cache", async ({
  page,
  request,
  context,
}) => {
  await login(page);
  expect(
    (await context.cookies()).some((cookie) =>
      cookie.name.endsWith(".local.session_data"),
    ),
  ).toBe(true);
  const session = await page.request.get("/api/auth/get-session");
  expect(session.status()).toBe(200);
  expect(session.headers()["cache-control"]).toContain("no-store");
  expect((await page.request.post("/api/auth/admin/list-users")).status()).toBe(
    404,
  );
  await control(request, { revokeSessions: true });
  await page.getByRole("button", { name: "Salvar minha resposta" }).click();
  await expect(page.locator(".rsvp-feedback")).toContainText(
    "Sua sessão terminou",
  );
  const response = await page.reload();
  expect(response?.headers()["cache-control"]).toContain("no-store");
  await expect(
    page.getByRole("button", { name: "Continuar com Google" }),
  ).toBeVisible();
});

test("a second signed-in account cannot view or replace the first account's private response", async ({
  page,
  request,
  browser,
}) => {
  await login(page);
  await page.getByLabel("Nome", { exact: false }).first().fill("Maria privada");
  await page.getByRole("button", { name: "Salvar minha resposta" }).click();
  await expect(page.getByText("Seu lugar ao sol tá garantido!")).toBeVisible();
  await control(request, { nextGuest: true });
  const second = await browser.newPage({ baseURL: "http://localhost:3101" });
  try {
    await login(second);
    await expect(
      second.getByLabel("Nome", { exact: false }).first(),
    ).toHaveValue("Elisa Souza");
    await expect(
      second.getByRole("button", { name: "Editar minha resposta" }),
    ).toHaveCount(0);
    await second.getByRole("button", { name: "Salvar minha resposta" }).click();
    await expect(
      second.getByText("Seu lugar ao sol tá garantido!"),
    ).toBeVisible();
    expect((await second.request.get("/organizador/exportar")).status()).toBe(
      403,
    );
    const { rows } = await (await request.get(`${mock}/__state`)).json();
    expect(Object.keys(rows).sort()).toEqual([
      "guest-test-elisa",
      "guest-test-maria",
    ]);
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Editar minha resposta" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Editar minha resposta" }).click();
    await expect(page.getByLabel("Nome", { exact: false }).first()).toHaveValue(
      "Maria privada",
    );
  } finally {
    await second.close();
  }
});

test("callback cancellation/failure, absent profile and expired session are handled", async ({
  page,
  request,
  context,
}) => {
  await page.goto(
    "/auth/callback?error=access_denied&error_description=UNTRUSTED",
  );
  await expect(page.locator(".rsvp-alert")).toContainText(
    "entrada foi cancelada",
  );
  await expect(page.locator("body")).not.toContainText("UNTRUSTED");
  await page.goto("/auth/callback?code=invalid&next=https://evil.example");
  await expect(page.locator(".rsvp-alert")).toContainText(
    "Não conseguimos concluir",
  );
  await control(request, { missingProfile: true });
  await login(page);
  await expect(page.getByLabel("Nome", { exact: false }).first()).toHaveValue(
    "",
  );
  await page.getByLabel("Nome", { exact: false }).first().fill("Ana");
  await context.clearCookies();
  await page.getByRole("button", { name: "Salvar minha resposta" }).click();
  await expect(page.getByRole("status")).toContainText("Sua sessão terminou");
});

test("organizer access, CSV, moderation and public privacy", async ({
  page,
  request,
  context,
}) => {
  await login(page);
  await page.getByText("Mais um carinho?").click();
  await page
    .getByLabel(/Mensagem para o aniversariante/)
    .fill("<img src=x onerror=alert(1)>");
  await page.getByRole("button", { name: "Salvar minha resposta" }).click();
  await expect(page.getByText("Seu lugar ao sol tá garantido!")).toBeVisible();
  await page.goto("/organizador");
  await expect(page.getByText(/Acesso restrito ao organizador/)).toBeVisible();
  const forbidden = await page.request.get("/organizador/exportar");
  expect(forbidden.status()).toBe(403);
  await context.clearCookies();
  await control(request, { nextOrganizer: true });
  await login(page);
  await page.goto("/organizador");
  await expect(page.locator("table")).toContainText("Maria Silva");
  await expect(page.locator("table")).toContainText(
    "<img src=x onerror=alert(1)>",
  );
  await expect(page.locator("table img")).toHaveCount(0);
  const csv = await page.request.get("/organizador/exportar");
  expect(csv.status()).toBe(200);
  expect(await csv.text()).toContain('"Maria Silva","Vou"');
  await page.getByRole("button", { name: "Ocultar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Restaurar", exact: true }),
  ).toBeVisible();
  await page.goto("/#presenca");
  await expect(page.locator(".attendance-count")).toContainText(
    "0 pessoas confirmadas",
  );
  await page.goto("/organizador");
  await page.getByRole("button", { name: "Restaurar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Ocultar", exact: true }),
  ).toBeVisible();
  await page.goto("/#presenca");
  await expect(page.locator(".attendance-count")).toContainText(
    "1 pessoa confirmada",
  );
});
