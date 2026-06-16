# 20 — SAAS ADMIN, COMMUNICATION, ACCOUNTING & ERROR HANDLING FLOWS
> Part of HRMS Blueprint | [← Back to Index](./00_INDEX.md)
> Format: FE = Frontend | BE = Backend | DB = Database
> Last Updated: June 2026

---

## ⚡ ACTUAL API ENDPOINTS

```
# Platform/Tenant management
ALL /api/v1/platform/...              → Tenant setup, branding, lookup
ALL /api/v1/platform/admin/...        → Platform owner admin (requires is_platform_admin)
ALL /api/v1/platform/subscribe/...    → Subscription management + pricing calculator

# Payments
POST /api/v1/platform/payment/razorpay/webhook
POST /api/v1/platform/payment/phonepe/webhook
POST /api/v1/platform/payment/jiopay/webhook

# Brand / White Label
GET/PUT /api/v1/platform/brand        → White-label branding config
```

## ⚡ KEY IMPLEMENTATION FACTS

```
Platform admin:     is_platform_admin sourced from central_user_index — verified at auth middleware
Pricing calc:       subscriptionCalculator.js → uses tenant_pricing_configs + modulePricing.js
Billing cron:       billing.cron.js (node-cron) — started at server startup
Payment gateways:   Razorpay (primary), PhonePe (secondary), JioPay (tertiary)
Central DB tables:  tenants, tenant_modules, tenant_pricing_configs, invoices
```

---

## SECTIONS IN THIS DOCUMENT
```
A. SaaS Admin Panel (Your Central Dashboard)
B. Communication & Announcement Flows
C. Accounting Export Flows
D. Error Handling & Fallback Flows
```

---
---

# SECTION A — SAAS ADMIN PANEL (YOUR SIDE)
**URL:** `admin.yourproduct.com`
**Access:** Your team only — completely separate from client app

---

## A1. Admin Dashboard

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| GET /api/v1/platform/admin/dashboard | | |
| **Business metrics:** | | |
| Total clients / Active / Trial / Suspended / Cancelled | | READ: tenants |
| Monthly Recurring Revenue (MRR) | | READ: tenants (plan field) JOIN plans |
| Annual Recurring Revenue (ARR) | | |
| Revenue this month vs last month | | READ: invoices |
| New signups this month | | READ: tenants.created_at |
| Churn this month | | READ: tenants (plan field) WHERE status = cancelled |
| **Alerts panel:** | | |
| Clients expiring in 7 days | | READ: tenants (plan field) WHERE end_date <= today+7 |
| Clients in grace period | | READ: tenants (plan field) WHERE status = grace |
| Suspended clients | | READ: tenants WHERE is_active = false |
| Failed payments | | READ: invoices WHERE status = failed |
| **Central library stats:** | | |
| Total Aadhaar verifications saved | | READ: central_gst_records + central_kyc_records WHERE data_type = aadhaar |
| Total GST lookups cached | | READ: central_gst_records + central_kyc_records WHERE data_type = gst |
| Automation runs today | | READ: automation_logs WHERE date = today |

---

## A2. Client Management

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| List all clients | GET /api/v1/platform/admin/tenants | READ: tenants JOIN tenant_pricing_configs |
| Filters: Active / Trial / Suspended / Expired / All | | |
| Search by company name / domain / email | | |
| **Per client row:** | | |
| Company / Domain / Plan / Employees / Status / Renewal | | |
| **Client detail view:** | | |
| Company info + subscription history | | READ: tenants, subscriptions |
| Invoice history with download | | READ: invoices |
| Module usage | | READ: tenant_modules |
| Login activity | | READ: audit_logs |
| **Admin actions:** | | |
| Extend subscription | PUT /api/v1/platform/admin/tenants/:id/extend | WRITE: tenants (plan, plan_expires_at).end_date |
| Upgrade/downgrade plan | PUT /api/v1/platform/admin/tenants/:id/plan | WRITE: tenants (plan, plan_expires_at).plan_id |
| Add free trial days | | WRITE: tenants (plan, plan_expires_at).end_date |
| Suspend | PUT /api/v1/platform/admin/tenants/:id/suspend | WRITE: tenants.is_active = false |
| Reactivate | PUT /api/v1/platform/admin/tenants/:id/activate | WRITE: tenants.is_active = true |
| Send message to client | | |
| Reset admin password (override) | | WRITE: password_resets |

