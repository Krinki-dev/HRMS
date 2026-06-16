import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { assetsApi } from '../../services/moduleApis';
import { employeeApi } from '../../services/employeeApi';
import { THEME } from '../../utils/uiConstants';
import { PageHeader, Button, Spinner, Tabs, Modal, Input, Select, Badge } from '../../components/ui';

const TABS = [
  { id: 'list', label: 'All Assets', icon: THEME.ICONS.DOCUMENTS },
  { id: 'dashboard', label: 'Dashboard', icon: THEME.ICONS.DASHBOARD },
];

const STATUS_COLOR = {
  available: 'bg-green-50 text-green-700 border-green-100',
  allocated: 'bg-blue-50 text-blue-700 border-blue-100',
  under_repair: 'bg-orange-50 text-orange-700 border-orange-100',
  retired: 'bg-gray-50 text-gray-500 border-gray-100',
};

const CATEGORIES = ['Laptop', 'Desktop', 'Phone', 'Tablet', 'Furniture', 'Vehicle', 'Printer', 'Other'];
const CONDITIONS = ['new', 'good', 'fair', 'poor'];

const EMPTY_ASSET = {
  name: '', category: 'Laptop', brand: '', model: '', serialNumber: '',
  purchaseDate: '', purchasePrice: '', vendorName: '', warrantyExpiry: '', amcExpiry: '',
  condition: 'good', notes: '',
};

