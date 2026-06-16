# 13 — ATTENDANCE FLOWS
> Part of HRMS Blueprint | [← Back to Index](./00_INDEX.md)
> Format: FE = Frontend | BE = Backend | DB = Database
> Last Updated: June 2026

---

## PAGES IN THIS DOCUMENT
```
1. Attendance Dashboard
2. Mark Attendance (Manual by HR)
3. Employee Self Check-In/Out (Web)
4. Attendance Regularization
5. Shift Management
6. Holiday Calendar Management
7. Overtime Management
8. Comp Off Management
9. Attendance Reports
```

---
---

## 1. ATTENDANCE DASHBOARD
**URL:** `/attendance`

---

### Step 1.1 — Page Load

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Show skeleton loader | | |
| GET /api/v1/attendance/dashboard | | |
| | Verify JWT + permissions | |
| | Get today's date (server UTC, convert to IST) | |
| | Count: total active employees | READ: employees WHERE status = active |
| | Count: present today | READ: attendance WHERE date = today AND status = present |
| | Count: absent today | READ: attendance WHERE date = today AND status = absent |
| | Count: on leave today | READ: attendance WHERE date = today AND status = on_leave |
| | Count: not yet marked | Total - marked |
| | Fetch today's attendance list | READ: attendance JOIN employees |
| | Return dashboard summary | |
| **Summary Cards:** | | |
| Total Employees / Present / Absent / On Leave / Not Marked | | |
| Color coded: Green/Red/Yellow/Blue | | |
| **Today's Attendance Table:** | | |
| Employee, Check-in time, Check-out time, Hours, Status | | |
| Late arrivals highlighted in amber | | |
| Not marked employees shown at bottom in red | | |
| **Month Calendar View:** | | |
| Each day shows: present count / total | | |
| Click any day → shows that day's attendance | | |

---

### Step 1.2 — Date Navigation

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Previous/Next day arrows | | |
| Date picker to jump to any date | | |
| On date change: GET /api/v1/attendance?date=YYYY-MM-DD | | READ: attendance WHERE date = ? |
| Today button to return to current date | | |

---
---

## 2. MARK ATTENDANCE (MANUAL BY HR)
**URL:** `/attendance/mark`

---

### Step 2.1 — Bulk Mark Page

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Date selector (default: today) | | |
| GET /api/v1/attendance/unmarked?date=xxx | | |
| | Fetch employees who have no attendance for date | READ: employees LEFT JOIN attendance |
| | Return unmarked employees list | |
| Show employee list with mark options | | |
| **Per employee row:** | | |
| Name, Dept, Check-in time input, Check-out time input | | |
| Status dropdown: Present/Absent/Half Day/Holiday/Week Off | | |
| Checkbox for bulk selection | | |
| **Bulk Actions:** | | |
| Select all → Mark Present button | | |
| Select all → Mark Absent button | | |
| Individual time entry per employee | | |
| Save All button | | |

---

### Step 2.2 — Save Attendance

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Click Save All | | |
| Confirm dialog: "Mark attendance for X employees?" | | |
| POST /api/v1/attendance/bulk-mark | | |
| Send: { date, records: [{ employeeId, checkIn, checkOut, status }] } | | |
| | Validate date not future date | |
| | Validate date not already locked (payroll processed) | READ: payroll_runs WHERE month/year = ? AND status = locked |
| | For each record: | |
| | → Calculate working_hours = checkOut - checkIn | |
| | → Calculate overtime_hours (if beyond shift hours) | READ: employee_shifts |
| | → Flag late_arrival if checkIn > shift_start + grace_period | |
| | → Flag early_departure if checkOut < shift_end | |
| | → Upsert attendance record | WRITE: attendance (INSERT or UPDATE) |
| | Write audit log | WRITE: audit_logs |
| | Return: { saved: X, errors: [] } | |
| Show success toast | | |
| Refresh attendance list | | |

---
---

## 3. EMPLOYEE SELF CHECK-IN/OUT (WEB)
**URL:** `/attendance/checkin` (Employee Self Service)

---

