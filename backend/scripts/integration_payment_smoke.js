const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { centralPrisma } = require('../shared/utils/centralPrisma');

async function run() {
  try {
    // 1) pick an active tenant via raw SQL to avoid Prisma model/schema mismatch
    const tenants = await centralPrisma.$queryRawUnsafe("SELECT id, subdomain FROM tenants WHERE is_active = true AND deleted_at IS NULL LIMIT 1");
    const tenant = tenants && tenants[0];
    if (!tenant) {
      console.error('No active tenant found in central DB');
      return process.exit(2);
    }

    // 2) create invoice via raw SQL (avoid Prisma model mismatch)
    const date = new Date();
    const invoiceNo = `SMOKE-${tenant.subdomain || 'T'}-${Date.now()}`;
    const periodStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
    const periodEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();
    const dueDate = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const breakdownJson = JSON.stringify({});

    const insertSql = `INSERT INTO invoices (tenant_id, invoice_no, period_start, period_end, due_date, base_amount_paise, module_amount_paise, excess_amount_paise, discount_amount_paise, total_paise, breakdown, status) VALUES ('${tenant.id}', '${invoiceNo}', '${periodStart}', '${periodEnd}', '${dueDate}', 10000, 0, 0, 0, 10000, '${breakdownJson}'::jsonb, 'unpaid') RETURNING id, tenant_id, invoice_no, total_paise, status`;
    const inserted = await centralPrisma.$queryRawUnsafe(insertSql);
    const invoice = inserted && inserted[0];
    if (!invoice) {
      console.error('Failed to insert invoice');
      return process.exit(3);
    }
    console.log('Created invoice', invoice.id, invoice.invoice_no);

    // 3) generate JWT for a tenant admin user
    const userPayload = { id: 'smoke-user-' + Date.now(), tenantId: tenant.id, role: 'Admin', email: 'smoke@example.com' };
    const token = jwt.sign(userPayload, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

    // 4) request create order (mocked)
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5002}`;

    console.log('Requesting createOrder for invoice', invoice.id);
    const orderResp = await axios.post(
      `${backendUrl}/api/v1/platform/subscribe/invoices/${invoice.id}/pay`,
      {},
      { headers: { Authorization: `Bearer ${token}`, 'X-Tenant-Subdomain': tenant.subdomain, 'X-Requested-With': 'XMLHttpRequest' }, timeout: 15000 }
    ).catch(e => ({ error: e.response?.data || e.message }));

    console.log('createOrder response:', orderResp.data || orderResp.error || orderResp);

    // 5) verify payment (mock)
    console.log('Calling verifyPayment (mock)');
    const verifyBody = { invoiceId: invoice.id, mock: true, razorpayOrderId: `MOCK-${invoice.id}`, razorpayPaymentId: `MOCK-PAY-${invoice.id}`, razorpaySignature: 'MOCK' };
    const verifyResp = await axios.post(
      `${backendUrl}/api/v1/platform/subscribe/invoices/${invoice.id}/verify`,
      verifyBody,
      { headers: { Authorization: `Bearer ${token}`, 'X-Tenant-Subdomain': tenant.subdomain, 'X-Requested-With': 'XMLHttpRequest' }, timeout: 15000 }
    ).catch(e => ({ error: e.response?.data || e.message }));

    console.log('verify response:', verifyResp.data || verifyResp.error || verifyResp);

    // 6) fetch updated invoice
    const check = await centralPrisma.$queryRawUnsafe(`SELECT id, status, payment_id FROM invoices WHERE id = '${invoice.id}'`);
    const updated = check && check[0];
    console.log('Invoice after verify:', updated?.id, updated?.status, updated?.payment_id);

  } catch (e) {
    console.error('Smoke test failed:', e);
  } finally {
    await centralPrisma.$disconnect();
  }
}

run();
