import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import {
  buildTestApp,
  registerAndLogin,
  uniqueCreds,
  type AuthSession,
} from "../helpers/testApp.js";

const validPublicJwk = () => ({
  kty: "EC",
  crv: "P-256",
  // 32-byte coords as base64url (~43 chars)
  x: "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
  y: "x_FEzRu9gJjNqQvHdcXXilbCEyfE9Y7RXHLZc9SDybY",
});

describe("E2EE key directory", () => {
  const app = buildTestApp();
  let userA: AuthSession;
  let userB: AuthSession;

  beforeAll(async () => {
    userA = await registerAndLogin(app, uniqueCreds("e2kA"));
    userB = await registerAndLogin(app, uniqueCreds("e2kB"));
  });

  it("PUT own key → peer GET returns it; row is caller's", async () => {
    const jwk = validPublicJwk();
    const put = await request(app)
      .put("/api/e2ee/keys")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({ publicKeyJwk: jwk });
    expect(put.status).toBe(200);
    expect(put.body.userId).toBe(userA.userId);
    expect(put.body.publicKeyJwk).toEqual(jwk);
    expect(put.body.publicKeyJwk).not.toHaveProperty("d");

    const get = await request(app)
      .get(`/api/e2ee/keys/${userA.userId}`)
      .set("Authorization", `Bearer ${userB.token}`);
    expect(get.status).toBe(200);
    expect(get.body.userId).toBe(userA.userId);
    expect(get.body.publicKeyJwk).toEqual(jwk);
  });

  it("PUT with d member → 400 INVALID_KEY", async () => {
    const res = await request(app)
      .put("/api/e2ee/keys")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({
        publicKeyJwk: {
          ...validPublicJwk(),
          d: "0_H0kLsRNcHdsjUhYnQ_1oUZi2C3u6e0d6xY7zAbCdE",
        },
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_KEY");
  });

  it("PUT with garbage / extra members → 400 INVALID_KEY", async () => {
    const extra = await request(app)
      .put("/api/e2ee/keys")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({
        publicKeyJwk: { ...validPublicJwk(), evil: true },
      });
    expect(extra.status).toBe(400);
    expect(extra.body.code).toBe("INVALID_KEY");

    const garbage = await request(app)
      .put("/api/e2ee/keys")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({ publicKeyJwk: "not-an-object" });
    expect(garbage.status).toBe(400);
    expect(garbage.body.code).toBe("INVALID_KEY");
  });

  it("GET unknown user key → 404 E2EE_KEY_NOT_FOUND", async () => {
    const res = await request(app)
      .get("/api/e2ee/keys/nonexistent-user-id-xyz")
      .set("Authorization", `Bearer ${userA.token}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("E2EE_KEY_NOT_FOUND");
  });
});
