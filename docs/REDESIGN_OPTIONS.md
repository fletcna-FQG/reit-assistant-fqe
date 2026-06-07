# REIT Assistant — Redesign Options (May 2026)

## Navigation (implemented)

Order: **Home → REIT Rules → Analyze → Tasks → Deal**

Deal State control remains in the nav bar after **Analyze**.

---

## Property Summary — Step 5 (Valuation Summary)

**Problem:** Two primary actions (“View Results” and “Run Again”) felt duplicate at step 5 of 6.

**Implemented:** One primary **View REIT Rules Engine Results**; optional **Re-run Rules Engine** as a text link.

### Option A — Single primary (implemented)

- Primary: **View REIT Rules Engine Results**
- Secondary: small link “Re-run Rules Engine (optional)”

### Option B — Split card

- Left card: valuation numbers (read-only)
- Right card: Rule Engine status chip + one CTA

### Option C — Auto-advance

- After run completes, auto-navigate to Step 6 after 2s with “Skip” link

---

## Deals list page

### Option A — Pipeline board

Kanban columns: New / Review / Approved / Closed (matches Tasks mental model).

### Option B — Table + filters

Sortable table: Address, Cap Rate, Rule Engine, Deal State, Deal ID.

### Option C — Map + list

Map pins for geocoded properties; list below for selection.

---

## Deal Detail + sub-pages

### Option A — Persistent header strip (recommended)

Fixed header: Address, Deal ID, Cap Rate, Rule Engine chip, Deal State dropdown.  
Tabs: Overview | Financials | Documents | Analysis.  
Footer: Approve / Reject; **Add to Portfolio** only when approved/closed.

### Option B — Wizard sub-flow

Overview → Documents → Analysis → Decision (linear steps inside deal).

### Option C — Side panel

List of deals on left; detail on right (desktop); stack on mobile.

**Sub-pages:**

| Tab | Purpose |
|-----|---------|
| Overview | Metrics, timeline, Start Deal / Rule Engine summary |
| Financials | NOI trend |
| Documents | Upload / Assessor / MLS |
| Analysis | Rule Engine panel + link to full results |

---

## Portfolio hub (implemented — Option A)

**Goal:** Only **approved / closed** deals in the user portfolio; import external holdings.

### Option A — Portfolio tab (seventh nav item) ✅

- **My Portfolio:** cards of approved deals + total AUM (`/(app)/(tabs)/portfolio`)
- **Import:** CSV paste import via `POST /api/portfolio/import`
- **Add from deal:** “Add to Portfolio” on Deal Detail when status = approved/closed
- **Migration:** `20260525150000_audit_logs_portfolio.sql` (`audit_logs` + `deals.in_portfolio`)

### Option B — Home dashboard section

Portfolio summary on Home; full page at `/portfolio`.

### Option C — Deals filter

“Portfolio” filter on Deals tab (no new nav item).

---

## Rule Engine Results (implemented — Option A layout)

- Left: Recommendation banner
- Right: Score row aligned with triggered rules (no large gauge gap)
- Header: `Rule Engine: BUY 95` (no parentheses for normal scores)
- Next actions: **Start Deal Process** + **Follow-Up** (outline button)
