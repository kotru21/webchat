import Message from "../Models/messageModel.js";

export const getMessages = async (req, res) => {
  try {
    console.log("Getting messages...");
    const messages = await Message.find()
      .sort({ createdAt: 1 })
      .populate("sender", "username email avatar")
      .lean();

    console.log(`Found ${messages.length} messages`);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: error.message });
  }
};

export const saveMessage = async (messageData) => {
  try {
    console.log("Saving message with data:", messageData);

    // Проверяем наличие необходимых полей
    if (!messageData.sender || !messageData.content) {
      throw new Error("Missing required fields");
    }

    // Создаем новое сообщение
    const message = new Message({
      sender: messageData.sender,
      senderUsername: messageData.senderUsername,
      content: messageData.content,
      roomId: messageData.roomId || "general",
    });

    // Сохраняем сообщение
    await message.save();

    // Получаем сохраненное сообщение с данными отправителя
    const savedMessage = await Message.findById(message._id)
      .populate("sender", "username email avatar")
      .lean();

    console.log("Message saved successfully:", savedMessage);
    return savedMessage;
  } catch (error) {
    console.error("Error saving message:", error);
    throw error;
  }
};
