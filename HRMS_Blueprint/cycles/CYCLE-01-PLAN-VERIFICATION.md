# Cycle 01 Plan Verification — Review Round 1

**Date:** 2026-11-28 (Asia/Kolkata)  
**Plan:** `HRMS_Blueprint/cycles/CYCLE-01-PLAN.md`  
**Plan blob SHA reviewed:** `9b4b2b66fb20b3a21b79ade184191c226add7566`  
**Branch:** `architecture/postgres-tenant-isolation`  
**Result:** **NOT VERIFIED — required corrections**

This is an independent completeness and safety review of the draft plan against the master execution rules, frozen decisions, owner-decision register, and current gap register. No application code was changed.

## 1. Verification checklist

| Check | Result | Notes |
|---|---|---|
| P0 findings mapped to tasks | Pass with caveat | GAP-0020/0021 and core tenant/migration/backup tasks mapped |
| All P1 findings mapped | Fail | Several explicit findings are missing from task coverage |
| Frozen architecture preserved | Pass with correction | Operational RLS correctly treated as intentional; pricing wording needs clarification |
| Dependencies/sequencing | Fail | Provisioning retry appears in both C-006 and C-008; backup scheduler duplicated in F-007/F-012 |
| Acceptance criteria testable | Pass with caveat | Most are measurable; add exact route/UI criteria for omitted frontend gaps |
| Safety gates explicit | Pass | Production DB, deployment, payment, deletion and external DB connection gates are present |
| Owner decisions isolated | Pass with correction | Pricing question should distinguish employee caps from per-employee pricing |
| No unauthorized production action implied | Pass | Explicit exclusions are clear |

## 2. Required corrections before verification

### R1 — Add missing frontend route/navigation findings
- GAP-0015 legacy tenant HR frontend `/hr` APIs not mounted.
- GAP-0016 HR sidebar links and active route paths inconsistent.
- GAP-0017 ESS nested absolute child routes do not begin with `/ess`.
- Add these to HRMS-E-009 / HRMS-A-015 with route-by-route browser tests and preserve route ownership/permissions.

### R2 — Add database credential handling findings
- GAP-0044 legacy DB config stores cloud DB URL/local password without encryption and returns cloud URL unredacted.
- GAP-0045 legacy DB Settings UI/API does not update canonical active tenant storage routing and offers unsupported database types.
- Expand HRMS-C-006 to require removal/disablement of legacy write paths, encryption at rest, response redaction, PostgreSQL-only validation and explicit deprecation.
- Acceptance: GET never returns raw credentials; secrets encrypted at rest; unsupported DB modes rejected; legacy UI cannot imply that active routing changed.

### R3 — Add encryption helper hardening
- GAP-0064 hard-coded fallback key is not mapped to a task.
- Add a dedicated task requiring removal of the fallback, fail-closed module loading in every process, key rotation/legacy compatibility design, and tests for missing/invalid key and tampered ciphertext.

### R4 — Add attendance request metadata defect
- GAP-0040 controller/service argument mismatch is not mapped.
- Add to HRMS-A-015 or HRMS-A-010 with explicit test that check-in geolocation/IP metadata reaches the service only under approved privacy policy and that employee self-service ownership is enforced.

### R5 — Remove duplicate tasks
- HRMS-C-006 already includes provisioning retry/recovery; HRMS-C-008 duplicates it. Merge C-008 into C-006 or make C-008 a clearly distinct verification task.
- HRMS-F-007 already includes backup scheduler repair; HRMS-F-012 must focus on durable KYC queue only and not duplicate backup scheduling.

### R6 — Add a complete gap-to-task traceability matrix
The plan needs one explicit table mapping GAP-0001 through GAP-0065 to:
- task ID,
- status/disposition (open, merged into parent, superseded, or positive control),
- evidence/report location.

This is necessary to prove no finding silently disappears and to make later progress tracking deterministic.

### R7 — Clarify pricing decision
Frozen decisions state employee counts are unlimited on all plans. This does not by itself settle whether the price is flat or per employee. The current plan correctly records an owner decision, but rewrite OD-01 to ask only:
- Is there no hard employee cap but per-employee pricing may still apply?
- Or should all plan/add-on pricing be flat regardless of active employee count?
Do not reopen the already frozen “no hard employee cap” decision.

### R8 — Add access-token regression test
Current authStore correctly excludes accessToken from persisted Zustand state. Add a regression test to HRMS-F-014 so this positive security control cannot regress.

## 3. Required sequencing corrections

