# 11 — SYSTEM SETTINGS FLOWS
> Part of HRMS Blueprint | [← Back to Index](./00_INDEX.md)
> Format: FE = Frontend | BE = Backend | DB = Database
> Last Updated: June 2026

---

## PAGES IN THIS DOCUMENT
```
1. Settings Dashboard / Navigation
2. Company Information Settings
3. Roles & Permissions Builder
4. Module Enable/Disable
5. Approval Workflow Builder
6. Notification Templates & Rules
7. Custom Fields Builder
8. Integrations Configuration
9. Data Backup & Restore
10. Audit Log Viewer
11. Subscription & Billing (Client Side)
```

---
---

## 1. SETTINGS NAVIGATION
**URL:** `/settings`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Settings sidebar with sections | | |
| 🏢 Company | | |
| 🌿 Branches & Departments | | |
| 👥 Roles & Permissions | | |
| 🔧 Modules | | |
| 🔄 Workflows | | |
| 📧 Notifications | | |
| 📁 Custom Fields | | |
| 🔗 Integrations | | |
| 🗄️ Database Config | | |
| 💾 Backup & Restore | | |
| 📋 Audit Logs | | |
| 💳 Subscription | | |
| Access controlled by role permissions | | |
| Super Admin sees all sections | | |
| HR Admin may not see billing section | | |

---
---

## 2. COMPANY INFORMATION
**URL:** `/settings/company`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| GET /api/v1/settings/company | | READ: companies WHERE id = current_company |
| **Non-editable after verification:** | | |
| GSTIN (locked, shows verified badge) | | |
| PAN (locked) | | |
| CIN (locked) | | |
| **Editable fields:** | | |
| Company display name | | |
| Logo upload → preview | POST /api/v1/settings/upload-logo | WRITE: companies.logo_url (MinIO) |
| Address, city, state, pincode | | |
| Phone, email, website | | |
| EPF registration number | | |
| ESIC registration number | | |
| PT registration number | | |
| LWF registration number | | |
| **Financial Settings:** | | |
| Financial year start (April default) | | |
| Working days per month (calculated or fixed) | | |
| Overtime eligibility threshold (hours) | | |
| **Payslip Settings:** | | |
| Payslip password: DOB / PAN / Custom | | |
| Payslip template: select from available | | |
| Show/hide components on payslip | | |
| Save → PUT /api/v1/settings/company | | WRITE: companies |

---
---

## 3. ROLES & PERMISSIONS BUILDER
**URL:** `/settings/roles`

---

### Step 3.1 — Roles List

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| GET /api/v1/settings/roles | | READ: roles WHERE company_id = ? |
| Show all roles as cards | | |
| **Default system roles** (cannot delete): | | |
| Super Admin / HR Admin / HR Manager / Manager / Employee / Accountant | | |
| **Custom roles** (fully editable): | | |
| Create role / Edit / Clone / Delete | | |
| Employee count shown per role | | |

---

### Step 3.2 — Edit Role Permissions

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Click role → permissions editor opens | | |
| GET /api/v1/settings/roles/:id/permissions | | READ: roles.permissions JSON |
| **Permission matrix (module × action):** | | |

```
Module          | View | Create | Edit | Delete | Export | Approve
----------------|------|--------|------|--------|--------|--------
Employees       |  ✅  |   ✅  |  ✅  |   ❌  |   ✅  |   —
Attendance      |  ✅  |   ✅  |  ✅  |   ❌  |   ✅  |   ✅
Leave           |  ✅  |   —   |  —   |   —   |   ✅  |   ✅
Payroll         |  ✅  |   ✅  |  ✅  |   ❌  |   ✅  |   ✅
...
```

| Toggle each checkbox | | |
| "Select All" per row | | |
| "Select All" per column | | |
| **Data scope setting per role:** | | |
| Own data only / Team only / Department / All company | | |
| Save → PUT /api/v1/settings/roles/:id | | WRITE: roles.permissions (JSON) |
| | Invalidate all active sessions for role (force re-read permissions) | |

---

### Step 3.3 — Create Custom Role

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| "Create Role" button | | |
| Role name input | | |
| Description | | |
| Clone from existing role (quick start) | | |
| Then same permission matrix as above | | |
| POST /api/v1/settings/roles | | WRITE: roles |

---
---

