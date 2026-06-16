# 03 — BACKEND
> Part of HRMS Blueprint | [← Back to Index](./00_INDEX.md)
> Last Updated: June 2026 | Status: ~85% Live

---

## 🏗️ Actual Folder Structure

```
backend/
├── server.js                    ← Express entrypoint — all middleware + route mounts
├── nodemon.json                 ← Dev-only: nodemon config
├── package.json
├── .env                         ← All secrets & config (never commit)
│
├── modules/                     ← One folder per module (independent)
│   ├── auth/
│   │   ├── auth.routes.js       ← All auth endpoints (login, OTP, refresh, etc.)
│   │   └── auth.service.js      ← Auth business logic
│   ├── employees/
│   │   ├── employees.routes.js
│   │   ├── employees.controller.js
│   │   ├── employees.service.js
│   │   ├── employees.extended.controller.js
│   │   ├── employees.extended.service.js
│   │   ├── employees.exit.service.js     ← FnF / exit processing
│   │   └── employees.update-request.js
│   ├── attendance/
│   │   ├── attendance.routes.js
│   │   ├── attendance.controller.js
│   │   └── attendance.service.js
│   ├── leave/
│   │   ├── leave.routes.js
│   │   ├── leave.controller.js
│   │   └── leave.service.js
│   ├── payroll/
│   │   ├── payroll.routes.js
│   │   ├── payroll.controller.js
│   │   └── payroll.service.js
│   ├── compliance/
│   │   ├── compliance.routes.js
│   │   ├── compliance.controller.js
│   │   └── compliance.service.js
│   ├── dashboard/
│   │   └── dashboard.routes.js
│   ├── recruitment/
│   │   ├── recruitment.routes.js
│   │   ├── recruitment.controller.js
│   │   └── recruitment.service.js
│   ├── performance/
│   │   ├── performance.routes.js
│   │   ├── performance.controller.js
│   │   └── performance.service.js
│   ├── training/
│   │   ├── training.routes.js
│   │   ├── training.controller.js
│   │   └── training.service.js
│   ├── assets/
│   │   ├── assets.routes.js
│   │   ├── assets.controller.js
│   │   └── assets.service.js
│   ├── expenses/
│   │   ├── expenses.routes.js
│   │   ├── expenses.controller.js
│   │   └── expenses.service.js
│   ├── reports/
│   │   ├── reports.routes.js
│   │   └── reports.controller.js
│   ├── notifications/
│   │   ├── notifications.routes.js      ← Main notification routes
│   │   ├── notification.routes.js       ← Notification config/settings routes
│   │   ├── notification.config.service.js
│   │   ├── notifications.controller.js
│   │   └── notifications.service.js     ← WebSocket registry + push
│   ├── roles/
│   │   ├── roles.routes.js
│   │   ├── roles.controller.js
│   │   └── roles.service.js
│   ├── settings/
│   │   ├── settings.routes.js
│   │   ├── settings.controller.js
│   │   └── settings.service.js
│   ├── platform/
│   │   ├── platform.routes.js           ← Platform-level tenant routes
│   │   ├── platform.service.js
│   │   ├── admin.routes.js              ← Platform admin CRUD (protected)
│   │   ├── brand.routes.js              ← White-label branding routes
│   │   ├── subscription.routes.js
│   │   ├── subscription.controller.js
│   │   ├── subscriptionCalculator.js    ← Pricing computation logic
│   │   ├── payment.controller.js        ← Razorpay + PhonePe webhooks
│   │   ├── billing.service.js
│   │   ├── billing.cron.js              ← Monthly billing cron job
│   │   └── modulePricing.js             ← Module price table (paise)
│   ├── audit/
│   │   └── audit.routes.js              ← Loaded via safeUse (optional)
│   └── automation/
│       ├── index.js                     ← Automation router (safeUse)
│       ├── automation.routes.js
│       ├── automation.queue.js          ← BullMQ worker setup
│       ├── gst/
│       │   ├── gst.routes.js
│       │   ├── gst.service.js           ← Playwright GST scraper
│       │   ├── gst.db.service.js        ← central_gst_records CRUD
│       │   └── CAPTCHA_HANDLING.md
│       ├── kyc/
│       │   ├── kyc.routes.js
│       │   └── kyc.worker.js            ← Aadhaar OTP automation
│       └── management/
│           └── management.routes.js
│
├── prisma/
│   ├── schema.prisma                    ← Tenant DB schema (all tenant tables)
│   ├── central.prisma                   ← Central DB schema → generates central-client
│   ├── central_schema.sql               ← Central DB raw SQL reference
│   ├── seed.js                          ← Seed script (central + first tenant)
│   └── migrations/                      ← Prisma tenant DB migrations
│
├── shared/
│   ├── prisma.js                        ← Default PrismaClient (tenant DB, legacy)
│   ├── middleware/
│   │   ├── tenant.js                    ← Multi-tenant resolver (req.db + req.tenant)
│   │   ├── tenantSession.js             ← Session-level tenant cookie handling
│   │   ├── auth.js                      ← JWT verification → req.user
│   │   └── permission.js                ← RBAC: requirePermission(module, action)
│   ├── utils/
│   │   ├── centralPrisma.js             ← Central DB Prisma client (central-client)
│   │   ├── centralDb.js                 ← Central DB helpers (KYC, GST records)
│   │   ├── emailService.js              ← Nodemailer: all transactional email templates
│   │   ├── logger.js                    ← Winston logger instance
│   │   ├── minio.js                     ← MinIO file storage client
│   │   ├── backupService.js             ← DB backup to MinIO/GDrive/OneDrive
│   │   ├── billingEmailer.js            ← Billing-specific email helpers
│   │   ├── auditLog.js                  ← Write audit log entries
│   │   ├── encryption.js                ← AES-256 encrypt/decrypt
│   │   ├── response.js                  ← Standard sendSuccess / sendError helpers
│   │   ├── pagination.js                ← Cursor-based pagination helper
│   │   ├── pdf.service.js               ← PDF generation (pdfkit wrapper)
│   │   ├── gstScraper.js                ← GST GSTIN lookup via API
│   │   ├── tenantResolver.js            ← Resolve tenant by email (for auth)
│   │   ├── security.js                  ← CSRF token generator
│   │   ├── dbSchema.js                  ← Dynamic DB schema introspection
│   │   └── uiConstants.js               ← THEME.ICONS for log formatting
│   └── generated/
│       └── central-client/              ← Generated Prisma client for central DB
│           └── (auto-generated — never edit manually)
│
├── templates/
│   └── email/
│       ├── welcome.html
│       ├── password-reset.html
│       └── notification.html
│
├── db-migrations/                       ← Manual SQL migration reference
│   ├── *.sql
│   └── issues/
│
├── scripts/
│   ├── apply_migration_via_prisma.js
│   ├── check_function_def.js
│   └── integration_payment_smoke.js
│
└── logs/
    ├── combined.log                     ← All logs (auto-generated)
    └── error.log                        ← Error-only logs (auto-generated)
```

