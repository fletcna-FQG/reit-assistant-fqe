# REIT Assistant — Rules Engine Interaction Documentation
**Fletcher Quill Estates Inc.**  
**Version:** 1.0.0

---

## Overview

The Rules Engine is the core intelligence layer of the REIT Assistant. It evaluates every property submission against a configurable set of investment criteria, producing a scored recommendation (BUY, NEGOTIATE, HOLD, PASS) with transparent reasoning.

**Key Principles:**
1. **Transparency:** Every rule trigger is shown with its logic, condition, and impact.
2. **Configurability:** Admins can create, edit, reorder, and test rules without code.
3. **Performance:** 12 rules evaluate in < 3 seconds on mid-range devices.
4. **Actionability:** Results include specific risk factors and opportunities, not just a score.

---

## Pattern A: Passive Evaluation (Automatic)

### Trigger
User submits property data via the Property Analyzer wizard.

### System Behavior
1. **Loading State**
   - Full-screen overlay with spinner
   - Progress bar: "Evaluating rule 3 of 12..."
   - Animated dots
   - Estimated time: "~2 seconds"

2. **Evaluation Process**
   ```
   For each active rule (ordered by priority):
     1. Load rule conditions
     2. Map property fields to condition variables
     3. Evaluate boolean logic (AND/OR groups)
     4. If triggered:
        - Apply score modifier
        - Add to triggered rules list
        - Generate alert/opportunity card if threshold met
     5. If not triggered:
        - Add to passed rules list (collapsed by default)
   ```

3. **Score Calculation**
   - Base score: 50 (neutral)
   - Add all positive modifiers
   - Subtract all negative modifiers
   - Clamp to range [0, 100]
   - Weighted categories:
     - Financial: 40% of total weight
     - Risk: 30% of total weight
     - Market: 30% of total weight

4. **Recommendation Mapping**
   | Score Range | Recommendation | Color | Action |
   |-------------|----------------|-------|--------|
   | 70–100 | BUY | Emerald | Proceed with acquisition |
   | 50–69 | NEGOTIATE | Amber | Renegotiate terms |
   | 30–49 | HOLD | Navy | Monitor, defer decision |
   | 0–29 | PASS | Red | Decline opportunity |

5. **Results Presentation**
   - Toast: "Analysis complete in 2.3s"
   - Screen transitions to Analysis Results

### Visual Feedback
- **Progress Bar:** Navy fill, animated width
- **Spinner:** SVG rotate, 1s linear infinite
- **Success Toast:** Emerald background, white checkmark

---

## Pattern B: Active Rule Testing (Admin)

### Trigger
Admin navigates to Rules Management → Selects rule → Taps "Test"

### System Behavior
1. **Test Modal Opens**
   - Pre-filled with sample property data
   - Editable fields for all condition variables
   - "Run Test" button (Primary)

2. **Test Execution**
   - Rule logic runs against sample data
   - No database write (sandbox evaluation)
   - Result computed in < 100ms

3. **Result Display**
   - Side-by-side comparison:
     - **Before:** Base score (e.g., 50)
     - **After:** Base score + rule impact (e.g., 70)
   - Highlighted conditions:
     - Green checkmark: Condition matched
     - Red X: Condition failed
   - Detailed breakdown:
     - Condition: "Cap Rate ≥ 7.0%"
     - Input value: "6.8%"
     - Result: "Not triggered (0.2% below threshold)"
     - Impact: "+0 points"

4. **Iteration**
   - Admin adjusts sample data
   - Taps "Run Test" again
   - Result updates instantly

### Visual Feedback
- **Before/After Cards:** White background, shadow SM, side-by-side
- **Checkmark Animation:** SVG stroke draw, 500ms ease-out
- **X Animation:** Scale bounce, 300ms

---

## Pattern C: Deal Flagging (Alert)

### Trigger
Existing deal meets negative rule threshold (e.g., occupancy drops below 80%).

### System Behavior
1. **Background Monitoring**
   - System polls deal data every 15 minutes
   - Re-evaluates all active rules
   - Detects new negative triggers

2. **Alert Generation**
   - Deal card gets pulsing red border (CSS animation)
   - Toast notification: "Deal flagged: Low DSCR detected"
   - Badge added to deal card: "⚠️ 1 Alert"

3. **User Notification**
   - Push notification (if enabled)
   - Email digest (if enabled)
   - In-app notification center entry

4. **Deal Detail View**
   - Red alert banner at top of Analysis tab
   - Alert card in Risk Factors section:
     - Title: "Occupancy Below 80% Threshold"
     - Description: "Current occupancy at 74% triggers risk flag. Review tenant retention strategy."
     - Recommended action: "Schedule property manager meeting"

5. **Resolution**
   - User acknowledges alert
   - System monitors for threshold recovery
   - Alert auto-resolves when condition clears

### Visual Feedback
- **Pulsing Border:** `box-shadow` pulse, 2s infinite
- **Toast:** Red background, white warning icon
- **Alert Card:** Red left border, light red background

---

## Pattern D: Bulk Rule Application

### Trigger
Admin updates a rule → System asks "Re-evaluate all deals with updated rules?"

### System Behavior
1. **Confirmation Modal**
   - Title: "Re-evaluate 12 deals?"
   - Message: "This will apply the updated 'Minimum Cap Rate' rule to all active deals."
   - Actions: "Re-evaluate" (Primary) / "Cancel" (Secondary)

2. **Background Job**
   - Job queued on server
   - Progress tracked in Notification Center
   - "Processing deal 4 of 12..."

