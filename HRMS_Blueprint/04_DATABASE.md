# 04 — DATABASE SCHEMA
> Part of HRMS Blueprint | [← Back to Index](./00_INDEX.md)
> Last Updated: June 2026 | Status: Actual schemas from codebase

---

## 🗄️ Database Strategy (FROZEN)

```
ORM:              Prisma (two separate schema files)
Supported DBs:    PostgreSQL (default) | MySQL | MSSQL | SQLite
Central DB:       PostgreSQL — platform-level: tenants, billing, shared KYC/GST cache
Tenant DBs:       Each client has own separate database (or schema)
```

---

## 🏢 CENTRAL DATABASE (Actual — from `prisma/central.prisma`)

> Client: `shared/generated/central-client/` (separate from default `@prisma/client`)
> Connected via: `CENTRAL_DATABASE_URL`

### tenants
```
id                    UUID        PK (gen_random_uuid)
name                  VARCHAR     NOT NULL — display name
legal_name            VARCHAR?
subdomain             VARCHAR     UNIQUE — e.g. "pcepl"
custom_domain         VARCHAR?    UNIQUE — e.g. "hr.company.com"
logo_url              VARCHAR?
primary_color         VARCHAR     DEFAULT "#2563eb"
background_color      VARCHAR     DEFAULT "#f8fafc"
background_url        VARCHAR?
sitemap_url           VARCHAR?
plan                  VARCHAR     DEFAULT "free"
plan_expires_at       TIMESTAMPTZ?
max_employees         INT         DEFAULT 50
db_mode               VARCHAR     DEFAULT "cloud"
                                  (cloud | external_cloud | local | hybrid)
db_url                VARCHAR?    Encrypted connection string
schema_name           VARCHAR?    For schema-isolated tenants
local_db_type         VARCHAR?    postgres | mysql | mssql | sqlite
local_db_host         VARCHAR?    Encrypted
local_db_port         INT         DEFAULT 5432
local_db_name         VARCHAR?
local_db_user         VARCHAR?    Encrypted
local_db_pass         VARCHAR?    Encrypted
sync_interval_min     INT         DEFAULT 60
gstin                 VARCHAR?
pan                   VARCHAR?
city                  VARCHAR?
state                 VARCHAR?
address               VARCHAR?
pincode               VARCHAR?
gst_status            VARCHAR?
gst_reg_date          VARCHAR?
taxpayer_type         VARCHAR?
constitution          VARCHAR?
e_invoice_enabled     BOOLEAN     DEFAULT false
business_nature       JSON        DEFAULT []
admin_name            VARCHAR?
admin_email           VARCHAR?
admin_phone           VARCHAR?
is_active             BOOLEAN     DEFAULT true
is_setup_complete     BOOLEAN     DEFAULT false
suspended_at          TIMESTAMPTZ?
suspension_reason     VARCHAR?
payout_config_enc     VARCHAR?    Encrypted payout config
created_at            TIMESTAMPTZ DEFAULT now()
updated_at            TIMESTAMPTZ DEFAULT now()
deleted_at            TIMESTAMPTZ?                soft delete
```

### tenant_modules
```
id                    UUID        PK
tenant_id             UUID        FK → tenants.id CASCADE DELETE
module_name           VARCHAR     e.g. "payroll", "recruitment"
is_active             BOOLEAN     DEFAULT true
custom_price_paise    INT?        Override default module price
enabled_at            TIMESTAMPTZ DEFAULT now()
disabled_at           TIMESTAMPTZ?

UNIQUE (tenant_id, module_name)
INDEX  (tenant_id)
```

### central_user_index
```
id                    UUID        PK
email                 VARCHAR     NOT NULL
subdomain             VARCHAR     NOT NULL
company_id            UUID        FK → tenants.id CASCADE DELETE
user_id               UUID?       UUID of user in tenant DB
is_platform_admin     BOOLEAN     DEFAULT false
is_active             BOOLEAN     DEFAULT true
created_at            TIMESTAMPTZ DEFAULT now()
updated_at            TIMESTAMPTZ DEFAULT now()

UNIQUE (email, company_id)
INDEX  (email), INDEX (company_id), INDEX (subdomain)
```

> Used by auth lookup: given email → find tenant + subdomain for login routing.

