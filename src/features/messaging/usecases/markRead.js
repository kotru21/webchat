import { markMessageAsRead } from "@features/messaging/api/messagesApi";

export async function markReadUsecase(message) {
  try {
    await markMessageAsRead(message._id);
    return { ok: true };
  } catch {
    return { ok: false, error: "Не удалось отметить как прочитанное" };
  }
}
