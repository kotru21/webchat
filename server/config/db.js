import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env загрузка
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log("MongoDB connect uri:", mongoUri);

    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // события соединения
    mongoose.connection.on("error", (err) => {
      console.error("Ошибка подключения к MongoDB:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });

    mongoose.connection.on("connected", () => {
      console.log("MongoDB успешно подключена");
    });
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

export default connectDB;