### tenant_branch_links
```
id                    UUID        PK
tenant_id             UUID        FK → tenants.id CASCADE DELETE
gstin                 VARCHAR     UNIQUE — branch GSTIN
pan                   VARCHAR
branch_name           VARCHAR?
branch_no             VARCHAR?
address               VARCHAR?
city                  VARCHAR?
state                 VARCHAR?
pincode               VARCHAR?
status                VARCHAR     DEFAULT "pending" (pending | approved | rejected)
requested_at          TIMESTAMPTZ DEFAULT now()
approved_at           TIMESTAMPTZ?
note                  VARCHAR?

INDEX (tenant_id)
```

### central_kyc_records (Shared KYC Cache)
```
id                    UUID        PK
aadhaar_hash          VARCHAR     UNIQUE — SHA-256 hash of Aadhaar number
method                VARCHAR     DEFAULT "otp_based"
kyc_timestamp         TIMESTAMPTZ?
name                  VARCHAR?
dob                   VARCHAR?
gender                VARCHAR?
careof                VARCHAR?
mobile_encrypted      VARCHAR?    AES-256 encrypted
email_encrypted       VARCHAR?    AES-256 encrypted
house / street / loc / vtc / po / subdist / dist / state / country / pc / pht
                                  — address fields from Aadhaar XML
task_id               VARCHAR?    BullMQ job ID
created_at            TIMESTAMPTZ DEFAULT now()

INDEX (aadhaar_hash)
```

> First client to run KYC pays compute. All subsequent lookups by hash = free.

### central_gst_records (Shared GST Lookup Cache)
```
id                    UUID        PK
gstin                 VARCHAR     UNIQUE
pan / company_name / legal_name / trade_name / state / state_code
gst_status / gst_reg_date / taxpayer_type / constitution
business_nature       JSON        DEFAULT []
dealing_in            JSON        DEFAULT []
address / city / pincode / location / district / branch_no / branch_name
flat_no / street / centre_jurisdiction / centre_code / state_jurisdiction
cancellation_date     VARCHAR?
data_source           VARCHAR?
raw                   JSON?       Full API response stored
created_at            TIMESTAMPTZ DEFAULT now()

INDEX (gstin)
```

### platform_settings
```
id                    VARCHAR     PK (singleton key e.g. "global")
values                JSON        DEFAULT {}
updated_at            TIMESTAMPTZ DEFAULT now()
```

### tenant_pricing_configs
```
id                          UUID        PK
tenant_id                   UUID        UNIQUE FK → tenants.id CASCADE DELETE
base_price_paise            INT         DEFAULT 149900 (₹1,499)
employee_cap                INT         DEFAULT 25
per_employee_excess_paise   INT         DEFAULT 5000 (₹50)
discount_base_pct           DECIMAL(5,2) DEFAULT 0.00
discount_module_pct         JSON        DEFAULT {} — per module overrides
discount_bundle_pct         DECIMAL(5,2) DEFAULT 0.00
bundle_trigger_count        INT         DEFAULT 3
discount_tenure_pct         DECIMAL(5,2) DEFAULT 0.00
tenure_months               INT         DEFAULT 1
offer_flat_paise            INT         DEFAULT 0
offer_expiry_date           TIMESTAMPTZ?
is_stackable                BOOLEAN     DEFAULT false
final_override_paise        INT?        Complete price override
billing_cycle               VARCHAR     DEFAULT "monthly"
updated_at                  TIMESTAMPTZ DEFAULT now()

INDEX (tenant_id)
```

### invoices
```
id                    UUID        PK
tenant_id             UUID        FK → tenants.id CASCADE DELETE
invoice_no            VARCHAR     UNIQUE — auto generated
period_start          DATE
period_end            DATE
issue_date            TIMESTAMPTZ DEFAULT now()
due_date              TIMESTAMPTZ
base_amount_paise     INT
module_amount_paise   INT
excess_amount_paise   INT         Employee overage fees
discount_amount_paise INT
tax_amount_paise      INT         DEFAULT 0 (GST)
total_paise           INT
currency              VARCHAR     DEFAULT "INR"
status                VARCHAR     DEFAULT "unpaid" (unpaid | paid | overdue | void)
breakdown             JSON?       Detailed line items
pdf_url               VARCHAR?
payment_id            VARCHAR?    Gateway payment ID
created_at            TIMESTAMPTZ DEFAULT now()
updated_at            TIMESTAMPTZ DEFAULT now()

INDEX (tenant_id), INDEX (status)
```

