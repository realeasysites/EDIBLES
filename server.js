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
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d', index: false }));
app.use(require('./routes/public').notFound);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Edibles site on :${port}`));
