# 14 — LEAVE FLOWS
> Part of HRMS Blueprint | [← Back to Index](./00_INDEX.md)
> Format: FE = Frontend | BE = Backend | DB = Database
> Last Updated: June 2026

---

## PAGES IN THIS DOCUMENT
```
1. Leave Dashboard
2. Apply Leave (Employee)
3. Leave Approval (Manager/HR)
4. Leave Balance View
5. Leave Type Configuration
6. Leave Accrual (Auto Monthly/Quarterly/Yearly)
7. Leave Encashment
8. Team Leave Calendar
9. Leave Reports
```

---
---

## 1. LEAVE DASHBOARD
**URL:** `/leave`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| GET /api/v1/leave/dashboard | | |
| | Fetch employee's leave balances | READ: leave_balances WHERE employee_id = ? |
| | Fetch pending leave applications | READ: leave_applications WHERE status = pending |
| | Fetch upcoming approved leaves | READ: leave_applications WHERE from_date >= today |
| | Fetch team on leave today | READ: leave_applications WHERE today BETWEEN from_date AND to_date |
| **My Leave Balances cards:** | | |
| Per leave type: Available / Used / Pending | | |
| Color coded by balance (green/amber/red) | | |
| **Pending Approvals** (if manager/HR): | | |
| Count badge with employee names | | |
| Quick approve/reject from dashboard | | |
| **My Recent Applications:** | | |
| Last 5 applications with status | | |
| **Team on Leave Today:** | | |
| Employee names + leave type | | |

---
---

## 2. APPLY LEAVE
**URL:** `/leave/apply`

---

### Step 2.1 — Leave Application Form

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| **Leave Type dropdown:** | GET /api/v1/leave/types | READ: leave_types WHERE is_active = true |
| Show balance remaining per type in dropdown | | READ: leave_balances |
| On type select: show type rules below form | | |
| **Date selection:** | | |
| From Date (date picker) | | |
| To Date (date picker) | | |
| Exclude weekends/holidays auto (toggle) | | |
| **Days calculation (real-time):** | | |
| As dates selected → calculate working days | POST /api/v1/leave/calculate-days | READ: holidays, shifts |
| Exclude holidays + week offs in count | | |
| Show: "X working days" | | |
| Half day option (if type allows): First half / Second half | | |
| **Balance check (real-time):** | | |
| Show: Available X days, Applying for Y days | | |
| If Y > X → show warning in amber | | |
| If type is LOP → no balance check needed | | |
| **Reason field:** | | |
| Text area, mandatory for sick leave | | |
| Optional for casual leave | | |
| **Document upload:** | | |
| Shown only if leave type requires docs | | |
| Mandatory if sick leave > configured days | | |
| **Reporting manager shown:** | | |
| "Leave will be approved by: [Manager Name]" | | |
| Submit button | | |

---

### Step 2.2 — Submit Leave Application

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Validate all fields | | |
| POST /api/v1/leave/apply | | |
| Send: { leaveTypeId, fromDate, toDate, days, halfDay, reason, document } | | |
| | Validate dates not in past (if configured) | |
| | Validate no overlapping leave application | READ: leave_applications WHERE employee_id = ? AND dates overlap |
| | Validate balance sufficient (or LOP) | READ: leave_balances |
| | Check leave clubbing restrictions (e.g. CL + SL not allowed together) | READ: leave_types.clubbing_rules |
| | Check minimum gap rule between leaves | READ: leave_applications (last approved) |
| | If all valid: | |
| | → Create application | WRITE: leave_applications { status: pending } |
| | → Update pending balance | WRITE: leave_balances.pending += days |
| | → Notify manager (email + WhatsApp) | |
| | → Write audit log | WRITE: audit_logs |
| | Return: { applicationId, message } | |
| Show success: "Leave applied, pending approval" | | |
| Redirect to leave list | | |

---
---

## 3. LEAVE APPROVAL
**URL:** `/leave/approvals`

---

