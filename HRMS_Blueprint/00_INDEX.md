# HRMS PROJECT BLUEPRINT — MASTER INDEX
> **Version: 4.0** | Last Updated: June 2026 | Status: Active Development (~82% Production-Ready)
> Product: Syntern HRMS (configurable name via `PRODUCT_NAME` env var)

---

## ⚡ HOW TO USE (READ THIS FIRST)

```
Starting any new AI chat:
  ALWAYS paste → 07_FROZEN_DECISIONS.md  (all final decisions + constraints)
  ALWAYS paste → 08_STATUS_AND_CHANGELOG.md (current status of every module)
  ONLY paste   → relevant flow doc         (only what you're working on)

Never paste everything at once — keep context focused.
```

---

## 📂 DOCUMENT MAP

### Foundation Documents
| File | Purpose | Last Updated |
|------|---------|-------------|
| **00_INDEX.md** | This file — master map & project status | June 2026 |
| **01_TECH_STACK.md** | All tools, actual versions, env vars, infrastructure | June 2026 |
| **02_FRONTEND.md** | UI structure, theme tokens, components, actual routes | June 2026 |
| **03_BACKEND.md** | API design, actual folder structure, middleware, routes | June 2026 |
| **04_DATABASE.md** | All tables — Central DB + Tenant DB, columns, types | June 2026 |
| **05_DATA_FLOW.md** | How data moves between all modules | June 2026 |
| **06_MODULES.md** | Every module, features, real completion status | June 2026 |

### Decision & Tracking Documents
| File | Purpose |
|------|---------|
| **07_FROZEN_DECISIONS.md** ⭐ | ALL final decisions — paste in every chat |
| **08_STATUS_AND_CHANGELOG.md** | Module status, bug log, full change history |

### Flow Documents (FE / BE / DB 3-column format)
| File | Covers | Status |
|------|--------|--------|
| **09_AUTH_FLOWS.md** | Login, lookup, OTP, forgot/reset password, refresh, logout | ✅ Live |
| **10_ONBOARDING_FLOWS.md** | SaaS registration, Razorpay payment, 6-step setup wizard | ✅ Live |
| **11_SETTINGS_FLOWS.md** | Roles, modules, workflows, backup, audit log | ✅ Live |
| **12_EMPLOYEE_FLOWS.md** | Add (KYC wizard), bulk import, profile, edit, exit/FnF | ✅ Live |
| **13_ATTENDANCE_FLOWS.md** | Mark, self check-in, regularize, shifts, holidays | ✅ Live |
| **14_LEAVE_FLOWS.md** | Apply, approve, balance, types config, accrual | ✅ Live |
| **15_PAYROLL_FLOWS.md** | Run payroll, payslip email, bank file, FnF settlement | ✅ Live |
| **16_COMPLIANCE_FLOWS.md** | PF ECR, ESI challan, PT, TDS Form 16, LWF | ✅ Live |
| **17_REPORTS_FLOWS.md** | Generate, export PDF/Excel/CSV, schedule, analytics | ✅ Live |
| **18_AUTOMATION_FLOWS.md** | EPFO, ESIC, GST lookup, Aadhaar KYC, CAPTCHA, OCR | ✅ Live |
| **19_RECRUITMENT_PERFORMANCE_TRAINING_ASSETS_EXPENSE_FLOWS.md** | All 5 modules | 🔄 Partial |
| **20_SAAS_ADMIN_COMMUNICATION_ACCOUNTING_ERROR_FLOWS.md** | SaaS admin, subscription, billing, payments | ✅ Live |

---

## 🚦 REAL PROJECT STATUS (June 2026)

| Module | Backend | Frontend | Notes |
|--------|---------|----------|-------|
| **Authentication** | ✅ Live | ✅ Live | JWT + CSRF + OTP + refresh token |
| **Platform/Admin** | ✅ Live | 🔄 Partial | Admin routes done; some UI pages pending |
| **Subscription/Billing** | ✅ Live | 🔄 Partial | Razorpay + PhonePe integrated |
| **Tenant Onboarding** | ✅ Live | ✅ Live | 6-step setup wizard |
| **Employee Management** | ✅ Live | ✅ Live | KYC wizard, bulk import, FnF settlement |
| **Attendance** | ✅ Live | ✅ Live | Full module live |
| **Leave** | ✅ Live | ✅ Live | Email notifications wired |
| **Payroll** | ✅ Live | 🔄 Partial | Backend done; dashboard/run/reports pages need sync |
| **Compliance** | ✅ Live | ✅ Live | PF/ESI/PT/TDS |
| **Reports** | ✅ Live | ✅ Live | Export PDF/Excel/CSV |
| **Notifications** | ✅ Live | ✅ Live | Email + WebSocket real-time |
| **Roles & Permissions** | ✅ Live | ✅ Live | RBAC, per-module actions |
| **Settings** | ✅ Live | ✅ Live | |
| **GST Automation** | ✅ Live | 🔄 Partial | Lookup + CAPTCHA handling done |
| **KYC Automation** | ✅ Live | ✅ Live | Aadhaar OTP worker |
| **Recruitment** | ✅ Live | 🔄 Partial | Backend + Kanban board |
| **Performance** | ✅ Live | 🔄 Partial | Backend done |
| **Training** | ✅ Live | 🔄 Partial | Backend done |
| **Assets** | ✅ Live | 🔄 Partial | Backend done |
| **Expenses** | ✅ Live | 🔄 Partial | Backend done |
| **Dashboard** | ✅ Live | ✅ Live | |
| **Audit Logs** | ✅ Live | 🔄 Partial | Backend done |
| **Automation Queue** | ✅ Live | N/A | BullMQ worker running |
| **Billing Cron** | ✅ Live | N/A | node-cron scheduler running |
| **Mobile App** | ❌ Phase 2 | ❌ Phase 2 | React Native, same API |
| **Desktop App** | ❌ Phase 2 | ❌ Phase 2 | Tauri wrapper |

---

## 🔑 QUICK REFERENCE

| Need | Go To |
|------|-------|
| What tech stack & versions | 01_TECH_STACK.md |
| Which DB table exists | 04_DATABASE.md |
| How data flows | 05_DATA_FLOW.md |
| What a module does | 06_MODULES.md |
| All final decisions | 07_FROZEN_DECISIONS.md |
| Current build status & bugs | 08_STATUS_AND_CHANGELOG.md |
| Any page's FE/BE/DB steps | Relevant flow doc (09–20) |

---

## ⚙️ ENVIRONMENT QUICK REF

```
Backend port:       5001 (PORT env var)
Frontend port:      5173 (Vite dev)
API base:           /api/v1/
Health check:       GET /health
WebSocket:          ws://host:5001/ws?token=<JWT>
Central DB:         CENTRAL_DATABASE_URL
Tenant DB (dev):    DEV_TENANT_DATABASE_URL
Product name:       PRODUCT_NAME env var (never hardcoded)
Product domain:     PRODUCT_DOMAIN env var
```
