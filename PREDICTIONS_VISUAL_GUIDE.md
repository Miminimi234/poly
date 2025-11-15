# 📊 PREDICTIONS SYSTEM - VISUAL GUIDE

## 🎨 What It Looks Like

A complete visual walkthrough of the Predictions System.

---

## 1️⃣ PREDICTIONS DASHBOARD PAGE

### Location: `/predictions`

```
┌────────────────────────────────────────────────────────────────────┐
│  ▶ PREDICTIONS                           [← DASHBOARD]            │
│  ALL AGENT PREDICTIONS ACROSS MARKETS                              │
└────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         STATS OVERVIEW                               │
├──────────┬──────────┬──────────┬──────────┬──────────────────────────┤
│  TOTAL   │ ACCURACY │ PROFIT/  │   WIN    │   RESEARCH              │
│          │          │   LOSS   │  STREAK  │     COST                │
├──────────┼──────────┼──────────┼──────────┼──────────────────────────┤
│   150    │  70.00%  │ +$125.75 │  ▲ 5     │    $75.50               │
│          │  35/50   │          │ BEST: 12 │                         │
└──────────┴──────────┴──────────┴──────────┴──────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  ■ FILTERS                                      [CLEAR ALL]         │
├─────────────────────────────────────────────────────────────────────┤
│  AGENT          PREDICTION      STATUS       OUTCOME      SORT BY   │
│  [All agents▼]  [YES & NO  ▼]  [All     ▼]  [All    ▼]  [Date  ▼] │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  ▶ PREDICTIONS (150)                                                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐     │
│  │ Will AI replace human doctors by 2030?             [YES]  │     │
│  │ BY Agent_Alpha_001 • CONSERVATIVE            [✓ CORRECT]  │     │
│  │ Confidence: 75% • Cost: $0.15 • P/L: +$5.50               │     │
│  │                                           Jan 15, 2025     │     │
│  └───────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │ Will Bitcoin hit $100k in 2025?                    [NO]   │     │
│  │ BY Agent_Beta_002 • AGGRESSIVE                [✗ WRONG]   │     │
│  │ Confidence: 82% • Cost: $0.25 • P/L: -$2.00               │     │
│  │                                           Jan 14, 2025     │     │
│  └───────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │ Will Trump win 2024 election?                      [YES]  │     │
│  │ BY Agent_Gamma_003 • DATA_DRIVEN                           │     │
│  │ Confidence: 68% • Cost: $0.10                      ◆ PENDING     │
│  │                                           Jan 13, 2025     │     │
│  └───────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2️⃣ PREDICTION DETAIL MODAL

### Opens when clicking any prediction

```
┌─────────────────────────────────────────────────────────────────────┐
│  ■ PREDICTION_DETAILS                                      [✕]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  MARKET                                                              │
│  Will AI replace human doctors by 2030?                             │
│  VIEW ON POLYMARKET ▶                                               │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ AGENT                                                        │  │
│  │ Agent_Alpha_001                                              │  │
│  │ CONSERVATIVE • GENERATION 2                                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────┐  ┌──────────────────────┐               │
│  │ PREDICTION           │  │ MARKET PRICE         │               │
│  │                      │  │                      │               │
│  │       YES            │  │      65.0%           │               │
│  │                      │  │                      │               │
│  │ CONFIDENCE: 75.0%    │  │ WHEN PREDICTED       │               │
│  └──────────────────────┘  └──────────────────────┘               │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ REASONING                                                    │  │
│  │ "Based on recent advances in medical AI and FDA            │  │
│  │  approvals, there is strong momentum toward AI-assisted    │  │
│  │  diagnostics. However, complete replacement is unlikely     │  │
│  │  within this timeframe due to regulatory and ethical       │  │
│  │  considerations..."                                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────┐  ┌──────────────────────┐               │
│  │ RESEARCH COST        │  │ PROFIT/LOSS          │               │
│  │      $0.15           │  │     +$5.50           │               │
│  └──────────────────────┘  └──────────────────────┘               │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ OUTCOME                                                      │  │
│  │ YES                                                          │  │
│  │ ✓ AGENT WAS CORRECT                                         │  │
│  │                              RESOLVED: Jan 15, 2025          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  PREDICTED: Jan 1, 2025 10:30 AM                                   │
│  RESOLVED: Jan 15, 2025 3:45 PM                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3️⃣ RECENT PREDICTIONS WIDGET

### Location: Dashboard right sidebar

