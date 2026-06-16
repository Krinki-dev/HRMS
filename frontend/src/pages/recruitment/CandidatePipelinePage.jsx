import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { recruitmentApi } from '../../services/recruitmentApi';
import { PageHeader, Button, Spinner, Modal, Input } from '../../components/ui/Common';

const STAGES = [
  { id: 'applied',   label: 'Applied',   color: 'border-gray-300',   header: 'bg-gray-100 text-gray-700' },
  { id: 'screening', label: 'Screening', color: 'border-blue-300',   header: 'bg-blue-50 text-blue-700' },
  { id: 'interview', label: 'Interview', color: 'border-purple-300', header: 'bg-purple-50 text-purple-700' },
  { id: 'offer',     label: 'Offer',     color: 'border-yellow-300', header: 'bg-yellow-50 text-yellow-700' },
  { id: 'joined',    label: 'Joined',    color: 'border-green-300',  header: 'bg-green-50 text-green-700' },
  { id: 'rejected',  label: 'Rejected',  color: 'border-red-300',    header: 'bg-red-50 text-red-700' },
];

const SOURCE_OPTS = ['portal','referral','walk_in','agency','linkedin','naukri','other'];

function CandidateCard({ candidate, onClick, onMoveStage }) {
  const hasInterview = candidate.interviews?.length > 0;
  const hasOffer     = candidate.offers?.some(o => o.status === 'generated');
  return (
    <div onClick={() => onClick(candidate)}
      draggable
      onDragStart={e => e.dataTransfer.setData('candidateId', candidate.id)}
      className="bg-white border border-gray-200 rounded-xl p-3 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all mb-2 select-none">
      <div className="flex items-start justify-between mb-1">
        <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-xs flex-shrink-0 mt-0.5">
          {candidate.first_name?.[0]?.toUpperCase()}
        </div>
        <div className="flex gap-1">
          {hasInterview && <span title="Interview scheduled" className="text-xs">🗓</span>}
          {hasOffer      && <span title="Offer pending" className="text-xs">📨</span>}
          {candidate.is_duplicate && <span title="Possible duplicate" className="text-xs">⚠️</span>}
        </div>
      </div>
      <p className="font-semibold text-gray-900 text-sm mt-1">{candidate.first_name} {candidate.last_name}</p>
      <p className="text-xs text-gray-400 mt-0.5">{candidate.job?.requisition?.job_title || '—'}</p>
      {candidate.experience_years && (
        <p className="text-xs text-gray-500 mt-1">{candidate.experience_years} yr exp</p>
      )}
      <div className="flex gap-1 mt-2 flex-wrap">
        {candidate.source && (
          <span className="text-xs bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded capitalize">
            {candidate.source.replace('_',' ')}
          </span>
        )}
      </div>
    </div>
  );
}

