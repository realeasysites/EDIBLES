const crypto = require('crypto');

const COOKIE = 'edibles_admin';
const WEEK = 7 * 24 * 60 * 60 * 1000;
const secret = () => process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || '';

const sign = (v) => crypto.createHmac('sha256', secret()).update(v).digest('hex');

function safeEqual(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

// Login stays disabled until ADMIN_PASSWORD is set. There is no default.
function checkPassword(input) {
  const real = process.env.ADMIN_PASSWORD;
  return !!real && safeEqual(input || '', real);
}

function issue(res, req) {
  const exp = String(Date.now() + WEEK);
  res.cookie(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true, sameSite: 'lax', maxAge: WEEK, secure: req.secure,
  });
}

function isAuthed(req) {
  if (!process.env.ADMIN_PASSWORD) return false;
  const m = (req.headers.cookie || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!m) return false;
  const [exp, sig] = decodeURIComponent(m[1]).split('.');
  return !!sig && safeEqual(sig, sign(exp)) && Number(exp) > Date.now();
}

const clear = (res) => res.clearCookie(COOKIE);

function requireApi(req, res, next) {
  if (isAuthed(req)) return next();
  res.status(401).json({ error: 'Not signed in' });
}

module.exports = { checkPassword, issue, isAuthed, clear, requireApi };
