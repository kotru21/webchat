import { Prisma } from "../generated/prisma/client.js";
import prisma from "../config/prisma.js";
import { toPublicUser } from "../utils/serializers.js";
import { userPublicSelect } from "./dbShapes.js";

interface ChatListRow {
  otherUserId: string;
  messageId: string;
  content: string;
  contentFormat: string;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: string;
  senderId: string;
  receiverId: string | null;
}

export const getUserChatsList = async (userId: string) => {
  const rows = await prisma.$queryRaw<ChatListRow[]>(Prisma.sql`
    WITH private_messages AS (
      SELECT
        m.id,
        m.senderId,
        m.receiverId,
        m.content,
        m.contentFormat,
        m.mediaUrl,
        m.mediaType,
        m.createdAt,
        CASE WHEN m.senderId = ${userId} THEN m.receiverId ELSE m.senderId END AS otherUserId
      FROM "Message" m
      WHERE m.isPrivate = 1
        AND (m.senderId = ${userId} OR m.receiverId = ${userId})
    ),
    ranked AS (
      SELECT
        private_messages.*,
        ROW_NUMBER() OVER (PARTITION BY otherUserId ORDER BY createdAt DESC) AS rn
      FROM private_messages
      WHERE otherUserId IS NOT NULL
    )
    SELECT
      ranked.otherUserId,
      ranked.id AS messageId,
      ranked.content,
      ranked.contentFormat,
      ranked.mediaUrl,
      ranked.mediaType,
      ranked.createdAt,
      ranked.senderId,
      ranked.receiverId
    FROM ranked
    WHERE ranked.rn = 1
    ORDER BY ranked.createdAt DESC;
  `);

  if (rows.length === 0) {
    return [];
  }

  const otherUserIds = rows.map((row) => row.otherUserId);

  const users = await prisma.user.findMany({
    where: { id: { in: otherUserIds } },
    select: userPublicSelect,
  });

  const usersById = new Map(users.map((user) => [user.id, user]));

  return rows
    .map((row) => {
      const user = usersById.get(row.otherUserId);
      if (!user) return undefined;

      return {
        user: toPublicUser(user),
        lastMessage: {
          _id: row.messageId,
          content: row.content,
          contentFormat: row.contentFormat || "plain",
          mediaUrl: row.mediaUrl,
          mediaType: row.mediaType,
          createdAt: new Date(row.createdAt),
          sender: row.senderId,
          receiver: row.receiverId,
        },
        unreadCount: 0,
      };
    })
    .filter((chat): chat is NonNullable<typeof chat> => Boolean(chat));
};
