import { updateMessage } from "@features/messaging/api/messagesApi";
import { validateEditMessage } from "../domain/validators/messageValidator";
import { mapMessageDto } from "../mappers/messageMapper";

export async function editMessageUsecase(
  messageId,
  { content, file, removeMedia }
) {
  // Валидация использует поле text — прокидываем
  const validation = validateEditMessage({ text: content, file, removeMedia });
  if (!validation.ok) return { ok: false, error: validation.error };
  const formData = new FormData();
  formData.append("content", content || "");
  if (file) formData.append("media", file);
  if (removeMedia) formData.append("removeMedia", "true");
  const dto = await updateMessage(messageId, formData);
  return { ok: true, value: mapMessageDto(dto) };
}
