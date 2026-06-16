# 17 — REPORTS & EXPORT FLOWS
> Part of HRMS Blueprint | [← Back to Index](./00_INDEX.md)
> Format: FE = Frontend | BE = Backend | DB = Database
> Last Updated: June 2026

---

## PAGES IN THIS DOCUMENT
```
1. Reports Center Dashboard
2. Standard Report Generation
3. Custom Report Builder
4. Export Flow (PDF / Excel / CSV)
5. Scheduled Reports (Auto Email)
6. Dashboard Analytics
```

---
---

## 1. REPORTS CENTER
**URL:** `/reports`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| GET /api/v1/reports/categories | | READ: report_definitions |
| **Report categories displayed:** | | |
| 👥 Employee Reports | | |
| ⏰ Attendance Reports | | |
| 🌴 Leave Reports | | |
| 💰 Payroll Reports | | |
| 📋 Statutory Reports | | |
| 📊 Analytics Reports | | |
| 🔧 Custom Reports | | |
| Recent reports history | GET /api/v1/reports/history | READ: report_history WHERE user_id = ? |
| Scheduled reports list | GET /api/v1/reports/scheduled | READ: scheduled_reports |
| **Favorite reports** (pin frequently used) | | |

---
---

## 2. STANDARD REPORT GENERATION

---

### Step 2.1 — Employee Master Report

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Select report → Employee Master | | |
| **Filter panel:** | | |
| Department (multi-select) | | |
| Branch (multi-select) | | |
| Designation (multi-select) | | |
| Status: Active/All/Terminated | | |
| Employment Type | | |
| Date Range: Joining date between | | |
| **Column selector:** | | |
| Check/uncheck columns to include | | |
| Default columns pre-selected | | |
| Drag to reorder columns | | |
| **Preview button:** | | |
| POST /api/v1/reports/preview | | |
| | Apply all filters | READ: employees JOIN dept, designation, branch |
| | Return first 10 rows | |
| Show preview table | | |
| Record count shown: "X employees match filters" | | |
| **Export format selector:** | | |
| PDF / Excel / CSV buttons | | |

---

### Step 2.2 — Attendance Report

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| **Filters:** | | |
| Month/Year OR custom date range | | |
| Department, Employee (single or all) | | |
| **Report types:** | | |
| Monthly Summary (one row per employee) | | |
| Daily Detail (one row per employee per day) | | |
| Absentee Report (only absent employees) | | |
| Late Arrivals Report | | |
| Overtime Report | | |
| Generate → POST /api/v1/reports/attendance | | READ: attendance JOIN employees |
| | Aggregate: present days, absent, half-day, OT hours | |
| | Return report data | |

---

### Step 2.3 — Payroll Register

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| **Filters:** | | |
| Month / Year selector | | |
| Department filter | | |
| **Report types:** | | |
| Full payroll register | | |
| Earnings only | | |
| Deductions only | | |
| Bank transfer list | | |
| Statutory deductions (PF+ESI+PT) | | |
| Generate → POST /api/v1/reports/payroll | | READ: payslips JOIN employees WHERE payroll_run_id = ? |
| | Compile all components | |
| | Calculate totals per column | |
| | Return full register | |

---

### Step 2.4 — Statutory Reports

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| **Available statutory reports:** | | |
| PF Register | | READ: payslips (PF columns) |
| ESI Register | | READ: payslips (ESI columns) |
| PT Register | | READ: payslips (PT columns) |
| Form 16 Summary | | READ: tds_declarations + payslips |
| LWF Register | | READ: payslips (LWF columns) |
| Muster Roll | | READ: attendance |
| Salary Register (Form D) | | READ: payslips |
| Select report + month/year → Generate | | |

---
---

## 3. CUSTOM REPORT BUILDER
**URL:** `/reports/custom`

---

### Step 3.1 — Build Report

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| **Step 1: Select Data Source** | | |
| Employees / Attendance / Leave / Payroll / Compliance | | |
| Can join multiple sources | | |
| **Step 2: Select Columns** | | |
| Drag & drop available fields to report | | |
| Rename column headers | | |
| **Step 3: Add Filters** | | |
| Field selector → Operator → Value | | |
| e.g. Department = Sales AND Status = Active | | |
| Add multiple filter rows (AND/OR logic) | | |
| **Step 4: Sort & Group** | | |
| Sort by: field + ASC/DESC | | |
| Group by: field (e.g. group by department) | | |
| Show subtotals for grouped reports | | |
| **Step 5: Preview** | | |
| POST /api/v1/reports/custom/preview | | |
| | Build dynamic query from config | READ: dynamic based on config |
| | Return first 20 rows | |
| Show preview | | |
| **Save Report:** | | |
| Save with name | POST /api/v1/reports/custom/save | WRITE: custom_reports |
| Add to favorites | | |
| Set as scheduled | | |

---
---

## 4. EXPORT FLOW

---

