# 05 — DATA FLOW
> Part of HRMS Blueprint | [← Back to Index](./00_INDEX.md)
> Last Updated: June 2026 | Status: Live

---

## 🔄 Core Data Flows

---

### 1. New Client Onboarding Flow
```
Client visits your website
        ↓
Fills registration form (company name, email, domain)
        ↓
Selects plan → Pays via Razorpay/PhonePe
        ↓
Central DB: tenant created + subscription created + invoice generated
        ↓
System creates client's own database (fresh schema)
        ↓
Licence key generated → emailed to client
        ↓
Client accesses their domain → First time setup wizard
        ↓
Sets: company info, DB mode (local/cloud/hybrid), branding
        ↓
First admin user created → Client ready to use
```

---

### 2. Employee Onboarding Flow
```
HR fills new employee form
        ↓
Validation (mandatory fields, duplicate check)
        ↓
employees table → row created
        ↓
users table → login account created (if needed)
        ↓
leave_balances → initial balance created for all active leave types
        ↓
employee_salaries → salary structure assigned
        ↓
Welcome email/WhatsApp sent to employee
        ↓
Document checklist assigned (pending uploads)
```

---

### 3. Daily Attendance Flow
```
Employee marks attendance (web/mobile/biometric)
        ↓
attendance table → check_in recorded
        ↓
End of day → check_out recorded
        ↓
working_hours calculated (check_out - check_in)
        ↓
overtime_hours calculated if beyond shift hours
        ↓
late_arrival / early_departure flagged
        ↓
If absent → status = absent (payroll will apply LOP)
        ↓
Monthly payroll reads attendance → calculates LOP days
```

---

### 4. Leave Application Flow
```
Employee applies leave
        ↓
leave_applications → row created (status: pending)
        ↓
leave_balances checked → sufficient balance?
   No → Rejected automatically with reason
   Yes → Continue
        ↓
Manager notified (email/WhatsApp/in-app)
        ↓
Manager approves/rejects
        ↓
If approved:
   leave_applications → status: approved
   leave_balances → pending increased
   attendance → those dates marked as on_leave
        ↓
If rejected:
   leave_applications → status: rejected
   Employee notified with reason
```

---

### 5. Monthly Payroll Flow
```
HR clicks "Run Payroll" for Month/Year
        ↓
payroll_runs → row created (status: processing)
        ↓
For each active employee:
   1. Fetch employee_salaries (current)
   2. Fetch attendance for the month
   3. Calculate present_days, lop_days
   4. Calculate gross = (basic+hra+da+ta+allowances) × (present/working_days)
   5. Calculate PF = 12% of basic (employee + employer)
   6. Calculate ESI = 0.75% employee, 3.25% employer (if applicable)
   7. Calculate PT = as per state slab
   8. Calculate TDS = as per declaration
   9. Calculate LWF = as per state
   10. Net = Gross - all deductions
        ↓
payslips → row created per employee
        ↓
payroll_runs → status: processed, totals updated
        ↓
HR reviews → clicks "Lock Payroll"
        ↓
payroll_runs → status: locked (no more edits)
        ↓
Bank file generated (NEFT format)
        ↓
Payslips published → employees notified
```

---

### 6. Aadhaar Verification Flow (Central Library)
```
HR enters Aadhaar number for employee
        ↓
System checks central_gst_records table
   Found + valid? → Return cached data instantly
   Not found / expired? → Continue
        ↓
Browser automation (Playwright) opens Aadhaar portal
        ↓
Enters Aadhaar number → OTP sent to employee phone
        ↓
Employee enters OTP in HRMS
        ↓
Playwright submits OTP → Downloads offline XML
        ↓
XML parsed → employee data extracted
        ↓
Data saved to:
   employees table (this client)
   central_gst_records table (shared KYC/GST cache — all tenants)
        ↓
Other clients needing same Aadhaar:
   → Fetch from central_gst_records
   → No need to verify again (with proper auth)
```

---

### 7. GST Verification Flow
```
User enters GST number
        ↓
Check central_gst_records (keyed by gstin)
   Found + not expired? → Return instantly ✅
   Not found → Continue
        ↓
Playwright opens GST Search portal
        ↓
Enters GST number → Scrapes company details
        ↓
Data saved to central_gst_records
        ↓
Returned to user → Auto-fills company form fields
```

---