- Keep C-002 and D-001 as early P0 fixes; D-001 must use the identity contract established by D-003.
- D-004 precedes D-005; D-005 precedes C-006 paid storage lifecycle changes.
- F-007 remains a deletion gate and must not be used to authorize customer cleanup until a real isolated restore drill passes.
- F-012 durable queue must be independent of backup scheduler work.
- F-014 tests should be introduced with each implementation batch, not treated as an end-of-project gate only.

## 4. Re-review rule

Do not implement from the current draft. Revise `CYCLE-01-PLAN.md`, add the complete traceability matrix, then perform a fresh review and record the new plan blob SHA. The plan can be marked Verified only if all R1–R8 items are satisfied and no frozen decision or safety gate is contradicted.


---

# Cycle 01 Plan Verification — Review Round 2

**Date:** 2026-11-28 (Asia/Kolkata)  
**Plan blob SHA reviewed:** `7c3895a58e6553edaa4fdc346ed41be6e0ce4f4b`  
**Result:** <VERIFIED>

Round 2 reviewed the revised plan from the beginning against R1–R8 and the frozen decisions. The plan was re-fetched from the working branch; its traceability matrix was checked programmatically for all 65 current gap IDs (GAP-0001 through GAP-0065), with no missing ID.

## 1. Corrections confirmed

| Required correction | Result | Evidence in revised plan |
|---|---|---|
| R1 — legacy HR API, sidebar and ESS route gaps | Pass | HRMS-E-009 includes GAP-0015/0016/0017; HRMS-A-015 includes browser E2E |
| R2 — legacy DB credentials/config | Pass | HRMS-C-006 includes GAP-0044/0045, encryption at rest, response redaction, PostgreSQL-only validation and legacy path deprecation |
| R3 — encryption helper fallback | Pass | HRMS-F-019 includes GAP-0064, fail-closed helper and process tests |
| R4 — attendance metadata | Pass | HRMS-A-015 includes GAP-0040 and privacy-limited metadata verification |
| R5 — duplicate tasks | Pass | C-008 merged into C-006; F-012 now covers only durable KYC queue; backup scheduling stays in F-007 |
| R6 — full gap traceability | Pass | Matrix maps every GAP-0001–GAP-0065; superseded/merged findings are explicitly identified |
| R7 — pricing wording | Pass | Frozen no-hard-employee-cap decision remains settled; only flat-vs-per-employee pricing is an owner decision |
| R8 — access-token regression | Pass | HRMS-F-014 adds a test that accessToken is excluded from persistence and legacy values are purged |

## 2. Safety and architecture verification

- PostgreSQL-only, Prisma and modular monolith constraints are preserved.
- Free/Trial shared public and Paid UUID-derived schema lifecycle is preserved.
- Operational DB isolation remains tenant routing + explicit company_id filters under frozen design; no unapproved operational RLS redesign is proposed.
- Central RLS, non-owner role verification and fresh-install policy parity are included.
- Memory-only access token and httpOnly refresh cookie requirements are preserved.
- AES-256-GCM remains the current write codec; incompatible legacy PII migration is explicitly prohibited.
- Customer-managed DB connectivity remains disabled pending SSRF/network policy verification.
- Paid activation waits for dedicated storage readiness.
- Backup/restore is a prerequisite for deletion; destructive deletion remains gated.
- Production migrations, deployment, real payments, customer data changes and key rotation require separate explicit approval.
- CI and tests are required at exact commit SHA; no test/CI success is asserted by this plan.

## 3. Dependency and task quality review

- P0 WebSocket, webhook/startup, identity, shared isolation, migration and storage tasks are distinct and have objective tests.
- D-003 → D-004 → D-005 → C-006 sequencing is correct.
- F-007 is independent as a backup/restore gate and does not duplicate the durable queue task.
- P1 API, permission/ownership, files, queue, deployment, CI and core workflow tasks are assigned.
- P2 import/export, module completeness and index optimisation remain after P0/P1 gates.
- Owner decisions are isolated and do not block unrelated security tasks.
- Each task has acceptance criteria, test expectations and safety constraints.

## 4. Final result

<badge color="success">VERIFIED</badge>

The revised Cycle 01 plan is **Verified for implementation planning**. This verification does not authorize production database changes, deployment, real payments, destructive data operations, customer DB connections, or production secret/key changes. It also does not mean any task is implemented or tested.

Implementation may begin on the protected working branch only, in small task-mapped commits, with tests added alongside each change. Re-verify each task after implementation and re-run the full audit at cycle end.
