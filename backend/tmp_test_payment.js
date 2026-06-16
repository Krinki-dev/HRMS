// Mock test for payment.controller createOrder + verifyPayment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const path = require('path');
const cpPath = path.resolve(__dirname, 'shared', 'utils', 'centralPrisma.js');

// Build a mock centralPrisma
const mockInvoice = {
  id: 'inv-mock-1',
  tenant_id: 'mock-tenant-uuid-1234',
  invoice_no: 'INV-MOCK-202606',
  total_paise: 50000,
  currency: 'INR',
  status: 'unpaid',
  tenant: { admin_name: 'Test Admin', admin_email: 'admin@example.com' }
};

const mockCentral = {
  invoice: {
    findUnique: async ({ where, include }) => {
      if (where && where.id === mockInvoice.id) return mockInvoice;
      return null;
    },
    findFirst: async ({ where }) => {
      if (where && where.invoice_no === mockInvoice.invoice_no) return mockInvoice;
      return null;
    },
    update: async ({ where, data }) => ({ ...mockInvoice, ...data }),
  },
  tenants: {
    findFirst: async ({ where }) => {
      if (where && where.subdomain) return { id: 'mock-tenant-uuid-1234', subdomain: where.subdomain };
      return null;
    },
    findUnique: async ({ where }) => ({ id: where.id, subdomain: 'mock' })
  }
};

require.cache[require.resolve(cpPath)] = {
  id: cpPath,
  filename: cpPath,
  loaded: true,
  exports: { centralPrisma: mockCentral }
};

const paymentController = require('./modules/platform/payment.controller');

// Mock req/res for createOrder
const reqCreate = {
  params: { invoiceId: mockInvoice.id },
  headers: { 'x-tenant-subdomain': 'mock' },
  user: { tenantId: null, is_platform_admin: false }
};

let captured = null;
const res = {
  status(code) { return { json(obj) { console.log('CREATE_ORDER_RESPONSE', code, JSON.stringify(obj)); captured = { code, obj }; return captured; } }; },
};

(async () => {
  console.log('Running createOrder mock test...');
  await paymentController.createOrder(reqCreate, res);

  // Now test verifyPayment with mock flag
  const reqVerify = {
    body: { invoiceId: mockInvoice.id, mock: true, razorpayOrderId: `MOCK-${mockInvoice.id}`, razorpayPaymentId: `MOCK-PAY-${mockInvoice.id}`, razorpaySignature: 'MOCK' },
    headers: { 'x-tenant-subdomain': 'mock' },
    user: { tenantId: null, is_platform_admin: false }
  };

  const resVerify = {
    status(code) { return { json(obj) { console.log('VERIFY_RESPONSE', code, JSON.stringify(obj)); return { code, obj }; } }; }
  };

  console.log('Running verifyPayment mock test...');
  await paymentController.verifyPayment(reqVerify, resVerify);

  console.log('Payment mock tests completed.');
})();
