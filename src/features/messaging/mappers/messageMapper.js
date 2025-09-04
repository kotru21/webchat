// Map backend DTO to a normalized message object
export function mapMessageDto(dto) {
  if (!dto) return null;
  const sender =
    dto.sender && typeof dto.sender === "object"
      ? dto.sender
      : { _id: dto.sender };
  const receiver =
    dto.receiver && typeof dto.receiver === "object"
      ? dto.receiver
      : { _id: dto.receiver };
  return {
    _id: dto._id,
    content: dto.content || "",
    mediaUrl: dto.mediaUrl || null,
    mediaType: dto.mediaType || null,
    isDeleted: !!dto.isDeleted,
    isPinned: !!dto.isPinned,
    sender,
    receiver,
    readBy: dto.readBy || [],
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapMessagesArray(arr) {
  return Array.isArray(arr) ? arr.map(mapMessageDto) : [];
}
