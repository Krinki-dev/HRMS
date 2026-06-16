import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { PageHeader, Button, Spinner, Modal, Input, Badge, ConfirmModal } from '../../components/ui/Common';

const rolesApi = {
  list:       ()           => api.get('/roles').then(r => r.data),
  create:     (d)          => api.post('/roles', d).then(r => r.data),
  update:     (id, d)      => api.put(`/roles/${id}`, d).then(r => r.data),
  remove:     (id)         => api.delete(`/roles/${id}`).then(r => r.data),
  assignRole: (userId, roleId) => api.put(`/roles/assign/${userId}`, { roleId }).then(r => r.data),
};

const MODULES = [
  { id: 'employees',   label: 'Employees',    icon: '👥' },
  { id: 'attendance',  label: 'Attendance',   icon: '🕐' },
  { id: 'leave',       label: 'Leave',        icon: '🏖' },
  { id: 'payroll',     label: 'Payroll',      icon: '💰' },
  { id: 'compliance',  label: 'Compliance',   icon: '📋' },
  { id: 'recruitment', label: 'Recruitment',  icon: '🎯' },
  { id: 'performance', label: 'Performance',  icon: '🏆' },
  { id: 'training',    label: 'Training',     icon: '📚' },
  { id: 'assets',      label: 'Assets',       icon: '💻' },
  { id: 'expenses',    label: 'Expenses',     icon: '🧾' },
  { id: 'reports',     label: 'Reports',      icon: '📊' },
  { id: 'settings',    label: 'Settings',     icon: '⚙️' },
];

const ACTIONS = [
  { id: 'view',    label: 'View' },
  { id: 'create',  label: 'Create' },
  { id: 'edit',    label: 'Edit' },
  { id: 'delete',  label: 'Delete' },
  { id: 'export',  label: 'Export' },
  { id: 'approve', label: 'Approve' },
];

const emptyPerms = () => Object.fromEntries(
  MODULES.map(m => [m.id, Object.fromEntries(ACTIONS.map(a => [a.id, false]))])
);

