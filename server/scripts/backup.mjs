#!/usr/bin/env node
/**
 * Online SQLite + uploads backup for Secure Chat Lab.
 *
 * Env:
 *   DATABASE_URL  — `file:` path to the SQLite DB (default file:/data/webchat.db)
 *   UPLOADS_DIR   — uploads root (default /app/uploads)
 *   BACKUP_DIR    — destination root (default /backups)
 *   BACKUP_KEEP   — number of newest sets to retain (default 7)
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const parseFileUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("file:")) {
    return url.slice("file:".length);
  }
  return url;
};

const BACKUP_DIR = process.env.BACKUP_DIR || "/backups";
const UPLOADS_DIR = process.env.UPLOADS_DIR || "/app/uploads";
const KEEP = Math.max(1, Number.parseInt(process.env.BACKUP_KEEP || "7", 10) || 7);
const dbPath = parseFileUrl(process.env.DATABASE_URL || "file:/data/webchat.db");

if (!dbPath) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const destDir = path.join(BACKUP_DIR, `webchat-${stamp}`);
const destDb = path.join(destDir, "webchat.db");
const destUploads = path.join(destDir, "uploads");

fs.mkdirSync(destDir, { recursive: true });

const db = new Database(dbPath, { readonly: true, fileMustExist: true });
try {
  await db.backup(destDb);
} finally {
  db.close();
}

if (fs.existsSync(UPLOADS_DIR)) {
  await fs.promises.cp(UPLOADS_DIR, destUploads, { recursive: true });
} else {
  fs.mkdirSync(destUploads, { recursive: true });
}

const entries = fs
  .readdirSync(BACKUP_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith("webchat-"))
  .map((d) => d.name)
  .sort();

while (entries.length > KEEP) {
  const oldest = entries.shift();
  if (!oldest) break;
  fs.rmSync(path.join(BACKUP_DIR, oldest), { recursive: true, force: true });
}

console.log(`Backup written to ${destDir}`);
