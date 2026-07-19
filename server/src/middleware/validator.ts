import type { RequestHandler } from "express";
import { body, validationResult } from "express-validator";
import {
  DESCRIPTION_MAX,
  USERNAME_MAX,
  USERNAME_MIN,
  USERNAME_PATTERN,
} from "../utils/profileFields.js";
import {
  normalizeContentFormat,
  PLAIN_CONTENT_MAX,
  validateE2eeEnvelopeContent,
} from "../utils/e2eeEnvelope.js";
import { createHttpError } from "../utils/errors.js";

const handleValidationErrors: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const optionalUsername = () =>
  body("username")
    .optional()
    .trim()
    .customSanitizer((value) =>
      typeof value === "string" ? value.normalize("NFKC") : value
    )
    .isLength({ min: USERNAME_MIN, max: USERNAME_MAX })
    .withMessage("Никнейм должен содержать от 2 до 30 символов")
    .matches(USERNAME_PATTERN)
    .withMessage("Никнейм может содержать только буквы, цифры, _, . и -");

/**
 * Message body validation. For e2ee-v1 we must NOT trim `content`/`text`
 * (envelope must stay byte-identical). Format-aware checks live in a custom
 * middleware after express-validator field presence checks.
 */
export const validateMessageContentFormat: RequestHandler = (req, _res, next) => {
  const format = normalizeContentFormat(req.body?.contentFormat);
  if (format === null) {
    return next(
      createHttpError(400, "Некорректный формат сообщения", "INVALID_FORMAT")
    );
  }
  req.body.contentFormat = format;

  const rawContent =
    typeof req.body.text === "string"
      ? req.body.text
      : typeof req.body.content === "string"
        ? req.body.content
        : undefined;

  if (format === "e2ee-v1") {
    if (typeof rawContent !== "string") {
      return next(
        createHttpError(400, "Некорректный конверт E2EE", "INVALID_ENVELOPE")
      );
    }
    // Do not trim — persist verbatim.
    const err = validateE2eeEnvelopeContent(rawContent);
    if (err) {
      return next(
        createHttpError(400, "Некорректный конверт E2EE", "INVALID_ENVELOPE")
      );
    }
    // Prefer content field for downstream; keep text in sync if that was used.
    if (typeof req.body.content !== "string" && typeof req.body.text === "string") {
      req.body.content = req.body.text;
    }
    return next();
  }

  // plain / absent — existing 1000-char trim rule.
  if (typeof rawContent === "string") {
    const trimmed = rawContent.trim();
    if (trimmed.length > PLAIN_CONTENT_MAX) {
      return next(
        createHttpError(400, "Сообщение слишком длинное", "TOO_LONG")
      );
    }
    if (typeof req.body.text === "string") req.body.text = trimmed;
    if (typeof req.body.content === "string") req.body.content = trimmed;
  }
  return next();
};

export const validateMessage = [
  body("contentFormat")
    .optional()
    .isIn(["plain", "e2ee-v1"])
    .withMessage("Некорректный формат сообщения"),
  body("receiverId")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 64 })
    .withMessage("Неверный формат ID получателя"),
  handleValidationErrors,
  validateMessageContentFormat,
];

export const validateRegister = [
  body("email")
    .isEmail()
    .withMessage("Введите корректный email")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8, max: 72 })
    .withMessage("Пароль должен содержать от 8 до 72 символов")
    .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/)
    .withMessage(
      "Пароль должен содержать заглавные и строчные буквы, цифры и специальные символы"
    ),
  optionalUsername(),
  handleValidationErrors,
];

export const validateProfile = [
  optionalUsername(),
  body("description")
    .optional()
    .trim()
    .isLength({ max: DESCRIPTION_MAX })
    .withMessage(`Описание не должно превышать ${DESCRIPTION_MAX} символов`),
  handleValidationErrors,
];

export const validateLogin = [
  body("email")
    .isEmail()
    .withMessage("Введите корректный email")
    .normalizeEmail(),
  body("password")
    .isString()
    .notEmpty()
    .withMessage("Пароль обязателен")
    .isLength({ max: 72 })
    .withMessage("Пароль слишком длинный"),
  handleValidationErrors,
];
