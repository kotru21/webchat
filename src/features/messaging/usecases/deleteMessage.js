import { deleteMessage } from "../../../services/api";

export async function deleteMessageUsecase(messageId) {
  await deleteMessage(messageId);
  return { ok: true };
}
