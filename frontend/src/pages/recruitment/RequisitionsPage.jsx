import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { recruitmentApi } from '../../services/recruitmentApi';
import { PageHeader, Button, Spinner, Modal, Input } from '../../components/ui/Common';

const STATUS_BADGE = {
  pending_approval: 'bg-yellow-100 text-yellow-700',
  approved:         'bg-blue-100 text-blue-700',
  posted:           'bg-green-100 text-green-700',
  rejected:         'bg-red-100 text-red-700',
  closed:           'bg-gray-100 text-gray-600',
};

const PRIORITY_BADGE = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high:   'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low:    'bg-gray-100 text-gray-600 border-gray-200',
};

const EMP_TYPES = ['permanent','contract','internship','part_time','consultant'];

function ReqForm({ onSubmit, loading, initial = {} }) {
  const [form, setForm] = useState({
    jobTitle: initial.jobTitle || '',
    positions: initial.positions || 1,
    employmentType: initial.employmentType || 'permanent',
    experienceMin: initial.experienceMin || '',
    experienceMax: initial.experienceMax || '',
    salaryMin: initial.salaryMin || '',
    salaryMax: initial.salaryMax || '',
    jobDescription: initial.jobDescription || '',
    skillsInput: (initial.skillsRequired || []).join(', '),
    targetDate: initial.targetDate ? initial.targetDate.split('T')[0] : '',
    priority: initial.priority || 'medium',
  });
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = () => {
    if (!form.jobTitle.trim()) { toast.error('Job title required.'); return; }
    const skills = form.skillsInput.split(',').map(s => s.trim()).filter(Boolean);
    onSubmit({ ...form, skillsRequired: skills });
  };

  return (
    <div className="space-y-4 py-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input label="Job Title *" placeholder="e.g. Senior Software Engineer" value={form.jobTitle} onChange={set('jobTitle')} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">No. of Positions</label>
          <input type="number" min="1" value={form.positions} onChange={set('positions')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Employment Type</label>
          <select value={form.employmentType} onChange={set('employmentType')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white capitalize">
            {EMP_TYPES.map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Experience Min (years)</label>
          <input type="number" min="0" value={form.experienceMin} onChange={set('experienceMin')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="0" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Experience Max (years)</label>
          <input type="number" min="0" value={form.experienceMax} onChange={set('experienceMax')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="10" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Salary Min CTC (₹ LPA)</label>
          <input type="number" value={form.salaryMin} onChange={set('salaryMin')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="5" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Salary Max CTC (₹ LPA)</label>
          <input type="number" value={form.salaryMax} onChange={set('salaryMax')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="12" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Priority</label>
          <select value={form.priority} onChange={set('priority')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white capitalize">
            {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Target Joining Date</label>
          <input type="date" value={form.targetDate} onChange={set('targetDate')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium text-gray-700 block mb-1">Skills Required (comma-separated)</label>
          <input value={form.skillsInput} onChange={set('skillsInput')}
            placeholder="React, Node.js, TypeScript"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium text-gray-700 block mb-1">Job Description</label>
          <textarea rows={4} value={form.jobDescription} onChange={set('jobDescription')}
            placeholder="Responsibilities, requirements, perks..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button onClick={handleSubmit} loading={loading}>Submit for Approval</Button>
      </div>
    </div>
  );
}

export default function RequisitionsPage() {
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate,  setShowCreate]    = useState(false);
  const [actionModal, setActionModal]   = useState(null); 

  const { data, isLoading } = useQuery({
    queryKey: ['requisitions', statusFilter],
    queryFn:  () => recruitmentApi.listRequisitions({ status: statusFilter || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: recruitmentApi.createRequisition,
    onSuccess: () => {
      toast.success('Requisition submitted!');
      setShowCreate(false);
      queryClient.invalidateQueries(['requisitions']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => recruitmentApi.approveRequisition(id),
    onSuccess: () => { toast.success('Approved!'); queryClient.invalidateQueries(['requisitions']); setActionModal(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => recruitmentApi.rejectRequisition(id),
    onSuccess: () => { toast.success('Rejected.'); queryClient.invalidateQueries(['requisitions']); setActionModal(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const postMutation = useMutation({
    mutationFn: ({ id, data }) => recruitmentApi.postJob({ requisitionId: id, ...data }),
    onSuccess: () => {
      toast.success('Job posted!');
      queryClient.invalidateQueries(['requisitions']);
      queryClient.invalidateQueries(['jobs']);
      setActionModal(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const reqs = data?.data?.items || [];

  return (
    <div>
      <PageHeader
        title="Job Requisitions"
        subtitle="Open positions pending approval and posting"
        actions={
          <div className="flex gap-2">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">All Status</option>
              {['pending_approval','approved','posted','rejected'].map(s => (
                <option key={s} value={s}>{s.replace('_',' ')}</option>
              ))}
            </select>
            <Button onClick={() => setShowCreate(true)}>+ New Requisition</Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : reqs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-semibold text-gray-800 text-lg">No requisitions yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Raise a requisition to start hiring</p>
          <Button onClick={() => setShowCreate(true)}>+ Raise Requisition</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {reqs.map(req => (
            <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-gray-900">{req.job_title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${PRIORITY_BADGE[req.priority]}`}>
                      {req.priority}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_BADGE[req.status] || 'bg-gray-100'}`}>
                      {req.status?.replace('_',' ')}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500 flex-wrap">
                    <span>👥 {req.positions} position{req.positions > 1 ? 's' : ''}</span>
                    {req.employment_type && <span className="capitalize">· {req.employment_type.replace('_',' ')}</span>}
                    {(req.experience_min || req.experience_max) && (
                      <span>· {req.experience_min || 0}–{req.experience_max || '?'} yrs exp</span>
                    )}
                    {req.salary_min && (
                      <span>· ₹{Math.round(req.salary_min / 10000)}–{req.salary_max ? Math.round(req.salary_max / 10000) : '?'} LPA</span>
                    )}
                    <span>· {req.candidateCount || 0} candidates</span>
                    {req.filled_count > 0 && <span className="text-green-600">· {req.filled_count} filled</span>}
                  </div>
                  {req.skills_required?.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-2">
                      {req.skills_required.slice(0, 6).map(s => (
                        <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {req.status === 'pending_approval' && (
                    <>
                      <Button size="sm" variant="outline"
                        onClick={() => setActionModal({ type: 'reject', req })}
                        className="text-red-600 border-red-200 hover:bg-red-50">
                        Reject
                      </Button>
                      <Button size="sm" onClick={() => setActionModal({ type: 'approve', req })}>
                        ✓ Approve
                      </Button>
                    </>
                  )}
                  {req.status === 'approved' && (
                    <Button size="sm" onClick={() => setActionModal({ type: 'post', req })}>
                      📢 Post Job
                    </Button>
                  )}
                  {req.status === 'posted' && (
                    <Button size="sm" variant="outline"
                      onClick={() => navigate(`/recruitment/jobs?reqId=${req.id}`)}>
                      View Pipeline →
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Job Requisition" size="lg">
        <ReqForm onSubmit={createMutation.mutate} loading={createMutation.isPending} />
      </Modal>

      {}
      <Modal
        open={actionModal?.type === 'approve'}
        onClose={() => setActionModal(null)}
        title="Approve Requisition"
        footer={
          <>
            <Button variant="outline" onClick={() => setActionModal(null)}>Cancel</Button>
            <Button onClick={() => approveMutation.mutate(actionModal.req.id)} loading={approveMutation.isPending}>
              ✓ Approve
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 py-3">
          Approve <strong>{actionModal?.req?.job_title}</strong> ({actionModal?.req?.positions} position{actionModal?.req?.positions > 1 ? 's' : ''})?
          This will allow the job to be posted on career portals.
        </p>
      </Modal>

      {}
      <Modal
        open={actionModal?.type === 'reject'}
        onClose={() => setActionModal(null)}
        title="Reject Requisition"
        footer={
          <>
            <Button variant="outline" onClick={() => setActionModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => rejectMutation.mutate(actionModal.req.id)} loading={rejectMutation.isPending}>
              Reject
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 py-3">
          Reject the requisition for <strong>{actionModal?.req?.job_title}</strong>?
        </p>
      </Modal>

      {}
      <Modal
        open={actionModal?.type === 'post'}
        onClose={() => setActionModal(null)}
        title={`Post Job — ${actionModal?.req?.job_title}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setActionModal(null)}>Cancel</Button>
            <Button
              onClick={() => postMutation.mutate({ id: actionModal.req.id, data: {
                postInternal: true, postCareerPage: true,
              }})}
              loading={postMutation.isPending}
            >
              📢 Post Now
            </Button>
          </>
        }
      >
        <div className="py-3 space-y-3 text-sm text-gray-600">
          <p>Select where to post this job opening:</p>
          <div className="space-y-2">
            {[
              { key: 'postInternal',   label: '🏢 Internal (visible to employees)' },
              { key: 'postCareerPage', label: '🌐 Career Page (public)' },
              { key: 'postNaukri',     label: '🔷 Naukri (API key required)' },
              { key: 'postLinkedin',   label: '🔗 LinkedIn (API key required)' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                <input type="checkbox" className="w-4 h-4" defaultChecked={key === 'postInternal' || key === 'postCareerPage'} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

