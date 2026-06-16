import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { recruitmentApi } from '../../services/recruitmentApi';
import { PageHeader, Button, Spinner, Modal, Input } from '../../components/ui/Common';

const STAGE_META = {
  applied:   { label: 'Applied',   color: 'bg-gray-100 text-gray-700' },
  screening: { label: 'Screening', color: 'bg-blue-100 text-blue-700' },
  interview: { label: 'Interview', color: 'bg-purple-100 text-purple-700' },
  offer:     { label: 'Offer',     color: 'bg-yellow-100 text-yellow-700' },
  joined:    { label: 'Joined',    color: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Rejected',  color: 'bg-red-100 text-red-700' },
};

const ROUND_LABELS = { 1: '1st Round', 2: '2nd Round', 3: '3rd Round', 4: 'HR Round', 5: 'Final Round' };

export default function CandidateDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [scheduleModal,  setScheduleModal]  = useState(false);
  const [feedbackModal,  setFeedbackModal]  = useState(null); 
  const [offerModal,     setOfferModal]     = useState(false);
  const [convertModal,   setConvertModal]   = useState(false);
  const [rejectModal,    setRejectModal]    = useState(false);

  const [iForm, setIForm] = useState({
    roundNumber: 1, interviewType: 'in_person',
    scheduledAt: '', durationMins: 60, venue: '', meetingLink: '',
  });

  const [offeredCtc, setOfferedCtc] = useState('');
  const [joiningDate, setJoiningDate] = useState('');

  const [fbRating, setFbRating]     = useState(3);
  const [fbRecommend, setFbRecommend] = useState('proceed');
  const [fbComments, setFbComments] = useState('');

  const [convJoinDate, setConvJoinDate] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['candidate', id],
    queryFn:  () => recruitmentApi.getCandidate(id),
  });

  const scheduleMutation = useMutation({
    mutationFn: (data) => recruitmentApi.scheduleInterview(data),
    onSuccess: () => { toast.success('Interview scheduled!'); setScheduleModal(false); queryClient.invalidateQueries(['candidate', id]); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ intId, data }) => recruitmentApi.submitFeedback(intId, data),
    onSuccess: () => { toast.success('Feedback submitted!'); setFeedbackModal(null); queryClient.invalidateQueries(['candidate', id]); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const offerMutation = useMutation({
    mutationFn: (data) => recruitmentApi.createOffer(data),
    onSuccess: () => { toast.success('Offer created!'); setOfferModal(false); queryClient.invalidateQueries(['candidate', id]); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const convertMutation = useMutation({
    mutationFn: ({ cId, joiningDate }) => recruitmentApi.convertToEmployee(cId, { joiningDate }),
    onSuccess: (res) => {
      toast.success(`Employee ${res.data.employeeCode} created!`);
      setConvertModal(false);
      navigate(`/employees/${res.data.employee.id}`);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const moveMutation = useMutation({
    mutationFn: ({ toStage }) => recruitmentApi.moveStage(id, { toStage }),
    onSuccess: () => { toast.success('Stage updated.'); queryClient.invalidateQueries(['candidate', id]); setRejectModal(false); },
  });

  const c = data?.data;
  if (isLoading) return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  if (!c) return <div className="text-center py-20 text-gray-400">Candidate not found.</div>;

  const stageMeta = STAGE_META[c.stage] || {};
  const offer     = c.offers?.[0];

  return (
    <div>
      <PageHeader
        title={`${c.first_name} ${c.last_name || ''}`}
        subtitle={c.job?.requisition?.job_title || 'Candidate'}
        actions={
          <div className="flex gap-2">
            {c.stage !== 'rejected' && c.stage !== 'joined' && (
              <Button variant="outline" className="text-red-600 border-red-200"
                onClick={() => setRejectModal(true)}>
                ✕ Reject
              </Button>
            )}
            {['applied','screening','interview'].includes(c.stage) && (
              <Button variant="outline" onClick={() => setScheduleModal(true)}>🗓 Schedule Interview</Button>
            )}
            {c.stage === 'interview' && !offer && (
              <Button variant="outline" onClick={() => setOfferModal(true)}>📨 Generate Offer</Button>
            )}
            {c.stage === 'offer' && offer?.status === 'accepted' && (
              <Button onClick={() => setConvertModal(true)}>✅ Convert to Employee</Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {}
        <div className="space-y-4">
          {}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">
                {c.first_name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900">{c.first_name} {c.last_name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stageMeta.color}`}>{stageMeta.label}</span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {[
                { icon: '📧', val: c.email },
                { icon: '📱', val: c.phone },
                { icon: '💼', val: c.experience_years ? `${c.experience_years} years experience` : null },
                { icon: '🕐', val: c.notice_period ? `${c.notice_period} days notice` : null },
                { icon: '💰', val: c.current_ctc ? `Current: ₹${(c.current_ctc/100).toLocaleString('en-IN')}` : null },
                { icon: '🎯', val: c.expected_ctc ? `Expected: ₹${(c.expected_ctc/100).toLocaleString('en-IN')}` : null },
                { icon: '📣', val: c.source ? `Source: ${c.source.replace('_',' ')}` : null },
              ].filter(x => x.val).map(({ icon, val }, i) => (
                <p key={i} className="flex gap-2 items-start text-gray-600">
                  <span>{icon}</span><span>{val}</span>
                </p>
              ))}
            </div>
          </div>

          {}
          {offer && (
            <div className={`rounded-xl border p-4 ${
              offer.status === 'accepted' ? 'bg-green-50 border-green-200' :
              offer.status === 'declined' ? 'bg-red-50 border-red-200' :
              'bg-yellow-50 border-yellow-200'
            }`}>
              <p className="font-semibold text-gray-800 mb-2">📨 Offer Letter</p>
              <p className="text-sm">Status: <strong className="capitalize">{offer.status}</strong></p>
              {offer.offered_ctc && (
                <p className="text-sm mt-1">CTC: <strong>₹{(offer.offered_ctc/100).toLocaleString('en-IN')}</strong></p>
              )}
              {offer.joining_date && (
                <p className="text-sm mt-1">Joining: <strong>{new Date(offer.joining_date).toLocaleDateString('en-IN')}</strong></p>
              )}
              {offer.status === 'generated' && (
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={() => offerMutation.mutate({ id: offer.id })} disabled>Accept</Button>
                  <Button size="sm" variant="outline" onClick={() => recruitmentApi.declineOffer(offer.id).then(() => {
                    toast.success('Offer declined.'); queryClient.invalidateQueries(['candidate', id]);
                  })}>Decline</Button>
                </div>
              )}
              {offer.status === 'accepted' && (
                <Button size="sm" className="mt-3 w-full" onClick={() => setConvertModal(true)}>
                  ✅ Convert to Employee
                </Button>
              )}
            </div>
          )}
        </div>

        {}
        <div className="lg:col-span-2 space-y-4">
          {}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 mb-4">Activity Timeline</h3>
            <div className="space-y-3">
              {(c.stage_history || []).length === 0 ? (
                <p className="text-sm text-gray-400">No activity recorded.</p>
              ) : c.stage_history.map((h, i) => (
                <div key={h.id} className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {h.from_stage ? `${h.from_stage} → ` : ''}
                      <span className="text-blue-700">{h.to_stage}</span>
                    </p>
                    {h.notes && <p className="text-xs text-gray-500">{h.notes}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(h.changed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {}
          {(c.interviews || []).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-4">Interviews</h3>
              <div className="space-y-3">
                {c.interviews.map(int => {
                  const hasFeedback = int.feedback?.length > 0;
                  return (
                    <div key={int.id} className={`border rounded-xl p-4 ${
                      int.status === 'cancelled' ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-purple-100 bg-purple-50'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {ROUND_LABELS[int.round_number] || `Round ${int.round_number}`}
                            <span className="ml-2 text-xs capitalize text-gray-500">{int.interview_type?.replace('_',' ')}</span>
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {new Date(int.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            {' · '}{int.duration_mins} mins
                          </p>
                          {int.venue && <p className="text-xs text-gray-500">📍 {int.venue}</p>}
                          {int.meeting_link && <p className="text-xs text-blue-600">🔗 {int.meeting_link}</p>}
                        </div>
                        <div className="flex gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                            int.status === 'scheduled' ? 'bg-purple-100 text-purple-700' :
                            int.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>{int.status}</span>
                          {!hasFeedback && int.status !== 'cancelled' && (
                            <Button size="sm" onClick={() => setFeedbackModal(int.id)}>+ Feedback</Button>
                          )}
                        </div>
                      </div>

                      {hasFeedback && int.feedback.map(fb => (
                        <div key={fb.id} className="mt-3 pt-3 border-t border-purple-200">
                          <div className="flex gap-2 items-center">
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(s => (
                                <span key={s} className={s <= fb.overall_rating ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                              ))}
                            </div>
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${
                              fb.recommendation === 'proceed' ? 'bg-green-100 text-green-700' :
                              fb.recommendation === 'reject'  ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>{fb.recommendation}</span>
                          </div>
                          {fb.comments && <p className="text-xs text-gray-600 mt-1">"{fb.comments}"</p>}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {}
      <Modal open={scheduleModal} onClose={() => setScheduleModal(false)} title="Schedule Interview">
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Round</label>
              <select value={iForm.roundNumber} onChange={e => setIForm(p => ({...p, roundNumber: parseInt(e.target.value)}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                {[1,2,3,4,5].map(r => <option key={r} value={r}>{ROUND_LABELS[r]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Type</label>
              <select value={iForm.interviewType} onChange={e => setIForm(p => ({...p, interviewType: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white capitalize">
                {['in_person','video','phone'].map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Date & Time *</label>
              <input type="datetime-local" value={iForm.scheduledAt}
                onChange={e => setIForm(p => ({...p, scheduledAt: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Duration (mins)</label>
              <input type="number" value={iForm.durationMins}
                onChange={e => setIForm(p => ({...p, durationMins: parseInt(e.target.value)}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Venue</label>
              <input value={iForm.venue} onChange={e => setIForm(p => ({...p, venue: e.target.value}))}
                placeholder="Conference Room A" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Meeting Link</label>
              <input value={iForm.meetingLink} onChange={e => setIForm(p => ({...p, meetingLink: e.target.value}))}
                placeholder="https://meet.google.com/..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              onClick={() => scheduleMutation.mutate({ ...iForm, candidateId: id })}
              loading={scheduleMutation.isPending}
            >
              Schedule
            </Button>
          </div>
        </div>
      </Modal>

      {}
      <Modal
        open={!!feedbackModal}
        onClose={() => setFeedbackModal(null)}
        title="Interview Feedback"
        footer={
          <>
            <Button variant="outline" onClick={() => setFeedbackModal(null)}>Cancel</Button>
            <Button
              onClick={() => feedbackMutation.mutate({ intId: feedbackModal, data: {
                overallRating: fbRating, recommendation: fbRecommend, comments: fbComments,
              }})}
              loading={feedbackMutation.isPending}
            >
              Submit Feedback
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Overall Rating</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setFbRating(s)}
                  className={`w-9 h-9 rounded-full text-lg transition-all ${s <= fbRating ? 'text-yellow-400 bg-yellow-50' : 'text-gray-300 bg-gray-50'}`}>
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Recommendation</label>
            <div className="flex gap-2">
              {[
                { val: 'proceed', label: '✓ Proceed',     cls: 'border-green-200 bg-green-50 text-green-700' },
                { val: 'hold',    label: '⏸ Hold',        cls: 'border-yellow-200 bg-yellow-50 text-yellow-700' },
                { val: 'reject',  label: '✕ Reject',      cls: 'border-red-200 bg-red-50 text-red-700' },
              ].map(r => (
                <button key={r.val} onClick={() => setFbRecommend(r.val)}
                  className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                    fbRecommend === r.val ? r.cls + ' border-opacity-100' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Comments</label>
            <textarea rows={3} value={fbComments} onChange={e => setFbComments(e.target.value)}
              placeholder="Strengths, concerns, notes..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
          </div>
        </div>
      </Modal>

      {}
      <Modal
        open={offerModal}
        onClose={() => setOfferModal(false)}
        title="Generate Offer"
        footer={
          <>
            <Button variant="outline" onClick={() => setOfferModal(false)}>Cancel</Button>
            <Button
              onClick={() => offerMutation.mutate({ candidateId: id, offeredCtc: parseFloat(offeredCtc) * 100000, joiningDate })}
              loading={offerMutation.isPending}
            >
              Generate Offer
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Offered CTC (₹ LPA)</label>
            <input type="number" value={offeredCtc} onChange={e => setOfferedCtc(e.target.value)}
              placeholder="12" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Proposed Joining Date</label>
            <input type="date" value={joiningDate} onChange={e => setJoiningDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
      </Modal>

      {}
      <Modal
        open={convertModal}
        onClose={() => setConvertModal(false)}
        title="Convert to Employee"
        footer={
          <>
            <Button variant="outline" onClick={() => setConvertModal(false)}>Cancel</Button>
            <Button
              onClick={() => convertMutation.mutate({ cId: id, joiningDate: convJoinDate || offer?.joining_date })}
              loading={convertMutation.isPending}
            >
              ✅ Create Employee Record
            </Button>
          </>
        }
      >
        <div className="space-y-3 py-2">
          <p className="text-sm text-gray-600">
            An employee record will be created for <strong>{c.first_name} {c.last_name}</strong>.
            You can complete their full profile from the Employees section.
          </p>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Date of Joining *</label>
            <input type="date" value={convJoinDate}
              onChange={e => setConvJoinDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
      </Modal>

      {}
      <Modal
        open={rejectModal}
        onClose={() => setRejectModal(false)}
        title="Reject Candidate"
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectModal(false)}>Cancel</Button>
            <Button variant="danger"
              onClick={() => moveMutation.mutate({ toStage: 'rejected' })}
              loading={moveMutation.isPending}>
              Reject
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 py-3">
          Mark <strong>{c.first_name} {c.last_name}</strong> as rejected?
          This will move them to the rejected stage in the pipeline.
        </p>
      </Modal>
    </div>
  );
}