### 8. Subscription Check Flow (Licence)
```
App starts OR every 24 hours:
        ↓
App sends: { licenceKey, domain, deviceFingerprint }
        ↓
Your central server checks:
   → tenants.plan_expires_at: expired?
   → tenants { plan, plan_expires_at, is_active, suspended_at }
        ↓
Response:
   active    → app runs normally
   expired   → read-only mode + renewal prompt
   grace     → warning banner shown
   suspended → login blocked, contact shown
        ↓
For one_time purchase:
   → No update access
   → App runs with current version forever
For subscription:
   → Auto checks for updates
   → Downloads and installs silently
```

---

### 9. Sync Flow (Local ↔ Cloud)
```
Mode: local-primary
        ↓
All reads/writes → Local DB (fast, offline capable)
        ↓
Every 5 minutes (configurable):
   → Get all changes since last sync
   → Push to Cloud DB
   → Confirm sync
        ↓
If internet down:
   → Queue changes locally
   → Sync when internet restored
        ↓
Conflict (same record changed in both):
   → Primary DB wins (local in this mode)
   → Conflict logged in audit_logs
```

---

### 10. Report Generation Flow
```
User selects report + filters + format (PDF/Excel/CSV)
        ↓
Backend fetches data from DB with filters
        ↓
If PDF → pdfkit generates styled PDF
If Excel → SheetJS generates .xlsx
If CSV → plain CSV generated
        ↓
File saved to MinIO temporarily
        ↓
Signed URL generated (expires in 1 hour)
        ↓
User downloads file
        ↓
Scheduled report? → BullMQ job sends email with attachment
```

---

## 🔗 Module Dependency Chain

```
employees                     ← MUST exist first
    ↓
attendance + leave            ← Needs employee
    ↓
payroll                       ← Needs attendance + leave
    ↓
compliance (PF/ESI/PT/TDS)   ← Needs payroll
    ↓
accounting + GST              ← Needs compliance data
    ↓
reports                       ← Needs all above
    ↓
recruitment                   ← Independent (creates employees)
performance                   ← Needs employees
training                      ← Needs employees
assets                        ← Needs employees
expenses                      ← Needs employees + payroll
automation                    ← Independent (reads/writes all)
```

---

## 🔗 Related Documents
- Database tables → [04_DATABASE.md](./04_DATABASE.md)
- Backend services → [03_BACKEND.md](./03_BACKEND.md)
- Module features → [06_MODULES.md](./06_MODULES.md)

---

## 🏢 MULTI-TENANT DB CONNECTION FLOW (Actual — from tenant.js)

```
Request arrives → tenant.js middleware runs:

1. Extract tenant identifier:
   header x-tenant-subdomain   OR
   request hostname (subdomain strip)

2. Query Central DB (centralPrisma):
   SELECT * FROM tenants WHERE subdomain = ?
   → Returns: tenant record with db_mode, db_url, schema_name, etc.

3. Build connection string based on db_mode:
   cloud:          CENTRAL tenant db_url (Supabase, schema-isolated if schema_name set)
   external_cloud: tenant.db_url (encrypted, decrypt first)
   local:          Build from local_db_host, local_db_port, local_db_name, etc.
   hybrid:         Try local first → fallback to cloud

4. Create PrismaClient for tenant:
   new PrismaClient({ datasources: { db: { url: resolved_url } } })
   → Attached as req.db

5. Attach req.tenant = { id, subdomain, name, plan, is_active, ... }

6. Route handler uses req.db for all queries — never touches another tenant's DB
```

### DEV Mode (Environment Variables)
```
If DEV_TENANT_DATABASE_URL is set → skip steps 1–4
→ req.db = PrismaClient({ url: DEV_TENANT_DATABASE_URL })
→ req.tenant resolved by DEV_TENANT_ID from Central DB
```

---

## 💰 BILLING DATA FLOW (billing.cron.js + payment webhooks)

```
Monthly Cron (1st of each month, node-cron):
1. Query all active tenants from Central DB
2. For each tenant:
   a. Load tenant_pricing_configs (custom pricing or defaults)
   b. Count active employees from Tenant DB → check vs cap
   c. Compute overage fees via subscriptionCalculator.js
   d. Generate invoice → INSERT: invoices (status: unpaid)
   e. Send billing email via billingEmailer.js
   f. If auto-pay configured → initiate Razorpay order

Payment Webhook (Razorpay / PhonePe / JioPay):
1. Verify webhook signature
2. Match payment to invoice by payment_id
3. UPDATE invoices SET status = 'paid', payment_id = ?
4. UPDATE tenants SET plan_expires_at = next_period
5. Restore access if was suspended
6. Send payment receipt email
```