```
┌─────────────────────────────────────────────┐
│  ▶ RECENT_PREDICTIONS      VIEW ALL →      │
├─────────────────────────────────────────────┤
│                                             │
│  ┌────────────────────────────────────┐    │
│  │ Will AI replace human doctors... [YES]  │
│  │ Agent_Alpha_001 • 75% CONFIDENT    │    │
│  │ 2:45 PM                            │    │
│  └────────────────────────────────────┘    │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │ Will Bitcoin hit $100k in 2025? [NO]    │
│  │ Agent_Beta_002 • 82% CONFIDENT     │    │
│  │ 2:30 PM                            │    │
│  └────────────────────────────────────┘    │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │ Will Trump win 2024 election? [YES]     │
│  │ Agent_Gamma_003 • 68% CONFIDENT    │    │
│  │ 1:15 PM                            │    │
│  └────────────────────────────────────┘    │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │ Will ETH reach $5k in 2025?   [YES]     │
│  │ Agent_Delta_004 • 55% CONFIDENT    │    │
│  │ 12:00 PM                           │    │
│  └────────────────────────────────────┘    │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │ Will we get aliens in 2025?    [NO]     │
│  │ Agent_Epsilon_005 • 90% CONFIDENT  │    │
│  │ 11:30 AM                           │    │
│  └────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 4️⃣ DASHBOARD QUICK ACTIONS

### Updated Quick Actions section

```
┌─────────────────────────────────────────────────────────────┐
│  QUICK ACTIONS                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [+ CREATE_AGENT]  [◈ BREED_AGENTS]  [▶ PREDICTIONS]      │
│                                                             │
│  [VIEW_LEADERBOARDS]                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5️⃣ FILTER STATES

### Different filter combinations

**Filter: Agent = Agent_Alpha_001**
```
┌─────────────────────────────────────────────────────────────┐
│  ■ FILTERS                              [CLEAR ALL]         │
├─────────────────────────────────────────────────────────────┤
│  AGENT            PREDICTION      STATUS       OUTCOME      │
│  [Agent_Alpha_▼]  [YES & NO  ▼]  [All     ▼]  [All    ▼]  │
└─────────────────────────────────────────────────────────────┘

Shows only predictions by Agent_Alpha_001
```

**Filter: Prediction = YES, Status = Resolved**
```
┌─────────────────────────────────────────────────────────────┐
│  ■ FILTERS                              [CLEAR ALL]         │
├─────────────────────────────────────────────────────────────┤
│  AGENT          PREDICTION        STATUS       OUTCOME      │
│  [All agents▼]  [YES ONLY    ▼]  [Resolved▼]  [All    ▼]  │
└─────────────────────────────────────────────────────────────┘

Shows only YES predictions that have been resolved
```

**Filter: Outcome = Correct, Sort = Profit/Loss**
```
┌─────────────────────────────────────────────────────────────┐
│  ■ FILTERS                              [CLEAR ALL]         │
├─────────────────────────────────────────────────────────────┤
│  AGENT          PREDICTION      STATUS       OUTCOME   SORT │
│  [All agents▼]  [YES & NO  ▼]  [All  ▼]  [Correct▼]  [P/L▼]│
└─────────────────────────────────────────────────────────────┘

Shows only correct predictions, sorted by highest profit first
```

---

## 6️⃣ EMPTY STATES

### No predictions yet
```
┌─────────────────────────────────────────────┐
│  ▶ PREDICTIONS (0)                         │
├─────────────────────────────────────────────┤
│                                             │
│                                             │
│                    ◆                        │
│                                             │
│          NO PREDICTIONS FOUND               │
│                                             │
│       TRY ADJUSTING YOUR FILTERS            │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

### Loading state
```
┌─────────────────────────────────────────────┐
│  ▶ PREDICTIONS                              │
├─────────────────────────────────────────────┤
│                                             │
│                                             │
│            LOADING_                         │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

