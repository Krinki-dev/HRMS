# Cycle 01 Implementation Phase 31 — tenant-indexed operational identity binding

**Date:** 2026-11-28 (Asia/Kolkata)  
**Task:** HRMS-D-003 — explicit tenant/company identity binding  
**Findings:** GAP-0068 (same email across operational companies); GAP-0067 (OTP identity namespace)  
**Branch:** `architecture/postgres-tenant-isolation`

## 1. Recovery and full re-analysis

Phase 30 found that `users` is unique by `(company_id, email)`, so the same email can exist in multiple operational companies. The Central `central_user_index` is unique by `(email, company_id)`, where `company_id` means the Central tenant UUID, not operational company ID. It stores at most one `user_id` for an email/tenant pair.

A first implementation draft attempted to enumerate operational `users` rows by email. That was rejected during review because Free/Trial tenants share the public operational schema and those rows do not contain Central tenantId. Such a query could expose or accept company identities belonging to another SaaS tenant. The draft was replaced before the final Phase 31 source state. **Do not reintroduce email-only enumeration in the shared public schema.**

## 2. Safe source correction

The final source state uses the selected Central tenant's `central_user_index.user_id` as the identity anchor:
1. Resolve Central membership by normalized email + selected Central tenant UUID.
2. Require exactly one active index row with non-null `user_id`.
3. Load that exact operational user by user ID + email.
4. Validate the user's operational `company_id` and active company.
5. Reject a request companyId that does not match the indexed user's company.
6. Use the same resolved user/company for password login, OTP, and forgot-password.
7. OTP identifier is now `tenant:<tenantUUID>:company:<companyUUID>:email:<normalizedEmail>`.

Changed files:
- `backend/modules/auth/auth.service.js`
- `backend/modules/auth/auth.routes.js`
- `backend/shared/utils/otpIdentity.js`
- `frontend/src/pages/auth/SmartLoginPage.jsx`
- `frontend/src/pages/auth/ForgotPasswordPage.jsx`
- `backend/test/auth-company-selection.test.js`
- `backend/test/otp-tenant-isolation.test.js`
- `backend/test/password-reset-workspace.test.js`

The login and forgot-password UIs now carry an operational companyId. The company-choice UI is prepared for a future membership mapping, but the current Central index can return only one mapped operational user/company per email/tenant.

## 3. Architecture blocker — GAP-0068 remains open

The existing Central index cannot represent multiple operational company accounts for the same email inside one Central tenant. Full same-tenant multi-company selection requires an explicit Central tenant-user-company membership mapping (or equivalent operational_company_id key), uniqueness rules, legacy backfill and a migration/adoption plan.

This is dependent on HRMS-D-005's PostgreSQL migration-baseline work. No schema or migration change was made. The current source binds to the one Central-indexed user and fails closed if mapping is absent or mismatched; it does not claim to support selecting additional unindexed company memberships.

## 4. Tests and execution status

- Added static regression tests for Central-index user binding, company ID propagation, OTP tenant+company namespacing, and forgot-password user binding.
- Local isolated Node.js helper smoke test: **4/4 passed** for normalization, cross-tenant separation, cross-company separation and missing-context fail-closed behavior. This executed the helper logic copied from the committed source; it is not the full repository test suite.
- Full `backend/test/otp-tenant-isolation.test.js`, `auth-company-selection.test.js`, `password-reset-workspace.test.js`, backend suite and frontend build: **Not run / Not verified** in this session.
- GitHub Actions exact-head status remains unavailable from the connected workflow interface. Empty combined-status/run lists are not passes.
- Authenticated login/OTP/forgot-password browser E2E remains unrun.

## 5. Plan and verification

- Plan: `cycles/CYCLE-01-PLAN-PHASE-31.md`.
- Initial plan verification: `cycles/CYCLE-01-PLAN-VERIFICATION-PHASE-31.md`.
- Design correction addenda record why cross-tenant public-schema enumeration is unsafe and why full multi-company membership is blocked on a Central mapping schema.
- D-003 acceptance criteria in `cycles/CYCLE-01-PLAN.md` now require Central user_id anchoring and fail-closed company binding.

