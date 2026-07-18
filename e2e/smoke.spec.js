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

test("register → login → DM between two users → logout", async ({
  browser,
}) => {
  const userA = uniqueUser("a");
  const userB = uniqueUser("b");
  const message = `smoke-${Date.now().toString(36)}`;

  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  try {
    // Both users register and log in.
    await registerUser(pageA, userA);
    await loginUser(pageA, userA);
    await registerUser(pageB, userB);
    await loginUser(pageB, userB);

    // B finds A via search and sends a DM.
    await openDmWith(pageB, userA.username);
    await pageB.getByLabel("Текст сообщения").fill(message);
    await pageB.getByRole("button", { name: "Отправить сообщение" }).click();
    await expect(pageB.getByText(message)).toBeVisible();

    // A opens the thread and sees the message (REST history + ACL).
    await openDmWith(pageA, userB.username);
    await expect(pageA.getByText(message)).toBeVisible();

    // Logout clears the session and returns to /login.
    await pageA.getByRole("button", { name: "Выйти из аккаунта" }).click();
    await pageA.waitForURL("**/login");
    const cookies = await contextA.cookies();
    expect(
      cookies.find((cookie) => cookie.name === "refreshToken")?.value || ""
    ).toBe("");
  } finally {
    await contextA.close();
    await contextB.close();
  }
});
