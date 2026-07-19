import Database from "better-sqlite3";
import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const scriptPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../scripts/backup.mjs"
);

describe("backup.mjs", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("backs up sqlite + uploads and prunes old sets", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "webchat-backup-"));
    tempDirs.push(root);

    const dbPath = path.join(root, "live.db");
    const uploadsDir = path.join(root, "uploads");
    const backupDir = path.join(root, "backups");
    fs.mkdirSync(uploadsDir, { recursive: true });
    fs.mkdirSync(backupDir, { recursive: true });
    fs.writeFileSync(path.join(uploadsDir, "note.txt"), "hello-media");

    const live = new Database(dbPath);
    live.exec("CREATE TABLE ping (id INTEGER PRIMARY KEY, msg TEXT)");
    live.prepare("INSERT INTO ping (msg) VALUES (?)").run("alive");
    live.close();

    const runBackup = async () => {
      await execFileAsync(process.execPath, [scriptPath], {
        env: {
          ...process.env,
          DATABASE_URL: `file:${dbPath}`,
          UPLOADS_DIR: uploadsDir,
          BACKUP_DIR: backupDir,
          BACKUP_KEEP: "1",
        },
      });
    };

    await runBackup();
    // Brief delay so ISO stamp directories differ.
    await new Promise((r) => setTimeout(r, 1100));
    await runBackup();

    const sets = fs
      .readdirSync(backupDir)
      .filter((name) => name.startsWith("webchat-"));
    expect(sets).toHaveLength(1);

    const setDir = path.join(backupDir, sets[0]!);
    const backupDbPath = path.join(setDir, "webchat.db");
    expect(fs.existsSync(backupDbPath)).toBe(true);
    expect(fs.existsSync(path.join(setDir, "uploads", "note.txt"))).toBe(true);

    const backup = new Database(backupDbPath, { readonly: true });
    const integrity = backup.pragma("integrity_check", { simple: true });
    expect(integrity).toBe("ok");
    const row = backup.prepare("SELECT msg FROM ping").get() as { msg: string };
    expect(row.msg).toBe("alive");
    backup.close();
  }, 20_000);
});
