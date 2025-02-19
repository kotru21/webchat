import Message from "../Models/messageModel.js";

export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ roomId: "general" })
      .sort({ createdAt: 1 })
      .limit(50);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const saveMessage = async (messageData) => {
  try {
    const message = await Message.create(messageData);
    return message;
  } catch (error) {
    console.error("Error saving message:", error);
    return null;
  }
};
