import mongoose from "mongoose";

// Схема для истории статусов - для аналитики и логирования
const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ["online", "away", "dnd", "invisible", "offline"],
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

// Схема статуса пользователя
const statusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    current: {
      type: String,
      required: true,
      enum: ["online", "away", "dnd", "invisible", "offline"],
      default: "offline",
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    customMessage: {
      type: String,
      maxlength: 100,
    },
    history: [statusHistorySchema],
  },
  { timestamps: true }
);

// Метод для изменения статуса с сохранением в историю
statusSchema.methods.changeStatus = async function (newStatus) {
  // Закрываем предыдущую запись в истории
  if (this.history.length > 0) {
    const lastRecord = this.history[this.history.length - 1];
    if (!lastRecord.endTime) {
      lastRecord.endTime = new Date();
    }
  }

  // Добавляем новую запись в историю
  this.history.push({
    status: newStatus,
    startTime: new Date(),
  });

  // Обновляем текущий статус
  this.current = newStatus;
  this.lastActivity = new Date();

  return this.save();
};

const Status = mongoose.model("Status", statusSchema);

export default Status;
