import { randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";

const PASSWORD = "Sup3r-Secret!e2e";

const uniqueUser = (prefix) => {
  const id = `${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
  return {
    username: `e2e-${prefix}-${id}`,
    email: `e2e-${prefix}-${id}@example.com`,
  };
};

const registerUser = async (page, user) => {
  await page.goto("/register");
  await page.getByLabel("Никнейм (необязательно)").fill(user.username);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Пароль", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Зарегистрироваться" }).click();
  await page.waitForURL("**/login");
};

const loginUser = async (page, user) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Пароль", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByLabel("Поиск пользователей")).toBeVisible();
};

const openDmWith = async (page, username) => {
  const search = page.getByLabel("Поиск пользователей");
  await search.fill(username);
  await page
    .getByRole("button", { name: new RegExp(username) })
    .first()
    .click();
  await expect(page.getByLabel("Текст сообщения")).toBeVisible();
};

const messageLog = (page) =>
  page.getByLabel("Сообщения", { exact: true });

test("E2EE DM: ciphertext on the wire, plaintext in UI, survives reload", async ({
  browser,
}) => {
  const userA = uniqueUser("e2a");
  const userB = uniqueUser("e2b");
  const nonce = `secret-e2e-${Date.now().toString(36)}`;

  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  try {
    await registerUser(pageA, userA);
    await loginUser(pageA, userA);
    await registerUser(pageB, userB);
    await loginUser(pageB, userB);

    // Both sides open the DM so enrollment + TOFU pin can settle.
    await openDmWith(pageB, userA.username);
    await openDmWith(pageA, userB.username);

    await expect(
      pageA.getByTestId("e2ee-composer-status").locator('[data-status="encrypted"]')
    ).toBeVisible({ timeout: 20_000 });

    await pageA.getByLabel("Текст сообщения").fill(nonce);
    await pageA.getByRole("button", { name: "Отправить сообщение" }).click();

    await expect(messageLog(pageA).getByText(nonce)).toBeVisible();
    await expect(pageA.getByTestId("e2ee-lock-badge").first()).toBeVisible();
    await expect(messageLog(pageB).getByText(nonce)).toBeVisible({
      timeout: 15_000,
    });

    // Reload A: history decrypts via IndexedDB; wire must not contain nonce.
    const historyPromise = pageA.waitForResponse((res) => {
      try {
        const url = new URL(res.url());
        return (
          url.pathname === "/api/messages" &&
          res.request().method() === "GET" &&
          res.ok()
        );
      } catch {
        return false;
      }
    });
    await pageA.reload();
    await expect(pageA.getByLabel("Поиск пользователей")).toBeVisible({
      timeout: 15_000,
    });
    await openDmWith(pageA, userB.username);
    const historyRes = await historyPromise;
    const body = await historyRes.text();
    expect(body).toContain("e2ee-v1");
    expect(body).not.toContain(nonce);

    await expect(messageLog(pageA).getByText(nonce)).toBeVisible({
      timeout: 15_000,
    });
    await expect(pageA.getByTestId("e2ee-lock-badge").first()).toBeVisible();
  } finally {
    await contextA.close();
    await contextB.close();
  }
});
