import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null для общего чата
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
      default: "general",
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isPinned: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ isPrivate: 1 });

export default mongoose.model("Message", messageSchema);