### Step 3.1 — Approvals List (Manager/HR View)

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| GET /api/v1/leave/approvals/pending | | |
| | Fetch pending applications for this manager's team | READ: leave_applications WHERE approver = current_user AND status = pending |
| | Join: employee name, leave type, days, dates, reason | |
| | Return list | |
| Show pending applications list | | |
| Filters: All / My Team / All Company (HR only) | | |
| Sort: oldest first (default) | | |
| **Per application:** | | |
| Employee name + photo | | |
| Leave type + days | | |
| Dates: From → To | | |
| Reason | | |
| Employee's current balance shown | | |
| Team calendar snippet (who else is on leave those days) | | |
| Approve / Reject buttons | | |

---

### Step 3.2 — Approve Leave

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Click Approve | | |
| Optional: add comment | | |
| PUT /api/v1/leave/:id/approve | | |
| | Check application still pending (not cancelled) | READ: leave_applications.status |
| | Check balance still sufficient | READ: leave_balances |
| | Update application status | WRITE: leave_applications.status = approved |
| | Deduct from leave balance | WRITE: leave_balances.used += days, pending -= days |
| | Update attendance for those dates | WRITE: attendance { status: on_leave } for each date |
| | Notify employee (email + WhatsApp) | |
| | Write audit log | WRITE: audit_logs |
| Show: "Leave approved" toast | | |
| Remove from pending list | | |

---

### Step 3.3 — Reject Leave

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Click Reject | | |
| **Mandatory rejection reason modal** | | |
| Reason text input (mandatory) | | |
| PUT /api/v1/leave/:id/reject | | |
| Send: { reason } | | |
| | Update application status | WRITE: leave_applications.status = rejected |
| | Release pending balance | WRITE: leave_balances.pending -= days |
| | Save rejection reason | WRITE: leave_applications.rejection_reason |
| | Notify employee with reason | |
| | Write audit log | WRITE: audit_logs |

---

### Step 3.4 — Employee Cancels Leave

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Employee views their applications | | |
| Cancel button on pending/approved (if future date) | | |
| Confirm dialog | | |
| PUT /api/v1/leave/:id/cancel | | |
| | Check leave is future date | |
| | If pending: release pending balance | WRITE: leave_balances.pending -= days |
| | If approved: restore used balance | WRITE: leave_balances.used -= days |
| | Update attendance back | WRITE: attendance (revert on_leave status) |
| | Update application status | WRITE: leave_applications.status = cancelled |
| | Notify manager | |

---
---

## 4. LEAVE BALANCE VIEW
**URL:** `/leave/balances`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Employee dropdown (HR sees all, employee sees own) | | |
| Year selector | | |
| GET /api/v1/leave/balances?employeeId=&year= | | |
| | Fetch all leave type balances for employee+year | READ: leave_balances JOIN leave_types |
| | Return: opening, accrued, used, pending, available | |
| **Balance table per leave type:** | | |
| Leave Type / Opening / Accrued / Used / Pending / Available / Lapsing | | |
| Color bar showing usage percentage | | |
| **Leave history below table:** | | |
| All applications with dates, days, status | | |
| Filter by status, leave type, date range | | |
| Export to Excel button | | |

---
---

## 5. LEAVE TYPE CONFIGURATION
**URL:** `/settings/leave-types`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| List all leave types | GET /api/v1/settings/leave-types | READ: leave_types |
| Add Leave Type button | | |
| **Leave type form:** | | |
| Name (Casual Leave) | | |
| Code (CL) | | |
| Paid / Unpaid toggle | | |
| **Accrual settings:** | | |
| Accrual type: Monthly/Quarterly/Yearly/One-time | | |
| Days per accrual period | | |
| Accrual start: From joining OR from fixed date | | |
| Pro-rate first month: Yes/No | | |
| **Balance rules:** | | |
| Max balance cap (e.g. max 30 days) | | |
| Carry forward: Yes/No | | |
| If yes: max carry forward days | | |
| Lapse remaining at year end: Yes/No | | |
| Encashable: Yes/No | | |
| **Application rules:** | | |
| Min days per application | | |
| Max days per application | | |
| Advance notice required: X days | | |
| Can apply for past dates: Yes/No | | |
| Gap required between applications: X days | | |
| Half day allowed: Yes/No | | |
| **Document rules:** | | |
| Document required: Always/After X days/Never | | |
| **Eligibility:** | | |
| Gender specific: All/Male/Female | | |
| Applicable after X months of joining | | |
| Save → POST /api/v1/settings/leave-types | | WRITE: leave_types |
| | If new type: create balance records for all employees | WRITE: leave_balances (bulk) |

