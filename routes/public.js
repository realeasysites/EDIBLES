const express = require('express');
const site = require('../lib/site');
const t = require('../lib/templates');

const router = express.Router();

const ctx = () => ({
  s: site.getSettings(),
  menus: site.getMenus(),
  features: site.getFeatures(),
});

router.get('/', (req, res) => res.send(t.home(ctx())));
router.get('/menu', (req, res) => res.send(t.menu(ctx())));
router.get('/events', (req, res) => res.send(t.events(ctx())));
router.get('/sitemap.xml', (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/', '/menu', '/events'].map((p) => `<url><loc>${base}${p}</loc></url>`).join('')}</urlset>`);
});
router.get('/robots.txt', (req, res) => res.type('text/plain').send(`User-agent: *\nDisallow: /admin\nSitemap: ${req.protocol}://${req.get('host')}/sitemap.xml\n`));

// Old WordPress addresses keep working, so Google and old links land in the right place.
const moved = {
  '/lunch': '/menu#lunch', '/dinner': '/menu#dinner', '/wine': '/menu#drinks', '/menus': '/menu',
  '/about-us': '/#story', '/contact': '/#visit',
};
for (const [from, to] of Object.entries(moved)) router.get(from, (req, res) => res.redirect(301, to));

router.notFound = (req, res) => res.status(404).send(t.notFound(ctx()));

module.exports = router;
