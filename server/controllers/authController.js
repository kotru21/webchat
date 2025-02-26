import User from "../Models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import passwordValidator from "password-validator";
import {
  generateVerificationToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../utils/emailService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schema = new passwordValidator();
schema
  .is()
  .min(8)
  .has()
  .uppercase()
  .has()
  .lowercase()
  .has()
  .digits(1)
  .has()
  .symbols()
  .has()
  .not()
  .spaces();

export const register = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!schema.validate(password)) {
      return res.status(400).json({
        message:
          "Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, цифры и специальные символы",
      });
    }

    // Проверка существования пользователя
    const existingUser = await User.findOne({
      $or: [{ email }, { username: username || email.split("@")[0] }],
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          existingUser.email === email
            ? "Email уже используется"
            : "Никнейм уже занят",
      });
    }

    // Хеширование пароля
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Генерация токена верификации
    const verificationToken = generateVerificationToken();
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 24); // Токен действителен 24 часа

    // Создание объекта пользователя
    const userData = {
      username: username || email.split("@")[0],
      email,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpires: tokenExpires,
      isVerified: false,
    };

    // Добавляем путь к аватару, если файл был загружен
    if (req.file) {
      userData.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    // Создание нового пользователя
    const user = await User.create(userData);

    // Отправка письма с подтверждением
    const emailSent = await sendVerificationEmail(
      email,
      verificationToken,
      userData.username
    );

    if (!emailSent) {
      console.error("Failed to send verification email");
      // Продолжаем процесс регистрации даже если письмо не отправлено
    }

    res.status(201).json({
      message:
        "Регистрация успешна. На ваш email отправлено письмо с инструкциями по подтверждению аккаунта.",
      id: user._id,
      username: user.username,
      email: user.email,
      isVerified: user.isVerified,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Ошибка при регистрации" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Ищем пользователя с данным токеном, у которого токен не истек
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Недействительная или просроченная ссылка для верификации.",
      });
    }

    // Активируем аккаунт
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    // Создаем токен доступа
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({
      message: "Email успешно подтвержден.",
      token: accessToken,
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      isVerified: user.isVerified,
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ message: "Ошибка при верификации email" });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email уже подтвержден" });
    }

    // Генерация нового токена
    const verificationToken = generateVerificationToken();
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 24);

    // Обновление данных пользователя
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = tokenExpires;
    await user.save();

    // Отправка нового письма
    const emailSent = await sendVerificationEmail(
      email,
      verificationToken,
      user.username
    );

    if (!emailSent) {
      return res.status(500).json({ message: "Ошибка при отправке письма" });
    }

    res.json({ message: "Письмо с инструкциями по верификации отправлено" });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ message: "Ошибка при повторной отправке" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Проверяем наличие обязательных полей
    if (!email || !password) {
      return res.status(400).json({
        message: "Пожалуйста, заполните все поля",
      });
    }

    // Поиск пользователя
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Неверный email или пароль",
      });
    }

    // Проверка пароля
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Неверный email или пароль",
      });
    }

    // Проверка верификации
    if (!user.isVerified) {
      return res.status(401).json({
        message: "Пожалуйста, подтвердите свой email перед входом",
        isVerified: false,
        email: user.email,
      });
    }

    // Создание JWT токена
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    // Отправка успешного ответа
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      token,
      isVerified: user.isVerified,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Ошибка при входе",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    // Генерация токена для сброса пароля
    const resetToken = generateVerificationToken();
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 1); // Токен на 1 час

    // Сохраняем токен в БД
    user.verificationToken = resetToken;
    user.verificationTokenExpires = tokenExpires;
    await user.save();

    // Отправляем письмо
    const emailSent = await sendPasswordResetEmail(
      email,
      resetToken,
      user.username
    );

    if (!emailSent) {
      return res.status(500).json({ message: "Ошибка при отправке письма" });
    }

    res.json({
      message: "Инструкции по сбросу пароля отправлены на ваш email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Ошибка при обработке запроса" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!schema.validate(password)) {
      return res.status(400).json({
        message:
          "Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, цифры и специальные символы",
      });
    }

    // Ищем пользователя с данным токеном
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Недействительная или просроченная ссылка для сброса пароля",
      });
    }

    // Хешируем новый пароль
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Обновляем пароль и убираем токен
    user.password = hashedPassword;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    res.json({ message: "Пароль успешно изменен" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Ошибка при сбросе пароля" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const updates = {};

    if (req.body.username) {
      // Проверяем, не занят ли никнейм
      const existingUser = await User.findOne({
        username: req.body.username,
        _id: { $ne: req.user._id },
      });

      if (existingUser) {
        return res.status(400).json({ message: "Этот никнейм уже занят" });
      }
      updates.username = req.body.username;
    }

    if (req.file) {
      // Удаляем старый аватар
      if (req.user.avatar) {
        const oldAvatarPath = path.join(__dirname, "..", req.user.avatar);
        await fs.unlink(oldAvatarPath).catch(console.error);
      }
      updates.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
    }).select("-password");

    res.json(updatedUser);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: error.message });
  }
};
