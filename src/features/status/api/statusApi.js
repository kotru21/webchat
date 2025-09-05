import apiClient from "@shared/api/client";

export async function getUserStatus(userId) {
  const res = await apiClient.get(`/api/status/${userId}`);
  return res.data;
}

export async function updateStatus(status) {
  const res = await apiClient.put("/api/status/update", { status });
  return res.data;
}

export async function updateActivity() {
  try {
    const res = await apiClient.put("/api/status/activity");
    return res.data;
  } catch {
    return null; // тихая ошибка
  }
}

export default { getUserStatus, updateStatus, updateActivity };
