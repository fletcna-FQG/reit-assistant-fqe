# REIT Assistant — User Flow Diagrams
**Fletcher Quill Estates Inc.**  
**Version:** 1.0.0

---

## Flow 1: Property Analysis (Acquisition Analyst)
**Goal:** Complete a property analysis in under 3 minutes  
**Persona:** Acquisition Analyst (Primary User)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Splash    │────▶│   Login     │────▶│  Dashboard  │
│  (2.5s)     │     │  (OAuth)    │     │   (Home)    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                                │
                                                │ Tap FAB or
                                                │ "Analyze"
                                                ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Results   │◀────│  Review &   │◀────│ Financials  │
│  (Score +   │     │   Submit    │     │  (Step 2)   │
│  Rules)     │     │  (Step 3)   │     │             │
└──────┬──────┘     └─────────────┘     └─────────────┘
       │                                         ▲
       │ Add to Portfolio                        │
       ▼                                         │
┌─────────────┐                                  │
│ Deals List  │◀─────────────────────────────────┘
│ (New Deal   │     Basic Info
│  Added)     │     (Step 1)
└─────────────┘
```

### Step-by-Step Flow

1. **Splash Screen**
   - Logo pulse animation
   - Spinner rotates
   - Auto-transition to Login after 2.5s

2. **Login / Registration**
   - Email + Password entry
   - Real-time email validation
   - Password strength indicator
   - Social login (Google, Apple)
   - Success → Dashboard

3. **Dashboard**
   - View KPI cards (horizontal scroll)
   - Tap FAB (bottom-right, emerald) or Analyze tab
   - Navigate to Property Analyzer

4. **Property Analyzer — Step 1: Basic Info**
   - Property Address (autocomplete ready)
   - Property Type dropdown
   - Year Built, Square Footage, Units
   - "Continue" button enabled after validation

5. **Property Analyzer — Step 2: Financials**
   - Purchase Price slider + numeric input
   - Estimated Value, NOI, Occupancy
   - Loan Amount, Interest Rate, Term
   - "Continue" button

6. **Property Analyzer — Step 3: Review & Submit**
   - Summary card with all inputs
   - "Submit for Analysis" button
   - Loading state: "Evaluating 12 rules..." progress bar
   - Auto-navigate to Results after 1.5s

7. **Analysis Results**
   - Recommendation banner (BUY/NEGOTIATE/HOLD/PASS)
   - Score gauge animates to final score
   - Triggered rules list with expandable details
   - Risk factors + Opportunities cards
   - Sticky footer: Add to Portfolio / Request Info / Share

8. **Deals List (Optional)**
   - New deal appears at top with Pipeline badge
   - Cap rate color-coded

**Estimated Time:** 2 min 15 sec (with pre-filled defaults)

---

## Flow 2: Rules Engine Management (Compliance Officer)
**Goal:** Create and test a new rule in under 2 minutes  
**Persona:** Compliance Officer (Administrative User)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Dashboard  │────▶│   Rules     │────▶│  Add Rule   │
│             │     │ Management  │     │   Modal     │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │                    │
                           │ Toggle existing    │ Fill form:
                           │ rules on/off       │ Name, Category,
                           │                    │ Conditions,
                           ▼                    │ Score Impact
                    ┌─────────────┐             │
                    │  Rule Detail│◀────────────┘
                    │   (Test)    │
                    └──────┬──────┘
                           │
                           │ Tap "Test"
                           ▼
                    ┌─────────────┐
                    │ Test Result │
                    │  (Preview)  │
                    └─────────────┘
```

### Step-by-Step Flow

1. **Dashboard → Rules Tab/Sidebar**
   - View list of active/inactive rules
   - Toggle switches for quick enable/disable
   - Drag handles for priority reordering

2. **Tap "+" (Add Rule)**
   - Modal opens with scale animation

3. **Rule Creation Form**
   - Rule Name input
   - Category dropdown (Financial / Risk / Market / Compliance)
   - Condition builder:
     - Field selector (Cap Rate, Occupancy, DSCR, NOI, etc.)
     - Operator selector (≥, ≤, =, between)
     - Value input
     - "Add Condition" for AND/OR logic
   - Action builder:
     - Action type (Flag, Approve, Reject, Notify, Adjust Score)
     - Message input
     - Score modifier slider (-100 to +100)
     - Priority slider (1–10)

4. **Tap "Test Rule"**
   - Sample data modal appears
   - Enter test property values
   - Tap "Run Test"

5. **Test Results**
   - Side-by-side: Before Score / After Score
   - Highlighted conditions that matched
   - Green checkmark (triggered) or Red X (not triggered)
   - "Rule would trigger: +20 points"

6. **Save Rule**
   - Rule added to list with Active toggle ON
   - Toast: "Rule created successfully"

**Estimated Time:** 1 min 45 sec

---

