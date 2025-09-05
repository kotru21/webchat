import { pinMessage } from "@features/messaging/api/messagesApi";

export async function pinMessageUsecase(messageId, isPinned) {
  await pinMessage(messageId, isPinned);
  return { ok: true };
}
