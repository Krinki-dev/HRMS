import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import './ESSLayout.css';

const NAV = [
  { path: '/ess/dashboard',   icon: '▦', label: 'My dashboard'  },
  { path: '/ess/leave-apply', icon: '◈', label: 'Apply leave'   },
  { path: '/ess/payslips',    icon: '₹', label: 'My payslips'   },
];

const PAGE_META = {
  '/ess/dashboard':   { title: 'My dashboard',  sub: 'Your personal overview'          },
  '/ess/leave-apply': { title: 'Apply leave',   sub: 'Submit and track leave requests'  },
  '/ess/payslips':    { title: 'My payslips',   sub: 'Salary slips & tax documents'     },
};

export default function ESSLayout() {
  const location   = useLocation();
  const { user, logout } = useAuthStore();

  const meta = PAGE_META[location.pathname]
    || PAGE_META[Object.keys(PAGE_META).find(k => location.pathname.startsWith(k)) || '']
    || { title: 'ESS Portal', sub: '' };

  const companyName = user?.companyName || 'Your Company';
  const brandInit   = companyName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const userName    = user?.name || 'Employee';
  const userRole    = (user?.role || 'employee').replace(/_/g, ' ');
  const userInit    = userName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const empCode     = user?.employee?.id ? 'EMP' : '';

  return (
    <div className="ess-shell">
      <aside className="ess-sidebar">

        {}
        <div className="ess-brand">
          <div className="ess-brand-logo">{brandInit}</div>
          <div>
            <div className="ess-brand-name">{companyName}</div>
            <div className="ess-brand-tag">Employee Portal</div>
          </div>
        </div>

        {}
        <nav className="ess-nav">
          {NAV.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `ess-nav-btn${isActive ? ' active' : ''}`}
            >
              <span className="ess-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {}
        <div className="ess-footer">
          <div className="ess-avatar">{userInit}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ess-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userName}
            </div>
            <div className="ess-role" style={{ textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userRole}
            </div>
          </div>
        </div>

      </aside>

      {}
      <div className="ess-main">
        <header className="ess-topbar">
          <div>
            <span className="ess-topbar-title">{meta.title}</span>
            <span className="ess-topbar-sub">{meta.sub}</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {}
            {['admin','hr_admin','hr_manager','super_admin'].includes(user?.role) && (
              <NavLink to="/dashboard" className="ess-back-btn">← HR Admin</NavLink>
            )}
            <button
              onClick={() => { logout(); window.location.href = '/login'; }}
              style={{ fontSize: 11, padding: '4px 12px', background: 'transparent', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 6, cursor: 'pointer', color: '#64748b' }}
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="ess-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