---

## A3. Revenue & Invoices

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Revenue dashboard with monthly chart | GET /api/v1/platform/admin/revenue | READ: invoices |
| Plan-wise revenue breakdown | | |
| All invoices list | | READ: invoices JOIN tenants |
| Filter: paid / pending / failed | | |
| Download any invoice PDF | | READ: invoices.pdf_url |
| **Your GST report:** | | |
| GSTR-1 data export for your own GST filing | | READ: invoices.gst_amount, tenant GSTIN |
| Export to your accounting software | | |

---

## A4. Plan & Pricing Management

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| List all plans | GET /api/v1/platform/admin/plans | READ: tenant_pricing_configs |
| **Edit plan (fully configurable):** | | |
| Name, description | | |
| Monthly price (paise) | | |
| Module toggles (which modules included) | | |
| Max employees: 0 = unlimited | | |
| Visible to clients: Yes/No | | |
| Save → PUT /api/v1/platform/admin/plans/:id | | WRITE: tenant_pricing_configs |
| **Discount configuration:** | | |
| Set discount tiers per duration | | WRITE: discount_tiers |
| Create promo codes with expiry + usage limits | | WRITE: tenant_pricing_configs (offer_flat_paise, offer_expiry_date) |

---

## A5. Product Settings

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| **Product Identity (configurable):** | | |
| Product name (used everywhere) | | |
| Default logo upload | | |
| Support email / WhatsApp / Phone | | |
| **Your company info (for invoices to clients):** | | |
| Legal name, GSTIN, PAN, address | | |
| Bank details shown on invoice | | |
| Invoice prefix + starting number | | |
| GST rate (18%) | | |
| **Update distribution:** | | |
| Current version number | | |
| Upload new update package | | |
| Release notes input | | |
| Force update toggle: Yes/No | | |
| Rollout target: All / Specific clients / % rollout | | |
| Save → PUT /api/v1/platform/admin/config | | WRITE: platform_settings |

---

## A6. Central Library Management

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| List all entries | GET /api/v1/platform/admin/central-library | READ: central_gst_records + central_kyc_records |
| Filter by type: Aadhaar / GST / PAN / IFSC | | |
| **Per entry:** | | |
| Type / Identifier (masked) / Verified date / Access count | | |
| Valid / Invalid status | | |
| Mark invalid if data outdated | PUT /api/v1/platform/admin/central-library/:id/invalidate | WRITE: central_gst_records.is_valid = false |
| Delete stale entries | PUT /api/v1/platform/admin/central-library/:id/delete | WRITE: central_gst_records.deleted_at |

---
---

# SECTION B — COMMUNICATION & ANNOUNCEMENT FLOWS
**URL:** `/communication`

---

## B1. Company Announcements

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| **Create Announcement:** | | |
| Title | | |
| Body (rich text) | | |
| Attachment upload (optional) | POST /api/v1/communication/upload | WRITE: MinIO |
| Audience: All / Department / Branch / Designation | | |
| Priority: Normal / Important / Urgent | | |
| Pin to dashboard: Yes/No | | |
| Expiry date (auto-hide after this date) | | |
| Notify via: ☑ Email ☑ WhatsApp ☑ In-App | | |
| POST /api/v1/communication/announcements | | WRITE: announcements |
| | Queue notifications per audience selection | |
| | Send email/WhatsApp in batches | |
| **Employee view:** | | |
| Pinned announcements on dashboard | GET /api/v1/communication/announcements | READ: announcements WHERE pinned = true AND (expiry IS NULL OR expiry > today) |
| Unread count badge in nav | | READ: COUNT where not in announcement_reads |
| Mark as read | PUT /api/v1/communication/announcements/:id/read | WRITE: announcement_reads { user_id, announcement_id, read_at } |

---

## B2. Birthday & Anniversary Auto-Notifications

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| **BullMQ job runs daily at 8 AM IST:** | | |
| | Find birthdays today | READ: employees WHERE EXTRACT(MONTH, dob) = today_month AND EXTRACT(DAY, dob) = today_day |
| | Find work anniversaries today | READ: employees WHERE EXTRACT(MONTH, date_of_joining) = today_month AND EXTRACT(DAY, date_of_joining) = today_day |
| | Send WhatsApp/email wishes per config | |
| | Post auto-announcement on feed | WRITE: announcements (auto, type: birthday/anniversary) |
| **Dashboard widgets:** | | |
| Today's Birthdays section | | READ: employees birthday today |
| Work Anniversaries section | | READ: employees joining anniversary today |
| Upcoming in next 7 days | | |

