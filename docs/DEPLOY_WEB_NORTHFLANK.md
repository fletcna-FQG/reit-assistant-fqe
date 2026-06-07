# Deploy Expo web to Northflank (Option B)

Static export of the REIT Assistant frontend, served by nginx.  
Backend API stays on the existing Northflank service (`reit-assistant-backend`).

## Architecture

```
Browser → fletcherquillestates.com (Northflank web service, nginx + dist/)
       → API: p01--reit-assistant-v2--99vpsnwm46h4.code.run
       → Supabase (auth, direct client calls)
```

## Prerequisites

- [ ] Git repo connected to Northflank (or ability to build Docker locally and push)
- [ ] DNS access for `fletcherquillestates.com` (or subdomain e.g. `app.fletcherquillestates.com`)
- [ ] Supabase **anon** URL + key
- [ ] Backend already deployed and healthy (`GET /health` → 200)
- [ ] SMS migration applied: `reit-assistant-backend/supabase/migrations/20260608120000_sms_opt_ins.sql`

## Step 1 — Test build locally (optional)

```bash
cd /Users/nancyfletcher/Documents/reit-assistant-fqe
cp .env.production.example .env.production
# Edit .env.production with real EXPO_PUBLIC_SUPABASE_* values

npm ci
npx expo export --platform web --clear
npx serve dist
```

Open:

- http://localhost:3000/sms-updates
- http://localhost:3000/join-sms
- http://localhost:3000/login

Refresh each URL — if you get 404, the production nginx config fixes that (SPA fallback).

### Test Docker image locally

```bash
docker build -f Dockerfile.web \
  --build-arg EXPO_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
  --build-arg EXPO_PUBLIC_SUPABASE_ANON_KEY="your-anon-key" \
  -t reit-assistant-web .

docker run --rm -p 8080:80 reit-assistant-web
open http://localhost:8080/sms-updates
curl http://localhost:8080/health
```

## Step 2 — Create Northflank web service

1. Northflank dashboard → **Add service** → **Combined service** (or **Static site** if you prefer upload-only).
2. **Source:** connect this Git repository, branch `main` (or your deploy branch).
3. **Build type:** **Dockerfile**
4. **Dockerfile path:** `Dockerfile.web` (repo root — **not** `reit-assistant-backend/Dockerfile`).
5. **Build context:** repository root `/`.
6. **Port:** `80`
7. **Health check:**
   - Path: `/health`
   - Port: `80`
   - Expect: HTTP `200`

## Step 3 — Build environment variables (critical)

Set these on the **build** in Northflank (Build arguments or build-time env).  
They are baked into the JavaScript bundle at compile time.

| Variable | Example |
|----------|---------|
| `EXPO_PUBLIC_USE_LIVE_API` | `true` |
| `EXPO_PUBLIC_API_URL` | `https://p01--reit-assistant-v2--99vpsnwm46h4.code.run` |
| `EXPO_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | your anon key |

In Northflank: **Build** → **Environment** / **Build arguments** — add all four before the first deploy.

> Changing API URL or Supabase keys later requires a **rebuild**, not just a restart.

## Step 4 — Deploy

1. Click **Build & deploy**.
2. Wait for build logs to show `expo export` completing and nginx image starting.
3. Open the Northflank **public URL** (e.g. `https://p01--reit-assistant-web--xxxx.code.run`).
4. Verify:
   - `/health` → `{"status":"ok","service":"reit-assistant-web"}`
   - `/sms-updates` — subscription form loads
   - `/join-sms` — QR + keyword page loads
   - `/login` — sign in works against production API

## Step 5 — Custom domain (`fletcherquillestates.com`)

### If the apex domain is free (recommended for Brevo URLs)

1. Northflank service → **Domains** → **Add domain**
2. Enter `fletcherquillestates.com` and/or `www.fletcherquillestates.com`
3. Northflank shows DNS records — add at your registrar:

   | Host | Type | Value |
   |------|------|--------|
   | `@` | A or ALIAS | Northflank-provided target |
   | `www` | CNAME | Northflank-provided target |

4. Enable SSL in Northflank (automatic once DNS verifies).
5. Pick one canonical host — redirect `www` → apex or apex → `www`.

### If apex already hosts another site

Use a subdomain for the app, e.g. `app.fletcherquillestates.com`:

1. Add CNAME `app` → Northflank target
2. Update `constants/smsOptIn.ts` (`domain`, URLs in Brevo copy) to match
3. Rebuild and redeploy web

## Step 6 — Backend auth redirects (recommended)

On the **backend** Northflank service, set:

```env
AUTH_RESET_REDIRECT_URL=https://www.fletcherquillestates.com/login
AUTH_CONFIRM_REDIRECT_URL=https://www.fletcherquillestates.com/login
```

Use the same host you chose in Step 5.

## Step 7 — Brevo SMS compliance

After the domain is live, screenshot for Brevo verification:

- `https://www.fletcherquillestates.com/sms-updates`
- `https://www.fletcherquillestates.com/join-sms`

See [BREVO_SMS_SETUP.md](./BREVO_SMS_SETUP.md).

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank page after deploy | Check build logs for `expo export` errors; confirm build env vars set |
| API calls fail / wrong host | Rebuild with correct `EXPO_PUBLIC_API_URL` |
| `/sms-updates` 404 on refresh | Confirm service uses `Dockerfile.web` + `nginx.web.conf` (SPA fallback) |
| SMS form 500 | Run Supabase migration `20260608120000_sms_opt_ins.sql`; redeploy backend |
| Login works on `*.code.run` but not custom domain | Supabase Auth → URL configuration → add site URL + redirect URLs |
| CORS errors | Backend CORS is `*`; usually a wrong API URL in the bundle |

## Supabase Auth URL configuration

Supabase dashboard → **Authentication** → **URL configuration**:

- **Site URL:** `https://www.fletcherquillestates.com`
- **Redirect URLs:** add `https://www.fletcherquillestates.com/**` and your Northflank preview URL

## Files in this repo

| File | Purpose |
|------|---------|
| `Dockerfile.web` | Multi-stage: Node export → nginx |
| `nginx.web.conf` | SPA routing + `/health` |
| `.env.production.example` | Template for build env vars |
| `.dockerignore` | Keeps backend/mobile out of web image |
