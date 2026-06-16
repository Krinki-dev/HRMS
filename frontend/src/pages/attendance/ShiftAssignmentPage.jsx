import { useState }    from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast }       from 'react-hot-toast';
import api             from '../../services/api';
import { PageHeader, Button, Select, Spinner, SearchInput, Badge } from '../../components/ui/Common';

const shiftApi = {
  getShifts:   ()             => api.get('/attendance/shifts').then(r => r.data),
  getEmployees:(p)            => api.get('/employees', { params: p }).then(r => r.data),
  assignShift: (d)            => api.post('/attendance/shifts/assign', d).then(r => r.data),
};

export default function ShiftAssignmentPage() {
  const qc = useQueryClient();
  const [search,      setSearch]      = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [selectedEmps,  setSelectedEmps]  = useState(new Set());
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0,10));

  const { data: shiftsRes } = useQuery({
    queryKey: ['shifts-list'],
    queryFn:  shiftApi.getShifts,
  });

  const { data: empsRes, isLoading } = useQuery({
    queryKey: ['employees-shift', search],
    queryFn:  () => shiftApi.getEmployees({ search, limit: 100, status: 'active' }),
  });

  const shifts    = shiftsRes?.data || [];
  const employees = empsRes?.data   || [];

  const assignMutation = useMutation({
    mutationFn: shiftApi.assignShift,
    onSuccess: (res) => {
      toast.success(`Shift assigned to ${selectedEmps.size} employee(s)`);
      setSelectedEmps(new Set());
      qc.invalidateQueries({ queryKey: ['employees-shift'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to assign shift'),
  });

  const toggleEmp = (id) => {
    setSelectedEmps(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedEmps.size === employees.length)
      setSelectedEmps(new Set());
    else
      setSelectedEmps(new Set(employees.map(e => e.id)));
  };

  const handleAssign = () => {
    if (!selectedShift) { toast.error('Please select a shift'); return; }
    if (!selectedEmps.size) { toast.error('Select at least one employee'); return; }
    assignMutation.mutate({
      shiftId:       selectedShift,
      employeeIds:   [...selectedEmps],
      effectiveFrom,
    });
  };

  const shiftOptions = shifts.map(s => ({
    value: s.id,
    label: `${s.shift_name} (${s.start_time}–${s.end_time})`,
  }));

  return (
    <div>
      <PageHeader
        title="Shift Assignment"
        subtitle="Assign work shifts to employees"
      />

      {}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label className="text-xs font-medium text-gray-600 mb-1 block">Select Shift</label>
          <Select
            options={shiftOptions}
            placeholder="Choose a shift"
            value={selectedShift}
            onChange={e => setSelectedShift(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Effective From</label>
          <input type="date" value={effectiveFrom}
            onChange={e => setEffectiveFrom(e.target.value)}
            className="border border-slate-200 rounded-[16px] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          />
        </div>
        <Button className="rounded-[16px] px-8"
          onClick={handleAssign}
          loading={assignMutation.isPending}
          disabled={!selectedEmps.size || !selectedShift}
        >
          Assign Shift to {selectedEmps.size > 0 ? `${selectedEmps.size} Employee(s)` : 'Selected'}
        </Button>
      </div>

      {}
      {shifts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {shifts.slice(0, 4).map(s => (
            <div
              key={s.id}
              onClick={() => setSelectedShift(s.id)}
              className={`bg-white/60 backdrop-blur-sm border rounded-[20px] p-4 cursor-pointer transition-all hover:shadow-lg ${
                selectedShift === s.id
                  ? 'border-blue-500 ring-4 ring-blue-100 bg-white'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <p className="text-sm font-bold text-gray-900 tracking-tight">{s.shift_name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.start_time} — {s.end_time}</p>
              {s.break_duration_mins > 0 && (
                <p className="text-xs text-gray-400">Break: {s.break_duration_mins} min ({s.is_break_paid ? 'paid' : 'unpaid'})</p>
              )}
              {s.is_overnight && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded mt-1 inline-block">Night Shift</span>}
            </div>
          ))}
        </div>
      )}

      {}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search employees..."
            className="flex-1"
          />
          <p className="text-sm text-gray-500 whitespace-nowrap">
            {selectedEmps.size} of {employees.length} selected
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : employees.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No employees found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left">
                  <input type="checkbox"
                    checked={selectedEmps.size === employees.length && employees.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Current Shift</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {employees.map(emp => (
                <tr
                  key={emp.id}
                  className={`hover:bg-blue-50 cursor-pointer transition-colors ${selectedEmps.has(emp.id) ? 'bg-blue-50' : ''}`}
                  onClick={() => toggleEmp(emp.id)}
                >
                  <td className="px-4 py-3">
                    <input type="checkbox"
                      checked={selectedEmps.has(emp.id)}
                      onChange={() => toggleEmp(emp.id)}
                      className="w-4 h-4"
                      onClick={e => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                        {emp.fullName?.[0] || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{emp.fullName}</p>
                        <p className="text-xs text-gray-400">{emp.employeeCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{emp.department?.name || '—'}</td>
                  <td className="px-4 py-3">
                    {emp.currentShift
                      ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{emp.currentShift}</span>
                      : <span className="text-xs text-gray-400">Not assigned</span>
                    }
                  </td>
                  <td className="px-4 py-3"><Badge value={emp.employmentType} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