---

## B3. Survey Builder

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| **Create survey:** | | |
| Survey title + description | | |
| Anonymous responses: Yes/No | | |
| Audience selection | | |
| Deadline date | | |
| **Questions (unlimited):** | | |
| Question text | | |
| Type: Multiple choice / Rating 1-5 / Text / Yes/No | | |
| Required: Yes/No | | |
| POST /api/v1/communication/surveys | | WRITE: surveys, survey_questions |
| Notify employees via email/WhatsApp | | |
| **Employee fills survey:** | | |
| Shows all questions one page | | READ: survey_questions |
| POST /api/v1/communication/surveys/:id/respond | | WRITE: survey_responses |
| **Results view (HR):** | | |
| Response rate: X of Y responded | | READ: survey_responses COUNT |
| Per question: chart of answers | | |
| Individual responses (if not anonymous) | | |
| Export to Excel | | |

---
---

# SECTION C — ACCOUNTING EXPORT FLOWS
**URL:** `/accounting`

---

## C1. Payroll Journal Entry Export

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Select month + year | | |
| Select export format: Tally / Zoho Books / QuickBooks / Generic | | |
| POST /api/v1/accounting/export/payroll | | |
| | Verify payroll locked for month | READ: payroll_runs.status = locked |
| | Fetch payroll totals | READ: payroll_runs, payslips |
| | **Generate journal entries:** | |
| | DR Salary Expense = total gross | |
| | CR Salary Payable = total net | |
| | CR PF Payable = employee PF + employer PF | |
| | CR ESI Payable = employee ESI + employer ESI | |
| | CR PT Payable = total PT | |
| | CR TDS Payable = total TDS | |
| | CR LWF Payable = total LWF | |
| | Format per selected software | |
| | Store temp in MinIO | WRITE: temp_exports |
| | Return signed download URL | |
| Download file | | |

---

## C2. Invoice Accounting Export

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Date range selector | | |
| Export format selector | | |
| POST /api/v1/accounting/export/invoices | | READ: invoices WHERE status = paid AND date IN range |
| | **Generate journal entries:** | |
| | Sales entries: | |
| | DR Accounts Receivable = total amount | |
| | CR Revenue = amount before GST | |
| | CR CGST Payable = CGST | |
| | CR SGST Payable = SGST | |
| | Payment received entries: | |
| | DR Bank = total amount | |
| | CR Accounts Receivable = total amount | |
| | Format and export | |
| Download | | |

---

## C3. Integration Configuration

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| URL: /settings/integrations/accounting | | |
| Select software from list | | |
| **Account mapping table:** | | |
| System category → Their account name/code | | |
| e.g. "Salary Expense" → "6200 - Salaries" | | |
| Add/edit mappings (unlimited rows) | | |
| Auto-export: Manual / Monthly scheduled | | |
| Save → PUT /api/v1/settings/integrations/accounting | | WRITE: accounting_integrations |

---
---

# SECTION D — ERROR HANDLING & FALLBACK FLOWS

---

## D1. Payment Failure During Client Signup

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Payment modal shows failure message | | |
| | Gateway returns failure code | |
| | Update invoice status | WRITE: invoices.status = failed |
| | Tenant stays pending — NOT activated | WRITE: tenants.status = pending_payment |
| Show: "Payment failed — [gateway reason]" | | |
| Options: Retry / Try different method / Contact support | | |
| **On successful retry:** | | |
| | Webhook confirms payment success | |
| | Activate tenant (same flow as new signup) | WRITE: tenants.status = active |

---

## D2. Database Connection Failure

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| API returns ERR_DB_CONNECTION | | |
| **If hybrid mode (local + cloud):** | | |
| | Detect local DB down | |
| | Auto-switch reads/writes to cloud DB | |
| | Log failover event | WRITE: system_logs |
| | Notify HR Admin | |
| Yellow banner: "Running on backup database" | | |
| **If single mode (local only):** | | |
| Red banner: "Database unavailable. Check connection" | | |
| Retry connection button | | |
| **On recovery:** | | |
| | Local DB comes back online | |
| | Sync all changes made during downtime | WRITE: sync all pending changes |
| | Switch back to primary DB | |
| | Log recovery | WRITE: system_logs |
| Banner auto-dismisses | | |

