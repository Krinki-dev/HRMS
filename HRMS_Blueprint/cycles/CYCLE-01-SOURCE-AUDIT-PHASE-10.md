# Cycle 01 — Fresh Source Audit (Phase 10: Import/Export and CSV Safety)

- Audit ID: HRMS-C01-AUDIT-P10
- Repository: Krinki-dev/HRMS
- Branch: architecture/postgres-tenant-isolation
- Source SHA inspected: 60c8c37f5603220897a94ae40b1a1b9ba3d1289b
- Date: 2026-11-27
- Status: In Progress — employee import/export and shared workbook validation contract reviewed.
- Application code changed: No.

## 1. C01-IO-001 — Relational XLSX workbook schema is validation-only, not a working import/export pipeline

**Severity:** P2 — required product capability incomplete.

**Evidence:**
- employees.controller.js bulkImport accepts req.body.rows as JSON and validates first/last name; it does not accept or parse an uploaded workbook.
- Employee template and export endpoints return CSV (downloadTemplate and downloadExportCsv).
- employee-workbook.schema.js defines six relational sheets for an XLSX workbook.
- shared/import-export/workbookSchema.js exports only IMPORT_MODES and validateWorkbookData. It validates in-memory sheet arrays and references; it does not parse XLSX, generate XLSX, persist rows, produce previews, or execute transactional import/export.
- employees.routes.js exposes only /bulk-import, /bulk-import/template and /export.csv for this feature. No XLSX upload/download endpoint is mounted.
- Reports routes currently expose attendance summary and payroll summary only; no module-wide import/export routes were found in the reviewed route inventory.

**Impact:** The relational XLSX contract and validation unit tests can pass while users still have no actual XLSX import/export workflow. The current employee JSON/CSV path is not the required reusable CSV + relational XLSX pipeline across all HRMS modules.

**Required direction:** Implement a shared pipeline in stages: upload/parse with strict size and format controls; schema-driven preview and row-level validation; stable foreign-key/reference resolution; dry-run; transactional create/update/upsert; row-level error report; audit log; CSV/XLSX export with field permissions and formula-injection protection. Then register module schemas and implement each module's dependencies.

**Acceptance tests:** Employees workbook imports all six relational sheets transactionally; duplicate/invalid references are rejected; dry-run does not mutate; partial failures do not leave inconsistent rows; round-trip export/import is deterministic. Other modules have their own explicit schemas and tests before claiming support.

## 2. C01-SEC-009 — Employee CSV export does not neutralize spreadsheet formula injection

**Severity:** P1 — exported-data safety.

**Evidence:**
- employees.controller.js downloadExportCsv serializes employee-controlled fields into CSV.
- Its escapeCsv helper doubles embedded quotes and wraps the value in quotes, but does not neutralize values whose first effective character is =, +, -, @, tab or carriage return.
- Employee names, emails and other text fields can originate from users/imports.

**Impact:** When a downloaded CSV is opened in Excel or another spreadsheet application, malicious values may be interpreted as formulas. CSV quoting alone is not a complete formula-injection mitigation.

**Required direction:** Apply a tested spreadsheet-safe serialization policy to every untrusted textual cell (including leading whitespace/control characters before formula markers), and keep raw machine-readable export separate if needed. Do not mutate stored data; neutralize only at export serialization.

**Acceptance tests:** Inputs beginning with =, +, -, @, tab, CR and whitespace-prefixed formula markers export as inert text; commas, quotes, Unicode and newlines remain valid CSV; normal numeric/date values preserve intended types.

## 3. Positive observations

- The relational workbook schema describes Employees, ContactDetails, Addresses, Family, Education and PreviousEmployment with Employee Code references.
- The validator rejects unknown sheets, duplicate keys, invalid field values, invalid references and formula/non-primitive cell values.
- Employee bulk import is bounded to 1,000 JSON rows and checks sensitive payload permissions for protected fields.
- Employee CSV export is company-scoped through exportList(req.db, req.user.companyId, filters).

## 4. Audit status

This phase adds GAP-0038 and GAP-0039. The import/export pipeline is not complete. No data was imported/exported and no code was changed.
