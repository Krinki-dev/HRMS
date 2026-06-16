# 16 — COMPLIANCE FLOWS
> Part of HRMS Blueprint | [← Back to Index](./00_INDEX.md)
> Format: FE = Frontend | BE = Backend | DB = Database
> Last Updated: June 2026

---

## PAGES IN THIS DOCUMENT
```
1. Compliance Dashboard
2. PF (Provident Fund) Management
3. ESI Management
4. Professional Tax (PT)
5. TDS / Income Tax
6. Labour Welfare Fund (LWF)
7. Compliance Calendar
```

---
---

## 1. COMPLIANCE DASHBOARD
**URL:** `/compliance`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| GET /api/v1/compliance/dashboard | | |
| | Fetch upcoming compliance due dates | READ: compliance_calendar |
| | Fetch pending filings | READ: compliance_filings WHERE status = pending |
| | Fetch overdue filings | READ: compliance_filings WHERE due_date < today AND status != filed |
| **Due Date Alerts:** | | |
| 🔴 Overdue: ESIC Challan (3 days ago) | | |
| 🟡 Due Soon: PF ECR (in 5 days) | | |
| 🟢 Upcoming: PT Return (in 15 days) | | |
| **Quick Action buttons per filing:** | | |
| Generate / Download / Mark as Filed | | |
| **Month Selector** to view any month's filings | | |

---
---

## 2. PF MANAGEMENT
**URL:** `/compliance/pf`

---

### Step 2.1 — PF Dashboard

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Month/Year selector | | |
| GET /api/v1/compliance/pf?month=&year= | | |
| | Fetch payroll data for PF | READ: payslips WHERE month = ? AND year = ? |
| | Calculate PF summary | |
| **Summary Cards:** | | |
| Employee PF / Employer PF / Total PF / EDLI | | |
| Total employees under PF | | |
| **Employee PF Table:** | | |
| UAN / Name / Basic / Employee PF / Employer PF / EPS | | |
| Filter: PF applicable employees only | | |

---

### Step 2.2 — ECR File Generation

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| "Generate ECR File" button | | |
| POST /api/v1/compliance/pf/ecr | | |
| Send: { month, year } | | |
| | Verify payroll is locked for this month | READ: payroll_runs.status = locked |
| | Fetch all PF applicable employees | READ: payslips JOIN employees |
| | Generate ECR format: | |
| | UAN, Member Name, Gross Wages, EPF Wages, EPS Wages | |
| | Employee PF, Employer PF, EPS, NCP Days | |
| | Format as per EPFO specification | |
| | Save ECR file to MinIO | WRITE: compliance_files |
| | Return signed URL | |
| Download ECR .txt file | | |
| **Upload to EPFO portal button:** | | |
| Opens browser automation flow | See Automation Flows doc | |
| Shows upload progress | | |
| Mark as Filed | PUT /api/v1/compliance/pf/:id/mark-filed | WRITE: compliance_filings.status = filed |

---

### Step 2.3 — UAN Management

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| List employees without UAN | GET /api/v1/compliance/pf/missing-uan | READ: employees WHERE uan IS NULL AND pf_applicable = true |
| Bulk UAN entry form | | |
| Employee name / PF Member ID / UAN input | | |
| Save → PUT /api/v1/compliance/pf/uan | | WRITE: employees.uan_number |
| **Auto-fetch UAN from EPFO** (Automation): | | |
| Select employees → Fetch UAN button | | |
| | Launch Playwright → EPFO portal | |
| | Login with company credentials | READ: automation_credentials |
| | Search by PF member ID | |
| | Extract UAN | |
| | Return UANs | |
| | Auto-fill + save | WRITE: employees.uan_number |

---
---

## 3. ESI MANAGEMENT
**URL:** `/compliance/esi`

---

### Step 3.1 — ESI Dashboard

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Month/Year selector | | |
| GET /api/v1/compliance/esi?month=&year= | | |
| | Fetch ESI applicable employees (gross < 21000) | READ: payslips WHERE esic_employee > 0 |
| **Summary:** | | |
| Total ESI Wages / Employee ESI / Employer ESI / Total | | |
| Employee ESI Table: | | |
| IP Number / Name / Gross Wages / Employee ESI / Employer ESI | | |

---

### Step 3.2 — ESI Challan Generation

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| "Generate Challan" button | | |
| POST /api/v1/compliance/esi/challan | | |
| | Verify payroll locked | READ: payroll_runs.status |
| | Calculate total ESI contribution | READ: payslips |
| | Generate challan data | |
| | Save challan file | WRITE: compliance_files |
| Download challan | | |
| **Upload to ESIC portal** (Automation): | | |
| Playwright opens ESIC portal | | |
| Auto-fills challan details | | |
| Manual payment completion by HR | | |
| Mark as Paid/Filed | WRITE: compliance_filings |

---
---

## 4. PROFESSIONAL TAX (PT)
**URL:** `/compliance/pt`

---

