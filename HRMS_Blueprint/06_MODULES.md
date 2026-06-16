# 06 — MODULES BLUEPRINT
> Part of HRMS Blueprint | [← Back to Index](./00_INDEX.md)
> Last Updated: June 2026 | All modules configurable — enable/disable per client

---

## ⚡ BUILD STATUS SUMMARY (June 2026)

| # | Module | Backend | Frontend | API Route |
|---|--------|---------|----------|-----------|
| 01 | Employee Management | ✅ Live | ✅ Live | `/api/v1/employees` |
| 02 | Attendance & Time | ✅ Live | ✅ Live | `/api/v1/attendance` |
| 03 | Leave Management | ✅ Live | ✅ Live | `/api/v1/leave` |
| 04 | Payroll | ✅ Live | 🔄 Partial | `/api/v1/payroll` |
| 05 | Compliance & Statutory | ✅ Live | ✅ Live | `/api/v1/compliance` |
| 06 | Document Management | ✅ Live | ✅ Live | (part of `/employees`) |
| 07 | Expense Management | ✅ Live | 🔄 Partial | `/api/v1/expenses` |
| 08 | Recruitment | ✅ Live | 🔄 Partial | `/api/v1/recruitment` |
| 09 | Performance Management | ✅ Live | 🔄 Partial | `/api/v1/performance` |
| 10 | Training & Development | ✅ Live | 🔄 Partial | `/api/v1/training` |
| 11 | Assets Management | ✅ Live | 🔄 Partial | `/api/v1/assets` |
| 12 | Communication | 🔄 Partial | 🔄 Partial | (part of notifications) |
| 13 | Browser Automation | ✅ Live | 🔄 Partial | `/api/v1/automation`, `/api/v1/gst` |
| 14 | Reports & Analytics | ✅ Live | ✅ Live | `/api/v1/reports` |
| 15 | System & Configuration | ✅ Live | ✅ Live | `/api/v1/settings`, `/api/v1/roles` |
| 16 | SaaS Platform Layer | ✅ Live | 🔄 Partial | `/api/v1/platform`, `/api/v1/platform/admin` |

---

## MODULE MAP

```
01. Employee Management      ← FOUNDATION (required)
02. Attendance & Time
03. Leave Management
04. Payroll
05. Compliance & Statutory
06. Document Management
07. Expense Management
08. Recruitment
09. Performance Management
10. Training & Development
11. Assets Management
12. Communication
13. Browser Automation       ← UNIQUE FEATURE
14. Reports & Analytics
15. System & Configuration
16. SaaS Layer (Your server)
```

---

## 01. EMPLOYEE MANAGEMENT

### Core Features
- Employee onboarding workflow
- Employee profile — personal, professional, emergency contacts
- Auto/manual/custom employee ID generation
- Employment type — full time, part time, contract, intern, consultant
- Employment status — active, probation, notice, terminated, absconding, retired
- Department & designation management
- Reporting hierarchy + org chart visual
- Employee transfer (department/branch/location)
- Promotion history tracking
- Probation to confirmation management
- Separation management (resignation, termination, retirement)
- Exit interview & exit checklist
- Rehire management
- Bulk import via Excel/CSV

### Employee Self Service (ESS)
- View & update own profile (with approval)
- View payslips & download
- View attendance history
- Apply for leave
- View company policies
- Submit expense claims
- Download HR letters (offer, experience, payslip)
- View org chart
- View team calendar

### Documents
- Upload documents per employee
- Document types: Aadhaar, PAN, Passport, Certificates, Other
- Expiry alerts for documents (configurable days before)
- Verification status per document
- Role based access (employee sees own, HR sees all)
- Bulk document download

**DB Tables:** employees, companies, branches, departments, designations, employee_documents
**Depends on:** Nothing (foundation)
**Required by:** All other modules

---

## 02. ATTENDANCE & TIME

