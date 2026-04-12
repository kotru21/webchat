import type { Message, MessageRead, User } from "../generated/prisma/client.js";
import type { AuthenticatedUser, SafeUser } from "../types/auth.js";

type UserSelection = Pick<
  User,
  | "id"
  | "username"
  | "email"
  | "avatar"
  | "banner"
  | "description"
  | "isVerified"
  | "createdAt"
  | "updatedAt"
>;

type ReadWithUser = MessageRead & { user: UserSelection };

type MessageWithRelations = Message & {
  sender: UserSelection;
  receiver: UserSelection | null;
  readBy: ReadWithUser[];
};

export const toSafeUser = (user: UserSelection): SafeUser => ({
  _id: user.id,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  banner: user.banner,
  description: user.description,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const toAuthUser = (user: UserSelection): AuthenticatedUser => ({
  id: user.id,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
});

export const toMessageDto = (message: MessageWithRelations) => {
  return {
    _id: message.id,
    sender: toSafeUser(message.sender),
    receiver: message.receiver ? toSafeUser(message.receiver) : null,
    senderUsername: message.senderUsername,
    content: message.content,
    mediaUrl: message.mediaUrl,
    mediaType: message.mediaType,
    audioDuration: message.audioDuration,
    roomId: message.roomId,
    isPrivate: message.isPrivate,
    readBy: message.readBy.map((item) => toSafeUser(item.user)),
    isEdited: message.isEdited,
    isDeleted: message.isDeleted,
    isPinned: message.isPinned,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
};
