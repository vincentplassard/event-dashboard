# Event Performance Dashboard — password-protected

A small Express server that serves the sponsored-event performance dashboard behind
**HTTP Basic Auth**. It uses a single shared password for everyone (default `ul26`) —
any username works, viewers just enter the password. The page + data are only sent after
a correct login, and Railway serves it over HTTPS. Override the password anytime with the
`DASHBOARD_PASSWORD` variable in Railway.

> Note: this hosted copy shows the data as a **snapshot** (the live HubSpot refresh only
> works inside Cowork). To update it, regenerate `public/index.html` and redeploy.

## Files
- `server.js` — Express server with Basic Auth
- `public/index.html` — the dashboard
- `package.json` — start script + Express dependency

Password: **`ul26`** (any username). Change it later via the `DASHBOARD_PASSWORD` variable.

## Run locally
```bash
npm install
npm start
# open http://localhost:3000  → enter password ul26 (leave username blank or type anything)
```

## Deploy to Railway — CLI (fastest)
```bash
npm i -g @railway/cli      # install CLI
railway login              # opens browser to authenticate
cd event-dashboard
railway init               # create a new project (pick a name)
railway up                 # build & deploy this folder
railway domain             # generate a public https URL
```
That's it — `ul26` is the built-in default, so it works immediately. Optionally pin it
explicitly: `railway variables --set DASHBOARD_PASSWORD=ul26`.

## Deploy to Railway — from GitHub (no CLI)
1. Push this `event-dashboard` folder to a GitHub repo.
2. Railway → **New Project** → **Deploy from GitHub repo** → select it.
3. (Optional) **Variables** tab → add `DASHBOARD_PASSWORD` = `ul26` to keep it out of the code.
4. **Settings → Networking → Generate Domain** to get the public URL.

Railway auto-detects Node, runs `npm install`, then `npm start`. The app listens on
`process.env.PORT`, which Railway sets automatically.

## Changing the password later
Set/rotate the `DASHBOARD_PASSWORD` variable in Railway (Variables tab or
`railway variables --set DASHBOARD_PASSWORD='new-password'`) and the app restarts with it.

## Security notes
- One shared password (`ul26`) for everyone; any username is accepted.
- Basic Auth over Railway's HTTPS restricts access to the dashboard. Anyone with the URL **and** `ul26` can view it.
- `ul26` is a short password — fine for a low-sensitivity internal view, but don't treat it as strong security. For per-user logins, SSO, or audit logs you'd want a real auth provider.
