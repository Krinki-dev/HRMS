# 07 — FROZEN DECISIONS
> Part of HRMS Blueprint | [← Back to Index](./00_INDEX.md)
> ⚠️ PASTE THIS AT THE START OF EVERY NEW AI CHAT ⚠️
> Last Updated: June 2026 | Version: 4.0 FINAL

---

## THIS IS AN HRMS SAAS PRODUCT

```
Product Name:   Configurable via PRODUCT_NAME env var (never hardcoded)
                Default display: "HRMS" until set by owner
                Used everywhere: login, emails, invoices, billing, "Powered by ___"
Product Domain: Configurable via PRODUCT_DOMAIN env var
Target Market:  India only
Currency:       INR only — INTEGER paise always (149900 = ₹1,499.00)
Timezone:       IST only (Asia/Kolkata)
Language:       English only
Type:           Multi-tenant SaaS + Desktop App (Tauri — Phase 2)
Resellable:     Yes — full white label support
Developer:      Solo developer
Phase 1:        Web browser (production-live)
Phase 2:        Tauri desktop (Windows) + React Native mobile
```

---

## ✅ TECH STACK — FROZEN

```
Frontend:       React 18 + Vite + Tailwind CSS
Build tool:     Vite (dev on localhost:5173)
Desktop:        Tauri — Phase 2 only (not yet implemented)
Backend:        Node.js + Express (port 5001)
ORM:            Prisma v6 (multi-DB, two schema files)
DB Default:     PostgreSQL (Supabase cloud)
DB Options:     MySQL | MSSQL | SQLite (via Prisma)
File Store:     MinIO (self-hosted, S3-compatible)
Automation:     Playwright + playwright-extra stealth
Job Queue:      BullMQ + Redis (ioredis)
Validation:     Zod
Auth:           Custom JWT (Bearer access token + httpOnly refresh cookie)
CSRF:           X-CSRF-Token / XMLHttpRequest header
Error Logging:  Winston (file + console) → GlitchTip planned
Hosting:        Oracle Cloud Free Tier (Mumbai, production)
Payments:       Razorpay (primary) + PhonePe + JioPay
SMS:            Fast2SMS + MSG91 (configurable)
WhatsApp:       WhatsApp Business API (configurable)
Email:          Nodemailer + SMTP (per-tenant config)
PDF:            pdfkit
CSV:            json2csv
Excel:          SheetJS
Charts:         Recharts
OCR:            tesseract.js + jimp
Logging:        Winston (winston@3.13.0)
Mobile:         React Native — Phase 2 only
```

---

## ✅ ARCHITECTURE — FROZEN

```
Pattern:          Modular Monolith
Multi-tenant:     Yes — every client has own separate database (or schema)
DB Modes:         cloud | external_cloud | local | hybrid
Schema isolation: tenant.schema_name → appends ?schema=<name> to DB URL
Conflict rule:    Primary DB always wins on sync conflict — no exceptions
Pagination:       Cursor-based ONLY — never offset, never
Soft delete:      ONLY — never hard DELETE queries, never
Money:            INTEGER in paise only — never float, never decimal
Dates:            Always UTC stored in DB, convert to IST on frontend
API:              REST only, versioned /api/v1/
Response:         Always { success, data, message } — no exceptions
Error codes:      Always ERR_* prefixed code strings
```

---

## ✅ PRICING & PLANS — FROZEN (from modulePricing.js)

### Core Rules
```
✅ NO hardcoded plan tiers — all configurable via tenant_pricing_configs
✅ Base price: ₹1,499/month (149,900 paise) for up to 25 employees
✅ Per-employee overage: ₹50/month/employee above cap (5,000 paise)
✅ Market capture: give payroll + compliance in base plan
✅ Upsell: recruitment, performance, training, expenses, assets
```

### Module Pricing (from modulePricing.js — in paise)
```
Per Employee Per Month:
  payroll:     ₹30/emp   (3,000 paise)
  compliance:  ₹18/emp   (1,800 paise)
  fieldforce:  ₹25/emp   (2,500 paise)

Flat Fee Per Month:
  recruitment: ₹1,200    (120,000 paise)
  performance: ₹900      (90,000 paise)
  training:    ₹700      (70,000 paise)
  expenses:    ₹600      (60,000 paise)
  ai:          ₹750      (75,000 paise)
```

