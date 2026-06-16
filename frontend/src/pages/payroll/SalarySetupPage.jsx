import { useState }    from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast }       from 'react-hot-toast';
import api             from '../../services/api';
import { PageHeader, Button, Input, Select, Modal, Spinner, Tabs, Alert, ConfirmModal } from '../../components/ui/Common';

const salaryApi = {
  
  listComponents:    ()         => api.get('/payroll/salary-structures/components').then(r => r.data),
  createComponent:   (d)        => api.post('/payroll/salary-structures/components', d).then(r => r.data),
  updateComponent:   (id, d)    => api.put(`/payroll/salary-structures/components/${id}`, d).then(r => r.data),
  deleteComponent:   (id)       => api.delete(`/payroll/salary-structures/components/${id}`).then(r => r.data),

  listStructures:    ()         => api.get('/payroll/salary-structures').then(r => r.data),
  createStructure:   (d)        => api.post('/payroll/salary-structures', d).then(r => r.data),
  updateStructure:   (id, d)    => api.put(`/payroll/salary-structures/${id}`, d).then(r => r.data),
  deleteStructure:   (id)       => api.delete(`/payroll/salary-structures/${id}`).then(r => r.data),

  getEmpSalary:      (empId)    => api.get(`/payroll/employee-salaries/${empId}`).then(r => r.data),
  setEmpSalary:      (d)        => api.post('/payroll/employee-salaries', d).then(r => r.data),

  listEmployees:     (p)        => api.get('/employees', { params: p }).then(r => r.data),
};

