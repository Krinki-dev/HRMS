# Theme Cleanup Notes

## What changed

- Added shared light/dark Mac-style theme tokens in `frontend/src/styles/theme.css`.
- Added a reusable `ThemeToggle` component.
- Added the theme switch to the Platform Admin top bar.
- Connected startup theme loading in `frontend/src/main.jsx` using `localStorage` key `hrms-theme`.
- Kept `frontend/src/components/admin/AdminLayout.css` as the active admin layout stylesheet.
- Converted `frontend/src/pages/admin/AdminLayout.css` into a small compatibility bridge so it no longer overrides the main admin theme.
- Fixed low-contrast text in Login and Company Register screens.
- Fixed HR layout company brand state so it follows the collapsed sidebar.

## Important CSS ownership

- Active admin layout CSS: `frontend/src/components/admin/AdminLayout.css`
- Legacy admin page bridge: `frontend/src/pages/admin/AdminLayout.css`
- Shared app theme tokens: `frontend/src/styles/theme.css`

New UI should use CSS variables like `var(--app-bg)`, `var(--app-surface-solid)`, `var(--app-text)`, `var(--app-text-muted)`, `var(--app-border)`, and `var(--app-accent)` instead of hard-coded page colors.