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

    // Проверяем, есть ли контент или медиафайл
    if (!messageData.content && !messageData.mediaUrl) {
      throw new Error("Message must have either content or media");
    }

    // Создаем новое сообщение
    const message = new Message({
      sender: messageData.sender,
      senderUsername: messageData.senderUsername,
      content: messageData.content || "",
      mediaUrl: messageData.mediaUrl || null,
      mediaType: messageData.mediaType || null,
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