### Discount Tiers
```
6 months:       5% discount
1 year:         ~17% (~2 months free)
2 years:        ~20% (~5 months free)
Bundle (3+ mods): 15% additional off total
Custom:         final_override_paise on tenant_pricing_configs
Promo codes:    offer_flat_paise + offer_expiry_date
```

### Module Lock Logic — FINAL
```
ALL PLANS INCLUDE (Base — cannot be disabled):
├── Employee Management         (always-on, foundation)
├── Attendance & Leave
├── Payroll                     ← ALL plans (market capture decision)
├── Compliance (PF/ESI/PT/TDS)  ← ALL plans (market capture decision)
├── Browser Automation          ← ALL plans (unique differentiator)
├── Basic Reports & Export
├── Document Management
└── Email Notifications

PAID MODULE ADD-ONS:
├── Recruitment (₹1,200/month flat)
├── Performance Management (₹900/month flat)
├── Training & Development (₹700/month flat)
├── Expenses (₹600/month flat)
├── Assets Management
├── Field Force GPS (₹25/emp/month)
├── AI Features (₹750/month flat)
├── Advanced Analytics & Custom Reports
├── White Label (hide "Powered by")
├── Multi-company support
├── Accounting Exports (Tally/Zoho/QB)
├── Priority Support
└── API Access & Webhooks
```

### Trial & SLA
```
Free Trial:     90 days (all cloud registrations)
SLA:            99.9% uptime (cloud deployments)
Grace Period:   15 days read-only after subscription expires
After grace:    Login blocked — data preserved
```

---

## ✅ SUPPORT CHANNELS — FROZEN (Configurable ON/OFF)

```
Email support / WhatsApp support / In-app ticket system
Phone support / Knowledge base
```

---

## ✅ ACCOUNTING APPROACH — FROZEN

```
Approach:     EXPORT ONLY — no full accounting module ever
Export formats (planned):
  Tally XML/TDL | Zoho Books CSV | QuickBooks CSV | SAP CSV | Generic CSV
Data exported: Payroll journal | Invoices | Expense reimbursements | FnF
```

---

## ✅ INTEGRATIONS — FROZEN (Configurable per client)

```
Accounting:     Tally, Zoho Books, QuickBooks, SAP          [High priority]
Biometric:      ZKTeco, Essl, Realtime, Suprema              [High priority]
Job Portals:    Naukri, LinkedIn, Indeed                     [Medium]
E-Sign:         DigiLocker, Leegality, SignDesk              [Medium]
Calendar:       Google Calendar, Outlook                     [Medium]
Cloud Storage:  Google Drive (active), OneDrive (active)    [Active]
Communication:  Slack, Teams                                [Low]
Background:     AuthBridge, SpringVerify                     [Low]
```

---

## ✅ SECURITY — FROZEN

```
Access Token:     JWT (15 min expiry) — Bearer header
Refresh Token:    JWT (7 days) — httpOnly cookie ONLY, never localStorage
CSRF:             X-CSRF-Token + _csrf cookie validation on all mutations
Permissions:      RBAC — per module per action (view/create/edit/delete)
Platform admin:   is_platform_admin sourced from central_user_index (not JWT payload)
Aadhaar:          Stored as SHA-256 hash in central DB; address fields AES-256 encrypted
PAN:              AES-256 encrypted at rest, displayed as XXXXX1234X
Display masked:   Aadhaar XXXX-XXXX-1234 | PAN XXXXX1234X
Full unmask:      HR Admin role only + mandatory audit log written
Portal passwords: AES-256 encrypted in tenant DB, never logged, never in API response
File access:      Signed MinIO URLs (1-hour expiry) — no direct paths served
Audit log:        All create/update/delete/login/unmask logged → 7 years minimum
Data retention:   7 years minimum (India financial legal requirement)
Super admin delete: Protected by SUPER_ADMIN_DELETE_PASSWORD env var
```