function PermissionMatrix({ value, onChange, disabled }) {
  const toggle = (module, action) => {
    if (disabled) return;
    const newPerms = { ...value, [module]: { ...value[module], [action]: !value[module]?.[action] } };
    
    if (action === 'view' && value[module]?.view) {
      newPerms[module] = Object.fromEntries(ACTIONS.map(a => [a.id, false]));
    }
    
    if (action !== 'view' && !value[module]?.view) {
      newPerms[module] = { ...newPerms[module], view: true };
    }
    onChange(newPerms);
  };

  const toggleAll = (module) => {
    if (disabled) return;
    const allOn = ACTIONS.every(a => value[module]?.[a.id]);
    onChange({ ...value, [module]: Object.fromEntries(ACTIONS.map(a => [a.id, !allOn])) });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left px-4 py-2 text-gray-600 font-semibold w-40">Module</th>
            {ACTIONS.map(a => (
              <th key={a.id} className="text-center px-3 py-2 text-gray-600 font-semibold text-xs">{a.label}</th>
            ))}
            <th className="text-center px-3 py-2 text-gray-400 text-xs">All</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {MODULES.map(m => {
            const perms  = value[m.id] || {};
            const allOn  = ACTIONS.every(a => perms[a.id]);
            return (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5">
                  <span className="text-base mr-2">{m.icon}</span>
                  <span className="font-medium text-gray-800 text-sm">{m.label}</span>
                </td>
                {ACTIONS.map(a => (
                  <td key={a.id} className="text-center px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={!!perms[a.id]}
                      onChange={() => toggle(m.id, a.id)}
                      disabled={disabled}
                      className="w-4 h-4 accent-blue-600 cursor-pointer disabled:cursor-default"
                    />
                  </td>
                ))}
                <td className="text-center px-3 py-2.5">
                  <button
                    onClick={() => toggleAll(m.id)}
                    disabled={disabled}
                    className={`text-xs px-2 py-0.5 rounded font-medium transition-colors ${
                      allOn ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    } disabled:opacity-40 disabled:cursor-default`}
                  >
                    {allOn ? '✓ All' : 'All'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function RolesPage() {
  const qc = useQueryClient();
  const [showCreate,  setShowCreate]  = useState(false);
  const [editing,     setEditing]     = useState(null); 
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', permissions: emptyPerms() });

  const { data: res, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn:  rolesApi.list,
  });

  const roles     = res?.data?.roles     || [];
  const templates = res?.data?.templates || [];

  const createMutation = useMutation({
    mutationFn: (d) => rolesApi.create(d),
    onSuccess: () => {
      toast.success('Role created!');
      qc.invalidateQueries({ queryKey: ['roles'] });
      setShowCreate(false);
      setForm({ name: '', description: '', permissions: emptyPerms() });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => rolesApi.update(id, data),
    onSuccess: () => {
      toast.success('Role updated!');
      qc.invalidateQueries({ queryKey: ['roles'] });
      setEditing(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => rolesApi.remove(id),
    onSuccess: () => {
      toast.success('Role deleted.');
      qc.invalidateQueries({ queryKey: ['roles'] });
      setDeleteTarget(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const openCreate = (template = null) => {
    if (template) {
      setForm({ name: '', description: template.description, permissions: template.permissions });
    } else {
      setForm({ name: '', description: '', permissions: emptyPerms() });
    }
    setShowCreate(true);
  };

  const openEdit = (role) => {
    setEditing({
      ...role,
      editForm: {
        name:        role.name,
        description: role.description || '',
        permissions: role.permissions || emptyPerms(),
      },
    });
  };

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Control what each role can see and do"
        actions={<Button onClick={() => openCreate()}>+ New Role</Button>}
      />

      {}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
        <p className="text-sm font-semibold text-blue-900 mb-2">Quick-start templates</p>
        <div className="flex flex-wrap gap-2">
          {templates.map(t => (
            <button key={t.name} onClick={() => openCreate(t)}
              className="text-xs bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors font-medium">
              + {t.name}
            </button>
          ))}
        </div>
      </div>

      {}
      <div className="space-y-3">
        {roles.map(role => (
          <div key={role.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900">{role.name}</h3>
                  {role.isSystem && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">System</span>
                  )}
                </div>
                {role.description && <p className="text-sm text-gray-500 mt-0.5">{role.description}</p>}
                <p className="text-xs text-gray-400 mt-1">{role.userCount} user{role.userCount !== 1 ? 's' : ''} assigned</p>
              </div>
              {!role.isSystem && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(role)}>✏ Edit</Button>
                  <Button size="sm" variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setDeleteTarget(role)}>
                    Delete
                  </Button>
                </div>
              )}
            </div>

            {}
            <div className="flex flex-wrap gap-1.5">
              {MODULES.map(m => {
                const p = role.permissions?.[m.id] || {};
                const actions = ACTIONS.filter(a => p[a.id]).map(a => a.label);
                if (!actions.length) return null;
                return (
                  <span key={m.id}
                    className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-lg">
                    {m.icon} {m.label}: <span className="text-blue-600 font-medium">{actions.join(' · ')}</span>
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Role" size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} loading={createMutation.isPending}>
              Create Role
            </Button>
          </>
        }>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Role Name *" placeholder="e.g. HR Manager"
              value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
            <Input label="Description" placeholder="Brief description"
              value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Permissions</p>
            <PermissionMatrix
              value={form.permissions}
              onChange={p => setForm(f => ({...f, permissions: p}))}
            />
          </div>
        </div>
      </Modal>

      {}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit Role — ${editing?.name}`} size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              onClick={() => updateMutation.mutate({ id: editing.id, data: editing.editForm })}
              loading={updateMutation.isPending}>
              Save Changes
            </Button>
          </>
        }>
        {editing && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Role Name *"
                value={editing.editForm.name}
                onChange={e => setEditing(ed => ({...ed, editForm: {...ed.editForm, name: e.target.value}}))} />
              <Input label="Description"
                value={editing.editForm.description}
                onChange={e => setEditing(ed => ({...ed, editForm: {...ed.editForm, description: e.target.value}}))} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Permissions</p>
              <PermissionMatrix
                value={editing.editForm.permissions}
                onChange={p => setEditing(ed => ({...ed, editForm: {...ed.editForm, permissions: p}}))}
              />
            </div>
          </div>
        )}
      </Modal>

      {}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        loading={deleteMutation.isPending}
        title="Delete Role"
        message={`Delete the "${deleteTarget?.name}" role? This cannot be undone. Users with this role will lose access.`}
        confirmLabel="Delete Role"
      />
    </div>
  );
}

