import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { recruitmentApi } from '../../services/recruitmentApi';
import { PageHeader, Button, Spinner } from '../../components/ui/Common';

const STAGE_META = {
  applied:   { label: 'Applied',   color: 'bg-gray-200 text-gray-700',    bar: 'bg-gray-400' },
  screening: { label: 'Screening', color: 'bg-blue-100 text-blue-700',    bar: 'bg-blue-400' },
  interview: { label: 'Interview', color: 'bg-purple-100 text-purple-700', bar: 'bg-purple-500' },
  offer:     { label: 'Offer',     color: 'bg-yellow-100 text-yellow-700', bar: 'bg-yellow-400' },
  joined:    { label: 'Joined',    color: 'bg-green-100 text-green-700',   bar: 'bg-green-500' },
  rejected:  { label: 'Rejected',  color: 'bg-red-100 text-red-700',      bar: 'bg-red-400' },
};

const PRIORITY_BADGE = {
  urgent: 'bg-red-100 text-red-700',
  high:   'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low:    'bg-gray-100 text-gray-600',
};

export default function RecruitmentDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['recruitment-dashboard'],
    queryFn:  recruitmentApi.dashboard,
  });

  const d = data?.data;

  if (isLoading) return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;

  const totalInPipeline = d?.pipeline?.reduce((s, p) => s + (p.stage !== 'joined' && p.stage !== 'rejected' ? p.count : 0), 0) || 0;

  return (
    <div>
      <PageHeader
        title="Recruitment"
        subtitle="Talent acquisition pipeline"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/recruitment/jobs')}>📋 Job Openings</Button>
            <Button onClick={() => navigate('/recruitment/requisitions/new')}>+ New Requisition</Button>
          </div>
        }
      />

      {}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { icon: '📋', label: 'Open Positions',    value: d?.totalOpen || 0,        color: 'text-blue-600',   onClick: () => navigate('/recruitment/requisitions') },
          { icon: '👤', label: 'Active Candidates', value: d?.totalCandidates || 0,   color: 'text-purple-600', onClick: () => navigate('/recruitment/candidates') },
          { icon: '🗓', label: 'Interviews This Week', value: d?.interviews || 0,     color: 'text-orange-600', onClick: () => navigate('/recruitment/interviews') },
          { icon: '📨', label: 'Pending Offers',    value: d?.pendingOffers || 0,     color: 'text-green-600',  onClick: () => navigate('/recruitment/candidates?stage=offer') },
        ].map((c, i) => (
          <button key={i} onClick={c.onClick}
            className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md hover:border-blue-200 transition-all">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{c.icon}</span>
            </div>
            <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{c.label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900">Hiring Pipeline</h3>
            <span className="text-sm text-gray-400">{totalInPipeline} active</span>
          </div>
          <div className="space-y-3">
            {(d?.pipeline || []).map(({ stage, count }) => {
              const meta   = STAGE_META[stage] || {};
              const maxVal = Math.max(...(d?.pipeline || []).map(p => p.count), 1);
              const pct    = Math.round((count / maxVal) * 100);
              return (
                <div key={stage} className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-20 text-center flex-shrink-0 ${meta.color}`}>
                    {meta.label}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${meta.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900">Recent Candidates</h3>
            <button onClick={() => navigate('/recruitment/candidates')}
              className="text-xs text-blue-600 hover:underline">View all</button>
          </div>
          <div className="space-y-3">
            {(d?.recentActivity || []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No candidates yet</p>
            ) : d.recentActivity.map(c => {
              const meta = STAGE_META[c.stage] || {};
              return (
                <div key={c.id}
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded-lg"
                  onClick={() => navigate(`/recruitment/candidates/${c.id}`)}>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{c.first_name} {c.last_name}</p>
                    <p className="text-xs text-gray-400">{c.job?.requisition?.job_title || '—'}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.color}`}>{meta.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {}
      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: '📝', label: 'New Requisition',   path: '/recruitment/requisitions/new' },
          { icon: '👥', label: 'Add Candidate',     path: '/recruitment/candidates/add' },
          { icon: '🗓', label: 'Schedule Interview', path: '/recruitment/interviews/schedule' },
          { icon: '📊', label: 'All Jobs',          path: '/recruitment/jobs' },
        ].map((a, i) => (
          <button key={i} onClick={() => navigate(a.path)}
            className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md hover:border-blue-200 transition-all">
            <div className="text-2xl mb-1">{a.icon}</div>
            <p className="text-sm font-semibold text-gray-700">{a.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

