import { describe, expect, it } from "vitest";
import {
  assertCanAccessDm,
  dmRoomId,
  isAllowedSocketRoom,
} from "./accessControl.js";

describe("accessControl", () => {
  it("builds canonical dm room id", () => {
    expect(dmRoomId("b", "a")).toBe("dm:a:b");
    expect(dmRoomId("a", "b")).toBe("dm:a:b");
  });

  it("allows only self user room and own dm rooms", () => {
    const self = "user1";
    const other = "user2";
    expect(isAllowedSocketRoom(self, `user:${self}`)).toBe(true);
    expect(isAllowedSocketRoom(self, `user:${other}`)).toBe(false);
    expect(isAllowedSocketRoom(self, dmRoomId(self, other))).toBe(true);
    expect(isAllowedSocketRoom(self, "dm:x:y")).toBe(false);
    expect(isAllowedSocketRoom(self, "general")).toBe(false);
    expect(isAllowedSocketRoom(self, "admin")).toBe(false);
  });

  it("rejects non-canonical dm room id order", () => {
    const self = "aaa";
    const other = "zzz";
    expect(isAllowedSocketRoom(self, `dm:${self}:${other}`)).toBe(true);
    expect(isAllowedSocketRoom(self, `dm:${other}:${self}`)).toBe(false);
    expect(isAllowedSocketRoom(other, `dm:${other}:${self}`)).toBe(false);
  });

  it("assertCanAccessDm allows participants only", () => {
    expect(() => assertCanAccessDm("a", "a", "b")).not.toThrow();
    expect(() => assertCanAccessDm("b", "a", "b")).not.toThrow();
    expect(() => assertCanAccessDm("c", "a", "b")).toThrow();
  });
});
