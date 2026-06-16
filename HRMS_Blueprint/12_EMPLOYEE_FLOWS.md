# 12 — EMPLOYEE FLOWS
> Part of HRMS Blueprint | [← Back to Index](./00_INDEX.md)
> Format: FE = Frontend | BE = Backend | DB = Database
> Last Updated: June 2026

---

## PAGES IN THIS DOCUMENT
```
1. Employee List Page
2. Add New Employee (Manual)
3. Bulk Employee Import (Excel/CSV)
4. Employee Profile View
5. Edit Employee
6. Employee Documents
7. Employee Exit / Separation
8. Employee Transfer / Promotion
```

---
---

## 1. EMPLOYEE LIST PAGE
**URL:** `/employees`

---

### Step 1.1 — Page Load

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Show page skeleton loader | | |
| GET /api/v1/employees?cursor=&limit=20 | | |
| | Verify JWT token | |
| | Check role has employees.view permission | READ: roles.permissions |
| | Fetch employees with pagination | READ: employees WHERE deleted_at IS NULL |
| | Join: department name, designation name, branch name | READ: departments, designations, branches |
| | Return: { data: employees[], pagination: { cursor, hasMore, total } } | |
| Show total count badge | | |
| Render employee cards/table | | |
| **Columns shown:** | | |
| Photo thumbnail, Emp Code, Name, Department, Designation, Status, Actions | | |

---

### Step 1.2 — Search & Filters

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Search box: name / email / employee code / phone | | |
| Debounce 300ms before calling API | | |
| GET /api/v1/employees?search=xxx | BE does ILIKE search | READ: employees WHERE name ILIKE '%xxx%' |
| **Filter dropdowns:** | | |
| Department filter | | READ: departments (for dropdown) |
| Designation filter | | READ: designations |
| Branch filter | | READ: branches |
| Status filter: All/Active/Probation/Notice/Terminated | | |
| Employment type filter | | |
| All filters combine with AND logic | | |
| Clear filters button | | |
| **Export button:** | | |
| Export filtered list → PDF / Excel / CSV | POST /api/v1/employees/export | READ: employees (filtered) |

---
---

## 2. ADD NEW EMPLOYEE
**URL:** `/employees/new`
**Access:** HR Admin / HR Manager

---

### Step 2.1 — Form Structure (Tabs)

```
Tab 1: Personal Information
Tab 2: Professional Details
Tab 3: Salary & Bank
Tab 4: Documents Upload
Tab 5: Account & Access
(Save button available on each tab — saves as draft)
(Final Submit button on Tab 5 — activates employee)
```

---

### Step 2.2 — Tab 1: Personal Information

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| **Auto-generated (shown, not editable):** | | |
| Employee Code (format from company settings) | | |
| **Mandatory Fields:** | | |
| First Name | | |
| Last Name | | |
| Date of Birth (date picker, min age 18) | | |
| Gender dropdown: Male/Female/Other | | |
| Mobile Number → validate 10 digits | | |
| Personal Email → validate format | | |
| **Auto-fill trigger: Aadhaar** | | |
| Aadhaar Number input → Verify button | | |
| On verify click: | | |
| Check central library first | POST /api/v1/compliance/verify-aadhaar | READ: central_gst_records + central_kyc_records WHERE identifier = ? |
| If found in library → auto-fill all fields ✅ | Return: cached data | |
| If not found → start Playwright automation | Launch Aadhaar portal | |
| Show: "Opening Aadhaar portal, please wait..." | | |
| Aadhaar portal opens → OTP sent to employee mobile | | |
| Show OTP input field in HRMS | | |
| Employee enters OTP | | |
| Submit OTP → automation continues | Playwright submits OTP | |
| Download XML → parse | Parse Aadhaar XML | |
| **Auto-filled from Aadhaar (non-editable after verify):** | | |
| Full Name (from Aadhaar) | | |
| Date of Birth (locked) | | |
| Gender (locked) | | |
| Address (editable — may differ) | | |
| Photo (from Aadhaar XML) | | |
| | Store verified data | WRITE: central_gst_records |
| | Store encrypted Aadhaar number | WRITE: employees.aadhar_number (encrypted) |
| **Other Fields:** | | |
| Blood Group dropdown | | |
| Marital Status | | |
| Current Address (auto-filled from Aadhaar, editable) | | |
| Permanent Address + "Same as current" checkbox | | |
| Emergency Contact: Name, Relation, Phone | | |
| Save Tab → POST /api/v1/employees/draft | | WRITE: employees (partial, status: draft) |

---

