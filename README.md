# REIT Assistant — Beta (Manual Entry MVP)

**Fletcher Quill Estates Inc.** — Manual property entry with server-side CRE calculations.

**Beta strategy:** [docs/BETA_MANUAL_ENTRY.md](./docs/BETA_MANUAL_ENTRY.md)  
**Access & prototype UI:** [docs/ACCESS_AND_PROTOTYPE_GUIDE.md](./docs/ACCESS_AND_PROTOTYPE_GUIDE.md)  
**Test script:** [docs/MVP_TEST_SCRIPT.md](./docs/MVP_TEST_SCRIPT.md)

## Quick start

```bash
# Terminal 1 — backend (127.0.0.1:3000, NOT localhost)
cd reit-assistant-backend && npm run dev

# Terminal 2 — automated tests (auth + spreadsheet math)
./scripts/mvp-api-test.sh

# Terminal 3 — prototype UI (Dashboard + Analyze property search)
cd reit-assistant-fqe && npm install && npm start
# Equivalent: cd reit-assistant-mobile && npm start  (delegates to root app)
```

**Test login** (backend auth, can receive email):

| Field | Value |
|-------|-------|
| Email | `webtest2@fletcherquillestates.com` |
| Password | `Test123!` |

Prefilled on login screens in dev. Ensure `EXPO_PUBLIC_API_URL=http://127.0.0.1:3000` (default).

Full sprint notes: [docs/SPRINT_SUMMARY.md](./docs/SPRINT_SUMMARY.md)

**MVP testing:** [docs/MVP_TEST_SCRIPT.md](./docs/MVP_TEST_SCRIPT.md)

- Automated API: `./scripts/mvp-api-test.sh`
- Manual UI run sheet: `./scripts/mvp-manual-checklist.sh` (print or `--interactive`)

## Repository layout (Beta)

```
app/           # Screens & routing
components/    # UI
services/      # API, auth, rules engine
hooks/         # Auth, network, theme
constants/     # Design tokens
types/         # Models
utils/         # Helpers
assets/        # Icons & splash
docs/          # Design specs (Kimi AI)
```

Root config: `app.json`, `eas.json`, `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `tsconfig.json`

## Environment

Copy `.env.example` to `.env` for Supabase / Northflank API keys.

## EAS build

```bash
npx eas-cli build --profile preview
```

See `eas.json` for `development`, `preview`, and `production` profiles.
