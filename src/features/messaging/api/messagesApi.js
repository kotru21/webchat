import apiClient from "@shared/api/client";

export async function getMessages(receiverId = null) {
  const url = receiverId
    ? `/api/messages?receiverId=${receiverId}`
    : "/api/messages";
  const res = await apiClient.get(url);
  return res.data;
}

export async function sendMessage(formData) {
  const res = await apiClient.post("/api/messages", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function markMessageAsRead(messageId) {
  const res = await apiClient.post(`/api/messages/${messageId}/read`);
  return res.data;
}

export async function updateMessage(messageId, formData) {
  const res = await apiClient.put(`/api/messages/${messageId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function deleteMessage(messageId) {
  const res = await apiClient.delete(`/api/messages/${messageId}`);
  return res.data;
}

export async function pinMessage(messageId, isPinned) {
  const res = await apiClient.put(`/api/messages/${messageId}/pin`, {
    isPinned,
  });
  return res.data;
}

export default {
  getMessages,
  sendMessage,
  markMessageAsRead,
  updateMessage,
  deleteMessage,
  pinMessage,
};