---

## 🏭 TENANT DATABASE (Per Client — from `prisma/schema.prisma`)

> Connected via: `DEV_TENANT_DATABASE_URL` (dev) or resolved in tenant middleware (prod)

### companies
```
id                    UUID        PK
name / legal_name / gstin / pan / cin / tan / address / city / state
pincode / country / phone / email / website / logo_url
epf_code / esic_code
lwf_applicable        BOOLEAN
pt_applicable         BOOLEAN
financial_year_start  INT         Month number (4 = April)
created_at / updated_at / deleted_at
```

### branches
```
id / company_id / name / address / city / state / pincode / phone
is_head_office / is_active / created_at / deleted_at
```

### departments
```
id / company_id / name / code / parent_id (self-ref) / head_employee_id
is_active / created_at / deleted_at
```

### designations
```
id / company_id / name / level / grade / is_active / created_at
```

### employees
```
id / company_id / branch_id / department_id / designation_id
reporting_to (self-ref) / employee_code (UNIQUE per company)
first_name / last_name / middle_name / date_of_birth / gender
blood_group / marital_status / nationality / religion / category
differently_abled / personal_email / official_email
phone_primary / phone_secondary
address_current / address_permanent
aadhar_number (AES-256 encrypted) / pan_number (AES-256 encrypted)
passport_number / passport_expiry
employment_type   full_time | part_time | contract | intern | consultant
status            active | probation | notice | terminated | absconding | retired
date_of_joining / probation_end_date / confirmation_date
date_of_leaving / leaving_reason / notice_period_days
profile_photo_url
created_at / updated_at / deleted_at
```

### employee_documents
```
id / employee_id / document_type / document_name / file_url
file_size / expiry_date / is_verified / uploaded_at / deleted_at
```

### users
```
id / employee_id (nullable) / company_id / email (UNIQUE)
password_hash / role_id / is_active / last_login_at
login_attempts / locked_until / two_fa_enabled / two_fa_secret
created_at / deleted_at
```

### roles
```
id / company_id / name / description / is_system
permissions   JSON  { module: { view, create, edit, delete } }
created_at
```

### shifts
```
id / company_id / name / start_time / end_time / late_grace_mins
half_day_start / half_day_end / week_off_days (JSON) / is_active / created_at
```

### attendance
```
id / employee_id / date / check_in / check_out
check_in_source   manual | biometric | mobile | web | qr
check_out_source  (same)
working_hours / overtime_hours
status            present | absent | half_day | holiday | week_off | on_leave
late_arrival / early_departure / regularized / regularized_by
notes / created_at / updated_at
```

### leave_types
```
id / company_id / name / code / accrual_type / accrual_days
max_balance / carry_forward / carry_forward_max / encashable / paid
requires_docs / min_days / max_days / gender_specific / is_active / created_at
```

### leave_balances
```
id / employee_id / leave_type_id / year
opening_balance / accrued / used / pending / closing_balance (computed)
updated_at
```

### leave_applications
```
id / employee_id / leave_type_id / from_date / to_date / days
half_day / half_day_part / reason / status (pending|approved|rejected|cancelled)
applied_at / approved_by / approved_at / rejection_reason / documents_url
```

### salary_structures
```
id / company_id / name / components (JSON) / is_active / created_at
```

### employee_salaries
```
id / employee_id / salary_structure_id / ctc / basic / hra / da / ta
special_allowance / other_allowances (JSON) / pf_applicable / esic_applicable
pt_applicable / tds_applicable / effective_from / effective_to / created_at
```

### payroll_runs
```
id / company_id / month / year
status            draft | processing | processed | locked
processed_by / processed_at / total_gross / total_deductions / total_net
locked_at / created_at
```

### payslips
```
id / payroll_run_id / employee_id / month / year
working_days / present_days / lop_days
gross_salary / total_deductions / net_salary (all paise)
pf_employee / pf_employer / esic_employee / esic_employer
pt_amount / tds_amount / lwf_amount / bonus
other_deductions (JSON) / other_earnings (JSON)
pdf_url / is_published / created_at
```

