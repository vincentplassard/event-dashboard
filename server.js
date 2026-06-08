// Event Performance dashboard — password-protected static server for Railway.
// Real server-side HTTP Basic Auth: the page (and its data) are only sent after
// the correct credentials are supplied. Credentials are read from env vars, never
// hard-coded. Railway terminates TLS, so auth travels over HTTPS.

const express = require('express');
const path = require('path');
const crypto = require('crypto');

const app = express();

// Single shared password for everyone. Any username works — viewers just enter the password.
// Override in Railway by setting the DASHBOARD_PASSWORD variable.
const PASSWORD = process.env.DASHBOARD_PASSWORD || 'ul26';

// constant-time string compare to avoid trivial timing attacks
function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

app.use((req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme === 'Basic' && encoded) {
    const pass = Buffer.from(encoded, 'base64').toString('utf8').split(':')[1] || '';
    if (safeEqual(pass, PASSWORD)) return next(); // username ignored
  }
  res.set('WWW-Authenticate', 'Basic realm="Event Performance", charset="UTF-8"');
  return res.status(401).send('Authentication required.');
});

app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Event dashboard listening on ${PORT}`));
