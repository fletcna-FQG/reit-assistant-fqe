# REIT Assistant

**Fletcher Quill Estates Inc.** — React Native (Expo) Beta build.

## Quick start

```bash
npm install
npm start
```

Demo login: `analyst@fletcherquill.com` + any password (6+ characters).

Full sprint notes: [docs/SPRINT_SUMMARY.md](./docs/SPRINT_SUMMARY.md)

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
