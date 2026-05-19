# Beta repository structure

This repo is scoped to **reit-assistant-fqe only**. The Beta build includes:

## Source (required)

| Path | Purpose |
|------|---------|
| `app/` | expo-router screens & layouts |
| `components/` | UI components |
| `services/` | API, auth, analysis engine |
| `hooks/` | React hooks |
| `constants/` | Theme & navigation tokens |
| `types/` | TypeScript models |
| `utils/` | Shared utilities |
| `assets/` | App icons & splash |

## Root configuration (required)

Expo expects these at the project root (not in a subfolder):

- `package.json`, `package-lock.json`
- `app.json`, `eas.json`
- `babel.config.js`, `metro.config.js`, `tailwind.config.js`
- `tsconfig.json`, `global.css`, `nativewind-env.d.ts`
- `.env.example`

## Documentation

| Path | Purpose |
|------|---------|
| `docs/` | Kimi design specs (01–07) + sprint notes |
| `README.md` | Quick start |
| `AGENTS.md` | Agent scope & Expo notes |
| `.cursor/rules/` | Workspace scope policy |

## Excluded from repo (see `.gitignore`)

- `node_modules/`, `.expo/`, `dist/`, `ios/`, `android/`
- `deliverables/` mockups, HTML prototype, caches
- Agent transcripts, `.claude/`, local IDE settings
- `.env` secrets
