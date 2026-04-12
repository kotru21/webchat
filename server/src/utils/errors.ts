export type ErrorDetails = Record<string, unknown> | undefined;

export class HttpError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details: ErrorDetails;

  constructor(statusCode: number, message: string, code = "HTTP_ERROR", details?: ErrorDetails) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const createHttpError = (
  statusCode: number,
  message: string,
  code = "HTTP_ERROR",
  details?: ErrorDetails
): HttpError => {
  return new HttpError(statusCode, message, code, details);
};

export const isHttpError = (error: unknown): error is HttpError => {
  return error instanceof HttpError;
};
