import React from 'react';
import { useAuthStore } from '../../store/authStore';

// Fallback Syntern platform logo (shown when no tenant logo is set)

export default function CompanyBrand({ sidebarOpen = true }) {
  const { companyLogoUrl, companyName } = useAuthStore();

  // Build initials from company name for avatar fallback
  const initials = (companyName || 'S')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  // Decide which logo src to use
  const logoSrc = companyLogoUrl || null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: sidebarOpen ? '14px 16px 10px' : '14px 8px 10px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        minHeight: 64,
        overflow: 'hidden',
      }}
    >
      {/* Logo / Initials avatar */}
      <div
        style={{
          flexShrink: 0,
          width: 36,
          height: 36,
          borderRadius: 8,
          overflow: 'hidden',
          background: logoSrc ? 'transparent' : '#4f46e5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {logoSrc ? (
          <img
            src={logoSrc}
            alt={companyName || 'Company Logo'}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement.style.background = '#4f46e5';
              e.currentTarget.parentElement.innerHTML =
                '<span style="color:#fff;font-size:13px;font-weight:700">' + initials + '</span>';
            }}
          />
        ) : (
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
            {initials}
          </span>
        )}
      </div>

      {/* Company name + tagline — only when sidebar is open */}
      {sidebarOpen && (
        <div style={{ overflow: 'hidden' }}>
          <div
            style={{
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 148,
            }}
          >
            {companyName || 'My Company'}
          </div>
          <div
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.45)',
              marginTop: 1,
              whiteSpace: 'nowrap',
            }}
          >
            Powered by Syntern
          </div>
        </div>
      )}
    </div>
  );
}
