// Event Performance dashboard — password-protected server for Railway.
// Custom, centered, password-ONLY login page (no username) backed by a signed cookie.
// The password lives in an env var (default 'ul26'); the page + data are only served
// after a correct login. Railway terminates TLS, so this runs over HTTPS.

const express = require('express');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: false }));

const PASSWORD = process.env.DASHBOARD_PASSWORD || 'ul26';
const SECRET   = process.env.AUTH_SECRET || 'userled-events-secret-v1';
const TOKEN    = crypto.createHash('sha256').update(PASSWORD + '|' + SECRET).digest('hex');
const COOKIE   = 'ul_auth';

function safeEqual(a, b) {
  const ba = Buffer.from(String(a)), bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}
function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
const authed = req => safeEqual(parseCookies(req)[COOKIE] || '', TOKEN);

function loginPage(error) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Event Performance — Sign in</title>
<style>
:root{color-scheme:light}*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
background:radial-gradient(1200px 600px at 50% -10%,#efecff,#f5f6fb 60%);
font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#191b29;padding:20px}
.card{background:#fff;border:1px solid #e9ebf3;border-radius:18px;box-shadow:0 24px 70px -28px rgba(40,40,90,.4);
padding:32px 28px;width:100%;max-width:360px;text-align:center}
.lock{font-size:28px;line-height:1}
h1{font-size:18px;margin:12px 0 4px;letter-spacing:-.01em}
p{color:#6c7286;font-size:13px;margin:0 0 20px}
input{width:100%;padding:12px 14px;border:1px solid #e9ebf3;border-radius:11px;font-size:15px;margin-bottom:12px}
input:focus{outline:none;border-color:#5b46ff;box-shadow:0 0 0 3px #ece9ff}
button{width:100%;padding:12px;border:none;border-radius:11px;background:#5b46ff;color:#fff;font-size:15px;font-weight:650;cursor:pointer}
button:hover{background:#4a37e0}
.err{color:#d14b3a;font-size:12.5px;margin:-2px 0 12px;min-height:15px}
</style></head><body>
<form class="card" method="post" action="/login" autocomplete="off">
  <div class="lock">🔒</div>
  <h1>Event Performance</h1>
  <p>Enter the password to view the dashboard.</p>
  <input type="password" name="password" placeholder="Password" autofocus required aria-label="Password">
  <div class="err">${error || ''}</div>
  <button type="submit">View dashboard</button>
</form></body></html>`;
}

app.post('/login', (req, res) => {
  const pass = (req.body && req.body.password) || '';
  if (safeEqual(pass, PASSWORD)) {
    const secure = req.headers['x-forwarded-proto'] === 'https';
    res.setHeader('Set-Cookie',
      `${COOKIE}=${TOKEN}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${secure ? '; Secure' : ''}`);
    return res.redirect('/');
  }
  res.status(401).send(loginPage('Incorrect password — try again.'));
});

app.get('/logout', (req, res) => {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
  res.redirect('/');
});

// gate everything else behind the cookie
app.use((req, res, next) => authed(req) ? next() : res.status(401).send(loginPage('')));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Event dashboard listening on ${PORT}`));
