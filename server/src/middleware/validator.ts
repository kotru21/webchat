import type { RequestHandler } from "express";
import { body, validationResult } from "express-validator";

const handleValidationErrors: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const validateMessage = [
  body("text")
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
  body("username")
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("Никнейм должен содержать от 2 до 30 символов")
    .matches(/^[\p{L}\p{N}_.-]+$/u)
    .withMessage(
      "Никнейм может содержать только буквы, цифры, _, . и -"
    ),
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
