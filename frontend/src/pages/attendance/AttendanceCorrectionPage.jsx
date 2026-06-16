import { useState }    from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast }       from 'react-hot-toast';
import api             from '../../services/api';
import { PageHeader, Button, Modal, Select, Spinner, SearchInput, Badge } from '../../components/ui/Common';

const correctionApi = {
  
  getAttendance:     (empId, month, year) =>
    api.get('/attendance', { params: { employeeId: empId, month, year, limit: 50 } }).then(r => r.data),
  correctAttendance: (id, data) =>
    api.put(`/attendance/${id}`, data).then(r => r.data),

  getLeaves:         (empId) =>
    api.get('/leave', { params: { employeeId: empId, limit: 50 } }).then(r => r.data),
  correctLeave:      (id, data) =>
    api.put(`/leave/${id}/correct`, data).then(r => r.data),

  getEmployees:      (search) =>
    api.get('/employees', { params: { search, limit: 100, status: 'active' } }).then(r => r.data),

  getAuditLog:       (module, recordId) =>
    api.get('/settings/audit-logs', { params: { module, recordId, limit: 20 } }).then(r => r.data),
};

const ATTENDANCE_STATUSES = [
  { value: 'present',  label: 'Present' },
  { value: 'absent',   label: 'Absent' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'week_off', label: 'Week Off' },
  { value: 'holiday',  label: 'Holiday' },
  { value: 'on_leave', label: 'On Leave' },
];