### Attendance Capture Methods (All configurable)
- Manual entry by HR
- Biometric device integration
- Mobile app check-in with GPS location
- Web browser check-in
- QR code scan
- IP address restriction

### Shift Management
- Create shifts (morning/afternoon/night/custom)
- Rotating shift schedules
- Night shift allowance auto-calculation
- Shift swap requests with approval
- Week off configuration (Saturday/Sunday/custom)
- Holiday calendar (national + state + company holidays)
- Holiday calendar per branch/location
- Comp off management

### Overtime
- OT rules per designation/department
- Auto OT calculation beyond shift hours
- OT approval workflow
- Convert OT to comp off or payment

### Regularization
- Employee requests missed punch correction
- Manager/HR approves
- Bulk regularization for events/outings

**DB Tables:** attendance, shifts, holidays
**Depends on:** Employee Management
**Required by:** Payroll, Compliance

---

## 03. LEAVE MANAGEMENT

### Leave Types (All configurable)
- Casual Leave (CL)
- Sick Leave (SL)
- Earned/Privilege Leave (EL/PL)
- Maternity Leave
- Paternity Leave
- Compensatory Off (Comp Off)
- Loss of Pay (LOP)
- Optional/Festival Leave
- Custom types (unlimited)

### Leave Rules (Per type, fully configurable)
- Accrual — monthly/quarterly/yearly
- Carry forward with max limit
- Encashment rules
- Min/max days per application
- Gap required between leaves
- Half day support
- Document required for sick leave

### Workflow
- Apply → Manager approve → HR approve (configurable chain)
- Delegate approver during manager's leave
- Team calendar view
- Leave balance visible before applying
- Auto notifications (email/WhatsApp)

**DB Tables:** leave_types, leave_balances, leave_applications
**Depends on:** Employee Management
**Required by:** Payroll

---

## 04. PAYROLL

### Salary Structure
- Configurable components per company
- Standard: Basic, HRA, DA, TA, Special Allowance
- Custom allowances (unlimited)
- Deductions: PF, ESI, PT, TDS, LWF, custom
- CTC to gross to net calculation
- Salary revision with history

### Payroll Processing
- Monthly payroll run
- Attendance auto-integrated
- Leave deduction auto-applied
- LOP auto-calculated
- Bonus & incentive processing
- Arrear calculation
- Full & Final settlement on exit
- Payroll lock after processing (no edits)

### Compliance Auto-Calculation
- PF: 12% employee + 13% employer of basic
- ESI: 0.75% employee + 3.25% employer (wage < ₹21000)
- PT: State-wise slabs (configurable per state)
- TDS: As per investment declarations
- LWF: State-wise deduction

### Payslip
- Auto-generated on payroll run
- Custom company template
- Password protected PDF
- Email + WhatsApp delivery
- Reissue old payslips anytime

### Bank Payments
- Employee bank account management
- NEFT/RTGS bank transfer file generation
- Multiple bank support per employee

**DB Tables:** salary_structures, employee_salaries, payroll_runs, payslips
**Depends on:** Employee Management, Attendance, Leave
**Required by:** Compliance, Accounting

---

## 05. COMPLIANCE & STATUTORY

### PF (Provident Fund)
- ECR file generation for EPFO portal
- UAN management & linking
- KYC verification automation (browser automation)
- PF transfer/withdrawal tracking

### ESI (Employee State Insurance)
- ESI challan generation
- ESI return filing data
- Employee ESI card details

### Professional Tax
- State-wise PT slabs (all Indian states)
- PT challan generation
- PT return data export

### TDS / Income Tax
- Form 16 generation
- Investment declaration collection (Form 12BB)
- Old vs new tax regime selection per employee
- 24Q return data preparation

### Labour Welfare Fund
- State-wise LWF rules
- Auto deduction from payroll
- Return data export

### GST (If applicable)
- GST invoice generation
- GSTR-1/GSTR-3B data export
- GST number verification (central library)

