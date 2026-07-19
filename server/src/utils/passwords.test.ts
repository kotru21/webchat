import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import {
  hashPassword,
  needsRehash,
  verifyPassword,
} from "./passwords.js";

describe("passwords", () => {
  it("argon2 round-trip", async () => {
    const hash = await hashPassword("SecretPass1!");
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword(hash, "SecretPass1!")).toBe(true);
    expect(await verifyPassword(hash, "wrong")).toBe(false);
  });

  it("verifies legacy bcrypt hashes", async () => {
    const hash = await bcrypt.hash("LegacyPass1!", 10);
    expect(hash.startsWith("$2")).toBe(true);
    expect(await verifyPassword(hash, "LegacyPass1!")).toBe(true);
    expect(await verifyPassword(hash, "wrong")).toBe(false);
  });

  it("needsRehash true for bcrypt, false for fresh argon2", async () => {
    const bcryptHash = await bcrypt.hash("x", 10);
    expect(needsRehash(bcryptHash)).toBe(true);

    const argonHash = await hashPassword("x");
    expect(needsRehash(argonHash)).toBe(false);
  });
});
