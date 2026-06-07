# Mobile entry point

This folder delegates to the **root prototype app** (`reit-assistant-fqe/`).

```bash
# From repo root (recommended)
npm run web:dev

# Or from this folder — forwards to the root app
npm run web:dev
```

Do **not** run `npx expo start --web` directly in `reit-assistant-mobile/`; it uses a separate Expo SDK copy and can crash Metro HMR. Always use the scripts above.

The simplified dark “Search Property” home screen has been removed. After login you see the **Dashboard** (mockup 03). Property search runs in the **Analyze** tab / emerald FAB using the 3-step Property Analyzer (mockup 06).

Live backend auth and property CRUD use the same API as before (`127.0.0.1:3000`).
