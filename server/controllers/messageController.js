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