### Step 2.3 — Tab 2: Professional Details

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| **Auto-filled (editable):** | | |
| Official Email (auto-generated: firstname.lastname@company.com) | | |
| **Select Fields:** | | |
| Department (dropdown) | Load on tab open | READ: departments |
| Designation (dropdown — filtered by dept) | | READ: designations |
| Branch (dropdown) | | READ: branches |
| Reporting Manager (employee search dropdown) | | READ: employees WHERE is_active = true |
| Employment Type: Full Time/Part Time/Contract/Intern | | |
| **Date Fields:** | | |
| Date of Joining (date picker) | | |
| Probation Period: dropdown (1/2/3/6 months or custom) | | |
| Probation End Date: auto-calculated from DOJ + probation period (editable) | | |
| **Statutory:** | | |
| PAN Number → validate format (ABCDE1234F) | | |
| PF Applicable toggle | | |
| If PF: UAN Number (optional at this stage) | | |
| ESIC Applicable toggle (auto: if salary < 21000) | | |
| PT Applicable toggle (auto: based on state) | | |
| Save Tab | PUT /api/v1/employees/draft/:id | WRITE: employees (professional fields) |

---

### Step 2.4 — Tab 3: Salary & Bank

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| **Salary Structure:** | | |
| Select salary structure (dropdown) | Load structures | READ: salary_structures |
| Enter CTC amount | | |
| System auto-calculates breakup: | | |
| Basic = 40-50% of CTC (as per structure rules) | BE calculates | |
| HRA = % of Basic | | |
| All components shown in table | | |
| Gross, deductions, net per month shown | | |
| **Bank Details:** | | |
| Account Holder Name (auto-filled from employee name) | | |
| Bank Name (dropdown with common banks + other) | | |
| Account Number | | |
| Confirm Account Number (must match) | | |
| IFSC Code → validate format + fetch bank details | POST /api/v1/compliance/verify-ifsc | READ: central_gst_records + central_kyc_records (IFSC) |
| Bank name & branch auto-filled from IFSC | Return bank details | |
| Account Type: Savings/Current | | |
| Save Tab | PUT /api/v1/employees/draft/:id | WRITE: employee_salaries, employee_bank_accounts |

---

### Step 2.5 — Tab 4: Documents Upload

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Document checklist shown | | |
| **Pre-uploaded (from Aadhaar verification):** | | |
| Aadhaar XML ✅ (shown as uploaded, non-uploadable) | | |
| **Upload fields:** | | |
| PAN Card copy | | |
| Passport (optional) + expiry date | | |
| Educational certificates | | |
| Previous experience letters | | |
| Other documents (custom) | | |
| Each field: drag & drop or browse | | |
| Accepted formats: PDF, JPG, PNG | | |
| Max size: as per company config | | |
| Preview button per document | | |
| Upload → POST /api/v1/employees/:id/documents | Store in MinIO | WRITE: employee_documents |
| Show upload progress bar | | |
| Mark optional documents as "Pending" | | |

---

### Step 2.6 — Tab 5: Account & Access

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Create login account toggle | | |
| **If enabled:** | | |
| Email (auto-filled from official email, editable) | | |
| Role assignment dropdown | Load roles | READ: roles WHERE company_id = ? |
| Login method: Password / OTP only | | |
| **If password:** | | |
| Auto-generate password toggle | | |
| Send welcome email with setup link | | |
| **Final Submit button** | | |
| Confirm dialog: "Activate this employee?" | | |
| On confirm: POST /api/v1/employees/activate/:id | | |
| | Change status from draft to active | WRITE: employees.status = 'active' |
| | Create user account | WRITE: users |
| | Create leave balances for all leave types | WRITE: leave_balances (all active types) |
| | Send welcome email/WhatsApp | |
| | Write audit log | WRITE: audit_logs |
| | Return success | |
| Redirect to employee profile page | | |
| Success toast: "Employee [Name] added successfully" | | |

---
---

## 3. BULK EMPLOYEE IMPORT
**URL:** `/employees/bulk-import`

---

### Step 3.1 — Template Download

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Download Template button | | |
| GET /api/v1/employees/import-template | | |
| | Generate Excel template | READ: companies config for required fields |
| | Columns: all required + optional fields | |
| | First row: column headers | |
| | Second row: sample data | |
| | Third row: field notes/instructions | |
| | Color code mandatory columns (red header) | |
| | Dropdown columns: department, designation, etc. | READ: departments, designations, branches |
| | Return .xlsx file | |
| Browser downloads template file | | |

---

