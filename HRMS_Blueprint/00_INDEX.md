# HRMS PROJECT BLUEPRINT — MASTER INDEX
> **Version: 5.0** | Last Updated: 2026-11-25 | Status: Architecture reconciliation in progress — NOT production-ready
> Product: Syntern HRMS (configurable name via `PRODUCT_NAME` env var)

---

## CURRENT AUTHORITY — 2026-11-25

Read these documents before making architecture or code changes:
1. 35_MASTER_PROJECT_EXECUTION_AND_CONTINUITY_PLAN.md — mandatory master process, full-project audit, plan verification, implementation cycle and new-chat recovery protocol.\n2. 00_CHAT_HANDOFF_CONTINUATION.md — latest handoff, user-approved constraints and immediate continuation.
3. 33_MASTER_CODEBASE_ARCHITECTURE_AUDIT.md — source-verified architecture, findings, blockers and implementation sequence.
4. 34_OWNER_DECISIONS_AND_RECOMMENDATIONS.md — only the product/business choices that still need owner input.
5. 07_FROZEN_DECISIONS.md — frozen decisions, with its new override section taking precedence over legacy contradictions.

The June 2026 module status percentages and "production-ready" labels below are historical snapshots, not release evidence. The old 08_STATUS_AND_CHANGELOG.md reference is unresolved; use 33_MASTER_CODEBASE_ARCHITECTURE_AUDIT.md and 32_PRODUCTION_READINESS_AND_MODULE_EXECUTION_PLAN.md for current status.

## ⚡ HOW TO USE (READ THIS FIRST)

```
Starting any new AI chat:
  ALWAYS read → 35_MASTER_PROJECT_EXECUTION_AND_CONTINUITY_PLAN.md\n  ALWAYS read → 00_CHAT_HANDOFF_CONTINUATION.md
  ALWAYS read → 33_MASTER_CODEBASE_ARCHITECTURE_AUDIT.md
  ALWAYS read → 34_OWNER_DECISIONS_AND_RECOMMENDATIONS.md (for unresolved owner choices)
  ALSO read   → 07_FROZEN_DECISIONS.md and the relevant flow doc

Never paste everything at once — keep context focused.
```

---

## 📂 DOCUMENT MAP

### Continuous improvement cycle
- HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-1.md — routing, CI and initial security audit.\n- HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-2.md — WebSocket tenant broadcast and payment webhook route wiring audit.\n- HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-3.md — Leave and recruitment service-level access control audit.\n- HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-4.md — Performance, Training, Assets and file-upload security audit.\n- HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-5.md — Payroll controller/service contracts and Compliance ownership audit.\n- HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-6.md — Operational PostgreSQL RLS and database-role verification audit.\n- HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-7.md — Onboarding, company-document and notification-settings API contract audit.\n- HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-8.md — Billing conversion, backup encryption and restore/deletion audit.\n- HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-9.md — Employee bank/document ownership and photo privacy audit.\n- HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-10.md — Import/export pipeline and CSV formula-injection audit.
- HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-11.md — Auth identity and attendance controller/service contract reconciliation.
- HRMS_Blueprint/36_MASTER_MODULE_COMPLETION_TRACKER.md — module-by-module evidence tracker.
- HRMS_Blueprint/37_MASTER_GAP_AND_RISK_REGISTER.md — consolidated risk and gap ledger.

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
| **32_PRODUCTION_READINESS_AND_MODULE_EXECUTION_PLAN.md** | Current release gates and execution priority |
| **33_MASTER_CODEBASE_ARCHITECTURE_AUDIT.md** | Source-verified codebase and architecture baseline |
| **34_OWNER_DECISIONS_AND_RECOMMENDATIONS.md** | Business choices and recommended defaults |

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
| Master process / new chat recovery | 35_MASTER_PROJECT_EXECUTION_AND_CONTINUITY_PLAN.md |\n| Module-wise completion and evidence | 36_MASTER_MODULE_COMPLETION_TRACKER.md |\n| Open gaps and risks | 37_MASTER_GAP_AND_RISK_REGISTER.md |\n| Current architecture status & blockers | 33_MASTER_CODEBASE_ARCHITECTURE_AUDIT.md |
| Owner decisions still required | 34_OWNER_DECISIONS_AND_RECOMMENDATIONS.md |
| Paid tenant migration inventory and safety gates | PAID_TENANT_MIGRATION_INVENTORY.md |
| Latest implementation/CI progress | 28_IMPLEMENTATION_PROGRESS.md |
| Any page's FE/BE/DB steps | Relevant flow doc (09–20) |

