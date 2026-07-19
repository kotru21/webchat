import { describe, expect, it } from "vitest";
import { formatFingerprint } from "./formatFingerprint.js";

describe("formatFingerprint", () => {
  it("groups hex into 4-char chunks", () => {
    expect(formatFingerprint("abcd1234ef")).toBe("abcd 1234 ef");
  });

  it("strips existing whitespace before grouping", () => {
    expect(formatFingerprint("ab cd 12")).toBe("abcd 12");
  });

  it("returns empty for missing values", () => {
    expect(formatFingerprint(null)).toBe("");
    expect(formatFingerprint(undefined)).toBe("");
    expect(formatFingerprint("")).toBe("");
  });
});
