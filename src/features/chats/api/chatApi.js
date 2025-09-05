import apiClient from "@shared/api/client";

export async function fetchUserChats() {
  const res = await apiClient.get("/api/chats");
  return res.data;
}

export default { fetchUserChats };
