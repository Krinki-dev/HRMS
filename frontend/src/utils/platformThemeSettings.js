const THEME_FIELD_TO_VAR = {
  primaryColor: '--color-primary',
  primaryColorHover: '--color-primary-hover',
  backgroundColor: '--bg-primary',
  secondaryBackgroundColor: '--bg-secondary',
  surfaceColor: '--bg-card',
  textColor: '--text-primary',
  textSecondaryColor: '--text-secondary',
  borderColor: '--border-color',
  accentSoft: '--accent-soft',
  sidebarColor: '--sidebar-bg',
  topbarColor: '--topbar-bg',
  successColor: '--color-success',
  warningColor: '--color-warning',
  dangerColor: '--color-danger',
};

function applyCssVar(root, cssVar, value) {
  if (!value || typeof value !== 'string') return;
  const normalized = value.trim();
  if (!normalized) return;
  root.style.setProperty(cssVar, normalized);
}

export function applyPlatformThemeSettings(platformSettings = {}) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  Object.entries(THEME_FIELD_TO_VAR).forEach(([field, cssVar]) => {
    applyCssVar(root, cssVar, platformSettings[field]);
  });

  // Keep admin aliases in sync with primary palette when present.
  applyCssVar(root, '--admin-accent', platformSettings.primaryColor);
  applyCssVar(root, '--admin-accent-soft', platformSettings.accentSoft);
  applyCssVar(root, '--admin-surface', platformSettings.surfaceColor);
  applyCssVar(root, '--admin-surface-muted', platformSettings.secondaryBackgroundColor);
  applyCssVar(root, '--admin-border', platformSettings.borderColor);
  applyCssVar(root, '--admin-text', platformSettings.textColor);
  applyCssVar(root, '--admin-text-secondary', platformSettings.textSecondaryColor);
}

export { THEME_FIELD_TO_VAR };
