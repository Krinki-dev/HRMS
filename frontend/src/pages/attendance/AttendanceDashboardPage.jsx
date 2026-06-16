import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { attendanceApi } from '../../services/attendanceLeaveApi';
import { useAuthStore } from '../../store/authStore';
import { Badge, Avatar, Spinner, Button, PageHeader, Modal } from '../../components/ui/Common';

const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="text-2xl font-bold font-mono tabular-nums">
      {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata' })}
    </span>
  );
};

const SummaryCard = ({ label, value, color, sub }) => (
  <div className="bg-white/80 backdrop-blur-md rounded-[24px] border border-white/20 p-5 shadow-xl shadow-slate-200/40">
    <div className="flex justify-between items-start mb-2">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">{label}</p>
      <div className={`w-2 h-2 rounded-full ${color.includes('green') ? 'bg-green-400' : color.includes('red') ? 'bg-red-400' : 'bg-blue-400'}`} />
    </div>
    <p className="text-3xl font-black text-gray-900 tracking-tight">{value}</p>
    {sub && <p className="text-[11px] font-medium text-gray-400 mt-2">{sub}</p>}
  </div>
);

const STATUS_COLOR = {
  present:  'bg-green-100 text-green-700',
  absent:   'bg-red-100 text-red-700',
  on_leave: 'bg-blue-100 text-blue-700',
  half_day: 'bg-yellow-100 text-yellow-700',
  week_off: 'bg-gray-100 text-gray-500',
  holiday:  'bg-purple-100 text-purple-700',
};

