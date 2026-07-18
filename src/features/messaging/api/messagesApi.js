import apiClient from "@shared/api/client";

export async function getMessages(receiverId) {
  if (!receiverId) {
    throw new Error("receiverId is required");
  }
  const res = await apiClient.get(`/api/messages?receiverId=${receiverId}`);
  return res.data;
}

export async function sendMessage(formData) {
  const res = await apiClient.post("/api/messages", formData);
  return res.data;
}

export default {
  getMessages,
  sendMessage,
};