> **Note:** There is no `/backend/config/` folder. All configuration is via `.env` variables loaded by `dotenv`.

---

## 🌐 API Design Rules (FROZEN)

### Base URL
```
/api/v1/[module]/[resource]
```

### Standard Response Format
```json
// Success
{ "success": true, "data": {}, "message": "Operation successful", "pagination": {} }

// Error
{ "success": false, "code": "ERR_NOT_FOUND", "message": "Employee not found" }
```

### Standard Error Codes
```
ERR_UNAUTHORIZED     → Not logged in / token expired
ERR_FORBIDDEN        → No permission for this action
ERR_NOT_FOUND        → Record not found
ERR_VALIDATION       → Form data invalid
ERR_DUPLICATE        → Already exists
ERR_SERVER           → Internal server error
ERR_LICENCE          → Subscription expired / module locked
ERR_CSRF_FAILED      → CSRF token mismatch
ERR_DB_CONNECTION    → Cannot connect to tenant DB
```

### Pagination (FROZEN — cursor-based ONLY)
```
GET /api/v1/employees?cursor=<uuid>&limit=20
Response includes: { data: [], pagination: { cursor, hasMore, total } }
NEVER use offset pagination.
```

---

## 🗺️ All Mounted API Routes (from server.js)

```
GET  /health                                  ← Health check (no auth)
GET  /uploads/:file                           ← Static file serve

# Platform routes
ALL  /api/v1/platform/...                     ← Tenant platform management
ALL  /api/v1/platform/admin/...              ← Platform admin operations
ALL  /api/v1/platform/subscribe/...          ← Subscription management
ALL  /api/v1/gst/...                          ← GST automation (no tenant required)

# Core Auth
ALL  /api/v1/auth/...                         ← Login, OTP, refresh, reset

# Tenant Module Routes (require tenantMiddleware)
ALL  /api/v1/employees/...
ALL  /api/v1/attendance/...
ALL  /api/v1/leave/...
ALL  /api/v1/payroll/...
ALL  /api/v1/compliance/...
ALL  /api/v1/dashboard/...
ALL  /api/v1/recruitment/...
ALL  /api/v1/performance/...
ALL  /api/v1/training/...
ALL  /api/v1/assets/...
ALL  /api/v1/expenses/...
ALL  /api/v1/reports/...
ALL  /api/v1/notifications/...
ALL  /api/v1/config/notifications/...         ← Notification settings
ALL  /api/v1/roles/...
ALL  /api/v1/settings/...

# Optional / safeUse (loaded if module file exists)
ALL  /api/v1/audit-logs/...
ALL  /api/v1/automation/...
```

