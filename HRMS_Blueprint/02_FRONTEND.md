# 02 — FRONTEND
> Part of HRMS Blueprint | [← Back to Index](./00_INDEX.md)
> Last Updated: June 2026 | Status: Active Development

---

## 🎨 Design System — macOS Style (FROZEN)

### CSS Variables (in `src/index.css`)

```css
/* Backgrounds */
--bg-primary:      #F8FAFC          /* Page background */
--bg-surface:      #FFFFFF          /* Card background */
--bg-surface-soft: rgba(255,255,255,0.88) /* Frosted glass surface */

/* Text */
--text-primary:    #111827          /* Near-black — main text */
--text-secondary:  #475569          /* Gray — secondary text */
--text-muted:      #64748B          /* Light gray — muted/hints */

/* Borders & Shadows */
--border:          rgba(148,163,184,0.24)
--shadow-soft:     0 16px 40px rgba(15,23,42,0.08)
--shadow-card:     0 24px 60px rgba(15,23,42,0.08)

/* Shape */
--radius-card:     24px
--radius-input:    16px
--radius-button:   16px

/* Accent Colors */
--accent:          #2563EB          /* Primary blue — CTAs */
--accent-soft:     #DBEAFE          /* Light blue — backgrounds */
--surface-frost:   rgba(255,255,255,0.78) /* Modal backdrop */
```

> Legacy: Old blueprint had `#1E40AF` as primary — actual implementation uses `#2563EB`. Use actual values above.

### Tailwind Config Extensions

```
MAC_BLUE:    #007AFF     (used in backend uiConstants, sync with frontend)
Accent:      #2563EB
```

### Typography

```
Font Family:      Inter (Google Fonts)
Base size:        14px–16px body
Headings:         600 weight
UI labels:        uppercase, letter-spacing: 0.04em
```

### Spacing Scale (4px base)

```
4px  8px  12px  16px  20px  24px  32px  40px  48px
```

### Component Rules

```
Cards:    bg-surface + shadow-card + radius-card (24px)
Inputs:   border-[--border] + bg-surface-soft + radius-input (16px)
Buttons:  bg-[--accent] + text-white + radius-button (16px)
          Secondary: bg-[--accent-soft] for ghost/outline actions
Modals:   backdrop-filter: blur(18px) + surface-frost background
```

### Button Types

```
Primary:   bg-[--accent] text-white           ← Save, Submit, Confirm
Secondary: border border-[--accent] text-[--accent]  ← Cancel, Back
Danger:    bg-red-600 text-white              ← Delete, Terminate
Ghost:     bg-transparent text-[--text-secondary]    ← View, Edit inline
```

---

## 🗂️ Actual Folder Structure (`frontend/src/`)

```
src/
├── assets/                   ← Images, icons, fonts
├── components/
│   ├── ui/                   ← Buttons, inputs, modals, tables, badges
│   ├── layout/               ← Sidebar, header, footer, nav
│   └── shared/               ← Charts, file upload, pagination, toast
├── pages/
│   ├── auth/                 ← Login, forgot-password, reset-password
│   ├── dashboard/            ← Main dashboard
│   ├── employees/            ← Add (KYC wizard), list, profile, import
│   ├── attendance/           ← Mark, view, regularize, shifts, holidays
│   ├── leave/                ← Apply, approve, balance, types
│   ├── payroll/              ← PayrollDashboard, PayrollRunPage, PayrollReportsPage
│   ├── compliance/           ← PF, ESI, PT, TDS, Form16
│   ├── recruitment/          ← ATS, Kanban board, candidates
│   ├── performance/          ← KRA/KPI, appraisals
│   ├── training/             ← Training management
│   ├── assets/               ← Asset management
│   ├── expenses/             ← Expense claims
│   ├── reports/              ← All reports + export
│   ├── automation/           ← EPFO, ESIC, GST lookup UI
│   ├── settings/             ← System settings, integrations
│   ├── billing/              ← BillingPage, subscription UI
│   └── platform/             ← Admin panel (platform owner)
├── services/
│   └── api.js                ← Axios instance (baseURL: /api/v1 via Vite proxy)
├── store/                    ← Zustand stores (auth, notifications, etc.)
├── hooks/                    ← Custom React hooks
├── utils/
│   ├── theme.js              ← Shared THEME constants (colors, palette tokens)
│   └── uiConstants.js        ← Frontend UI icon/shape constants
└── App.jsx                   ← Root with React Router routes
```

