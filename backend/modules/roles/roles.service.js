const ALL_MODULES = [
  'employees','attendance','leave','payroll','compliance',
  'recruitment','performance','training','assets','expenses',
  'reports','settings',
];

const ALL_ACTIONS = ['view','create','edit','delete','export','approve'];

const fullAccess = () => Object.fromEntries(
  ALL_MODULES.map(m => [m, Object.fromEntries(ALL_ACTIONS.map(a => [a, true]))])
);

const readOnly = () => Object.fromEntries(
  ALL_MODULES.map(m => [m, { view: true, create: false, edit: false, delete: false, export: false, approve: false }])
);

const safeJSON = (str, fb = {}) => {
  if (!str) return fb;
  if (typeof str === 'object') return str;
  try { return JSON.parse(str); } catch { return fb; }
};

const rolesService = {

  list: async (db, companyId) => {
    const roles = await db.roles.findMany({
      where: {
        deleted_at: null,
        OR: [{ company_id: companyId }, { is_system: true }],
      },
      orderBy: { created_at: 'asc' },
      include: { _count: { select: { users: true } } },
    });

    return roles.map(r => ({
      id:          r.id,
      name:        r.name,
      description: r.description,
      isSystem:    r.is_system,
      userCount:   r._count.users,
      permissions: safeJSON(r.permissions),
    }));
  },

  create: async (db, companyId, data) => {
    if (!data.name?.trim()) throw new Error('NAME_REQUIRED');

    const exists = await db.roles.findFirst({
      where: { company_id: companyId, name: data.name.trim(), deleted_at: null },
    });
    if (exists) throw new Error('DUPLICATE_NAME');

    const permissions = data.permissions || {};

    return db.roles.create({
      data: {
        company_id:  companyId,
        name:        data.name.trim(),
        description: data.description || null,
        permissions: JSON.stringify(permissions),
        is_system:   false,
      },
    });
  },

  update: async (db, companyId, id, data) => {
    const role = await db.roles.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
    });
    if (!role) throw new Error('NOT_FOUND');
    if (role.is_system) throw new Error('SYSTEM_ROLE');

    return db.roles.update({
      where: { id },
      data: {
        name:        data.name        || role.name,
        description: data.description ?? role.description,
        permissions: data.permissions ? JSON.stringify(data.permissions) : role.permissions,
      },
    });
  },

  remove: async (db, companyId, id) => {
    const role = await db.roles.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
      include: { _count: { select: { users: true } } },
    });
    if (!role) throw new Error('NOT_FOUND');
    if (role.is_system) throw new Error('SYSTEM_ROLE');
    if (role._count.users > 0) throw new Error('ROLE_IN_USE');

    return db.roles.update({ where: { id }, data: { deleted_at: new Date() } });
  },

  assignRole: async (db, companyId, userId, roleId) => {
    
    const role = await db.roles.findFirst({
      where: { id: roleId, deleted_at: null, OR: [{ company_id: companyId }, { is_system: true }] },
    });
    if (!role) throw new Error('ROLE_NOT_FOUND');

    const user = await db.users.findFirst({
      where: { id: userId, company_id: companyId, deleted_at: null },
    });
    if (!user) throw new Error('USER_NOT_FOUND');

    return db.users.update({ where: { id: userId }, data: { role_id: roleId } });
  },

  getTemplates: () => [
    {
      name: 'Super Admin',
      description: 'Full access to everything',
      permissions: fullAccess(),
    },
    {
      name: 'HR Admin',
      description: 'Full HR access — employees, attendance, leave, payroll, compliance',
      permissions: Object.fromEntries(ALL_MODULES.map(m => [m, {
        view:   true,
        create: ['employees','attendance','leave','payroll','compliance','recruitment','training'].includes(m),
        edit:   ['employees','attendance','leave','payroll','compliance','recruitment','training'].includes(m),
        delete: ['employees','attendance','leave'].includes(m),
        export: ['employees','payroll','compliance','reports'].includes(m),
        approve: ['leave','attendance','expenses'].includes(m),
      }])),
    },
    {
      name: 'Manager',
      description: 'View employees, approve leave & attendance for team',
      permissions: Object.fromEntries(ALL_MODULES.map(m => [m, {
        view:    ['employees','attendance','leave','payroll','performance','training','expenses'].includes(m),
        create:  ['attendance','performance'].includes(m),
        edit:    ['attendance','performance'].includes(m),
        delete:  false,
        export:  ['reports'].includes(m),
        approve: ['leave','attendance','expenses'].includes(m),
      }])),
    },
    {
      name: 'Employee',
      description: 'Self-service only — own records',
      permissions: Object.fromEntries(ALL_MODULES.map(m => [m, {
        view:    ['attendance','leave','payroll','training','expenses','assets'].includes(m),
        create:  ['leave','expenses'].includes(m),
        edit:    false,
        delete:  false,
        export:  ['payroll'].includes(m),
        approve: false,
      }])),
    },
    {
      name: 'Accountant',
      description: 'Payroll and compliance view + export',
      permissions: Object.fromEntries(ALL_MODULES.map(m => [m, {
        view:    ['payroll','compliance','expenses','reports'].includes(m),
        create:  ['payroll'].includes(m),
        edit:    ['payroll'].includes(m),
        delete:  false,
        export:  ['payroll','compliance','reports','expenses'].includes(m),
        approve: ['expenses'].includes(m),
      }])),
    },
    {
      name: 'Recruiter',
      description: 'Recruitment module only',
      permissions: Object.fromEntries(ALL_MODULES.map(m => [m, {
        view:    ['employees','recruitment'].includes(m),
        create:  ['recruitment'].includes(m),
        edit:    ['recruitment'].includes(m),
        delete:  ['recruitment'].includes(m),
        export:  ['recruitment'].includes(m),
        approve: false,
      }])),
    },
  ],
};

module.exports = rolesService;

