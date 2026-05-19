# REIT Assistant — Component Library
**Fletcher Quill Estates Inc.**  
**Version:** 1.0.0

---

## 🧩 Button System

### Primary Button
- **Background:** Navy (`#003366`)
- **Text:** White, 16px, weight 600
- **Padding:** 14px 24px
- **Radius:** 8px
- **States:**
  - Hover: Navy Light (`#004080`)
  - Active: Scale 0.95, 100ms linear
  - Disabled: Opacity 0.5, pointer-events none
- **Usage:** Main CTAs (Sign In, Submit Analysis, Approve Deal)

### Secondary Button
- **Background:** Transparent
- **Border:** 2px solid Navy
- **Text:** Navy, 16px, weight 600
- **States:**
  - Hover: Navy at 5% opacity fill
  - Active: Scale 0.95
- **Usage:** Alternative actions (Create Account, Request Info, Save Draft)

### Tertiary / Ghost Button
- **Background:** Transparent
- **Text:** Text Secondary, 16px, weight 600
- **States:**
  - Hover: Light Gray background
- **Usage:** Low-priority actions (Cancel, Back, Share)

### Danger Button
- **Background:** Alert Red (`#dc3545`)
- **Text:** White
- **Usage:** Destructive actions (Reject Deal, Delete Rule, Logout)

### Floating Action Button (FAB)
- **Size:** 56×56px
- **Background:** Emerald (`#28a745`)
- **Icon:** White, 24px
- **Shadow:** Shadow LG
- **Position:** Fixed bottom-right (mobile), bottom-right (desktop)
- **Left-Handed Override:** Fixed bottom-left
- **Usage:** Primary creation action (Add Deal / Analyze Property)

### Social Login Button
- **Background:** White
- **Border:** 1px solid Medium Gray
- **Text:** Text Primary, 16px
- **Icon:** 18px, left-aligned
- **Usage:** Google OAuth, Apple Sign-In

---

## 📝 Input System

### Text Input
- **Height:** 48px (touch target compliant)
- **Padding:** 14px 16px
- **Border:** 2px solid Medium Gray (`#e0e0e0`)
- **Radius:** 8px
- **Font:** 16px (prevents iOS zoom)
- **Focus:** Navy border + 3px Navy at 10% opacity glow
- **Error:** Alert Red border + shake animation (300ms)
- **Disabled:** Light Gray background, Dark Gray text

### Select / Dropdown
- Same base as Text Input
- Chevron icon right-aligned, 16px
- Native select on mobile for optimal UX

### Slider
- **Track Height:** 6px
- **Track Color:** Medium Gray
- **Thumb:** 24×24px circle, Navy background
- **Thumb Shadow:** Shadow SM
- **Value Label:** Right-aligned, 14px, Navy, weight 700

### Password Strength Indicator
- **Height:** 4px
- **Track:** Medium Gray
- **Fill Colors:**
  - 0–49%: Alert Red
  - 50–74%: Warning Amber
  - 75–100%: Emerald
- **Transition:** Width 300ms ease

---

## 🃏 Card System

### Deal Card
- **Background:** White
- **Radius:** 12px
- **Padding:** 16px
- **Shadow:** Shadow SM
- **Left Accent:** 4px vertical bar (color-coded by status)
  - Pipeline: Warning Amber
  - Under Review: Navy
  - Approved: Emerald
  - Closed: Dark Gray
- **Content:**
  - Address: 16px bold, Text Primary
  - Price: 15px bold, color-coded (Emerald positive, Red negative)
  - Badges: Cap Rate badge + Status pill
- **Interaction:** Tap to scale 0.98, navigate to Deal Detail

### KPI Card
- **Background:** White
- **Radius:** 12px
- **Padding:** 16px
- **Min Width:** 160px (mobile scroll), auto (desktop grid)
- **Content:**
  - Label: 12px uppercase, Text Secondary, weight 600
  - Value: 24px, Navy, weight 700
  - Delta: 12px, color-coded (Emerald/Red)

### Task Card (Kanban)
- **Background:** White
- **Radius:** 8px
- **Padding:** 12px
- **Shadow:** Shadow SM
- **Left Border:** 3px (Red=High, Amber=Medium, Green=Low)
- **Content:**
  - Title: 14px bold
  - Meta row: Due date (color-coded) + Assignee avatar
- **Opacity:** 0.7 when in Completed column

### Metric Box
- **Background:** Light Gray
- **Radius:** 8px
- **Padding:** 12px
- **Content:**
  - Label: 11px uppercase, Text Secondary
  - Value: 18px, Navy, weight 700

---

## 🪟 Modal System

### Standard Modal
- **Overlay:** Black at 50% opacity
- **Container:** White, radius 16px, max-width 480px
- **Padding:** 16px
- **Animation:** Scale 0.9 → 1.0, 200ms ease
- **Structure:**
  - Header: Title (18px bold) + Close button (✕)
  - Body: Scrollable, max-height 70vh
  - Footer: Action buttons, right-aligned

### Alert Modal
- Same container as Standard
- Icon: 48px, centered, color-coded
- Title: 20px bold, centered
- Message: 14px, Text Secondary, centered
- Actions: Stacked full-width buttons (primary top, secondary bottom)