### Step 3.1 — Check-In

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Show current time (live clock) | | |
| Show today's status: Not Checked In | GET /api/v1/attendance/today | READ: attendance WHERE employee_id = ? AND date = today |
| Large "Check In" button | | |
| Get browser geolocation (if GPS enabled in settings) | | |
| POST /api/v1/attendance/checkin | | |
| Send: { timestamp, latitude, longitude, ipAddress } | | |
| | Verify employee is active | READ: employees.status |
| | Check IP restriction (if configured) | READ: company_settings.ip_whitelist |
| | Verify not already checked in | READ: attendance WHERE date = today AND check_in IS NOT NULL |
| | Get server timestamp (IST) | |
| | Get employee's shift for today | READ: employee_shifts |
| | Calculate if late arrival | |
| | Insert attendance record | WRITE: attendance { check_in, status: present, late_arrival } |
| | Return: { checkInTime, isLate, message } | |
| Show: "Checked in at HH:MM" | | |
| Show late message if applicable: "Late by X minutes" | | |
| Check-In button replaced by Check-Out button | | |

---

### Step 3.2 — Check-Out

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Show checked-in time | | |
| Show hours worked so far (live counter) | | |
| "Check Out" button | | |
| POST /api/v1/attendance/checkout | | |
| Send: { timestamp, latitude, longitude } | | |
| | Verify checked in today | READ: attendance WHERE date = today AND check_in IS NOT NULL |
| | Get server timestamp | |
| | Calculate working_hours | |
| | Calculate overtime_hours if applicable | READ: employee_shifts for shift_end time |
| | Update attendance record | WRITE: attendance { check_out, working_hours, overtime_hours, early_departure } |
| | Return: { checkOutTime, workingHours, overtime } | |
| Show summary: "Total hours: X hrs Y min" | | |
| Show overtime if any: "OT: X hrs" | | |

---
---

## 4. ATTENDANCE REGULARIZATION
**URL:** `/attendance/regularize`

---

### Step 4.1 — Employee Submits Regularization

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Employee sees their attendance calendar | | |
| Dates with issues highlighted (missing punch, absent) | | |
| Click on date → Regularize option | | |
| **Regularization form:** | | |
| Date (pre-filled, non-editable) | | |
| Actual check-in time input | | |
| Actual check-out time input | | |
| Reason (mandatory text, min 10 chars) | | |
| Supporting document upload (optional) | | |
| Submit → POST /api/v1/attendance/regularize | | |
| | Check if date is within allowed window (e.g. last 30 days) | |
| | Check payroll not locked for that month | READ: payroll_runs |
| | Check no pending regularization for same date | READ: regularization_requests |
| | Create regularization request | WRITE: regularization_requests { status: pending } |
| | Notify manager | Send notification |
| | Return success | |
| Show: "Request submitted, pending approval" | | |

---

### Step 4.2 — Manager Approves/Rejects

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Manager sees pending requests list | GET /api/v1/attendance/regularize/pending | READ: regularization_requests WHERE approver = ? |
| Shows: Employee name, date, requested times, reason | | |
| Approve / Reject buttons per request | | |
| **On Approve:** | | |
| POST /api/v1/attendance/regularize/:id/approve | | |
| | Update attendance record with requested times | WRITE: attendance { check_in, check_out, regularized: true } |
| | Recalculate working hours | WRITE: attendance.working_hours |
| | Update request status | WRITE: regularization_requests.status = approved |
| | Notify employee | |
| | Write audit log | WRITE: audit_logs |
| **On Reject:** | | |
| Show rejection reason input | | |
| POST /api/v1/attendance/regularize/:id/reject | | |
| | Update request status | WRITE: regularization_requests.status = rejected |
| | Save rejection reason | WRITE: regularization_requests.rejection_reason |
| | Notify employee | |

---
---

## 5. SHIFT MANAGEMENT
**URL:** `/settings/shifts`

---

### Step 5.1 — Create Shift

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| List existing shifts | GET /api/v1/settings/shifts | READ: shifts |
| "Add Shift" button | | |
| **Shift form:** | | |
| Shift name (Morning / Evening / Night / custom) | | |
| Start time (time picker) | | |
| End time (time picker) | | |
| Late arrival grace: X minutes (default 15) | | |
| Early departure grace: X minutes | | |
| Total hours auto-calculated | | |
| Week offs: checkboxes (Sun/Mon/Tue/Wed/Thu/Fri/Sat) | | |
| Applicable from date | | |
| Save → POST /api/v1/settings/shifts | | WRITE: shifts |
| | Assign shift to employees (select or all) | WRITE: employee_shifts |

