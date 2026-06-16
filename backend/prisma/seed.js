require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt           = require('bcryptjs');
const { cloneSchema, appendSchemaToUrl } = require('../shared/utils/dbSchema');

// ── Env guard ─────────────────────────────────────────────────────
const TENANT_URL = process.env.DEV_TENANT_DATABASE_URL;
if (!TENANT_URL || TENANT_URL.includes('USER:PASSWORD')) {
  console.error('\\n❌  Setup required:');
  console.error('    DEV_TENANT_DATABASE_URL is not set or still has placeholder values.');
  console.error('    1. Copy .env.example → .env');
  console.error('    2. Set DEV_TENANT_DATABASE_URL to your PostgreSQL connection string');
  console.error('    3. Run: npx prisma generate');
  console.error('    4. Run: npx prisma db push');
  console.error('    5. Run: npm run seed\\n');
  process.exit(1);
}

const TEMPLATE_SCHEMA = 'public';
const SEED_SCHEMA     = 'tenant_hrms';
const adminUserId     = '550e8400-e29b-41d4-a716-446655440000'; // fixed UUID for admin user

// basePrisma uses the default URL only for the initial connection check
const basePrisma = new PrismaClient();
let prisma; // set after schema clone

// ================================================================
// Permission sets
// ================================================================
const ALL_PERMISSIONS = {
  employees:    { view: true, create: true, edit: true, delete: true, export: true, unmask: true },
  attendance:   { view: true, create: true, edit: true, delete: true, export: true, approve: true },
  leave:        { view: true, create: true, edit: true, delete: true, approve: true, export: true },
  payroll:      { view: true, create: true, edit: true, delete: true, export: true, run: true },
  compliance:   { view: true, create: true, edit: true, delete: true, export: true },
  recruitment:  { view: true, create: true, edit: true, delete: true },
  performance:  { view: true, create: true, edit: true, delete: true },
  training:     { view: true, create: true, edit: true, delete: true },
  assets:       { view: true, create: true, edit: true, delete: true },
  expenses:     { view: true, create: true, edit: true, delete: true, approve: true },
  reports:      { view: true, export: true },
  automation:   { view: true, create: true, edit: true },
  communication:{ view: true, create: true, edit: true, delete: true },
  settings:     { view: true, create: true, edit: true, delete: true },
  audit:        { view: true },
};

const HR_ADMIN_PERMISSIONS = {
  employees:    { view: true, create: true, edit: true, delete: false, export: true, unmask: true },
  attendance:   { view: true, create: true, edit: true, delete: false, export: true, approve: true },
  leave:        { view: true, create: true, edit: true, delete: false, approve: true, export: true },
  payroll:      { view: true, create: true, edit: true, delete: false, export: true, run: true },
  compliance:   { view: true, create: true, edit: true, delete: false, export: true },
  recruitment:  { view: true, create: true, edit: true, delete: true },
  performance:  { view: true, create: true, edit: true, delete: false },
  training:     { view: true, create: true, edit: true, delete: false },
  assets:       { view: true, create: true, edit: true, delete: false },
  expenses:     { view: true, create: true, edit: true, delete: false, approve: true },
  reports:      { view: true, export: true },
  automation:   { view: true, create: true, edit: false },
  communication:{ view: true, create: true, edit: true, delete: false },
  settings:     { view: false, create: false, edit: false, delete: false },
  audit:        { view: false },
};

const MANAGER_PERMISSIONS = {
  employees:    { view: true, create: false, edit: false, delete: false, export: false, unmask: false },
  attendance:   { view: true, create: false, edit: false, delete: false, export: false, approve: true },
  leave:        { view: true, create: true,  edit: false, delete: false, approve: true,  export: false },
  payroll:      { view: false },
  compliance:   { view: false },
  recruitment:  { view: false },
  performance:  { view: true, create: true, edit: true, delete: false },
  training:     { view: true, create: false, edit: false, delete: false },
  assets:       { view: true, create: false, edit: false, delete: false },
  expenses:     { view: true, create: false, edit: false, delete: false, approve: true },
  reports:      { view: true, export: false },
  automation:   { view: false },
  communication:{ view: true, create: false },
  settings:     { view: false },
  audit:        { view: false },
};

const EMPLOYEE_PERMISSIONS = {
  employees:    { view: false },
  attendance:   { view: true,  create: false, edit: false, delete: false },
  leave:        { view: true,  create: true,  edit: false, delete: false, approve: false },
  payroll:      { view: true,  create: false, edit: false, delete: false },
  compliance:   { view: false },
  recruitment:  { view: false },
  performance:  { view: true,  create: true, edit: true, delete: false },
  training:     { view: true,  create: false },
  assets:       { view: true,  create: false },
  expenses:     { view: true,  create: true, edit: false, delete: false, approve: false },
  reports:      { view: false },
  automation:   { view: false },
  communication:{ view: true,  create: false },
  settings:     { view: false },
  audit:        { view: false },
};

