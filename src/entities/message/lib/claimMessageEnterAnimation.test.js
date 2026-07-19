import { describe, expect, it } from "vitest";
import {
  claimMessageEnterAnimation,
  transferMessageEnterClaim,
} from "./claimMessageEnterAnimation.js";

describe("claimMessageEnterAnimation", () => {
  it("claims a fresh optimistic message once", () => {
    const id = `temp-test-${Math.random()}`;
    expect(
      claimMessageEnterAnimation(id, { optimistic: true, createdAt: new Date() })
    ).toBe(true);
    expect(
      claimMessageEnterAnimation(id, { optimistic: true, createdAt: new Date() })
    ).toBe(false);
  });

  it("skips stale history messages", () => {
    const id = `hist-${Math.random()}`;
    const old = new Date(Date.now() - 60_000);
    expect(
      claimMessageEnterAnimation(id, { optimistic: false, createdAt: old })
    ).toBe(false);
  });

  it("transfers claim from temp id to server id", () => {
    const tempId = `temp-xfer-${Math.random()}`;
    const realId = `real-xfer-${Math.random()}`;
    expect(
      claimMessageEnterAnimation(tempId, {
        optimistic: true,
        createdAt: new Date(),
      })
    ).toBe(true);
    transferMessageEnterClaim(tempId, realId);
    expect(
      claimMessageEnterAnimation(realId, {
        optimistic: false,
        createdAt: new Date(),
      })
    ).toBe(false);
  });
});