## 6. Commit evidence

Key source commits:
- OTP helper tenant+company signature: `1910c97c8d3e9950dd3ec17261b1fdddd31119c8`
- Auth service first company binding: `b8a2a5ba22653fd068fc79327622cf4906415a2d`
- Company lookup route/UI initial increment: `bf04ddde5bbd79863b3a4df2adb3161a48b0c0fd`, `298b92091c9891ffc751279e671f713c9d09f83f`, `62bc5d7948b76e4803afa068fc6ca7b58ed1ea99`
- Central-index-only resolver: `65455bdb5a8072b6de97dbf58e20f5f5ebc0355c`
- Safe route binding: `7a0dd11880370f8498623e2b4b610fbf357f51ee`
- Case-insensitive Central index lookup: `20bbde776024825b1d9554aa9f0917149edb07f0`
- Forgot route tenant argument correction: `28b05ef6b93fc7347b7d451bd10aade9ea7250d7`
- Login UI company choice state: `0ffb5d26fa95db6fd2c8d51bbdc96e12c7a53e99`
- Company identity regression tests: `dbe758108c27d83a04af1ed19ca993370d0cd53d`, `88cb92d469275e2993dde2816b97fb43712c244b`
- OTP company namespace tests: `41d2f7b7c315f946b758fbbdb18789b4c2b7ae32`
- Password-reset company-binding test: `a1c31b04ec42e98839a24bf6ad890aa3400126f7`

Plan/verification and register updates are committed separately and indexed in the master handoff.

## 7. Full re-analysis and carry-forward

- GAP-0067: source now namespaces OTP by tenant + operational company + email; Fixed — Awaiting Verification.
- GAP-0068: safe indexed-user binding implemented; full multiple-company membership selection remains Open / Blocked on Central mapping schema and legacy backfill.
- HRMS-D-003 remains In Progress. Do not close until exact-head CI, real login/OTP/refresh/password-reset E2E, and membership mapping/backfill are addressed.
- HRMS-D-004 remains In Progress. Resume query-by-query operational ownership audit only after the identity/membership design is resolved; composite FK feasibility and Central deployed-role/catalog proof remain open.
- HRMS-D-005 remains Blocked on canonical PostgreSQL migration baseline. The required membership mapping must be designed there, not improvised in this phase.

## 8. Safety record

- `main` untouched.
- No production/customer DB connection or SQL execution.
- No schema migration/DDL, deployment, real payment, deletion, credential rotation or customer-data operation.


## 9. Final source and design references

Final source commit evidence:
- Auth service tenant-indexed identity resolver: `20bbde776024825b1d9554aa9f0917149edb07f0`
- Auth route tenant/company binding: `28b05ef6b93fc7347b7d451bd10aade9ea7250d7`
- OTP helper final tenant+company key: `1045f5cf6941983ffe691df236c100b2a2251663`
- Login UI final selection state: `f6d6ccf1a62b900fe35ec9ac6379e94711fb8ee2`
- Forgot-password UI final company state: `0956125e3e7608bace83fa06c2fc306eacff97ef`
- Company identity regression tests: `dbe758108c27d83a04af1ed19ca993370d0cd53d`
- OTP regression tests: `41d2f7b7c315f946b758fbbdb18789b4c2b7ae32`
- Password-reset company assertion: `41347ae12a504616dd43c34ad1a635534c0807b7`

The D-005 design dependency is now documented and verified for design-only work:
- Design proposal: `CYCLE-01-CENTRAL-TENANT-COMPANY-MEMBERSHIP-DESIGN-PHASE-32.md`
- Plan: `CYCLE-01-PLAN-PHASE-32.md`
- Independent verification: `CYCLE-01-PLAN-VERIFICATION-PHASE-32.md`
- D-005 plan update: `847669b8c09538113a1d60025f42e40e2da1f8db`

The design is not a frozen owner decision and authorizes no DDL. The listed membership semantics and legacy backfill authority must be resolved before any migration.
