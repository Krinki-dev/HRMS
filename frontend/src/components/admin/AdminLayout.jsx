import { useState } from 'react';
import { Outlet, NavLink, useLocation } from "react-router-dom";
import CompanyBrand from '../layout/CompanyBrand';
import ThemeToggle from '../ui/ThemeToggle';
import { useAuthStore } from "../../store/authStore";
import "../admin/AdminLayout.css";

const NAV_ITEMS = [
  { path: "/admin/dashboard",  icon: "â–¦", label: "Dashboard"  },
  { path: "/admin/clients",    icon: "â—‘", label: "Clients"     },
  { path: "/admin/plans",      icon: "ðŸ“Š", label: "Plans (Analytics)"  },
  { path: '/admin/pricing',    icon: "âš™ï¸", label: "Pricing & Plans" },
  { path: "/admin/domains",    icon: "âŠ•", label: "Domains"     },
  { path: "/admin/analytics",  icon: "â†—", label: "Analytics"   },
  { path: "/admin/marketing",  icon: "âœ¦", label: "Marketing"   },
  { path: "/admin/settings",   icon: "âŠž", label: "Settings"    },
];

const PAGE_META = {
  "/admin/dashboard":  { title: "Dashboard",  sub: "Platform overview"                    },
  "/admin/clients":    { title: "Clients",    sub: "All client accounts"                  },
  "/admin/plans":      { title: "Plans",      sub: "Revenue KPIs & subscription analytics" },
  "/admin/pricing":    { title: "Pricing & Plans", sub: "Manage plan catalog & pricing"   },
  "/admin/domains":    { title: "Domains",    sub: "Custom domain mappings"               },
  "/admin/analytics":  { title: "Analytics",  sub: "Platform-wide metrics"                },
  "/admin/marketing":  { title: "Marketing",  sub: "syntern.in public pages"              },
  "/admin/settings":   { title: "Settings",   sub: "Global platform settings"             },
};

export default function AdminLayout() {
  const location = useLocation();
  const [sidebarOpen] = useState(true);
  const { user } = useAuthStore();
  const meta = PAGE_META[location.pathname] || { title: "Admin", sub: "" };

  return (
    <div className="admin-shell">
      {}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">S</div>
          <div>
            <div className="brand-name">Syntern HRMS</div>
            <div className="brand-role">Super Admin</div>
          </div>
        </div>

        <><CompanyBrand sidebarOpen={sidebarOpen} /><nav className="sidebar-nav">
          {NAV_ITEMS.slice(0, 5).map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-btn${isActive ? " active" : ""}`}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          <div className="nav-divider" />
          {NAV_ITEMS.slice(5).map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-btn${isActive ? " active" : ""}`}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {user?.is_platform_admin && (
            <>
              <div className="nav-divider" />
              <NavLink to="/dashboard" className="nav-btn">
                <span className="nav-icon">ðŸ¢</span>
                My Company HR
              </NavLink>
            </>
          )}
        </nav></>

        <div className="sidebar-user">
          <div className="user-avatar">SA</div>
          <div>
            <div className="user-name">Super Admin</div>
            <div className="user-domain">syntern.in</div>
          </div>
        </div>
      </aside>

      {}
      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="topbar-title">{meta.title}</span>
            <span className="topbar-sub">{meta.sub}</span>
          </div>
          <div className="topbar-actions">
            <ThemeToggle />
            <NavLink to="/admin/clients/new" className="btn-primary">+ New client</NavLink>
            <span className="topbar-domain">syntern.in/admin</span>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
