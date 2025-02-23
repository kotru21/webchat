import User from "../Models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import passwordValidator from "password-validator";

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
    console.log("Password hashing:", {
      originalPassword: password,
      salt,
      hashedPassword,
    });

    // Создание объекта пользователя
    const userData = {
      username: username || email.split("@")[0],
      email,
      password: hashedPassword,
    };

    // Добавляем путь к аватару, если файл был загружен
    if (req.file) {
      userData.avatar = `/uploads/avatars/${req.file.filename}`;
      console.log("Avatar path:", userData.avatar);
    }

    // Создание нового пользователя
    const user = await User.create(userData);

    // Создание JWT токена
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(201).json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Ошибка при регистрации" });
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

    // Поиск пользователя с подробным логированием
    const user = await User.findOne({ email });
    console.log("Login attempt:", {
      email,
      userFound: !!user,
      storedHash: user?.password,
      attemptedPassword: password,
    });

    if (!user) {
      return res.status(400).json({
        message: "Неверный email или пароль",
      });
    }

    // Проверка пароля
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password check:", {
      isMatch,
      passwordLength: password.length,
      hashLength: user.password.length,
    });

    if (!isMatch) {
      return res.status(400).json({
        message: "Неверный email или пароль",
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
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Ошибка при входе",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
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
