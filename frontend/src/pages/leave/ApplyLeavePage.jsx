import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { leaveApi } from '../../services/attendanceLeaveApi';
import { Input, Select, Field, Button, PageHeader, Spinner } from '../../components/ui/Common';

export default function ApplyLeavePage() {
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();

  const [form, setForm] = useState({
    leaveTypeId: '',
    fromDate:    '',
    toDate:      '',
    halfDay:     false,
    halfDayType: 'first',
    reason:      '',
  });
  const [dayCalc, setDayCalc] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  const { data: typesData }    = useQuery({ queryKey: ['leave-types'],    queryFn: leaveApi.getLeaveTypes });
  const { data: balancesData } = useQuery({ queryKey: ['leave-balances'], queryFn: () => leaveApi.getBalances() });

  const leaveTypes = typesData?.data  || [];
  const balances   = balancesData?.data || [];

  const balanceMap = Object.fromEntries(balances.map(b => [b.leaveType?.id, b]));
  const selectedTypeBalance = form.leaveTypeId ? balanceMap[form.leaveTypeId] : null;

  useEffect(() => {
    if (!form.fromDate || (!form.toDate && !form.halfDay)) return;
    if (!form.halfDay && form.fromDate > form.toDate) { setDayCalc(null); return; }

    const doCalc = async () => {
      setCalcLoading(true);
      try {
        const res = await leaveApi.calculateDays({
          fromDate: form.fromDate,
          toDate:   form.toDate || form.fromDate,
          halfDay:  form.halfDay,
        });
        setDayCalc(res.data);
      } catch {}
      setCalcLoading(false);
    };
    const t = setTimeout(doCalc, 300);
    return () => clearTimeout(t);
  }, [form.fromDate, form.toDate, form.halfDay]);

  const applyMutation = useMutation({
    mutationFn: leaveApi.apply,
    onSuccess: () => {
      toast.success('Leave applied successfully! Pending approval.');
      queryClient.invalidateQueries(['leave-dashboard']);
      queryClient.invalidateQueries(['leave-balances']);
      navigate('/leave');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to apply leave.'),
  });

  const F = (field) => ({
    value:    form[field] || '',
    onChange: (e) => setForm(f => ({ ...f, [field]: e.target.value })),
  });

  const handleSubmit = () => {
    if (!form.leaveTypeId) { toast.error('Select a leave type.'); return; }
    if (!form.fromDate)    { toast.error('Select from date.'); return; }
    if (!form.halfDay && !form.toDate) { toast.error('Select to date.'); return; }
    applyMutation.mutate({ ...form, toDate: form.toDate || form.fromDate });
  };

  const remaining = selectedTypeBalance && dayCalc
    ? selectedTypeBalance.available - dayCalc.days
    : null;

  return (
    <div>
      <PageHeader
        title="Apply Leave"
        actions={<Button variant="outline" onClick={() => navigate('/leave')}>← Back</Button>}
      />

      {}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 space-y-5">

          {}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Leave Type <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-300"
              value={form.leaveTypeId}
              onChange={e => setForm(f => ({ ...f, leaveTypeId: e.target.value }))}
            >
              <option value="">Select leave type...</option>
              {leaveTypes.map(lt => {
                const bal = balanceMap[lt.id];
                const avail = bal ? bal.available : '—';
                return (
                  <option key={lt.id} value={lt.id}>
                    {lt.name} ({lt.code}) — Balance: {avail} days
                  </option>
                );
              })}
            </select>
          </div>

          {}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="halfDay"
              checked={form.halfDay}
              onChange={e => setForm(f => ({ ...f, halfDay: e.target.checked }))}
              className="w-4 h-4"
            />
            <label htmlFor="halfDay" className="text-sm text-gray-700 font-medium cursor-pointer">Half Day Leave</label>
            {form.halfDay && (
              <select
                className="ml-auto text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                value={form.halfDayType}
                onChange={e => setForm(f => ({ ...f, halfDayType: e.target.value }))}
              >
                <option value="first">First Half</option>
                <option value="second">Second Half</option>
              </select>
            )}
          </div>

          {}
          <div className="grid grid-cols-2 gap-4">
            <Input label="From Date" required type="date" {...F('fromDate')} />
            {!form.halfDay && (
              <Input label="To Date" required type="date" min={form.fromDate} {...F('toDate')} />
            )}
          </div>

          {}
          {(calcLoading || dayCalc) && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700 flex items-center gap-2">
              {calcLoading ? (
                <><Spinner size="sm" /><span>Calculating working days...</span></>
              ) : (
                <span>📅 <strong>{dayCalc?.days}</strong> working day{dayCalc?.days !== 1 ? 's' : ''} (excluding weekends &amp; holidays)</span>
              )}
            </div>
          )}

          {}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-300"
              rows={4}
              placeholder="Reason for leave (optional for CL, required for SL)"
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            />
          </div>

          {}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="outline" onClick={() => navigate('/leave')}>Cancel</Button>
            <Button onClick={handleSubmit} loading={applyMutation.isPending}>
              Submit Leave Application
            </Button>
          </div>
        </div>

        {}
        <div className="space-y-4">

          {}
          {selectedTypeBalance ? (
            <div className={`p-4 rounded-xl border text-sm ${remaining !== null && remaining < 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <p className="font-semibold text-gray-800 mb-3">Balance Summary</p>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Total Entitled</span>
                <span className="font-medium">{selectedTypeBalance.total} days</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Used</span>
                <span className="font-medium">{selectedTypeBalance.used || 0} days</span>
              </div>
              <div className="flex justify-between mb-2 pb-2 border-b border-gray-200">
                <span className="text-gray-600">Available</span>
                <span className="font-bold text-lg">{selectedTypeBalance.available} days</span>
              </div>
              {dayCalc && (
                <>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Applying for</span>
                    <span className="font-bold text-blue-700">{dayCalc.days} days</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Remaining after</span>
                    <span className={`font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-700'}`}>
                      {remaining} days
                    </span>
                  </div>
                </>
              )}
              {remaining !== null && remaining < 0 && (
                <p className="text-red-600 font-medium mt-3 text-xs">⚠️ Insufficient balance — excess will be treated as LOP</p>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-400 text-center">
              <p className="text-2xl mb-2">🏖️</p>
              <p>Select a leave type to see your balance</p>
            </div>
          )}

          {}
          {balances.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">All Leave Balances</p>
              <div className="space-y-2">
                {balances.map(b => (
                  <div
                    key={b.id}
                    className={`flex justify-between items-center text-sm py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${b.leaveType?.id === form.leaveTypeId ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    onClick={() => setForm(f => ({ ...f, leaveTypeId: b.leaveType?.id || '' }))}
                  >
                    <span className="text-gray-600">{b.leaveType?.name}</span>
                    <span className={`font-semibold tabular-nums ${b.available <= 0 ? 'text-red-500' : 'text-gray-800'}`}>
                      {b.available}<span className="text-gray-400 font-normal">/{b.total}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

