import { sendMessage } from "@features/messaging/api/messagesApi";
import { validateNewMessage } from "../domain/validators/messageValidator";
import { mapMessageDto } from "../mappers/messageMapper";

export async function sendMessageUsecase({ text, file, receiverId }) {
  const validation = validateNewMessage({ text, file });
  if (!validation.ok) return { ok: false, error: validation.error };
  const formData = new FormData();
  if (text) formData.append("text", text);
  if (file) formData.append("media", file);
  if (receiverId) formData.append("receiverId", receiverId);
  const dto = await sendMessage(formData);
  return { ok: true, value: mapMessageDto(dto) };
}