const toRupees = (paise) => paise ? (paise / 100).toFixed(2) : '0.00';
const toPaise  = (rupees) => Math.round(parseFloat(rupees || 0) * 100);
const fmtINR   = (paise)  => `₹${(paise/100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

const COMP_TYPES = [
  { value: 'earning',         label: 'Earning (+ adds to gross)' },
  { value: 'deduction',       label: 'Deduction (- removed from gross)' },
  { value: 'employer_contrib',label: 'Employer Contribution (CTC only, not in payslip earnings)' },
];

const CALC_METHODS = [
  { value: 'flat',          label: 'Flat Amount (fixed rupees)' },
  { value: 'pct_basic',     label: '% of Basic' },
  { value: 'pct_gross',     label: '% of Gross' },
  { value: 'pct_ctc',       label: '% of CTC' },
  { value: 'statutory',     label: 'Statutory Rule (PF/ESI/PT calculated by law)' },
];

const TABS = [
  { id: 'components',  label: 'Components',  icon: '⚙️' },
  { id: 'structures',  label: 'Structures',  icon: '🏗' },
  { id: 'assign',      label: 'Assign to Employee', icon: '👤' },
];

export default function SalarySetupPage() {
  const qc           = useQueryClient();
  const [tab,        setTab]        = useState('components');
  const [compModal,  setCompModal]  = useState(null);  
  const [structModal,setStructModal]= useState(null);
  const [deleteConf, setDeleteConf] = useState(null);  
  const [assignEmp,  setAssignEmp]  = useState('');
  const [ctcAnnual,  setCtcAnnual]  = useState('');
  const [structId,   setStructId]   = useState('');
  const [compForm,   setCompForm]   = useState({
    name:'', type:'earning', calcMethod:'flat', value:'', isTaxable: true, isActive: true,
  });

  const { data: compsRes, isLoading: compsLoading } = useQuery({
    queryKey: ['salary-components'],
    queryFn:  salaryApi.listComponents,
  });
  const { data: structsRes, isLoading: structsLoading } = useQuery({
    queryKey: ['salary-structures'],
    queryFn:  salaryApi.listStructures,
  });
  const { data: empsRes } = useQuery({
    queryKey: ['employees-salary'],
    queryFn:  () => salaryApi.listEmployees({ limit: 200, status: 'active' }),
  });
  const { data: empSalRes, isLoading: empSalLoading } = useQuery({
    queryKey: ['emp-salary', assignEmp],
    queryFn:  () => salaryApi.getEmpSalary(assignEmp),
    enabled:  !!assignEmp,
  });

  const components = compsRes?.data || [];
  const structures = structsRes?.data || [];
  const employees  = empsRes?.data || [];
  const empSalary  = empSalRes?.data;

  const saveCompMutation = useMutation({
    mutationFn: (d) => d.id ? salaryApi.updateComponent(d.id, d) : salaryApi.createComponent(d),
    onSuccess: () => {
      toast.success(compModal?.id ? 'Component updated' : 'Component created');
      qc.invalidateQueries({ queryKey: ['salary-components'] });
      setCompModal(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteCompMutation = useMutation({
    mutationFn: (id) => salaryApi.deleteComponent(id),
    onSuccess: () => {
      toast.success('Deleted');
      qc.invalidateQueries({ queryKey: ['salary-components'] });
      setDeleteConf(null);
    },
  });

  const setEmpSalMutation = useMutation({
    mutationFn: salaryApi.setEmpSalary,
    onSuccess: () => {
      toast.success('Salary assigned to employee');
      qc.invalidateQueries({ queryKey: ['emp-salary', assignEmp] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const openNewComp = () => {
    setCompForm({ name:'', type:'earning', calcMethod:'flat', value:'', isTaxable: true, isActive: true });
    setCompModal('new');
  };
  const openEditComp = (c) => {
    setCompForm({ ...c, value: c.value ? toRupees(c.value) : '' });
    setCompModal(c);
  };

  const saveComp = () => {
    if (!compForm.name.trim()) { toast.error('Component name required'); return; }
    saveCompMutation.mutate({
      ...compForm,
      id:    compModal?.id,
      value: compForm.calcMethod === 'flat' ? toPaise(compForm.value) : parseFloat(compForm.value || 0),
    });
  };

  const assignSalary = () => {
    if (!assignEmp)   { toast.error('Select an employee'); return; }
    if (!ctcAnnual)   { toast.error('Enter CTC'); return; }
    if (!structId)    { toast.error('Select salary structure'); return; }
    setEmpSalMutation.mutate({
      employeeId:          assignEmp,
      salaryStructureId:   structId,
      ctcAnnual:           toPaise(ctcAnnual),
      effectiveFrom:       new Date().toISOString().slice(0,10),
    });
  };

  const earnings    = components.filter(c => c.type === 'earning');
  const deductions  = components.filter(c => c.type === 'deduction');
  const empContribs = components.filter(c => c.type === 'employer_contrib');

  return (
    <div>
      <PageHeader title="Salary Setup" subtitle="Configure components, structures, and assign salaries" />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />

        {}
        {tab === 'components' && (
          <div>
            <div className="flex justify-end mb-4">
              <Button onClick={openNewComp}>+ Add Component</Button>
            </div>
            {compsLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : (
              <div className="space-y-6">
                {[
                  { title: 'Earnings', items: earnings, color: 'green' },
                  { title: 'Deductions', items: deductions, color: 'red' },
                  { title: 'Employer Contributions', items: empContribs, color: 'blue' },
                ].map(group => (
                  <div key={group.title}>
                    <h3 className={`text-sm font-semibold mb-2 ${
                      group.color === 'green' ? 'text-green-700' :
                      group.color === 'red' ? 'text-red-700' : 'text-blue-700'
                    }`}>{group.title} ({group.items.length})</h3>
                    {group.items.length === 0 ? (
                      <p className="text-sm text-gray-400 py-2">None added yet</p>
                    ) : (
                      <table className="w-full text-sm border border-gray-100 rounded-lg overflow-hidden">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-2 text-left text-xs text-gray-500 font-semibold">Name</th>
                            <th className="px-4 py-2 text-left text-xs text-gray-500 font-semibold">Calculation</th>
                            <th className="px-4 py-2 text-left text-xs text-gray-500 font-semibold">Value</th>
                            <th className="px-4 py-2 text-left text-xs text-gray-500 font-semibold">Taxable</th>
                            <th className="px-4 py-2 text-right text-xs text-gray-500 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {group.items.map(c => (
                            <tr key={c.id} className={`${!c.isActive ? 'opacity-50' : ''}`}>
                              <td className="px-4 py-2.5 font-medium text-gray-900">{c.name}</td>
                              <td className="px-4 py-2.5 text-gray-600 capitalize">
                                {CALC_METHODS.find(m => m.value === c.calcMethod)?.label || c.calcMethod}
                              </td>
                              <td className="px-4 py-2.5 text-gray-600 font-mono">
                                {c.calcMethod === 'flat'
                                  ? fmtINR(c.value)
                                  : `${c.value}%`
                                }
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={`text-xs px-1.5 py-0.5 rounded ${c.isTaxable ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                  {c.isTaxable ? 'Taxable' : 'Non-taxable'}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <div className="flex gap-1 justify-end">
                                  <button onClick={() => openEditComp(c)}
                                    className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1">Edit</button>
                                  <button onClick={() => setDeleteConf({ type: 'component', id: c.id, name: c.name })}
                                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1">Delete</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {}
        {tab === 'structures' && (
          <div>
            <div className="flex justify-end mb-4">
              <Button onClick={() => setStructModal('new')}>+ New Structure</Button>
            </div>
            {structsLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : structures.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-2">No salary structures yet</p>
                <p className="text-sm text-gray-400">Create structures like "Staff Grade 1", "Manager Level", etc.</p>
                <Button className="mt-4" onClick={() => setStructModal('new')}>Create First Structure</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {structures.map(s => (
                  <div key={s.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{s.name}</p>
                        {s.description && <p className="text-sm text-gray-500 mt-0.5">{s.description}</p>}
                        <p className="text-xs text-gray-400 mt-1">
                          {s.components?.length || 0} components ·
                          {s.isDefault ? ' Default structure' : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button className="text-xs text-blue-600 hover:text-blue-800">Edit</button>
                        <button onClick={() => setDeleteConf({ type: 'structure', id: s.id, name: s.name })}
                          className="text-xs text-red-500 hover:text-red-700">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {}
        {tab === 'assign' && (
          <div className="space-y-6">
            <Alert type="info">
              Select an employee, enter their CTC, choose a salary structure — the system will auto-calculate all components.
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Employee" required
                options={employees.map(e => ({
                  value: e.id,
                  label: `${e.fullName} (${e.employeeCode})`,
                }))}
                placeholder="Select employee"
                value={assignEmp}
                onChange={e => setAssignEmp(e.target.value)}
              />
              <Input
                label="Annual CTC (₹)" required
                type="number"
                placeholder="e.g. 300000"
                value={ctcAnnual}
                onChange={e => setCtcAnnual(e.target.value)}
              />
              <Select
                label="Salary Structure" required
                options={structures.map(s => ({ value: s.id, label: s.name }))}
                placeholder="Select structure"
                value={structId}
                onChange={e => setStructId(e.target.value)}
              />
            </div>

            {}
            {empSalLoading && <div className="flex justify-center py-4"><Spinner /></div>}
            {empSalary && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm font-semibold text-blue-900 mb-2">Current Salary</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><p className="text-xs text-blue-600">Annual CTC</p><p className="font-semibold">{fmtINR(empSalary.ctcAnnual)}</p></div>
                  <div><p className="text-xs text-blue-600">Monthly CTC</p><p className="font-semibold">{fmtINR(Math.round(empSalary.ctcAnnual / 12))}</p></div>
                  <div><p className="text-xs text-blue-600">Gross Monthly</p><p className="font-semibold">{fmtINR(empSalary.grossMonthly)}</p></div>
                  <div><p className="text-xs text-blue-600">Net Monthly (est.)</p><p className="font-semibold text-green-700">{fmtINR(empSalary.netMonthly)}</p></div>
                </div>
                <p className="text-xs text-blue-500 mt-2">Effective from: {new Date(empSalary.effectiveFrom).toLocaleDateString('en-IN')}</p>
              </div>
            )}

            {ctcAnnual && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-sm font-semibold text-gray-700 mb-2">Preview (approximate)</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><p className="text-xs text-gray-500">Annual CTC</p><p className="font-semibold">{fmtINR(toPaise(ctcAnnual))}</p></div>
                  <div><p className="text-xs text-gray-500">Monthly CTC</p><p className="font-semibold">{fmtINR(Math.round(toPaise(ctcAnnual) / 12))}</p></div>
                  <div><p className="text-xs text-gray-500">Est. Basic (40%)</p><p className="font-semibold">{fmtINR(Math.round(toPaise(ctcAnnual) * 0.4 / 12))}</p></div>
                  <div><p className="text-xs text-gray-500">Est. HRA (20%)</p><p className="font-semibold">{fmtINR(Math.round(toPaise(ctcAnnual) * 0.2 / 12))}</p></div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={assignSalary}
                loading={setEmpSalMutation.isPending}
                disabled={!assignEmp || !ctcAnnual || !structId}
              >
                {empSalary ? 'Update Salary' : 'Assign Salary'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {}
      <Modal
        open={!!compModal}
        onClose={() => setCompModal(null)}
        title={compModal?.id ? `Edit — ${compModal.name}` : 'Add Salary Component'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setCompModal(null)}>Cancel</Button>
            <Button onClick={saveComp} loading={saveCompMutation.isPending}>Save Component</Button>
          </>
        }
      >
        <div className="space-y-4 py-1">
          <Input label="Component Name" required placeholder="e.g. Basic, HRA, PF Employee"
            value={compForm.name}
            onChange={e => setCompForm(f => ({...f, name: e.target.value}))}
          />
          <Select label="Type" required options={COMP_TYPES}
            value={compForm.type}
            onChange={e => setCompForm(f => ({...f, type: e.target.value}))}
          />
          <Select label="Calculation Method" required options={CALC_METHODS}
            value={compForm.calcMethod}
            onChange={e => setCompForm(f => ({...f, calcMethod: e.target.value}))}
          />
          <Input
            label={compForm.calcMethod === 'flat' ? 'Amount (₹)' : 'Percentage (%)'}
            required
            type="number"
            placeholder={compForm.calcMethod === 'flat' ? 'e.g. 5000' : 'e.g. 40'}
            value={compForm.value}
            onChange={e => setCompForm(f => ({...f, value: e.target.value}))}
          />
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={compForm.isTaxable}
                onChange={e => setCompForm(f => ({...f, isTaxable: e.target.checked}))}
                className="w-4 h-4" />
              <span className="text-sm text-gray-700">Taxable component</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={compForm.isActive}
                onChange={e => setCompForm(f => ({...f, isActive: e.target.checked}))}
                className="w-4 h-4" />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>
        </div>
      </Modal>

      {}
      <ConfirmModal
        open={!!deleteConf}
        onClose={() => setDeleteConf(null)}
        onConfirm={() => {
          if (deleteConf.type === 'component') deleteCompMutation.mutate(deleteConf.id);
        }}
        title={`Delete ${deleteConf?.name}?`}
        message="This cannot be undone. Existing payrolls that use this component will retain their data."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteCompMutation.isPending}
      />
    </div>
  );
}

