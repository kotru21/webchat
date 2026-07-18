import type { Request, Response } from "express";
import multer from "multer";
import { describe, expect, it, vi } from "vitest";
import { createHttpError } from "../utils/errors.js";
import { errorHandler } from "./errorHandler.js";

const mockRes = () => {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
};

describe("errorHandler multer mapping", () => {
  it("maps LIMIT_FILE_SIZE to 413", () => {
    const res = mockRes();
    errorHandler(
      new multer.MulterError("LIMIT_FILE_SIZE"),
      {} as Request,
      res,
      vi.fn()
    );
    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "LIMIT_FILE_SIZE" })
    );
  });

  it("maps LIMIT_FIELD_VALUE to 413", () => {
    const res = mockRes();
    errorHandler(
      new multer.MulterError("LIMIT_FIELD_VALUE"),
      {} as Request,
      res,
      vi.fn()
    );
    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "LIMIT_FIELD_VALUE" })
    );
  });

  it("maps fileFilter rejection to 400", () => {
    const res = mockRes();
    errorHandler(
      new Error("Разрешены только изображения"),
      {} as Request,
      res,
      vi.fn()
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "UNSUPPORTED_FILE_TYPE" })
    );
  });

  it("still maps HttpError by statusCode", () => {
    const res = mockRes();
    errorHandler(
      createHttpError(400, "bad", "BAD"),
      {} as Request,
      res,
      vi.fn()
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
