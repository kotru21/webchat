import Database from "better-sqlite3";

const db = new Database("prisma/webchat.db");
const result = db
  .prepare(
    `UPDATE User
     SET banner = REPLACE(banner, '/api/media/banners/', '/api/media/covers/')
     WHERE banner LIKE '%/api/media/banners/%'`
  )
  .run();
console.log("updated", result.changes);
console.log(
  db
    .prepare(
      `SELECT id, banner FROM User WHERE banner IS NOT NULL AND banner != ''`
    )
    .all()
);
db.close();
