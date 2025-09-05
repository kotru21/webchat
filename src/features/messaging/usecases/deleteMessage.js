import { deleteMessage } from "@features/messaging/api/messagesApi";

export async function deleteMessageUsecase(messageId) {
  await deleteMessage(messageId);
  return { ok: true };
}