**DB Tables:** compliance_filings, tds_declarations
**Depends on:** Payroll
**Required by:** Accounting, Reports

---

## 06. DOCUMENT MANAGEMENT

- HR letter generation (offer, appointment, increment, experience, relieving)
- Custom letter templates with variables
- Digital signature support
- Document vault per employee
- Bulk letter generation
- Template version control
- Document expiry tracking & alerts

**DB Tables:** employee_documents, employees
**Depends on:** Employee Management
**Required by:** All modules needing docs

---

## 07. EXPENSE MANAGEMENT

- Expense claim submission by employee
- Category-wise expenses (travel, food, accommodation, etc.)
- Receipt upload
- Manager approval workflow
- Reimbursement via payroll
- Travel expense with per diem rules
- Expense reports
- Budget vs actual tracking per department

**DB Tables:** expense_claims, expense_items, expense_policies, receipts
**Depends on:** Employee Management, Payroll
**Required by:** Accounting

---

## 08. RECRUITMENT

### Job Management
- Job requisition with approval
- Job description builder
- Internal & external job posting
- Career page (hosted on client domain)
- Job portal posting (Naukri, LinkedIn, Indeed)

### Candidate Management
- Resume/CV upload & parsing
- Candidate database / talent pool
- Duplicate candidate detection
- Source tracking (where candidate came from)

### Interview Process
- Interview scheduling with calendar
- Multi-round interview tracking
- Interviewer feedback collection
- Offer letter generation
- Acceptance/rejection tracking
- Auto-trigger onboarding on joining

**DB Tables:** job_requisitions, job_postings, candidates, candidate_stage_history, interviews, interview_feedback, offers
**Depends on:** Employee Management
**Required by:** Employee Management (creates employees on joining)

---

## 09. PERFORMANCE MANAGEMENT

- Goal setting (KRA/KPI framework)
- OKR (Objectives & Key Results) support
- Self appraisal by employee
- Manager appraisal
- 360-degree feedback (peers, subordinates)
- Rating normalization
- Performance Improvement Plan (PIP)
- Appraisal cycle management (annual/half-yearly)
- Bell curve distribution
- Salary increment linked to rating

**DB Tables:** appraisal_cycles, performance_goals, appraisals
**Depends on:** Employee Management
**Required by:** Payroll (salary revision from increment)

---

## 10. TRAINING & DEVELOPMENT

- Training needs identification
- Training calendar
- Internal & external training tracking
- Attendance tracking for training
- Training feedback & effectiveness rating
- Course completion certificates
- Certification management with expiry
- Employee skill matrix
- Training cost tracking

**DB Tables:** trainings, training_nominations, training_attendance, training_feedback, training_certificates
**Depends on:** Employee Management
**Required by:** Nothing

---

## 11. ASSETS MANAGEMENT

- Asset master (laptops, phones, furniture, vehicles, etc.)
- Asset allocation to employee
- Asset return tracking on exit
- Asset condition history
- Maintenance schedule & reminders
- AMC/warranty tracking
- Asset location tracking (branch-wise)
- Asset audit reports

**DB Tables:** assets, asset_allocations
**Depends on:** Employee Management
**Required by:** FnF Settlement (pending assets check)

---

## 12. COMMUNICATION

- Internal announcement system
- Company notice board
- Birthday & work anniversary notifications
- Employee survey builder
- Polls creation
- Configurable notifications (email/SMS/WhatsApp per event)

**DB Tables:** announcements, announcement_reads, surveys, survey_questions, survey_responses
**Depends on:** Employee Management
**Required by:** Nothing

---

## 13. BROWSER AUTOMATION ⭐ UNIQUE

### Target Portals
- EPFO portal — ECR upload, UAN operations, KYC
- ESIC portal — Challan generation, returns filing
- GST portal — Company search, verification
- Aadhaar portal — Offline XML download
- LWF portals — State-wise
- PT portals — State-wise

