import bcrypt from "bcryptjs";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import prisma from "../../config/prisma.js";
import {
  buildTestApp,
  uniqueCreds,
} from "../helpers/testApp.js";

describe("login password hash migration", () => {
  const app = buildTestApp();
  const creds = uniqueCreds("migrate");
  let userId: string;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash(creds.password, 10);
    const user = await prisma.user.create({
      data: {
        email: creds.email,
        username: creds.username,
        passwordHash,
      },
      select: { id: true },
    });
    userId = user.id;
  });

  it("migrates bcrypt → argon2id on successful login", async () => {
    const before = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    expect(before?.passwordHash.startsWith("$2")).toBe(true);

    const login = await request(app).post("/api/auth/login").send({
      email: creds.email,
      password: creds.password,
    });
    expect(login.status).toBe(200);
    expect(typeof login.body.token).toBe("string");

    const after = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    expect(after?.passwordHash.startsWith("$argon2id$")).toBe(true);

    const loginAgain = await request(app).post("/api/auth/login").send({
      email: creds.email,
      password: creds.password,
    });
    expect(loginAgain.status).toBe(200);

    const wrong = await request(app).post("/api/auth/login").send({
      email: creds.email,
      password: "WrongPass1!",
    });
    expect(wrong.status).toBe(400);
    expect(wrong.body.code).toBe("INVALID_CREDENTIALS");
  });
});