### Step 3.2 — File Upload & Validation

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Drag & drop area for Excel/CSV | | |
| File type validation: .xlsx, .xls, .csv only | | |
| Show file name + row count preview | | |
| POST /api/v1/employees/validate-import | | |
| Send: file (multipart) | | |
| | Parse Excel/CSV rows | |
| | Validate each row: | |
| | → Mandatory fields present? | |
| | → Email format valid? | |
| | → Mobile 10 digits? | |
| | → Date formats correct? | |
| | → Department/Designation exists? | READ: departments, designations |
| | → Duplicate email in file? | |
| | → Duplicate email in DB? | READ: employees WHERE email IN (...) |
| | Return validation report: | |
| | { total: 50, valid: 47, errors: [{ row, field, message }] } | |
| Show validation results table | | |
| Valid rows: green ✅ | | |
| Error rows: red ❌ with reason | | |
| Download error report button | | |
| Fix & re-upload option | | |
| "Import X valid rows" button (if any valid) | | |

---

### Step 3.3 — Import Execution

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Click "Import X valid rows" | | |
| Progress bar shown: "Importing 47 of 50..." | | |
| POST /api/v1/employees/execute-import | | |
| | Process valid rows in batches of 10 | |
| | For each employee: | |
| | → Create employees record | WRITE: employees |
| | → Auto-generate employee code | |
| | → Create user account | WRITE: users |
| | → Create leave balances | WRITE: leave_balances |
| | → Send welcome email (queued) | |
| | Report progress via SSE or polling | |
| | On complete: return { imported: 47, failed: 0 } | |
| Show completion summary | | |
| Download import report button | | |
| View imported employees button | | |

---
---

## 4. EMPLOYEE PROFILE VIEW
**URL:** `/employees/:id`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| GET /api/v1/employees/:id | | |
| | Check permission: own profile OR hr role | READ: roles.permissions |
| | Fetch employee full details | READ: employees JOIN department, designation, branch |
| | Fetch linked user account | READ: users WHERE employee_id = ? |
| | Fetch leave balances summary | READ: leave_balances |
| | Fetch recent attendance (last 30 days) | READ: attendance |
| | Fetch active salary | READ: employee_salaries WHERE effective_to IS NULL |
| | Fetch documents list | READ: employee_documents |
| | Return all data in one response | |
| **Profile Header:** | | |
| Photo, Name, Emp Code, Designation, Department | | |
| Status badge (Active/Probation/etc.) | | |
| Quick actions: Edit, Documents, Transfer, Exit | | |
| **Tabs:** | | |
| Personal | Professional | Salary | Attendance | Leave | Documents | Timeline | |
| **Timeline tab:** | | |
| Joining → Confirmation → Promotions → Transfers → (Exit) | | |
| All from audit_logs + employees history | | |
| **Sensitive data (role based display):** | | |
| Aadhaar: masked (XXXX-XXXX-1234) | BE masks in response | READ: employees.aadhar_number (decrypt then mask) |
| PAN: masked (ABCDE1234F → XXXXX1234X) | | |
| Bank account: masked (XXXXXXXX4567) | | |
| Full Aadhaar: only HR Admin can unmask → click to reveal | | |
| Unmask click → POST /api/v1/employees/:id/unmask | BE decrypts + logs | WRITE: audit_logs (sensitive_data_accessed) |

---
---

## 5. EDIT EMPLOYEE
**URL:** `/employees/:id/edit`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Same tabs as Add Employee | | |
| **Locked fields (non-editable after activation):** | | |
| Employee Code (never editable) | | |
| Aadhaar Number (locked after verification) | | |
| PAN (locked after verification) | | |
| Date of Birth (locked after confirmation) | | |
| Date of Joining (locked after first payroll) | | |
| **Editable:** | | |
| Name (with approval workflow if configured) | | |
| Contact details | | |
| Address | | |
| Department / Designation → triggers transfer record | | |
| Bank details | | |
| Save → PUT /api/v1/employees/:id | | |
| | Validate changes | |
| | Check what changed | |
| | If salary changed → create new employee_salaries record (keep history) | WRITE: employee_salaries (new row, old row gets effective_to) |
| | If department changed → create transfer record | WRITE: employee_transfers |
| | Log all changes | WRITE: audit_logs { old_values, new_values } |
| | Return updated employee | WRITE: employees |
| Show success toast | | |
| Update profile page without full reload | | |

---

## DB TABLES USED IN EMPLOYEE FLOWS

```
employees              → main employee record
employee_documents     → uploaded documents
employee_salaries      → salary history
employee_bank_accounts → bank details
leave_balances         → leave balances per type
users                  → login account
departments            → for dropdowns + display
designations           → for dropdowns + display
branches               → for dropdowns + display
central_kyc_records → Aadhaar KYC cache  /  Use IFSC API for bank lookup
audit_logs             → all changes logged
```

---

