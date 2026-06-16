import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { trainingApi } from '../../services/moduleApis';
import { employeeApi } from '../../services/employeeApi';
import { PageHeader, Button, Spinner, Tabs, Modal, Input, Badge } from '../../components/ui';

const TABS = [
  { id: 'upcoming', label: 'Upcoming', icon: '📅' },
  { id: 'all', label: 'All', icon: '📚' },
  { id: 'mine', label: 'My Trainings', icon: '🎓' },
];

const STATUS_STYLE = {
  upcoming: 'bg-blue-100 text-blue-700 border-blue-200',
  ongoing: 'bg-green-100 text-green-700 border-green-200',
  completed: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const EMPTY_FORM = {
  name: '', type: 'internal', trainerName: '', startDate: '', endDate: '',
  durationHours: '', venue: '', platform: '', maxParticipants: '', cost: '',
};

export default function TrainingPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('upcoming');
  const [addModal, setAddModal] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [nominateModal, setNominateModal] = useState(null);
  const [attendModal, setAttendModal] = useState(null);
  const [feedModal, setFeedModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedEmps, setSelectedEmps] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [feedback, setFeedback] = useState({ contentRating: 5, trainerRating: 5, overallRating: 5, comments: '' });

  const F = (f) => ({ value: form[f], onChange: e => setForm(p => ({ ...p, [f]: e.target.value })) });

  const { data: upData, isLoading: upLoading } = useQuery({ queryKey: ['trainings-up'], queryFn: () => trainingApi.list({ upcoming: true }), enabled: tab === 'upcoming' });
  const { data: allData, isLoading: allLoading } = useQuery({ queryKey: ['trainings-all'], queryFn: () => trainingApi.list(), enabled: tab === 'all' });
  const { data: mineData } = useQuery({ queryKey: ['my-trainings'], queryFn: trainingApi.myTrainings, enabled: tab === 'mine' });
  const { data: detailData } = useQuery({ queryKey: ['training-detail', detailModal], queryFn: () => trainingApi.get(detailModal), enabled: !!detailModal });
  const { data: empsData } = useQuery({ queryKey: ['employees-simple'], queryFn: () => employeeApi.getEmployees({ limit: 200 }), enabled: !!nominateModal });

  const inv = (...keys) => keys.forEach(k => qc.invalidateQueries({ queryKey: [k] }));

  const createMut = useMutation({
    mutationFn: (d) => trainingApi.create(d),
    onSuccess: () => { toast.success('Training created!'); inv('trainings-up', 'trainings-all'); setAddModal(false); setForm(EMPTY_FORM); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const nominateMut = useMutation({
    mutationFn: ({ id, empIds }) => trainingApi.nominate(id, empIds),
    onSuccess: () => { toast.success('Nominated!'); inv('training-detail'); setNominateModal(null); setSelectedEmps([]); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const attendMut = useMutation({
    mutationFn: ({ id, records }) => trainingApi.markAttendance(id, records),
    onSuccess: () => { toast.success('Attendance marked!'); inv('training-detail'); setAttendModal(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const feedMut = useMutation({
    mutationFn: ({ id, ...d }) => trainingApi.submitFeedback(id, d),
    onSuccess: () => { toast.success('Feedback submitted!'); setFeedModal(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const trainings = (tab === 'upcoming' ? upData?.data : allData?.data) || [];
  const myTrainings = mineData?.data || [];
  const detail = detailData?.data;
  const allEmps = (empsData?.data?.data || []);

  const submitAttendance = () => {
    const records = detail.nominations.map(n => ({
      employeeId: n.employee_id,
      attended: attendance[n.employee_id] ?? false,
      hoursAttended: attendance[`${n.employee_id}_hours`] || null,
    }));
    attendMut.mutate({ id: detail.id, records });
  };

  const renderList = (list, loading) => {
    if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
    if (!list.length) return (
      <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
        <p className="text-4xl mb-3">📚</p>
        <p className="font-semibold text-gray-800">No sessions available</p>
        <Button variant="outline" className="mt-4" onClick={() => setAddModal(true)}>Create Training Session</Button>
      </div>
    );
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map(t => (
          <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-blue-200 transition-all group">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">{t.name}</h3>
              <Badge className={STATUS_STYLE[t.status]}>{t.status}</Badge>
            </div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-widest space-y-2 mb-4">
              <div className="flex items-center gap-2"><span>📅</span> {new Date(t.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              {t.trainer_name && <div className="flex items-center gap-2"><span>👤</span> {t.trainer_name}</div>}
              {t.venue && <div className="flex items-center gap-2"><span>📍</span> {t.venue}</div>}
              {t.platform && <div className="flex items-center gap-2"><span>💻</span> {t.platform}</div>}
              <div className="flex items-center gap-2 text-blue-500"><span>👥</span> {t._count?.nominations || 0} NOMINEES</div>
            </div>
            <div className="flex gap-2 border-t border-gray-50 pt-4">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setDetailModal(t.id)}>Details</Button>
              {t.status !== 'completed' && <Button size="sm" className="flex-1" onClick={() => setNominateModal(t)}>Nominate</Button>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Training & Development" subtitle="Empower your workforce with scheduled skill sessions"
        actions={<Button onClick={() => setAddModal(true)}>+ Schedule New Training</Button>} />
      <Tabs tabs={TABS} active={tab} onChange={setTab} className="mb-6" />

      {tab === 'upcoming' && renderList(trainings, upLoading)}
      {tab === 'all' && renderList(trainings, allLoading)}
      {tab === 'mine' && (
        myTrainings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
            <p className="text-4xl mb-3">🎓</p>
            <p className="font-semibold text-gray-800">You haven't been nominated yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {myTrainings.map(t => (
              <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex justify-between mb-3">
                  <h3 className="font-bold text-gray-900">{t.name}</h3>
                  <Badge className={STATUS_STYLE[t.status]}>{t.status}</Badge>
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase">Start Date: {new Date(t.start_date).toLocaleDateString('en-IN')}</p>
                {t.status === 'completed' && <Button size="sm" variant="success" className="mt-4 w-full" onClick={() => setFeedModal(t)}>Provide Feedback</Button>}
              </div>
            ))}
          </div>
        )
      )}

      {/* Schedule Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Schedule Training Session" size="md">
        <div className="space-y-4">
          <Input label="Training Title *" placeholder="e.g. Advanced Cybersecurity Workshop" {...F('name')} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Session Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                {['internal', 'external', 'online'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
            <Input label="Lead Trainer" placeholder="Name..." {...F('trainerName')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date *" type="date" {...F('startDate')} />
            <Input label="End Date" type="date" {...F('endDate')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Duration (Hours)" type="number" {...F('durationHours')} />
            <Input label="Max Intake" type="number" {...F('maxParticipants')} />
          </div>
          <Input label="Physical Venue" placeholder="Room/Hall name..." {...F('venue')} />
          <Input label="Online Platform" placeholder="e.g. MS Teams" {...F('platform')} />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
            <Button variant="outline" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button onClick={() => createMut.mutate(form)} loading={createMut.isPending}>Create Session</Button>
          </div>
        </div>
      </Modal>

      {/* Nominate Modal */}
      <Modal open={!!nominateModal} onClose={() => setNominateModal(null)} title="Select Employees to Nominate" size="md">
        <div className="max-h-80 overflow-y-auto space-y-1 mb-4 pr-1 custom-scrollbar">
          {allEmps.map(e => (
            <label key={e.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-100 transition-all">
              <input type="checkbox"
                checked={selectedEmps.includes(e.id)}
                onChange={ev => setSelectedEmps(p => ev.target.checked ? [...p, e.id] : p.filter(x => x !== e.id))}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <div className="flex-1">
                <div className="text-sm font-bold text-gray-900">{e.firstName} {e.lastName}</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{e.employeeCode} · {e.department?.name}</div>
              </div>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
          <Button variant="outline" onClick={() => setNominateModal(null)}>Cancel</Button>
          <Button onClick={() => nominateMut.mutate({ id: nominateModal.id, empIds: selectedEmps })} loading={nominateMut.isPending} disabled={!selectedEmps.length}>
            Nominate {selectedEmps.length > 0 ? `(${selectedEmps.length})` : ''}
          </Button>
        </div>
      </Modal>

      {/* Feedback Modal */}
      <Modal open={!!feedModal} onClose={() => setFeedModal(null)} title="Session Feedback" size="md">
        <div className="space-y-6">
          {[
            { label: 'How would you rate the content quality?', field: 'contentRating' },
            { label: 'How would you rate the trainer\'s expertise?', field: 'trainerRating' },
            { label: 'Overall session satisfaction?', field: 'overallRating' },
          ].map(({ label, field }) => (
            <div key={field}>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3">{label}</label>
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map(r => (
                  <button key={r} onClick={() => setFeedback(p => ({ ...p, [field]: r }))}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all shadow-sm border ${feedback[field] >= r ? 'bg-yellow-50 border-yellow-200 grayscale-0 scale-110' : 'bg-gray-50 border-gray-100 grayscale opacity-40'}`}>
                    ⭐
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Additional Comments</label>
            <textarea rows={3} value={feedback.comments} onChange={e => setFeedback(p => ({ ...p, comments: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none shadow-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
            <Button variant="outline" onClick={() => setFeedModal(null)}>Cancel</Button>
            <Button onClick={() => feedMut.mutate({ id: feedModal.id, ...feedback })} loading={feedMut.isPending}>Submit Review</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

