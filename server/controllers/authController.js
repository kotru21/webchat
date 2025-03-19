import User from "../Models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import passwordValidator from "password-validator";

export const updateProfile = async (req, res) => {
  try {
    const { username, description } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    if (username) user.username = username;
    if (description) user.description = description;

    if (req.files) {
      if (req.files.avatar) {
        user.avatar = `/uploads/avatars/${req.files.avatar[0].filename}`;
      }
      if (req.files.banner) {
        user.banner = `/uploads/banners/${req.files.banner[0].filename}`;
      }
    }

    await user.save();
    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Ошибка при обновлении профиля", error: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }
    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Ошибка при получении профиля", error: error.message });
  }
};

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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      username: username || email.split("@")[0],
      email,
      password: hashedPassword,
    };

    if (req.file) {
      userData.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    const user = await User.create(userData);

    res.status(201).json({
      message: "Регистрация успешна.",
      id: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Ошибка при регистрации" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Пожалуйста, заполните все поля",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Неверный email или пароль",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Неверный email или пароль",
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    // Обновляем статус пользователя при входе
    user.status = "online";
    user.lastActivity = new Date();
    await user.save();

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      status: user.status,
      lastActivity: user.lastActivity,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Ошибка при входе" });
  }
};

export const logout = async (req, res) => {
  try {
    // Получаем пользователя из токена
    const userId = req.user._id;

    // Обновляем статус пользователя на "offline"
    await User.findByIdAndUpdate(userId, {
      status: "offline",
      lastActivity: new Date(),
    });

    // Обновляем запись в таблице Status, если она существует
    const statusRecord = await Status.findOne({ userId });
    if (statusRecord) {
      await statusRecord.changeStatus("offline");
    }

    // Оповещаем других пользователей
    const io = req.app.get("io");
    if (io) {
      io.emit("userStatusChanged", {
        userId,
        status: "offline",
        lastActivity: new Date(),
      });
    }

    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Ошибка при выходе из системы" });
  }
};