---
---

## 6. LEAVE ACCRUAL (AUTO-RUN)
**Trigger:** Scheduled job — runs monthly/quarterly/yearly

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| No UI — background job | | |
| | BullMQ scheduler triggers on 1st of month | |
| | Fetch all active leave types with accrual_type = monthly | READ: leave_types |
| | For each leave type: | |
| | → Fetch all active employees eligible | READ: employees WHERE status = active |
| | → Check eligibility (joining date, probation) | READ: employees.date_of_joining |
| | → Calculate accrual for this period | |
| | → Add to balance | WRITE: leave_balances.accrued += amount |
| | → Cap at max_balance | WRITE: if accrued > max → cap |
| | Run year-end lapses (Dec 31 / March 31 per company) | |
| | → Calculate carry forward | WRITE: leave_balances (new year opening) |
| | → Lapse remaining if configured | |
| | Log accrual run | WRITE: accrual_logs |
| HR can view accrual log | GET /api/v1/leave/accrual-log | READ: accrual_logs |

---
---

## 7. TEAM LEAVE CALENDAR
**URL:** `/leave/calendar`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Month/Year selector | | |
| Department filter | | |
| GET /api/v1/leave/calendar?month=&year=&dept= | | |
| | Fetch approved leaves for the month | READ: leave_applications WHERE status = approved |
| | Fetch holidays for the month | READ: holidays |
| | Return calendar data | |
| Calendar grid view | | |
| Each date shows: employee names on leave | | |
| Holidays shown in different color | | |
| Hover on date: full list of who's on leave | | |
| Color per leave type | | |

---

## DB TABLES USED IN LEAVE FLOWS

```
leave_types          → leave type definitions & rules
leave_balances       → balance per employee per type per year
leave_applications   → all leave requests
attendance           → updated when leave approved
accrual_logs         → record of auto accrual runs
audit_logs           → all approvals/rejections logged
holidays             → for working day calculation
```

---

## 🔗 Related Documents
- Attendance flows → [13_ATTENDANCE_FLOWS.md](./13_ATTENDANCE_FLOWS.md)
- Payroll flows (LOP calculation) → [15_PAYROLL_FLOWS.md](./15_PAYROLL_FLOWS.md)
- Employee flows → [12_EMPLOYEE_FLOWS.md](./12_EMPLOYEE_FLOWS.md)

---
---

## 7. LEAVE ENCASHMENT
**URL:** `/leave/encashment`

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Encashment available only for encashable leave types | | |
| **Encashment triggers:** | | |
| During Full & Final settlement (auto) | | |
| During year-end (if configured) | | |
| Manual request by employee (if allowed) | | |
| **Encashment calculation:** | | |
| Days to encash input (max = available balance) | | |
| Per day value = (Basic + DA) / 26 | | |
| Total encashment amount shown | | |
| POST /api/v1/leave/encashment/request | | |
| | Calculate per-day value | READ: employee_salaries.basic, da |
| | Validate days <= available balance | READ: leave_balances |
| | Create encashment record | WRITE: leave_encashments { days, amount_paise, status: pending } |
| HR approves | PUT /api/v1/leave/encashment/:id/approve | WRITE: leave_encashments.status = approved |
| | Deduct from leave balance | WRITE: leave_balances.used += days |
| | Flag for payroll processing | WRITE: leave_encashments.add_to_payroll = true |
| Added to next payslip as encashment earning | | READ: leave_encashments during payroll run |

---
---

## 9. LEAVE REPORTS
**URL:** `/leave/reports`

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| **Report types:** | | |
| Leave Balance Report (all employees) | | |
| Leave Utilization Report | | |
| Leave Trend (monthly applications) | | |
| Pending Approvals Report | | |
| LOP Report (for payroll) | | |
| Encashment Report | | |
| **Filters:** | | |
| Year / Month / Department / Leave Type | | |
| **Generate → PDF/Excel/CSV** | POST /api/v1/leave/reports | READ: leave_balances, leave_applications |
| Download | | |
