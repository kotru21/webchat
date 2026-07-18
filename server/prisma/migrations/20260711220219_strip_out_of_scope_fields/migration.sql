/*
  Warnings:

  - You are about to drop the `MessageRead` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StatusHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `isDeleted` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `isEdited` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `isPinned` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `isVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastActivity` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `verificationToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `verificationTokenExpires` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "MessageRead_readAt_idx";

-- DropIndex
DROP INDEX "MessageRead_userId_idx";

-- DropIndex
DROP INDEX "StatusHistory_userId_endTime_idx";

-- DropIndex
DROP INDEX "StatusHistory_userId_startTime_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "MessageRead";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "StatusHistory";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT,
    "senderUsername" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "audioDuration" INTEGER,
    "roomId" TEXT NOT NULL DEFAULT 'general',
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("audioDuration", "content", "createdAt", "id", "isPrivate", "mediaType", "mediaUrl", "receiverId", "roomId", "senderId", "senderUsername", "updatedAt") SELECT "audioDuration", "content", "createdAt", "id", "isPrivate", "mediaType", "mediaUrl", "receiverId", "roomId", "senderId", "senderUsername", "updatedAt" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
CREATE INDEX "Message_senderId_receiverId_idx" ON "Message"("senderId", "receiverId");
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");
CREATE INDEX "Message_isPrivate_idx" ON "Message"("isPrivate");
CREATE INDEX "Message_receiverId_createdAt_idx" ON "Message"("receiverId", "createdAt");
CREATE INDEX "Message_senderId_createdAt_idx" ON "Message"("senderId", "createdAt");
CREATE INDEX "Message_receiverId_senderId_createdAt_idx" ON "Message"("receiverId", "senderId", "createdAt");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatar" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "banner" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatar", "banner", "createdAt", "description", "email", "id", "passwordHash", "updatedAt", "username") SELECT "avatar", "banner", "createdAt", "description", "email", "id", "passwordHash", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
