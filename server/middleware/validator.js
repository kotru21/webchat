import { body, validationResult } from "express-validator";

export const validateMessage = [
  body("text")
    .optional()
    .trim()
    .escape()
    .isLength({ max: 1000 })
    .withMessage("Сообщение слишком длинное"),
  body("receiverId")
    .optional()
    .isMongoId()
    .withMessage("Неверный формат ID получателя"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateAuth = [
  body("email")
    .isEmail()
    .withMessage("Введите корректный email")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Пароль должен содержать минимум 8 символов")
    .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Пароль должен содержать заглавные и строчные буквы, цифры и специальные символы"
    ),
  body("username")
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("Никнейм должен содержать от 2 до 30 символов")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage(
      "Никнейм может содержать только буквы, цифры и знак подчеркивания"
    ),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
