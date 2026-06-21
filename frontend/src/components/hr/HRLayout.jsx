import { useState, useEffect, useRef } from 'react';
import CompanyBrand from '../layout/CompanyBrand';
import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import './HRLayout.css';

const ALL_NAV = [
  { path: '/dashboard',   icon: '▦', label: 'Dashboard',    roles: ['*'] },
  { path: '/employees',   icon: '◉', label: 'Employees',    roles: ['super_admin','admin','hr_admin','hr_manager','manager'] },
  { path: '/attendance',  icon: '◷', label: 'Attendance',   roles: ['*'] },
  { path: '/leaves',      icon: '◈', label: 'Leaves',       roles: ['*'] },
  { path: '/payroll',     icon: '₹', label: 'Payroll',      roles: ['super_admin','admin','hr_admin','accountant'] },
  { path: '/compliance',  icon: '📋', label: 'Compliance',  roles: ['super_admin','admin','hr_admin','accountant'] },
  { path: '/recruitment', icon: '⊕', label: 'Recruitment',  roles: ['super_admin','admin','hr_admin','hr_manager'] },
  { path: '/performance', icon: '↗', label: 'Performance',  roles: ['super_admin','admin','hr_admin','hr_manager','manager'] },
  { path: '/automation',  icon: '🤖', label: 'Automation',  roles: ['super_admin','admin','hr_admin'] },
];

const SETTINGS_NAV = [
  { path: '/settings', icon: '⊞', label: 'Settings', roles: ['super_admin','admin','hr_admin'] },
];

const PAGE_META = {
  '/dashboard':   { title: 'Dashboard',    sub: 'Company overview' },
  '/employees':   { title: 'Employees',    sub: 'Manage your workforce' },
  '/attendance':  { title: 'Attendance',   sub: 'Track daily attendance' },
  '/leaves':      { title: 'Leaves',       sub: 'Leave requests & policy' },
  '/payroll':     { title: 'Payroll',      sub: 'Salary & payslips' },
  '/compliance':  { title: 'Compliance',   sub: 'PF · ESI · TDS · PT · LWF' },
  '/recruitment': { title: 'Recruitment',  sub: 'Jobs & candidates' },
  '/performance': { title: 'Performance',  sub: 'Goals & appraisals' },
  '/automation':  { title: 'Automation',   sub: 'KYC · GST · EPFO' },
  '/settings':    { title: 'Settings',     sub: 'Company configuration' },
  '/billing':     { title: 'Billing',      sub: 'Plan & subscription' },
};

