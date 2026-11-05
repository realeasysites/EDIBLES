const db = require('../db');

function getSettings() {
  const out = {};
  for (const r of db.prepare('SELECT key, value FROM settings').all()) out[r.key] = JSON.parse(r.value);
  return out;
}

function saveSettings(patch) {
  const up = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  db.transaction(() => { for (const [k, v] of Object.entries(patch)) up.run(k, JSON.stringify(v)); })();
}

// { lunch: [{ section, items: [...] }], dinner: [...], drinks: [...] }, in saved order.
function getMenus() {
  const out = { lunch: [], dinner: [], drinks: [] };
  for (const it of db.prepare('SELECT * FROM menu_items ORDER BY sort, id').all()) {
    const list = out[it.menu] || (out[it.menu] = []);
    let sec = list.find((s) => s.section === it.section);
    if (!sec) list.push((sec = { section: it.section, items: [] }));
    sec.items.push(it);
  }
  return out;
}

function findItem(menus, menu, name) {
  for (const s of menus[menu] || []) {
    const hit = s.items.find((i) => i.name.toLowerCase() === name.toLowerCase());
    if (hit) return hit;
  }
  return null;
}

const getFeatures = () => db.prepare('SELECT * FROM features WHERE active = 1 ORDER BY sort, id').all();

/* ---------- hours ---------- */
const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseDay(str) {
  return String(str || '').split(',').map((p) => p.trim()).filter(Boolean).map((p) => p.split('-').map((t) => t.trim()));
}

function pretty(t) {
  const [h, m] = t.split(':').map(Number);
  const h12 = h % 12 || 12;
  return { text: m ? `${h12}:${String(m).padStart(2, '0')}` : `${h12}`, ap: h < 12 ? 'am' : 'pm' };
}

function prettyRange([a, b]) {
  const x = pretty(a), y = pretty(b);
  return x.ap === y.ap ? `${x.text} – ${y.text} ${y.ap}` : `${x.text} ${x.ap} – ${y.text} ${y.ap}`;
}

// Friendly rows, starting Tuesday, with matching neighbouring days grouped.
function hoursRows(s) {
  const order = [2, 3, 4, 5, 6, 0, 1];
  const rows = [];
  for (const d of order) {
    const ranges = parseDay(s.hours[d]);
    const value = ranges.length ? ranges.map(prettyRange).join(' & ') : (s.dayNotes[d] || 'Closed');
    const last = rows[rows.length - 1];
    if (last && last.value === value) last.end = d;
    else rows.push({ start: d, end: d, value });
  }
  return rows.map((r) => ({ label: r.start === r.end ? DAY[r.start] : `${DAY[r.start]} – ${DAY[r.end]}`, value: r.value }));
}

function schemaHours(s) {
  const long = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const out = [];
  for (let d = 0; d < 7; d++) {
    for (const [opens, closes] of parseDay(s.hours[d])) {
      out.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: long[d], opens, closes });
    }
  }
  return out;
}

module.exports = { getSettings, saveSettings, getMenus, findItem, getFeatures, hoursRows, schemaHours, parseDay, pretty };