const ACCOUNTANT_PERMISSIONS = {
  employees:    { view: true,  create: false, edit: false, delete: false, export: true },
  attendance:   { view: true,  create: false, edit: false, delete: false, export: true },
  leave:        { view: true,  create: false, edit: false, delete: false, export: true },
  payroll:      { view: true,  create: true,  edit: true,  delete: false, export: true, run: true },
  compliance:   { view: true,  create: true,  edit: true,  delete: false, export: true },
  recruitment:  { view: false },
  performance:  { view: false },
  training:     { view: false },
  assets:       { view: false },
  expenses:     { view: true,  create: false, edit: false, delete: false, approve: true },
  reports:      { view: true,  export: true },
  automation:   { view: false },
  communication:{ view: false },
  settings:     { view: false },
  audit:        { view: false },
};

// ================================================================
// Helpers
// ================================================================
function p(perms) { return JSON.stringify(perms); }

// ================================================================
// Helpers
// ================================================================
async function ensureTenantColumns(prismaClient) {
  const requiredColumns = [
    { table: 'companies', column: 'sitemap_url', type: 'text' },
  ];

  for (const { table, column, type } of requiredColumns) {
    const columns = await prismaClient.$queryRawUnsafe(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = '${table}'
        AND column_name = '${column}'
    `);

    if (!Array.isArray(columns) || columns.length === 0) {
      await prismaClient.$executeRawUnsafe(`
        ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}" ${type}
      `);
      console.log(`\u2705 Added missing tenant column: ${table}.${column}`);
    }
  }
}

// ================================================================
// Main
// ================================================================
async function main() {
  console.log('\\n\\u{1F331} Syntern HRMS \\u2014 Database Seed');
  console.log('='.repeat(40));
  console.log(`   DB: ${TENANT_URL.replace(/:[^@]+@/, ':***@')}\\n`);

  // ── 1. Basic connectivity check ───────────────────────────────
  try {
    await basePrisma.$queryRaw`SELECT 1`;
  } catch (err) {
    console.error('\\u274C  Cannot connect to database:', err.message);
    console.error('    Check DEV_TENANT_DATABASE_URL in your .env file.');
    process.exit(1);
  }

  // ── 2. Central DB: upsert tenant + platform admin index ───────
  // is_platform_admin lives ONLY in central_user_index.
  // The auth middleware fetches it live from here on every request —
  // it is never stored in the tenant users table or embedded in JWTs.
  const centralUrl = process.env.CENTRAL_DATABASE_URL;
  if (centralUrl) {
    const centralDb = new PrismaClient({ datasources: { db: { url: centralUrl } } });
    try {
      // 2a. Upsert the Syntern platform tenant row
      const existing = await centralDb.$queryRaw`
        SELECT id FROM tenants
        WHERE subdomain = 'hrms' AND deleted_at IS NULL
        LIMIT 1
      `;

      let hrmsTenantId;
      if (existing.length === 0) {
        const rows = await centralDb.$queryRaw`
          INSERT INTO tenants
            (name, subdomain, plan, max_employees, is_setup_complete,
             db_mode, admin_email, admin_name, schema_name)
          VALUES
            ('Syntern India Pvt Ltd.', 'hrms', 'enterprise', 999999, true,
             'cloud', 'hello@syntern.in', 'Super Admin', ${SEED_SCHEMA})
          RETURNING id
        `;
        hrmsTenantId = rows[0].id;
        console.log('\\u2705 Central: Syntern India Pvt Ltd tenant created');
      } else {
        hrmsTenantId = existing[0].id;
        // Keep schema_name in sync with the seed target
        await centralDb.$executeRaw`
          UPDATE tenants
          SET schema_name = ${SEED_SCHEMA}
          WHERE id = ${hrmsTenantId}::uuid
        `;
        console.log('\\u2705 Central: Syntern India Pvt Ltd tenant found (schema_name synced)');
      }

      // 2b. Upsert central_user_index — single source of truth for is_platform_admin
      await centralDb.$executeRaw`
        INSERT INTO central_user_index
          (id, email, subdomain, company_id, user_id, is_active, is_platform_admin)
        VALUES
          (gen_random_uuid(), 'hello@syntern.in', 'hrms',
           ${hrmsTenantId}::uuid, ${adminUserId}::uuid, true, true)
        ON CONFLICT (email, company_id)
          DO UPDATE SET
            is_platform_admin = true,
            user_id           = ${adminUserId}::uuid,
            is_active         = true
      `;
      console.log('\\u2705 Central: platform admin index upserted (is_platform_admin = true)');

    } catch (err) {
      console.warn('\\u26A0\\uFE0F  Central DB seed skipped:', err.message);
    } finally {
      await centralDb.$disconnect();
    }
  } else {
    console.warn('\\u26A0\\uFE0F  CENTRAL_DATABASE_URL not set — skipping central DB seed');
  }

  // ── 3. Clone _template → tenant_hrms ───────────────────────
  console.log(`\\n   Template schema : ${TEMPLATE_SCHEMA}`);
  console.log(`   Target schema   : ${SEED_SCHEMA}`);
  await cloneSchema(TENANT_URL, TEMPLATE_SCHEMA, SEED_SCHEMA);
  console.log('\\u2705 Schema cloned');

  const tenantUrl = appendSchemaToUrl(TENANT_URL, SEED_SCHEMA);
  prisma = new PrismaClient({ datasources: { db: { url: tenantUrl } } });

  // Verify tables exist
  await ensureTenantColumns(prisma);
  try {
    await prisma.$queryRaw`SELECT id FROM companies LIMIT 1`;
  } catch (err) {
    if (err.message?.includes('does not exist') || err.code === 'P2021') {
      console.error('\\n\\u274C  Tables not found in tenant schema.');
      console.error('    Run: npx prisma db push  then retry.\\n');
      process.exit(1);
    }
  }

  // ── 4. Company ────────────────────────────────────────────────
  const company = await prisma.companies.upsert({
    where:  { id: 'company-001' },
    update: { updated_at: new Date() },
    create: {
      id:                   '',
      name:                 'Syntern India Pvt Ltd',
      legal_name:           'Syntern India Private Limited',
      city:                 'Delhi',
      state:                'Delhi',
      country:              'India',
      email:                'hello@syntern.in',
      financial_year_start: 4,
      working_days_month:   26,
      overtime_threshold:   8,
    },
  });
  console.log('\\u2705 Company:', company.name);

  // ── 5. Departments ────────────────────────────────────────────
  const deptNames = ['HR', 'Finance', 'Operations', 'IT', 'Admin', 'Sales', 'Management'];
  for (const name of deptNames) {
    await prisma.departments.upsert({
      where:  { id: `dept-${name.toLowerCase()}-001` },
      update: {},
      create: {
        id:         `dept-${name.toLowerCase()}-001`,
        company_id: company.id,
        name,
        code:       name.slice(0, 3).toUpperCase(),
        is_active:  true,
      },
    });
  }
  console.log('\\u2705 Departments:', deptNames.join(', '));

  // ── 6. Designations ───────────────────────────────────────────
  const desigs = [
    { name: 'Director',         level: 6 },
    { name: 'Manager',          level: 4 },
    { name: 'Senior Executive', level: 3 },
    { name: 'Executive',        level: 2 },
    { name: 'Associate',        level: 1 },
    { name: 'Intern',           level: 0 },
  ];
  for (const d of desigs) {
    const slug = d.name.toLowerCase().replace(/ /g, '-');
    await prisma.designations.upsert({
      where:  { id: `desig-${slug}-001` },
      update: {},
      create: { id: `desig-${slug}-001`, company_id: company.id, name: d.name, level: d.level, is_active: true },
    });
  }
  console.log('\\u2705 Designations: 6 created');

  // ── 7. Shifts ─────────────────────────────────────────────────
  const shifts = [
    { id: 'shift-general-001', name: 'General', start: '09:00', end: '18:00', total: 9 },
    { id: 'shift-morning-001', name: 'Morning', start: '06:00', end: '14:00', total: 8 },
    { id: 'shift-evening-001', name: 'Evening', start: '14:00', end: '22:00', total: 8 },
    { id: 'shift-night-001',   name: 'Night',   start: '22:00', end: '06:00', total: 8 },
  ];
  for (const s of shifts) {
    await prisma.shifts.upsert({
      where:  { id: s.id },
      update: {},
      create: {
        id: s.id, company_id: company.id, name: s.name,
        start_time: s.start, end_time: s.end, total_hours: s.total,
        late_grace_mins: 15, early_leave_mins: 15, week_offs: '[0,6]', is_active: true,
      },
    });
  }
  console.log('\\u2705 Shifts: General, Morning, Evening, Night');

  // ── 8. Leave Types ────────────────────────────────────────────
  const leaveTypes = [
    { code: 'PL',  name: 'Privilege Leave',        accrual: 1.25, carry: true,  max: 30,  encash: true  },
    { code: 'CL',  name: 'Casual Leave',            accrual: 1,    carry: false, max: 12,  encash: false },
    { code: 'SL',  name: 'Sick Leave',              accrual: 0.83, carry: false, max: 10,  encash: false },
    { code: 'ML',  name: 'Maternity Leave',         accrual: 0,    carry: false, max: 180, oneTime: 180, gender: 'female' },
    { code: 'PAL', name: 'Paternity Leave',         accrual: 0,    carry: false, max: 5,   oneTime: 5,   gender: 'male'   },
    { code: 'LOP', name: 'Loss of Pay',             accrual: 0,    carry: false, max: 999, isPaid: false },
    { code: 'CO',  name: 'Comp Off',                accrual: 0,    carry: false, max: 30  },
    { code: 'BL',  name: 'Bereavement Leave',       accrual: 0,    carry: false, max: 5,   oneTime: 5   },
    { code: 'OL',  name: 'Optional/Festival Leave', accrual: 0,    carry: false, max: 2,   oneTime: 2   },
    { code: 'WFH', name: 'Work from Home',          accrual: 4,    carry: false, max: 48  },
  ];
  for (const lt of leaveTypes) {
    await prisma.leave_types.upsert({
      where:  { id: `lt-${lt.code.toLowerCase()}-001` },
      update: {},
      create: {
        id:                `lt-${lt.code.toLowerCase()}-001`,
        company_id:        company.id,
        code:              lt.code,
        name:              lt.name,
        is_paid:           lt.isPaid !== false,
        accrual_type:      lt.oneTime ? 'one_time' : 'monthly',
        accrual_days:      lt.oneTime || lt.accrual,
        max_balance:       lt.max,
        carry_forward:     lt.carry || false,
        max_carry_forward: lt.carry ? 30 : null,
        encashable:        lt.encash || false,
        gender_specific:   lt.gender || 'all',
        half_day_allowed:  true,
        is_active:         true,
      },
    });
  }
  console.log('\\u2705 Leave types: PL, CL, SL, ML, PAL, LOP, CO, BL, OL, WFH');

  // ── 9. Roles ──────────────────────────────────────────────────
  const roles = [
    { id: 'role-superadmin-001', name: 'Super Admin', perms: ALL_PERMISSIONS,        system: true },
    { id: 'role-hradmin-001',    name: 'HR Admin',    perms: HR_ADMIN_PERMISSIONS,   system: true },
    { id: 'role-hrmanager-001',  name: 'HR Manager',  perms: HR_ADMIN_PERMISSIONS,   system: true },
    { id: 'role-manager-001',    name: 'Manager',     perms: MANAGER_PERMISSIONS,    system: true },
    { id: 'role-employee-001',   name: 'Employee',    perms: EMPLOYEE_PERMISSIONS,   system: true },
    { id: 'role-accountant-001', name: 'Accountant',  perms: ACCOUNTANT_PERMISSIONS, system: true },
  ];
  for (const r of roles) {
    await prisma.roles.upsert({
      where:  { id: r.id },
      update: { permissions: p(r.perms) },
      create: { id: r.id, company_id: company.id, name: r.name, permissions: p(r.perms), is_system: r.system },
    });
  }
  console.log('\\u2705 Roles: Super Admin, HR Admin, HR Manager, Manager, Employee, Accountant');

  // ── 10. Admin user (tenant DB) ────────────────────────────────
  // IMPORTANT: is_platform_admin is intentionally NOT set on this record.
  // It is stored exclusively in central_user_index (step 2b above) and is
  // fetched live by the auth middleware on every authenticated request.
  // Duplicating it here would create a stale, spoofable second source of truth.
  const passwordHash = await bcrypt.hash('Admin@1234', 12);
  await prisma.users.upsert({
    where:  { id: adminUserId },
    update: { password_hash: passwordHash },
    create: {
      id:             adminUserId,
      company_id:     company.id,
      role_id:        'role-superadmin-001',
      email:          'hello@syntern.in',
      password_hash:  passwordHash,
      is_active:      true,
      is_first_login: false,
    },
  });
  console.log('\\u2705 Admin user: hello@syntern.in / Admin@1234');

  // ── Done ──────────────────────────────────────────────────────
  console.log('\\n' + '='.repeat(40));
  console.log('\\u{1F389} Seed complete!\\n');
  console.log('   \\u250C\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2510');
  console.log('   \\u2502  Login Credentials              \\u2502');
  console.log('   \\u2502  URL:      http://www.syntern.in \\u2502');
  console.log('   \\u2502  Email:    hello@syntern.in      \\u2502');
  console.log('   \\u2502  Password: Admin@1234            \\u2502');
  console.log('   \\u2514\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2518');
  console.log('\\n   Next: npm run dev\\n');
}

main()
  .catch((e) => {
    console.error('\\n\\u274C Seed failed:', e.message);
    if (e.code === 'P2021') {
      console.error('\\n   Tables do not exist. Run: npx prisma db push  then retry.\\n');
    }
    process.exit(1);
  })
  .finally(async () => {
    await basePrisma.$disconnect();
    if (prisma) await prisma.$disconnect();
  });