### Features
- Manual trigger by HR
- CAPTCHA — manual solve window opens for user
- Form auto-fill from employee data
- File download management (saved to MinIO)
- File upload to portals
- Run logs with success/error status
- Error screenshots captured
- Retry on failure

### Central Library Integration
- After Aadhaar verification → saved to central library
- GST company details → saved to central library
- Other clients fetch from library (no re-verification)

**DB Tables:** automation_tasks, automation_logs, automation_screenshots, automation_credentials, automation_schedules, portal_urls
**Depends on:** Compliance, Employee Management
**Required by:** Compliance (auto-filing)

---

## 14. REPORTS & ANALYTICS

### Standard Reports
- Employee master report
- Headcount & strength report
- Attrition report
- Attendance summary
- Leave utilization report
- Payroll register
- Bank transfer report
- Statutory reports (PF/ESI/PT/TDS)
- Increment & appraisal report
- Training completion report

### Dashboard Analytics
- Total headcount (live)
- Department-wise strength
- Monthly attrition rate
- Today's attendance percentage
- Leave trend chart
- Payroll cost trend
- Hiring funnel
- Gender diversity ratio
- Age distribution

### Export Options
- PDF (styled, company branded)
- Excel (.xlsx)
- CSV
- Scheduled auto email reports
- Custom report builder (drag & drop columns)

**DB Tables:** Reads from all modules. Writes to: temp_exports, scheduled_reports (not yet in schema — add as needed)
**Depends on:** All modules
**Required by:** Nothing

---

## 15. SYSTEM & CONFIGURATION

- Module enable/disable per client (no code change)
- Role & permission builder (create custom roles)
- Approval workflow builder (configure chains)
- Email template editor (custom notification templates)
- Notification rules builder (which event triggers what)
- Custom fields (add any field to any module)
- Custom forms builder
- Webhook support (connect external apps)
- API access for integrations
- Audit log viewer (who did what when)
- Data backup & restore
- White label settings (logo, name, colors)
- Subscription & billing (view invoices, upgrade plan)
- DB mode configuration (local/cloud/hybrid)

**DB Tables:** roles, tenant_modules, workflow_configs (add to schema), notification_rules (add to schema), notification_templates (add to schema), custom_field_definitions (add to schema), custom_field_values (add to schema), api_keys (add to schema), webhook_configs (add to schema), audit_logs, backup_logs (add to schema), tenant_branding (UI branding), tenant_db_config (DB connection config), notification_config
**Depends on:** Nothing (foundation layer)
**Required by:** All modules

---

## 16. SAAS LAYER (YOUR SERVER)

- Client company registration
- Plan selection & comparison
- Razorpay/PhonePe payment integration
- Subscription management
- Invoice generation & storage (accounting format)
- Renewal alerts
- Grace period management
- Auto suspend on non-payment
- Reactivation workflow
- Licence key generation & verification
- Client usage analytics
- Central library management (Aadhaar/GST/PAN)
- White label management
- Update distribution system

**DB Tables (Central DB — ACTUAL from central.prisma):** tenants, tenant_modules, central_user_index, tenant_branch_links, tenant_pricing_configs, invoices, platform_settings, central_kyc_records, central_gst_records
> Note: No `plans`, `subscriptions`, or `licence_keys` tables exist. Plan data is stored in `tenants.plan` (string) + `tenants.plan_expires_at`. Pricing is per-tenant via `tenant_pricing_configs`. KYC/GST shared cache is in `central_kyc_records` / `central_gst_records`.
**Depends on:** Nothing
**Required by:** All (every client is a tenant)

---

## 🔗 Related Documents
- Database tables for each module → [04_DATABASE.md](./04_DATABASE.md)
- Data flows between modules → [05_DATA_FLOW.md](./05_DATA_FLOW.md)
- API endpoints per module → [03_BACKEND.md](./03_BACKEND.md)
