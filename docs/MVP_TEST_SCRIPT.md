# REIT Assistant — Beta Test Script (Manual Entry MVP)

**Project:** Fletcher Quill Estates Inc.  
**Focus:** Manual property entry → server-side CRE calculations → property list  
**Strategy doc:** [BETA_MANUAL_ENTRY.md](./BETA_MANUAL_ENTRY.md)

---

## What this Beta covers

### In scope (must pass)

| # | Capability | App | Live? |
|---|------------|-----|-------|
| 1 | Login / logout with JWT | Mobile | **Yes** — `127.0.0.1:3000` |
| 2 | Property Search + manual financial entry (post-search) | Mobile | **Yes** |
| 2a | Execute Search (`POST /api/properties/search`) | Mobile + API | **Yes** |
| 3 | Server-side EGI, NOI, Indicated Value | Backend | **Yes** |
| 4 | Validation (location required, vacancy 0–100, cap > 0) | Client + server | **Yes** |
| 5 | Property list on Home + pull to refresh | Mobile | **Yes** |
| 6 | Success alert with calculated NOI + Value | Mobile | **Yes** |
| 7 | Spreadsheet sample math (~125,076 NOI, ~2,007,637 value) | API script | **Yes** |

### Out of scope (do not fail Beta for missing these)

- ATTOM auto-fill in UI (search endpoint ready; manual entry after search until then)  
- PropertyDetailsScreen / EditPropertyScreen  
- OAuth, forgot-password flows  
- Root Expo app live dashboard/deals/tasks (mock UI only)  

---

## Prerequisites

```bash
# Backend env configured: reit-assistant-backend/.env
# Node 20+, npm installed
```

**Test user:** `webtest2@fletcherquillestates.com` / `Test123!`

---

## Step 1 — Start backend

```bash
cd reit-assistant-backend
npm install
npm run dev
```

Expected: `Server running on port 3000`

---

## Step 2 — Automated API tests (includes spreadsheet math)

```bash
cd reit-assistant-fqe
chmod +x scripts/mvp-api-test.sh
./scripts/mvp-api-test.sh
```

This verifies:

- Health, auth, profile  
- Validation rejects vacancy > 100 and cap rate ≤ 0  
- Spreadsheet sample creates property with:
  - NOI ≈ **125,075.80**
  - Indicated Value ≈ **2,007,637**

All checks must pass before UI testing.

---

## Step 3 — Start mobile app

```bash
cd reit-assistant-mobile
npm install
npm start
```

Press `w` (web), `i` (simulator), or scan QR on device.

**Device testing:** `reit-assistant-mobile/.env`

```env
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:3000
```

---

## Step 4 — Manual UI test (mobile)

Use the interactive checklist:

```bash
./scripts/mvp-manual-checklist.sh --interactive --tester "Your Name"
```

Or print a run sheet:

```bash
./scripts/mvp-manual-checklist.sh
```

### Required manual flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open app | Login screen; credentials prefilled in dev |
| 2 | Sign In | **Dashboard** — KPIs, activity, chart (mockup 03) |
| 3 | Tap **Analyze** tab or emerald FAB | Property Analyzer wizard opens |
| 4 | Step 1: Enter location; **Execute Search** | Banner: manual entry until ATTOM |
| 5 | Step 2: Enter income & property details (Year Built, Lot Size, List Price, etc.) | Full labels (e.g. Effective Gross Income (EGI), Net Operating Income (NOI)) |
| 6 | Step 3: **Continue** | Navigates to **Property Summary** (step 5) with saved valuation |
| 7 | Step 4 banner | REIT Rules Engine running with ETA |
| 8 | Step 5 | Calculated valuation summary + **View REIT Rules Engine Results** |
| 9 | Step 6 | **Rule Engine Results** screen (renamed from Analysis Results) |
| 10 | Rule Engine Results footer | **Add to Portfolio** and **Request Info** create deal/task |

### Validation checks (optional)

| Input | Expected |
|-------|----------|
| Empty address | Client error before save |
| Vacancy 101 | Client or server rejection |
| Cap rate 0 | Client or server rejection |

---

## Step 5 — Root Expo app (optional UI exploration)

The root `reit-assistant-fqe` app provides **mock** dashboard, deals, analyzer, tasks, and rules for design review. It is **not** part of the manual-entry Beta pass/fail.

```bash
cd reit-assistant-fqe && npm start
```

Auth uses the same backend when `EXPO_PUBLIC_API_URL=http://127.0.0.1:3000`.

---

## Sign-off

| Tester | Date | API script | Mobile manual | Notes |
|--------|------|------------|---------------|-------|
| | | ☐ Pass ☐ Fail | ☐ Pass ☐ Fail | |

**Beta pass = API script pass + Manual steps 1–7 pass.**

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Network error on web | Use `127.0.0.1:3000`, not `localhost` |
| 401 on save | Re-login; confirm `window.authToken` set (web devtools) |
| Wrong NOI/Value | Confirm backend running latest code; run `./scripts/mvp-api-test.sh` |
| Empty property list | Check tenant ID on test user matches saved properties |
