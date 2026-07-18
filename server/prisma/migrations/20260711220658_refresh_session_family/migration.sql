/*
  Warnings:

  - Added the required column `familyId` to the `RefreshSession` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RefreshSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefreshSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RefreshSession" ("createdAt", "expiresAt", "id", "revokedAt", "tokenHash", "userId") SELECT "createdAt", "expiresAt", "id", "revokedAt", "tokenHash", "userId" FROM "RefreshSession";
DROP TABLE "RefreshSession";
ALTER TABLE "new_RefreshSession" RENAME TO "RefreshSession";
CREATE UNIQUE INDEX "RefreshSession_tokenHash_key" ON "RefreshSession"("tokenHash");
CREATE INDEX "RefreshSession_userId_revokedAt_idx" ON "RefreshSession"("userId", "revokedAt");
CREATE INDEX "RefreshSession_familyId_idx" ON "RefreshSession"("familyId");
CREATE INDEX "RefreshSession_expiresAt_idx" ON "RefreshSession"("expiresAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
