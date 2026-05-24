# REIT Assistant — Access & Prototype UI/UX Guide

**Fletcher Quill Estates Inc.** | May 2026

This guide explains **how to open each app**, **which app matches the Kimi prototype**, and **how to walk screen-by-screen** to compare UI/UX.

---

## Which app matches the prototype?

| App | Folder | Matches prototype UI/UX? | Purpose |
|-----|--------|--------------------------|---------|
| **Beta (Expo Router)** | repo root `reit-assistant-fqe/` | **Yes** — Navy `#003366`, Emerald `#28a745`, light gray canvas, 5-tab nav, sidebar on desktop | Full product screens from mockups 02–10 |
| **Mobile (`reit-assistant-mobile/`)** | `reit-assistant-mobile/` | **Yes** — same prototype UI as root (monorepo) | Live backend auth + property search in Analyze tab |

**For prototype UI/UX and live property search, use either the root app or `reit-assistant-mobile/`** (both load the same screens).

Design tokens live in `constants/theme.ts` (from `docs/01_Style_Guide.md`).

---

## Reference: original prototype package

The clickable HTML prototype (`REIT_Assistant_Prototype.html`) and PNG mockups were in the Kimi deliverables folder. They are **not committed** in this repo (see `docs/BETA_REPO_STRUCTURE.md`).

You still have the full spec in `docs/`:

| Mockup | Spec screen | Beta app route |
|--------|-------------|----------------|
| 01 Splash | Auto-transition splash | **Not built** — app opens at Login |
| 02 Login | Email/password, strength bar | `/login` |
| 03 Dashboard | KPIs, activity, chart, FAB | `/(app)/(tabs)` (Home tab) |
| 04 Deals List | Search, filters, cards | `/(app)/(tabs)/deals` |
| 05 Deal Detail | Tabs, timeline, financials | `/(app)/deal/[id]` |
| 06 Property Analyzer | 3-step wizard | `/(app)/(tabs)/analyze` |
| 07 Analysis Results | Score gauge, BUY/HOLD/PASS | `/(app)/analysis/[id]` |
| 08 Rules Management | List, toggles, test rule | `/(app)/rules` (via Profile) |
| 09 Tasks Board | Kanban columns | `/(app)/(tabs)/tasks` |
| 10 Profile & Settings | Dark mode, left-handed | `/(app)/(tabs)/profile` |

If you still have `REIT_Assistant_Deliverables/` locally, open `prototype/REIT_Assistant_Prototype.html` in Chrome/Safari side-by-side with the Beta app for pixel-flow comparison.

---

## Prerequisites (both apps)

### 1. Start the backend

```bash
cd reit-assistant-backend
npm install
npm run dev
```

Confirm: `Server running on port 3000`

Use **`http://127.0.0.1:3000`** in env files — not `localhost` (web browsers block it in some setups).

### 2. Test account

| Field | Value |
|-------|-------|
| Email | `webtest2@fletcherquillestates.com` |
| Password | `Test123!` |

---

## Part A — Beta app (prototype UI/UX)

### Step 1: Install and start

```bash
cd reit-assistant-fqe
npm install
npm start
```

When the Expo dev tools appear:

| Target | Action | URL / result |
|--------|--------|--------------|
| **Web (recommended for UI review)** | Press **`w`** | Opens in browser (~`http://localhost:8081`) |
| **iOS Simulator** | Press **`i`** | Requires Xcode |
| **Android Emulator** | Press **`a`** | Requires Android Studio |
| **Physical phone** | Scan QR in Expo Go | Set LAN IP in `.env` (see below) |

Optional root `.env`:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:3000
```

### Step 2: Log in

1. Browser opens → redirects to **`/login`**
2. Email and password are **prefilled in dev** (Fletcher Test account)
3. Click **Sign In**
4. You land on the **Dashboard** (Home tab)

**Prototype alignment checks (Login — mockup 02):**

- [ ] Navy “FQ” logo block, “Welcome Back” H1
- [ ] Light gray `#f5f5f5` page background
- [ ] White card with email + password fields (48px touch height)
- [ ] Password strength bar (red → amber → emerald)
- [ ] “Sign In” primary button (navy)
- [ ] Google / Apple social buttons (UI present; disabled message if backend auth active)
- [ ] Shake animation on validation errors

### Step 3: Dashboard (mockup 03)

**Route:** Home tab — `/(app)/(tabs)`

**How to get there:** Default after login, or tap **Home** in bottom nav / sidebar.

**Prototype alignment checks:**

- [ ] Greeting + “Portfolio overview” subtitle
- [ ] **4 KPI cards** in horizontal scroll (AUM, Cap Rate, Active Deals, Pending Tasks)
- [ ] **Activity feed** with icon + timestamp
- [ ] **Cap rate bar chart**
- [ ] **Emerald FAB** (bottom-right) → navigates to Analyze