### Step 4.1 — Export to Excel

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Click Export Excel button | | |
| POST /api/v1/reports/:type/export?format=excel | | |
| Show "Generating..." loader | | |
| | Fetch full data (no pagination limit) | READ: relevant tables |
| | Create Excel workbook via SheetJS | |
| | Apply company branding: | |
| | → Logo in header | |
| | → Company name + report name | |
| | → Report period | |
| | → Generated by + date | |
| | Format cells: | |
| | → Header row: bold + background color | |
| | → Number columns: right aligned | |
| | → Date columns: formatted DD-MM-YYYY | |
| | → Totals row at bottom: bold | |
| | → Column widths: auto-fit | |
| | Save .xlsx to MinIO temporarily | WRITE: temp_exports |
| | Return signed URL (30 min expiry) | |
| Browser auto-downloads file | | |
| File named: ReportType_Month_Year.xlsx | | |

---

### Step 4.2 — Export to PDF

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Click Export PDF button | | |
| POST /api/v1/reports/:type/export?format=pdf | | |
| | Fetch full data | READ: relevant tables |
| | Generate PDF via pdfkit: | |
| | → A4 landscape (for wide reports) | |
| | → Company header with logo | |
| | → Report title + filters applied | |
| | → Data table with borders | |
| | → Page numbers: Page X of Y | |
| | → Footer: Generated on [date] by [user] | |
| | → Totals row on last page | |
| | Save to MinIO | WRITE: temp_exports |
| | Return signed URL | |
| Browser downloads PDF | | |

---

### Step 4.3 — Export to CSV

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Click Export CSV button | | |
| GET /api/v1/reports/:type/export?format=csv | | READ: relevant tables |
| | Simple comma-separated with headers | |
| | No formatting, plain data | |
| | Stream directly to response | |
| Browser downloads .csv file | | |

---
---

## 5. SCHEDULED REPORTS (AUTO EMAIL)
**URL:** `/reports/scheduled`

---

### Step 5.1 — Create Schedule

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| "Schedule Report" button on any report | | |
| **Schedule form:** | | |
| Report name (auto-filled) | | |
| Frequency: Daily / Weekly / Monthly | | |
| If weekly: which day | | |
| If monthly: which date (1-28) | | |
| Time: HH:MM (default 8:00 AM) | | |
| Format: PDF / Excel / CSV | | |
| Recipients: email addresses (multi input) | | |
| Subject line template | | |
| Save → POST /api/v1/reports/schedule | | WRITE: scheduled_reports |
| | Create BullMQ recurring job | |

---

### Step 5.2 — Scheduled Report Execution (Auto)

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| No UI — background job | | |
| | BullMQ triggers at scheduled time | READ: scheduled_reports |
| | Generate report data | READ: relevant tables |
| | Export to configured format | |
| | Send email with attachment | |
| | Log execution | WRITE: scheduled_report_logs |
| | If failed: send failure alert to HR | |

---
---

## 6. DASHBOARD ANALYTICS
**URL:** `/dashboard`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| GET /api/v1/analytics/dashboard | | |
| | Run multiple aggregate queries | |
| **Headcount Widget:** | | |
| | SELECT COUNT(*) FROM employees WHERE status = active | READ: employees |
| Total / Male / Female / Other (pie chart) | | |
| **Attendance Today:** | | |
| | Count present vs total today | READ: attendance WHERE date = today |
| Present % gauge chart | | |
| **Attrition Rate (12 months):** | | |
| | Count terminated per month / avg headcount | READ: employees.date_of_leaving |
| Line chart trend | | |
| **Payroll Cost Trend:** | | |
| | Sum net salary per month last 12 months | READ: payroll_runs |
| Bar chart | | |
| **Leave Trend:** | | |
| | Count approved leaves per month | READ: leave_applications |
| **Department Strength:** | | |
| | Count by department | READ: employees GROUP BY department |
| Horizontal bar chart | | |
| **Upcoming Birthdays:** | | |
| | Employees with birthday in next 7 days | READ: employees WHERE EXTRACT(month/day) |
| **Work Anniversaries:** | | |
| | Employees completing years this week | READ: employees.date_of_joining |
| **All charts use Recharts library** | | |
| Date range selector for all charts | | |
| Export dashboard as PDF button | | |

---

## DB TABLES USED IN REPORTS FLOWS

```
employees           → employee data for all reports
attendance          → attendance reports
leave_applications  → leave reports
leave_balances      → balance reports
payslips            → payroll register
payroll_runs        → payroll summary
compliance_filings  → statutory status
custom_reports      → saved custom report configs
scheduled_reports   → recurring report configs
scheduled_report_logs → execution history
temp_exports        → temporary generated files
report_history      → recent reports by user
```

---

## 🔗 Related Documents
- Payroll flows → [15_PAYROLL_FLOWS.md](./15_PAYROLL_FLOWS.md)
- Compliance flows → [16_COMPLIANCE_FLOWS.md](./16_COMPLIANCE_FLOWS.md)
- Automation flows → [18_AUTOMATION_FLOWS.md](./18_AUTOMATION_FLOWS.md)
