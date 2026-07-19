import apiClient from "@shared/api/client";

export async function listBlocks() {
  const res = await apiClient.get("/api/blocks");
  return res.data;
}

export async function blockUser(userId) {
  await apiClient.post(`/api/blocks/${userId}`);
}

export async function unblockUser(userId) {
  await apiClient.delete(`/api/blocks/${userId}`);
}

export default { listBlocks, blockUser, unblockUser };
