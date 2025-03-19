import Status from "../Models/Status.js";
import User from "../Models/userModel.js";
import { io } from "../socket.js";

// Получение статуса пользователя
export const getUserStatus = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Сначала проверим, существует ли пользователь
    const user = await User.findById(userId).select("status lastActivity");

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    // Получаем полную информацию о статусе из коллекции Status, если доступна
    const statusDetails = await Status.findOne({ userId });

    // Возвращаем комбинированную информацию
    res.json({
      current: user.status,
      lastActivity: user.lastActivity,
      details: statusDetails || null,
    });
  } catch (error) {
    console.error("Ошибка при получении статуса:", error);
    res.status(500).json({
      message: "Ошибка сервера при получении статуса",
      error: error.message,
    });
  }
};

// Обновление статуса пользователя
export const updateStatus = async (req, res) => {
  try {
    const userId = req.user._id; // ID из JWT токена
    const { status } = req.body;

    if (
      !status ||
      !["online", "away", "dnd", "invisible", "offline"].includes(status)
    ) {
      return res.status(400).json({ message: "Указан недопустимый статус" });
    }

    // Обновляем статус в модели User
    const user = await User.findByIdAndUpdate(
      userId,
      {
        status,
        lastActivity: new Date(),
      },
      { new: true }
    ).select("-password");

    // Ищем или создаем запись в коллекции Status
    let statusRecord = await Status.findOne({ userId });

    if (statusRecord) {
      // Обновляем существующую запись
      await statusRecord.changeStatus(status);
    } else {
      // Создаем новую запись статуса
      statusRecord = new Status({
        userId,
        current: status,
        history: [{ status, startTime: new Date() }],
      });
      await statusRecord.save();
    }

    // Оповещаем других пользователей через сокеты
    const ioInstance = req.app.get("io") || io;
    if (ioInstance) {
      ioInstance.emit("userStatusChanged", {
        userId,
        status,
        lastActivity: new Date(),
      });
    }

    res.json({ user, statusDetails: statusRecord });
  } catch (error) {
    console.error("Ошибка при обновлении статуса:", error);
    res.status(500).json({
      message: "Ошибка сервера при обновлении статуса",
      error: error.message,
    });
  }
};

// Обновление статуса активности
export const updateActivity = async (req, res) => {
  try {
    const userId = req.user._id;

    // Обновляем только время активности
    await User.findByIdAndUpdate(userId, { lastActivity: new Date() });

    res.json({ message: "Активность обновлена" });
  } catch (error) {
    console.error("Ошибка при обновлении активности:", error);
    res.status(500).json({
      message: "Ошибка при обновлении активности",
      error: error.message,
    });
  }
};