export default function AssetsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('list');
  const [addModal, setAddModal] = useState(false);
  const [allocModal, setAllocModal] = useState(null);
  const [returnModal, setReturnModal] = useState(null);
  const [assetForm, setAssetForm] = useState(EMPTY_ASSET);
  const [allocForm, setAllocForm] = useState({ employeeId: '', allocatedDate: '', conditionAtAlloc: 'good' });
  const [returnForm, setReturnForm] = useState({ conditionAtReturn: 'good', damageNotes: '', deductFromFnF: false, deductionAmount: '' });
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('');

  const AF = (f) => ({ value: assetForm[f], onChange: e => setAssetForm(p => ({ ...p, [f]: e.target.value })) });

  const { data: listData, isLoading } = useQuery({
    queryKey: ['assets', search, statusF],
    queryFn: () => assetsApi.list({ search: search || undefined, status: statusF || undefined }),
    enabled: tab === 'list',
  });

  const { data: dashData } = useQuery({
    queryKey: ['assets-dashboard'],
    queryFn: assetsApi.dashboard,
    enabled: tab === 'dashboard',
  });

  const { data: empsData } = useQuery({
    queryKey: ['employees-simple'],
    queryFn: () => employeeApi.getEmployees({ limit: 200 }),
    enabled: !!allocModal,
  });

  const empOptions = (empsData?.data?.data || []).map(e => ({
    value: e.id, label: `${e.firstName} ${e.lastName} (${e.employeeCode})`,
  }));

  const inv = (...keys) => keys.forEach(k => qc.invalidateQueries({ queryKey: [k] }));

  const createMut = useMutation({
    mutationFn: (d) => assetsApi.create(d),
    onSuccess: () => { toast.success('Asset registered!'); inv('assets', 'assets-dashboard'); setAddModal(false); setAssetForm(EMPTY_ASSET); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to add asset'),
  });

  const allocMut = useMutation({
    mutationFn: ({ id, ...d }) => assetsApi.allocate(id, d),
    onSuccess: () => { toast.success('Asset allocated successfully'); inv('assets', 'assets-dashboard'); setAllocModal(null); setAllocForm({ employeeId: '', allocatedDate: '', conditionAtAlloc: 'good' }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Allocation failed'),
  });

  const returnMut = useMutation({
    mutationFn: ({ id, ...d }) => assetsApi.returnAsset(id, d),
    onSuccess: () => { toast.success('Asset returned to inventory'); inv('assets', 'assets-dashboard'); setReturnModal(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Return failed'),
  });

  const assets = listData?.data?.data || [];
  const dash = dashData?.data;

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <PageHeader title="Asset Management" subtitle="Manage company hardware, assignments and maintenance"
        actions={<Button onClick={() => setAddModal(true)} className="rounded-2xl">{THEME.ICONS.ADD} Register Asset</Button>} />
      <Tabs tabs={TABS} active={tab} onChange={setTab} className="mb-6" />

      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Inventory Total', value: dash?.total || 0, color: 'border-gray-100', icon: '📦' },
              { label: 'In Stock', value: dash?.available || 0, color: 'border-green-100', icon: '✅' },
              { label: 'Assigned', value: dash?.allocated || 0, color: 'border-blue-100', icon: '👤' },
              { label: 'Maintenance', value: dash?.underRepair || 0, color: 'border-orange-100', icon: '🛠️' },
            ].map(s => (
              <div key={s.label} className={`bg-white/80 backdrop-blur-md rounded-[24px] border border-white/20 p-6 shadow-xl shadow-slate-200/50 flex items-center justify-between`}>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.05em] mb-1">{s.label}</p>
                  <p className="text-3xl font-black text-gray-900 tracking-tight">{s.value}</p>
                </div>
                <div className="text-3xl opacity-20">{s.icon}</div>
              </div>
            ))}
          </div>

          {dash?.warrantyExpiring > 0 && (
            <div className="bg-amber-50/50 backdrop-blur-sm border border-amber-100 rounded-[20px] p-4 flex items-center gap-3 text-amber-800 shadow-sm">
              <span className="text-xl">{THEME.ICONS.WARNING}</span>
              <div>
                <p className="font-bold tracking-tight">Warranty Expiry Alert</p>
                <p className="text-sm">You have {dash.warrantyExpiring} asset(s) with warranty expiring in the next 30 days.</p>
              </div>
            </div>
          )}

          <div className="bg-white/80 backdrop-blur-md rounded-[24px] border border-white/20 p-6 shadow-sm">
            <h3 className="font-black text-gray-900 uppercase text-[10px] tracking-[0.1em] mb-6">Asset Distribution by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dash?.byCategory?.map(c => (
                <div key={c.category} className="bg-white rounded-[20px] p-4 border border-gray-100 hover:border-blue-200 transition-all hover:shadow-lg">
                  <p className="text-2xl font-black text-blue-600">{c._count.id}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">{c.category}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'list' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, serial number, brand..."
                className="pl-4"
              />
            </div>
            <select
              value={statusF}
              onChange={e => setStatusF(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-white focus:ring-2 focus:ring-blue-500 outline-none min-w-[160px]"
            >
              <option value="">Filter: All Status</option>
              {['available', 'allocated', 'under_repair', 'retired'].map(s => (
                <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>

          {isLoading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            : assets.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-20 text-center shadow-sm">
                <div className="text-5xl mb-4">💻</div>
                <p className="text-lg font-bold text-gray-800">No assets matching your criteria</p>
                <Button variant="outline" className="mt-6" onClick={() => setAddModal(true)}>Register First Asset</Button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50/50 text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Asset Identification</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Assignment</th>
                        <th className="px-6 py-4">Warranty</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {assets.map(a => (
                        <tr key={a.id} className="hover:bg-blue-50/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{a.name}</div>
                            <div className="text-[10px] font-mono text-gray-400 mt-0.5">{a.brand} {a.model} · {a.serial_number || 'NO-SERIAL'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded uppercase tracking-tighter">{a.category}</span>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={STATUS_COLOR[a.status] || 'bg-gray-100 text-gray-500'}>
                              {a.status?.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            {a.currentHolder ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                                  {a.currentHolder.first_name[0]}{a.currentHolder.last_name[0]}
                                </div>
                                <span className="text-sm font-medium text-gray-700">{a.currentHolder.first_name} {a.currentHolder.last_name}</span>
                              </div>
                            ) : <span className="text-gray-300 italic text-xs">Unassigned</span>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-bold text-gray-500">
                              {a.warranty_expiry ? new Date(a.warranty_expiry).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-2">
                              {a.status === 'available' && (
                                <Button size="sm" onClick={() => setAllocModal(a)}>Allocate</Button>
                              )}
                              {a.status === 'allocated' && (
                                <Button size="sm" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => setReturnModal(a)}>Return</Button>
                              )}
                              <Button size="sm" variant="ghost" className="text-gray-400">Edit</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </div>
      )}

      {}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Register Asset to Inventory" size="lg">
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <Input label="Asset Common Name *" placeholder="e.g. Designer Workstation 01" {...AF('name')} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Asset Category</label>
              <select value={assetForm.category} onChange={e => setAssetForm(p => ({ ...p, category: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Current Condition</label>
              <select value={assetForm.condition} onChange={e => setAssetForm(p => ({ ...p, condition: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500">
                {CONDITIONS.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Manufacturer / Brand" placeholder="e.g. Dell" {...AF('brand')} />
            <Input label="Model Name/No." placeholder="e.g. Latitude 5420" {...AF('model')} />
          </div>
          <Input label="Serial Number (Unique)" placeholder="Product ID..." {...AF('serialNumber')} />
          <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Financial & Warranty Details</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Purchase Date" type="date" {...AF('purchaseDate')} />
              <Input label="Purchase Price (₹)" type="number" {...AF('purchasePrice')} />
              <Input label="Warranty Expiry" type="date" {...AF('warrantyExpiry')} />
              <Input label="AMC Expiry" type="date" {...AF('amcExpiry')} />
            </div>
            <div className="mt-4">
              <Input label="Vendor / Supplier Name" placeholder="Authorized reseller..." {...AF('vendorName')} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
            <Button variant="outline" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button onClick={() => { if (!assetForm.name) { toast.error('Name is mandatory'); return; } createMut.mutate(assetForm); }} loading={createMut.isPending}>Register Asset</Button>
          </div>
        </div>
      </Modal>

      {}
      <Modal open={!!allocModal} onClose={() => setAllocModal(null)} title={`Allocate: ${allocModal?.name}`} size="md">
        <div className="space-y-5 py-2">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">💻</div>
            <div>
              <p className="text-sm font-bold text-blue-900">{allocModal?.brand} {allocModal?.model}</p>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{allocModal?.serial_number}</p>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Assign to Employee *</label>
            <select value={allocForm.employeeId} onChange={e => setAllocForm(p => ({ ...p, employeeId: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select recipient...</option>
              {empOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <Input label="Allocation Effective Date" type="date" value={allocForm.allocatedDate}
            onChange={e => setAllocForm(p => ({ ...p, allocatedDate: e.target.value }))} />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
            <Button variant="outline" onClick={() => setAllocModal(null)}>Cancel</Button>
            <Button onClick={() => { if (!allocForm.employeeId) { toast.error('Please select an employee'); return; } allocMut.mutate({ id: allocModal.id, ...allocForm }); }} loading={allocMut.isPending}>Confirm Allocation</Button>
          </div>
        </div>
      </Modal>

      {}
      <Modal open={!!returnModal} onClose={() => setReturnModal(null)} title={`Process Asset Return: ${returnModal?.name}`} size="md">
        <div className="space-y-5 py-2">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Currently Held By</p>
            <p className="font-bold text-gray-900">{returnModal?.currentHolder?.first_name} {returnModal?.currentHolder?.last_name}</p>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Condition at Receipt</label>
            <select value={returnForm.conditionAtReturn} onChange={e => setReturnForm(p => ({ ...p, conditionAtReturn: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500">
              {['good', 'fair', 'damaged', 'lost'].map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
            </select>
          </div>
          {['damaged', 'lost'].includes(returnForm.conditionAtReturn) && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
              <div>
                <label className="text-[10px] font-black text-red-400 uppercase tracking-widest block mb-1.5">Incident / Damage Report</label>
                <textarea rows={3} value={returnForm.damageNotes} onChange={e => setReturnForm(p => ({ ...p, damageNotes: e.target.value }))}
                  placeholder="Describe the condition..."
                  className="w-full border border-red-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none bg-red-50/30" />
              </div>
              <label className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100 cursor-pointer">
                <input type="checkbox" checked={returnForm.deductFromFnF}
                  onChange={e => setReturnForm(p => ({ ...p, deductFromFnF: e.target.checked }))}
                  className="w-4 h-4 rounded border-red-200 text-red-600 focus:ring-red-500" />
                <span className="text-xs font-bold text-red-700 uppercase">Deduct recovery cost from F&F</span>
              </label>
              {returnForm.deductFromFnF && (
                <Input label="Recovery Amount (₹) *" type="number" value={returnForm.deductionAmount}
                  onChange={e => setReturnForm(p => ({ ...p, deductionAmount: e.target.value }))} />
              )}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
            <Button variant="outline" onClick={() => setReturnModal(null)}>Cancel</Button>
            <Button variant={['damaged', 'lost'].includes(returnForm.conditionAtReturn) ? 'danger' : 'primary'}
              onClick={() => returnMut.mutate({ id: returnModal.id, ...returnForm })} loading={returnMut.isPending}>
              Finalize Return
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
