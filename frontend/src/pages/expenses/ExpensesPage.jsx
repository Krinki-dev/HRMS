import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { expensesApi } from '../../services/moduleApis';
import { PageHeader, Button, Spinner, Tabs, Modal, Input } from '../../components/ui/Common';

const TABS = [
  { id: 'my',        label: 'My Claims',      icon: '📋' },
  { id: 'approvals', label: 'Pending Approvals', icon: '✅' },
  { id: 'policies',  label: 'Policies',        icon: '📜' },
];

const CATEGORIES = ['Travel','Food','Accommodation','Fuel','Medical','Communication','Training','Other'];

const STATUS_STYLE = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const EMPTY_ITEM = { category: 'Travel', description: '', expenseDate: '', amount: '' };

export default function ExpensesPage() {
  const qc = useQueryClient();
  const [tab, setTab]       = useState('my');
  const [newModal,  setNewModal]  = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [items, setItems]   = useState([{ ...EMPTY_ITEM }]);
  const [claimNotes, setClaimNotes] = useState('');
  const [approveModal, setApproveModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const inv = (...keys) => keys.forEach(k => qc.invalidateQueries([k]));

  const { data: myData,    isLoading: myLoading }    = useQuery({ queryKey: ['my-claims'],    queryFn: () => expensesApi.listClaims({ mine: true }), enabled: tab === 'my' });
  const { data: pendData,  isLoading: pendLoading }  = useQuery({ queryKey: ['pend-claims'],  queryFn: expensesApi.pendingApprovals,   enabled: tab === 'approvals' });
  const { data: polData }                             = useQuery({ queryKey: ['exp-policies'], queryFn: expensesApi.listPolicies,       enabled: tab === 'policies' });

  const createMut = useMutation({
    mutationFn: (d) => expensesApi.createClaim(d),
    onSuccess: () => { toast.success('Claim submitted!'); inv('my-claims'); setNewModal(false); setItems([{...EMPTY_ITEM}]); setClaimNotes(''); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const approveMut = useMutation({
    mutationFn: ({ id, ...d }) => expensesApi.approveClaim(id, d),
    onSuccess: () => { toast.success('Approved!'); inv('pend-claims','my-claims'); setApproveModal(null); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }) => expensesApi.rejectClaim(id, { reason }),
    onSuccess: () => { toast.success('Rejected.'); inv('pend-claims','my-claims'); setViewModal(null); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => expensesApi.deleteClaim(id),
    onSuccess: () => { toast.success('Deleted.'); inv('my-claims'); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const totalAmount = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

  const addItem = () => setItems(p => [...p, { ...EMPTY_ITEM }]);
  const removeItem = (i) => setItems(p => p.filter((_, idx) => idx !== i));
  const updateItem = (idx, field, val) => setItems(p => p.map((item, i) => i === idx ? { ...item, [field]: val } : item));

  const submitClaim = () => {
    const valid = items.every(i => i.category && i.expenseDate && i.amount > 0);
    if (!valid) { toast.error('Fill all fields in each expense item.'); return; }
    createMut.mutate({ items, notes: claimNotes });
  };

  const myClaims  = myData?.data   || [];
  const pendClaims= pendData?.data  || [];
  const policies  = polData?.data   || [];

  const renderClaims = (claims, showEmployee = false) => (
    claims.length === 0 ? (
      <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
        <p className="text-4xl mb-3">💸</p>
        <p className="font-semibold text-gray-800">No claims found</p>
      </div>
    ) : (
      <div className="space-y-3">
        {claims.map(c => (
          <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                {showEmployee && c.employee && (
                  <p className="text-xs text-gray-500 mb-1">{c.employee.first_name} {c.employee.last_name} · {c.employee.employee_code}</p>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-gray-900 text-lg">₹{Math.round(c.total_amount / 100).toLocaleString('en-IN')}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[c.status] || 'bg-gray-100'}`}>
                    {c.status}
                  </span>
                  {c.status === 'approved' && c.approved_amount != null && (
                    <span className="text-xs text-green-600">
                      Approved: ₹{Math.round(c.approved_amount / 100).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {c.items?.length} item{c.items?.length !== 1 ? 's' : ''} ·{' '}
                  {new Date(c.created_at).toLocaleDateString('en-IN')}
                  {c.notes && ` · ${c.notes}`}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {c.items?.map((item, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {item.category}: ₹{Math.round(item.amount / 100).toLocaleString('en-IN')}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 ml-3 flex-shrink-0">
                {c.status === 'pending' && showEmployee && (
                  <>
                    <Button size="sm" onClick={() => approveMut.mutate({ id: c.id })}>✓ Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => { setViewModal(c); setRejectReason(''); }}>✕ Reject</Button>
                  </>
                )}
                {c.status === 'pending' && !showEmployee && (
                  <Button size="sm" variant="outline" onClick={() => deleteMut.mutate(c.id)}>Delete</Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  );

  return (
    <div>
      <PageHeader title="Expense Management" subtitle="Submit and approve expense claims"
        actions={<Button onClick={() => setNewModal(true)}>+ New Claim</Button>}
      />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'my'        && (myLoading   ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : renderClaims(myClaims))}
      {tab === 'approvals' && (pendLoading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : renderClaims(pendClaims, true))}

      {tab === 'policies' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Expense Policies</h3>
            <p className="text-sm text-gray-500 mt-0.5">Per-category limits and receipt requirements</p>
          </div>
          {policies.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-2xl mb-2">📜</p>
              <p className="text-sm">No policies configured. All expenses are accepted by default.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Category','Max Amount (₹)','Receipt Required Above (₹)','Status'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {policies.map(p => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium">{p.category}</td>
                    <td className="px-4 py-3 font-mono">{p.max_amount ? `₹${Math.round(p.max_amount/100).toLocaleString('en-IN')}` : 'No limit'}</td>
                    <td className="px-4 py-3 font-mono">{p.receipt_required_above ? `₹${Math.round(p.receipt_required_above/100).toLocaleString('en-IN')}` : 'Always'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {}
      <Modal open={newModal} onClose={() => setNewModal(false)} title="New Expense Claim"
        footer={<>
          <Button variant="outline" onClick={() => setNewModal(false)}>Cancel</Button>
          <Button onClick={submitClaim} loading={createMut.isPending}>
            Submit Claim · ₹{totalAmount.toLocaleString('en-IN')}
          </Button>
        </>}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {items.map((item, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl p-3 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-semibold text-gray-700">Item {idx + 1}</p>
                {items.length > 1 && (
                  <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-xs">✕ Remove</button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Category</label>
                  <select value={item.category} onChange={e => updateItem(idx, 'category', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Date</label>
                  <input type="date" value={item.expenseDate} onChange={e => updateItem(idx, 'expenseDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Amount (₹)</label>
                  <input type="number" value={item.amount} onChange={e => updateItem(idx, 'amount', e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Description</label>
                  <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)}
                    placeholder="e.g. Cab to client site"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                </div>
              </div>
            </div>
          ))}

          <button onClick={addItem}
            className="w-full border-2 border-dashed border-gray-300 text-gray-500 rounded-xl py-2 text-sm hover:border-blue-300 hover:text-blue-600 transition-colors">
            + Add Another Item
          </button>

          <div className="bg-blue-50 rounded-xl p-3 flex justify-between items-center">
            <span className="font-semibold text-blue-900">Total Claim Amount</span>
            <span className="text-xl font-bold text-blue-700">₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Notes (optional)</label>
            <input value={claimNotes} onChange={e => setClaimNotes(e.target.value)}
              placeholder="Any additional notes..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
      </Modal>

      {}
      <Modal open={!!viewModal} onClose={() => setViewModal(null)} title="Reject Claim"
        footer={<>
          <Button variant="outline" onClick={() => setViewModal(null)}>Cancel</Button>
          <Button onClick={() => rejectMut.mutate({ id: viewModal.id, reason: rejectReason })} loading={rejectMut.isPending}>
            Confirm Reject
          </Button>
        </>}>
        <div className="py-2 space-y-3">
          <p className="text-sm text-gray-600">
            Rejecting claim of <strong>₹{viewModal ? Math.round(viewModal.total_amount/100).toLocaleString('en-IN') : ''}</strong>
          </p>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Reason for rejection</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              rows={3} placeholder="e.g. Missing receipts, policy limit exceeded..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
          </div>
        </div>
      </Modal>
    </div>
  );
}

