// Mock tests for several payment handlers in payment.controller
const path = require('path');
const cpPath = path.resolve(__dirname, 'shared', 'utils', 'centralPrisma.js');

const mockTenantId = 'mock-tenant-uuid-ttl';

process.env.NODE_ENV = 'development';
process.env.SKIP_PAYMENT = 'true';

const mockCentral = {
  tenants: {
    findFirst: async ({ where }) => ({ id: mockTenantId, subdomain: where?.subdomain || 'mock' }),
    findUnique: async ({ where }) => ({ id: where?.id || mockTenantId, payout_config_enc: null, db_url: null }),
    update: async ({ where, data }) => ({ id: where.id, ...data })
  },
  invoice: {
    findUnique: async ({ where }) => ({ id: where.id, tenant_id: mockTenantId, invoice_no: 'INV-MOCK-001', total_paise: 10000, currency: 'INR', status: 'unpaid', tenant: { admin_name: 'A', admin_email: 'a@x' } }),
    update: async ({ where, data }) => ({ id: where.id, ...data }),
    findMany: async ({ where }) => [{ id: 'inv1', tenant_id: mockTenantId, total_paise: 10000, period_start: new Date(), tenant: { bank_accounts: [] }, breakdown: { employee: { first_name: 'John', last_name: 'Doe', bank_accounts: [] } } }]
  },
  tenant_pricing_config: {
    upsert: async ({ where, update, create }) => ({ ...create })
  },
  $transaction: async (arr) => {
    const results = [];
    for (const a of arr) {
      if (typeof a === 'function') results.push(await a());
      else if (a && typeof a === 'object' && a.then) results.push(await a);
      else results.push(a);
    }
    return results;
  },
  $queryRawUnsafe: async (q) => {
    // simple SQL parser for smoke
    if (q.toLowerCase().includes('select id, subdomain from tenants')) return [{ id: mockTenantId, subdomain: 'mock' }];
    if (q.toLowerCase().startsWith('insert into invoices')) return [{ id: 'inv-inserted', invoice_no: 'SMOKE' }];
    return [];
  }
};

require.cache[require.resolve(cpPath)] = { id: cpPath, filename: cpPath, loaded: true, exports: { centralPrisma: mockCentral } };

const controller = require('./modules/platform/payment.controller');

const makeRes = () => {
  let out = null;
  return {
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { return { json: (obj) => { out = { code, obj }; console.log('RESP', code, obj); return out; }, send: (b) => { out = { code, body: b }; console.log('RESP SEND', code, b && b.toString?.()); return out; } }; },
    json(obj) { out = { code: 200, obj }; console.log('RESP', 200, obj); return out; },
    send(b) { out = { code: 200, body: b }; console.log('RESP SEND', 200, b && b.toString?.()); return out; }
  };
};

(async () => {
  console.log('Test: createSubscriptionOrder (mock)');
  await controller.createSubscriptionOrder({ body: { planId: 'starter', period: 'monthly' }, headers: { 'x-tenant-subdomain': 'mock' }, user: {} }, makeRes());

  console.log('Test: verifySubscription (mock)');
  await controller.verifySubscription({ body: { planId: 'starter', period: 'monthly', mock: true }, headers: { 'x-tenant-subdomain': 'mock' }, user: {} }, makeRes());

  console.log('Test: initiatePayout (no config)');
  await controller.initiatePayout({ body: { runId: 'r1', employees: [{ id: 'e1' }] }, headers: { 'x-tenant-subdomain': 'mock' }, user: {} }, makeRes());

  console.log('Test: getBankTransferFile');
  await controller.getBankTransferFile({ params: { runId: 'run1' }, headers: { 'x-tenant-subdomain': 'mock' }, user: {} }, makeRes());

  console.log('Test: distributeSalaries');
  await controller.distributeSalaries({ body: { payrollRunId: 'p1', employees: [{ id: 'e1', amount_paise: 1000, name: 'X', ifsc: 'IFSC', account_no: '123' }] }, headers: { 'x-tenant-subdomain': 'mock' }, user: {} }, makeRes());

  console.log('Payment handlers test finished.');
})();
