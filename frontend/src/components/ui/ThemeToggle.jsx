import { useState, useEffect } from 'react';

const THEME_KEY = 'hrms-theme';

function getInitialTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  return 'dark';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch (error) {}
  }, [theme]);

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '20px',
        border: '1px solid var(--border-color, rgba(255,255,255,0.2))',
        background: 'var(--surface-color, rgba(255,255,255,0.1))',
        color: 'var(--text-primary, #fff)',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: '16px', lineHeight: 1 }}>
        {isDark ? '☀️' : '🌙'}
      </span>
      <span>{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
