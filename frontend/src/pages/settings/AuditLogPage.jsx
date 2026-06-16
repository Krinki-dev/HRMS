import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import {
  Spinner, Button, SearchInput, Badge, Modal, Alert,
} from '../../components/ui/Common';

const auditApi = {
  list: (params) =>
    api.get('/audit-logs', { params }).then(r => r.data),
  export: (params) =>
    api.get('/audit-logs/export', { params, responseType: 'blob' }).then(r => r.data),
  getOne: (id) =>
    api.get(`/audit-logs/${id}`).then(r => r.data),
};

const MODULES = [
  'employees', 'attendance', 'leave', 'payroll',
  'compliance', 'recruitment', 'performance',
  'training', 'assets', 'expenses', 'settings',
];

const ACTIONS = [
  'create', 'update', 'delete',
  'view_sensitive', 'bulk_import',
  'create_login', 'update_request',
  'update_approved', 'update_rejected',
  'bulk_mark', 'approve', 'reject',
];

const ACTION_STYLES = {
  create:           'bg-green-100 text-green-700',
  update:           'bg-blue-100 text-blue-700',
  delete:           'bg-red-100 text-red-700',
  view_sensitive:   'bg-orange-100 text-orange-700',
  bulk_import:      'bg-purple-100 text-purple-700',
  create_login:     'bg-teal-100 text-teal-700',
  update_request:   'bg-yellow-100 text-yellow-700',
  update_approved:  'bg-green-100 text-green-700',
  update_rejected:  'bg-red-100 text-red-700',
  bulk_mark:        'bg-indigo-100 text-indigo-700',
  approve:          'bg-green-100 text-green-700',
  reject:           'bg-red-100 text-red-700',
};

const ACTION_ICONS = {
  create:          '➕',
  update:          '✏️',
  delete:          '🗑',
  view_sensitive:  '🔒',
  bulk_import:     '📥',
  create_login:    '🔑',
  update_request:  '📝',
  update_approved: '✅',
  update_rejected: '❌',
  bulk_mark:       '📋',
  approve:         '✅',
  reject:          '❌',
};

function ActionBadge({ action }) {
  const style = ACTION_STYLES[action] || 'bg-gray-100 text-gray-600';
  const icon  = ACTION_ICONS[action]  || '•';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style}`}>
      <span>{icon}</span>
      {action.replace(/_/g, ' ')}
    </span>
  );
}

function ModuleBadge({ module: mod }) {
  const colors = {
    employees: 'bg-blue-50 text-blue-700',
    attendance: 'bg-teal-50 text-teal-700',
    leave: 'bg-orange-50 text-orange-700',
    payroll: 'bg-green-50 text-green-700',
    compliance: 'bg-purple-50 text-purple-700',
    settings: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${colors[mod] || 'bg-gray-100 text-gray-600'}`}>
      {mod}
    </span>
  );
}

