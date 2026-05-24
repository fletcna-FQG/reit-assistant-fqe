# REIT Assistant — Beta Property Search & Manual Entry Strategy

**Fletcher Quill Estates Inc.** | **Phase:** Beta | **Updated:** May 2026

---

## Strategic model (corrected)

Manual property data entry is **not a separate workflow** — it lives **inside the Property Search flow** until ATTOM is integrated into the UI/UX.

```
User enters search criteria (Address, City, State, ZIP)
        ↓
User taps Execute Search  →  POST /api/properties/search
        ↓
Beta: ATTOM not connected → manual financial fields unlock
Future: ATTOM returns property snapshot → fields pre-fill (user may override)
        ↓
User completes Income / Expenses / Cap Rate (manual until ATTOM fills them)
        ↓
Save Property  →  POST /api/properties  →  server calculates EGI, NOI, Value
```

| Phase | Search execution | Financial data |
|-------|------------------|----------------|
| **Beta (now)** | Backend validates location; returns `manual_entry_required: true` | User enters all financial fields manually |
| **ATTOM integrated** | Backend calls ATTOM API | Fields pre-populated from `attom_data`; user can edit before save |

---

## UI flow (prototype design)

| Step | Screen | Action |
|------|--------|--------|
| 1 | Login (`/login`) | Sign in → **Dashboard** (mockup 03) |
| 2 | Dashboard | KPIs, activity feed, chart, emerald FAB |
| 3 | Analyze tab or FAB | **Property Analyzer** 3-step wizard (mockup 06) |
| 4 | Step 1 — Property Search | Location fields → **Execute Search** |
| 5 | Step 2 — Financials | Manual income / expenses / cap rate (until ATTOM) |
| 6 | Step 3 — Review & Save | **Save Property** → server NOI + Indicated Value |

**Navigation:** Login → Dashboard → Analyze (not a standalone “Search Property” home screen)

---

## API

| Endpoint | Purpose |
|----------|---------|
| `POST /api/properties/search` | Execute property search (ATTOM hook point) |
| `POST /api/properties` | Save property; server-side valuation math |
| `GET /api/properties` | List saved properties |

### Search response (Beta)

```json
{
  "message": "Search executed. ATTOM not connected — enter financial data manually.",
  "source": "manual",
  "attom_enabled": false,
  "manual_entry_required": true,
  "location": { "address", "city", "state", "zip" },
  "attom_data": null
}
```

---

## Server-side calculations (on save)

```
EGI = (Gross + Other) × (1 − Vacancy% / 100)
Total Expenses = sum of all expense fields
NOI = EGI − Total Expenses
Indicated Value = NOI / (Cap Rate / 100)
```

Frontend sends **raw inputs only**; backend returns calculated fields.

---

## Configuration

- API: `http://127.0.0.1:3000` (not `localhost`)
- Auth: JWT on `window.authToken` + Zustand; axios interceptor
- Validation: location required for search; vacancy 0–100; cap rate > 0

---

## Test account

`webtest2@fletcherquillestates.com` / `Test123!`

---

## Out of scope (Beta)

- ATTOM UI auto-fill (endpoint stub ready; integration pending)
- PropertyDetails / EditProperty screens
- OAuth with backend JWT

See [MVP_TEST_SCRIPT.md](./MVP_TEST_SCRIPT.md) for test steps.
