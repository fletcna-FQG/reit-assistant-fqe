# Mobile entry point

This folder delegates to the **root prototype app** (`reit-assistant-fqe/`).

```bash
npm start   # runs the root Expo app — Dashboard, 5-tab nav, Property Analyzer
```

The simplified dark “Search Property” home screen has been removed. After login you see the **Dashboard** (mockup 03). Property search runs in the **Analyze** tab / emerald FAB using the 3-step Property Analyzer (mockup 06).

Live backend auth and property CRUD use the same API as before (`127.0.0.1:3000`).