3. **Batch Results**
   - Summary screen:
     - Total evaluated: 12
     - Scores changed: 3
     - New flags: 1
     - Cleared flags: 2
   - Individual deal list with before/after scores

4. **Notification**
   - Push: "Batch re-evaluation complete. 1 new flag detected."
   - Tap opens Batch Results screen

### Visual Feedback
- **Progress Ring:** Circular indeterminate spinner in notification center
- **Summary Cards:** Metric boxes with delta values (green ↑, red ↓)

---

## Score Gauge Specification

### SVG Structure
```svg
<svg width="180" height="180" viewBox="0 0 180 180">
  <!-- Background ring -->
  <circle cx="90" cy="90" r="70" 
          fill="none" stroke="#e0e0e0" stroke-width="12"/>
  <!-- Fill ring -->
  <circle cx="90" cy="90" r="70" 
          fill="none" stroke="#28a745" stroke-width="12"
          stroke-linecap="round"
          stroke-dasharray="440"
          stroke-dashoffset="97"  <!-- Animated from 440 to target -->
          transform="rotate(-90 90 90)"/>
</svg>
```

### Math
- Circumference: `2 × π × 70 ≈ 440`
- Offset formula: `440 - (440 × score / 100)`
- Example: Score 78 → `440 - (440 × 0.78) = 97`

### Color Mapping
| Score | Stroke Color | Label |
|-------|--------------|-------|
| 70–100 | `#28a745` (Emerald) | Strong |
| 50–69 | `#ffc107` (Amber) | Moderate |
| 0–49 | `#dc3545` (Red) | Weak |

### Animation
- **Duration:** 800ms
- **Easing:** ease-out (fast start, slow finish)
- **Trigger:** On screen entry (IntersectionObserver)

---

## Triggered Rules List Specification

### Header
- "Rules Evaluated: 12 | Triggered: 5"
- Font: 16px bold
- Expand/collapse "View All Rules" chevron

### Rule Item
- **Container:** White card, 14px 16px padding, shadow SM
- **Header Row:**
  - Rule name: 14px bold, Text Primary
  - Impact: 13px bold, right-aligned
    - Positive: Emerald text, "+20 pts"
    - Negative: Red text, "-25 pts"
- **Condition Row:**
  - 13px, Text Secondary
  - Format: "{Field} {Operator} {Value} (Actual: {ActualValue})"
  - Example: "Cap Rate ≥ 7.0% (Actual: 6.8%)"
- **Detail Row (expandable):**
  - Rule logic explanation
  - Category tag (Financial/Risk/Market/Compliance)
  - Priority level (1–10)
  - Created by / date

### Interaction
- Tap to expand/collapse detail row
- Chevron rotates 180° on expand
- Height transition: 250ms ease-out

---

## Risk Factors & Opportunities Cards

### Risk Factor Card
- **Background:** Red at 8% opacity (`rgba(220,53,69,0.08)`)
- **Left Border:** 4px solid Alert Red
- **Radius:** 0 8px 8px 0 (left border only)
- **Title:** 13px bold, Alert Red
- **Description:** 13px, Text Secondary
- **Icon:** Implicit via left border color

### Opportunity Card
- **Background:** Emerald at 8% opacity (`rgba(40,167,69,0.08)`)
- **Left Border:** 4px solid Emerald
- **Title:** 13px bold, Emerald Dark
- **Description:** 13px, Text Secondary

---

## Rule Condition Builder

### Condition Row
- **Layout:** Flex row, 8px gap
- **Field Selector:** Dropdown, flex: 2
  - Options: Cap Rate, Occupancy, DSCR, NOI, Purchase Price, Est. Value, Year Built, Square Footage, Units
- **Operator Selector:** Dropdown, width: 80px
  - Options: ≥, ≤, =, between, ≠
- **Value Input:** Text/numeric, flex: 1
  - Shows unit suffix (%, $, x) based on field
- **Remove Button:** X icon, appears when >1 condition

### Logic Connector
- **AND:** All conditions must match
- **OR:** Any condition may match
- **Visual:** Pill badge between rows, Navy background, white text

### Action Builder
- **Action Type:** Dropdown
  - Flag: Display warning (no score change)
  - Approve: Auto-approve deal if triggered
  - Reject: Auto-reject deal if triggered
  - Notify: Send alert to specified users
  - Adjust Score: Add/subtract points
- **Message:** Text area, 100 chars max
- **Score Modifier:** Slider, -100 to +100
- **Priority:** Slider, 1–10 (evaluation order)

---

## Sample Rules (Pre-configured)

| Rule Name | Category | Condition | Action | Impact | Priority |
|-----------|----------|-----------|--------|--------|----------|
| Minimum Cap Rate | Financial | Cap Rate ≥ 7.0% | Adjust Score | +20 | 1 |
| Occupancy Threshold | Risk | Occupancy ≥ 90% | Adjust Score | +15 | 2 |
| DSCR Minimum | Financial | DSCR ≥ 1.25x | Adjust Score | +10 | 3 |
| Market Value Gap | Market | Price ≤ MarketValue × 0.90 | Adjust Score | +18 | 4 |
| Location Tier | Market | MarketTier = "Primary" | Adjust Score | +15 | 5 |
| High Occupancy Bonus | Risk | Occupancy ≥ 95% | Adjust Score | +5 | 6 |
| Low DSCR Flag | Financial | DSCR < 1.20x | Flag + Notify | — | 7 |
| Stagnant Market | Market | YoYGrowth < 2% | Adjust Score | -10 | 8 |
| Old Property Risk | Risk | YearBuilt < 1980 | Adjust Score | -15 | 9 |
| Environmental Check | Compliance | EnvReport = "Clear" | Approve | — | 10 |
