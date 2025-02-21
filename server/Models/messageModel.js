import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderUsername: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: "", // для картинок
    },
    mediaUrl: {
      type: String,
      default: null,
    },
    mediaType: {
      type: String,
      enum: ["image", "video", null],
      default: null,
    },
    roomId: {
      type: String,
      required: true,
      default: "general",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Message", messageSchema);