function AddCandidateForm({ jobs, onSubmit, loading }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    experienceYears: '', currentCtc: '', expectedCtc: '',
    noticePeriod: '', source: 'portal', jobId: jobs[0]?.id || '',
  });
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-3 py-1">
      <div className="grid grid-cols-2 gap-3">
        <Input label="First Name *" value={form.firstName} onChange={set('firstName')} placeholder="Rahul" />
        <Input label="Last Name"    value={form.lastName}  onChange={set('lastName')}  placeholder="Sharma" />
        <Input label="Email"        value={form.email}     onChange={set('email')}     type="email" />
        <Input label="Phone"        value={form.phone}     onChange={set('phone')}     placeholder="9876543210" />
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Job Opening *</label>
          <select value={form.jobId} onChange={set('jobId')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
            {jobs.map(j => <option key={j.id} value={j.id}>{j.requisition?.job_title}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Source</label>
          <select value={form.source} onChange={set('source')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white capitalize">
            {SOURCE_OPTS.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
        </div>
        <Input label="Experience (years)" value={form.experienceYears} onChange={set('experienceYears')} type="number" placeholder="3" />
        <Input label="Notice Period (days)" value={form.noticePeriod} onChange={set('noticePeriod')} type="number" placeholder="30" />
        <Input label="Current CTC (₹ LPA)" value={form.currentCtc}  onChange={set('currentCtc')}  type="number" placeholder="8" />
        <Input label="Expected CTC (₹ LPA)" value={form.expectedCtc} onChange={set('expectedCtc') } type="number" placeholder="12" />
      </div>
      <div className="flex justify-end pt-2">
        <Button
          onClick={() => { if (!form.firstName || !form.jobId) { toast.error('Name and job required.'); return; } onSubmit(form); }}
          loading={loading}
        >
          Add Candidate
        </Button>
      </div>
    </div>
  );
}

export default function CandidatePipelinePage() {
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();
  const [params]     = useSearchParams();
  const [view,       setView]       = useState('kanban'); 
  const [showAdd,    setShowAdd]    = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [moveModal,  setMoveModal]  = useState(null);
  const [moveNotes,  setMoveNotes]  = useState('');
  const [dragOver,   setDragOver]   = useState(null);
  const [stageFilter,setStageFilter]= useState(params.get('stage') || '');
  const [search,     setSearch]     = useState('');

  const { data: candidatesData, isLoading } = useQuery({
    queryKey: ['candidates', stageFilter, search],
    queryFn: () => recruitmentApi.listCandidates({
      stage: stageFilter || undefined,
      search: search || undefined,
    }),
  });

  const { data: jobsData } = useQuery({
    queryKey: ['jobs-active'],
    queryFn:  () => recruitmentApi.listJobs({ status: 'active' }),
  });

  const addMutation = useMutation({
    mutationFn: recruitmentApi.addCandidate,
    onSuccess: (res) => {
      if (res.data?.isDuplicate) toast.success('Candidate added (possible duplicate detected)');
      else toast.success('Candidate added!');
      setShowAdd(false);
      queryClient.invalidateQueries(['candidates']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, toStage, notes }) => recruitmentApi.moveStage(id, { toStage, notes }),
    onSuccess: () => {
      toast.success('Stage updated!');
      queryClient.invalidateQueries(['candidates']);
      setMoveModal(null);
      setMoveNotes('');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const candidates = candidatesData?.data?.items || [];
  const jobs       = jobsData?.data || [];

  const byStage = STAGES.reduce((acc, s) => {
    acc[s.id] = candidates.filter(c => c.stage === s.id);
    return acc;
  }, {});

  const handleDrop = (e, toStage) => {
    const cId = e.dataTransfer.getData('candidateId');
    if (!cId) return;
    const c = candidates.find(c => c.id === cId);
    if (!c || c.stage === toStage) { setDragOver(null); return; }
    setMoveModal({ candidate: c, toStage });
    setDragOver(null);
  };

  return (
    <div>
      <PageHeader
        title="Candidate Pipeline"
        subtitle="Track candidates through the hiring funnel"
        actions={
          <div className="flex gap-2">
            <div className="relative">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search candidates..."
                className="border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm" />
              <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs">🔍</span>
            </div>
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              {['kanban','list'].map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-1.5 text-sm capitalize ${view === v ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {v === 'kanban' ? '⊞' : '☰'}
                </button>
              ))}
            </div>
            <Button onClick={() => setShowAdd(true)}>+ Add Candidate</Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : view === 'kanban' ? (
        
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map(stage => (
            <div
              key={stage.id}
              className={`flex-shrink-0 w-52 rounded-xl border-2 ${dragOver === stage.id ? 'border-blue-400 bg-blue-50' : stage.color} transition-colors`}
              onDragOver={e => { e.preventDefault(); setDragOver(stage.id); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, stage.id)}
            >
              <div className={`px-3 py-2 rounded-t-xl flex justify-between items-center ${stage.header}`}>
                <span className="text-xs font-bold uppercase tracking-wide">{stage.label}</span>
                <span className="text-xs font-bold">{byStage[stage.id]?.length || 0}</span>
              </div>
              <div className="p-2 min-h-24">
                {(byStage[stage.id] || []).map(c => (
                  <CandidateCard key={c.id} candidate={c}
                    onClick={() => navigate(`/recruitment/candidates/${c.id}`)}
                    onMoveStage={(toStage) => setMoveModal({ candidate: c, toStage })}
                  />
                ))}
                {byStage[stage.id]?.length === 0 && (
                  <p className="text-center text-gray-300 text-xs py-6">Drop here</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex gap-2">
            <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
              <option value="">All Stages</option>
              {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          {candidates.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No candidates found</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Name','Job','Stage','Source','Exp','Expected CTC','Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {candidates.map(c => {
                  const stageMeta = STAGES.find(s => s.id === c.stage);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-gray-900">{c.first_name} {c.last_name}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{c.job?.requisition?.job_title || '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stageMeta?.header}`}>
                          {stageMeta?.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 capitalize text-xs">{c.source?.replace('_',' ')}</td>
                      <td className="px-4 py-2.5 text-gray-600">{c.experience_years || '—'} yr</td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {c.expected_ctc ? `₹${(c.expected_ctc / 100).toFixed(0)}` : '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/recruitment/candidates/${c.id}`)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {}
      <Modal
        open={!!moveModal}
        onClose={() => { setMoveModal(null); setMoveNotes(''); }}
        title={`Move to ${STAGES.find(s => s.id === moveModal?.toStage)?.label}`}
        footer={
          <>
            <Button variant="outline" onClick={() => { setMoveModal(null); setMoveNotes(''); }}>Cancel</Button>
            <Button
              onClick={() => moveMutation.mutate({ id: moveModal.candidate.id, toStage: moveModal.toStage, notes: moveNotes })}
              loading={moveMutation.isPending}
            >
              Move Stage
            </Button>
          </>
        }
      >
        <div className="py-2 space-y-3">
          <p className="text-sm text-gray-600">
            Moving <strong>{moveModal?.candidate?.first_name} {moveModal?.candidate?.last_name}</strong> from{' '}
            <span className="font-medium">{moveModal?.candidate?.stage}</span> →{' '}
            <span className="font-medium text-blue-700">{moveModal?.toStage}</span>
          </p>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Notes (optional)</label>
            <textarea rows={2} value={moveNotes} onChange={e => setMoveNotes(e.target.value)}
              placeholder="e.g. Good communication skills, proceed to technical round"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
          </div>
        </div>
      </Modal>

      {}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Candidate" size="lg">
        {jobs.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500 text-sm">No active job openings. Post a job first.</p>
          </div>
        ) : (
          <AddCandidateForm jobs={jobs} onSubmit={addMutation.mutate} loading={addMutation.isPending} />
        )}
      </Modal>
    </div>
  );
}

