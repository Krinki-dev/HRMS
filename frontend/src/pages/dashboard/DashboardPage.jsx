import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import dashboardApi from '../../services/dashboardApi';
import './Dashboard.css';

const STAT_CARDS = [
  { label: 'Total Employees', key: 'totalEmployees',  icon: '\uD83D\uDC65', color: 'blue'   },
  { label: 'Present Today',   key: 'presentToday',    icon: '\u2705',       color: 'green'  },
  { label: 'On Leave',        key: 'onLeaveToday',    icon: '\uD83C\uDFD6', color: 'amber'  },
  { label: 'Pending Leaves',  key: 'pendingLeaves',   icon: '\u23F3',       color: 'violet' },
];

const ACTIONS = [
  { label: 'Add Employee',    icon: '\u2795',     to: '/employees/add'    },
  { label: 'Approve Leave',   icon: '\u2714',     to: '/leave/approvals'  },
  { label: 'Run Payroll',     icon: '\uD83D\uDCB0', to: '/payroll/run'    },
  { label: 'View Reports',    icon: '\uD83D\uDCCA', to: '/reports'        },
];

function greet() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => dashboardApi.getStats(),
    select: d => d?.data ?? d,
  });

  const { data: activities } = useQuery({
    queryKey: ['recentActivities'],
    queryFn: () => dashboardApi.getRecentActivities?.() ?? Promise.resolve({ data: [] }),
    select: d => d?.data ?? d ?? [],
  });

  const { data: birthdays } = useQuery({
    queryKey: ['upcomingBirthdays'],
    queryFn: () => dashboardApi.getUpcomingBirthdays?.() ?? Promise.resolve({ data: [] }),
    select: d => d?.data ?? d ?? [],
  });

  const greeting = greet();
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>{greeting}, {firstName}! \uD83D\uDC4B</h1>
        <p>Here&#39;s what&#39;s happening with your workforce today.</p>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {STAT_CARDS.map(card => (
          <div key={card.key} className="stat-card">
            <div className={`stat-icon ${card.color}`}>{card.icon}</div>
            <div className="stat-info">
              <div className="stat-label">{card.label}</div>
              <div className="stat-value">
                {isLoading ? '...' : (stats?.[card.key] ?? 0)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          {ACTIONS.map(a => (
            <button key={a.to} className="action-btn" onClick={() => navigate(a.to)}>
              <span>{a.icon}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="dashboard-grid">
        <div className="dash-section">
          <h2 className="section-title">Recent Activity</h2>
          {!activities?.length
            ? <p className="empty-state">No recent activity</p>
            : <ul className="activity-list">
                {activities.slice(0,8).map((a, i) => (
                  <li key={i} className="activity-item">
                    <span className="activity-dot" />
                    <div>
                      <div className="activity-text">{a.message ?? a.description ?? JSON.stringify(a)}</div>
                      <div className="activity-time">{a.time ?? a.createdAt ?? ''}</div>
                    </div>
                  </li>
                ))}
              </ul>
          }
        </div>

        <div className="dash-section">
          <h2 className="section-title">Upcoming Birthdays \uD83C\uDF82</h2>
          {!birthdays?.length
            ? <p className="empty-state">No upcoming birthdays</p>
            : <ul className="birthday-list">
                {birthdays.slice(0,6).map((b, i) => (
                  <li key={i} className="birthday-item">
                    <div className="birthday-avatar">
                      {(b.name ?? b.employeeName ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="birthday-name">{b.name ?? b.employeeName}</div>
                      <div className="birthday-date">
                        {b.birthDate ? new Date(b.birthDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
          }
        </div>
      </div>
    </div>
  );
}
