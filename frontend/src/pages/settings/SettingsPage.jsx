import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import {
  PageHeader, Button, Spinner, Modal, Input, Select,
  Tabs, ConfirmModal, Alert, Badge,
} from '../../components/ui/Common';

const settingsApi = {
  getCompany:    ()           => api.get('/settings/company').then(r => r.data),
  updateCompany: (d)          => api.put('/settings/company', d).then(r => r.data),

  listHolidays:         (year)  => api.get('/settings/holidays', { params: { year } }).then(r => r.data),
  addHoliday:           (d)     => api.post('/settings/holidays', d).then(r => r.data),
  loadNationalHolidays: (year)  => api.post('/settings/holidays/load-national', { year }).then(r => r.data),
  updateHoliday:        (id, d) => api.put(`/settings/holidays/${id}`, d).then(r => r.data),
  deleteHoliday:        (id)    => api.delete(`/settings/holidays/${id}`).then(r => r.data),

  listShifts:   ()           => api.get('/settings/shifts').then(r => r.data),
  createShift:  (d)          => api.post('/settings/shifts', d).then(r => r.data),
  updateShift:  (id, d)      => api.put(`/settings/shifts/${id}`, d).then(r => r.data),
  deleteShift:  (id)         => api.delete(`/settings/shifts/${id}`).then(r => r.data),

  listDepartments:   ()           => api.get('/settings/departments').then(r => r.data),
  createDepartment:  (d)          => api.post('/settings/departments', d).then(r => r.data),
  updateDepartment:  (id, d)      => api.put(`/settings/departments/${id}`, d).then(r => r.data),
  deleteDepartment:  (id)         => api.delete(`/settings/departments/${id}`).then(r => r.data),

  listDesignations:  ()           => api.get('/settings/designations').then(r => r.data),
  createDesignation: (d)          => api.post('/settings/designations', d).then(r => r.data),
  updateDesignation: (id, d)      => api.put(`/settings/designations/${id}`, d).then(r => r.data),
  deleteDesignation: (id)         => api.delete(`/settings/designations/${id}`).then(r => r.data),

  listBranches:  ()           => api.get('/settings/branches').then(r => r.data),
  createBranch:  (d)          => api.post('/settings/branches', d).then(r => r.data),
  updateBranch:  (id, d)      => api.put(`/settings/branches/${id}`, d).then(r => r.data),
  deleteBranch:  (id)         => api.delete(`/settings/branches/${id}`).then(r => r.data),
};

const TABS = [
  { id: 'company',      label: 'Company Profile',  icon: '🏢' },
  { id: 'holidays',     label: 'Holidays',          icon: '📅' },
  { id: 'shifts',       label: 'Shifts',            icon: '🕐' },
  { id: 'departments',  label: 'Departments',       icon: '🏗' },
  { id: 'designations', label: 'Designations',      icon: '🎖' },
  { id: 'branches',     label: 'Branches',          icon: '📍' },
]

const HOLIDAY_TYPES = [
  { value: 'national', label: 'National Holiday' },
  { value: 'state',    label: 'State Holiday' },
  { value: 'optional', label: 'Optional Holiday' },
  { value: 'company',  label: 'Company Holiday' },
  { id: 'database', label: '🗄 Database', icon: '🗄' },
];

