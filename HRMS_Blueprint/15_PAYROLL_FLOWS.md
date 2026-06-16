# 15 — PAYROLL FLOWS
> Part of HRMS Blueprint | [← Back to Index](./00_INDEX.md)
> Format: FE = Frontend | BE = Backend | DB = Database
> Last Updated: June 2026

---

## PAGES IN THIS DOCUMENT
```
1. Payroll Dashboard
2. Salary Structure Setup
3. Assign Salary to Employee
4. Run Monthly Payroll
5. Payslip View & Download
6. Payslip Distribution
7. Bank Transfer File Generation
8. Bonus & Incentive Processing
9. Full & Final Settlement
10. Payroll Reports
```

---
---

## 1. PAYROLL DASHBOARD
**URL:** `/payroll`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Month/Year selector (default: current month) | | |
| GET /api/v1/payroll/dashboard?month=&year= | | |
| | Check if payroll run exists for this month | READ: payroll_runs WHERE month = ? AND year = ? |
| | Return: status, totals, employee count | |
| **Status Banner:** | | |
| Not Run → "Run Payroll" button shown | | |
| Draft → "Continue Processing" button | | |
| Processed → "Review & Lock" button | | |
| Locked → "View Payroll" + "Generate Bank File" | | |
| **Summary Cards:** | | |
| Total Employees / Total Gross / Total Deductions / Total Net | | |
| **Quick Stats:** | | |
| Average salary / Highest / Lowest | | |
| Department-wise cost breakdown chart | | |
| **Recent Payroll History:** | | |
| Last 6 months with total cost | | |
| Click any month → view that payroll | | |

---
---

## 2. SALARY STRUCTURE SETUP
**URL:** `/settings/salary-structures`

---

### Step 2.1 — Create Salary Structure

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| List existing structures | GET /api/v1/settings/salary-structures | READ: salary_structures |
| "Add Structure" button | | |
| **Structure form:** | | |
| Structure name (e.g. "Standard", "Senior", "Management") | | |
| **Earnings components:** | | |
| Component name | | |
| Calculation type: Fixed / % of Basic / % of CTC / Formula | | |
| Value (amount or percentage) | | |
| Taxable: Yes/No | | |
| Add component row button (unlimited rows) | | |
| **Deduction components:** | | |
| PF Employee: 12% of Basic (formula) | | |
| ESI Employee: 0.75% of Gross (formula) | | |
| PT: State slab (auto) | | |
| TDS: As per declaration (auto) | | |
| Custom deductions (configurable) | | |
| **Live preview calculator:** | | |
| Enter sample CTC → see full breakup | | |
| Shows: all earnings, all deductions, net | | |
| Save → POST /api/v1/settings/salary-structures | | WRITE: salary_structures { components JSON } |

---
---

## 3. ASSIGN SALARY TO EMPLOYEE

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| From employee profile → Salary tab → Edit | | |
| **Salary form:** | | |
| Select salary structure (dropdown) | Load structures | READ: salary_structures |
| Enter CTC (annual) | | |
| System auto-calculates all components in real-time | | |
| Show full breakup table: | | |
| Earnings: Basic, HRA, DA, TA, Special, Others | | |
| Deductions: PF, ESI, PT, TDS (estimated) | | |
| Gross per month / Net per month | | |
| **Effective from date:** | | |
| Date picker (cannot be past if first time) | | |
| If revision: effective from any date | | |
| Save → PUT /api/v1/employees/:id/salary | | |
| | If first salary: create record | WRITE: employee_salaries { effective_from, effective_to: null } |
| | If revision: | |
| | → Close old record | WRITE: employee_salaries.effective_to = effective_from - 1 day |
| | → Create new record | WRITE: employee_salaries { effective_from, effective_to: null } |
| | → Calculate arrears if backdated revision | |
| | Write audit log | WRITE: audit_logs |

---
---

## 4. RUN MONTHLY PAYROLL
**URL:** `/payroll/run`

---

### Step 4.1 — Pre-Payroll Checklist

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Select month + year to process | | |
| GET /api/v1/payroll/pre-check?month=&year= | | |
| | Check attendance marked for all employees | READ: attendance (count vs employee count) |
| | Check all leaves finalized | READ: leave_applications (pending count) |
| | Check salary assigned to all employees | READ: employee_salaries |
| | Check LOP approved | READ: lop_records |
| | Return: { warnings[], blockers[] } | |
| **Checklist shown:** | | |
| ✅ Attendance marked: 45/45 employees | | |
| ⚠️ 3 pending leave applications | | |
| ✅ All employees have salary assigned | | |
| ❌ 2 employees missing bank details (blocker) | | |
| Warnings: can proceed with caution | | |
| Blockers: must fix before proceeding | | |
| Fix issues links shown | | |
| Proceed to Run Payroll button | | |

---

