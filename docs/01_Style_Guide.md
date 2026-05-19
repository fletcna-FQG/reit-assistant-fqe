# REIT Assistant — Style Guide
**Fletcher Quill Estates Inc.**  
**Version:** 1.0.0  
**Date:** May 18, 2026

---

## 🎨 Color Palette

### Primary Brand Colors

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| Navy | `#003366` | rgb(0, 51, 102) | Primary brand, headers, active nav, primary buttons, score text |
| Navy Light | `#004080` | rgb(0, 64, 128) | Hover states, focus rings |
| Navy Dark | `#002244` | rgb(0, 34, 68) | Pressed states, deep backgrounds |

### Semantic Colors

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| Emerald | `#28a745` | rgb(40, 167, 69) | Success, positive cash flow, BUY recommendation, FAB, completed timeline |
| Emerald Light | `#34ce57` | rgb(52, 206, 87) | Hover on success elements |
| Emerald Dark | `#1e7e34` | rgb(30, 126, 52) | Success text on light backgrounds |
| Alert Red | `#dc3545` | rgb(220, 53, 69) | Errors, reject actions, overdue tasks, risk alerts, PASS recommendation |
| Warning Amber | `#ffc107` | rgb(255, 193, 7) | Pipeline status, NEGOTIATE/HOLD recommendation, medium priority |

### Neutral Colors

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| White | `#ffffff` | rgb(255, 255, 255) | Card backgrounds, input fields, text on dark |
| Light Gray | `#f5f5f5` | rgb(245, 245, 245) | App canvas background, inactive states |
| Medium Gray | `#e0e0e0` | rgb(224, 224, 224) | Borders, dividers, disabled backgrounds |
| Dark Gray | `#666666` | rgb(102, 102, 102) | Secondary text, placeholders |
| Text Primary | `#2c3e50` | rgb(44, 62, 80) | Body text, headings |
| Text Secondary | `#7f8c8d` | rgb(127, 140, 141) | Captions, timestamps, meta text |

### Dark Mode Mapping

| Light Token | Dark Token |
|-------------|------------|
| White | `#1a1a2e` |
| Light Gray | `#16213e` |
| Medium Gray | `#0f3460` |
| Text Primary | `#eaeaea` |
| Text Secondary | `#a0a0a0` |
| Navy | `#4a90e2` |

---

## 🔤 Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Type Scale (Mobile Base)

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| Display | 28px | 700 | 1.2 | Splash title, recommendation banner |
| H1 | 24px | 700 | 1.3 | Screen headers, login title |
| H2 | 20px | 700 | 1.3 | Deal detail address, profile name |
| H3 | 18px | 700 | 1.4 | Section headers, modal titles |
| H4 | 16px | 700 | 1.4 | Card titles, KPI labels |
| Body | 15px | 400 | 1.5 | Form inputs, list items |
| Body Small | 14px | 400 | 1.5 | Activity feed text, rule descriptions |
| Caption | 13px | 600 | 1.4 | Badges, timestamps, category tags |
| Overline | 12px | 600 | 1.2 | Uppercase labels (KPI, section headers) |
| Micro | 11px | 700 | 1.2 | Breakdown percentages, bar chart labels |

### Responsive Scaling
- **Tablet:** Base + 1px
- **Desktop:** Base + 2px
- **Accessibility (200%):** All sizes scale via browser zoom; minimum 16pt body enforced

---

## 📐 Spacing System

### Base Unit: 8px

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight internal padding, icon gaps |
| sm | 8px | Small gaps, badge padding |
| md | 16px | Card padding, section gutters |
| lg | 24px | Modal padding, form group spacing |
| xl | 32px | Section breaks, hero padding |
| 2xl | 48px | Empty state padding, splash spacing |

### Layout Constants

| Token | Mobile | Tablet | Desktop |
|-------|--------|--------|---------|
| Sidebar Width | — | — | 280px |
| Bottom Nav Height | 64px | 64px | — |
| Header Height | 56px | 60px | 64px |
| Content Max Width | 100% | 100% | 1440px |
| Card Border Radius | 12px | 12px | 16px |

---

## 🎯 Elevation & Shadows

| Token | Value | Usage |
|-------|-------|-------|
| Shadow SM | `0 1px 3px rgba(0,0,0,0.12)` | Cards, badges |
| Shadow MD | `0 4px 6px rgba(0,0,0,0.1)` | Modals, dropdowns |
| Shadow LG | `0 10px 25px rgba(0,0,0,0.15)` | FAB, bottom sheets |

---

## 🔵 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| Radius SM | 8px | Buttons, inputs, small cards |
| Radius MD | 12px | Cards, modals, containers |
| Radius LG | 16px | Large cards, image containers |
| Radius XL | 24px | Splash logo, avatars |
| Full | 50% | Circular buttons, avatars, FAB |

---

## ⏱️ Animation Timing

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| Fast | 150ms | ease | Hover states, toggles |
| Base | 300ms | ease-in-out | Screen transitions, modals |
| Slow | 500ms | ease-out | Success checkmarks, gauge sweep |
| Gauge | 800ms | ease-out | Score gauge fill |

### Motion Curves
```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
```

---

## 🖼️ Iconography

### Source & Style
- **Library:** Lucide / Feather-style stroke icons
- **Stroke Width:** 2px
- **Size Scale:** 16px (micro), 20px (standard), 24px (nav), 32px (empty states)
- **Color:** Inherits from parent text color

### Icon Mapping

| Context | Icon | Size |
|---------|------|------|
| Dashboard | Grid (4 squares) | 24px |
| Deals | Hexagon | 24px |
| Analyze | Search + Plus | 24px |
| Tasks | Checklist | 24px |
| Profile | User | 24px |
| Back | Chevron Left | 20px |
| Filter | Funnel | 20px |
| Sort | Sliders | 20px |
| Notification | Bell | 20px |
| Favorite | Star | 20px |
| Share | Upload | 20px |
| Add | Plus | 24px |
| Success | Check Circle | 20px |
| Error | X Circle | 20px |
| Warning | Alert Triangle | 20px |
| Document | File Text | 20px |
| Image | Image | 20px |
| Lock | Lock | 20px |
| Settings | Gear | 20px |
| Logout | Log Out | 20px |

---

## 🌗 Theme Tokens (CSS Custom Properties)

```css
:root {
  --navy: #003366;
  --navy-light: #004080;
  --navy-dark: #002244;
  --emerald: #28a745;
  --emerald-light: #34ce57;
  --emerald-dark: #1e7e34;
  --white: #ffffff;
  --light-gray: #f5f5f5;
  --medium-gray: #e0e0e0;
  --dark-gray: #666666;
  --text-primary: #2c3e50;
  --text-secondary: #7f8c8d;
  --alert-red: #dc3545;
  --warning-amber: #ffc107;
  --success-green: #28a745;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.12);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 25px rgba(0,0,0,0.15);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --transition-fast: 150ms ease;
  --transition-base: 300ms ease-in-out;
  --sidebar-width: 280px;
  --bottom-nav-height: 64px;
  --header-height: 56px;
}
```
