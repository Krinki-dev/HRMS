# 19 — RECRUITMENT, PERFORMANCE, TRAINING, ASSETS & EXPENSE FLOWS
> Part of HRMS Blueprint | [← Back to Index](./00_INDEX.md)
> Format: FE = Frontend | BE = Backend | DB = Database
> Last Updated: June 2026

---

## SECTIONS IN THIS DOCUMENT
```
A. Recruitment Flows
B. Performance Management Flows
C. Training & Development Flows
D. Assets Management Flows
E. Expense Management Flows
```

---
---

# SECTION A — RECRUITMENT FLOWS
**URL:** `/recruitment`

---

## A1. Job Requisition

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| "Raise Requisition" button | | |
| **Form fields:** | | |
| Job Title | | |
| Department (dropdown) | | READ: departments |
| Designation (dropdown) | | READ: designations |
| No. of Positions | | |
| Employment Type | | |
| Experience Required (min-max years) | | |
| Salary Range (min-max CTC) | | |
| Job Description (rich text) | | |
| Skills Required (tag input) | | |
| Location / Branch | | |
| Target Joining Date | | |
| Priority: Low / Medium / High / Urgent | | |
| Submit for approval → POST /api/v1/recruitment/requisitions | | |
| | Create requisition | WRITE: job_requisitions { status: pending_approval } |
| | Notify HR Admin for approval | |
| **HR Approves:** | | |
| PUT /api/v1/recruitment/requisitions/:id/approve | | WRITE: job_requisitions.status = approved |
| Job automatically moves to active openings | | |

---

