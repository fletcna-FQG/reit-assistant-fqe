# REIT Assistant — Design Decision Rationale
**Fletcher Quill Estates Inc.**  
**Version:** 1.0.0  
**Date:** May 18, 2026

---

## 1. Color Palette Selection

### Why Navy `#003366` as Primary?
- **Industry alignment:** Navy is the dominant color in institutional finance and real estate. It signals trust, stability, and professionalism — critical for investor confidence.
- **Accessibility:** Against white, Navy provides a 7.2:1 contrast ratio (exceeds WCAG AAA).
- **Differentiation:** Avoids the overused "tech blue" (`#0066cc`) while remaining modern.

### Why Emerald `#28a745` for Success?
- **Semantic clarity:** Green universally means "go / positive / growth" in Western markets.
- **Distinct from Navy:** Sufficient hue separation (210° vs 135°) prevents confusion for color-blind users (Deuteranopia).
- **Financial association:** "In the green" is idiomatic for profitability.

### Why Amber `#ffc107` for Warning?
- **Caution without panic:** Amber signals attention without the urgency of red, appropriate for "NEGOTIATE" or "HOLD" recommendations.
- **Visibility:** Against white, amber provides 1.6:1 contrast — therefore **always paired with dark text** (`#b38600`) and iconography.

### Why Red `#dc3545` for Danger?
- **Standard pattern:** Matches Bootstrap/Tailwind danger red, reducing cognitive load for users familiar with web conventions.
- **Actionable:** Used sparingly to highlight true risks (PASS recommendation, overdue tasks, reject actions).

---

## 2. Typography & Information Density

### Why System Font Stack?
- **Performance:** No external font downloads; instant rendering.
- **Native feel:** `-apple-system` on iOS, `Segoe UI` on Windows, `Roboto` on Android.
- **Accessibility:** Users who customize system font sizes for vision needs get automatic scaling.

### Why 16px Minimum Body Text?
- **iOS prevention:** Safari auto-zooms inputs below 16px, breaking layout.
- **Readability:** 16px is the ergonomic minimum for extended reading on mobile.

### Why Data-Dense Layout?
- **User context:** Acquisition analysts review 10–20 deals daily. Every tap saved is time saved.
- **KPI cards:** Horizontal scroll on mobile allows 4 metrics visible at a glance without overwhelming the screen.
- **Metric grids:** 2×3 grid on mobile, 2×4 on tablet, 3×2 on desktop — always maintaining 8px gutters for breathability.

---

## 3. Navigation Architecture

### Why Bottom Tab Bar on Mobile?
- **Thumb zone:** All 5 tabs sit within the natural thumb reach zone for right-handed users (and flip for left-handed mode).
- **Muscle memory:** Fixed position prevents "hunting" for navigation.
- **5-tab limit:** Research shows 5+ tabs reduce discoverability. We consolidated "Rules" into Profile for mobile, exposing it only on desktop sidebar.

### Why Sidebar on Desktop?
- **Persistent context:** Users can see all top-level destinations without tapping.
- **Screen real estate:** 280px is 19% of a 1440px monitor — acceptable tradeoff for always-visible navigation.
- **Left-handed mode:** Sidebar flips to right edge, keeping primary navigation within thumb reach when holding a tablet or using a stylus.

---

## 4. Left-Handed Mode (FQ Non-Negotiable)

### Why a Toggle Instead of Auto-Detection?
- **Privacy:** Device orientation/hand detection requires sensors users may disable.
- **Explicit control:** Some left-handed users prefer right-handed UI; some right-handed users switch hands when tired.
- **Persistence:** Stored in `localStorage` / `AsyncStorage`, applied before first paint to prevent layout shift.

### Affected Elements
| Element | Rationale |
|---------|-----------|
| FAB | Most frequently tapped creation action; must be in dominant thumb zone |
| Sidebar | Dominant hand holds device edge; non-dominant hand navigates |
| Back Button | Kept left by default (platform convention), but right-side option spec'd for future |

---

## 5. Rules Engine Visualization

### Why Circular Score Gauge?
- **Analog familiarity:** Speedometers, fitness rings — users instantly understand "fill = good."
- **Compact:** 180×180px conveys 0–100 scale without axes or labels.
- **Color-coded:** Single hue change (Emerald → Amber → Red) communicates health at a glance.

### Why Show Triggered Rules First?
- **Transparency:** Institutional investors demand explainable AI. Showing the rules that fired proves the score isn't arbitrary.
- **Actionability:** A rule like "Occupancy below 80%" directly tells the user what to investigate.

### Why Separate Risk Factors vs. Opportunities?
- **Cognitive framing:** Separating negatives and positives prevents "mixed list" confusion.
- **Workflow:** Analysts can screenshot Opportunities for investment memos, Risk Factors for due diligence checklists.

---

## 6. Form Design (Analyzer Wizard)

### Why 3 Steps Instead of One Long Form?
- **Cognitive load:** 12+ fields on one screen trigger abandonment.
- **Progressive disclosure:** Step 1 (Basic Info) is low-friction; Step 2 (Financials) requires documents; Step 3 (Review) is confirmation.
- **Validation gates:** Users can't proceed with invalid data, but can save drafts at any step.

