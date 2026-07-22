# Theme Migration Status

Generated: 2026-07-22
Owner: Frontend System Audit

## Objective

- Centralize visual tokens in shared variable containers.
- Reduce hardcoded styling values in page files.
- Drive admin dashboard palette via settings, without manual code edits.
- Preserve an in-repo status ledger to continue migration safely across sessions.

## Variable Container Baseline

- Source tokens: frontend/src/styles/theme.css
- Runtime provider: frontend/src/context/ThemeContext.jsx
- Admin runtime mapper: frontend/src/utils/platformThemeSettings.js
- Settings source: backend `/api/v1/platform/admin/settings` section `Platform`

## Completed in This Pass

- Added runtime mapping utility from settings keys -> CSS variables.
- Wired admin layout to fetch settings and apply variables globally.
- Expanded platform settings form with theme variable fields.
- Fixed tenant-domain helper to include preview-host info in shared utility.
- Improved billing page error/loading transparency and retry behavior.

## Findings (Current)

- Hardcoded color literals are still present across many page components using inline style blocks.
- Theme constants are duplicated between frontend/src/utils/theme.js and frontend/src/styles/theme.css.
- Some admin and marketing pages still rely on local style constants instead of CSS tokens.

### Hardcoded style literal hotspots (count)

- frontend/src/pages/landing/LandingPage.jsx: 136
- frontend/src/pages/gst-public/GstPublicPage.jsx: 88
- frontend/src/pages/ess/ESSPages.jsx: 87
- frontend/src/pages/auth/SmartLoginPage.jsx: 72
- frontend/src/pages/admin/PricingManager.jsx: 66
- frontend/src/pages/platform/SynternAdminPages.jsx: 61
- frontend/src/pages/auth/CompanyRegisterPage.jsx: 50
- frontend/src/pages/onboarding/OnboardingWizard.jsx: 33

## Next Migration Sequence

1. Admin pages
   - AdminDashboard, AdminAnalytics, AdminClients, AdminMarketing, PricingManager
2. Auth + onboarding pages
   - SmartLoginPage, CompanyRegisterPage, OnboardingWizard, PlanSelectionStep
3. HR + ESS pages
   - HRDashboard, HRSettings, ESSPages
4. Operational modules
   - Employees, Attendance, Leave, Payroll, Compliance, Recruitment
5. Public pages
   - LandingPage, GST public pages

## Rule of Done for Each Page

- No new hardcoded color values added.
- Existing hardcoded color values replaced with CSS variables where safe.
- Component styling uses theme tokens from theme.css or runtime variable mapping.
- Build passes after each migration batch.

## Session Continuity Notes

- Keep this file updated after every migration batch.
- Use FRONTEND_PAGE_TREE.md for page-order tracking.
- Record only delta changes and unresolved blockers.

## Latest Delta (2026-07-22)

- Added frontend/src/utils/platformThemeSettings.js to map `Platform` settings values to runtime CSS variables.
- Wired frontend/src/components/admin/AdminLayout.jsx to auto-apply `/platform/admin/settings` theme values.
- Expanded frontend/src/pages/admin/AdminSettings.jsx (`Platform` section) with editable theme tokens.
- Fixed frontend/src/utils/tenantDomain.js to expose `isPreviewHost` through shared getter/export.
- Converted frontend/src/utils/theme.js color values from hardcoded literals to CSS variable references.

## Regression Recovery (2026-07-22)

- Root cause identified: admin page utility classes were stripped from frontend/src/pages/admin/AdminLayout.css, breaking grid/card/table layout and causing large blank vertical flow.
- Disabled automatic runtime admin theme override from settings in frontend/src/components/admin/AdminLayout.jsx to preserve previous visual baseline.
- Moved theme token controls into a dedicated `Theme` tab in frontend/src/pages/admin/AdminSettings.jsx so platform operational settings stay clean.
- Restored compact admin utility CSS classes (`stats-grid-4`, `admin-page-grid-2`, `card`, `data-table`, `btn-sm`, modal/alerts/forms), matching pre-centralization layout behavior.
- Added frontend fallback baseline plans in frontend/src/pages/admin/PricingManager.jsx to ensure 3 plan cards remain visible even when API returns an empty catalog.