export default function AttendanceDashboardPage() {
  const queryClient = useQueryClient();
  const { user }    = useAuthStore();

  const hasEmployee = !!(user?.employee?.id || user?.employeeId);

  const [date,          setDate]          = useState(new Date().toISOString().slice(0, 10));
  const [showBulkMark,  setShowBulkMark]  = useState(false);
  const [bulkRecords,   setBulkRecords]   = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ['attendance-dashboard', date],
    queryFn:  () => attendanceApi.dashboard(date),
    refetchInterval: 60000,
  });

  const { data: myTodayData, refetch: refetchMyToday } = useQuery({
    queryKey: ['attendance-today'],
    queryFn:  attendanceApi.getToday,
    enabled:  hasEmployee,  
  });
  const myToday = myTodayData?.data;

  const { data: unmarkedData } = useQuery({
    queryKey: ['attendance-unmarked', date],
    queryFn:  () => attendanceApi.getUnmarked(date),
    enabled:  showBulkMark,
  });

  useEffect(() => {
    if (unmarkedData?.data && showBulkMark) {
      setBulkRecords(unmarkedData.data.map(e => ({
        employeeId: e.id,
        name:       `${e.first_name} ${e.last_name}`,
        code:       e.employee_code,
        dept:       e.department?.name || '',
        checkIn:    '09:00',
        checkOut:   '18:00',
        status:     'present',
        selected:   false,
      })));
    }
  }, [unmarkedData, showBulkMark]);

  const checkInMutation = useMutation({
    mutationFn: () => attendanceApi.checkIn({ latitude: null, longitude: null }),
    onSuccess:  (res) => {
      toast.success(res.message || 'Checked in!');
      refetchMyToday();
      queryClient.invalidateQueries(['attendance-dashboard']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Check-in failed.'),
  });

  const checkOutMutation = useMutation({
    mutationFn: attendanceApi.checkOut,
    onSuccess:  (res) => {
      toast.success(res.message || 'Checked out!');
      refetchMyToday();
      queryClient.invalidateQueries(['attendance-dashboard']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Check-out failed.'),
  });

  const bulkMarkMutation = useMutation({
    mutationFn: (records) => attendanceApi.bulkMark({ date, records }),
    onSuccess:  (res) => {
      toast.success(`${res.data?.saved || 0} records saved!`);
      setShowBulkMark(false);
      queryClient.invalidateQueries(['attendance-dashboard']);
      queryClient.invalidateQueries(['attendance-unmarked']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Bulk mark failed.'),
  });

  const summary   = data?.data?.summary;
  const records   = data?.data?.records   || [];
  const notMarked = data?.data?.notMarked || [];

  const handleBulkSave = () => {
    const selected = bulkRecords.filter(r => r.selected);
    if (!selected.length) { toast.error('Select at least one employee.'); return; }

    const payload = selected.map(r => ({
      employeeId: r.employeeId,
      status:     r.status,
      
      checkIn:  r.status === 'present' ? `${date}T${r.checkIn}:00` : null,
      checkOut: r.status === 'present' ? `${date}T${r.checkOut}:00` : null,
    }));
    bulkMarkMutation.mutate(payload);
  };

  const toggleAll = (checked) => setBulkRecords(prev => prev.map(r => ({ ...r, selected: checked })));

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Track daily attendance"
        actions={
          <>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-[16px] text-sm focus:ring-2 focus:ring-blue-400 outline-none bg-white/50 backdrop-blur-sm" />
            <Button variant="outline" className="rounded-[16px]" onClick={() => setDate(new Date().toISOString().slice(0, 10))}>Today</Button>
            <Button className="rounded-[16px]" onClick={() => setShowBulkMark(true)}>{THEME.ICONS.ADD} Mark Attendance</Button>
          </>
        }
      />

      {}
      <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-[32px] p-8 mb-8 text-white shadow-2xl shadow-blue-900/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-300 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Current Time (IST)</p>
            <LiveClock />
            <p className="text-blue-100 text-sm mt-2">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' })}
            </p>
          </div>

          <div className="text-center">
            {}
            {!hasEmployee ? (
              <div className="bg-white/10 rounded-xl px-6 py-4 max-w-xs text-center">
                <p className="text-blue-100 text-sm font-medium mb-1">Admin Account</p>
                <p className="text-blue-200 text-xs">
                  Your account doesn't have an employee record.<br />
                  Use <strong>Mark Attendance</strong> to record attendance for employees.
                </p>
              </div>
            ) : !myToday?.checkIn ? (
              <div>
                <p className="text-blue-100 text-sm mb-3">Not checked in yet</p>
                <button
                  onClick={() => checkInMutation.mutate()}
                  disabled={checkInMutation.isPending}
                  className="bg-white text-blue-700 font-bold px-8 py-3 rounded-xl text-base hover:bg-blue-50 disabled:opacity-60 transition"
                >
                  {checkInMutation.isPending ? 'Checking in...' : '✅ Check In'}
                </button>
              </div>
            ) : !myToday?.checkOut ? (
              <div>
                <p className="text-blue-100 text-sm mb-1">Checked in at</p>
                <p className="text-2xl font-bold">
                  {new Date(myToday.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
                {myToday.isLateArrival && <p className="text-yellow-200 text-xs mt-1">⚠️ Late arrival</p>}
                <button
                  onClick={() => checkOutMutation.mutate()}
                  disabled={checkOutMutation.isPending}
                  className="bg-white text-red-600 font-bold px-8 py-3 rounded-xl text-base hover:bg-red-50 disabled:opacity-60 transition mt-3"
                >
                  {checkOutMutation.isPending ? 'Checking out...' : '🚪 Check Out'}
                </button>
              </div>
            ) : (
              <div>
                <p className="text-green-200 font-bold text-lg">✓ Done for the day</p>
                <p className="text-blue-100 text-sm">
                  {new Date(myToday.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  {' — '}
                  {new Date(myToday.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-white font-semibold text-lg mt-1">
                  {parseFloat(myToday.workingHours || 0).toFixed(1)} hrs
                </p>
                {parseFloat(myToday.overtimeHours || 0) > 0 && (
                  <p className="text-yellow-200 text-xs">OT: {parseFloat(myToday.overtimeHours).toFixed(1)} hrs</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <SummaryCard label="Total Active" value={summary?.totalActive || 0} color="border-gray-200" />
            <SummaryCard label="Present"      value={summary?.present     || 0} color="border-green-300" sub={`${summary?.lateCount || 0} late`} />
            <SummaryCard label="Absent"       value={summary?.absent      || 0} color="border-red-300" />
            <SummaryCard label="On Leave"     value={summary?.onLeave     || 0} color="border-blue-300" />
            <SummaryCard label="Not Marked"   value={summary?.notMarked   || 0} color="border-amber-300" />
          </div>

          {/* Today's table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Attendance — {date}</h2>
            </div>
            {records.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                No attendance records yet for {date}
                <div className="mt-3">
                  <Button size="sm" onClick={() => setShowBulkMark(true)}>Mark Attendance Now</Button>
                </div>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left text-xs text-gray-500 px-4 py-2">Employee</th>
                    <th className="text-left text-xs text-gray-500 px-4 py-2">Check In</th>
                    <th className="text-left text-xs text-gray-500 px-4 py-2">Check Out</th>
                    <th className="text-left text-xs text-gray-500 px-4 py-2">Hours</th>
                    <th className="text-left text-xs text-gray-500 px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {records.map(r => (
                    <tr key={r.id} className={`hover:bg-gray-50 ${r.isLateArrival ? 'bg-amber-50' : ''}`}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">
                            {r.employee?.fullName?.[0] || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{r.employee?.fullName}</p>
                            <p className="text-xs text-gray-400">{r.employee?.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-sm">
                        {r.checkIn ? (
                          <span className={r.isLateArrival ? 'text-amber-600 font-medium' : 'text-gray-700'}>
                            {new Date(r.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            {r.isLateArrival && <span className="ml-1 text-xs">⚠️</span>}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-700">
                        {r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-700">
                        {r.workingHours ? `${parseFloat(r.workingHours).toFixed(1)}h` : '—'}
                        {parseFloat(r.overtimeHours || 0) > 0 && (
                          <span className="ml-1 text-xs text-orange-500">+{parseFloat(r.overtimeHours).toFixed(1)}OT</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLOR[r.status] || 'bg-gray-100 text-gray-600'}`}>
                          {r.status?.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {}
          {notMarked.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-red-800 text-sm">🔴 Not Yet Marked ({notMarked.length})</h3>
                <Button size="sm" onClick={() => setShowBulkMark(true)}>Mark Now</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {notMarked.slice(0, 20).map(e => (
                  <span key={e.id} className="text-xs bg-white border border-red-100 rounded px-2 py-1 text-red-700">
                    {e.first_name} {e.last_name}
                  </span>
                ))}
                {notMarked.length > 20 && <span className="text-xs text-red-500">+{notMarked.length - 20} more</span>}
              </div>
            </div>
          )}
        </>
      )}

      {}
      <Modal
        open={showBulkMark}
        onClose={() => setShowBulkMark(false)}
        title={`Mark Attendance — ${date}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowBulkMark(false)}>Cancel</Button>
            <Button onClick={handleBulkSave} loading={bulkMarkMutation.isPending}>
              Save {bulkRecords.filter(r => r.selected).length} Records
            </Button>
          </>
        }
      >
        {bulkRecords.length === 0 ? (
          <p className="text-center text-gray-500 py-6">
            {unmarkedData ? 'All employees are already marked for this date! ✓' : 'Loading employees...'}
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 mb-2">
              <input type="checkbox" onChange={e => toggleAll(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm text-gray-500 font-medium">Select All ({bulkRecords.length})</span>
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="outline"
                  onClick={() => setBulkRecords(prev => prev.map(r => ({ ...r, status: 'present', selected: true })))}>
                  All Present
                </Button>
                <Button size="sm" variant="outline"
                  onClick={() => setBulkRecords(prev => prev.map(r => ({ ...r, status: 'absent', selected: true })))}>
                  All Absent
                </Button>
              </div>
            </div>
            {bulkRecords.map((r, i) => (
              <div key={r.employeeId} className="flex items-center gap-3 py-2 border-b border-gray-50">
                <input type="checkbox" checked={r.selected}
                  onChange={e => setBulkRecords(prev => prev.map((rec, j) => j === i ? { ...rec, selected: e.target.checked } : rec))}
                  className="w-4 h-4 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.code} · {r.dept}</p>
                </div>
                <select value={r.status}
                  onChange={e => setBulkRecords(prev => prev.map((rec, j) => j === i ? { ...rec, status: e.target.value } : rec))}
                  className="text-xs border border-gray-200 rounded px-2 py-1 bg-white w-24">
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="half_day">Half Day</option>
                  <option value="week_off">Week Off</option>
                </select>
                {r.status === 'present' && (
                  <>
                    <input type="time" value={r.checkIn}
                      onChange={e => setBulkRecords(prev => prev.map((rec, j) => j === i ? { ...rec, checkIn: e.target.value } : rec))}
                      className="text-xs border border-gray-200 rounded px-2 py-1 w-24" />
                    <input type="time" value={r.checkOut}
                      onChange={e => setBulkRecords(prev => prev.map((rec, j) => j === i ? { ...rec, checkOut: e.target.value } : rec))}
                      className="text-xs border border-gray-200 rounded px-2 py-1 w-24" />
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
