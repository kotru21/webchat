import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 60, // bcrypt хеши всегда имеют длину 60 символов
    },
    avatar: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "offline",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);