## 4. MODULE ENABLE/DISABLE
**URL:** `/settings/modules`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| GET /api/v1/settings/modules | | READ: tenant_modules WHERE tenant_id = ? |
| Show all modules as toggle cards | | |
| **Each card shows:** | | |
| Module name + description | | |
| Active employees using it | | |
| Toggle: ON / OFF | | |
| **Dependency warnings:** | | |
| Payroll needs Attendance → if Attendance OFF, warn | | |
| **Plan restriction:** | | |
| If module not in client's plan → show "Upgrade to unlock" | | |
| Greyed out with lock icon | | |
| Save changes → POST /api/v1/settings/modules | | WRITE: tenant_modules { is_active } |
| | If disabling module: | |
| | → Check no active jobs running | |
| | → Hide from navigation immediately | |
| | → Block API routes for that module | |
| | Return updated module list | |
| Sidebar updates immediately (no page refresh) | | |

---
---

## 5. APPROVAL WORKFLOW BUILDER
**URL:** `/settings/workflows`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| List all configurable workflows | GET /api/v1/settings/workflows | READ: workflow_configs |
| **Workflows:** | | |
| Leave Approval / Attendance Regularization / Expense / Recruitment / etc. | | |
| **Edit workflow:** | | |
| Click workflow → drag & drop chain builder | | |
| **Approval levels:** | | |
| Level 1: Direct Manager (auto-resolved from reporting_to) | | |
| Level 2: Department Head | | |
| Level 3: HR Manager | | |
| Level 4: HR Admin | | |
| Each level: required or optional | | |
| **Skip conditions:** | | |
| e.g. Skip level 2 if employee is Department Head | | |
| **Escalation:** | | |
| If not approved in X days → escalate to next level | | |
| **Delegation:** | | |
| If approver on leave → auto-delegate to alternate | | |
| Save → PUT /api/v1/settings/workflows/:id | | WRITE: workflow_configs |

---
---

## 6. NOTIFICATION TEMPLATES & RULES
**URL:** `/settings/notifications`

---

### Step 6.1 — Notification Rules

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| List all notification events | GET /api/v1/settings/notification-rules | READ: notification_rules |
| **Events list:** | | |
| Leave Applied / Approved / Rejected | | |
| Payslip Generated | | |
| Birthday / Work Anniversary | | |
| Document Expiry Alert | | |
| Subscription Renewal Reminder | | |
| Attendance Miss Punch | | |
| ... and more | | |
| **Per event:** | | |
| Toggle: Email / SMS / WhatsApp / In-App | | |
| Who receives: Employee / Manager / HR / All | | |
| Save → PUT /api/v1/settings/notification-rules | | WRITE: notification_rules |

---

### Step 6.2 — Email Template Editor

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Select event → edit template | | READ: notification_templates |
| **Rich text editor:** | | |
| Subject line with variables: {employee_name}, {date} | | |
| Body with variables | | |
| Available variables list shown (click to insert) | | |
| Preview rendered template | | |
| Send test email button | POST /api/v1/settings/test-notification | No DB write |
| Save → PUT /api/v1/settings/templates/:id | | WRITE: notification_templates |

---
---

## 7. CUSTOM FIELDS BUILDER
**URL:** `/settings/custom-fields`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Select module: Employees / Attendance / Leave / etc. | | |
| List existing custom fields | GET /api/v1/settings/custom-fields?module= | READ: custom_field_definitions |
| "Add Field" button | | |
| **Field configuration:** | | |
| Field label (display name) | | |
| Field type: Text / Number / Date / Dropdown / Checkbox / File | | |
| If dropdown: add options list | | |
| Required: Yes/No | | |
| Show on: List view / Detail view / Both | | |
| Editable by: Employee / HR only / Admin only | | |
| Save → POST /api/v1/settings/custom-fields | | WRITE: custom_field_definitions |
| | Migrate existing records (add NULL column) | ALTER TABLE (via Prisma migration) |
| Field appears in forms immediately | | READ: custom_field_definitions on form load |
| Custom field data saved in: | | WRITE: custom_field_values { entity_id, field_id, value } |

---
---

## 8. INTEGRATIONS
**URL:** `/settings/integrations`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| List all available integrations | | |
| **Biometric Integration:** | | |
| Brand: ZKTeco / Essl / Realtime | | |
| Device IP, Port, Device ID | | |
| Sync frequency | | |
| Test connection → fetch attendance data test | | |
| Save → PUT /api/v1/settings/biometric | | WRITE: biometric_config |
| **Tally Integration (Accounting):** | | |
| Tally server IP + port | | |
| Export format: Tally XML | | |
| Test connection | | |
| **API Access (for developers):** | | |
| Generate API key | POST /api/v1/settings/api-keys | WRITE: api_keys |
| List active API keys | | READ: api_keys |
| Revoke key | DELETE /api/v1/settings/api-keys/:id | WRITE: api_keys.revoked_at |
| **Webhook Config:** | | |
| Webhook URL input | | |
| Select events to send | | |
| Secret key for verification | | |
| Test webhook button | | |
| Save → POST /api/v1/settings/webhooks | | WRITE: webhook_configs |

