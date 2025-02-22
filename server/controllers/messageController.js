import Message from "../Models/messageModel.js";

export const getMessages = async (req, res) => {
  try {
    const { receiverId } = req.query;
    let query;

    if (receiverId) {
      // Получаем личные сообщения между двумя пользователями
      query = {
        $or: [
          { sender: req.user._id, receiver: receiverId },
          { sender: receiverId, receiver: req.user._id },
        ],
        isPrivate: true,
      };
    } else {
      // Получаем сообщения общего чата
      query = { isPrivate: false };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .populate("sender", "username email avatar")
      .populate("receiver", "username email avatar")
      .populate("readBy", "username email")
      .lean();

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: error.message });
  }
};

export const saveMessage = async (messageData) => {
  try {
    const message = new Message(messageData);
    await message.save();

    return await Message.findById(message._id)
      .populate("sender", "username email avatar")
      .populate("receiver", "username email avatar")
      .lean();
  } catch (error) {
    console.error("Error saving message:", error);
    throw error;
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findByIdAndUpdate(
      messageId,
      {
        $addToSet: { readBy: userId },
      },
      { new: true }
    )
      .populate("sender", "username email avatar")
      .populate("receiver", "username email avatar")
      .populate("readBy", "username email");

    // Оповещаем всех о прочтении через Socket.IO
    const io = req.app.get("io");
    if (message.isPrivate) {
      io.to(message.sender.toString())
        .to(message.receiver.toString())
        .emit("message_read", { messageId, readBy: message.readBy });
    } else {
      io.to("general").emit("message_read", {
        messageId,
        readBy: message.readBy,
      });
    }

    res.json(message);
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ message: error.message });
  }
};
