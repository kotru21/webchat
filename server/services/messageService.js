import Message from "../Models/messageModel.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// unlink файла
async function safeUnlink(relativePath) {
  if (!relativePath) return;
  try {
    const full = path.join(__dirname, "..", relativePath.replace(/^\/+/, ""));
    await fs.unlink(full);
  } catch {
    // ignore missing
  }
}

export async function createMessage(data) {
  const msg = new Message(data);
  await msg.save();
  return await Message.findById(msg._id)
    .populate("sender", "username email avatar")
    .populate("receiver", "username email avatar")
    .populate("readBy", "username email")
    .lean();
}

export async function listMessages({
  userId,
  receiverId,
  page = 1,
  limit = 50,
}) {
  const skip = (page - 1) * limit;
  const query = receiverId
    ? {
        $or: [
          { sender: userId, receiver: receiverId },
          { sender: receiverId, receiver: userId },
        ],
      }
    : { isPrivate: false };
  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate("sender", "username email avatar")
    .populate("readBy", "username email")
    .lean();
  await Message.populate(messages, {
    path: "receiver",
    select: "username email avatar",
  });
  return messages.reverse();
}

export async function markMessageRead({ messageId, userId }) {
  const message = await Message.findByIdAndUpdate(
    messageId,
    { $addToSet: { readBy: userId } },
    { new: true }
  )
    .populate("sender", "username email avatar")
    .populate("receiver", "username email avatar")
    .populate("readBy", "username email");
  return message;
}

export async function updateMessageContent({ messageId, updateData }) {
  const msg = await Message.findById(messageId);
  if (!msg) return null;
  if (msg.isDeleted) return null;
  Object.assign(msg, updateData, { isEdited: true });
  await msg.save();
  return await Message.findById(msg._id)
    .populate("sender", "username email avatar")
    .populate("receiver", "username email avatar")
    .populate("readBy", "username email");
}

export async function softDeleteMessage({ messageId }) {
  const msg = await Message.findById(messageId);
  if (!msg) return null;
  if (msg.mediaUrl) await safeUnlink(msg.mediaUrl);
  msg.isDeleted = true;
  msg.content = "Сообщение удалено";
  msg.mediaUrl = null;
  msg.mediaType = null;
  msg.audioDuration = null;
  msg.isEdited = true;
  await msg.save();
  return await Message.findById(msg._id)
    .populate("sender", "username email avatar")
    .populate("receiver", "username email avatar")
    .populate("readBy", "username email");
}

export async function setPinned({ messageId, isPinned }) {
  const msg = await Message.findById(messageId);
  if (!msg) return null;
  msg.isPinned = !!isPinned;
  await msg.save();
  return msg;
}