const LEAVE_STATUSES = [
  { value: 'pending',   label: 'Pending' },
  { value: 'approved',  label: 'Approved' },
  { value: 'rejected',  label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

function AuditTrail({ module, recordId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['audit', module, recordId],
    queryFn:  () => correctionApi.getAuditLog(module, recordId),
    enabled:  !!recordId,
  });

  const logs = data?.data || [];

  if (isLoading) return <div className="flex justify-center py-4"><Spinner /></div>;
  if (!logs.length) return <p className="text-xs text-gray-400 py-2">No audit history found</p>;

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {logs.map(log => (
        <div key={log.id} className="flex gap-3 text-xs py-1.5 border-b border-gray-50">
          <span className="text-gray-400 whitespace-nowrap flex-shrink-0">
            {new Date(log.created_at).toLocaleString('en-IN')}
          </span>
          <span className={`font-medium flex-shrink-0 ${
            log.action === 'create' ? 'text-green-600' :
            log.action === 'update' ? 'text-blue-600' :
            'text-red-600'
          }`}>{log.action}</span>
          <span className="text-gray-500">{log.user_id ? `by User ${log.user_id?.slice(0,8)}...` : ''}</span>
          {log.new_values && (
            <span className="text-gray-400 truncate">{JSON.stringify(JSON.parse(log.new_values || '{}'))}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AttendanceCorrectionPage() {
  const qc = useQueryClient();
  const [activeTab,    setActiveTab]    = useState('attendance'); 
  const [empSearch,    setEmpSearch]    = useState('');
  const [selectedEmp,  setSelectedEmp]  = useState(null);
  const [month,        setMonth]        = useState(new Date().getMonth() + 1);
  const [year,         setYear]         = useState(new Date().getFullYear());
  const [editModal,    setEditModal]    = useState(null); 
  const [auditModal,   setAuditModal]   = useState(null);
  const [reason,       setReason]       = useState('');
  const [newStatus,    setNewStatus]    = useState('');
  const [newCheckIn,   setNewCheckIn]   = useState('');
  const [newCheckOut,  setNewCheckOut]  = useState('');

  const { data: empsRes } = useQuery({
    queryKey: ['emps-correction', empSearch],
    queryFn:  () => correctionApi.getEmployees(empSearch),
  });
  const employees = empsRes?.data || [];

  const { data: attRes, isLoading: attLoading } = useQuery({
    queryKey: ['attendance-correction', selectedEmp?.id, month, year],
    queryFn:  () => correctionApi.getAttendance(selectedEmp.id, month, year),
    enabled:  !!selectedEmp && activeTab === 'attendance',
  });

  const { data: leaveRes, isLoading: leaveLoading } = useQuery({
    queryKey: ['leave-correction', selectedEmp?.id],
    queryFn:  () => correctionApi.getLeaves(selectedEmp.id),
    enabled:  !!selectedEmp && activeTab === 'leave',
  });

  const attRecords   = attRes?.data   || [];
  const leaveRecords = leaveRes?.data || [];

  const correctAttMutation = useMutation({
    mutationFn: ({ id, data }) => correctionApi.correctAttendance(id, data),
    onSuccess: () => {
      toast.success('Attendance corrected and audit logged');
      qc.invalidateQueries({ queryKey: ['attendance-correction'] });
      setEditModal(null);
      setReason('');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to correct'),
  });

  const correctLeaveMutation = useMutation({
    mutationFn: ({ id, data }) => correctionApi.correctLeave(id, data),
    onSuccess: () => {
      toast.success('Leave corrected and audit logged');
      qc.invalidateQueries({ queryKey: ['leave-correction'] });
      setEditModal(null);
      setReason('');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to correct'),
  });

  const openEdit = (record, type) => {
    setEditModal({ record, type });
    setNewStatus(record.status || '');
    setNewCheckIn(record.checkIn
      ? new Date(record.checkIn).toTimeString().slice(0,5) : '');
    setNewCheckOut(record.checkOut
      ? new Date(record.checkOut).toTimeString().slice(0,5) : '');
    setReason('');
  };

  const submitCorrection = () => {
    if (!reason.trim()) { toast.error('Reason is mandatory for audit trail'); return; }
    if (!newStatus)     { toast.error('Select new status'); return; }

    if (editModal.type === 'attendance') {
      const date = editModal.record.date?.slice(0,10);
      correctAttMutation.mutate({
        id: editModal.record.id,
        data: {
          status:    newStatus,
          checkIn:   newCheckIn  ? `${date}T${newCheckIn}:00` : null,
          checkOut:  newCheckOut ? `${date}T${newCheckOut}:00` : null,
          correctionReason: reason,
        },
      });
    } else {
      correctLeaveMutation.mutate({
        id: editModal.record.id,
        data: { status: newStatus, correctionReason: reason },
      });
    }
  };

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div>
      <PageHeader
        title="Attendance & Leave Correction"
        subtitle="Correct wrong marks — all changes are audit logged"
      />

      {}
      <div className="flex gap-1 mb-6 bg-slate-100/50 backdrop-blur-sm p-1.5 rounded-[20px] w-fit border border-slate-200/50">
        {['attendance','leave'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-6 py-2 rounded-[14px] text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === t ? 'bg-white shadow-lg shadow-slate-200 text-blue-600' : 'text-gray-500 hover:text-gray-900'
            }`}>
            {t === 'attendance' ? 'Attendance' : 'Leave'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {}
        <div className="bg-white/80 backdrop-blur-md rounded-[24px] border border-white/20 p-5 md:col-span-1 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Select Employee</p>
          <SearchInput value={empSearch} onChange={setEmpSearch} placeholder="Search..." className="mb-4 rounded-2xl" />
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {employees.map(emp => (
              <button key={emp.id} onClick={() => setSelectedEmp(emp)}
                className={`w-full text-left px-4 py-3 rounded-[16px] text-sm transition-all ${
                  selectedEmp?.id === emp.id
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}>
                <p className="font-medium">{emp.fullName}</p>
                <p className={`text-xs ${selectedEmp?.id === emp.id ? 'text-blue-200' : 'text-gray-400'}`}>
                  {emp.employeeCode}
                </p>
              </button>
            ))}
          </div>
        </div>

        {}
        <div className="md:col-span-3">
          {!selectedEmp ? (
            <div className="bg-white/60 backdrop-blur-sm rounded-[24px] border border-dashed border-slate-300 p-12 text-center">
              <p className="text-gray-400">Select an employee to view records</p>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-md rounded-[24px] border border-white/20 overflow-hidden shadow-xl shadow-slate-200/50">
              {}
              {activeTab === 'attendance' && (
                <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
                  <p className="text-sm font-bold text-gray-900 tracking-tight">{selectedEmp.fullName}</p>
                  <div className="ml-auto flex gap-2">
                    <select value={month} onChange={e => setMonth(+e.target.value)}
                      className="border border-slate-200 rounded-[12px] px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                      {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                    </select>
                    <select value={year} onChange={e => setYear(+e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                      {[2024,2025,2026].map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {(activeTab === 'attendance' ? attLoading : leaveLoading) ? (
                <div className="flex justify-center py-12"><Spinner size="lg" /></div>
              ) : activeTab === 'attendance' ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold">Date</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold">Check In</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold">Check Out</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold">Status</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold">Hours</th>
                      <th className="px-4 py-3 text-right text-xs text-gray-500 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {attRecords.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">No records found</td></tr>
                    ) : attRecords.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium">
                          {new Date(r.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '—'}
                          {r.isLateArrival && <span className="ml-1 text-xs text-amber-500">⚠️ Late</span>}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '—'}
                        </td>
                        <td className="px-4 py-2.5"><Badge value={r.status} /></td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {r.workingHours ? `${parseFloat(r.workingHours).toFixed(1)}h` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => setAuditModal({ module: 'attendance', recordId: r.id })}
                              className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded border border-gray-200">
                              History
                            </button>
                            <button onClick={() => openEdit(r, 'attendance')}
                              className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200">
                              Correct
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold">Leave Type</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold">From</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold">To</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold">Days</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold">Status</th>
                      <th className="px-4 py-3 text-right text-xs text-gray-500 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {leaveRecords.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">No leave records</td></tr>
                    ) : leaveRecords.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium">{r.leaveType?.name || '—'}</td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {new Date(r.fromDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {new Date(r.toDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{r.days}</td>
                        <td className="px-4 py-2.5"><Badge value={r.status} /></td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => setAuditModal({ module: 'leave', recordId: r.id })}
                              className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded border border-gray-200">
                              History
                            </button>
                            <button onClick={() => openEdit(r, 'leave')}
                              className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200">
                              Correct
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {}
      <Modal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title={`Correct ${editModal?.type === 'attendance' ? 'Attendance' : 'Leave'} Record`}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditModal(null)}>Cancel</Button>
            <Button
              onClick={submitCorrection}
              loading={correctAttMutation.isPending || correctLeaveMutation.isPending}
            >
              Save Correction
            </Button>
          </>
        }
      >
        {editModal && (
          <div className="space-y-4">
            {}
            <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
              <p className="font-semibold text-gray-600 mb-1">Current values:</p>
              <p>Status: <Badge value={editModal.record.status} /></p>
              {editModal.type === 'attendance' && (
                <>
                  <p>Check In: {editModal.record.checkIn
                    ? new Date(editModal.record.checkIn).toLocaleTimeString('en-IN') : 'Not marked'}</p>
                  <p>Check Out: {editModal.record.checkOut
                    ? new Date(editModal.record.checkOut).toLocaleTimeString('en-IN') : 'Not marked'}</p>
                </>
              )}
            </div>

            {}
            <Select
              label="New Status"
              required
              options={editModal.type === 'attendance' ? ATTENDANCE_STATUSES : LEAVE_STATUSES}
              value={newStatus}
              onChange={e => setNewStatus(e.target.value)}
            />

            {}
            {editModal.type === 'attendance' && newStatus === 'present' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Check In Time</label>
                  <input type="time" value={newCheckIn}
                    onChange={e => setNewCheckIn(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Check Out Time</label>
                  <input type="time" value={newCheckOut}
                    onChange={e => setNewCheckOut(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            )}

            {}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Reason for Correction <span className="text-red-500">*</span>
                <span className="text-xs font-normal text-gray-400 ml-1">(saved in audit log)</span>
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                placeholder="Enter reason for correction — this will be permanently recorded in audit log"
                className={`w-full border rounded-lg px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-blue-400 ${
                  !reason.trim() ? 'border-orange-300' : 'border-gray-300'
                }`}
              />
              {!reason.trim() && (
                <p className="text-xs text-orange-600 mt-1">Reason is mandatory — correction cannot be saved without it</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {}
      <Modal
        open={!!auditModal}
        onClose={() => setAuditModal(null)}
        title="Audit History"
        size="lg"
        footer={<Button variant="outline" onClick={() => setAuditModal(null)}>Close</Button>}
      >
        {auditModal && (
          <AuditTrail module={auditModal.module} recordId={auditModal.recordId} />
        )}
      </Modal>
    </div>
  );
}