---

## D3. Automation Crash or Timeout

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| | Playwright crashes / portal timeout | |
| | Catch error at every step | |
| | Screenshot at point of failure | WRITE: automation_screenshots |
| | Auto-retry: 3 attempts, 30 second gap | |
| | After 3 failures: mark task failed | WRITE: automation_tasks.status = failed |
| | Log full error details | WRITE: automation_logs.error_message |
| | Notify HR | |
| Automation log shows: Failed + reason | | |
| Screenshot viewable for debugging | | |
| Manual retry button available | | |

---

## D4. Subscription Expiry Flow

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| **7 days before expiry — BullMQ daily job:** | | |
| | Find subscriptions expiring in 7 days | READ: tenants (plan field) WHERE end_date = today + 7 |
| | Send renewal reminder: email + WhatsApp | |
| Dismissible yellow banner in app | | |
| **1 day before expiry:** | | |
| | Send urgent reminder | |
| Non-dismissible red banner | | |
| **On expiry day:** | | |
| | Set to grace period | WRITE: tenants (plan, plan_expires_at).status = grace |
| | grace_until = end_date + 15 days | WRITE: tenants (plan, plan_expires_at).grace_until |
| App still works but read-only | | |
| Cannot create any new records | | |
| "Renew now" button prominent | | |
| **After 15 day grace period:** | | |
| | Set tenant inactive | WRITE: tenants.is_active = false |
| Login blocked: ERR_ACCOUNT_SUSPENDED | | |
| "Account suspended — contact support" shown | | |
| **On renewal payment confirmed:** | | |
| | Reactivate subscription immediately | WRITE: tenants (plan, plan_expires_at).status = active |
| | Restore full access | |

---

## D5. Sync Conflict Resolution

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| No UI — background auto-handled | | |
| | During sync: same record changed in both DBs | |
| | Compare updated_at timestamps | |
| | Primary DB version always wins — no exceptions | |
| | Overwrite secondary with primary data | WRITE: secondary DB |
| | Log conflict details | WRITE: sync_conflict_logs { record_id, table, primary_value, secondary_value, resolved_at } |
| HR can view conflict log | GET /api/v1/settings/sync-conflicts | READ: sync_conflict_logs |
| Shows exactly what was overwritten | | |

---

## D6. File Upload Failure

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Upload progress bar shown | | |
| **File too large (FE check):** | | |
| Validate size before upload starts | | |
| Show: "File exceeds [X]MB limit" | | |
| **Wrong file type (FE check):** | | |
| Validate type before upload | | |
| Show: "Only PDF, JPG, PNG allowed" | | |
| **MinIO unavailable:** | | |
| | Storage error caught | |
| | Return ERR_STORAGE_UNAVAILABLE | |
| Show: "Upload failed. Please try again" | | |
| Retry button | | |
| **Connection cut during upload:** | | |
| | MinIO multipart upload handles resume | |
| | Incomplete uploads auto-cleaned after 24 hours | WRITE: MinIO lifecycle policy |

---

## DB TABLES — ALL SECTIONS

```
SAAS ADMIN:
platform_settings → product name, logo, support contacts (JSON values store)
plans                   → subscription plans (fully configurable)
discount_tiers          → duration-based discount rules
tenant_pricing_configs (offer_flat_paise, offer_expiry_date) → promotional discounts
system_logs             → failover, recovery, system events

COMMUNICATION:
announcements           → company announcements
announcement_reads      → who read what
surveys                 → survey definitions
survey_questions        → questions per survey
survey_responses        → employee answers

ACCOUNTING:
accounting_integrations → software config + account mappings
temp_exports            → temporary generated export files

ERROR HANDLING:
sync_conflict_logs      → sync conflict records
system_logs             → DB failover, recovery events
```

---

## 🔗 Related Documents
- Auth flows → [09_AUTH_FLOWS.md](./09_AUTH_FLOWS.md)
- Onboarding flows → [10_ONBOARDING_FLOWS.md](./10_ONBOARDING_FLOWS.md)
- Automation flows → [18_AUTOMATION_FLOWS.md](./18_AUTOMATION_FLOWS.md)
- Payroll flows → [15_PAYROLL_FLOWS.md](./15_PAYROLL_FLOWS.md)
- Frozen decisions → [07_FROZEN_DECISIONS.md](./07_FROZEN_DECISIONS.md)
