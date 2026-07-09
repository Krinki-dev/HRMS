import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import ThemeToggle from '../ThemeToggle';
import './AdminLayout.css';
import {
  LayoutDashboard,
  Users,
  BarChart2,
  CreditCard,
  Globe,
  TrendingUp,
  Megaphone,
  Settings,
  Building2,
  LogOut,
  PlusCircle,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/admin/dashboard',  icon: LayoutDashboard,  label: 'Dashboard'          },
  { path: '/admin/clients',    icon: Users,             label: 'Clients'            },
  { path: '/admin/plans',      icon: BarChart2,         label: 'Plans (Analytics)'  },
  { path: '/admin/pricing',    icon: CreditCard,        label: 'Pricing & Plans'    },
  { path: '/admin/domains',    icon: Globe,             label: 'Domains'            },
  { path: '/admin/analytics',  icon: TrendingUp,        label: 'Analytics'          },
  { path: '/admin/marketing',  icon: Megaphone,         label: 'Marketing'          },
  { path: '/admin/settings',   icon: Settings,          label: 'Settings'           },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const displayName   = user?.name   ?? user?.email ?? 'Super Admin';
  const displayDomain = user?.domain ?? 'syntern.in';
  const initials      = displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="admin-layout">
      {/* ── Sidebar ─────────────────────────────── */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">S</div>
          <div>
            <div className="brand-company">Syntern HRMS</div>
            <div className="brand-role">Super Admin</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
            >
              <Icon size={18} className="nav-icon" />
              <span>{label}</span>
            </NavLink>
          ))}

          <div className="nav-divider" />

          <NavLink to="/platform" className="nav-btn">
            <Building2 size={18} className="nav-icon" />
            <span>My Company HR</span>
          </NavLink>
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div>
            <div className="user-name">{displayName}</div>
            <div className="user-domain">{displayDomain}</div>
          </div>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────── */}
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="topbar-title-group">
            <div className="topbar-title">Admin Dashboard</div>
            <div className="topbar-sub">Platform overview</div>
          </div>

          <div className="topbar-actions">
            <span className="topbar-domain">{displayDomain}</span>

            <NavLink to="/admin/clients/new" className="btn-primary">
              <PlusCircle size={16} />
              New client
            </NavLink>

            <ThemeToggle />

            <button className="btn-logout" onClick={handleLogout} aria-label="Logout">
              <LogOut size={16} />
              Logout
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
