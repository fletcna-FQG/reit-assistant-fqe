# REIT Assistant — Design Revision (Beta Feedback)

**Fletcher Quill Estates Inc.** | May 2026

This document captures the design changes requested for Property Search, Rules Engine, navigation, integrations, and post-save workflows. **Implemented items** are marked ✅; **planned** items describe the next sprint.

---

## 1. Property Search (Analyze tab)

### ✅ Implemented
| Element | Behavior |
|---------|----------|
| **Data entry mode** | Toggle: **Manual entry** vs **Automated search** |
| **Property type** | Required chip selector (Multifamily, Office, Retail, …) |
| **Manual mode** | Location + type → Continue → financials (no Execute Search required) |
| **Automated mode** | Location + type → **Execute Search** → then financials |
| **Post-save** | Navigate to **Saved Property** screen (not straight to Home) |

### Planned
- CSV import from spreadsheet integrations on Step 1
- ATTOM / Nominatim pre-fill when integration enabled in Settings
- Persist `property_type` and `entry_mode` in backend schema

---

## 2. Post-save → Rules Engine flow

### ✅ Implemented
```
Save Property → Property Detail (/property/[id])
              → Review NOI, Value, type
              → [Run REIT Rules Engine]
              → Analysis Results (/analysis/[id])
```

### Planned
- Optional auto-run rules on save (user setting)
- Link saved property to Deals pipeline
- Email results via enabled integration

---

## 3. Navigation (mobile + desktop)

### ✅ Implemented
**Bottom tab order:** Home → **REIT Rules** → Analyze → Deals → Tasks

| Item | Notes |
|------|-------|
| REIT Rules tab | Full title on screen: **REIT Rules Engine** |
| Tab icon | Race car + horse backdrop (FQE motif) |
| Profile & Settings | Removed from tab bar; access via **Settings** on Dashboard or sidebar footer |
| Left-handed nav | **Profile & Settings → Navigation bar on the right** reverses tab order |

### Desktop
Sidebar follows same order; left-handed mode flips sidebar to the right (existing `ResponsiveLayout`).

---

## 4. REIT Rules Engine

### ✅ Implemented
| Feature | Behavior |
|---------|----------|
| Out-of-box rules | **Out-of-box** badge; enable/disable only; **Edit** limited (score impact); **no delete** |
| Custom rules | **Custom** badge; enable/disable, **Edit**, **Delete** |
| **+ Add Rule** | Opens **Manage Rules** — lists OOB + custom with full controls |
| Edit screen | `/rules/[id]/edit` — system rules: read-only name/conditions |

### Planned
- Rule test sandbox with live property data
- Rule templates library
- Audit log for rule changes

---

## 5. Integrations (Settings)

### ✅ Implemented — catalog in **Profile & Settings**
Users can **enable/disable** integrations (stored locally in Beta):

| Category | Examples |
|----------|----------|
| Property data | ATTOM (paid), OpenStreetMap Nominatim (free), County Assessor (manual) |
| Import | Spreadsheet / CSV |
| Email | Google Workspace, Microsoft 365 |
| Calendar | Google Calendar |
| Video | Zoom |

### Free / low-cost property data options (research)
| Source | Use in REIT Assistant | Limitation |
|--------|----------------------|------------|
| **OpenStreetMap Nominatim** | Address geocoding | Rate limits; attribution required |
| **County assessor portals** | Manual CSV export → Analyze | No standard API |
| **ATTOM** | Production automated search | Paid API (stub ready in backend) |
| **Zillow / Redfin** | Not recommended | No stable free API for CRE |

### Planned production integration fields
Each integration entry includes configurable fields (API keys, OAuth) — see `constants/integrations.ts`.

---

## 6. Suggested screen map (revised)

```
Login
  └── Dashboard (Home)
        ├── Analyze → [Manual | Automated] → Save → Property Detail → Rules Engine → Results
        ├── REIT Rules Engine (tab)
        │     └── Manage Rules (+ Add / Edit / Delete custom)
        ├── Deals
        ├── Tasks
        └── Settings (Profile, Nav position, Integrations, Logout)
```

---

## 7. Test checklist (new flows)

1. Analyze → **Manual entry** → select **Retail** → save → Property Detail → **Run REIT Rules Engine** → Results
2. Analyze → **Automated search** → Execute Search → save → same flow
3. REIT Rules tab → disable OOB rule → try delete (blocked) → Edit → save
4. **+ Add Rule** → create custom → enable/disable → delete
5. Settings → enable Nominatim + CSV → toggle **Navigation bar on the right**
6. Confirm tab order: Home, REIT Rules, Analyze, Deals, Tasks

---

## Related files
- `app/(app)/(tabs)/analyze.tsx` — entry mode + property type
- `app/(app)/property/[id].tsx` — post-save + rules CTA
- `app/(app)/(tabs)/rules.tsx` — REIT Rules Engine tab
- `app/(app)/rules/manage.tsx` — rule library
- `app/(app)/settings.tsx` — integrations + nav preference
- `constants/integrations.ts` — integration catalog
