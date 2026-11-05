const nodemailer = require('nodemailer');

function transport() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  const port = Number(SMTP_PORT || 465);
  return nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
}

// A failed email never loses a lead: the inquiry is already saved to the dashboard.
async function notifyInquiry(q) {
  const t = transport();
  const to = process.env.NOTIFY_EMAIL;
  if (!t || !to) return false;
  const lines = [
    `Name: ${q.name}`, `Phone: ${q.phone || '-'}`, `Email: ${q.email || '-'}`,
    `Date: ${q.event_date || '-'}`, `Guests: ${q.guests || '-'}`, `Occasion: ${q.occasion || '-'}`,
    '', q.message || '',
  ];
  await t.sendMail({
    from: process.env.SMTP_USER, to, replyTo: q.email || undefined,
    subject: `Private event inquiry: ${q.name}${q.event_date ? ` (${q.event_date})` : ''}`,
    text: lines.join('\n'),
  });
  return true;
}

module.exports = { notifyInquiry };
