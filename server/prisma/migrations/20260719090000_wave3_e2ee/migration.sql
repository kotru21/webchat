-- AlterTable
ALTER TABLE "Message" ADD COLUMN "contentFormat" TEXT NOT NULL DEFAULT 'plain';

-- CreateTable
CREATE TABLE "E2eeKey" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "publicKeyJwk" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "E2eeKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
