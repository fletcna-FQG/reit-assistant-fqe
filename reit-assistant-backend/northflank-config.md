# Northflank deployment — REIT Assistant backend

Deploy from the `reit-assistant-backend/` directory using the included `Dockerfile`.

## Service type

- **Workload:** Combined / Web service (HTTP)
- **Build:** Dockerfile (`Dockerfile` in this folder)
- **Port:** `3000` (set `PORT=3000`)
- **Health check path:** `GET /health`
- **Health check expected:** HTTP `200`, body `{ "status": "ok", ... }`

## Build & start (local Docker)

```bash
cd reit-assistant-backend
cp .env.example .env   # fill in values
docker compose up --build
curl http://127.0.0.1:3000/health
```

Production start (without Compose):

```bash
npm ci
npm run build
cp -r src/templates dist/templates
node dist/index.js
```

## Required environment variables

These must be set in Northflank **before** the container starts. Missing required vars cause the process to exit on boot (`src/config/env.ts` Zod validation).

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | **Yes** | Supabase project URL, e.g. `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | **Yes** | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Service role key (server only — never expose to clients) |
| `REDIS_URL` | **Yes** | Redis connection string, e.g. `redis://default:password@host:6379` |
| `PORT` | No | HTTP port (default `3000`; Northflank usually injects this) |
| `NODE_ENV` | No | Set to `production` in Northflank |

## Brevo — share reports (email & SMS)

Share → Email and Share → SMS both use the **Brevo REST API** (`BREVO_API_KEY`). Without a valid key, share delivery returns `502`.

| Variable | Required | Description |
|----------|----------|-------------|
| `BREVO_API_KEY` | **For share email & SMS** | Brevo REST API key (transactional email + SMS) |
| `BREVO_SENDER_EMAIL` | **For share email** | Verified sender, e.g. `reports@fletcherquillestates.com` |
| `BREVO_SENDER_NAME` | No | Display name for outbound email (default in code: `REIT Assistant`) |
| `BREVO_SMS_SENDER` | **For share SMS** | Alphanumeric sender registered in Brevo (max 11 chars, e.g. `FQEstates`). **Do not** use your email address — `BREVO_SENDER_NAME` / `BREVO_SENDER_EMAIL` are for email only. |

**Northflank / Brevo:** Whitelist the platform egress IP in Brevo → Security → Authorized IPs, or disable IP blocking.

If `BREVO_API_KEY` is missing or blocked, Share → Email and **SMS via Brevo** will fail at delivery time.

## Auth email (Supabase → Brevo SMTP)

Supabase Auth emails (signup confirm, password reset, invite) use **Brevo SMTP**, not the REST API key.

Create a separate **SMTP key** in Brevo → Settings → SMTP & API → SMTP (this is **not** the same value as `BREVO_API_KEY`). Configure Supabase with that key via the dashboard or locally:

```bash
npm run configure:smtp
```

| Variable | Purpose |
|----------|---------|
| `SUPABASE_ACCESS_TOKEN` | Supabase personal access token (script only — not needed at runtime on Northflank) |
| `SUPABASE_PROJECT_REF` | Project ref from Supabase URL |
| `BREVO_SMTP_HOST` | Usually `smtp-relay.brevo.com` |
| `BREVO_SMTP_PORT` | Usually `587` |
| `BREVO_SMTP_USER` | Brevo SMTP login email (SMTP credentials — separate from REST API key) |
| `BREVO_SMTP_KEY` | Brevo SMTP key (SMTP credentials — **not** `BREVO_API_KEY`) |
| `BREVO_SMTP_SENDER_EMAIL` | Auth email from address |
| `BREVO_SMTP_SENDER_NAME` | Auth email display name |

Optional auth behaviour (backend register route):

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH_AUTO_CONFIRM_EMAIL` | `true` | Skip confirmation email when `true` |
| `AUTH_RESET_REDIRECT_URL` | localhost | Password reset redirect for Expo/web app |
| `AUTH_CONFIRM_REDIRECT_URL` | localhost | Signup confirm redirect |

## Optional integrations

| Variable | Description |
|----------|-------------|
| `ATTOM_API_KEY` | ATTOM property/market data |
| `ATTOM_BASE_URL` | ATTOM API base URL override |
| `SMS_PROVIDER` | Legacy override if multiple SMS backends are enabled in code |
| `AA_API_KEY` | Action Accelerated API key (only if `SMS_PROVIDER=action_accelerated`) |
| `AA_COMMUNITY_ID` | Action Accelerated community ID |

## Northflank checklist

1. Create a **Redis** add-on or external Redis; set `REDIS_URL`.
2. Add all **required** Supabase variables from your project settings.
3. Set **`BREVO_API_KEY`** (+ `BREVO_SENDER_EMAIL` for email) for Share → Email and **SMS via Brevo**.
4. Configure Supabase Auth SMTP separately using **`BREVO_SMTP_USER`** and **`BREVO_SMTP_KEY`** (not the REST key).
5. Configure **health probe:** path `/health`, port `3000`.
6. Set **CORS / frontend:** point Expo `EXPO_PUBLIC_API_URL` to the Northflank service URL.
7. Run Supabase SQL migrations from `supabase/migrations/` if not already applied.
8. Ensure Supabase Storage bucket `export` exists (see migration `20260607120000_export_storage_bucket.sql`).

## API surface (smoke test)

```bash
curl https://YOUR-SERVICE.northflank.app/health
curl -X POST https://YOUR-SERVICE.northflank.app/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"...","password":"..."}'
```

Full regression: from repo root, `API_URL=https://YOUR-SERVICE.northflank.app bash scripts/e2e-full-test.sh`