function NotifBell({ collapsed: _collapsed }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const wsRef    = useRef(null);

  const { data: countRes, refetch: refetchCount } = useQuery({
    queryKey: ['notif-count'],
    queryFn:  () => api.get('/notifications/unread-count').then(r => r.data),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const unread = countRes?.data?.count || 0;

  const { data: notifRes } = useQuery({
    queryKey: ['notifs'],
    queryFn:  () => api.get('/notifications?limit=15').then(r => r.data),
    enabled:  open,
    staleTime: 10_000,
  });
  const notifs = notifRes?.data?.notifications || notifRes?.data || [];

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl    = `${protocol}//${window.location.host}/ws`;
    let   ws;

    function connect() {
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg.type === 'notification') {
              refetchCount();
              qc.invalidateQueries({ queryKey: ['notifs'] });
              toast(msg.title || 'New notification', { icon: '🔔', duration: 4000 });
            }
          } catch (error) {
            // Ignore invalid message format
          }
        };

        ws.onclose = () => {
          // Reconnect after 5 seconds
          setTimeout(connect, 5000);
        };
      } catch (error) {
        // WebSocket connection failed, will retry
      }
    }

    connect();
    return () => { wsRef.current?.close(); };
  }, []);

  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  async function markAllRead() {
    await api.post('/notifications/mark-all-read');
    refetchCount();
    qc.invalidateQueries({ queryKey: ['notifs'] });
  }

  async function markRead(id) {
    await api.post(`/notifications/${id}/read`);
    refetchCount();
    qc.invalidateQueries({ queryKey: ['notifs'] });
  }

  const NOTIF_ICON = {
    leave:       '📋',
    payroll:     '₹',
    attendance:  '⏰',
    compliance:  '⚠',
    system:      '🔔',
    default:     '🔔',
  };

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      <button
        className="hr-notif"
        onClick={() => setOpen(o => !o)}
        title="Notifications"
        style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 4 }}
      >
        <span style={{ fontSize: 16 }}>🔔</span>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 3, right: 3,
            background: '#ef4444', color: '#fff',
            fontSize: 9, fontWeight: 700, minWidth: 14, height: 14,
            borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 6,
          width: 340, background: '#fff', borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '0.5px solid rgba(0,0,0,0.09)',
          zIndex: 100, overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Notifications {unread > 0 && <span style={{ fontSize: 11, color: '#ef4444', marginLeft: 4 }}>{unread} new</span>}</div>
            {unread > 0 && (
              <button style={{ fontSize: 11, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }} onClick={markAllRead}>Mark all read</button>
            )}
          </div>

          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifs.length === 0 && (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                No notifications yet
              </div>
            )}
            {notifs.map(n => (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                style={{
                  display: 'flex', gap: 10, padding: '11px 16px',
                  borderBottom: '0.5px solid rgba(0,0,0,0.04)',
                  background: n.is_read ? '#fff' : '#f0f7ff',
                  cursor: 'pointer',
                  transition: 'background 0.12s',
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>
                  {NOTIF_ICON[n.type] || NOTIF_ICON.default}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: n.is_read ? 400 : 600, color: '#0f172a', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {n.title || n.message}
                  </div>
                  {n.title && n.message && (
                    <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.message}</div>
                  )}
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>
                    {n.created_at ? new Date(n.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
                  </div>
                </div>
                {!n.is_read && <div style={{ width: 6, height: 6, background: '#2563eb', borderRadius: '50%', flexShrink: 0, marginTop: 6 }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu({ user }) {
  const { logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="hr-avatar"
        title={user?.name}
        style={{ cursor: 'pointer', border: 'none', background: '#dbeafe', color: '#1d4ed8', width: 32, height: 32, borderRadius: '50%', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {initials}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 6,
          width: 220, background: '#fff', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '0.5px solid rgba(0,0,0,0.08)',
          zIndex: 100, overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 14px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{user?.email}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1, textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</div>
          </div>
          {[
            { label: 'My profile',       href: user?.employeeId ? `/employees/${user.employeeId}` : '/settings' },
            { label: 'Change password',  href: '/change-password' },
            { label: 'Billing & plan',   href: '/billing' },
            { label: 'ESS portal',       href: '/ess/dashboard' },
          ].map(item => (
            <Link key={item.label} to={item.href} onClick={() => setOpen(false)}
              style={{ display: 'block', padding: '9px 14px', fontSize: 12, color: '#334155', textDecoration: 'none', borderBottom: '0.5px solid rgba(0,0,0,0.04)' }}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={() => { logout(); window.location.href = '/login'; }}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px', fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function HRLayout() {
  const location = useLocation();
  const { user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const role  = user?.role || 'employee';
  const meta  = PAGE_META[location.pathname] || PAGE_META[Object.keys(PAGE_META).find(k => location.pathname.startsWith(k) && k !== '/') || ''] || { title: 'HR Admin', sub: '' };

  const navItems = ALL_NAV.filter(n => n.roles.includes('*') || n.roles.includes(role));

  const companyName   = user?.companyName || 'Your Company';
  const companyDomain = window.location.hostname;

  const brandInitials = companyName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const daysLeft = user?.planExpiresAt
    ? Math.ceil((new Date(user.planExpiresAt) - Date.now()) / 86400000)
    : null;
  const showPlanBanner = daysLeft !== null && daysLeft <= 14;

  return (
    <div className={`hr-shell${collapsed ? ' collapsed' : ''}`}>

      {}
      <aside className="hr-sidebar">
        <div className="hr-brand">
          <div className="hr-brand-logo">{brandInitials}</div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="hr-brand-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{companyName}</div>
              <div className="hr-brand-domain">{companyDomain}</div>
            </div>
          )}
          <button className="collapse-btn" onClick={() => setCollapsed(c => !c)}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <><CompanyBrand sidebarOpen={!collapsed} /><nav className="hr-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `hr-nav-btn${isActive ? ' active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="hr-nav-icon">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}

          <div className="hr-nav-divider" />

          {SETTINGS_NAV.filter(n => n.roles.includes(role) || n.roles.includes('*')).map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `hr-nav-btn${isActive ? ' active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="hr-nav-icon">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav></>

        <div className="hr-sidebar-footer">
          <div className="hr-user-dot" />
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="hr-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'User'}
              </div>
              <div className="hr-user-role" style={{ textTransform: 'capitalize' }}>
                {(user?.role || 'employee').replace(/_/g, ' ')}
              </div>
            </div>
          )}
        </div>
      </aside>

      {}
      <div className="hr-main">

        {}
        {showPlanBanner && (
          <div style={{
            padding: '7px 20px',
            background: daysLeft <= 3 ? '#fef2f2' : '#fffbeb',
            borderBottom: `1px solid ${daysLeft <= 3 ? '#fecaca' : '#fde68a'}`,
            fontSize: 11, color: daysLeft <= 3 ? '#b91c1c' : '#92400e',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>
              {daysLeft <= 0
                ? `⚠ Your ${user?.plan === 'trial' ? 'trial' : 'plan'} has expired. Read-only mode active.`
                : `⏳ ${user?.plan === 'trial' ? '14-day trial' : 'Plan'} expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`
              }
            </span>
            <Link to="/billing" style={{ color: daysLeft <= 3 ? '#b91c1c' : '#b45309', fontWeight: 600, textDecoration: 'none', fontSize: 11 }}>
              {daysLeft <= 0 ? 'Reactivate →' : 'Upgrade now →'}
            </Link>
          </div>
        )}

        <header className="hr-topbar">
          <div>
            <span className="hr-topbar-title">{meta.title}</span>
            <span className="hr-topbar-sub">{meta.sub}</span>
          </div>
          <div className="hr-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to="/ess/dashboard" className="btn-ess" style={{ fontSize: 11, textDecoration: 'none' }}>
              ESS Portal →
            </Link>
            <NotifBell collapsed={collapsed} />
            <UserMenu user={user} />
          </div>
        </header>

        <main className="hr-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