---

## ⚙️ ENVIRONMENT QUICK REF

```
Backend port:       5001 (PORT env var)
Frontend port:      5173 (Vite dev)
API base:           /api/v1/
Health check:       GET /health
WebSocket:          ws://host:5001/ws?ticket=<UUID> (via POST /api/v1/auth/ws-ticket)
Central DB:         CENTRAL_DATABASE_URL
Tenant DB (dev):    DEV_TENANT_DATABASE_URL
Product name:       PRODUCT_NAME env var (never hardcoded)
Product domain:     PRODUCT_DOMAIN env var
```


## Latest Cycle 01 source audit

- Phase 15 — customer DB configuration, connection-test network boundary and provisioning lifecycle: [CYCLE-01-SOURCE-AUDIT-PHASE-15.md](cycles/CYCLE-01-SOURCE-AUDIT-PHASE-15.md)


## Latest Cycle 01 source audit

- Phase 16 — PostgreSQL operational referential integrity, central RLS coverage, fresh-install baseline and FK index inventory: [CYCLE-01-SOURCE-AUDIT-PHASE-16.md](cycles/CYCLE-01-SOURCE-AUDIT-PHASE-16.md)


## Latest Cycle 01 source audit

- Phase 17 — backup/restore lifecycle, frontend/backend notification route mapping, Railway migration startup behavior and CI workflow review: [CYCLE-01-SOURCE-AUDIT-PHASE-17.md](cycles/CYCLE-01-SOURCE-AUDIT-PHASE-17.md)


## Latest Cycle 01 source audit

- Phase 18 — frontend/backend API path, HTTP method and multipart contract mapping for core HRMS modules: [CYCLE-01-SOURCE-AUDIT-PHASE-18.md](cycles/CYCLE-01-SOURCE-AUDIT-PHASE-18.md)


## Latest Cycle 01 source audit

- Phase 19 — onboarding progress, company documents, subscription checkout, salary-component route and API response-envelope reconciliation: [CYCLE-01-SOURCE-AUDIT-PHASE-19.md](cycles/CYCLE-01-SOURCE-AUDIT-PHASE-19.md)


## Latest Cycle 01 source audit

- Phase 20 — KYC queue durability, MinIO credentials, ClamAV and runtime environment/readiness configuration: [CYCLE-01-SOURCE-AUDIT-PHASE-20.md](cycles/CYCLE-01-SOURCE-AUDIT-PHASE-20.md)


## Latest Cycle 01 source audit

- Phase 21 — authentication tenant selection, encryption key fallback and access-token persistence revalidation: [CYCLE-01-SOURCE-AUDIT-PHASE-21.md](cycles/CYCLE-01-SOURCE-AUDIT-PHASE-21.md)


## Latest Cycle 01 source audit

- Phase 22 — P0 WebSocket/webhook revalidation, operational RLS decision correction and gap deduplication: [CYCLE-01-SOURCE-AUDIT-PHASE-22.md](cycles/CYCLE-01-SOURCE-AUDIT-PHASE-22.md)


## Cycle 01 planning

- Prioritised implementation plan: [CYCLE-01-PLAN.md](cycles/CYCLE-01-PLAN.md)
- Independent plan verification: [CYCLE-01-PLAN-VERIFICATION.md](cycles/CYCLE-01-PLAN-VERIFICATION.md) — **Verified** after Round 2.


## Latest Cycle 01 implementation

- Phase 23 — tenant-scoped WebSocket identity, payment router/load fix and backend CI evidence: [CYCLE-01-IMPLEMENTATION-PHASE-23.md](cycles/CYCLE-01-IMPLEMENTATION-PHASE-23.md)


## Latest Cycle 01 implementation

- Phase 24 — explicit workspace selection, tenant-bound login/refresh tokens and regression test evidence: [CYCLE-01-IMPLEMENTATION-PHASE-24.md](cycles/CYCLE-01-IMPLEMENTATION-PHASE-24.md)


## Latest Cycle 01 implementation report

- Phase 25 — Central RLS policy completion, all-17-model matrix and bootstrap parity: [CYCLE-01-IMPLEMENTATION-PHASE-25.md](cycles/CYCLE-01-IMPLEMENTATION-PHASE-25.md)


## Latest Cycle 01 implementation