const HOLIDAY_TYPE_BADGE = {
  national: 'bg-red-100 text-red-700',
  state:    'bg-orange-100 text-orange-700',
  optional: 'bg-yellow-100 text-yellow-700',
  company:  'bg-blue-100 text-blue-700',
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function CompanyTab() {
  const qc = useQueryClient();
  const { data: res, isLoading } = useQuery({ queryKey: ['company'], queryFn: settingsApi.getCompany });
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(false);

  const company = res?.data;

  if (company && !form) {
    setForm({
      name: company.name || '', legalName: company.legal_name || '',
      gstin: company.gstin || '', pan: company.pan || '', cin: company.cin || '',
      address: company.address || '', city: company.city || '',
      state: company.state || '', pincode: company.pincode || '',
      phone: company.phone || '', email: company.email || '', website: company.website || '',
      epfNumber: company.epf_number || '', esicNumber: company.esic_number || '',
      ptNumber: company.pt_number || '', lwfNumber: company.lwf_number || '',
      workingDaysMonth: company.working_days_month || 26,
      overtimeThreshold: company.overtime_threshold || 8,
    });
  }

  const updateMutation = useMutation({
    mutationFn: settingsApi.updateCompany,
    onSuccess: () => {
      toast.success('Company profile saved!');
      qc.invalidateQueries({ queryKey: ['company'] });
      setEditing(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  if (isLoading || !form) return <div className="flex justify-center py-10"><Spinner /></div>;

  const F = (k) => ({ value: form[k] ?? '', onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });

  return (
    <div>
      <div className="flex justify-end mb-4">
        {editing
          ? <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={() => updateMutation.mutate(form)} loading={updateMutation.isPending}>Save Changes</Button>
            </div>
          : <Button onClick={() => setEditing(true)}>✏ Edit Profile</Button>
        }
      </div>

      <div className="space-y-6">
        {}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Company Name *"   {...F('name')}      disabled={!editing} />
            <Input label="Legal Name"       {...F('legalName')} disabled={!editing} />
            <Input label="GSTIN"  placeholder="22AAAAA0000A1Z5"  {...F('gstin')}  disabled={!editing} />
            <Input label="PAN"    placeholder="AAAAA0000A"       {...F('pan')}    disabled={!editing} />
            <Input label="CIN"    placeholder="U12345MH2020PTC00" {...F('cin')}   disabled={!editing} />
            <Input label="Phone"  type="tel"  {...F('phone')}  disabled={!editing} />
            <Input label="Email"  type="email" {...F('email')} disabled={!editing} />
            <Input label="Website" placeholder="https://company.com" {...F('website')} disabled={!editing} />
          </div>
        </section>

        {}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-4">Registered Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input label="Address" placeholder="Street address" {...F('address')} disabled={!editing} />
            </div>
            <Input label="City"    placeholder="Mumbai"      {...F('city')}    disabled={!editing} />
            <Input label="State"   placeholder="Maharashtra" {...F('state')}   disabled={!editing} />
            <Input label="Pincode" placeholder="400001"      {...F('pincode')} disabled={!editing} />
          </div>
        </section>

        {}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-4">Statutory Registration Numbers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="EPF Number"  placeholder="MHBAN12345670000001" {...F('epfNumber')}  disabled={!editing} />
            <Input label="ESIC Number" placeholder="12345678901234567"  {...F('esicNumber')} disabled={!editing} />
            <Input label="PT Number"   placeholder="27851234567"        {...F('ptNumber')}   disabled={!editing} />
            <Input label="LWF Number"  placeholder="LWF123"             {...F('lwfNumber')}  disabled={!editing} />
          </div>
        </section>

        {}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-4">Payroll Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Working Days per Month</label>
              <input type="number" min="20" max="31" {...F('workingDaysMonth')} disabled={!editing}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">OT Threshold (hours/day)</label>
              <input type="number" min="6" max="12" {...F('overtimeThreshold')} disabled={!editing}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function HolidaysTab() {
  const qc   = useQueryClient();
  const year = new Date().getFullYear();
  const [selYear,    setSelYear]    = useState(year);
  const [showAdd,    setShowAdd]    = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [hForm,      setHForm]      = useState({ name: '', date: '', type: 'national', recurringYearly: false });

  const { data: res, isLoading } = useQuery({
    queryKey: ['holidays', selYear],
    queryFn:  () => settingsApi.listHolidays(selYear),
  });

  const holidays = res?.data || [];

  const addMutation = useMutation({
    mutationFn: settingsApi.addHoliday,
    onSuccess: () => { toast.success('Holiday added!'); qc.invalidateQueries({ queryKey: ['holidays'] }); setShowAdd(false); setHForm({ name:'', date:'', type:'national', recurringYearly: false }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const loadMutation = useMutation({
    mutationFn: () => settingsApi.loadNationalHolidays(selYear),
    onSuccess: (r) => { toast.success(`${r.data.added} national holidays loaded!`); qc.invalidateQueries({ queryKey: ['holidays'] }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => settingsApi.deleteHoliday(id),
    onSuccess: () => { toast.success('Holiday deleted.'); qc.invalidateQueries({ queryKey: ['holidays'] }); setDeleteTarget(null); },
  });

  const byMonth = {};
  for (const h of holidays) {
    const m = new Date(h.date).getMonth();
    if (!byMonth[m]) byMonth[m] = [];
    byMonth[m].push(h);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <select value={selYear} onChange={e => setSelYear(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
            {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="text-sm text-gray-500">{holidays.length} holidays</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadMutation.mutate()} loading={loadMutation.isPending}>
            📥 Load National Holidays
          </Button>
          <Button onClick={() => setShowAdd(true)}>+ Add Holiday</Button>
        </div>
      </div>

      {isLoading ? <div className="flex justify-center py-10"><Spinner /></div>
        : holidays.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-3xl mb-3">📅</p>
            <p className="font-semibold text-gray-700">No holidays for {selYear}</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">Load national holidays or add manually</p>
            <Button onClick={() => loadMutation.mutate()} loading={loadMutation.isPending}>
              📥 Load National Holidays
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(12)].map((_, mi) => {
              const list = byMonth[mi] || [];
              if (!list.length) return null;
              return (
                <div key={mi} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                    <p className="font-bold text-gray-800 text-sm">{MONTH_NAMES[mi]} {selYear}</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {list.map(h => (
                      <div key={h.id} className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="text-center w-8 flex-shrink-0">
                            <p className="text-lg font-bold text-gray-800 leading-none">
                              {new Date(h.date).getDate()}
                            </p>
                            <p className="text-xs text-gray-400">
                              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(h.date).getDay()]}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{h.name}</p>
                            <span className={`text-xs px-1.5 py-0.5 rounded capitalize font-medium ${HOLIDAY_TYPE_BADGE[h.type] || 'bg-gray-100 text-gray-600'}`}>
                              {h.type}
                            </span>
                          </div>
                        </div>
                        <button onClick={() => setDeleteTarget(h)}
                          className="text-gray-300 hover:text-red-500 transition-colors text-sm">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )
      }

      {}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Holiday" size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate(hForm)} loading={addMutation.isPending}>Add Holiday</Button>
          </>
        }>
        <div className="space-y-3 py-2">
          <Input label="Holiday Name *" placeholder="e.g. Diwali"
            value={hForm.name} onChange={e => setHForm(f => ({...f, name: e.target.value}))} />
          <Input label="Date *" type="date"
            value={hForm.date} onChange={e => setHForm(f => ({...f, date: e.target.value}))} />
          <Select label="Type" options={HOLIDAY_TYPES}
            value={hForm.type} onChange={e => setHForm(f => ({...f, type: e.target.value}))} />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-blue-600"
              checked={hForm.recurringYearly}
              onChange={e => setHForm(f => ({...f, recurringYearly: e.target.checked}))} />
            <span className="text-sm text-gray-700">Recurring every year</span>
          </label>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)} loading={deleteMutation.isPending}
        title="Delete Holiday" message={`Remove "${deleteTarget?.name}" from holidays?`} confirmLabel="Delete" />
    </div>
  );
}

const DAY_NAMES_NUM = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function ShiftsTab() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const emptyShift = { name:'', startTime:'09:00', endTime:'18:00', lateGraceMins: 15, earlyLeaveMins: 15, weekOffs: [0,6] };
  const [form, setForm] = useState(emptyShift);

  const { data: res, isLoading } = useQuery({ queryKey: ['shifts'], queryFn: settingsApi.listShifts });
  const shifts = res?.data || [];

  const createMutation = useMutation({
    mutationFn: settingsApi.createShift,
    onSuccess: () => { toast.success('Shift created!'); qc.invalidateQueries({ queryKey: ['shifts'] }); setShowCreate(false); setForm(emptyShift); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => settingsApi.updateShift(id, data),
    onSuccess: () => { toast.success('Shift updated!'); qc.invalidateQueries({ queryKey: ['shifts'] }); setEditing(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => settingsApi.deleteShift(id),
    onSuccess: () => { toast.success('Shift deleted.'); qc.invalidateQueries({ queryKey: ['shifts'] }); setDeleteTarget(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const toggleWeekOff = (form, setForm, day) => {
    setForm(f => {
      const offs = [...(f.weekOffs || [])];
      const idx  = offs.indexOf(day);
      if (idx >= 0) offs.splice(idx, 1); else offs.push(day);
      return { ...f, weekOffs: offs };
    });
  };

  const ShiftForm = ({ f, setF, onSave, saving }) => (
    <div className="space-y-4 py-2">
      <Input label="Shift Name *" placeholder="e.g. General Shift"
        value={f.name} onChange={e => setF(p => ({...p, name: e.target.value}))} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Start Time *" type="time" value={f.startTime} onChange={e => setF(p => ({...p, startTime: e.target.value}))} />
        <Input label="End Time *"   type="time" value={f.endTime}   onChange={e => setF(p => ({...p, endTime:   e.target.value}))} />
        <Input label="Late Grace (mins)"   type="number" value={f.lateGraceMins}  onChange={e => setF(p => ({...p, lateGraceMins:  parseInt(e.target.value)}))} />
        <Input label="Early Leave (mins)"  type="number" value={f.earlyLeaveMins} onChange={e => setF(p => ({...p, earlyLeaveMins: parseInt(e.target.value)}))} />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Week Offs</label>
        <div className="flex gap-2 flex-wrap">
          {DAY_NAMES_NUM.map((d, i) => (
            <button key={i} type="button"
              onClick={() => toggleWeekOff(f, setF, i)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                f.weekOffs?.includes(i)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
              }`}>{d}</button>
          ))}
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button onClick={onSave} loading={saving}>Save Shift</Button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowCreate(true)}>+ New Shift</Button>
      </div>

      {isLoading ? <div className="flex justify-center py-10"><Spinner /></div>
        : shifts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-3xl mb-3">🕐</p>
            <p className="font-semibold text-gray-700">No shifts created yet</p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>+ Create First Shift</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {shifts.map(s => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">{s.name}</p>
                    {!s.is_active && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Inactive</span>}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">
                    🕐 {s.start_time} — {s.end_time}
                    <span className="text-gray-400 ml-2">({s.total_hours?.toFixed(1)} hrs)</span>
                    <span className="text-gray-400 ml-2">· {s.employeeCount || 0} employees</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Late grace: {s.late_grace_mins}m · Early leave: {s.early_leave_mins}m ·
                    Week offs: {(s.week_offs || []).map(d => DAY_NAMES_NUM[d]).join(', ')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline"
                    onClick={() => setEditing({ ...s, editForm: { name: s.name, startTime: s.start_time, endTime: s.end_time, lateGraceMins: s.late_grace_mins, earlyLeaveMins: s.early_leave_mins, weekOffs: s.week_offs || [] } })}>
                    ✏ Edit
                  </Button>
                  <Button size="sm" variant="outline"
                    className="text-red-600 border-red-200"
                    onClick={() => setDeleteTarget(s)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )
      }

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Shift">
        <ShiftForm f={form} setF={setForm} onSave={() => createMutation.mutate(form)} saving={createMutation.isPending} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit — ${editing?.name}`}>
        {editing && (
          <ShiftForm
            f={editing.editForm}
            setF={ef => setEditing(ed => ({...ed, editForm: typeof ef === 'function' ? ef(ed.editForm) : ef}))}
            onSave={() => updateMutation.mutate({ id: editing.id, data: editing.editForm })}
            saving={updateMutation.isPending}
          />
        )}
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)} loading={deleteMutation.isPending}
        title="Delete Shift" message={`Delete "${deleteTarget?.name}"? Employees on this shift will be unassigned.`} confirmLabel="Delete" />
    </div>
  );
}

function SimpleListTab({ queryKey, listFn, createFn, updateFn, deleteFn, itemLabel, fields, renderItem }) {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({});

  const { data: res, isLoading } = useQuery({ queryKey: [queryKey], queryFn: listFn });
  const items = res?.data || [];

  const createMutation = useMutation({
    mutationFn: createFn,
    onSuccess: () => { toast.success(`${itemLabel} created!`); qc.invalidateQueries({ queryKey: [queryKey] }); setShowCreate(false); setForm({}); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateFn(id, data),
    onSuccess: () => { toast.success('Updated!'); qc.invalidateQueries({ queryKey: [queryKey] }); setEditing(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => { toast.success('Deleted.'); qc.invalidateQueries({ queryKey: [queryKey] }); setDeleteTarget(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const FormFields = ({ f, setF }) => (
    <div className="space-y-3 py-2">
      {fields.map(field => (
        <Input key={field.key} label={field.label} placeholder={field.placeholder} type={field.type || 'text'}
          value={f[field.key] ?? ''} onChange={e => setF(p => ({...p, [field.key]: e.target.value}))} />
      ))}
    </div>
  );

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setForm({}); setShowCreate(true); }}>+ Add {itemLabel}</Button>
      </div>

      {isLoading ? <div className="flex justify-center py-10"><Spinner /></div>
        : items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="font-semibold text-gray-700">No {itemLabel}s yet</p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>+ Add First {itemLabel}</Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between px-5 py-3">
                <div>{renderItem(item)}</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline"
                    onClick={() => { setEditing({ ...item, editForm: fields.reduce((a, f) => ({...a, [f.key]: item[f.dbKey || f.key] || ''}), {}) }); }}>
                    ✏
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200"
                    onClick={() => setDeleteTarget(item)}>✕</Button>
                </div>
              </div>
            ))}
          </div>
        )
      }

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={`Add ${itemLabel}`} size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} loading={createMutation.isPending}>Create</Button>
          </>
        }>
        <FormFields f={form} setF={setForm} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit ${itemLabel}`} size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate({ id: editing.id, data: editing.editForm })} loading={updateMutation.isPending}>Save</Button>
          </>
        }>
        {editing && <FormFields f={editing.editForm} setF={ef => setEditing(ed => ({...ed, editForm: typeof ef === 'function' ? ef(ed.editForm) : ef}))} />}
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)} loading={deleteMutation.isPending}
        title={`Delete ${itemLabel}`} message={`Delete "${deleteTarget?.name}"? This cannot be undone.`} confirmLabel="Delete" />
    </div>
  );
}

function DatabaseTab() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    dbMode: 'local', localDbType: 'sqlserver',
    localDbHost: 'localhost', localDbPort: '55747',
    localDbName: '', localDbUser: '', localDbPass: '',
    cloudDbUrl: '', syncIntervalMin: '5',
  });
  const [testing,  setTesting]  = useState(false);
  const [testMsg,  setTestMsg]  = useState(null);  
  const [showPass, setShowPass] = useState(false);

  const { data: cfgRes, isLoading } = useQuery({
    queryKey: ['db-config'],
    queryFn:  () => api.get('/settings/db-config').then(r => r.data),
  });

  useEffect(() => {
    const d = cfgRes?.data;
    if (!d) return;
    setForm({
      dbMode:           d.db_mode        || 'local',
      localDbType:      d.local_db_type  || 'sqlserver',
      localDbHost:      d.local_db_host  || 'localhost',
      localDbPort:      String(d.local_db_port || 55747),
      localDbName:      d.local_db_name  || '',
      localDbUser:      d.local_db_user  || '',
      localDbPass:      '',  
      cloudDbUrl:       d.cloud_db_url   || '',
      syncIntervalMin:  String(d.sync_interval_min || 5),
    });
  }, [cfgRes]);

  const saveMut = useMutation({
    mutationFn: (data) => api.put('/settings/db-config', data).then(r => r.data),
    onSuccess:  (r)    => { toast.success(r.message || 'Saved'); qc.invalidateQueries(['db-config']); },
    onError:    (e)    => toast.error(e.response?.data?.message || 'Save failed'),
  });

  async function testConnection() {
    setTesting(true); setTestMsg(null);
    try {
      const r = await api.post('/settings/db-config/test', form);
      setTestMsg({ ok: true,  msg: r.data?.message || 'Connection successful ✓' });
    } catch (e) {
      setTestMsg({ ok: false, msg: e.response?.data?.message || 'Connection failed' });
    } finally { setTesting(false); }
  }

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setTestMsg(null); };
  const isCloud = form.dbMode === 'cloud';

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-6">

      {}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Database Mode</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id:'local', icon:'🖥', title:'Local / On-Premise',
              desc:'SQL Server on your own machine or server. Default for development.' },
            { id:'cloud', icon:'☁️', title:'Cloud (Supabase / Neon / PlanetScale)',
              desc:'Hosted PostgreSQL. Accessible from anywhere. Best for production.' },
          ].map(opt => (
            <button key={opt.id} onClick={() => set('dbMode', opt.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                form.dbMode === opt.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}>
              <p className="text-lg mb-1">{opt.icon}</p>
              <p className={`text-sm font-semibold ${form.dbMode === opt.id ? 'text-blue-700' : 'text-gray-800'}`}>
                {opt.title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {}
      {isCloud && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Supabase / Cloud Connection</p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 space-y-1">
            <p className="font-semibold">How to get your Supabase connection string:</p>
            <p>1. Go to supabase.com → your project → Settings → Database</p>
            <p>2. Copy the <strong>Connection string</strong> (URI format)</p>
            <p>3. Replace <code>[YOUR-PASSWORD]</code> with your DB password</p>
            <p className="text-blue-600">Format: <code>postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres</code></p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Database URL <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={form.cloudDbUrl}
              onChange={e => set('cloudDbUrl', e.target.value)}
              placeholder="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
      )}

      {}
      {!isCloud && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Local SQL Server Config</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-600 block mb-1">Database Type</label>
              <select value={form.localDbType} onChange={e => set('localDbType', e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white">
                <option value="sqlserver">SQL Server / MSSQL</option>
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Host</label>
              <input value={form.localDbHost} onChange={e => set('localDbHost', e.target.value)}
                placeholder="localhost" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Port</label>
              <input value={form.localDbPort} onChange={e => set('localDbPort', e.target.value)}
                placeholder="55747" type="number" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-600 block mb-1">Database Name</label>
              <input value={form.localDbName} onChange={e => set('localDbName', e.target.value)}
                placeholder="hrms_dev_tenant" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Username <span className="text-gray-400 font-normal">(leave blank for Windows auth)</span>
              </label>
              <input value={form.localDbUser} onChange={e => set('localDbUser', e.target.value)}
                placeholder="sa" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'}
                  value={form.localDbPass} onChange={e => set('localDbPass', e.target.value)}
                  placeholder={cfgRes?.data?.local_db_user ? '(unchanged)' : 'leave blank for Windows auth'}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 pr-10" />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      {testMsg && (
        <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
          testMsg.ok ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <span>{testMsg.ok ? '✓' : '✗'}</span>
          <span>{testMsg.msg}</span>
        </div>
      )}

      {}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
        <p className="font-semibold">⚠ Important — read before changing</p>
        <p>• This config is saved to the <strong>central database</strong> (hrms_central) — it persists across restarts</p>
        <p>• The tenant database URL in your <code>.env</code> file is used on startup. Changing this setting here updates the central record for future use</p>
        <p>• After switching to cloud: update <code>DEV_TENANT_DATABASE_URL</code> in your <code>.env</code> to the new URL, then restart the server</p>
        <p>• When migrating to Supabase, run <code>prisma migrate deploy</code> against the Supabase URL first</p>
      </div>

      {}
      <div className="flex gap-3">
        <button onClick={testConnection} disabled={testing}
          className="px-4 py-2 border border-gray-300 text-sm font-semibold rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2">
          {testing && <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin inline-block"/>}
          {testing ? 'Testing…' : '🔌 Test Connection'}
        </button>
        <Button onClick={() => saveMut.mutate(form)} loading={saveMut.isPending}>
          Save Config
        </Button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState('company');

  return (
    <div>
      <PageHeader title="Settings" subtitle="Company configuration, holidays, shifts and org structure" />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'company'  && <CompanyTab />}
      {tab === 'database' && <DatabaseTab />}
      {tab === 'holidays' && <HolidaysTab />}
      {tab === 'shifts'   && <ShiftsTab />}

      {tab === 'departments' && (
        <SimpleListTab
          queryKey="settings-departments"
          listFn={settingsApi.listDepartments}
          createFn={settingsApi.createDepartment}
          updateFn={settingsApi.updateDepartment}
          deleteFn={settingsApi.deleteDepartment}
          itemLabel="Department"
          fields={[{ key: 'name', label: 'Department Name *', placeholder: 'e.g. Engineering' }]}
          renderItem={item => (
            <div>
              <p className="font-medium text-gray-900">{item.name}</p>
              <p className="text-xs text-gray-400">{item._count?.employees || 0} employees</p>
            </div>
          )}
        />
      )}

      {tab === 'designations' && (
        <SimpleListTab
          queryKey="settings-designations"
          listFn={settingsApi.listDesignations}
          createFn={settingsApi.createDesignation}
          updateFn={settingsApi.updateDesignation}
          deleteFn={settingsApi.deleteDesignation}
          itemLabel="Designation"
          fields={[
            { key: 'name',  label: 'Designation Name *', placeholder: 'e.g. Senior Engineer' },
            { key: 'level', label: 'Level (1=Senior, 9=Junior)', placeholder: '6', type: 'number', dbKey: 'level' },
          ]}
          renderItem={item => (
            <div>
              <p className="font-medium text-gray-900">{item.name}</p>
              <p className="text-xs text-gray-400">
                Level {item.level || '—'} · {item._count?.employees || 0} employees
              </p>
            </div>
          )}
        />
      )}

      {tab === 'branches' && (
        <SimpleListTab
          queryKey="settings-branches"
          listFn={settingsApi.listBranches}
          createFn={settingsApi.createBranch}
          updateFn={settingsApi.updateBranch}
          deleteFn={settingsApi.deleteBranch}
          itemLabel="Branch"
          fields={[
            { key: 'name',    label: 'Branch Name *', placeholder: 'e.g. Mumbai HO' },
            { key: 'city',    label: 'City',           placeholder: 'Mumbai' },
            { key: 'state',   label: 'State',          placeholder: 'Maharashtra' },
            { key: 'address', label: 'Address',        placeholder: 'Full address' },
            { key: 'phone',   label: 'Phone',          placeholder: '022-12345678' },
          ]}
          renderItem={item => (
            <div>
              <p className="font-medium text-gray-900">{item.name}</p>
              <p className="text-xs text-gray-400">
                {[item.city, item.state].filter(Boolean).join(', ') || '—'}
                {' · '}{item._count?.employees || 0} employees
              </p>
            </div>
          )}
        />
      )}
    </div>
  );
}

