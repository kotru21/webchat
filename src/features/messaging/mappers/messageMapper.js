export function mapMessageDto(dto) {
  if (!dto) return null;
  const sender =
    dto.sender && typeof dto.sender === "object"
      ? dto.sender
      : { _id: dto.sender };
  const receiver =
    dto.receiver && typeof dto.receiver === "object"
      ? dto.receiver
      : dto.receiver
        ? { _id: dto.receiver }
        : null;
  return {
    _id: dto._id,
    content: dto.content || "",
    mediaUrl: dto.mediaUrl || null,
    mediaType: dto.mediaType || null,
    sender,
    receiver,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    isPrivate: !!dto.isPrivate,
  };
}

export function mapMessagesArray(arr) {
  return Array.isArray(arr) ? arr.map(mapMessageDto) : [];
}