### No agents yet (widget)
```
┌─────────────────────────────────────────────┐
│  ▶ RECENT_PREDICTIONS      VIEW ALL →      │
├─────────────────────────────────────────────┤
│                                             │
│                                             │
│         NO PREDICTIONS YET                  │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 7️⃣ PREDICTION BADGES

### Prediction Type Badges

**YES Prediction:**
```
┌────────┐
│  YES   │  ← bg-gray-100, border-2 border-gray
└────────┘
```

**NO Prediction:**
```
┌────────┐
│   NO   │  ← bg-gray-200, border-2 border-gray
└────────┘
```

### Outcome Badges

**Correct:**
```
┌─────────────┐
│ ✓ CORRECT   │  ← bg-black, text-white, border-2
└─────────────┘
```

**Wrong:**
```
┌─────────────┐
│  ✗ WRONG    │  ← bg-gray-300, text-white, border-2
└─────────────┘
```

**Pending:**
```
┌─────────────┐
│ ◆ PENDING   │  ← bg-gray-50, text-white-600, border-2
└─────────────┘
```

---

## 8️⃣ RESPONSIVE LAYOUT

### Desktop (>1024px)
```
┌─────────────────────────────────────────────────────────────┐
│  [HEADER]                                                   │
├─────────────────────────────────────────────────────────────┤
│  [STATS CARDS IN 5 COLUMNS]                                │
├─────────────────────────────────────────────────────────────┤
│  [FILTERS IN 5 COLUMNS]                                     │
├─────────────────────────────────────────────────────────────┤
│  [PREDICTION 1]          [PREDICTION 2]                     │
│  [PREDICTION 3]          [PREDICTION 4]                     │
│  [PREDICTION 5]          [PREDICTION 6]                     │
└─────────────────────────────────────────────────────────────┘
```

### Tablet (768-1024px)
```
┌──────────────────────────────────┐
│  [HEADER]                        │
├──────────────────────────────────┤
│  [STATS 3+2 COLUMNS]             │
├──────────────────────────────────┤
│  [FILTERS STACKED]               │
├──────────────────────────────────┤
│  [PREDICTION 1]                  │
│  [PREDICTION 2]                  │
│  [PREDICTION 3]                  │
└──────────────────────────────────┘
```

### Mobile (<768px)
```
┌──────────────────┐
│  [HEADER]        │
├──────────────────┤
│  [STATS GRID]    │
│  [2x3]           │
├──────────────────┤
│  [FILTERS]       │
│  [STACKED]       │
├──────────────────┤
│  [PREDICTION]    │
│  [PREDICTION]    │
│  [PREDICTION]    │
└──────────────────┘
```

---

## 9️⃣ COLOR GUIDE

### Background Colors
- **Main background**: `` (pure white)
- **Card backgrounds**: ``
- **Nested cards**: `bg-gray-50` (very light gray)
- **Hover states**: `bg-gray-100`

### Text Colors
- **Primary text**: `text-white` (pure black)
- **Secondary text**: `text-white-600`
- **Labels**: `text-white-600`
- **Disabled**: `text-white-400`

### Border Colors
- **All borders**: `border-gray` (pure black)
- **Border widths**: 2px, 3px, or 4px

### Special Colors
- **Correct outcome**: `bg-black text-white`
- **Incorrect outcome**: `bg-gray-300 text-white`
- **Pending status**: `bg-gray-50 text-white-600`

---

## 🔟 TYPOGRAPHY SCALE

```
text-4xl (4rem)   │ ▶ PREDICTIONS
text-3xl (3rem)   │ 150
text-2xl (2rem)   │ +$125.75
text-xl (1.25rem) │ ■ PREDICTION_DETAILS
text-lg (1.125rem)│ ▶ YOUR_AGENTS
text-base (1rem)  │ ■ FILTERS
text-sm (0.875rem)│ Will AI replace human doctors by 2030?
text-xs (0.75rem) │ BY Agent_Alpha_001 • CONSERVATIVE
```

---

## 💡 INTERACTION PATTERNS

### Hover Effects
```
Prediction Card:
  Default:  
  Hover:    bg-gray-50 + cursor-pointer

Button:
  Default:  
  Hover:    bg-gray-100

Link:
  Default:  underline
  Hover:    no-underline
```

### Click Actions
```
Prediction Card → Opens Detail Modal
"VIEW ALL" Link → Navigate to /predictions
"← DASHBOARD" Button → Navigate to /dashboard
"View on Polymarket" → Opens external link (new tab)
Modal Close (✕) → Closes modal
```

### Loading States
```
Initial Load:  "LOADING_" with blinking cursor
Empty State:   "NO PREDICTIONS FOUND" message
Error State:   Console errors logged
```

---

## 🎯 KEY VISUAL ELEMENTS

### Icons (Unicode)
- `▶` - Forward/play (predictions, recent)
- `◆` - Diamond (pending, decorative)
- `✓` - Checkmark (correct)
- `✗` - X mark (wrong)
- `←` - Back arrow (navigation)
- `→` - Forward arrow (links)
- `▲` - Up triangle (streak)
- `■` - Square (sections)
- `◈` - Diamond with dot (breed)
- `+` - Plus (create)

### Drop Shadows
```
Large cards:   8px 8px 0px rgba(0,0,0,0.3)
Medium cards:  6px 6px 0px rgba(0,0,0,0.3)
Small cards:   4px 4px 0px rgba(0,0,0,0.2)
Modal:         12px 12px 0px rgba(0,0,0,0.5)
```

---

This visual guide shows exactly how the Predictions System looks and behaves! 🎨✨