## Flow 3: Deal Pipeline Review (Portfolio Manager)
**Goal:** Monitor portfolio and review deal progression  
**Persona:** Portfolio Manager (Secondary User)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Dashboard  │────▶│  Deals List │────▶│ Deal Detail │
│  (KPIs)     │     │  (Filter +  │     │  (5 Tabs)   │
│             │     │   Search)   │     │             │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                                │
           ┌────────────────────────────────────┤
           │                                    │
           ▼                                    ▼
    ┌─────────────┐                    ┌─────────────┐
    │   Tasks     │                    │  Analysis   │
    │   (Add)     │                    │   Tab       │
    └─────────────┘                    └─────────────┘
           │                                    │
           │                                    ▼
           │                           ┌─────────────┐
           │                           │ Approve /   │
           │                           │ Reject /    │
           │                           │ Request Info│
           │                           └─────────────┘
           │                                    │
           └────────────────────────────────────┘
                            │
                            ▼
                    ┌─────────────┐
                    │  Dashboard  │
                    │  (Updated   │
                    │   KPIs)     │
                    └─────────────┘
```

### Step-by-Step Flow

1. **Dashboard**
   - Review KPI cards: Total AUM, Avg Cap Rate, Active Deals, Pending Tasks
   - Tap "View All" on Recent Activity

2. **Deals List**
   - Search bar (collapsible, top)
   - Filter chips: All, Multifamily, Commercial, Industrial, Retail
   - Sort by: Date, Cap Rate, Price, Status
   - Swipe left on deal card for Quick Actions (View, Edit, Archive)
   - Pull to refresh
   - Infinite scroll pagination

3. **Deal Detail**
   - Hero: Property image carousel + key metrics grid
   - Tab Navigation: Overview | Financials | Documents | Analysis | Tasks

4. **Overview Tab**
   - Status timeline (vertical stepper)
   - Current stage highlighted in Navy
   - Completed stages in Emerald

5. **Financials Tab**
   - 5-year cash flow projection line chart
   - Loan details accordion
   - NOI breakdown

6. **Documents Tab**
   - File list with type icons (PDF, XLSX, IMG)
   - Upload button (camera / gallery / file picker)
   - Tap to preview PDF/image in modal

7. **Analysis Tab**
   - Rules engine results
   - Score gauge
   - Triggered rules with impact scores
   - Recommendation badge

8. **Tasks Tab**
   - Related tasks list
   - "Add Task" button → Task creation modal

9. **Sticky Footer Actions**
   - Approve (Primary, Emerald) → Deal status → Approved
   - Request Info (Secondary) → Notification sent to analyst
   - Reject (Danger, Red) → Deal status → Rejected + reason prompt

10. **Return to Dashboard**
    - KPIs update in real-time
    - Activity feed shows approval action

---

## Flow 4: Task Management (Cross-Role)
**Goal:** Track and update deal-related tasks  
**Personas:** All users

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Dashboard  │────▶│ Tasks Board │────▶│ Task Detail │
│  (Pending   │     │  (Kanban)   │     │   Modal     │
│   Tasks)    │     │             │     │             │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                           │                    │
                           │ Drag cards         │ Update status
                           │ between columns    │ Add comment
                           │                    │ Change assignee
                           ▼                    │
                    ┌─────────────┐             │
                    │ Add Task    │◀────────────┘
                    │   Modal     │
                    └─────────────┘
```

### Kanban Columns
1. **Pending** — New tasks, red/yellow/green priority dots
2. **In Progress** — Active work, assigned avatars visible
3. **Completed** — Done tasks, reduced opacity (0.7)
4. **Cancelled** — Abandoned tasks, strikethrough option

### Task Card Content
- Title (bold, 14px)
- Due date (color-coded: Red=overdue, Yellow=due soon, Green=on track)
- Assigned to avatar (initials, Navy background)
- Priority dot (left border)
- Deal association tag (optional)

---

## Flow 5: Offline Resilience
**Goal:** Continue working without connectivity

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Online    │────▶│  Offline    │────▶│  Cached     │
│   State     │     │  Detected   │     │   Data      │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                                │
                                                │ User edits
                                                │ (queued)
                                                ▼
                                         ┌─────────────┐
                                         │  Sync Queue │
                                         │  (Local)    │
                                         └──────┬──────┘
                                                │
                                                │ Connection
                                                │ restored
                                                ▼
                                         ┌─────────────┐
                                         │   Sync      │
                                         │  (Batch)    │
                                         └─────────────┘
```

### Offline Behaviors
- Red banner appears at top: "⚠️ No Internet Connection — Showing cached data"
- All read operations served from local cache
- Write operations queued with timestamp
- Retry button on all error states
- Auto-sync when connection restored

---

## Flow 6: Left-Handed Mode Activation
**Goal:** Adapt UI for left-handed users  
**Trigger:** Profile → Preferences → Left-Handed Mode Toggle

### Affected Elements
| Element | Default (Right) | Left-Handed |
|---------|-----------------|-------------|
| Bottom Nav | — | — |
| Sidebar | Fixed Left | Fixed Right |
| FAB | Bottom-Right | Bottom-Left |
| Deal Card Swipe | Left→Right actions | Right→Left actions |
| Back Button | Left side | Right side (optional) |

### Animation
- Toggle switch slides ON (Emerald)
- Sidebar slides out left, slides in right (300ms)
- FAB slides from right to left (200ms)
- Toast: "Left-handed mode enabled"
