// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("axios", () => ({
  default: { post: vi.fn() },
}));

const FLAG_COOKIE = "hasRefreshSession=1; Path=/";

const loadModules = async () => {
  // Fresh module registry per test: refreshSession keeps single-flight state.
  vi.resetModules();
  const axios = (await import("axios")).default;
  // The axios mock instance survives resetModules — drop calls and queued values.
  axios.post.mockReset();
  const refreshSession = await import("./refreshSession");
  const accessToken = await import("./accessToken");
  return { axios, ...refreshSession, ...accessToken };
};

const concurrentError = () => {
  const error = new Error("Request failed with status code 401");
  error.response = { status: 401, data: { code: "REFRESH_CONCURRENT" } };
  return error;
};

const fatalError = () => {
  const error = new Error("Request failed with status code 401");
  error.response = { status: 401, data: { code: "INVALID_REFRESH_TOKEN" } };
  return error;
};

beforeEach(() => {
  document.cookie = "hasRefreshSession=; Max-Age=0; Path=/";
});

describe("hasRefreshSessionFlag", () => {
  it("is false without the cookie and true with it", async () => {
    const { hasRefreshSessionFlag } = await loadModules();
    expect(hasRefreshSessionFlag()).toBe(false);
    document.cookie = FLAG_COOKIE;
    expect(hasRefreshSessionFlag()).toBe(true);
  });
});

describe("refreshAccessToken", () => {
  it("rejects without a session flag and does not hit the network", async () => {
    const { axios, refreshAccessToken } = await loadModules();
    await expect(refreshAccessToken()).rejects.toThrow("NO_REFRESH_SESSION");
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("stores and returns the new access token", async () => {
    document.cookie = FLAG_COOKIE;
    const { axios, refreshAccessToken, getAccessToken } = await loadModules();
    axios.post.mockResolvedValueOnce({ data: { token: "t1" } });

    await expect(refreshAccessToken()).resolves.toBe("t1");
    expect(getAccessToken()).toBe("t1");
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it("dedupes concurrent callers into one request", async () => {
    document.cookie = FLAG_COOKIE;
    const { axios, refreshAccessToken } = await loadModules();
    axios.post.mockResolvedValueOnce({ data: { token: "t1" } });

    const [a, b] = await Promise.all([
      refreshAccessToken(),
      refreshAccessToken(),
    ]);
    expect(a).toBe("t1");
    expect(b).toBe("t1");
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it("retries once on REFRESH_CONCURRENT (cross-tab rotation race)", async () => {
    document.cookie = FLAG_COOKIE;
    const { axios, refreshAccessToken, getAccessToken } = await loadModules();
    axios.post
      .mockRejectedValueOnce(concurrentError())
      .mockResolvedValueOnce({ data: { token: "t2" } });

    await expect(refreshAccessToken()).resolves.toBe("t2");
    expect(getAccessToken()).toBe("t2");
    expect(axios.post).toHaveBeenCalledTimes(2);
  });

  it("clears the session flag and token on fatal refresh failure", async () => {
    document.cookie = FLAG_COOKIE;
    const {
      axios,
      refreshAccessToken,
      hasRefreshSessionFlag,
      getAccessToken,
      setAccessToken,
    } = await loadModules();
    setAccessToken("stale");
    axios.post.mockRejectedValueOnce(fatalError());

    await expect(refreshAccessToken()).rejects.toThrow();
    expect(hasRefreshSessionFlag()).toBe(false);
    expect(getAccessToken()).toBe(null);
  });
});