### Bottom Sheet (Mobile)
- **Position:** Fixed bottom
- **Container:** White, radius 24px top corners
- **Handle:** 40×4px bar, Light Gray, centered top
- **Animation:** Slide up from bottom, 300ms ease-out

---

## 🧭 Navigation Components

### Bottom Tab Bar (Mobile < 1024px)
- **Height:** 64px
- **Background:** White
- **Border:** 1px solid Medium Gray top
- **Shadow:** 0 -4px 12px rgba(0,0,0,0.05)
- **Items:** 5 tabs, flex evenly
- **Active State:** Navy text + 3px top indicator bar
- **Icon:** 24px stroke icon + 11px label below

### Sidebar (Desktop ≥ 1024px)
- **Width:** 280px
- **Background:** White
- **Border:** 1px solid Medium Gray right
- **Header:** Logo (40px) + Brand name (18px bold)
- **Nav Items:** 14px, weight 600, padding 12px 16px, radius 8px
  - Active: Navy at 8% opacity background + Navy text
  - Hover: Light Gray background
- **Footer:** Profile nav item
- **Left-Handed Override:** Position fixed right, border-left instead of border-right

### Screen Header
- **Height:** 56px (mobile), 64px (desktop)
- **Background:** White
- **Border:** 1px solid Medium Gray bottom
- **Content:**
  - Left: Back button (if applicable) + Screen title (18px bold, Navy)
  - Right: Action icons (filter, sort, add)
- **Sticky:** Top 0, z-index 50

---

## 📊 Chart Components

### Score Gauge
- **Type:** SVG circular progress
- **Size:** 180×180px
- **Background Ring:** 12px stroke, Medium Gray
- **Fill Ring:** 12px stroke, Emerald (or Amber/Red based on score)
  - Stroke-dasharray: 440
  - Stroke-dashoffset animated from 440 to target
  - Duration: 800ms ease-out
- **Center Text:** 48px bold score + 12px uppercase label
- **Score Colors:**
  - 70–100: Emerald
  - 50–69: Warning Amber
  - < 50: Alert Red

### Bar Chart
- **Container:** White card, 16px padding
- **Bars:** Navy fill, 4px top radius
- **Labels:** 11px, Text Secondary, below bars
- **Values:** 11px, Navy, above bars
- **Animation:** Height grows from 0, 500ms ease-out

### Line Chart
- **Container:** White card, 16px padding
- **Line:** 3px stroke, Emerald, round caps
- **Area Fill:** Emerald at 10% opacity
- **Dots:** 8px circles, Emerald fill, 2px white stroke
- **X-Axis Labels:** 11px, Text Secondary

### Timeline (Vertical Stepper)
- **Line:** 2px vertical, Medium Gray
- **Nodes:** 12px circles
  - Completed: Emerald fill
  - Active: Navy fill + 3px Navy at 20% glow
  - Pending: Medium Gray fill
- **Text:** 14px bold title + 12px secondary date

---

## 🏷️ Badge System

### Cap Rate Badge
- **Padding:** 4px 10px
- **Radius:** 20px (pill)
- **Font:** 12px bold, uppercase
- **Variants:**
  - Green (≥7%): Emerald at 10% bg + Emerald Dark text
  - Yellow (5–7%): Amber at 15% bg + `#b38600` text
  - Red (<5%): Red at 10% bg + Alert Red text

### Status Pill
- **Padding:** 4px 10px
- **Radius:** 20px
- **Background:** Light Gray
- **Text:** Text Secondary, 12px bold, uppercase
- **Usage:** Pipeline, Under Review, Approved, Closed

### Category Tag
- **Padding:** 2px 8px
- **Radius:** 4px
- **Background:** Navy at 10% opacity
- **Text:** Navy, 11px bold, uppercase
- **Usage:** Financial, Risk, Market, Compliance

---

## 🔔 Feedback Components

### Toast Notification
- **Position:** Fixed top-center
- **Background:** Text Primary (default), Emerald (success), Alert Red (error), Amber (warning)
- **Text:** White (or Text Primary on warning), 14px, weight 500
- **Padding:** 12px 20px
- **Radius:** 8px
- **Shadow:** Shadow LG
- **Animation:** Slide down + fade in, 300ms
- **Auto-dismiss:** 3000ms
- **Icon:** Prefix with status symbol (✓, ✕, ⚠, ℹ)

### Offline Banner
- **Position:** Sticky top, full width
- **Background:** Alert Red
- **Text:** White, 13px bold, centered
- **Content:** "⚠️ No Internet Connection — Showing cached data"
- **Z-index:** 500

### Empty State
- **Layout:** Centered, padding 48px
- **Icon:** 80px circle, Light Gray bg, 32px emoji/icon
- **Title:** 18px bold, Text Primary
- **Message:** 14px, Text Secondary, max-width 280px
- **CTA:** Primary button below

### Skeleton Loader
- **Base:** Light Gray background
- **Shimmer:** Linear gradient animation (left to right)
- **Usage:** Card placeholders during data fetch
- **Animation:** 1.5s infinite

---

## 🎚️ Toggle Switch
- **Track:** 48×28px, radius 14px
- **Off State:** Medium Gray background
- **On State:** Emerald background
- **Thumb:** 24×24px circle, White, shadow SM
- **Transition:** Transform 200ms ease (thumb slides 20px)
- **Accessibility:** Labeled, keyboard focusable
