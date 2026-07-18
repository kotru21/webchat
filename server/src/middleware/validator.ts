import type { RequestHandler } from "express";
import { body, validationResult } from "express-validator";
import {
  DESCRIPTION_MAX,
  USERNAME_MAX,
  USERNAME_MIN,
  USERNAME_PATTERN,
} from "../utils/profileFields.js";

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
