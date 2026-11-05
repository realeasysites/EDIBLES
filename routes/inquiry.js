const express = require('express');
const db = require('../db');
const { notifyInquiry } = require('../lib/mailer');

const router = express.Router();
const hits = new Map();

function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 3600000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 8;
}

const clean = (v, n = 300) => String(v || '').trim().slice(0, n);

router.post('/', async (req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // honeypot
  if (limited(req.ip)) return res.status(429).json({ error: 'Too many requests. Please call us at (585) 271-4910.' });

  const q = {
    name: clean(b.name, 120), phone: clean(b.phone, 40), email: clean(b.email, 160),
    event_date: clean(b.event_date, 40), guests: clean(b.guests, 40),
    occasion: clean(b.occasion, 80), message: clean(b.message, 2000),
  };
  if (!q.name) return res.status(400).json({ error: 'Please add your name.' });
  if (!q.phone && !q.email) return res.status(400).json({ error: 'Please add a phone number or email so we can reach you.' });
  if (q.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(q.email)) return res.status(400).json({ error: 'That email address does not look right.' });

  db.prepare(`INSERT INTO inquiries (name, phone, email, event_date, guests, occasion, message)
              VALUES (@name, @phone, @email, @event_date, @guests, @occasion, @message)`).run(q);
  notifyInquiry(q).catch((e) => console.error('Inquiry email failed:', e.message));
  res.json({ ok: true });
});

module.exports = router;
