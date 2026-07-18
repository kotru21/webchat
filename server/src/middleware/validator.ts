import type { RequestHandler } from "express";
import { body, validationResult } from "express-validator";

const USERNAME_PATTERN = /^[\p{L}\p{N}_.-]+$/u;
const DESCRIPTION_MAX = 500;

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
    .isLength({ min: 2, max: 30 })
    .withMessage("Никнейм должен содержать от 2 до 30 символов")
    .matches(USERNAME_PATTERN)
    .withMessage("Никнейм может содержать только буквы, цифры, _, . и -");

export const validateMessage = [
  body("text")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Сообщение слишком длинное"),
  body("content")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Сообщение слишком длинное"),
  body("receiverId")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 64 })
    .withMessage("Неверный формат ID получателя"),
  handleValidationErrors,
];

export const validateRegister = [
  body("email")
    .isEmail()
    .withMessage("Введите корректный email")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Пароль должен содержать минимум 8 символов")
    .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
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
    .withMessage("Пароль обязателен"),
  handleValidationErrors,
];

export const isValidUsername = (value: string): boolean => {
  const trimmed = value.trim();
  return (
    trimmed.length >= 2 &&
    trimmed.length <= 30 &&
    USERNAME_PATTERN.test(trimmed)
  );
};

export const clampDescription = (value: string): string =>
  value.trim().slice(0, DESCRIPTION_MAX);