---

## 🧭 Full Route Map

### Public Routes (No Login Required)
```
/login                          ← Tenant login (resolves by subdomain)
/forgot-password                ← Password reset request
/reset-password/:token          ← Password reset with token
/register                       ← New SaaS client self-registration
```

### Auth-Protected Routes
```
/dashboard                      ← Main dashboard

/employees                      ← Employee list
/employees/new                  ← Add employee (KYC wizard)
/employees/import               ← Bulk import CSV/Excel
/employees/:id                  ← Employee profile view
/employees/:id/edit             ← Edit employee

/attendance                     ← Attendance view
/attendance/mark                ← Mark attendance
/attendance/regularize          ← Regularization requests
/attendance/shifts              ← Shift management
/attendance/holidays            ← Holiday calendar

/leave                          ← Leave dashboard
/leave/apply                    ← Apply for leave
/leave/approvals                ← Approve/reject leaves
/leave/balance                  ← Leave balance view
/leave/settings                 ← Leave types & policies

/payroll                        ← Payroll dashboard
/payroll/run                    ← Run payroll (month selection)
/payroll/payslips               ← Payslip view/download
/payroll/reports                ← Payroll reports
/payroll/fnf                    ← Full & Final settlement

/compliance                     ← Compliance overview
/compliance/pf                  ← PF ECR challan
/compliance/esi                 ← ESI challan
/compliance/pt                  ← PT
/compliance/tds                 ← TDS Form 16

/reports                        ← Reports list
/reports/:type                  ← Specific report view

/recruitment                    ← Job openings / pipeline
/recruitment/candidates         ← Candidate profiles
/recruitment/kanban             ← Kanban board

/performance                    ← Performance cycles
/training                       ← Training programs
/assets                         ← Asset register
/expenses                       ← Expense claims

/automation                     ← Automation task list
/automation/gst                 ← GST lookup
/automation/kyc                 ← Aadhaar KYC

/settings                       ← General settings
/settings/roles                 ← Role & permission management
/settings/modules               ← Module enable/disable
/settings/notifications         ← Notification preferences
/settings/integrations          ← Third-party integrations

/billing                        ← Billing & subscription
/billing/subscription           ← Plan selection + upgrade
```

### Platform Admin Routes (Platform Owner Only)
```
/admin                          ← Platform admin dashboard
/admin/tenants                  ← Tenant list + management
/admin/subscriptions            ← All tenant subscriptions
/admin/billing                  ← Platform-level billing view
```

---

## 🌐 API Client Setup

```javascript
// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',   // Vite proxies to http://localhost:5001 in dev
  withCredentials: true, // Send cookies (refresh token)
});

// Interceptor: attach CSRF token to mutating requests
api.interceptors.request.use((config) => {
  if (['post','put','patch','delete'].includes(config.method)) {
    config.headers['X-CSRF-Token'] = getCsrfToken(); // from cookie
  }
  return config;
});
```

---

## 📡 WebSocket (Real-Time Notifications)

```javascript
// Connect on login, disconnect on logout
const ws = new WebSocket(`wss://${host}/ws?token=${accessToken}`);
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  // msg.type: 'notification' | 'connected' | 'ping'
  // msg.payload: { title, body, url }
};
```

> Token must be a valid access JWT — connection rejected if expired or missing.

---

## 🎨 Theme Implementation Files

| File | Purpose |
|------|---------|
| `src/utils/theme.js` | Shared THEME color palette constants (JS) |
| `src/utils/uiConstants.js` | Icon maps, shape constants for UI components |
| `src/index.css` | CSS variables (above tokens) + Tailwind base |

> Rule: Never import `theme.js` in service or business-logic files. Use only in UI components.

---

## 🔗 Related Documents
- Backend routes → [03_BACKEND.md](./03_BACKEND.md)
- All module features → [06_MODULES.md](./06_MODULES.md)
- Auth flows → [09_AUTH_FLOWS.md](./09_AUTH_FLOWS.md)
