import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

const NAV_SECTIONS = [
  {
    id: 'main',
    label: 'Main',
    items: [
      { to: '/dashboard', icon: '▦', label: 'Dashboard', end: true, perm: null },
    ],
  },
  {
    id: 'people',
    label: 'People',
    items: [
      { to: '/employees',  icon: '👥', label: 'Employees',  perm: 'employees' },
      { to: '/attendance', icon: '🕐', label: 'Attendance', perm: 'attendance' },
      { to: '/leave',      icon: '🏖', label: 'Leave',      perm: 'leave' },
    ],
  },
  {
    id: 'payroll',
    label: 'Payroll',
    items: [
      { to: '/payroll',              icon: '💰', label: 'Payroll Runs',  perm: 'payroll', end: true },
      { to: '/payroll/salary-setup', icon: '⚙', label: 'Salary Setup',  perm: 'payroll' },
      { to: '/payroll/reports',      icon: '📊', label: 'Reports',       perm: 'payroll' },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance',
    items: [
      { to: '/compliance',          icon: '📋', label: 'Overview',    perm: 'compliance', end: true },
      { to: '/compliance/pf',       icon: '🏦', label: 'PF',          perm: 'compliance' },
      { to: '/compliance/esi',      icon: '🏥', label: 'ESI',         perm: 'compliance' },
      { to: '/compliance/pt',       icon: '📄', label: 'Prof. Tax',   perm: 'compliance' },
      { to: '/compliance/tds',      icon: '💸', label: 'TDS',         perm: 'compliance' },
      { to: '/compliance/lwf',      icon: '🤝', label: 'LWF',         perm: 'compliance' },
      { to: '/compliance/calendar', icon: '📅', label: 'Calendar',    perm: 'compliance' },
    ],
  },
  {
    id: 'recruitment',
    label: 'Recruitment',
    items: [
      { to: '/recruitment',              icon: '🎯', label: 'Overview',      perm: 'recruitment', end: true },
      { to: '/recruitment/requisitions', icon: '📝', label: 'Requisitions',  perm: 'recruitment' },
      { to: '/recruitment/jobs',         icon: '💼', label: 'Job Openings',  perm: 'recruitment' },
      { to: '/recruitment/pipeline',     icon: '👤', label: 'Pipeline',      perm: 'recruitment' },
      { to: '/recruitment/interviews',   icon: '🗓', label: 'Interviews',    perm: 'recruitment' },
    ],
  },
  {
    id: 'more',
    label: 'More',
    items: [
      { to: '/performance', icon: '🏆', label: 'Performance', perm: 'performance' },
      { to: '/training',    icon: '📚', label: 'Training',    perm: 'training' },
      { to: '/assets',      icon: '💻', label: 'Assets',      perm: 'assets' },
      { to: '/expenses',    icon: '🧾', label: 'Expenses',    perm: 'expenses' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    items: [
      { to: '/settings',       icon: '⚙', label: 'Settings',          perm: 'settings', end: true },
      { to: '/settings/roles', icon: '🔐', label: 'Roles & Perms',    perm: 'settings' },
      { to: '/settings/audit', icon: '📋', label: 'Audit Log',         perm: 'audit' },
      { to: '/automation',     icon: '🤖', label: 'Automation',        perm: 'automation' },
    ],
  },
];

const BREADCRUMBS = {
  '/dashboard':                    'Dashboard',
  '/employees':                    'Employees',
  '/employees/add':                'Add Employee',
  '/employees/import':             'Import Employees',
  '/attendance':                   'Attendance',
  '/attendance/shifts':            'Shift Assignment',
  '/attendance/corrections':       'Attendance Corrections',
  '/leave':                        'Leave',
  '/leave/apply':                  'Apply Leave',
  '/leave/approvals':              'Leave Approvals',
  '/leave/balance':                'Leave Balance',
  '/payroll':                      'Payroll',
  '/payroll/run':                  'Run Payroll',
  '/payroll/salary-setup':         'Salary Setup',
  '/payroll/reports':              'Payroll Reports',
  '/compliance':                   'Compliance',
  '/compliance/pf':                'Provident Fund',
  '/compliance/esi':               'ESI',
  '/compliance/tds':               'TDS',
  '/compliance/pt':                'Professional Tax',
  '/compliance/lwf':               'Labour Welfare Fund',
  '/compliance/calendar':          'Compliance Calendar',
  '/recruitment':                  'Recruitment',
  '/recruitment/requisitions':     'Requisitions',
  '/recruitment/jobs':             'Job Openings',
  '/recruitment/pipeline':         'Candidate Pipeline',
  '/recruitment/interviews':       'Interviews',
  '/performance':                  'Performance',
  '/training':                     'Training',
  '/assets':                       'Assets',
  '/expenses':                     'Expenses',
  '/settings':                     'Settings',
  '/settings/roles':               'Roles & Permissions',
  '/settings/audit':               'Audit Log',
  '/automation':                   'Automation',
};

export default function MainLayout() {
  const [sidebarOpen,   setSidebarOpen]   = useState(true);
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [userMenuOpen,  setUserMenuOpen]  = useState(false);
  
  const [collapsed, setCollapsed] = useState({});

  const { user, logout } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors
    }
    logout();
    navigate('/login');
  }

  function toggleSection(id) {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function canSee(perm) {
    if (!perm) return true;
    const p = user?.permissions?.[perm];
    if (!p) return false;
    return p.view === true;
  }

  const breadcrumb = BREADCRUMBS[location.pathname] || '';

  const sidebarContent = (
    <>
      {}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 16px', borderBottom: '1px solid #1E293B',
        flexShrink: 0,
      }}>
        <div style={{
          width: 32, height: 32, background: '#2563EB', borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: 14, flexShrink: 0,
        }}>S</div>
        {sidebarOpen && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>Syntern HRMS</div>
            <div style={{ color: '#475569', fontSize: 11, marginTop: 1 }}>
              {user?.role?.replace('_', ' ') || 'User'}
            </div>
          </div>
        )}
      </div>

      {}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {NAV_SECTIONS.map(section => {
          const visibleItems = section.items.filter(item => canSee(item.perm));
          if (visibleItems.length === 0) return null;
          const isCollapsed = collapsed[section.id];

          return (
            <div key={section.id} style={{ marginBottom: 4 }}>
              {}
              {sidebarOpen ? (
                <button
                  onClick={() => toggleSection(section.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 16px 4px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#475569', fontSize: 11, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                  <span>{section.label}</span>
                  <span style={{ fontSize: 9, transition: 'transform 0.2s', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)' }}>▾</span>
                </button>
              ) : (
                <div style={{ margin: '6px 8px', borderTop: '1px solid #1E293B' }} />
              )}

              {}
              {!isCollapsed && visibleItems.map((item, i) => (
                <NavLink
                  key={i}
                  to={item.to}
                  end={item.end}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: sidebarOpen ? 10 : 0,
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    margin: '1px 8px',
                    padding: sidebarOpen ? '7px 10px' : '8px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#fff' : '#94A3B8',
                    background: isActive ? '#2563EB' : 'transparent',
                    transition: 'background 0.15s, color 0.15s',
                  })}
                  onMouseEnter={e => { if (!e.currentTarget.style.background.includes('2563')) e.currentTarget.style.background = '#1E293B'; }}
                  onMouseLeave={e => { if (!e.currentTarget.style.background.includes('2563')) e.currentTarget.style.background = 'transparent'; }}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
                  {sidebarOpen && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {}
      <div style={{ padding: '10px 8px', borderTop: '1px solid #1E293B', flexShrink: 0 }}>
        {sidebarOpen ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 8,
            background: '#0F172A',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: '#1D4ED8', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ color: '#E2E8F0', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'User'}
              </div>
              <div style={{ color: '#475569', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#1D4ED8', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, margin: '0 auto',
          }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
      </div>

      {}
      <button
        onClick={() => setSidebarOpen(s => !s)}
        style={{
          margin: '0 8px 8px', padding: '7px',
          background: 'none', border: '1px solid #1E293B',
          borderRadius: 8, color: '#475569', cursor: 'pointer',
          fontSize: 11, display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 6,
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#94A3B8'}
        onMouseLeave={e => e.currentTarget.style.color = '#475569'}
      >
        {sidebarOpen ? '◄ Collapse' : '►'}
      </button>
    </>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F8FAFC', overflow: 'hidden' }}>

      {}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 40, display: 'none',
          }}
          className="mobile-backdrop"
        />
      )}

      {}
      <aside style={{
        width: sidebarOpen ? 220 : 56,
        background: '#0B1120',
        display: 'flex', flexDirection: 'column',
        flexShrink: 0,
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}>
        {sidebarContent}
      </aside>

      {}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {}
        <header style={{
          background: '#fff',
          borderBottom: '1px solid #E2E8F0',
          padding: '0 24px',
          height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {}
            <button
              onClick={() => setMobileOpen(m => !m)}
              style={{
                display: 'none', 
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#64748B', fontSize: 18, padding: 4,
              }}
              className="mobile-menu-btn"
            >
              ☰
            </button>
            {}
            {breadcrumb && (
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>
                {breadcrumb}
              </span>
            )}
          </div>

          {}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {user?.is_platform_admin && (
              <Link
                to="/admin/dashboard"
                style={{
                  marginRight: 16,
                  padding: '5px 12px',
                  background: '#0F172A',
                  color: '#E2E8F0',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                  border: '1px solid #334155',
                }}
              >
                ⚡ Platform Admin
              </Link>
            )}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen(u => !u)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '6px 10px', borderRadius: 8,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: '#EFF6FF', color: '#2563EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
              }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', lineHeight: 1.3 }}>
                  {user?.name || 'User'}
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1 }}>
                  {user?.role?.replace(/_/g, ' ')}
                </div>
              </div>
              <span style={{ fontSize: 10, color: '#94A3B8', marginLeft: 2 }}>▾</span>
            </button>

            {userMenuOpen && (
              <>
                {}
                <div
                  onClick={() => setUserMenuOpen(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 49 }}
                />
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                  width: 220, background: '#fff',
                  borderRadius: 12, border: '1px solid #E2E8F0',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  zIndex: 50, overflow: 'hidden',
                }}>
                  {}
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: '#EFF6FF', color: '#2563EB',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, flexShrink: 0,
                      }}>
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user?.name}
                        </div>
                        <div style={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user?.email}
                        </div>
                        <div style={{
                          display: 'inline-block', marginTop: 3,
                          fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                          letterSpacing: '0.04em', color: '#2563EB',
                          background: '#EFF6FF', padding: '2px 6px', borderRadius: 4,
                        }}>
                          {user?.role?.replace(/_/g, ' ')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {}
                  {[
                    { icon: '⚙', label: 'Settings',        onClick: () => { setUserMenuOpen(false); navigate('/settings'); } },
                    { icon: '🔐', label: 'Change password', onClick: () => { setUserMenuOpen(false); navigate('/change-password'); } },
                  ].map((item, i) => (
                    <button key={i} onClick={item.onClick} style={{
                      width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 13, color: '#374151', transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <span style={{ fontSize: 15 }}>{item.icon}</span> {item.label}
                    </button>
                  ))}

                  <div style={{ borderTop: '1px solid #F1F5F9' }}>
                    <button onClick={handleLogout} style={{
                      width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 13, color: '#EF4444', transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <span style={{ fontSize: 15 }}>↩</span> Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        </header>

        {}
        <main style={{ flex: 1, overflowY: 'auto', padding: '14px 20px', display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