### compliance_submissions
```
id / company_id / type (pf_ecr|esic|pt|tds_form16) / period
month / year / status / submitted_by / submitted_at
ack_number / file_url / created_at
```

### password_resets
```
id / user_id / email / token (hashed) / expires_at / used_at / created_at
```

### otp_store
```
id / user_id / email / otp_hash / expires_at / attempts / created_at
```

### notification_log
```
id / user_id / type / title / body / url / is_read / created_at
```

### audit_logs
```
id / user_id / module / action (create|update|delete|view|login|logout|unmask)
entity_type / entity_id / old_values (JSON) / new_values (JSON)
ip_address / user_agent / created_at
```

---

## 🔗 Key Relationships Map

```
CENTRAL DB:
  tenants ─── tenant_modules           (1:many)
  tenants ─── central_user_index       (1:many)
  tenants ─── tenant_branch_links      (1:many)
  tenants ─── tenant_pricing_configs   (1:1)
  tenants ─── invoices                 (1:many)

TENANT DB:
  companies ─── branches / departments / designations / employees (1:many)
  employees ─── users (1:1)
  employees ─── attendance / leave_balances / leave_applications (1:many)
  employees ─── employee_salaries / payslips (1:many)
  payroll_runs ─── payslips (1:many)
  roles ─── users (1:many)
  departments ─── departments (self-ref hierarchy)
  employees ─── employees (self-ref reporting_to)
```

---

## 📋 Naming Conventions (FROZEN)

```
Tables:       snake_case, plural            employees, leave_types
Columns:      snake_case                    first_name, created_at
PKs:          id (UUID always, never INT)
FKs:          table_name_id                 employee_id, company_id
Timestamps:   created_at + updated_at on every table
Soft delete:  deleted_at (NULL = active, timestamp = deleted)
Money:        INT in paise ONLY — 149900 = ₹1,499.00
Dates:        DATE for date-only, TIMESTAMPTZ for date+time
Booleans:     is_active, is_verified, has_xxx prefix always
Encryption:   aadhar_number, pan_number, bank details, portal passwords → AES-256
```

---

## 🔗 Related Documents
- How data flows → [05_DATA_FLOW.md](./05_DATA_FLOW.md)
- Backend queries → [03_BACKEND.md](./03_BACKEND.md)
- Module features → [06_MODULES.md](./06_MODULES.md)

---

## 📋 COMPLETE TENANT DB TABLE INDEX (from `prisma/schema.prisma`)

> Full list of all 86 tables. See individual module flows (09–20) for column details.
> Tables marked `(add to schema)` in old docs **all exist** in the real schema.

### Foundation
```
companies               branches                departments
designations            roles                   users
employees               employee_addresses      employee_bank_accounts
employee_documents      employee_education      employee_family
employee_prev_employment employee_onboarding_draft
```

### Attendance & Leave
```
attendance              shifts                  employee_shifts
holidays                regularization_requests compoff_records
leave_types             leave_balances          leave_applications
leave_encashments
```

### Payroll & Compliance
```
salary_structures       employee_salaries       payroll_runs
payslips                payroll_bonuses         fnf_settlements
tds_declarations        pt_slabs                lwf_rules
compliance_filings      compliance_files
```

### Employee Lifecycle
```
employee_exits          exit_checklist_items    employee_transfers
```

### Recruitment
```
job_requisitions        job_postings            candidates
candidate_stage_history interviews              interview_feedback
offers
```

### Performance, Training, Assets, Expenses
```
appraisal_cycles        appraisals              performance_goals
trainings               training_nominations    training_attendance
training_feedback       training_certificates
assets                  asset_allocations
expense_claims          expense_items           expense_policies
```

### Communication
```
announcements           announcement_reads
surveys                 survey_questions        survey_responses
notification_config
```

### Automation
```
automation_tasks        automation_logs         automation_screenshots
automation_credentials  automation_schedules    portal_urls
```

### Auth & Security
```
password_resets         otp_store               token_blacklist
temp_auth_tokens        audit_logs
```

### System & Config
```
tenant_branding         tenant_db_config        backup_config
accounting_integrations system_logs             sync_conflict_logs
temp_exports
```

