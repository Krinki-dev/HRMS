const Razorpay = require('razorpay');
const crypto = require('crypto');
const { centralPrisma } = require('../../shared/utils/centralPrisma');
const axios = require('axios');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');
const logger = require('../../shared/utils/logger');
const { THEME } = require('../../shared/utils/uiConstants');
const { decrypt } = require('../../shared/utils/encryption');
const { Parser } = require('json2csv');
const billingEmailer = require('../../shared/utils/billingEmailer');
const plansService = require('./plans.service');
const billingLogger = require('../../shared/services/billingLogger');
const { verifyRazorpaySignature, isRazorpayPaymentForInvoice, verifyRazorpayWebhookSignature } = require('../../shared/utils/razorpayPaymentVerification');
const { matchesSubscriptionOrderSnapshot } = require('../../shared/utils/subscriptionPaymentVerification');
const { createPhonePePayment, getPhonePeOrderStatus, isPhonePeOrderPaid } = require('../../shared/utils/phonepeStandardCheckout');
const { withTenantRLS, withPlatformAdminRLS } = require('../../shared/utils/rlsContext');

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  // Only warn if not in test/dev mode or if we expect payments to work
  if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development')
    logger.warn(`${THEME.ICONS.WARNING} Razorpay keys are missing in environment variables.`);
}

const phonePeMerchantId = process.env.PHONEPE_MERCHANT_ID;
const phonePeSaltKey = process.env.PHONEPE_SALT_KEY;
const phonePeSaltIndex = process.env.PHONEPE_SALT_INDEX;
const phonePeBaseUrl = process.env.PHONEPE_BASE_URL || 'https://api-preprod.phonepe.com/apis/pg-sandbox';
if (!phonePeMerchantId || !phonePeSaltKey || !phonePeSaltIndex) {
  // Only warn if not in test/dev mode or if we expect payments to work
  if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development')
    logger.warn(`${THEME.ICONS.WARNING} PhonePe keys are missing in environment variables.`);
}

const jioPayMerchantId = process.env.JIOPAY_MERCHANT_ID;
const jioPaySalt = process.env.JIOPAY_SALT;
const jioPayBaseUrl = process.env.JIOPAY_BASE_URL || 'https://uat.jiopay.com/api/v1'; // Placeholder UAT URL

if (!jioPayMerchantId || !jioPaySalt) {
  if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development')
    logger.warn(`${THEME.ICONS.WARNING} JioPay keys are missing in environment variables.`);
}

function getRazorpay() {
  const rzpId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const rzpSecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  
  if (!rzpId || !rzpSecret) return null;
  try {
    return new Razorpay({ key_id: rzpId, key_secret: rzpSecret });
  } catch (err) {
    logger.warn(`${THEME.ICONS.WARNING} Razorpay client init failed: ${err.message}`);
    return null;
  }
}

// Helper: resolve tenant id from JWT, req.tenant, or X-Tenant-Subdomain header
async function resolveTenantId(req) {
  const jwtTenantId = req.user?.tenantId;
  if (jwtTenantId) return jwtTenantId;
  if (req.tenant?.id) return req.tenant.id;
  const subdomain = req.headers['x-tenant-subdomain'] || req.headers['x-tenant'];
  if (subdomain) {
    try {
      // No tenant is known yet (that's what we're resolving), so this runs under
      // the platform-admin RLS predicate — see shared/utils/rlsContext.js.
      const t = await withPlatformAdminRLS(centralPrisma, (tx) => tx.tenants.findFirst({ where: { subdomain } }));
      if (t) return t.id;
    } catch (err) {
      logger.warn(`${THEME.ICONS.WARNING} [resolveTenantId] centralPrisma lookup failed: ${err.message}`);
      // Fall through to allow other resolution methods or let caller handle missing tenant
    }
  }
  return null;
}

async function resolveTargetTenantId(req, requestedTenantId) {
  if (requestedTenantId && req.user?.is_platform_admin) return requestedTenantId;
  return resolveTenantId(req);
}

// Platform admins operate across all tenants; everyone else is scoped to their
// own tenant. Mirrors the `!req.user.is_platform_admin` checks already used
// throughout this file for app-level authorization.
function withBillingRLS(req, tenantId, fn) {
  if (req.user?.is_platform_admin) return withPlatformAdminRLS(centralPrisma, fn);
  return withTenantRLS(centralPrisma, tenantId, fn);
}

