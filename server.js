const path = require('path');
const express = require('express');

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));

// Admin first, so /admin always asks for the password before anything public.
app.use('/admin', require('./routes/admin'));
app.use('/api/inquiry', require('./routes/inquiry'));
app.use(require('./routes/public'));
app.use(express.static(path.join(__dirname, 'public'), {
  index: false,
  setHeaders(res, file) {
    // Fonts never change. Everything else is rechecked so updates show up right away.
    res.setHeader('Cache-Control', file.endsWith('.woff2') ? 'public, max-age=31536000, immutable' : 'no-cache');
  },
}));
app.use(require('./routes/public').notFound);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Edibles site on :${port}`));