- Phase 25 — Central RLS 17-table migration/bootstrap parity and zero-skip PostgreSQL CI: [CYCLE-01-IMPLEMENTATION-PHASE-25.md](cycles/CYCLE-01-IMPLEMENTATION-PHASE-25.md)


## Latest Cycle 01 implementation report

- Phase 26 — PostgreSQL migration baseline layout, MSSQL legacy history and non-fatal deploy migration runner: [CYCLE-01-IMPLEMENTATION-PHASE-26.md](cycles/CYCLE-01-IMPLEMENTATION-PHASE-26.md)

---

## Cycle 01 Phase 28 — operational ownership regression increment

- Report: [CYCLE-01-IMPLEMENTATION-PHASE-28.md](cycles/CYCLE-01-IMPLEMENTATION-PHASE-28.md)
- Code commit: `2254f855b884deb51f7f7783d6acae17fd6523c3`
- Backend Tests run 46105770148: 258/258 passed, 0 skipped.
- Tenant Migration PostgreSQL Integration run 46105770068: 1/1 passed.
- Frontend Build run 46104588048 passed on `cb3ebff3cc1fabd0c189ece8df09a01efcf82bd5`; no frontend source changed since that SHA.
- Next: HRMS-D-003 forgot-password explicit workspace selection residual, then continue D-004 operational ownership matrix.


## Cycle 01 Phase 29 — password-reset workspace binding

- Report: [CYCLE-01-IMPLEMENTATION-PHASE-29.md](cycles/CYCLE-01-IMPLEMENTATION-PHASE-29.md)
- Task: HRMS-D-003 / GAP-0065 — forgot-password explicit workspace selection.
- Status: source changes committed; test execution and exact-head CI pending.
- Next: resume HRMS-D-004 operational ownership/query matrix after Phase 29 verification.


## Cycle 01 Phase 30 — PostgreSQL ownership inventory and OTP isolation

- Report: [CYCLE-01-IMPLEMENTATION-PHASE-30.md](cycles/CYCLE-01-IMPLEMENTATION-PHASE-30.md)
- Ownership matrix: [CYCLE-01-POSTGRES-OWNERSHIP-INVENTORY-PHASE-30.md](cycles/CYCLE-01-POSTGRES-OWNERSHIP-INVENTORY-PHASE-30.md)
- Plan: [CYCLE-01-PLAN-PHASE-30.md](cycles/CYCLE-01-PLAN-PHASE-30.md)
- Independent verification: [CYCLE-01-PLAN-VERIFICATION-PHASE-30.md](cycles/CYCLE-01-PLAN-VERIFICATION-PHASE-30.md)
- Task: HRMS-D-004 primary; HRMS-D-003 related. GAP-0067 OTP namespace fix is committed, tests/CI pending.
- Next: continue model-by-model operational query tracing and cross-company negative-test coverage; retain production safety gates.


## Cycle 01 Phase 31 — tenant-indexed company identity

- Report: [CYCLE-01-IMPLEMENTATION-PHASE-31.md](cycles/CYCLE-01-IMPLEMENTATION-PHASE-31.md)
- Plan: [CYCLE-01-PLAN-PHASE-31.md](cycles/CYCLE-01-PLAN-PHASE-31.md)
- Plan verification and safety correction: [CYCLE-01-PLAN-VERIFICATION-PHASE-31.md](cycles/CYCLE-01-PLAN-VERIFICATION-PHASE-31.md)
- Safe source binding uses Central `user_id` + operational `company_id`; OTP includes tenant+company identity.
- GAP-0068 remains open pending Central multi-company membership mapping and legacy backfill. No schema migration was made.


## Cycle 01 Phase 32 — Central membership mapping design

- Design proposal: [CYCLE-01-CENTRAL-TENANT-COMPANY-MEMBERSHIP-DESIGN-PHASE-32.md](cycles/CYCLE-01-CENTRAL-TENANT-COMPANY-MEMBERSHIP-DESIGN-PHASE-32.md)
- Plan: [CYCLE-01-PLAN-PHASE-32.md](cycles/CYCLE-01-PLAN-PHASE-32.md)
- Independent verification: [CYCLE-01-PLAN-VERIFICATION-PHASE-32.md](cycles/CYCLE-01-PLAN-VERIFICATION-PHASE-32.md)
- Design-only; no DDL or migration authorized. D-005 must settle membership semantics and legacy backfill authority before implementation.