---
---

## 9. BACKUP & RESTORE
**URL:** `/settings/backup`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| **Manual Backup:** | | |
| "Create Backup Now" button | | |
| POST /api/v1/settings/backup/create | | |
| | Dump entire tenant DB | pg_dump / mysqldump |
| | Compress to .gz | |
| | Encrypt backup file | |
| | Upload to MinIO (or cloud) | WRITE: backup_logs |
| | Return: { backupId, size, timestamp } | |
| Show backup in list | | |
| Download backup button | | |
| **Backup Schedule:** | | |
| Frequency: Daily / Weekly / Monthly | | |
| Time: HH:MM | | |
| Retention: keep last X backups | | |
| Save schedule → PUT /api/v1/settings/backup/schedule | | WRITE: backup_schedules |
| **Restore:** | | |
| Select backup from list | | |
| Confirm dialog: "This will overwrite current data" | | |
| POST /api/v1/settings/backup/restore/:id | | |
| | Decrypt backup | |
| | Restore DB | psql / mysql restore |
| | Restart relevant services | |
| Progress shown during restore | | |
| Success → redirect to login | | |

---
---

## 10. AUDIT LOG VIEWER
**URL:** `/settings/audit-logs`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| GET /api/v1/settings/audit-logs | | READ: audit_logs ORDER BY created_at DESC |
| **Filters:** | | |
| User / Module / Action / Date range | | |
| **Log table:** | | |
| Timestamp / User / Module / Action / Record / IP | | |
| **Detail view on click:** | | |
| Old values (before change) | | READ: audit_logs.old_values JSON |
| New values (after change) | | READ: audit_logs.new_values JSON |
| Diff highlighted | | |
| **Sensitive access log:** | | |
| Filter: Action = sensitive_data_accessed | | |
| Shows who viewed unmasked Aadhaar/PAN | | |
| Export audit log to Excel | | |
| **Retention:** | | |
| Audit logs kept for 7 years (legal requirement) | | |
| Auto archive older logs | | |

---
---

## 11. SUBSCRIPTION & BILLING (CLIENT SIDE)
**URL:** `/settings/subscription`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| GET /api/v1/settings/subscription | | READ: tenants (plan field) JOIN plans WHERE tenant_id = ? |
| **Current plan info:** | | |
| Plan name / Price / Renewal date | | |
| Modules included | | |
| Max employees / Current count | | |
| **Usage bar:** | | |
| Employees: 45 of 100 ████████░░ | | |
| **Upgrade Plan button:** | | |
| Show plan comparison | | READ: tenant_pricing_configs (all) |
| Select plan → payment flow | | |
| **Invoice History:** | | |
| GET /api/v1/settings/invoices | | READ: invoices WHERE tenant_id = ? |
| List: Date / Amount / Status / Download | | |
| Click download → PDF invoice | | READ: invoices.pdf_url |
| **Renewal:** | | |
| Manual renew button | | |
| Auto-renew toggle (for subscription) | | |
| **Cancellation:** | | |
| Cancel subscription button | | |
| Confirm → data retained 30 days | | WRITE: tenants (plan, plan_expires_at).status = cancelled |

---

## DB TABLES USED IN SETTINGS FLOWS

```
companies               → company information
tenant_branding → logo, colors, custom domain, white label
roles                   → role definitions
tenant_modules          → active modules
workflow_configs        → approval workflow rules
notification_rules      → which events trigger what
notification_templates  → email/SMS templates
custom_field_definitions → extra fields per module
custom_field_values     → data for custom fields
biometric_config        → biometric device settings
api_keys                → developer API keys
webhook_configs         → webhook endpoints
backup_logs             → backup history
backup_schedules        → auto backup settings
audit_logs              → all system activity
tenants (plan, plan_expires_at) → current subscription (Central DB)
invoices                → billing history
```

---

## 🔗 Related Documents
- Auth flows → [09_AUTH_FLOWS.md](./09_AUTH_FLOWS.md)
- Onboarding flows → [10_ONBOARDING_FLOWS.md](./10_ONBOARDING_FLOWS.md)
- Frozen decisions → [07_FROZEN_DECISIONS.md](./07_FROZEN_DECISIONS.md)
