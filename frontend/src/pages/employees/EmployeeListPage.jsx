import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { employeeApi } from '../../services/employeeApi';
import {
  Badge, Avatar, Spinner, EmptyState, PageHeader, Button, SearchInput
} from '../../components/ui/Common';

const STATUS_OPTIONS = ['active', 'probation', 'notice', 'terminated', 'absconding'];
const TYPE_OPTIONS   = ['full_time', 'part_time', 'contract', 'intern'];

export default function EmployeeListPage() {
  const navigate      = useNavigate();
  const queryClient   = useQueryClient();

  const [tab,     setTab]     = useState('active');   
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const [empType, setEmpType] = useState('');
  const [dept,    setDept]    = useState('');
  const [desig,   setDesig]   = useState('');
  const [cursor,  setCursor]  = useState(null);
  const [history, setHistory] = useState([null]);
  const [exporting, setExporting] = useState(false);

  const resetPage = useCallback(() => { setCursor(null); setHistory([null]); }, []);

  const { data: res, isLoading, isFetching } = useQuery({
    queryKey:        ['employees', { search, status, empType, 
      departmentId: dept || undefined, 
      designationId: desig || undefined, 
      cursor, limit: 20 
    }],
    queryFn:         () => employeeApi.list({ search, status, type: empType, departmentId: dept || undefined, designationId: desig || undefined, cursor, limit: 20 }),
    placeholderData: (prev) => prev,
    enabled:         tab === 'active',
  });

  const { data: deletedRes, isLoading: deletedLoading } = useQuery({
    queryKey: ['employees-deleted', { search }],
    queryFn:  () => employeeApi.listDeleted({ search }),
    enabled:  tab === 'deleted',
  });

  const { data: depts } = useQuery({ queryKey: ['depts'], queryFn: employeeApi.getDepartments });
  const { data: desigs } = useQuery({ queryKey: ['desigs'], queryFn: employeeApi.getDesignations });

  const restoreMutation = useMutation({
    mutationFn: (id) => employeeApi.restore(id),
    onSuccess: () => {
      toast.success('Employee restored successfully.');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees-deleted'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Restore failed.'),
  });

  const employees    = res?.data       || [];
  const pagination   = res?.pagination || {};
  const total        = pagination.total   || 0;
  const hasMore      = pagination.hasMore || false;
  const nextCursor   = pagination.cursor  || null;
  const deletedList  = deletedRes?.data || deletedRes || [];

  const handleNext = () => {
    setHistory(h => [...h, nextCursor]);
    setCursor(nextCursor);
  };
  const handlePrev = () => {
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    setCursor(newHistory[newHistory.length - 1]);
  };

  async function handleExport() {
    setExporting(true);
    try {
      await employeeApi.exportCSV({ search, status, type: empType });
      toast.success('Export started — CSV will download shortly.');
    } catch (e) {
      toast.error(e.message || 'Export failed. Try again.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle={tab === 'active' ? `${total} total` : `${deletedList.length} deleted`}
        actions={
          <div className="flex gap-2">
            {tab === 'active' && (
              <>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={exporting || !total}
                  loading={exporting}>
                  {exporting ? 'Exporting…' : `⬇ Export (${total})`}
                </Button>
                <Button variant="outline" onClick={() => navigate('/employees/import')}>
                  ⬆ Import
                </Button>
                <Button onClick={() => navigate('/employees/add')}>
                  + Add Employee
                </Button>
              </>
            )}
          </div>
        }
      />

      {}
<div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
  <SearchInput
    value={search}
    onChange={v => { setSearch(v); resetPage(); }}
    placeholder={tab === 'deleted' ? 'Search deleted employees…' : 'Search by name, code, email, phone…'}
    className="flex-1 min-w-52"
  />
  {tab === 'active' && (
    <>
      <select
        value={status}
        onChange={e => { setStatus(e.target.value); resetPage(); }}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
        <option value="">All Status</option>
        {STATUS_OPTIONS.map(s => (
          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
        ))}
      </select>
      <select
        value={empType}
        onChange={e => { setEmpType(e.target.value); resetPage(); }}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
        <option value="">All Types</option>
        {TYPE_OPTIONS.map(t => (
          <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
        ))}
      </select>
      <select
        value={dept}
        onChange={e => { setDept(e.target.value); resetPage(); }}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
        <option value="">All Departments</option>
        {depts?.data?.map(d => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
      <select
        value={desig}
        onChange={e => { setDesig(e.target.value); resetPage(); }}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
        <option value="">All Designations</option>
        {desigs?.data?.map(d => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
    </>
  )}
  {(search || status || empType || dept || desig) && (
    <button
      onClick={() => { setSearch(''); setStatus(''); setEmpType(''); setDept(''); setDesig(''); resetPage(); }}
      className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
    >
      ✕ Clear
    </button>
  )}
</div>
      {}
      {tab === 'active' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : employees.length === 0 ? (
            <EmptyState
              icon="👥"
              title="No employees found"
              description={search ? 'Try a different search term' : 'Add your first employee to get started'}
              action={!search && (
                <Button onClick={() => navigate('/employees/add')}>+ Add Employee</Button>
              )}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['Employee', 'Code', 'Department', 'Designation', 'Type', 'Status', 'Joined', ''].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {employees.map(emp => (
                      <tr
                        key={emp.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/employees/${emp.id}`)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={emp.fullName} photoUrl={emp.photoUrl} size="sm" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{emp.fullName}</p>
                              <p className="text-xs text-gray-400">{emp.workEmail || emp.personalEmail || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-600">{emp.employeeCode}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{emp.department?.name || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{emp.designation?.name || '—'}</td>
                        <td className="px-4 py-3"><Badge value={emp.employmentType} /></td>
                        <td className="px-4 py-3"><Badge value={emp.status} /></td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {emp.dateOfJoining
                            ? new Date(emp.dateOfJoining).toLocaleDateString('en-IN')
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={e => { e.stopPropagation(); navigate(`/employees/${emp.id}/edit`); }}>
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {}
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {employees.length} of {total}
                  {isFetching && <span className="ml-2 text-blue-500 text-xs">Refreshing…</span>}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrev} disabled={history.length <= 1}>
                    ← Prev
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleNext} disabled={!hasMore}>
                    Next →
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {}
      {tab === 'deleted' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {deletedLoading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : deletedList.length === 0 ? (
            <EmptyState
              icon="🗑️"
              title="No deleted employees"
              description="Employees you soft-delete will appear here and can be restored."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Employee', 'Code', 'Department', 'Status at deletion', 'Deleted on', ''].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {deletedList.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={emp.fullName} photoUrl={emp.photoUrl} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{emp.fullName}</p>
                            <p className="text-xs text-gray-400">{emp.workEmail || emp.personalEmail || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{emp.employeeCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{emp.department?.name || '—'}</td>
                      <td className="px-4 py-3"><Badge value={emp.status} /></td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {emp.deletedAt ? new Date(emp.deletedAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          loading={restoreMutation.isPending}
                          onClick={() => {
                            if (window.confirm(`Restore ${emp.fullName}? They will be set to Active.`)) {
                              restoreMutation.mutate(emp.id);
                            }
                          }}>
                          ↩ Restore
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

