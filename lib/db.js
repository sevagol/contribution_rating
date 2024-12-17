import Database from 'better-sqlite3';

let db;
if (!global._db) {
  db = new Database('database.sqlite');
  db.exec(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      rating INTEGER
    )
  `);
  global._db = db;
} else {
  db = global._db;
}

export default db;