### Step 4.2 — Payroll Calculation

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Click "Run Payroll" | | |
| Confirm: "Process payroll for [Month Year]?" | | |
| POST /api/v1/payroll/run | | |
| Send: { month, year } | | |
| Show progress bar | | |
| | Create payroll_run record | WRITE: payroll_runs { status: processing } |
| | Fetch all active employees | READ: employees WHERE status IN (active, notice) |
| | **For each employee:** | |
| | 1. Get salary structure | READ: employee_salaries WHERE effective_from <= last_day AND (effective_to IS NULL OR effective_to >= first_day) |
| | 2. Get working days in month | READ: holidays, shifts |
| | 3. Get present days from attendance | READ: attendance WHERE month = ? |
| | 4. Get approved LOP days | READ: leave_applications (LOP type) |
| | 5. Calculate paid days = working_days - lop_days | |
| | 6. Calculate gross = (CTC/12) × (paid_days / working_days) | |
| | 7. Calculate PF employee = 12% of basic (max basic 15000) | |
| | 8. Calculate PF employer = 13% of basic | |
| | 9. Calculate ESI employee = 0.75% if gross < 21000 | |
| | 10. Calculate ESI employer = 3.25% if gross < 21000 | |
| | 11. Calculate PT = state slab lookup | READ: pt_slabs WHERE state = ? |
| | 12. Calculate TDS = as per declaration | READ: tds_declarations |
| | 13. Calculate LWF = state rules | READ: lwf_rules |
| | 14. Calculate net = gross - all deductions | |
| | 15. Create payslip record | WRITE: payslips |
| | Update payroll_run totals | WRITE: payroll_runs { total_gross, total_deductions, total_net } |
| | Update payroll_run status | WRITE: payroll_runs.status = processed |
| | Return: { processed: 45, errors: [] } | |
| Show completion: "Payroll processed for 45 employees" | | |
| Redirect to payroll review page | | |

---

### Step 4.3 — Payroll Review

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| GET /api/v1/payroll/:runId/payslips | | READ: payslips WHERE payroll_run_id = ? |
| Show all employee payslips in table | | |
| **Columns:** Name / Gross / PF / ESI / PT / TDS / Net | | |
| Search/filter employees | | |
| Click any row → preview payslip | | |
| **Edit individual payslip** (before lock): | | |
| Add bonus/incentive | | |
| Add/edit deduction | | |
| Add arrears | | |
| Save edit → recalculate totals | PUT /api/v1/payroll/payslips/:id | WRITE: payslips (updated) |
| Updated totals shown at bottom | | |
| **Lock Payroll button:** | | |
| Confirm: "Lock payroll? No edits after this" | | |
| PUT /api/v1/payroll/:runId/lock | | WRITE: payroll_runs.status = locked, locked_at = NOW() |
| | Generate all payslip PDFs (queued job) | |
| | Write audit log | WRITE: audit_logs |

---
---

## 5. PAYSLIP VIEW & DOWNLOAD
**URL:** `/payroll/payslips/:id`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| GET /api/v1/payroll/payslips/:id | | |
| | Check permission: own payslip OR HR role | |
| | Fetch payslip data | READ: payslips JOIN employees JOIN companies |
| | Return payslip data | |
| **Payslip display:** | | |
| Company logo + name + address | | |
| Employee: Name, Code, Dept, Designation | | |
| Month / Year | | |
| Working days / Present days / LOP days | | |
| **Earnings table:** Basic / HRA / DA / TA / Others | | |
| **Deductions table:** PF / ESI / PT / TDS / Others | | |
| **Net Salary (large, bold)** | | |
| Net in words below | | |
| Download PDF button | | |
| | Generate PDF if not exists | |
| | PDF password = employee DOB (DDMMYYYY) | |
| | Store in MinIO | WRITE: payslips.pdf_url |
| | Return signed URL (1 hour expiry) | |
| Browser downloads password-protected PDF | | |

---
---

## 6. PAYSLIP DISTRIBUTION
**URL:** `/payroll/:runId/distribute`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| After payroll locked: "Publish Payslips" button | | |
| Select distribution method: | | |
| ☑ Email to all employees | | |
| ☑ WhatsApp to all employees | | |
| ☑ Make visible in employee portal | | |
| Send Now button | | |
| POST /api/v1/payroll/:runId/publish | | |
| | Mark all payslips as published | WRITE: payslips.is_published = true |
| | Queue email jobs (BullMQ) | |
| | For each employee: | |
| | → Generate PDF (if not already) | |
| | → Send email with PDF attachment | |
| | → Send WhatsApp notification | |
| | → Log delivery status | WRITE: notification_logs |
| | Return: { queued: 45 } | |
| Progress shown: Sent X of Y | | |
| Failed deliveries list shown | | |
| Retry failed button | | |

---
---

