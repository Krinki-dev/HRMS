import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import ThemeToggle from '../ui/ThemeToggle';
import './AdminLayout.css';

const NAV_ITEMS = [
  { path: '/admin/dashboard', icon: '\uD83C\uDFE2', label: 'Dashboard'        },
  { path: '/admin/clients',   icon: '\uD83D\uDC65', label: 'Clients'          },
  { path: '/admin/plans',     icon: '\uD83D\uDCCA', label: 'Plans (Analytics)'},
  { path: '/admin/pricing',   icon: '\uD83C\uDFF7', label: 'Pricing & Plans'  },
  { path: '/admin/domains',   icon: '\uD83C\uDF10', label: 'Domains'          },
  { path: '/admin/analytics', icon: '\uD83D\uDCC8', label: 'Analytics'        },
  { path: '/admin/marketing', icon: '\uD83D\uDCE3', label: 'Marketing'        },
  { path: '/admin/settings',  icon: '\u2699\uFE0F',  label: 'Settings'        },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const displayName = user?.name ?? user?.email ?? 'Super Admin';
  const displayDomain = user?.domain ?? 'syntern.in';
  const initials = displayName.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'16px', borderBottom:'1px solid var(--border-color)' }}>
          <div className="brand-icon">S</div>
          <div>
            <div className="brand-company">Syntern HRMS</div>
            <div className="brand-role">Super Admin</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
          <div className="nav-divider" />
          <NavLink to="/platform" className="nav-btn">
            <span className="nav-icon">\uD83C\uDFE2</span>
            <span>My Company HR</span>
          </NavLink>
        </nav>
        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div>
            <div className="user-role">{displayName}</div>
            <div className="user-domain">{displayDomain}</div>
          </div>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="topbar-title">Admin Dashboard</div>
            <div className="topbar-sub">Platform overview</div>
          </div>
          <div className="topbar-actions">
            <span className="topbar-domain">{displayDomain}</span>
            <NavLink to="/admin/clients/new" className="btn-primary">+ New client</NavLink>
            <ThemeToggle />
            <button className="nav-btn" style={{ width:'auto' }} onClick={handleLogout}>
              \uD83D\uDEAA Logout
            </button>
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