### Why Sliders + Numeric Inputs?
- **Speed:** Sliders allow rapid exploration ("What if purchase price is $5.2M instead of $5.1M?").
- **Precision:** Numeric inputs allow exact values for final submission.
- **Bidirectional sync:** Moving slider updates input; typing input updates slider.

---

## 7. Animation Philosophy

### Why 300ms for Screen Transitions?
- **Perceived performance:** Below 300ms feels instant; above feels sluggish.
- **60fps budget:** 300ms at 60fps = 18 frames — enough for smooth easing without jank.

### Why Scale(0.95) on Button Press?
- **Physical metaphor:** Mimics a button depressing.
- **Duration:** 100ms is below human conscious perception threshold — users "feel" it but don't "see" it.

### Why Ease-Out for Gauge Sweep?
- **Dramatic effect:** Fast start, slow finish draws attention to the final value.
- **Reassurance:** The "settling" motion implies calculation is complete and trustworthy.

---

## 8. Accessibility-First Decisions

### Why Every Color-Coded Element Has Text/Icon?
- **Color blindness:** 8% of males and 0.5% of females have some form of color vision deficiency.
- **Grayscale printing:** Investment memos may be printed in B&W; text labels preserve meaning.

### Why 44×44pt Touch Targets?
- **Apple HIG minimum:** 44×44pt is the iOS standard.
- **Motor impairment:** Users with tremors or limited dexterity need larger targets.
- **Gloves:** Field inspectors may use the app while wearing work gloves.

### Why Dark Mode?
- **Battery saving:** OLED screens use ~60% less power at dark backgrounds.
- **Night work:** Analysts often review deals after market hours; dark mode reduces eye strain.
- **Professional aesthetic:** Aligns with Bloomberg Terminal, Excel dark mode — tools familiar to the target demographic.

---

## 9. Performance Optimizations

### Why SVG Charts Instead of Chart Libraries?
- **Bundle size:** Victory Native adds ~150KB; custom SVG adds ~2KB.
- **Customization:** Exact control over animation timing, color tokens, and responsive scaling.
- **Accessibility:** SVG paths can be labeled with `<title>` and `aria-label` for screen readers.

### Why Virtualized Lists for 1000+ Deals?
- **Memory:** Rendering 1000 DOM nodes crashes mobile browsers.
- **Scroll performance:** `FlatList` with `getItemLayout` maintains 60fps by recycling off-screen cells.
- **Perceived load:** Skeleton placeholders show immediately; real data streams in.

### Why WebP Images with JPEG Fallback?
- **Compression:** WebP is 25–35% smaller than JPEG at equivalent quality.
- **Speed:** Faster load = faster analysis = happier analysts.
- **Fallback:** Safari <14 and older Android get JPEG via `<picture>` element.

---

## 10. Error State Strategy

### Why Friendly Illustrations for Empty States?
- **Emotional design:** An empty portfolio isn't a failure — it's a beginning. Illustrations reduce anxiety.
- **CTA clarity:** Empty state includes a primary button ("Add Your First Deal") to guide next action.

### Why Shake Animation for Form Errors?
- **Attention:** Motion in peripheral vision draws the eye to the error field.
- **Convention:** macOS and iOS use shake for incorrect passwords — users recognize the pattern.
- **Non-blocking:** Unlike alerts, shake doesn't require dismissal; user can immediately correct.

### Why Offline Banner Instead of Blocking Modal?
- **Continuity:** Users can still view cached data, draft analyses, and review documents.
- **Context preservation:** Blocking modal would hide the data the user is trying to reference.
- **Auto-recovery:** Banner disappears automatically when connection restores.

---

## 11. Future-Proofing

### Why Leave Room for AI/ML?
- **Score gauge:** Currently 0–100 manual score. Future: overlay "AI Confidence: 92%" below score.
- **Recommendations:** Currently rule-based. Future: "AI predicts 8.2% IRR based on comparable sales."
- **Task board:** Currently manual Kanban. Future: "AI suggests: Schedule inspection by May 22."

### Why RTL Support in CSS?
- **International expansion:** REIT markets exist in UAE, Israel, and other RTL regions.
- **Implementation:** Flexbox + logical properties (`margin-inline-start` instead of `margin-left`) make RTL flip a one-line CSS change.

---

## 12. Rejected Alternatives

| Alternative | Why Rejected | What We Chose Instead |
|-------------|--------------|----------------------|
| Hamburger menu on desktop | Hides navigation, reduces discoverability | Persistent sidebar |
| Floating bottom sheet for analyzer | Obscures content, harder to scroll | Full-screen wizard with stepper |
| 5-tab bottom nav including Rules | 5 tabs is maximum; Rules is admin-only | Rules in sidebar (desktop) / Profile submenu (mobile) |
| Gradient backgrounds | Distracting, reduces professionalism | Solid Light Gray canvas |
| Rounded corners on everything (16px+) | Too playful for institutional finance | 8–12px for UI, 24px for brand elements only |
| Custom font (e.g., Inter) | Download penalty, FOIT/FOUT | System font stack |
| Bottom sheet modals everywhere | Hard to dismiss on large phones | Centered modal with overlay |