## 7. BANK TRANSFER FILE GENERATION
**URL:** `/payroll/:runId/bank-file`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| GET /api/v1/payroll/:runId/bank-file | | |
| | Fetch all locked payslips with bank details | READ: payslips JOIN employee_bank_accounts |
| | Validate all employees have bank details | |
| | Show missing bank details warning | |
| **File format selection:** | | |
| NEFT format (standard) | | |
| Bank specific format (HDFC/SBI/ICICI template) | | |
| Generate File button | | |
| POST /api/v1/payroll/:runId/generate-bank-file | | |
| | Generate bank transfer file | |
| | Format: Account No, IFSC, Name, Amount, Reference | |
| | Save file to MinIO | WRITE: payroll_bank_files |
| | Return signed URL | |
| Download file | | |
| Upload to bank portal (manual by HR) | | |

---
---

## 8. FULL & FINAL SETTLEMENT
**URL:** `/employees/:id/full-final`
**Trigger:** Employee exit/resignation

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| HR opens FnF from employee exit flow | | |
| GET /api/v1/employees/:id/fnf-calculate | | |
| | Fetch last working date | READ: employees.date_of_leaving |
| | Calculate days worked in last month | READ: attendance |
| | Calculate proportionate salary | |
| | Calculate leave encashment (earned leave balance) | READ: leave_balances |
| | Calculate pending reimbursements | READ: expense_claims |
| | Calculate gratuity (if applicable: >5 years) | READ: employees.date_of_joining |
| | Calculate any loan/advance recovery | READ: employee_loans |
| | Final: total payable to employee | |
| **FnF Summary shown:** | | |
| Salary for days worked | | |
| Leave encashment | | |
| Gratuity | | |
| Reimbursements | | |
| Less: Notice period recovery (if applicable) | | |
| Less: Loan recovery | | |
| **Net FnF Amount** | | |
| Process FnF button | | |
| POST /api/v1/employees/:id/process-fnf | | WRITE: fnf_settlements, payslips (type: fnf) |
| Generate FnF payslip + experience letter | | |

---

## DB TABLES USED IN PAYROLL FLOWS

```
payroll_runs           → monthly payroll run records
payslips               → individual payslips
salary_structures      → salary component templates
employee_salaries      → employee salary assignments
employee_bank_accounts → bank details for transfer
attendance             → present days calculation
leave_applications     → LOP calculation
pt_slabs               → state-wise PT rules
tds_declarations       → employee investment declarations
lwf_rules              → state-wise LWF rules
payroll_bank_files     → generated bank files
fnf_settlements        → full and final records
notification_logs      → payslip delivery tracking
```

---

## 🔗 Related Documents
- Attendance flows → [13_ATTENDANCE_FLOWS.md](./13_ATTENDANCE_FLOWS.md)
- Leave flows → [14_LEAVE_FLOWS.md](./14_LEAVE_FLOWS.md)
- Compliance flows → [16_COMPLIANCE_FLOWS.md](./16_COMPLIANCE_FLOWS.md)

---
---

## 8. BONUS & INCENTIVE PROCESSING
**URL:** `/payroll/bonus`

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| **Add bonus to payroll run (before lock):** | | |
| Select payroll run (current month) | | |
| **Bonus types:** | | |
| Festival Bonus (Diwali/Eid etc.) | | |
| Performance Bonus | | |
| Joining Bonus | | |
| Referral Bonus | | |
| Custom | | |
| **Individual bonus:** | | |
| Search employee | | |
| Bonus type + amount (paise) | | |
| Taxable: Yes/No | | |
| POST /api/v1/payroll/bonus/individual | | WRITE: payroll_bonuses { employee_id, type, amount, taxable } |
| | Add to employee payslip | WRITE: payslips.other_earnings (append) |
| | Recalculate net salary | WRITE: payslips.net_salary |
| **Bulk bonus (all employees):** | | |
| Bonus type + fixed amount OR % of basic | | |
| POST /api/v1/payroll/bonus/bulk | | |
| | Apply to all active employees in run | WRITE: payroll_bonuses (batch) |
| | Update all payslips | WRITE: payslips (batch update) |
| Bonus list shown in payroll review | | READ: payroll_bonuses WHERE payroll_run_id = ? |

---
---

## 10. PAYROLL REPORTS
**URL:** `/payroll/reports`

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| **Report types:** | | |
| Payroll Register (full detail) | | |
| Salary Summary (gross/deductions/net per employee) | | |
| Bank Transfer Report | | |
| PF/ESI/PT/TDS Deduction Report | | |
| CTC vs Gross vs Net Comparison | | |
| Department-wise Cost Report | | |
| YTD (Year to Date) Salary Report | | |
| Increment History Report | | |
| **Filters:** | | |
| Month/Year or financial year range | | |
| Department / Branch / Employee | | |
| **Generate → PDF/Excel/CSV** | POST /api/v1/payroll/reports | READ: payslips JOIN employees JOIN payroll_runs |
| | Aggregate per report type | |
| | Format with company branding | |
| Download | | |
