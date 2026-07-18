import { describe, expect, it } from "vitest";
import {
  isValidUsername,
  normalizeUsername,
} from "../../utils/profileFields.js";

describe("username NFKC normalization", () => {
  it("collapses compatibility characters before validation", () => {
    // Fullwidth Latin letters → ASCII via NFKC
    expect(normalizeUsername("Ａｄｍｉｎ")).toBe("Admin");
    expect(isValidUsername("Ａｄｍｉｎ")).toBe(true);
  });

  it("trims and rejects too-short names after normalize", () => {
    expect(normalizeUsername("  a  ")).toBe("a");
    expect(isValidUsername("  a  ")).toBe(false);
  });
});
