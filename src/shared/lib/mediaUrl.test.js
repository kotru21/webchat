import { afterEach, describe, expect, it, vi } from "vitest";

// Default build: VITE_API_URL is empty → same-origin relative paths.
import {
  fetchAuthorizedMediaUrl,
  isAuthorizedMediaTarget,
  toAbsoluteMediaUrl,
} from "./mediaUrl";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("toAbsoluteMediaUrl", () => {
  it("keeps canonical /api/media paths", () => {
    expect(toAbsoluteMediaUrl("/api/media/avatars/a.webp")).toBe(
      "/api/media/avatars/a.webp"
    );
  });

  it("maps legacy /uploads paths onto /api/media", () => {
    expect(toAbsoluteMediaUrl("/uploads/media/f.mp4")).toBe(
      "/api/media/media/f.mp4"
    );
    expect(toAbsoluteMediaUrl("uploads/media/f.mp4")).toBe(
      "/api/media/media/f.mp4"
    );
  });

  it("rewrites adblock-triggering banners segment to covers", () => {
    expect(toAbsoluteMediaUrl("/api/media/banners/b.webp")).toBe(
      "/api/media/covers/b.webp"
    );
    expect(toAbsoluteMediaUrl("/uploads/banners/b.webp")).toBe(
      "/api/media/covers/b.webp"
    );
  });

  it("passes through blob:/data: URLs untouched", () => {
    expect(toAbsoluteMediaUrl("blob:http://x/1")).toBe("blob:http://x/1");
    expect(toAbsoluteMediaUrl("data:image/png;base64,AA")).toBe(
      "data:image/png;base64,AA"
    );
  });

  it("prefixes API base when configured", async () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:5000");
    const fresh = await import("./mediaUrl");
    expect(fresh.toAbsoluteMediaUrl("/api/media/media/f.bin")).toBe(
      "http://localhost:5000/api/media/media/f.bin"
    );
  });
});

describe("isAuthorizedMediaTarget (Bearer exfiltration guard)", () => {
  it("allows only same-app media API paths", () => {
    expect(isAuthorizedMediaTarget("/api/media/media/f.bin")).toBe(true);
    expect(isAuthorizedMediaTarget("/api/media/avatars/a.webp")).toBe(true);
  });

  it("rejects third-party and non-media URLs", () => {
    expect(isAuthorizedMediaTarget("https://evil.example/api/media/x")).toBe(
      false
    );
    expect(isAuthorizedMediaTarget("/uploads/media/f.bin")).toBe(false);
    expect(isAuthorizedMediaTarget("/api/auth/me")).toBe(false);
    expect(isAuthorizedMediaTarget("")).toBe(false);
    expect(isAuthorizedMediaTarget(null)).toBe(false);
    expect(isAuthorizedMediaTarget(undefined)).toBe(false);
  });

  it("allows the configured API base host only", async () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:5000");
    const fresh = await import("./mediaUrl");
    expect(
      fresh.isAuthorizedMediaTarget("http://localhost:5000/api/media/media/f.bin")
    ).toBe(true);
    expect(
      fresh.isAuthorizedMediaTarget("http://localhost:5001/api/media/media/f.bin")
    ).toBe(false);
  });
});

describe("fetchAuthorizedMediaUrl", () => {
  it("never sends the token to untrusted hosts", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(
      fetchAuthorizedMediaUrl("https://evil.example/api/media/media/f.bin")
    ).rejects.toThrow("MEDIA_UNTRUSTED_URL");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns blob:/data: URLs without fetching", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(fetchAuthorizedMediaUrl("blob:http://x/1")).resolves.toBe(
      "blob:http://x/1"
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects on non-OK responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 403 })
    );

    await expect(
      fetchAuthorizedMediaUrl("/api/media/media/f.bin")
    ).rejects.toThrow("MEDIA_FETCH_FAILED_403");
  });
});