**Desktop (≥1024px width):** Resize browser wide → **280px navy sidebar** replaces bottom tabs (mockup desktop layout).

### Step 4: Property Analyzer (mockup 06 → 07)

**Route:** Analyze tab — `/(app)/(tabs)/analyze`

1. Tap **Analyze** (bottom nav or sidebar)
2. **Step 1:** Address, property type, year, sqft, units → **Continue**
3. **Step 2:** Purchase price, NOI, loan fields → **Continue**
4. **Step 3:** Review summary → **Submit for Analysis**
5. Loading state → auto-navigate to **Analysis Results**

**Results route:** `/(app)/analysis/[id]`

**Prototype alignment checks:**

- [ ] 3-step **step indicator** at top
- [ ] Recommendation banner: **BUY / NEGOTIATE / HOLD / PASS**
- [ ] **Score gauge** (animated arc)
- [ ] Triggered rules list
- [ ] Risk factors + Opportunities cards

### Step 5: Deals (mockup 04 → 05)

**List:** `/(app)/(tabs)/deals`

- [ ] Deal cards with address, price, cap rate badge
- [ ] Search bar + filter chips

**Detail:** Tap any deal → `/(app)/deal/[id]`

- [ ] Tab bar: Overview / Financials / Documents / Timeline
- [ ] Timeline with status colors
- [ ] Financials chart

### Step 6: Tasks (mockup 09)

**Route:** `/(app)/(tabs)/tasks`

- [ ] Kanban: **To Do | In Progress | Done**
- [ ] Long-press a card to cycle status
- [ ] **+ Add Task** opens modal

### Step 7: Rules (mockup 08)

**Route:** Profile → **Investment Rules** → `/(app)/rules`

- [ ] Rules list with toggles
- [ ] Add rule modal
- [ ] Test rule action

### Step 8: Profile & settings (mockup 10)

**Route:** `/(app)/(tabs)/profile`

- [ ] Name + email from session (Fletcher Test)
- [ ] **Dark Mode** toggle — canvas switches to dark tokens
- [ ] **Left-Handed Mode** — sidebar/FAB flip on desktop
- [ ] **Log Out** → returns to `/login`

---

## Part B — Mobile folder (delegates to prototype app)

`reit-assistant-mobile/` runs the **same root prototype app** — no separate simplified UI.

```bash
cd reit-assistant-mobile && npm start
# equivalent to: cd reit-assistant-fqe && npm start
```

After login: **Dashboard** (mockup 03) → **Analyze** tab or FAB → 3-step Property Analyzer with Execute Search + manual financial entry.

---

## Responsive / prototype layout testing

| Viewport | What to verify |
|----------|----------------|
| **Mobile** (<768px) | Bottom tab bar (5 tabs), stacked cards, single column |
| **Tablet** (768–1023px) | Bottom nav retained; KPI row scrolls |
| **Desktop** (≥1024px) | Fixed **280px sidebar**, main content right, FAB bottom-right |

**Left-handed mode:** Profile → toggle → sidebar moves to **right**, FAB to **bottom-left**.

---

## Side-by-side prototype comparison workflow

1. Open Kimi **HTML prototype** or **PNG mockups** (if you have the deliverables folder).
2. Open **Beta app** in browser (`npm start` → `w`).
3. Set browser width:
   - **375px** — compare mobile mockups
   - **1440px** — compare desktop sidebar layout
4. Walk the table in [Reference: original prototype package](#reference-original-prototype-package) screen by screen.
5. Use `docs/01_Style_Guide.md` and `docs/02_Component_Library.md` for token-level checks (colors, spacing, radius).

---

## Known gaps vs prototype

| Prototype element | Beta app status |
|-------------------|-----------------|
| Splash screen (2.5s auto) | Not implemented |
| ATTOM / address autocomplete | Not in Beta (manual entry strategy) |
| Add Property screen in mockups | Only in `reit-assistant-mobile` (different theme) |
| OAuth with backend JWT | UI shown; backend auth disables OAuth |
| Live dashboard/deals data | Mock data (UI matches; data is sample) |

---

## Quick command reference

```bash
# Backend
cd reit-assistant-backend && npm run dev

# Prototype UI (root Beta)
cd reit-assistant-fqe && npm start
# → press w

# Manual entry Beta (mobile)
cd reit-assistant-mobile && npm start
# → press w

# Automated API tests
cd reit-assistant-fqe && ./scripts/mvp-api-test.sh
```

---

## Related docs

- [BETA_MANUAL_ENTRY.md](./BETA_MANUAL_ENTRY.md) — manual entry strategy
- [MVP_TEST_SCRIPT.md](./MVP_TEST_SCRIPT.md) — pass/fail testing
- [DESIGN_PACKAGE.md](./DESIGN_PACKAGE.md) — original deliverable index
- [01_Style_Guide.md](./01_Style_Guide.md) — colors, type, spacing