### Step 4.1 — PT Setup (One Time)

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| State selection (auto from company state) | | |
| GET /api/v1/compliance/pt/slabs?state= | | READ: pt_slabs WHERE state = ? |
| Show state PT slabs: | | |
| e.g. Maharashtra: 0-7500=0, 7501-10000=175, 10001+=200 | | |
| Company PT registration number input | | |
| Save → PUT /api/v1/settings/pt-config | | WRITE: company_pt_config |

---

### Step 4.2 — Monthly PT Challan

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Month/Year selector | | |
| GET /api/v1/compliance/pt?month=&year= | | |
| | Fetch PT deductions from payslips | READ: payslips.pt_amount |
| | Group by PT slab | |
| | Calculate total PT payable | |
| PT Summary shown | | |
| Generate Challan → Download | POST /api/v1/compliance/pt/challan | WRITE: compliance_files |
| Mark as Paid | | WRITE: compliance_filings |

---
---

## 5. TDS / INCOME TAX
**URL:** `/compliance/tds`

---

### Step 5.1 — Investment Declaration (Employee)

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Employee opens declaration form (April each year) | | |
| **Sections (Form 12BB):** | | |
| House Rent Paid (HRA exemption) | | |
| → Landlord name, PAN, address, rent amount | | |
| → Validate landlord PAN format | | |
| Leave Travel (LTA) | | |
| Home Loan Interest (Section 24b) | | |
| 80C Investments: | | |
| → PPF, ELSS, LIC, EPF, Tuition fees, Home loan principal | | |
| → Each with amount + proof upload | | |
| 80D: Medical insurance premium | | |
| 80G: Donations | | |
| Other deductions | | |
| **Regime selection:** | | |
| Old regime / New regime (radio) | | |
| System shows tax comparison both regimes | | |
| Submit → POST /api/v1/compliance/tds/declaration | | WRITE: tds_declarations |
| | Calculate estimated TDS for year | |
| | Divide by remaining months = monthly TDS | |
| | Update payroll TDS going forward | WRITE: employee_salaries.tds_monthly |

---

### Step 5.2 — Form 16 Generation

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Financial year selector | | |
| "Generate Form 16" button | | |
| POST /api/v1/compliance/tds/form16 | | |
| | Fetch all payslips for the year | READ: payslips WHERE year IN (FY months) |
| | Fetch employee declarations | READ: tds_declarations |
| | Calculate annual income, deductions, tax | |
| | Generate Form 16 Part A + Part B | |
| | Password protect: PAN number | |
| | Save to MinIO | WRITE: compliance_files |
| Download individual Form 16 | | |
| Bulk download all employees (zip) | | |
| Email to all employees button | | |
| | Queue email jobs | |
| | Send Form 16 PDF to each employee | |

---
---

## 6. LABOUR WELFARE FUND
**URL:** `/compliance/lwf`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| State selection (auto from company) | | |
| GET /api/v1/compliance/lwf/rules?state= | | READ: lwf_rules WHERE state = ? |
| Show: Frequency (monthly/half-yearly/yearly) | | |
| Employee + Employer contribution amounts | | |
| Deduction months (e.g. June + December) | | |
| **LWF Register:** | | |
| List employees with LWF deduction amounts | READ: payslips.lwf_amount | |
| Generate LWF return data | POST /api/v1/compliance/lwf/return | READ: payslips |
| Download return file | | WRITE: compliance_files |
| Mark as Filed | | WRITE: compliance_filings |

---
---

## 7. COMPLIANCE CALENDAR
**URL:** `/compliance/calendar`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Year view of all compliance due dates | | |
| GET /api/v1/compliance/calendar?year= | | READ: compliance_calendar |
| **Color coded:** | | |
| 🔴 PF ECR — 15th every month | | |
| 🔵 ESI Challan — 21st every month | | |
| 🟢 PT — State specific date | | |
| 🟡 TDS — 7th every month | | |
| ⚫ Form 16 — June 15 yearly | | |
| Click any event → quick action modal | | |
| Generate / Upload / Mark Filed | | |
| **Auto-remind:** | | |
| 7 days before due date → email to HR | | |
| 1 day before due date → WhatsApp to HR | | |
| Overdue → daily reminder | | |

---

## DB TABLES USED IN COMPLIANCE FLOWS

```
payslips              → source of all PF/ESI/PT/TDS amounts
employees             → UAN, PF/ESI applicability
compliance_filings    → status of each filing
compliance_files      → generated ECR/challan/Form16 files
compliance_calendar   → due dates per compliance type
tds_declarations      → employee investment declarations
pt_slabs              → state-wise PT slabs
lwf_rules             → state-wise LWF rules
company_pt_config     → PT registration per company
automation_credentials → EPFO/ESIC login for automation
```

---

## 🔗 Related Documents
- Payroll flows → [15_PAYROLL_FLOWS.md](./15_PAYROLL_FLOWS.md)
- Browser automation → [18_AUTOMATION_FLOWS.md](./18_AUTOMATION_FLOWS.md)
- Reports flows → [17_REPORTS_FLOWS.md](./17_REPORTS_FLOWS.md)