---

## ✅ DATABASE RULES — FROZEN

```
All PKs:          UUID always (gen_random_uuid()) — never integer IDs
All FKs:          table_name_id naming (employee_id, company_id)
Soft delete:      deleted_at timestamp (NULL = active, value = deleted time)
Timestamps:       created_at + updated_at on EVERY table, no exceptions
Money:            INTEGER paise ONLY — 149900 = ₹1,499.00 — never float/decimal
Date only:        DATE type
Date + time:      TIMESTAMP WITH TIME ZONE (TIMESTAMPTZ)
Boolean naming:   is_xxx or has_xxx prefix always
Encryption:       AES-256 for Aadhaar, PAN, bank accounts, portal passwords, DB creds
Table naming:     snake_case, plural (employees, leave_types)
Column naming:    snake_case, singular (first_name, created_at)
Two Prisma files: prisma/schema.prisma (tenant) + prisma/central.prisma (central)
Two clients:      @prisma/client (tenant) + shared/generated/central-client (central)
```

---

## ✅ MODULE BUILD STATUS — ACTUAL (June 2026)

```
Phase 1:   Authentication               ✅ Live
Phase 2:   Platform/SaaS Admin          ✅ Live (backend) / 🔄 Partial (frontend)
Phase 3:   Subscription & Billing       ✅ Live (Razorpay + PhonePe + JioPay)
Phase 4:   Employee Management          ✅ Live (KYC wizard, bulk import, FnF)
Phase 5:   Attendance & Leave           ✅ Live (including email notifications)
Phase 6:   Payroll                      ✅ Backend Live / 🔄 Frontend pages need sync
Phase 7:   Compliance (PF/ESI/PT/TDS)  ✅ Live
Phase 8:   Reports & Export             ✅ Live
Phase 9:   Notifications                ✅ Live (email + WebSocket real-time)
Phase 10:  Roles & Settings             ✅ Live
Phase 11:  GST Automation               ✅ Live (lookup + CAPTCHA handling)
Phase 12:  KYC Automation               ✅ Live (Aadhaar OTP worker)
Phase 13:  Recruitment                  ✅ Backend / 🔄 Kanban frontend
Phase 14:  Performance                  ✅ Backend / 🔄 Frontend
Phase 15:  Training                     ✅ Backend / 🔄 Frontend
Phase 16:  Assets & Expenses            ✅ Backend / 🔄 Frontend
Phase 17:  Audit Logs                   ✅ Backend / 🔄 Frontend
Phase 18:  Desktop App (Tauri)          ❌ Phase 2 — not started
Phase 19:  Mobile App (React Native)    ❌ Phase 2 — not started
```

---

## ❌ NEVER SUGGEST THESE — EVER

```
❌ Hard DELETE queries           → soft deletes only, always
❌ Offset pagination             → cursor-based only, always
❌ Float or Decimal for money    → paise integers only, always
❌ Prisma alternatives           → Prisma is final, decided
❌ Electron                      → replaced by Tauri (Phase 2)
❌ Redux                         → Zustand only, decided
❌ React class components        → functional components only
❌ useEffect for API calls       → React Query only
❌ localStorage for tokens       → httpOnly cookies only
❌ GraphQL                       → REST only, decided
❌ MongoDB or any NoSQL          → relational DBs only
❌ Any paid service              → verify free alternative first
❌ Mixing tenant databases       → every client has own DB, always
❌ Full accounting module        → export only approach, decided
❌ Employee count limits         → unlimited on all plans, decided
❌ Hardcoded product name        → always use PRODUCT_NAME env var
❌ New table without DB check    → always check 04_DATABASE.md first
❌ Different API response format → always { success, data, message }
❌ Payroll/Compliance as paid    → these are in ALL plans, decided
❌ Hiding browser automation     → this is in ALL plans, key differentiator
❌ Integer PKs                   → UUIDs only, always
❌ Direct file paths for uploads → signed MinIO URLs only
❌ Storing tokens in localStorage → httpOnly cookie for refresh, Bearer for access
```
