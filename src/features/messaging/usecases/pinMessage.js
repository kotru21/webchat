import api from "../../../services/api";

export async function pinMessageUsecase(messageId, isPinned) {
  await api.put(`/api/messages/${messageId}/pin`, { isPinned });
  return { ok: true };
}