---
---

## 6. HOLIDAY CALENDAR
**URL:** `/settings/holidays`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Year selector dropdown | | |
| GET /api/v1/settings/holidays?year=2025 | | READ: holidays WHERE year = ? |
| Show calendar with holidays marked | | |
| **Add Holiday button:** | | |
| Date picker | | |
| Holiday name | | |
| Type: National / State / Optional / Company | | |
| Applicable branches (all or select) | | |
| Recurring yearly toggle | | |
| Save → POST /api/v1/settings/holidays | | WRITE: holidays |
| **Bulk import:** | | |
| Download template → fill → upload | | |
| POST /api/v1/settings/holidays/bulk | | WRITE: holidays (batch) |
| **National holidays auto-import:** | | |
| "Load National Holidays for [Year]" button | | |
| | Fetch standard Indian national holidays | |
| | Return list for review | |
| HR reviews → confirms → saves | | WRITE: holidays |

---
---

## 7. OVERTIME MANAGEMENT
**URL:** `/attendance/overtime`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| List employees with pending OT approval | GET /api/v1/attendance/overtime/pending | READ: attendance WHERE overtime_hours > 0 AND ot_status = pending |
| Show: Employee, Date, OT Hours, Shift End, Actual Out | | |
| **Approve OT:** | | |
| Select conversion: Pay / Comp Off | | |
| PUT /api/v1/attendance/overtime/:id/approve | | |
| | If Comp Off: create comp off balance | WRITE: leave_balances (comp off type) |
| | If Pay: flag for payroll processing | WRITE: attendance.ot_approved, ot_type = pay |
| | Write audit log | WRITE: audit_logs |

---

## DB TABLES USED IN ATTENDANCE FLOWS

```
attendance              → daily attendance records
shifts                  → shift definitions
employee_shifts         → employee-to-shift mapping
holidays                → holiday calendar
regularization_requests → regularization pending/approved
audit_logs              → all changes
leave_balances          → for comp off credits
```

---

## 🔗 Related Documents
- Leave flows → [14_LEAVE_FLOWS.md](./14_LEAVE_FLOWS.md)
- Payroll flows (uses attendance data) → [15_PAYROLL_FLOWS.md](./15_PAYROLL_FLOWS.md)
- Employee flows → [12_EMPLOYEE_FLOWS.md](./12_EMPLOYEE_FLOWS.md)

---
---

## 8. COMP OFF MANAGEMENT
**URL:** `/attendance/compoff`

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| **Employee applies comp off:** | | |
| Select worked date (holiday/week off) | | |
| Hours worked that day | | |
| Comp off days earned (auto: 1 day per day worked) | | |
| POST /api/v1/attendance/compoff/apply | | |
| | Verify employee actually worked that day | READ: attendance WHERE date = ? AND status = present |
| | Create comp off credit | WRITE: leave_balances (comp off type += days) |
| | Write record | WRITE: compoff_records { worked_date, earned_days, status: approved } |
| **Manager grants comp off manually:** | | |
| Select employee | | |
| Date + reason | | |
| Days to credit | | |
| POST /api/v1/attendance/compoff/grant | | WRITE: compoff_records + leave_balances |
| **Comp off expiry:** | | |
| Comp off expires after X days (configurable, default 90 days) | | |
| BullMQ job checks daily | | READ: compoff_records WHERE expiry_date = today |
| Auto-lapse expired comp off | | WRITE: leave_balances.comp_off -= lapsed |
| Notify employee before expiry (7 days) | | |

---
---

## 9. ATTENDANCE REPORTS
**URL:** `/attendance/reports`

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| **Report types:** | | |
| Monthly Attendance Summary | | |
| Daily Attendance Register | | |
| Late Arrivals Report | | |
| Early Departure Report | | |
| Absent Report | | |
| Overtime Report | | |
| Muster Roll (statutory) | | |
| **Filters:** | | |
| Month/Year or custom date range | | |
| Department / Branch / Employee | | |
| **Generate → export PDF/Excel/CSV** | POST /api/v1/attendance/reports | READ: attendance JOIN employees |
| | Aggregate data per report type | |
| | Format and export | |
| Download file | | |
