import { Prisma } from "../generated/prisma/client.js";
import prisma from "../config/prisma.js";
import { toSafeUser } from "../utils/serializers.js";
import { userPublicSelect } from "./dbShapes.js";

type ChatListRow = {
  otherUserId: string;
  messageId: string;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  isDeleted: number;
  createdAt: string;
  senderId: string;
  receiverId: string | null;
  isPinned: number;
  unreadCount: number;
};

export const getUserChatsList = async (userId: string) => {
  const rows = await prisma.$queryRaw<ChatListRow[]>(Prisma.sql`
    WITH private_messages AS (
      SELECT
        m.id,
        m.senderId,
        m.receiverId,
        m.content,
        m.mediaUrl,
        m.mediaType,
        m.isDeleted,
        m.isPinned,
        m.createdAt,
        CASE WHEN m.senderId = ${userId} THEN m.receiverId ELSE m.senderId END AS otherUserId
      FROM "Message" m
      WHERE m.isPrivate = 1
        AND m.isDeleted = 0
        AND (m.senderId = ${userId} OR m.receiverId = ${userId})
    ),
    ranked AS (
      SELECT
        private_messages.*,
        ROW_NUMBER() OVER (PARTITION BY otherUserId ORDER BY createdAt DESC) AS rn
      FROM private_messages
      WHERE otherUserId IS NOT NULL
    ),
    unread AS (
      SELECT
        CASE WHEN m.senderId = ${userId} THEN m.receiverId ELSE m.senderId END AS otherUserId,
        SUM(
          CASE
            WHEN m.senderId != ${userId}
              AND NOT EXISTS (
                SELECT 1
                FROM "MessageRead" mr
                WHERE mr.messageId = m.id
                  AND mr.userId = ${userId}
              )
            THEN 1
            ELSE 0
          END
        ) AS unreadCount
      FROM "Message" m
      WHERE m.isPrivate = 1
        AND m.isDeleted = 0
        AND (m.senderId = ${userId} OR m.receiverId = ${userId})
      GROUP BY otherUserId
    )
    SELECT
      ranked.otherUserId,
      ranked.id AS messageId,
      ranked.content,
      ranked.mediaUrl,
      ranked.mediaType,
      ranked.isDeleted,
      ranked.createdAt,
      ranked.senderId,
      ranked.receiverId,
      ranked.isPinned,
      COALESCE(unread.unreadCount, 0) AS unreadCount
    FROM ranked
    LEFT JOIN unread ON unread.otherUserId = ranked.otherUserId
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
        user: toSafeUser(user),
        lastMessage: {
          _id: row.messageId,
          content: row.content,
          mediaUrl: row.mediaUrl,
          mediaType: row.mediaType,
          isDeleted: Boolean(row.isDeleted),
          createdAt: new Date(row.createdAt),
          sender: row.senderId,
          receiver: row.receiverId,
          isPinned: Boolean(row.isPinned),
        },
        unreadCount: Number(row.unreadCount),
      };
    })
    .filter((chat): chat is NonNullable<typeof chat> => Boolean(chat));
};
