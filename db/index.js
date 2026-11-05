const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dataDir = process.env.DATA_DIR || path.join(__dirname);
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, 'edibles.sqlite'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, phone TEXT, email TEXT,
    event_date TEXT, guests TEXT, occasion TEXT, message TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu TEXT NOT NULL, section TEXT NOT NULL,
    name TEXT NOT NULL, price TEXT DEFAULT '', descr TEXT DEFAULT '', note TEXT DEFAULT '',
    sort INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL, descr TEXT DEFAULT '', image TEXT DEFAULT '', link TEXT DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`);

// First boot only: load the real menus, links and hours from data/seed.json.
const seeded = db.prepare('SELECT COUNT(*) c FROM settings').get().c > 0;
if (!seeded) {
  const seed = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'seed.json'), 'utf8'));
  const setS = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  const addM = db.prepare('INSERT INTO menu_items (menu, section, name, price, descr, note, sort) VALUES (?,?,?,?,?,?,?)');
  const addF = db.prepare('INSERT INTO features (title, descr, image, link, sort) VALUES (?,?,?,?,?)');
  db.transaction(() => {
    for (const [k, v] of Object.entries(seed.settings)) setS.run(k, JSON.stringify(v));
    for (const [menu, sections] of Object.entries(seed.menus)) {
      let sort = 0;
      for (const s of sections) {
        for (const [name, price, descr, note] of s.items) addM.run(menu, s.section, name, price, descr, note || '', sort++);
      }
    }
    seed.features.forEach((f, i) => addF.run(f.title, f.descr, f.image, f.link, i));
  })();
}

module.exports = db;