---

## 🔐 Middleware Stack (Applied in Order)

```
1. helmet()                    ← Security headers
2. cookieParser()              ← Parse cookies (refresh token, CSRF)
3. express.json({ limit:'10mb' })
4. express.urlencoded()
5. cors()                      ← CORS with origin allowlist
6. CSRF check                  ← Validates X-CSRF-Token for POST/PUT/PATCH/DELETE
7. Request logger              ← Winston HTTP logging (method, path, status, ms)
8. tenantMiddleware            ← Resolves req.db + req.tenant (per-route)
9. tenantSessionMiddleware     ← Session cookie for tenant context
10. [route-level]
    authMiddleware             ← Validates JWT Bearer → req.user
    requireSetupComplete       ← Ensures tenant setup wizard is done
    restrictTo(...roles)       ← Role-based access control
    requirePermission(mod,act) ← Module-level permission check
```

### CSRF Rules
```
EXEMPT (no CSRF required):
  GET, HEAD, OPTIONS (all)
  POST /api/csrf-token
  POST /api/v1/auth/lookup
  POST /api/v1/auth/login
  POST /api/v1/auth/refresh

ALL other POST/PUT/PATCH/DELETE require:
  - X-CSRF-Token header matching _csrf cookie, OR
  - X-Requested-With: XMLHttpRequest header
```

---

## 🔐 Authentication Flow (Summary)

```
1. POST /api/v1/auth/lookup    → { tenantId, subdomain } (by email)
2. POST /api/v1/auth/login     → access token + httpOnly refresh cookie
3. All protected requests:
   Authorization: Bearer <accessToken>
4. POST /api/v1/auth/refresh   → new access token (reads refresh cookie)
5. POST /api/v1/auth/logout    → clears refresh cookie
```

> See [09_AUTH_FLOWS.md](./09_AUTH_FLOWS.md) for full flow details.

---

## 🏢 Multi-Tenant Architecture