function normalizeRenewalMode(mode) {
  return mode === 'auto' ? 'auto' : 'manual';
}

function toBillingCycleLabel(months) {
  if (months === 12) return 'annual';
  if (months === 3) return 'quarterly';
  return 'monthly';
}

/**
 * Creates a Razorpay Order for an unpaid invoice.
 */
exports.createOrder = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const resolvedTenant = await resolveTenantId(req);
    const invoice = await withBillingRLS(req, resolvedTenant, (tx) => tx.invoices.findUnique({
      where: { id: invoiceId },
      include: { tenant: true }
    }));

    if (!invoice) return sendError(res, ERROR_CODES.NOT_FOUND, 'Invoice not found', 404);

    // Security: Ensure user belongs to the tenant or is a platform admin
    if (invoice.tenant_id !== resolvedTenant && !req.user.is_platform_admin) {
      return sendError(res, ERROR_CODES.FORBIDDEN, 'Unauthorized to pay this invoice', 403);
    }

    if (invoice.status === 'paid') return sendError(res, ERROR_CODES.VALIDATION, 'Invoice already paid', 400);

    const existingOrder = await withBillingRLS(req, invoice.tenant_id, (tx) => tx.payment_orders.findFirst({
      where: { invoice_id: invoice.id, tenant_id: invoice.tenant_id, gateway: 'razorpay', status: 'created' },
      orderBy: { created_at: 'desc' },
    }));
    if (existingOrder &&
        Number(existingOrder.amount_paise) === Number(invoice.total_paise) &&
        String(existingOrder.currency).toUpperCase() === String(invoice.currency).toUpperCase()) {
      return sendSuccess(res, {
        orderId: existingOrder.gateway_order_id,
        amount: existingOrder.amount_paise,
        currency: existingOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        companyName: 'Syntern HRMS',
        description: `Payment for ${invoice.invoice_no}`,
        prefill: { name: invoice.tenant.admin_name, email: invoice.tenant.admin_email },
      });
    }

    const options = {
      amount: invoice.total_paise,
      currency: invoice.currency,
      receipt: invoice.invoice_no,
      notes: {
        tenantId: invoice.tenant_id,
        invoiceId: invoice.id,
      }
    };

    const rp = getRazorpay();
    if (!rp) return sendError(res, ERROR_CODES.SERVER, 'Payment gateway misconfigured', 500);
    const order = await rp.orders.create(options);
    if (!order?.id || Number(order.amount) !== Number(invoice.total_paise) ||
        String(order.currency).toUpperCase() !== String(invoice.currency).toUpperCase()) {
      logger.error('[createOrder] Razorpay returned an order that does not match the invoice.');
      return sendError(res, ERROR_CODES.SERVER, 'Payment gateway returned an invalid order', 502);
    }

    try {
      await withBillingRLS(req, invoice.tenant_id, (tx) => tx.payment_orders.create({
        data: {
          tenant_id: invoice.tenant_id,
          invoice_id: invoice.id,
          gateway: 'razorpay',
          gateway_order_id: order.id,
          amount_paise: invoice.total_paise,
          currency: invoice.currency,
          status: 'created',
        },
      }));
    } catch (ledgerError) {
      // Concurrent checkout requests can both create a gateway order before
      // the partial unique index admits only one open ledger row. Recover the
      // winner rather than returning a misleading generic server error.
      if (ledgerError.code === 'P2002' || ledgerError.code === '23505') {
        const winner = await withBillingRLS(req, invoice.tenant_id, (tx) => tx.payment_orders.findFirst({
          where: { invoice_id: invoice.id, tenant_id: invoice.tenant_id, gateway: 'razorpay', status: 'created' },
          orderBy: { created_at: 'desc' },
        }));
        if (winner &&
            Number(winner.amount_paise) === Number(invoice.total_paise) &&
            String(winner.currency).toUpperCase() === String(invoice.currency).toUpperCase()) {
          return sendSuccess(res, {
            orderId: winner.gateway_order_id,
            amount: winner.amount_paise,
            currency: winner.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            companyName: 'Syntern HRMS',
            description: `Payment for ${invoice.invoice_no}`,
            prefill: { name: invoice.tenant.admin_name, email: invoice.tenant.admin_email },
          });
        }
      }
      throw ledgerError;
    }

    return sendSuccess(res, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      companyName: 'Syntern HRMS',
      description: `Payment for ${invoice.invoice_no}`,
      prefill: {
        name: invoice.tenant.admin_name,
        email: invoice.tenant.admin_email,
      }
    });
  } catch (error) {
    logger.error(`${THEME.ICONS.ERROR} [createOrder] Failed:`, error);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to create payment order', 500);
  }
};

