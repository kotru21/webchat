import api from "./api";
import { USER_STATUSES } from "../constants/statusConstants";

class StatusService {
  // Получение статуса пользователя
  async getUserStatus(userId) {
    try {
      const response = await api.get(`/api/status/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Ошибка при получении статуса:", error);
      throw error;
    }
  }

  // Обновление статуса пользователя
  async updateStatus(status) {
    try {
      const response = await api.put("/api/status/update", { status });
      return response.data;
    } catch (error) {
      console.error("Ошибка при обновлении статуса:", error);
      throw error;
    }
  }

  // Обновление только активности
  async updateActivity() {
    try {
      const response = await api.put("/api/status/activity");
      return response.data;
    } catch (error) {
      console.error("Ошибка при обновлении активности:", error);
      return null; // Тихая ошибка
    }
  }

  // Установка статуса offline при выходе
  async setOfflineStatus() {
    return this.updateStatus(USER_STATUSES.OFFLINE);
  }
}

export default new StatusService();