## 🔗 Related Documents
- Auth flows → [09_AUTH_FLOWS.md](./09_AUTH_FLOWS.md)
- Leave flows → [14_LEAVE_FLOWS.md](./14_LEAVE_FLOWS.md)
- Payroll flows → [15_PAYROLL_FLOWS.md](./15_PAYROLL_FLOWS.md)
- Database tables → [04_DATABASE.md](./04_DATABASE.md)

---
---

## 6. EMPLOYEE DOCUMENTS (FROM PROFILE)
**URL:** `/employees/:id/documents`

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Documents tab in employee profile | | |
| GET /api/v1/employees/:id/documents | | READ: employee_documents WHERE employee_id = ? AND deleted_at IS NULL |
| **Document list shows:** | | |
| Document type / Name / Uploaded date / Expiry / Status / Actions | | |
| Expiring soon: amber warning (30 days) | | |
| Expired: red badge | | |
| **Upload new document:** | | |
| Document type dropdown | | |
| Document name | | |
| File upload (PDF/JPG/PNG) | | |
| Expiry date (if applicable) | | |
| POST /api/v1/employees/:id/documents | Store file in MinIO | WRITE: employee_documents |
| **View document:** | | |
| Click view → GET signed URL | BE generates signed URL (1 hr) | READ: employee_documents.file_url |
| Opens in browser/new tab | | |
| **Delete document:** | | |
| Confirm dialog | | |
| DELETE /api/v1/employees/:id/documents/:docId | Soft delete only | WRITE: employee_documents.deleted_at |
| | Write audit log | WRITE: audit_logs |
| **Document expiry alerts:** | | |
| BullMQ job runs daily | | READ: employee_documents WHERE expiry_date = today + 30 |
| Send alert to HR + employee | | |

---
---

## 7. EMPLOYEE EXIT / SEPARATION
**URL:** `/employees/:id/exit`

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| "Initiate Exit" button on employee profile | | |
| **Exit form:** | | |
| Separation type: Resignation / Termination / Retirement / Absconding | | |
| Last working date (date picker) | | |
| Notice period days (auto-filled from designation config) | | |
| Notice period served: Full / Short / Waived | | |
| Reason for leaving (text) | | |
| Exit interview: scheduled date | | |
| POST /api/v1/employees/:id/initiate-exit | | WRITE: employee_exits { status: initiated } |
| | Update employee status | WRITE: employees.status = notice |
| **Exit checklist (auto-generated):** | | |
| ☐ Assets returned | | READ: asset_allocations WHERE employee_id = ? |
| ☐ Pending leaves cleared | | READ: leave_balances |
| ☐ Handover document submitted | | |
| ☐ IT access revoked | | |
| ☐ Full & Final processed | | |
| HR marks each item complete | | WRITE: exit_checklist_items.completed = true |
| **On all items complete:** | | |
| | Update employee status | WRITE: employees.status = terminated |
| | Set date_of_leaving | WRITE: employees.date_of_leaving |
| | Disable user login | WRITE: users.is_active = false |
| | Write audit log | WRITE: audit_logs |
| Generate experience letter button | POST /api/v1/employees/:id/experience-letter | |
| Generate relieving letter button | POST /api/v1/employees/:id/relieving-letter | |

---
---

## 8. EMPLOYEE TRANSFER / PROMOTION
**URL:** `/employees/:id/transfer`

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| "Transfer / Promote" button on employee profile | | |
| **Transfer form:** | | |
| Type: Transfer / Promotion / Both | | |
| **If Transfer:** | | |
| New Department (dropdown) | | READ: departments |
| New Branch (dropdown) | | READ: branches |
| New Reporting Manager (employee search) | | READ: employees |
| Effective date | | |
| Reason | | |
| **If Promotion:** | | |
| New Designation (dropdown) | | READ: designations |
| New Grade/Level | | |
| Salary revision: Yes/No | | |
| If yes → new CTC input | | |
| Effective date | | |
| POST /api/v1/employees/:id/transfer | | |
| | Create transfer record | WRITE: employee_transfers { from_dept, to_dept, from_designation, to_designation, effective_date, type } |
| | Update employee record | WRITE: employees { department_id, designation_id, branch_id, reporting_to } |
| | If salary revision: create new salary record | WRITE: employee_salaries (new row, close old) |
| | Write audit log (old vs new values) | WRITE: audit_logs |
| | Send notification to employee | |
| Generate transfer letter button | POST /api/v1/employees/:id/transfer-letter | |
| Promotion letter if promotion | Post /api/v1/employees/:id/promotion-letter | |
| **Transfer history in profile timeline** | GET /api/v1/employees/:id/history | READ: employee_transfers ORDER BY effective_date |