/**
 * Verifies the Razorpay payment signature.
 */
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
      razorpayOrderId, razorpayPaymentId, razorpaySignature,
      invoiceId, mock
    } = req.body;
    const tenantId = await resolveTenantId(req);
    if (!tenantId) {
      logger.warn(`${THEME.ICONS.WARNING} [verifySubscription] Tenant could not be resolved from request`);
      return sendError(res, ERROR_CODES.VALIDATION, 'Tenant could not be resolved', 400);
    }

    const resolvedOrderId = razorpay_order_id || razorpayOrderId;
    const resolvedPaymentId = razorpay_payment_id || razorpayPaymentId;
    const resolvedSignature = razorpay_signature || razorpaySignature;

    const invoice = await withBillingRLS(req, tenantId, (tx) => tx.invoices.findUnique({ where: { id: invoiceId } }));
    if (!invoice) return sendError(res, ERROR_CODES.NOT_FOUND, 'Invoice not found', 404);
    if (invoice.tenant_id !== tenantId && !req.user.is_platform_admin) {
      return sendError(res, ERROR_CODES.FORBIDDEN, 'Unauthorized to verify this invoice', 403);
    }
    if (invoice.status === 'paid') return sendError(res, ERROR_CODES.VALIDATION, 'Invoice already paid', 400);

    if (mock) {
      return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Client-side mock payments are not accepted', 403);
    }
    const secret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
    if (!secret || !resolvedOrderId || !resolvedPaymentId || !resolvedSignature) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Payment verification details are incomplete or gateway is not configured', 400);
    }
    if (!verifyRazorpaySignature({
      orderId: resolvedOrderId,
      paymentId: resolvedPaymentId,
      signature: resolvedSignature,
      secret,
    })) {
      await billingLogger.logInvalidSignature({ gateway: 'razorpay', req });
      return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Invalid payment signature', 400);
    }

    const storedOrder = await withBillingRLS(req, tenantId, (tx) => tx.payment_orders.findFirst({
      where: {
        gateway_order_id: resolvedOrderId,
        invoice_id: invoice.id,
        tenant_id: invoice.tenant_id,
        gateway: 'razorpay',
        status: 'created',
      },
    }));
    if (!storedOrder || Number(storedOrder.amount_paise) !== Number(invoice.total_paise) ||
        String(storedOrder.currency).toUpperCase() !== String(invoice.currency).toUpperCase()) {
      return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Payment order is not registered for this invoice', 400);
    }

    const razorpay = getRazorpay();
    if (!razorpay) return sendError(res, ERROR_CODES.SERVER, 'Payment gateway misconfigured', 500);
    const [gatewayOrder, gatewayPayment] = await Promise.all([
      razorpay.orders.fetch(resolvedOrderId),
      razorpay.payments.fetch(resolvedPaymentId),
    ]);
    if (!isRazorpayPaymentForInvoice({ order: gatewayOrder, payment: gatewayPayment, invoice })) {
      return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Gateway payment does not match this invoice or is not captured', 400);
    }

    const paymentRecorded = await withBillingRLS(req, tenantId, async (tx) => {
      const invoiceUpdate = await tx.invoices.updateMany({
        where: { id: invoiceId, tenant_id: invoice.tenant_id, status: { not: 'paid' } },
        data: { status: 'paid', payment_id: resolvedPaymentId, updated_at: new Date() },
      });
      if (invoiceUpdate.count !== 1) return false;

      await tx.payment_orders.update({
        where: { id: storedOrder.id },
        data: {
          gateway_payment_id: resolvedPaymentId,
          status: 'captured',
          updated_at: new Date(),
        },
      });
      return true;
    });
    if (!paymentRecorded) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Invoice was already paid or changed during verification', 409);
    }

    return sendSuccess(res, null, "Payment successful and verified.");
  } catch (error) {
    logger.error(`${THEME.ICONS.ERROR} [verifyPayment] Failed:`, error);
    return sendError(res, ERROR_CODES.SERVER, 'Verification failed', 500);
  }
};

