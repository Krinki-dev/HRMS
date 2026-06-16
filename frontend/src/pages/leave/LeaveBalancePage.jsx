import { useState }    from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast }       from 'react-hot-toast';
import api             from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { PageHeader, Button, Modal, Input, Select, Spinner, SearchInput } from '../../components/ui/Common';

const balanceApi = {
  getAllBalances: (params) => api.get('/leave/balances/all', { params }).then(r => r.data),
  getMyBalances:  ()      => api.get('/leave/balances').then(r => r.data),
  adjustBalance:  (d)     => api.post('/leave/balances/adjust', d).then(r => r.data),
  getLeaveTypes:  ()      => api.get('/leave/types').then(r => r.data),
};

function BalanceBar({ used, total, color = '#3B82F6' }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5">
      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export default function LeaveBalancePage() {
  const qc          = useQueryClient();
  const { user }    = useAuthStore();
  const isHR        = ['admin','hr_admin','super_admin'].includes(user?.role?.toLowerCase());

  const [search,       setSearch]       = useState('');
  const [leaveTypeId,  setLeaveTypeId]  = useState('');
  const [adjustModal,  setAdjustModal]  = useState(null); 
  const [adjForm,      setAdjForm]      = useState({ days: '', reason: '', type: 'credit' });

  const year = new Date().getFullYear();

  const { data: allRes, isLoading: allLoading } = useQuery({
    queryKey: ['all-balances', search, leaveTypeId, year],
    queryFn:  () => balanceApi.getAllBalances({ search, leaveTypeId, year }),
    enabled:  isHR,
  });

  const { data: myRes, isLoading: myLoading } = useQuery({
    queryKey: ['my-balances'],
    queryFn:  balanceApi.getMyBalances,
    enabled:  !isHR,
  });

  const { data: typesRes } = useQuery({
    queryKey: ['leave-types'],
    queryFn:  balanceApi.getLeaveTypes,
  });

  const leaveTypes     = typesRes?.data   || [];
  const leaveTypeOpts  = leaveTypes.map(t => ({ value: t.id, label: t.name }));
  const allBalances    = allRes?.data     || [];
  const myBalances     = myRes?.data      || [];

  const adjustMutation = useMutation({
    mutationFn: balanceApi.adjustBalance,
    onSuccess: () => {
      toast.success('Balance adjusted and recorded');
      qc.invalidateQueries({ queryKey: ['all-balances'] });
      setAdjustModal(null);
      setAdjForm({ days: '', reason: '', type: 'credit' });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to adjust'),
  });

  const submitAdjust = () => {
    if (!adjForm.days || isNaN(adjForm.days) || +adjForm.days <= 0)
      { toast.error('Enter valid number of days'); return; }
    if (!adjForm.reason.trim())
      { toast.error('Reason is required for audit'); return; }
    adjustMutation.mutate({
      employeeId:  adjustModal.empId,
      leaveTypeId: adjustModal.leaveTypeId,
      days:        adjForm.type === 'debit' ? -Math.abs(+adjForm.days) : Math.abs(+adjForm.days),
      reason:      adjForm.reason,
      year,
    });
  };

  if (!isHR) {
    return (
      <div>
        <PageHeader title="My Leave Balances" subtitle={`Leave entitlements for ${year}`} />
        {myLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myBalances.map(b => {
              const total = (b.openingBalance || 0) + (b.accrued || 0);
              const used  = (b.used || 0) + (b.pending || 0);
              return (
                <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{b.leaveType?.name}</p>
                      <p className="text-xs text-gray-400">{b.leaveType?.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{b.available ?? (total - used)}</p>
                      <p className="text-xs text-gray-500">available</p>
                    </div>
                  </div>
                  <BalanceBar used={used} total={total} />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Used: {b.used || 0}{b.pending > 0 ? ` (+${b.pending} pending)` : ''}</span>
                    <span>Total: {total}</span>
                  </div>
                  {b.leaveType?.carryForward && b.carryForward > 0 && (
                    <p className="text-xs text-green-600 mt-1">Carry forward: {b.carryForward} days</p>
                  )}
                  {!b.leaveType?.isPaid && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full mt-1 inline-block">Unpaid</span>
                  )}
                </div>
              );
            })}
            {myBalances.length === 0 && (
              <div className="col-span-3 text-center py-12 text-gray-400">
                No leave types configured. Contact HR.
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Leave Balances"
        subtitle={`All employee leave balances — ${year}`}
        actions={
          <button onClick={() => toast('Use Settings → Leave Types to configure accrual rules')}
            className="text-xs text-blue-600 hover:underline">
            Accrual Settings
          </button>
        }
      />

      {}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search employee..." className="flex-1 min-w-48" />
        <Select
          options={leaveTypeOpts}
          placeholder="All leave types"
          value={leaveTypeId}
          onChange={e => setLeaveTypeId(e.target.value)}
        />
        {(search || leaveTypeId) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setLeaveTypeId(''); }}>
            ✕ Clear
          </Button>
        )}
      </div>

      {}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {allLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : allBalances.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold">Employee</th>
                  {(leaveTypeId
                    ? leaveTypes.filter(t => t.id === leaveTypeId)
                    : leaveTypes
                  ).map(lt => (
                    <th key={lt.id} className="px-3 py-3 text-center text-xs text-gray-500 font-semibold whitespace-nowrap">
                      {lt.name}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs text-gray-500 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allBalances.map(row => (
                  <tr key={row.employeeId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                          {row.employeeName?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{row.employeeName}</p>
                          <p className="text-xs text-gray-400">{row.employeeCode} · {row.department}</p>
                        </div>
                      </div>
                    </td>
                    {(leaveTypeId
                      ? leaveTypes.filter(t => t.id === leaveTypeId)
                      : leaveTypes
                    ).map(lt => {
                      const bal = row.balances?.find(b => b.leaveTypeId === lt.id);
                      const avail = bal?.available ?? 0;
                      return (
                        <td key={lt.id} className="px-3 py-3 text-center">
                          <span className={`font-semibold ${avail <= 0 ? 'text-red-500' : avail <= 2 ? 'text-amber-500' : 'text-gray-900'}`}>
                            {avail}
                          </span>
                          {bal?.pending > 0 && (
                            <span className="text-xs text-amber-500 block">({bal.pending} pending)</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setAdjustModal({ empId: row.employeeId, empName: row.employeeName, leaveTypeId: '' })}
                        className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {}
      <Modal
        open={!!adjustModal}
        onClose={() => setAdjustModal(null)}
        title={`Adjust Leave Balance — ${adjustModal?.empName}`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setAdjustModal(null)}>Cancel</Button>
            <Button onClick={submitAdjust} loading={adjustMutation.isPending}>Save Adjustment</Button>
          </>
        }
      >
        {adjustModal && (
          <div className="space-y-4 py-1">
            <Select
              label="Leave Type" required
              options={leaveTypeOpts}
              placeholder="Select leave type"
              value={adjustModal.leaveTypeId}
              onChange={e => setAdjustModal(a => ({...a, leaveTypeId: e.target.value}))}
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 block mb-1">Type</label>
                <div className="flex gap-2">
                  {['credit','debit'].map(t => (
                    <button key={t} onClick={() => setAdjForm(f => ({...f, type: t}))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize border transition-colors ${
                        adjForm.type === t
                          ? t === 'credit' ? 'bg-green-600 text-white border-green-600' : 'bg-red-600 text-white border-red-600'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}>
                      {t === 'credit' ? '+ Credit' : '− Debit'}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                label="Days" required type="number" min="0.5" step="0.5"
                placeholder="e.g. 2"
                value={adjForm.days}
                onChange={e => setAdjForm(f => ({...f, days: e.target.value}))}
                className="w-28"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Reason <span className="text-red-500">*</span>
                <span className="text-xs font-normal text-gray-400 ml-1">(audit logged)</span>
              </label>
              <textarea
                rows={2}
                value={adjForm.reason}
                onChange={e => setAdjForm(f => ({...f, reason: e.target.value}))}
                placeholder="e.g. Carry forward from previous year / Compensatory off granted"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

