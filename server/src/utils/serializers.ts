import type { Message, User } from "../generated/prisma/client.js";
import type { AuthenticatedUser, OwnUser, PublicUser } from "../types/auth.js";
import { canonicalizeMediaApiUrl } from "./uploads.js";

type PublicUserSelection = Pick<
  User,
  | "id"
  | "username"
  | "avatar"
  | "banner"
  | "description"
  | "createdAt"
  | "updatedAt"
>;

type OwnUserSelection = PublicUserSelection & Pick<User, "email">;

type MessageWithRelations = Message & {
  sender: PublicUserSelection;
  receiver: PublicUserSelection | null;
};

export const toPublicUser = (user: PublicUserSelection): PublicUser => ({
  _id: user.id,
  username: user.username,
  avatar: user.avatar,
  banner: canonicalizeMediaApiUrl(user.banner) ?? user.banner,
  description: user.description,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const toOwnUser = (user: OwnUserSelection): OwnUser => ({
  ...toPublicUser(user),
  email: user.email,
});

/** @deprecated Prefer toPublicUser / toOwnUser */
export const toSafeUser = toOwnUser;

export const toAuthUser = (user: OwnUserSelection): AuthenticatedUser => ({
  id: user.id,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
});

export const toMessageDto = (message: MessageWithRelations) => {
  return {
    _id: message.id,
    sender: toPublicUser(message.sender),
    receiver: message.receiver ? toPublicUser(message.receiver) : null,
    senderUsername: message.senderUsername,
    content: message.content,
    contentFormat: message.contentFormat,
    mediaUrl: message.mediaUrl,
    mediaType: message.mediaType,
    audioDuration: message.audioDuration,
    roomId: message.roomId,
    isPrivate: message.isPrivate,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
};
