import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { leaveApi } from '../../services/attendanceLeaveApi';
import { Spinner, Button, PageHeader, Modal, Badge } from '../../components/ui/Common';

const BalanceCard = ({ balance }) => {
  const used = balance.used + balance.pending;
  const total = balance.opening + balance.accrued;
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: balance.leaveType?.color || '#3B82F6' }} />
            <p className="text-sm font-semibold text-gray-900">{balance.leaveType?.name}</p>
            <span className="text-xs text-gray-400">{balance.leaveType?.code}</span>
          </div>
          {!balance.leaveType?.is_paid && (
            <span className="text-xs text-red-500 mt-0.5">Unpaid</span>
          )}
        </div>
        <p className="text-2xl font-bold text-gray-900">{balance.available}</p>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${100 - pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Used: {balance.used} {balance.pending > 0 ? `(+${balance.pending} pending)` : ''}</span>
        <span>Total: {total}</span>
      </div>
    </div>
  );
};

const LeaveStatusBadge = ({ status }) => {
  const colors = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-500' };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${colors[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
};

export function LeaveDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rejectModal, setRejectModal] = useState({ open: false, id: null });
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['leave-dashboard'], queryFn: leaveApi.dashboard });
  const dash = data?.data;

  const approveMutation = useMutation({
    mutationFn: (id) => leaveApi.approve(id),
    onSuccess: () => { toast.success('Leave approved!'); queryClient.invalidateQueries(['leave-dashboard']); },
    onError: () => toast.error('Failed to approve.'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => leaveApi.reject(id, reason),
    onSuccess: () => {
      toast.success('Leave rejected.');
      setRejectModal({ open: false, id: null });
      setRejectReason('');
      queryClient.invalidateQueries(['leave-dashboard']);
    },
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <PageHeader
        title="Leave"
        subtitle="Manage your leave and approvals"
        actions={<Button onClick={() => navigate('/leave/apply')}>+ Apply Leave</Button>}
      />

      {}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">My Leave Balances ({new Date().getFullYear()})</h2>
        {(dash?.balances || []).length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-6 text-center text-sm text-gray-500">
            No leave types configured. Contact HR.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {dash.balances.map(b => <BalanceCard key={b.id} balance={b} />)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {}
        {(dash?.pendingApprovals || 0) > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Pending Approvals</h2>
              <Button size="sm" variant="outline" onClick={() => navigate('/leave/approvals')}>View All</Button>
            </div>
            <div className="space-y-3">
              {(dash?.myPending || []).slice(0, 5).map(app => (
                <div key={app.id} className="flex items-start justify-between p-3 bg-amber-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {app.employee?.first_name} {app.employee?.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {app.leave_type?.name} · {app.days} day{app.days !== 1 ? 's' : ''} · {new Date(app.from_date).toLocaleDateString('en-IN')} {app.days > 1 ? `to ${new Date(app.to_date).toLocaleDateString('en-IN')}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-1.5 ml-2">
                    <button onClick={() => approveMutation.mutate(app.id)}
                      className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
                      ✓
                    </button>
                    <button onClick={() => setRejectModal({ open: true, id: app.id })}
                      className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">My Applications</h2>
            <Button size="sm" variant="outline" onClick={() => navigate('/leave/my')}>View All</Button>
          </div>
          {(dash?.myPending || []).length === 0 && (dash?.myUpcoming || []).length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No recent applications.</p>
          ) : (
            <div className="space-y-2">
              {[...(dash?.myPending || []), ...(dash?.myUpcoming || [])].slice(0, 5).map(app => (
                <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{app.leave_type?.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(app.from_date).toLocaleDateString('en-IN')} · {app.days} day{app.days !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <LeaveStatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {}
        <div className="bg-white rounded-xl border border-gray-200 p-5 md:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-3">Team on Leave Today</h2>
          {(dash?.teamOnLeave || []).length === 0 ? (
            <p className="text-sm text-gray-500">Everyone is at work today! 🎉</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {dash.teamOnLeave.map(l => (
                <div key={l.id} className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                  <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold text-blue-800">
                    {l.employee.fullName?.[0]}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">{l.employee.fullName}</p>
                    <p className="text-xs text-blue-600">{l.leaveType}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {}
      <Modal
        open={rejectModal.open}
        onClose={() => setRejectModal({ open: false, id: null })}
        title="Reject Leave — Reason Required"
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectModal({ open: false, id: null })}>Cancel</Button>
            <Button variant="danger"
              onClick={() => rejectMutation.mutate({ id: rejectModal.id, reason: rejectReason })}
              loading={rejectMutation.isPending}
              disabled={!rejectReason.trim()}
            >
              Reject Leave
            </Button>
          </>
        }
      >
        <textarea
          className="w-full border border-gray-300 rounded-lg p-3 text-sm"
          rows={3}
          placeholder="Enter reason for rejection (mandatory)"
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
        />
      </Modal>
    </div>
  );
}

export default LeaveDashboardPage;

