import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestApp } from "../helpers/testApp.js";

describe("stripped message routes", () => {
  const app = buildTestApp();

  it("rejects pin route", async () => {
    const res = await request(app).put("/api/messages/fake-id/pin");
    expect(res.status).toBe(404);
  });

  it("rejects edit route", async () => {
    const res = await request(app).put("/api/messages/fake-id");
    expect(res.status).toBe(404);
  });

  it("rejects delete route", async () => {
    const res = await request(app).delete("/api/messages/fake-id");
    expect(res.status).toBe(404);
  });

  it("rejects read receipt route", async () => {
    const res = await request(app).post("/api/messages/fake-id/read");
    expect(res.status).toBe(404);
  });
});
