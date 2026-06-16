import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { leaveApi } from '../../services/attendanceLeaveApi';
import { Avatar, Spinner, Button, PageHeader, Modal } from '../../components/ui/Common';

export function LeaveApprovalsPage() {
  const queryClient = useQueryClient();
  const [rejectModal, setRejectModal] = useState({ open: false, id: null });
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['leave-approvals'],
    queryFn: leaveApi.getPendingApprovals,
  });
  const applications = data?.data || [];

  const approveMutation = useMutation({
    mutationFn: ({ id, comment }) => leaveApi.approve(id, comment),
    onSuccess: () => { toast.success('Leave approved!'); queryClient.invalidateQueries(['leave-approvals']); },
    onError: () => toast.error('Failed.'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => leaveApi.reject(id, reason),
    onSuccess: () => {
      toast.success('Rejected.');
      setRejectModal({ open: false, id: null });
      setRejectReason('');
      queryClient.invalidateQueries(['leave-approvals']);
    },
  });

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';

  return (
    <div>
      <PageHeader title="Leave Approvals" subtitle={`${applications.length} pending`} />

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-lg font-semibold text-gray-900">All caught up!</p>
          <p className="text-sm text-gray-500">No pending leave approvals.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <Avatar name={`${app.employee?.first_name} ${app.employee?.last_name}`} photoUrl={app.employee?.photo_url} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">
                      {app.employee?.first_name} {app.employee?.last_name}
                      <span className="text-gray-400 text-sm font-normal ml-2">{app.employee?.employee_code}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: app.leave_type?.color || '#3B82F6' }} />
                        {app.leave_type?.name}
                      </span>
                      <span className="text-sm text-gray-600">
                        {fmt(app.from_date)} {app.days > 1 ? `→ ${fmt(app.to_date)}` : ''}
                      </span>
                      <span className="text-sm font-semibold text-primary">{app.days} day{app.days !== 1 ? 's' : ''}</span>
                      {app.leave_type?.is_paid ? (
                        <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Paid</span>
                      ) : (
                        <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Unpaid</span>
                      )}
                    </div>
                    {app.reason && (
                      <p className="text-sm text-gray-500 mt-2 italic">"{app.reason}"</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">Applied {new Date(app.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => approveMutation.mutate({ id: app.id })}
                    disabled={approveMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-60"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => setRejectModal({ open: true, id: app.id })}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100"
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={rejectModal.open}
        onClose={() => setRejectModal({ open: false, id: null })}
        title="Reject Leave — Enter Reason"
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectModal({ open: false, id: null })}>Cancel</Button>
            <Button variant="danger"
              onClick={() => rejectMutation.mutate({ id: rejectModal.id, reason: rejectReason })}
              loading={rejectMutation.isPending}
              disabled={!rejectReason.trim()}
            >
              Reject
            </Button>
          </>
        }
      >
        <textarea
          className="w-full border border-gray-300 rounded-lg p-3 text-sm"
          rows={4}
          placeholder="Reason for rejection (mandatory, will be shared with employee)"
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
        />
      </Modal>
    </div>
  );
}

export function MyLeavePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelId, setCancelId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-leaves'],
    queryFn: () => leaveApi.myApplications({ year: new Date().getFullYear() }),
  });
  const applications = data?.data || [];

  const cancelMutation = useMutation({
    mutationFn: (id) => leaveApi.cancel(id),
    onSuccess: () => {
      toast.success('Leave cancelled.');
      setCancelId(null);
      queryClient.invalidateQueries(['my-leaves']);
      queryClient.invalidateQueries(['leave-dashboard']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Cannot cancel this leave.'),
  });

  const STATUS_COLORS = {
    pending:   'bg-amber-100 text-amber-700 border-amber-200',
    approved:  'bg-green-100 text-green-700 border-green-200',
    rejected:  'bg-red-100 text-red-700 border-red-200',
    cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div>
      <PageHeader
        title="My Leave Applications"
        actions={<Button onClick={() => navigate('/leave/apply')}>+ Apply Leave</Button>}
      />

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500">No leave applications yet.</p>
          <Button className="mt-4" onClick={() => navigate('/leave/apply')}>Apply for Leave</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <div key={app.id} className={`bg-white rounded-xl border p-4 ${STATUS_COLORS[app.status] || 'border-gray-200'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: app.leave_type?.color || '#3B82F6' }} />
                    <p className="font-semibold text-gray-900">{app.leave_type?.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize border" style={{ borderColor: 'currentColor' }}>
                      {app.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {fmt(app.from_date)} {app.days > 1 ? `→ ${fmt(app.to_date)}` : ''}
                    <span className="font-semibold ml-2 text-primary">{app.days} day{app.days !== 1 ? 's' : ''}</span>
                    {app.is_half_day && <span className="ml-2 text-xs text-gray-500">(Half Day — {app.half_day_type} half)</span>}
                  </p>
                  {app.reason && <p className="text-xs text-gray-500 mt-1">Reason: {app.reason}</p>}
                  {app.rejection_reason && (
                    <p className="text-xs text-red-600 mt-1">❌ Rejected: {app.rejection_reason}</p>
                  )}
                </div>
                {['pending','approved'].includes(app.status) && new Date(app.from_date) >= new Date() && (
                  <button
                    onClick={() => setCancelId(app.id)}
                    className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 px-2 py-1 rounded"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {cancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4">
            <p className="font-semibold text-gray-900 mb-2">Cancel this leave?</p>
            <p className="text-sm text-gray-500 mb-4">This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCancelId(null)}>Keep It</Button>
              <Button variant="danger" onClick={() => cancelMutation.mutate(cancelId)} loading={cancelMutation.isPending}>
                Yes, Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaveApprovalsPage;

