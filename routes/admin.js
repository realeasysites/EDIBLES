const path = require('path');
const express = require('express');
const db = require('../db');
const auth = require('../lib/auth');
const site = require('../lib/site');

const router = express.Router();
const view = (f) => path.join(__dirname, '..', 'views', f);

router.get('/', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(view(auth.isAuthed(req) ? 'admin.html' : 'login.html'));
});

router.post('/login', (req, res) => {
  if (!process.env.ADMIN_PASSWORD) return res.status(503).json({ error: 'Set ADMIN_PASSWORD on the server to enable sign in.' });
  if (!auth.checkPassword(req.body && req.body.password)) return res.status(401).json({ error: 'Wrong password.' });
  auth.issue(res, req);
  res.json({ ok: true });
});

router.post('/logout', (req, res) => { auth.clear(res); res.json({ ok: true }); });

const api = express.Router();
api.use(auth.requireApi);

/* Inquiries */
api.get('/inquiries', (req, res) => res.json(db.prepare('SELECT * FROM inquiries ORDER BY id DESC').all()));
api.patch('/inquiries/:id', (req, res) => {
  const status = String(req.body.status || '');
  if (!['new', 'contacted', 'booked', 'declined'].includes(status)) return res.status(400).json({ error: 'Bad status' });
  db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});
api.delete('/inquiries/:id', (req, res) => {
  db.prepare('DELETE FROM inquiries WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* Menu */
const str = (v, n = 500) => String(v == null ? '' : v).trim().slice(0, n);
api.get('/menu', (req, res) => res.json(db.prepare('SELECT * FROM menu_items ORDER BY menu, sort, id').all()));
api.post('/menu', (req, res) => {
  const b = req.body || {};
  if (!['lunch', 'dinner', 'drinks'].includes(b.menu) || !str(b.name) || !str(b.section)) return res.status(400).json({ error: 'Menu, section and name are required.' });
  // New dishes land at the end of their section.
  const max = db.prepare('SELECT MAX(sort) m FROM menu_items WHERE menu = ? AND section = ?').get(b.menu, str(b.section)).m;
  const sort = max == null ? (db.prepare('SELECT COALESCE(MAX(sort),0)+1 m FROM menu_items WHERE menu = ?').get(b.menu).m) : max;
  const r = db.prepare('INSERT INTO menu_items (menu, section, name, price, descr, note, sort) VALUES (?,?,?,?,?,?,?)')
    .run(b.menu, str(b.section), str(b.name), str(b.price, 40), str(b.descr), str(b.note), sort);
  res.json({ id: r.lastInsertRowid });
});
api.put('/menu/:id', (req, res) => {
  const b = req.body || {};
  if (!str(b.name)) return res.status(400).json({ error: 'A dish needs a name.' });
  db.prepare('UPDATE menu_items SET name = ?, price = ?, descr = ?, note = ? WHERE id = ?')
    .run(str(b.name), str(b.price, 40), str(b.descr), str(b.note), req.params.id);
  res.json({ ok: true });
});
api.delete('/menu/:id', (req, res) => {
  db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* Features */
api.get('/features', (req, res) => res.json(db.prepare('SELECT * FROM features ORDER BY sort, id').all()));
api.post('/features', (req, res) => {
  const b = req.body || {};
  if (!str(b.title)) return res.status(400).json({ error: 'A feature needs a title.' });
  const r = db.prepare('INSERT INTO features (title, descr, image, link, sort) VALUES (?,?,?,?, (SELECT COALESCE(MIN(sort),0)-1 FROM features))')
    .run(str(b.title), str(b.descr), str(b.image), str(b.link));
  res.json({ id: r.lastInsertRowid });
});
api.put('/features/:id', (req, res) => {
  const b = req.body || {};
  db.prepare('UPDATE features SET title = ?, descr = ?, link = ?, active = ? WHERE id = ?')
    .run(str(b.title), str(b.descr), str(b.link), b.active ? 1 : 0, req.params.id);
  res.json({ ok: true });
});
api.delete('/features/:id', (req, res) => {
  db.prepare('DELETE FROM features WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* Links, hours, announcement */
const EDITABLE = ['announcement', 'announcementUntil', 'phone', 'email', 'reserveUrl', 'reserveWidget', 'orderUrl',
  'rewardsUrl', 'giftCardUrl', 'deliveryUrl', 'instagramFollowers', 'hours', 'dayNotes', 'kitchenLastCall'];
api.get('/settings', (req, res) => res.json(site.getSettings()));
api.put('/settings', (req, res) => {
  const patch = {};
  for (const k of EDITABLE) if (k in (req.body || {})) patch[k] = req.body[k];
  for (const k of ['reserveUrl', 'reserveWidget', 'orderUrl', 'rewardsUrl', 'giftCardUrl', 'deliveryUrl']) {
    if (patch[k] && !/^https:\/\//i.test(patch[k])) return res.status(400).json({ error: 'Links must start with https://' });
  }
  if (patch.hours) {
    for (const v of Object.values(patch.hours)) {
      if (v && !/^\s*\d{1,2}:\d{2}-\d{1,2}:\d{2}(\s*,\s*\d{1,2}:\d{2}-\d{1,2}:\d{2})*\s*$/.test(v)) {
        return res.status(400).json({ error: 'Hours look like 12:00-15:00,16:00-22:00 (24-hour time).' });
      }
    }
  }
  site.saveSettings(patch);
  res.json({ ok: true });
});

router.use('/api', api);
module.exports = router;