function JsonView({ data, label }) {
  if (!data) return null;
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  if (text === '[redacted]') {
    return (
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
        <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded px-2 py-1 inline-flex items-center gap-1">
          🔒 Redacted — visible to admins only
        </p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
      <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto max-h-52 text-gray-700">
        {text}
      </pre>
    </div>
  );
}

export default function AuditLogPage() {

  const [search,   setSearch]   = useState('');
  const [module,   setModule]   = useState('');
  const [action,   setAction]   = useState('');
  const [from,     setFrom]     = useState('');
  const [to,       setTo]       = useState('');

  const [cursor,   setCursor]   = useState(null);
  const [history,  setHistory]  = useState([null]);

  const [detail,   setDetail]   = useState(null);

  const [exporting, setExporting] = useState(false);

  const resetPage = useCallback(() => {
    setCursor(null);
    setHistory([null]);
  }, []);

  const filters = {
    ...(search && { search }),
    ...(module && { module }),
    ...(action && { action }),
    ...(from   && { from }),
    ...(to     && { to }),
    cursor,
    limit: 50,
  };

  const { data: res, isLoading, isFetching } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn:  () => auditApi.list(filters),
    placeholderData: (prev) => prev,
  });

  const logs       = res?.data?.logs       || [];
  const pagination = res?.data?.pagination || {};
  const total      = pagination.total      || 0;
  const hasMore    = pagination.hasMore    || false;
  const nextCursor = pagination.cursor     || null;

  const handleNext = () => {
    setHistory(h => [...h, nextCursor]);
    setCursor(nextCursor);
  };
  const handlePrev = () => {
    const h = history.slice(0, -1);
    setHistory(h);
    setCursor(h[h.length - 1]);
  };

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await auditApi.export({
        ...(module && { module }),
        ...(action && { action }),
        ...(from   && { from }),
        ...(to     && { to }),
      });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Audit log exported');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  }

  const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : '—';

  const hasFilters = search || module || action || from || to;

  return (
    <div>
      {}
      <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Every create, update, delete, and sensitive data access — across all modules
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} loading={exporting} disabled={exporting}>
          ⬇ Export CSV
        </Button>
      </div>

      {}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <SearchInput
            value={search}
            onChange={v => { setSearch(v); resetPage(); }}
            placeholder="Search in record data…"
            className="flex-1 min-w-48"
          />
          <select value={module} onChange={e => { setModule(e.target.value); resetPage(); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">All Modules</option>
            {MODULES.map(m => (
              <option key={m} value={m} className="capitalize">{m}</option>
            ))}
          </select>
          <select value={action} onChange={e => { setAction(e.target.value); resetPage(); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">All Actions</option>
            {ACTIONS.map(a => (
              <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium">From</label>
            <input type="date" value={from}
              onChange={e => { setFrom(e.target.value); resetPage(); }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium">To</label>
            <input type="date" value={to}
              onChange={e => { setTo(e.target.value); resetPage(); }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm"
              onClick={() => { setSearch(''); setModule(''); setAction(''); setFrom(''); setTo(''); resetPage(); }}>
              ✕ Clear filters
            </Button>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            {total.toLocaleString()} total entries
            {isFetching && !isLoading && <span className="ml-2 text-blue-500">Refreshing…</span>}
          </span>
        </div>
      </div>

      {}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm font-semibold text-gray-700">No audit entries found</p>
            <p className="text-xs text-gray-400 mt-1">
              {hasFilters ? 'Try adjusting your filters' : 'Audit entries will appear here as actions are performed'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Date & Time', 'Module', 'Action', 'Actor', 'Record', 'IP', ''].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map(log => (
                    <tr key={log.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setDetail(log)}>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                        {fmt(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <ModuleBadge module={log.module} />
                      </td>
                      <td className="px-4 py-3">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">{log.actor?.name || 'System'}</p>
                        <p className="text-xs text-gray-400">{log.actor?.email || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-500">
                        {log.recordType && (
                          <span className="capitalize text-gray-400 mr-1">{log.recordType}</span>
                        )}
                        {log.recordId
                          ? <span title={log.recordId}>{log.recordId.slice(0, 8)}…</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {log.ipAddress || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-blue-500 hover:underline">View →</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {}
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {logs.length} of {total.toLocaleString()}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"
                  onClick={handlePrev} disabled={history.length <= 1}>
                  ← Prev
                </Button>
                <Button variant="outline" size="sm"
                  onClick={handleNext} disabled={!hasMore}>
                  Next →
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Audit Log Entry"
        size="lg"
      >
        {detail && (
          <div className="space-y-5 py-1">
            {}
            <div className="flex flex-wrap gap-3 items-center">
              <ModuleBadge module={detail.module} />
              <ActionBadge action={detail.action} />
              {detail.action === 'view_sensitive' && (
                <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded">
                  🔒 Sensitive data access — always logged
                </span>
              )}
            </div>

            {}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Date & Time</p>
                <p className="font-medium text-gray-900">{fmt(detail.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">IP Address</p>
                <p className="font-medium text-gray-900 font-mono">{detail.ipAddress || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Performed by</p>
                <p className="font-medium text-gray-900">{detail.actor?.name || 'System'}</p>
                <p className="text-xs text-gray-500">{detail.actor?.email || ''}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Record</p>
                <p className="font-medium text-gray-900 capitalize">{detail.recordType || '—'}</p>
                {detail.recordId && (
                  <p className="text-xs text-gray-500 font-mono break-all">{detail.recordId}</p>
                )}
              </div>
            </div>

            {}
            {(detail.newValues || detail.oldValues) && (
              <div className="space-y-3 border-t border-gray-100 pt-4">
                {detail.newValues && (
                  <JsonView data={detail.newValues} label="New Values / Details" />
                )}
                {detail.oldValues && (
                  <JsonView data={detail.oldValues} label="Previous Values" />
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

