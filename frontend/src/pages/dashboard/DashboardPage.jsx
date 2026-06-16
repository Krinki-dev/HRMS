import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import dashboardApi from '../../services/dashboardApi';

function StatCard({ label, value, icon, color, sub, loading }) {
  return (
    <div className={`rounded-xl p-4 flex items-center gap-4 ${color} border`}>
      <div className="text-2xl flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-white/70 uppercase tracking-wider truncate">{label}</p>
        <p className="text-2xl font-bold text-white leading-tight">
          {loading ? <span className="opacity-40 animate-pulse">—</span> : (value ?? '—')}
        </p>
        {sub && <p className="text-xs text-white/60 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const ACTIONS = [
  { label: 'Add Employee',   icon: '👤', to: '/employees/add',   cls: 'bg-blue-50 hover:bg-blue-100 border-blue-100 text-blue-700' },
  { label: 'Approve Leave',  icon: '✅', to: '/leave/approvals', cls: 'bg-green-50 hover:bg-green-100 border-green-100 text-green-700' },
  { label: 'Run Payroll',    icon: '💰', to: '/payroll/run',     cls: 'bg-purple-50 hover:bg-purple-100 border-purple-100 text-purple-700' },
  { label: 'Attendance',     icon: '🕐', to: '/attendance',      cls: 'bg-amber-50 hover:bg-amber-100 border-amber-100 text-amber-700' },
];

export default function DashboardPage() {
  const user      = useAuthStore(s => s.user);
  const navigate  = useNavigate();
  const firstName = user?.employee?.firstName || user?.name?.split(' ')[0] || 'there';
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const { data: stats, isLoading: sl } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
    staleTime: 60_000,
  });
  const { data: activity, isLoading: al } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: dashboardApi.getActivity,
    staleTime: 30_000,
  });

  const statCards = [
    { label: 'Total Employees', value: stats?.totalEmployees, icon: '👥', color: 'bg-blue-600 border-blue-700',    sub: 'Active headcount' },
    { label: 'Present Today',   value: stats?.presentToday,   icon: '✅', color: 'bg-emerald-500 border-emerald-600', sub: stats?.totalEmployees ? `${Math.round((stats.presentToday/stats.totalEmployees)*100)}% rate` : 'today' },
    { label: 'On Leave',        value: stats?.onLeaveToday,   icon: '🏖', color: 'bg-amber-500 border-amber-600',   sub: 'Approved today' },
    { label: 'Pending',         value: stats?.pendingLeaves,  icon: '⏳', color: 'bg-violet-600 border-violet-700', sub: 'Awaiting action' },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">

      {}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-gray-400 font-medium">{greeting},</p>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{firstName} 👋</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          {ACTIONS.map(a => (
            <button key={a.label} onClick={() => navigate(a.to)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${a.cls}`}>
              <span>{a.icon}</span>{a.label}
            </button>
          ))}
        </div>
      </div>

      {}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(c => <StatCard key={c.label} {...c} loading={sl} />)}
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 min-h-0">

        {}
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Birthdays 🎂</h3>
            <span className="text-xs text-gray-400">next 7 days</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sl ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-7 bg-gray-100 rounded-lg animate-pulse" />)}
              </div>
            ) : stats?.upcomingBirthdays?.length ? (
              <ul className="space-y-1.5">
                {stats.upcomingBirthdays.slice(0,6).map(emp => (
                  <li key={emp.id} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{emp.name}</p>
                      <p className="text-xs text-gray-400">{emp.code}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-4">
                <p className="text-2xl mb-1">🎉</p>
                <p className="text-xs text-gray-400">No birthdays this week</p>
              </div>
            )}
          </div>
        </div>

        {}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Recent Activity</h3>
            <button onClick={() => navigate('/settings/audit')}
              className="text-xs text-blue-500 hover:text-blue-700 transition-colors">
              View all →
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {al ? (
              <div className="space-y-2">
                {[1,2,3,4,5].map(i => <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />)}
              </div>
            ) : activity?.logs?.length ? (
              <ul className="divide-y divide-gray-50">
                {activity.logs.slice(0,10).map(log => {
                  const actor = log.user?.employee
                    ? `${log.user.employee.firstName} ${log.user.employee.lastName}`
                    : log.user?.email?.split('@')[0] || 'System';
                  return (
                    <li key={log.id} className="py-2 flex items-start gap-2.5">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                      <p className="text-xs text-gray-600 flex-1 leading-snug">
                        <span className="font-semibold text-gray-800">{actor}</span>{' '}
                        <span>{log.action}</span>{' '}
                        <span className="text-gray-400">{log.entity}</span>
                      </p>
                      <span className="text-xs text-gray-300 flex-shrink-0">{timeAgo(log.createdAt)}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-4">
                <p className="text-2xl mb-1">📋</p>
                <p className="text-xs text-gray-400">No activity yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

