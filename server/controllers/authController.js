import User from "../Models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Создаем username из email
    const username = email.split("@")[0];

    // Проверка существования пользователя
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: "Пользователь уже существует" });
    }

    // Хеширование пароля
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Создание объекта пользователя
    const userData = {
      username,
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
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Поиск пользователя
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    // Проверка пароля
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Неверный пароль" });
    }

    // Создание JWT токена
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    // Отправка ответа
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Ошибка при входе" });
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