/**
 * Creates a PhonePe Order for an unpaid invoice.
 */
exports.createPhonePeOrder = async (_req, res) => {
  return sendError(res, ERROR_CODES.VALIDATION, 'PhonePe checkout is temporarily disabled until the current Standard Checkout v2 integration is configured and verified.', 503);
  /*
  try {
    const { invoiceId } = req.params;
    const tenantId = await resolveTenantId(req);

    const invoice = await withBillingRLS(req, tenantId, (tx) => tx.invoices.findUnique({
      where: { id: invoiceId },
      include: { tenant: true }
    }));

    if (!invoice) return sendError(res, ERROR_CODES.NOT_FOUND, 'Invoice not found', 404);
    if (invoice.tenant_id !== tenantId && !req.user.is_platform_admin) {
      return sendError(res, ERROR_CODES.FORBIDDEN, 'Unauthorized to pay this invoice', 403);
    }
    if (invoice.status === 'paid') return sendError(res, ERROR_CODES.VALIDATION, 'Invoice already paid', 400);

    const merchantTransactionId = `INV-${invoice.invoice_no}-${Date.now()}`;
    const payload = {
      merchantId: phonePeMerchantId,
      merchantTransactionId: merchantTransactionId,
      amount: invoice.total_paise, // Amount in paise
      currency: 'INR',
      redirectUrl: `${process.env.FRONTEND_URL}/payment-status?invoiceId=${invoice.id}&transactionId=${merchantTransactionId}`,
      redirectMode: 'POST',
      callbackUrl: `${process.env.BACKEND_URL}/api/v1/platform/subscribe/phonepe-webhook`,
      mobileNumber: invoice.tenant.admin_phone || '9999999999', // Fallback to a dummy number for testing
      paymentInstrument: {
        type: 'PAY_PAGE'
      },
      // Custom data to pass through webhook
      metadata: {
        invoiceId: invoice.id,
        tenantId: invoice.tenant_id,
        type: 'invoice_payment'
      }
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const xVerify = crypto.createHash('sha256').update(base64Payload + '/pg/v1/pay' + phonePeSaltKey).digest('hex') + '###' + phonePeSaltIndex;

    const response = await axios.post(`${phonePeBaseUrl}/pg/v1/pay`, {
      request: base64Payload
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify,
        'X-MERCHANT-ID': phonePeMerchantId
      }
    });

    if (response.data.success && response.data.data.instrumentResponse.redirectInfo.url) {
      return sendSuccess(res, {
        redirectUrl: response.data.data.instrumentResponse.redirectInfo.url,
        merchantTransactionId: merchantTransactionId
      }, 'PhonePe order created successfully.');
    } else {
      logger.error(`${THEME.ICONS.ERROR} [createPhonePeOrder] PhonePe API error:`, response.data);
      return sendError(res, ERROR_CODES.SERVER, response.data.message || 'Failed to create PhonePe order', 500);
    }
  } catch (error) {
    logger.error(`${THEME.ICONS.ERROR} [createPhonePeOrder] Failed:`, error);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to create PhonePe order', 500);
  }
};

  */

/**
 * Handles PhonePe Webhooks for asynchronous payment status updates.
 */
exports.handlePhonePeWebhook = async (_req, res) => {
  // Legacy v1 callback payloads are not allowed to mutate invoice/subscription
  // state. Authenticated checkout verification performs a server-side status
  // query and checks the persisted payment_orders record instead.
  return res.status(200).json({
    success: true,
    message: 'Callback acknowledged; payment state is confirmed through server-side order verification.',
  });
};

/**
 * Creates a JioPay Order for an unpaid invoice.
 */
exports.createJioPayOrder = async (_req, res) => {
  return res.status(503).json({
    success: false,
    code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
    message: 'JioPay checkout is disabled until the official merchant API contract and sandbox integration are verified.',
  });
};

exports.handleJioPayWebhook = async (_req, res) => {
  return res.status(503).json({
    success: false,
    code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
    message: 'JioPay callbacks are disabled until the official merchant callback authentication contract is implemented.',
  });
};

/**
 * VALIDATE BANK DETAILS
 * Checks if employees in a payroll run are missing bank information.
 */
exports.validateBankDetails = async (req, res) => {
  try {
    const { employeeIds } = req.body;
    const missing = [];

    // Query the tenant DB (req.db) for employee bank accounts
    const employees = await req.db.employee.findMany({
      where: { id: { in: employeeIds } },
      include: { bank_accounts: true }
    });

    employees.forEach(emp => {
      const bank = emp.bank_accounts?.[0];
      if (!bank?.account_number || !bank?.ifsc_code) {
        missing.push(`${emp.first_name} ${emp.last_name}`);
      }
    });

    return sendSuccess(res, { isValid: missing.length === 0, missing });
  } catch (error) {
    logger.error(`${THEME.ICONS.ERROR} [validateBankDetails] Failed:`, error);
    return sendError(res, ERROR_CODES.SERVER, 'Validation failed.', 500);
  }
};

/**
 * INITIATE INTEGRATED PAYOUT (RazorpayX / PhonePe)
 * Processes real-time bank transfers from tenant account to employees.
 */
exports.initiatePayout = async (_req, res) => {
  return sendError(res, ERROR_CODES.VALIDATION,
    'Automated salary payouts are not enabled. Use the manual bank-transfer export until a verified payout provider integration is released.', 503);
};

exports.getBankTransferFile = async (req, res) => {
  try {
    const { runId } = req.params;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // We pull from the invoices table which stores the generated payslip snapshots
    const tenantId = await resolveTenantId(req);
    const payslips = await withBillingRLS(req, tenantId, (tx) => tx.invoices.findMany({
      where: { tenant_id: tenantId, breakdown: { path: ['runId'], equals: runId } },
      include: { tenant: { include: { bank_accounts: true } } }
    }));

    // Format data for standard NEFT CSV
    const csvData = payslips.map(p => {
      const emp = p.breakdown?.employee || {};
      const bank = emp.bank_accounts?.[0] || {};
      return {
        'Transaction Type': 'N', // N for NEFT, R for RTGS
        'Beneficiary Name': `${emp.first_name} ${emp.last_name}`.trim(),
        'Beneficiary Account Number': bank.account_number || '',
        'Amount': (p.total_paise / 100).toFixed(2),
        'Beneficiary IFSC': bank.ifsc_code || '',
        'Sender Account Number': p.tenant?.bank_accounts?.[0]?.account_number || '',
        'Remarks': `Salary ${monthNames[p.period_start.getMonth()]} ${p.period_start.getFullYear()}`
      };
    });

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Bank_Transfer_Run_${runId}.csv`);
    return res.status(200).send(csv);

  } catch (error) {
    logger.error(`${THEME.ICONS.ERROR} [getBankTransferFile] Failed:`, error);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to generate bank file.', 500);
  }
};

/**
 * SALARY DISBURSEMENT (PAYOUTS)
 * This is for tenants to pay their employees.
 * Requires the tenant to have a RazorpayX account linked.
 */
exports.distributeSalaries = async (_req, res) => {
  return sendError(res, ERROR_CODES.VALIDATION,
    'Automated salary payouts are not enabled. No bank transfer has been initiated.', 503);
};

exports.handlePayoutWebhook = async (_req, res) => {
  return res.status(503).json({
    success: false,
    code: 'PAYOUTS_NOT_ENABLED',
    message: 'Automated payout callbacks are disabled until a verified payout provider integration is released.',
  });
};


/**
 * Razorpay-only paid subscription checkout. Prices are server-calculated;
 * renewal is manual and payment activation is idempotently ledger-backed.
 */
exports.createSubscriptionOrder = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || req.user?.company_id;
    if (!tenantId) return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Tenant session required', 401);
    const { planSlug, selectedAddons = [], billingMonths = 1, promoCode, method = 'razorpay', renewalMode = 'manual' } = req.body || {};
    if (method !== 'razorpay') return sendError(res, ERROR_CODES.VALIDATION, 'Only Razorpay is available at launch.', 503);
    if (renewalMode !== 'manual') return sendError(res, ERROR_CODES.VALIDATION, 'Only manual renewal is supported.', 400);
    if (!planSlug || !Array.isArray(selectedAddons) || selectedAddons.length > 20 || ![1, 6, 12, 24].includes(Number(billingMonths))) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Invalid plan selection.', 400);
    }
    const tenant = await withBillingRLS(req, tenantId, (tx) => tx.tenants.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, admin_name: true, admin_email: true, is_active: true }
    }));
    if (!tenant || !tenant.is_active) return sendError(res, ERROR_CODES.NOT_FOUND, 'Active company account not found.', 404);

    const plans = await plansService.getPlans();
    const plan = plans.find((item) => item.slug === planSlug);
    if (!plan || plan.slug === 'free' || plan.slug === 'custom') {
      return sendError(res, ERROR_CODES.VALIDATION, 'Choose an available paid plan. Custom plans require a quote.', 400);
    }
    const allowedAddons = new Set(plan.addon_modules || []);
    const addons = [...new Set(selectedAddons.map(String))].sort();
    if (addons.some((item) => !allowedAddons.has(item))) {
      return sendError(res, ERROR_CODES.VALIDATION, 'One or more selected add-ons are not available for this plan.', 400);
    }
    if (!req.db?.employee?.count) return sendError(res, ERROR_CODES.SERVER, 'Employee count could not be verified for pricing.', 503);
    const employeeCount = await req.db.employee.count();
    const price = await plansService.calculatePrice({
      planSlug, selectedAddons: addons, billingMonths: Number(billingMonths),
      employeeCount, promoCode: promoCode ? String(promoCode).trim() : undefined,
    });
    if (price.isCustomQuote || !Number.isSafeInteger(price.total_paise) || price.total_paise <= 0) {
      return sendError(res, ERROR_CODES.VALIDATION, 'This plan requires a custom quote or has an invalid amount.', 400);
    }
    const openOrder = await withBillingRLS(req, tenantId, (tx) => tx.payment_orders.findFirst({
      where: { tenant_id: tenantId, purpose: 'subscription', gateway: 'razorpay', status: 'created' },
      orderBy: { created_at: 'desc' },
    }));
    if (openOrder) return sendError(res, ERROR_CODES.VALIDATION, 'A subscription payment is already awaiting verification. Complete it or contact support before starting another.', 409);
    const rp = getRazorpay();
    if (!rp) return sendError(res, ERROR_CODES.SERVER, 'Razorpay is not configured.', 503);
    const receipt = ('SUB-' + tenantId.slice(0, 8) + '-' + Date.now()).slice(0, 40);
    const order = await rp.orders.create({
      amount: price.total_paise, currency: 'INR', receipt,
      notes: { tenantId, planSlug, purpose: 'subscription' },
    });
    if (!order?.id || Number(order.amount) !== price.total_paise || String(order.currency).toUpperCase() !== 'INR') {
      return sendError(res, ERROR_CODES.SERVER, 'Razorpay returned an invalid order.', 502);
    }
    const snapshot = {
      planSlug, selectedAddons: addons, billingMonths: Number(billingMonths),
      employeeCount, promoCode: promoCode ? String(promoCode).trim() : '',
      renewalMode: 'manual', price,
    };
    await withBillingRLS(req, tenantId, (tx) => tx.payment_orders.create({
      data: {
        tenant_id: tenantId, purpose: 'subscription', gateway: 'razorpay',
        gateway_order_id: order.id, amount_paise: price.total_paise,
        currency: 'INR', status: 'created', metadata: snapshot,
      },
    }));
    return sendSuccess(res, {
      orderId: order.id, amount: order.amount, currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID, companyName: tenant.name || 'Syntern HRMS',
      description: plan.name + ' subscription — ' + billingMonths + ' month(s)',
      prefill: { name: tenant.admin_name || '', email: tenant.admin_email || '' },
    }, 'Razorpay order created');
  } catch (error) {
    logger.error('[createSubscriptionOrder] Failed:', error);
    return sendError(res, ERROR_CODES.SERVER, 'Could not create subscription order. No payment has been confirmed.', 500);
  }
};

exports.verifySubscription = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || req.user?.company_id;
    if (!tenantId) return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Tenant session required', 401);
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
    const secret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
    if (!secret || !orderId || !paymentId || !signature) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Payment verification details are incomplete.', 400);
    }
    if (!verifyRazorpaySignature({ orderId, paymentId, signature, secret })) {
      await billingLogger.logInvalidSignature({ gateway: 'razorpay', req });
      return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Invalid Razorpay payment signature.', 400);
    }
    const stored = await withBillingRLS(req, tenantId, (tx) => tx.payment_orders.findFirst({
      where: { tenant_id: tenantId, purpose: 'subscription', gateway: 'razorpay', gateway_order_id: orderId },
    }));
    if (!stored) return sendError(res, ERROR_CODES.NOT_FOUND, 'Subscription order was not found for this company.', 404);
    if (stored.status === 'captured') {
      if (stored.gateway_payment_id === paymentId) return sendSuccess(res, { verified: true, alreadyProcessed: true }, 'Subscription payment already verified.');
      return sendError(res, ERROR_CODES.VALIDATION, 'This order has already been processed.', 409);
    }
    if (stored.status !== 'created') return sendError(res, ERROR_CODES.VALIDATION, 'This payment order is no longer payable.', 409);

    const snapshot = stored.metadata || {};
    const rp = getRazorpay();
    if (!rp) return sendError(res, ERROR_CODES.SERVER, 'Razorpay is not configured.', 503);
    const [gatewayOrder, gatewayPayment] = await Promise.all([rp.orders.fetch(orderId), rp.payments.fetch(paymentId)]);
    if (String(gatewayOrder.id) !== String(orderId) ||
        Number(gatewayOrder.amount) !== Number(stored.amount_paise) ||
        String(gatewayOrder.currency).toUpperCase() !== String(stored.currency).toUpperCase() ||
        String(gatewayPayment.order_id) !== String(orderId) ||
        Number(gatewayPayment.amount) !== Number(stored.amount_paise) ||
        String(gatewayPayment.currency).toUpperCase() !== String(stored.currency).toUpperCase() ||
        gatewayPayment.status !== 'captured' ||
        String(gatewayOrder.notes?.tenantId || '') !== String(tenantId) ||
        gatewayOrder.notes?.purpose !== 'subscription') {
      return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Captured payment does not match the registered subscription order.', 400);
    }
    if (!snapshot.planSlug || !Array.isArray(snapshot.selectedAddons) ||
        !Number.isInteger(Number(snapshot.billingMonths)) ||
        !Number.isSafeInteger(Number(snapshot.price?.total_paise)) ||
        Number(snapshot.price.total_paise) !== Number(stored.amount_paise) ||
        snapshot.renewalMode !== 'manual') {
      return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Stored subscription order snapshot is invalid.', 400);
    }
    const plan = (await plansService.getPlans()).find((item) => item.slug === snapshot.planSlug);
    if (!plan || !plan.is_active) return sendError(res, ERROR_CODES.VALIDATION, 'The selected plan is no longer available.', 409);

    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + Number(snapshot.billingMonths));
    await withBillingRLS(req, tenantId, async (tx) => {
      const claimed = await tx.payment_orders.updateMany({
        where: { id: stored.id, tenant_id: tenantId, status: 'created', gateway_payment_id: null },
        data: { gateway_payment_id: paymentId, status: 'captured', updated_at: new Date() },
      });
      if (claimed.count !== 1) throw new Error('SUBSCRIPTION_ORDER_ALREADY_PROCESSED');
      await tx.tenants.update({
        where: { id: tenantId },
        data: { plan: plan.slug, plan_expires_at: expiry },
      });
      const modules = [...new Set([...(plan.included_modules || []), ...(snapshot.selectedAddons || [])])];
      for (const moduleName of modules) {
        await tx.tenant_modules.upsert({
          where: { uq_tenant_module: { tenant_id: tenantId, module_name: moduleName } },
          update: { is_active: true, disabled_at: null, enabled_at: new Date() },
          create: { tenant_id: tenantId, module_name: moduleName, is_active: true },
        });
      }
    });
    return sendSuccess(res, { verified: true, plan: plan.slug, expiresAt: expiry }, 'Subscription payment verified and plan activated.');
  } catch (error) {
    if (error.message === 'SUBSCRIPTION_ORDER_ALREADY_PROCESSED') {
      return sendError(res, ERROR_CODES.VALIDATION, 'This subscription payment is already being processed.', 409);
    }
    logger.error('[verifySubscription] Failed:', error);
    return sendError(res, ERROR_CODES.SERVER, 'Payment could not be verified or activated. Contact support before retrying.', 500);
  }
};
