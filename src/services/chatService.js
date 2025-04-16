import api from "./api";

class ChatService {
  // Получение списка чатов пользователя
  async getUserChats() {
    try {
      const response = await api.get("/api/chats");
      return response.data;
    } catch (error) {
      console.error("Ошибка при получении списка чатов:", error);
      throw error;
    }
  }
}

export default new ChatService();