## A2. Job Posting

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| From approved requisition → "Post Job" button | | |
| **Posting options:** | | |
| ☑ Internal (visible to employees) | | |
| ☑ Career page (your client's public page) | | |
| ☑ Naukri (API key required) | | |
| ☑ LinkedIn (API key required) | | |
| ☑ Indeed (API key required) | | |
| Application deadline date | | |
| Post → POST /api/v1/recruitment/jobs/post | | |
| | Create job posting | WRITE: job_postings { status: active } |
| | Post to selected portals via API | |
| | Update requisition status | WRITE: job_requisitions.status = posted |
| Public career page auto-updates | GET /public/careers (no auth) | READ: job_postings WHERE status = active |

---

## A3. Candidate Pipeline

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Kanban board view per job | | |
| **Stages (configurable):** | | |
| Applied → Screening → Interview → Offer → Joined / Rejected | | |
| Candidate cards draggable between stages | | |
| **Add Candidate manually:** | | |
| Name, email, phone, resume upload | | |
| Source: Referral/Walk-in/Portal/Agency | | |
| POST /api/v1/recruitment/candidates | | WRITE: candidates |
| **Resume Parser (auto):** | | |
| Upload resume → BE parses | POST /api/v1/recruitment/parse-resume | |
| | Extract: name, email, phone, skills, experience | |
| | Auto-fill candidate form | |
| | Check duplicate (same email/phone) | READ: candidates WHERE email = ? OR phone = ? |
| **Move stage:** | | |
| Drag card → PUT /api/v1/recruitment/candidates/:id/stage | | WRITE: candidates.stage |
| | Log stage change with timestamp | WRITE: candidate_stage_history |

---

## A4. Interview Scheduling

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Click candidate → Schedule Interview | | |
| Round number (1st/2nd/Final) | | |
| Interview type: In-person/Video/Phone | | |
| Date + Time picker | | |
| Interviewer(s) selection (employee search) | | |
| POST /api/v1/recruitment/interviews | | WRITE: interviews |
| | Send calendar invite to interviewer | |
| | Send confirmation to candidate | |
| **Post-interview feedback:** | | |
| Interviewer fills: Rating 1-5 per skill | | |
| Overall recommendation: Proceed/Hold/Reject | | |
| Comments | | |
| POST /api/v1/recruitment/interviews/:id/feedback | | WRITE: interview_feedback |

---

## A5. Offer & Joining

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| "Generate Offer" button on candidate | | |
| Offer CTC entry | | |
| Joining date | | |
| Offer letter template selected | | |
| Generate → POST /api/v1/recruitment/offers | | |
| | Fill template with candidate + CTC data | |
| | Generate PDF offer letter | |
| | Store in MinIO | WRITE: offers { status: generated } |
| Send offer to candidate email | | |
| **Candidate accepts:** | | |
| Mark accepted → PUT /api/v1/recruitment/offers/:id/accept | | WRITE: offers.status = accepted |
| **On joining date:** | | |
| "Convert to Employee" button | | |
| POST /api/v1/recruitment/candidates/:id/convert | | |
| | Create employee record from candidate data | WRITE: employees (pre-filled) |
| | Auto-fill: name, email, phone, DOB, address | |
| | Redirect to complete employee onboarding | |
| | Update requisition filled count | WRITE: job_requisitions.filled += 1 |

---
---

# SECTION B — PERFORMANCE MANAGEMENT FLOWS
**URL:** `/performance`

---

## B1. Goal Setting

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| **Appraisal cycle setup (HR Admin):** | | |
| Cycle name (Annual 2025) | | |
| Period: April 2024 – March 2025 | | |
| Goal setting window: April 1-30 | | |
| Self appraisal window: March 1-15 | | |
| Manager review window: March 16-31 | | |
| Rating scale: 1-5 with labels | | |
| POST /api/v1/performance/cycles | | WRITE: appraisal_cycles |
| **Employee sets goals:** | | |
| Goal title | | |
| Description | | |
| Category: KRA / KPI / OKR | | |
| Target (measurable) | | |
| Weightage % (all goals must total 100%) | | |
| Target date | | |
| FE validates total weightage = 100% before submit | | |
| POST /api/v1/performance/goals | | WRITE: performance_goals |
| Manager reviews + approves goals | | WRITE: performance_goals.status = approved |

---

## B2. Appraisal Process

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| **Self appraisal (employee):** | | |
| View each goal → enter achievement % | | |
| Comments per goal | | |
| Overall self rating | | |
| POST /api/v1/performance/appraisals/self | | WRITE: appraisals { type: self } |
| **Manager appraisal:** | | |
| View employee self ratings | | READ: appraisals WHERE type = self |
| Enter manager rating per goal | | |
| Override or agree with self ratings | | |
| Overall manager rating | | |
| Promotion recommendation: Yes/No | | |
| Increment recommendation: % or amount | | |
| POST /api/v1/performance/appraisals/manager | | WRITE: appraisals { type: manager } |
| **HR review & normalization:** | | |
| Bell curve distribution shown | | |
| Adjust ratings if needed | | |
| Final rating locked | | WRITE: appraisals.status = final |
| **Increment processing:** | | |
| Approved increments → salary revision | | WRITE: employee_salaries (new record) |

---
---

# SECTION C — TRAINING & DEVELOPMENT FLOWS
**URL:** `/training`

---

## C1. Training Calendar

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Monthly calendar view | | |
| GET /api/v1/training/calendar | | READ: trainings WHERE date >= today |
| **Add Training:** | | |
| Training name | | |
| Type: Internal / External / Online | | |
| Trainer name (internal employee or external) | | |
| Date(s) | | |
| Duration (hours) | | |
| Venue / Platform (Zoom link etc.) | | |
| Target audience: Department / Designation / All | | |
| Max participants | | |
| POST /api/v1/training/create | | WRITE: trainings |
| **Nominations:** | | |
| HR nominates employees OR employees self-nominate | | |
| POST /api/v1/training/nominate | | WRITE: training_nominations |
| Send invitation to nominated employees | | |

---

## C2. Training Completion & Feedback

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Mark attendance for training | | WRITE: training_attendance |
| **Post-training feedback form:** | | |
| Rating 1-5 for: Content / Trainer / Venue / Overall | | |
| Comments | | |
| POST /api/v1/training/feedback | | WRITE: training_feedback |
| **Certificate generation:** | | |
| Auto-generate completion certificate | | |
| Employee name + training + date + signature | | |
| Store as PDF in MinIO | WRITE: training_certificates | |
| Available in employee documents | | |

---
---

# SECTION D — ASSETS MANAGEMENT FLOWS
**URL:** `/assets`

---

## D1. Asset Master

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| List all assets | GET /api/v1/assets | READ: assets WHERE deleted_at IS NULL |
| **Add Asset:** | | |
| Asset name | | |
| Category: Laptop/Phone/Furniture/Vehicle/Other | | |
| Brand / Model | | |
| Serial number (unique) | | |
| Purchase date | | |
| Purchase price (paise) | | |
| Vendor name | | |
| Warranty expiry date | | |
| AMC details + expiry | | |
| Location (branch) | | |
| Condition: New/Good/Fair/Poor | | |
| POST /api/v1/assets | | WRITE: assets { status: available } |
| **Asset photo upload:** | | |
| Upload photo | POST /api/v1/assets/:id/photo | WRITE: assets.photo_url (MinIO) |

---

## D2. Asset Allocation & Return

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Select asset → "Allocate" button | | |
| Employee search dropdown | | |
| Allocation date | | |
| Condition at allocation | | |
| Digital acknowledgement (employee signs) | | |
| POST /api/v1/assets/:id/allocate | | |
| | Create allocation record | WRITE: asset_allocations { status: allocated } |
| | Update asset status | WRITE: assets.status = allocated, assigned_to = employee_id |
| | Generate allocation letter PDF | |
| **Asset Return:** | | |
| "Return Asset" button | | |
| Return date | | |
| Condition at return: Good/Damaged/Lost | | |
| If damaged/lost: damage note | | |
| PUT /api/v1/assets/:id/return | | |
| | Close allocation record | WRITE: asset_allocations.returned_at |
| | Update asset status | WRITE: assets.status = available (or under_repair) |
| | Deduct damage cost from FnF if applicable | |
| **Exit integration:** | | |
| On employee exit → show pending assets | READ: asset_allocations WHERE employee_id = ? AND returned_at IS NULL |
| Must return all assets before FnF | | |

---
---

# SECTION E — EXPENSE MANAGEMENT FLOWS
**URL:** `/expenses`

---

## E1. Submit Expense Claim

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| "New Claim" button | | |
| **Expense items (add multiple):** | | |
| Category: Travel/Food/Accommodation/Fuel/Other | | |
| Date of expense | | |
| Description | | |
| Amount (paise) | | |
| Receipt upload (mandatory above ₹500 configurable) | POST /api/v1/expenses/upload-receipt | WRITE: MinIO, receipts table |
| Add more items button | | |
| **Claim summary:** | | |
| Total amount shown | | |
| Submit → POST /api/v1/expenses/claims | | |
| | Validate receipts present where required | |
| | Check if amount within policy limits | READ: expense_policies |
| | Create claim | WRITE: expense_claims { status: pending } |
| | Notify manager | |

---

## E2. Expense Approval

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Manager sees pending claims | GET /api/v1/expenses/pending | READ: expense_claims WHERE approver = ? AND status = pending |
| View receipt images | | READ: receipts (signed URL) |
| Approve all / Approve partial / Reject | | |
| **Partial approval:** | | |
| Approve some items, reject others | | |
| Comment on rejected items | | |
| PUT /api/v1/expenses/claims/:id/approve | | |
| | Update claim status | WRITE: expense_claims.status = approved |
| | Flag for payroll reimbursement | WRITE: expense_claims.reimburse_in_payroll = true |
| | Notify employee | |
| **Reimbursement in payroll:** | | |
| During payroll run: fetch approved pending claims | READ: expense_claims WHERE status = approved AND reimbursed = false |
| Add to payslip as reimbursement | WRITE: payslips.other_earnings | |
| Mark as reimbursed | WRITE: expense_claims.reimbursed = true, payslip_id | |

---

## DB TABLES — ALL SECTIONS

```
RECRUITMENT:
job_requisitions        → open positions
job_postings            → posted to portals
candidates              → applicant profiles
candidate_stage_history → pipeline movement
interviews              → scheduled interviews
interview_feedback      → interviewer ratings
offers                  → offer letters

PERFORMANCE:
appraisal_cycles        → annual/half-yearly cycles
performance_goals       → employee KRA/KPI/OKR
appraisals              → self + manager ratings
pip_plans               → performance improvement plans

TRAINING:
trainings               → training events
training_nominations    → who is attending
training_attendance     → actual attendance
training_feedback       → post-training ratings
training_certificates   → completion certificates

ASSETS:
assets                  → asset master
asset_allocations       → who has what asset
asset_maintenance       → maintenance history

EXPENSES:
expense_claims          → claim headers
expense_items           → individual items per claim
receipts                → uploaded receipt files
expense_policies        → limits per category
```

---

## 🔗 Related Documents
- Employee flows → [12_EMPLOYEE_FLOWS.md](./12_EMPLOYEE_FLOWS.md)
- Payroll flows (expense reimbursement) → [15_PAYROLL_FLOWS.md](./15_PAYROLL_FLOWS.md)
- Database full schema → [04_DATABASE.md](./04_DATABASE.md)
