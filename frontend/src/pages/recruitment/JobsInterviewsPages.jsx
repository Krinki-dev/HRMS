import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { recruitmentApi } from '../../services/recruitmentApi';
import { PageHeader, Button, Spinner } from '../../components/ui/Common';

const STAGE_META = {
  applied:   { label: 'Applied',   color: 'bg-gray-100 text-gray-600' },
  screening: { label: 'Screening', color: 'bg-blue-100 text-blue-700' },
  interview: { label: 'Interview', color: 'bg-purple-100 text-purple-700' },
  offer:     { label: 'Offer',     color: 'bg-yellow-100 text-yellow-700' },
  joined:    { label: 'Joined',    color: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Rejected',  color: 'bg-red-100 text-red-700' },
};

export function JobOpeningsPage() {
  const navigate   = useNavigate();
  const [statusFilter, setStatusFilter] = useState('active');

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', statusFilter],
    queryFn:  () => recruitmentApi.listJobs({ status: statusFilter || undefined }),
  });

  const jobs = data?.data || [];

  return (
    <div>
      <PageHeader
        title="Job Openings"
        subtitle="All posted positions and their pipeline counts"
        actions={
          <div className="flex gap-2">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="paused">Paused</option>
            </select>
            <Button onClick={() => navigate('/recruitment/requisitions')}>+ New Requisition</Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-semibold text-gray-800">No job openings</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Approve a requisition and post it to see openings here</p>
          <Button onClick={() => navigate('/recruitment/requisitions')}>View Requisitions</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => {
            const req    = job.requisition;
            const total  = Object.values(job.pipelineCounts || {}).reduce((a, b) => a + b, 0);
            const active = total - (job.pipelineCounts?.joined || 0) - (job.pipelineCounts?.rejected || 0);

            return (
              <div key={job.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm cursor-pointer transition-shadow"
                onClick={() => navigate(`/recruitment/candidates?jobId=${job.id}`)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-gray-900">{req?.job_title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                        job.status === 'active' ? 'bg-green-100 text-green-700' :
                        job.status === 'closed' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'
                      }`}>{job.status}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      {req?.positions} position{req?.positions > 1 ? 's' : ''} ·
                      {req?.filled_count || 0} filled ·
                      {active} active candidates
                      {job.deadline && ` · Deadline: ${new Date(job.deadline).toLocaleDateString('en-IN')}`}
                    </p>
                    {}
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(STAGE_META).map(([stage, meta]) => {
                        const count = job.pipelineCounts?.[stage] || 0;
                        if (!count) return null;
                        return (
                          <span key={stage} className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.color}`}>
                            {meta.label}: {count}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); navigate(`/recruitment/candidates?jobId=${job.id}`); }}>
                    View Pipeline →
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function InterviewsPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['interviews-upcoming'],
    queryFn:  () => recruitmentApi.listInterviews({ upcoming: true }),
  });

  const interviews = data?.data || [];

  const today     = new Date();
  const todayStr  = today.toDateString();
  const tomorrowStr = new Date(today.getTime() + 86400000).toDateString();

  const grouped = interviews.reduce((acc, i) => {
    const d   = new Date(i.scheduled_at).toDateString();
    const key = d === todayStr ? 'Today' : d === tomorrowStr ? 'Tomorrow' : new Date(i.scheduled_at).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'short' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(i);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title="Upcoming Interviews" subtitle="Scheduled interviews in the next 30 days" />

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : interviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <p className="text-4xl mb-3">🗓</p>
          <p className="font-semibold text-gray-800">No upcoming interviews</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([day, items]) => (
            <div key={day}>
              <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                {day === 'Today' ? '📅 ' : ''}
                {day}
                {day === 'Today' && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Today</span>}
              </h3>
              <div className="space-y-2">
                {items.map(i => (
                  <div key={i.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:shadow-sm cursor-pointer"
                    onClick={() => navigate(`/recruitment/candidates/${i.candidate_id}`)}>
                    <div className="flex items-center gap-4">
                      <div className="text-center w-12 flex-shrink-0">
                        <p className="text-lg font-bold text-blue-700">
                          {new Date(i.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-gray-400">{i.duration_mins}m</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {i.candidate?.first_name} {i.candidate?.last_name}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          Round {i.round_number} · {i.interview_type?.replace('_',' ')}
                          {i.venue && ` · ${i.venue}`}
                          {i.meeting_link && ` · 🔗 Video call`}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
                      i.status === 'scheduled' ? 'bg-purple-100 text-purple-700' :
                      i.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>{i.status}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