```
Central DB (CENTRAL_DATABASE_URL):
  - tenants table → all client companies
  - central_user_index → email → tenant mapping (for login lookup)
  - tenant_modules → per-tenant module enable/disable
  - tenant_pricing_configs → per-tenant custom pricing
  - invoices → billing records
  - central_kyc_records → shared KYC cache
  - central_gst_records → shared GST lookup cache

Tenant DB (per client):
  - Full schema: users, employees, attendance, leave, payroll, etc.
  - Resolved in tenantMiddleware → req.db (PrismaClient)
  - DB isolation modes:
    cloud      → Supabase/shared cloud (schema isolation via schema_name)
    local      → Client's own PostgreSQL
    hybrid     → Local primary, cloud fallback
    external_cloud → Client's own cloud DB
```

---

## ⚡ Background Services (Started in startServer())

```
1. minio.ensureBucket()         ← Ensures MinIO bucket exists
2. startWorker()                ← BullMQ automation job queue
3. startBillingCron()           ← node-cron monthly billing job
```

---

## 📡 WebSocket Server

```
Endpoint: ws://localhost:5001/ws?token=<JWT>
Auth:     JWT verified on upgrade handshake — rejected if invalid/expired
Events:
  Server → Client:  { type: 'connected', message: '...' }
  Server → Client:  { type: 'notification', payload: { title, body, url } }
Use:      Real-time push for notifications, payroll completion, automation status
```

---

## 🔧 Environment Variables Reference

```bash
# Core
NODE_ENV=development|production
PORT=5001
LOG_LEVEL=info|debug|warn|error

# Product Identity (NEVER hardcode these)
PRODUCT_NAME=Syntern
PRODUCT_DOMAIN=syntern.in

# App URLs
APP_URL=https://syntern.in
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5001
ALLOWED_ORIGINS=http://localhost:5173

# Auth Secrets
JWT_ACCESS_SECRET=<32+ chars>
JWT_REFRESH_SECRET=<32+ chars>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
ENCRYPTION_KEY=<16+ chars>
MASTER_ENCRYPTION_KEY=<strong>
SUPER_ADMIN_DELETE_PASSWORD=<strong>

# Databases
CENTRAL_DATABASE_URL=postgresql://...
CENTRAL_DIRECT_URL=postgresql://...     ← For Prisma migrations on central
DEV_TENANT_DATABASE_URL=postgresql://...
DEV_TENANT_DIRECT_URL=postgresql://...
DEV_TENANT_SCHEMA=                      ← Optional schema isolation in dev
DEV_TENANT_ID=                          ← UUID of dev tenant
TENANT_TEMPLATE_SCHEMA=                 ← Schema to clone for new tenants
GLOBAL_SUPABASE_URL=
GLOBAL_SUPABASE_SERVICE_ROLE_KEY=
CLIENT_SUPABASE_URL=
CLIENT_SUPABASE_SERVICE_ROLE_KEY=

# Storage
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET=hrms
MINIO_USE_SSL=false
BACKUP_PROVIDER=minio|gdrive|onedrive

# Email
EMAIL_PROVIDER=smtp
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Payments
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
PHONEPE_MERCHANT_ID=
PHONEPE_SALT_KEY=
PHONEPE_SALT_INDEX=
PHONEPE_BASE_URL=
JIOPAY_MERCHANT_ID=
JIOPAY_SALT=
JIOPAY_BASE_URL=

# Google OAuth & Cloud
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
GDRIVE_CLIENT_ID=
GDRIVE_CLIENT_SECRET=
ONEDRIVE_CLIENT_ID=
ONEDRIVE_CLIENT_SECRET=
ONEDRIVE_TENANT_ID=

# Automation
GST_HEADLESS=true

# AI
ASSEMBLYAI_API_KEY=
```

---

## 🔗 Related Documents
- Tech stack versions → [01_TECH_STACK.md](./01_TECH_STACK.md)
- Database schema → [04_DATABASE.md](./04_DATABASE.md)
- Auth flow → [09_AUTH_FLOWS.md](./09_AUTH_FLOWS.md)
