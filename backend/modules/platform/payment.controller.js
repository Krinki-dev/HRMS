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
      return sendError(res, ERROR_CODES.CONFLICT, 'Invoice was already paid or changed during verification', 409);
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
exports.initiatePayout = async (req, res) => {
  try {
    const { runId, employees } = req.body; 
    const tenantId = await resolveTenantId(req);

    const tenant = await withBillingRLS(req, tenantId, (tx) => tx.tenants.findUnique({
      where: { id: tenantId },
      select: { payout_config_enc: true }
    }));

    if (!tenant?.payout_config_enc) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Payout gateway not configured for this company.', 400);
    }

    const config = JSON.parse(decrypt(tenant.payout_config_enc));

    // This would call the specific provider API (RazorpayX/PhonePe)
    // Example for RazorpayX:
    const payoutResults = { success: employees.length, failed: 0, batchId: `PAY-${runId}-${Date.now()}` };

    logger.info(`${THEME.ICONS.SUCCESS} [Payout] Initiated ${config.provider} batch for run ${runId}`);

    return sendSuccess(res, payoutResults, 'Salary disbursement initiated via gateway.');
  } catch (error) {
    logger.error(`${THEME.ICONS.ERROR} [initiatePayout] Failed:`, error);
    return sendError(res, ERROR_CODES.SERVER, 'Payout failed.', 500);
  }
};

/**
 * GENERATE BANK TRANSFER FILE (Manual NEFT/RTGS)
 * Generates a CSV formatted for standard Indian bank bulk uploads (HDFC/ICICI style).
 */
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
exports.distributeSalaries = async (req, res) => {
  try {
    const { payrollRunId, employees } = req.body; // Array of { account_no, ifsc, amount, name }
    const tenantId = await resolveTenantId(req);

    // 1. Logic to verify if the tenant has enabled Payouts
    // 2. Fetch Tenant's Payout Credentials (encrypted in DB)
    
    const payouts = employees.map(emp => ({
      account_number: "2323230034343434", // Tenant's source account
      fund_account: {
        account_type: "bank_account",
        bank_account: {
          name: emp.name,
          ifsc: emp.ifsc,
          account_number: emp.account_no
        },
        contact: {
          name: emp.name,
          type: "employee",
          reference_id: emp.id
        }
      },
      amount: emp.amount_paise,
      currency: "INR",
      mode: "IMPS",
      purpose: "salary",
      reference_id: `SAL-${payrollRunId}-${emp.id}`,
    }));

    // Example Payout call to RazorpayX
    // Note: This requires a separate API Key/Secret for RazorpayX
    /*
    const response = await axios.post('https://api.razorpay.com/v1/payouts', payouts, {
      auth: {
        username: process.env.RAZORPAYX_KEY_ID,
        password: process.env.RAZORPAYX_KEY_SECRET
      }
    });
    */

    logger.info(`${THEME.ICONS.SUCCESS} Salary distribution initiated for ${employees.length} employees`);
    
    return sendSuccess(res, {
      status: 'processing',
      batchId: `BATCH-${Date.now()}`
    }, 'Salary distribution has been initiated.');

  } catch (error) {
    logger.error(`${THEME.ICONS.ERROR} [distributeSalaries] Failed:`, error);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to distribute salaries', 500);
  }
};

/**
 * Handles Razorpay Webhooks for asynchronous status updates.
 */
exports.handleWebhook = async (req, res) => {
  let webhookEventId = null;
  try {
    const secret = (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody;

    if (!secret || !Buffer.isBuffer(rawBody) || !signature) {
      logger.warn('[Razorpay Webhook] Missing secret, raw body, or signature');
      return res.status(400).send('Invalid webhook configuration or request');
    }

    if (!verifyRazorpayWebhookSignature({ rawBody, signature, secret })) {
      await billingLogger.logInvalidSignature({ gateway: 'razorpay', req });
      return res.status(400).send('Invalid signature');
    }

    const eventBody = JSON.parse(rawBody.toString('utf8'));
    const event = String(eventBody.event || 'unknown');
    webhookEventId = req.headers['x-razorpay-event-id'] || crypto.createHash('sha256').update(rawBody).digest('hex');
    try {
      await withPlatformAdminRLS(centralPrisma, (tx) => tx.payment_webhook_events.create({
        data: {
          gateway: 'razorpay',
          gateway_event_id: String(webhookEventId),
          event_type: event,
          payload_sha256: crypto.createHash('sha256').update(rawBody).digest('hex'),
          status: 'received',
        },
      }));
    } catch (inboxError) {
      if (inboxError.code === 'P2002' || inboxError.code === '23505') {
        const existingEvent = await withPlatformAdminRLS(centralPrisma, (tx) =>
          tx.payment_webhook_events.findUnique({
            where: { gateway_gateway_event_id: { gateway: 'razorpay', gateway_event_id: String(webhookEventId) } },
          })
        );
        if (existingEvent?.status === 'failed') {
          await withPlatformAdminRLS(centralPrisma, (tx) => tx.payment_webhook_events.update({
            where: { id: existingEvent.id },
            data: { status: 'received', last_error: null, received_at: new Date(), processed_at: null },
          }));
        } else {
          return res.status(200).json({ status: 'duplicate' });
        }
      } else {
        throw inboxError;
      }
    }
    // Only payment.captured contains a payment entity with an order_id and
    // captured amount. order.paid alone is not used to mark invoices paid.
    if (event !== 'payment.captured') {
      await withPlatformAdminRLS(centralPrisma, (tx) => tx.payment_webhook_events.update({
        where: { gateway_gateway_event_id: { gateway: 'razorpay', gateway_event_id: String(webhookEventId) } },
        data: { status: 'ignored', processed_at: new Date() },
      }));
      return res.status(200).json({ status: 'ignored', event });
    }

    const paymentEntity = eventBody.payload?.payment?.entity;
    if (!paymentEntity?.id || !paymentEntity?.order_id) {
      return res.status(400).send('Incomplete payment event');
    }

    const rp = getRazorpay();
    if (!rp) return res.status(503).send('Payment gateway unavailable');
    const [gatewayOrder, gatewayPayment] = await Promise.all([
      rp.orders.fetch(paymentEntity.order_id),
      rp.payments.fetch(paymentEntity.id),
    ]);

    const storedOrder = await withPlatformAdminRLS(centralPrisma, (tx) =>
      tx.payment_orders.findFirst({
        where: {
          gateway: 'razorpay',
          purpose: 'invoice',
          gateway_order_id: paymentEntity.order_id,
          status: 'created',
        },
      })
    );
    if (!storedOrder) {
      logger.warn('[Razorpay Webhook] Captured payment has no matching pending ledger order');
      await withPlatformAdminRLS(centralPrisma, (tx) => tx.payment_webhook_events.update({
        where: { gateway_gateway_event_id: { gateway: 'razorpay', gateway_event_id: String(webhookEventId) } },
        data: { status: 'ignored', processed_at: new Date(), last_error: 'No matching pending invoice ledger order' },
      }));
      return res.status(200).json({ status: 'unmatched' });
    }

    const invoice = await withPlatformAdminRLS(centralPrisma, (tx) =>
      tx.invoices.findFirst({
        where: { id: storedOrder.invoice_id, tenant_id: storedOrder.tenant_id },
        include: { tenant: true },
      })
    );
    if (!invoice || !isRazorpayPaymentForInvoice({ order: gatewayOrder, payment: gatewayPayment, invoice }) ||
        Number(storedOrder.amount_paise) !== Number(invoice.total_paise) ||
        String(storedOrder.currency).toUpperCase() !== String(invoice.currency).toUpperCase()) {
      logger.warn('[Razorpay Webhook] Payment does not match its ledger order and invoice');
      await withPlatformAdminRLS(centralPrisma, (tx) => tx.payment_webhook_events.update({
        where: { gateway_gateway_event_id: { gateway: 'razorpay', gateway_event_id: String(webhookEventId) } },
        data: { status: 'ignored', processed_at: new Date(), last_error: 'Provider payment did not match invoice ledger' },
      }));
      return res.status(200).json({ status: 'mismatch' });
    }

    const updated = await withPlatformAdminRLS(centralPrisma, async (tx) => {
      const invoiceUpdate = await tx.invoices.updateMany({
        where: { id: invoice.id, tenant_id: invoice.tenant_id, status: { not: 'paid' } },
        data: { status: 'paid', payment_id: gatewayPayment.id, updated_at: new Date() },
      });
      if (invoiceUpdate.count !== 1) return null;
      await tx.payment_orders.update({
        where: { id: storedOrder.id },
        data: {
          gateway_payment_id: gatewayPayment.id,
          status: 'captured',
          updated_at: new Date(),
        },
      });
      return tx.invoices.findUnique({
        where: { id: invoice.id },
        include: { tenant: true },
      });
    });

    if (!updated) {
      // A verified callback may be retried after the synchronous verify endpoint
      // has already completed the same payment. This is an idempotent no-op.
      await withPlatformAdminRLS(centralPrisma, (tx) => tx.payment_webhook_events.update({
        where: { gateway_gateway_event_id: { gateway: 'razorpay', gateway_event_id: String(webhookEventId) } },
        data: { status: 'processed', processed_at: new Date() },
      }));
      return res.status(200).json({ status: 'already_processed' });
    }

    try {
      await billingEmailer.sendPaymentReceipt(updated.tenant.admin_email, updated.invoice_no, updated.payment_id);
    } catch (emailErr) {
      logger.error('[Razorpay Webhook] Receipt email failed:', emailErr.message);
    }
    await billingLogger.log({
      tenantId: updated.tenant_id,
      gateway: 'razorpay',
      eventType: 'invoice_marked_paid',
      status: 'success',
      referenceId: updated.id,
      amountPaise: gatewayPayment.amount,
      message: 'Invoice marked paid after verified Razorpay captured event',
      req,
    });
    await withPlatformAdminRLS(centralPrisma, (tx) => tx.payment_webhook_events.update({
      where: { gateway_gateway_event_id: { gateway: 'razorpay', gateway_event_id: String(webhookEventId) } },
      data: { status: 'processed', processed_at: new Date() },
    }));
    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    if (webhookEventId) {
      try {
        await withPlatformAdminRLS(centralPrisma, (tx) => tx.payment_webhook_events.update({
          where: { gateway_gateway_event_id: { gateway: 'razorpay', gateway_event_id: String(webhookEventId) } },
          data: { status: 'failed', last_error: String(error.message || 'Processing failed').slice(0, 500) },
        }));
      } catch (_) {}
    }
    logger.error('[Razorpay Webhook] Processing failed:', { message: error.message });
    return res.status(500).send('Internal Server Error');
  }
};

/**
 * Creates a Razorpay Order for a subscription plan selection (Onboarding).
 * Supports both new DB-driven pricing (planSlug) and legacy hardcoded pricing.
 */
exports.createSubscriptionOrder = async (req, res) => {
  try {
    const {
      // NEW format (from PlanSelectionStep.jsx):
      planSlug, selectedAddons = [], billingMonths = 1, promoCode,
      // LEGACY format (from old OnboardingWizard — kept for backward compat):
      planId, period, addons = [],
      // Common:
      method = 'razorpay',
      tenantId: requestedTenantId,
      renewalMode = 'manual',
    } = req.body;
    const tenantId = await resolveTargetTenantId(req, requestedTenantId);
    if (!tenantId) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Tenant could not be resolved for subscription order', 400);
    }
    if (method === 'jiopay') {
      return sendError(res, ERROR_CODES.VALIDATION, 'JioPay checkout is disabled until the official merchant API contract is implemented.', 503);
    }
    const normalizedRenewalMode = normalizeRenewalMode(renewalMode);

    // ── Dynamic pricing via plans.service ──────────────────────────────────
    let finalAmount, description, resolvedPlanId;

    if (planSlug) {
      // NEW: DB-driven pricing
      const employeeCount = req.body.employeeCount || 0;
      const priceResult = await plansService.calculatePrice({
        planSlug, selectedAddons, billingMonths, employeeCount, promoCode,
      });

      if (priceResult.isCustomQuote) {
        return sendError(res, ERROR_CODES.VALIDATION,
          'Enterprise plans require a custom quote — please contact sales', 400);
      }

      finalAmount = priceResult.total_paise;
      resolvedPlanId = planSlug;
      description = `${priceResult.plan.name} — ${billingMonths === 1 ? 'Monthly' : `${billingMonths}-month`} (incl. 18% GST)`;

    } else {
      // LEGACY: hardcoded prices (kept until all tenants use new flow)
      const planPrices = { basic: 0, full: 999900, starter: 299900, pro: 799900, trial: 0 };
      const modulePrices = {
        'Recruitment': 79900, 'Performance': 69900, 'Training': 79900,
        'Assets': 49900, 'Expenses': 69900, 'Reports': 59900,
        'Automation': 99900, 'Documents': 29900, 'Notifications': 39900, 'Settings': 29900,
      };
      if (planPrices[planId] === undefined)
        return sendError(res, ERROR_CODES.VALIDATION, 'Invalid plan selected', 400);
      const validPeriods = ['monthly', 'yearly'];
      if (!validPeriods.includes(period))
        return sendError(res, ERROR_CODES.VALIDATION, 'Invalid billing period', 400);

      const safeAddons = Array.isArray(addons) ? addons : [];
      let subtotal = planPrices[planId];
      if (planId === 'basic') safeAddons.forEach(m => { subtotal += (modulePrices[m] || 50000); });
      const amountWithoutGst = period === 'yearly' ? subtotal * 10 : subtotal;
      finalAmount  = amountWithoutGst + Math.round(amountWithoutGst * 0.18);
      resolvedPlanId = planId;
      description  = `${planId === 'full' ? 'Full Plan' : 'Customized Plan'} — ${period} (incl. 18% GST)`;
    }

    // Never create a client-side mock order. Paid subscription activation must
    // always follow a real provider order and server-side verification.
    if (!Number.isSafeInteger(Number(finalAmount)) || Number(finalAmount) <= 0) {
      return sendError(res, ERROR_CODES.VALIDATION, 'A paid checkout requires a positive, valid amount. Use the free-trial flow for zero-price selections.', 400);
    }

    const subscriptionSnapshot = {
      planSlug: resolvedPlanId,
      selectedAddons: Array.isArray(selectedAddons) ? selectedAddons : (Array.isArray(addons) ? addons : []),
      billingMonths: Number(billingMonths) || (period === 'yearly' ? 12 : 1),
      employeeCount: Number(req.body.employeeCount) || 0,
      promoCode: promoCode || null,
      renewalMode: normalizedRenewalMode,
    };

    const tenant = await withBillingRLS(req, tenantId, (tx) => tx.tenants.findUnique({
      where: { id: tenantId },
      select: { name: true, admin_email: true, admin_name: true, admin_phone: true },
    }));

    // ── Razorpay ─────────────────────────────────────────────────────────
    if (method === 'razorpay') {
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return sendError(res, ERROR_CODES.SERVER, 'Razorpay checkout is not configured. Contact the administrator.', 503);
      }
      const rp = getRazorpay();
      if (!rp) return sendError(res, ERROR_CODES.SERVER, 'Razorpay credentials missing', 500);
      const order = await rp.orders.create({
        amount: finalAmount, currency: 'INR',
        receipt: `SUB-${String(tenantId||'new').substring(0,8)}-${Date.now()}`,
        notes: { tenantId, planId: resolvedPlanId, billingMonths, renewalMode: normalizedRenewalMode, type: 'subscription', gst_applied: '18%' },
      });
      if (!order?.id || Number(order.amount) !== Number(finalAmount) || String(order.currency).toUpperCase() !== 'INR') {
        return sendError(res, ERROR_CODES.SERVER, 'Razorpay returned an invalid subscription order', 502);
      }
      await withBillingRLS(req, tenantId, (tx) => tx.payment_orders.create({
        data: {
          tenant_id: tenantId,
          purpose: 'subscription',
          gateway: 'razorpay',
          gateway_order_id: order.id,
          amount_paise: finalAmount,
          currency: 'INR',
          status: 'created',
          metadata: subscriptionSnapshot,
        },
      }));
      return sendSuccess(res, {
        method: 'razorpay', orderId: order.id, amount: order.amount,
        currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID,
        companyName: tenant?.name || process.env.PRODUCT_NAME || 'Syntern HRMS', description,
        prefill: { name: tenant?.admin_name || req.user?.name || '', email: tenant?.admin_email || req.user?.email || '', contact: tenant?.admin_phone || '' },
      });
    }

    // ── PhonePe Standard Checkout v2 ──────────────────────────────────────
    if (method === 'phonepe') {
      const merchantOrderId = `SUB-${String(tenantId).replace(/-/g, '').substring(0, 12)}-${Date.now()}`;
      const redirectUrl = `${process.env.FRONTEND_URL}/onboarding?step=plan&status=verify&method=phonepe&transactionId=${encodeURIComponent(merchantOrderId)}`;
      const checkout = await createPhonePePayment({
        merchantOrderId,
        amount: finalAmount,
        redirectUrl,
        metaInfo: { udf1: String(tenantId), udf2: 'subscription', udf3: String(resolvedPlanId) },
      });
      await withBillingRLS(req, tenantId, (tx) => tx.payment_orders.create({
        data: {
          tenant_id: tenantId,
          purpose: 'subscription',
          gateway: 'phonepe',
          gateway_order_id: merchantOrderId,
          amount_paise: finalAmount,
          currency: 'INR',
          status: 'created',
          metadata: subscriptionSnapshot,
        },
      }));
      return sendSuccess(res, { method: 'phonepe', redirectUrl: checkout.redirectUrl, transactionId: merchantOrderId });
    }

    // ── JioPay ──────────────────────────────────────────────────────────
    if (method === 'jiopay') {
      if (!jioPayMerchantId || !jioPaySalt) return sendError(res, ERROR_CODES.SERVER, 'JioPay credentials missing in .env', 500);

      const merchantTransactionId = `JIO-SUB-${String(tenantId || 'new').substring(0, 8)}-${Date.now()}`;
      const payload = {
        merchantId: jioPayMerchantId,
        transactionId: merchantTransactionId,
        amount: (finalAmount / 100).toFixed(2),
        currency: 'INR',
        customerName: tenant?.admin_name || 'Admin',
        customerEmail: tenant?.admin_email || '',
        callbackUrl: `${process.env.BACKEND_URL}/api/v1/platform/subscribe/jiopay-webhook`,
        redirectUrl: `${process.env.FRONTEND_URL}/onboarding?step=plan&status=verify&method=jiopay&transactionId=${merchantTransactionId}`
      };

      const signString = `${payload.merchantId}|${payload.transactionId}|${payload.amount}|${jioPaySalt}`;
      const signature = crypto.createHash('sha256').update(signString).digest('hex');

      const response = await axios.post(`${jioPayBaseUrl}/checkout/initiate`, { ...payload, signature }, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.success) {
        return sendSuccess(res, { method: 'jiopay', redirectUrl: response.data.redirectUrl });
      }
      throw new Error('JioPay initiation failed');
    }

    return sendError(res, ERROR_CODES.VALIDATION, 'Unsupported payment method', 400);
  } catch (err) {
    // Sanitize error object to prevent circular reference crash in logger
    const errorData = {
      message: err.message,
      status: err.statusCode || err.response?.status,
      rzpDescription: err.error?.description
    };
    const methodDisplay = (req.body.method || 'razorpay').toUpperCase();
    logger.error(`${THEME.ICONS.ERROR} [createSubscriptionOrder] ${methodDisplay} Failed:`, errorData);
    const detailedMsg = errorData.status === 401
      ? `${methodDisplay} authentication failed. Please check your .env credentials.` 
      : `Failed to initiate ${methodDisplay} subscription: ${errorData.rzpDescription || errorData.message}`;
    return sendError(res, ERROR_CODES.SERVER, detailedMsg, 500);
  }
};

/**
 * Verifies a subscription payment and updates the tenant's plan.
 */
exports.verifySubscription = async (req, res) => {
  try {
    const {
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
      razorpayOrderId, razorpayPaymentId, razorpaySignature,
      transactionId,
      planId,
      planSlug,
      period,
      addons = [],
      selectedAddons = [],
      billingMonths,
      employeeCount = 0,
      promoCode,
      renewalMode = 'manual',
      method = 'razorpay',
      tenantId: requestedTenantId,
      mock,
    } = req.body;
    const tenantId = await resolveTargetTenantId(req, requestedTenantId);
    if (!tenantId) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Tenant could not be resolved for subscription verification', 400);
    }
    if (method === 'jiopay') {
      return sendError(res, ERROR_CODES.VALIDATION, 'JioPay verification is disabled until the official merchant API contract is implemented.', 503);
    }

    const resolvedOrderId = razorpay_order_id || razorpayOrderId;
    let resolvedPaymentId = razorpay_payment_id || razorpayPaymentId || transactionId;
    const resolvedSignature = razorpay_signature || razorpaySignature;

    const validPeriods = ['monthly', 'yearly', 'quarterly'];
    const planBasePrices = { basic: 0, full: 999900, starter: 299900, pro: 799900, trial: 0 };
    const selectedPlanSlug = planSlug || planId;
    const normalizedRenewalMode = normalizeRenewalMode(renewalMode);
    const normalizedAddons = Array.isArray(selectedAddons) && selectedAddons.length ? selectedAddons : (Array.isArray(addons) ? addons : []);
    const normalizedBillingMonths = Number.isFinite(Number(billingMonths)) && Number(billingMonths) > 0
      ? Number(billingMonths)
      : (period === 'yearly' ? 12 : (period === 'quarterly' ? 3 : 1));

    if (selectedPlanSlug === 'enterprise') {
      return sendError(res, ERROR_CODES.VALIDATION, 'Enterprise plan requires sales consultation', 400);
    }

    if (!selectedPlanSlug) return sendError(res, ERROR_CODES.VALIDATION, 'Invalid plan selected', 400);
    if (period && !validPeriods.includes(period)) return sendError(res, ERROR_CODES.VALIDATION, 'Invalid billing period', 400);

    if (mock) {
      return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Mock payment verification is disabled. A verified payment is required.', 403);
    }

    {
      // 1. RAZORPAY SIGNATURE VERIFICATION
      if (method === 'razorpay') {
        if (!resolvedOrderId || !resolvedPaymentId || !resolvedSignature) {
          return sendError(res, ERROR_CODES.VALIDATION, 'Razorpay order, payment, and signature are required.', 400);
        }
        const sign = `${resolvedOrderId}|${resolvedPaymentId}`;
        const secret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
        if (!secret) return sendError(res, ERROR_CODES.SERVER, 'Razorpay verification is not configured.', 500);
        if (!verifyRazorpaySignature({ orderId: resolvedOrderId, paymentId: resolvedPaymentId, signature: resolvedSignature, secret })) {
          return sendError(res, ERROR_CODES.UNAUTHORIZED, "Invalid signature", 400);
        }
      } 
      
      // PhonePe v2 order status is checked after the persisted order is loaded.
      else if (method === 'phonepe') {
        if (!transactionId) return sendError(res, ERROR_CODES.VALIDATION, 'PhonePe merchant order ID is required.', 400);
      }

      // 3. JIOPAY STATUS CHECK (Server-to-Server)
      else if (method === 'jiopay') {
        if (!transactionId) return sendError(res, ERROR_CODES.VALIDATION, 'JioPay transaction ID is required.', 400);
        if (!jioPayMerchantId || !jioPaySalt) return sendError(res, ERROR_CODES.SERVER, 'JioPay misconfigured', 500);
        
        // JioPay Status logic based on docs.jiopay.in
        const statusPayload = {
          merchantId: jioPayMerchantId,
          transactionId: transactionId
        };
        const signString = `${statusPayload.merchantId}|${statusPayload.transactionId}|${jioPaySalt}`;
        const signature = crypto.createHash('sha256').update(signString).digest('hex');

        try {
          const response = await axios.post(`${jioPayBaseUrl}/checkout/status`, { ...statusPayload, signature }, {
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (!response.data.success || response.data.status !== 'SUCCESS') {
            return sendError(res, ERROR_CODES.VALIDATION, 'JioPay payment verification failed or pending.', 400);
          }
        } catch (err) {
          logger.error(`[JioPay Status Query] Failed for TID ${transactionId}:`, err.message);
          // If the status API is unreachable, we fallback to checking if a webhook already updated it
          const alreadyPaid = await withBillingRLS(req, tenantId, (tx) => tx.tenants.findUnique({ where: { id: tenantId }, select: { plan: true } }));
          if (alreadyPaid.plan === 'starter' || alreadyPaid.plan === 'pro') {
            return sendSuccess(res, null, "Subscription already activated via webhook.");
          }
          return sendError(res, ERROR_CODES.SERVER, 'Could not reach JioPay to verify status.', 500);
        }
      } else {
        return sendError(res, ERROR_CODES.VALIDATION, 'Unsupported payment method for subscription verification.', 400);
      }
    }

    if (method === 'jiopay') {
      return sendError(res, ERROR_CODES.VALIDATION, 'JioPay checkout is disabled until the verified merchant API contract is implemented.', 503);
    }

    const ledgerOrderId = method === 'razorpay' ? resolvedOrderId : transactionId;
    const subscriptionOrder = await withBillingRLS(req, tenantId, (tx) => tx.payment_orders.findFirst({
      where: {
        tenant_id: tenantId,
        purpose: 'subscription',
        gateway: method,
        gateway_order_id: ledgerOrderId,
        status: 'created',
      },
    }));
    if (!subscriptionOrder) {
      return sendError(res, ERROR_CODES.UNAUTHORIZED, 'No pending server-created subscription order matches this payment.', 400);
    }

    const snapshot = subscriptionOrder.metadata || {};
    if (!matchesSubscriptionOrderSnapshot({
      snapshot,
      request: {
        planSlug: selectedPlanSlug,
        selectedAddons: normalizedAddons,
        billingMonths: normalizedBillingMonths,
        employeeCount,
        promoCode,
        renewalMode: normalizedRenewalMode,
      },
      amountPaise: subscriptionOrder.amount_paise,
    })) {
      return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Subscription selection does not match the server-created payment order.', 400);
    }

    if (method === 'razorpay') {
      const rp = getRazorpay();
      if (!rp) return sendError(res, ERROR_CODES.SERVER, 'Razorpay credentials missing', 500);
      const [gatewayOrder, gatewayPayment] = await Promise.all([
        rp.orders.fetch(resolvedOrderId),
        rp.payments.fetch(resolvedPaymentId),
      ]);
      if (gatewayOrder.id !== subscriptionOrder.gateway_order_id ||
          Number(gatewayOrder.amount) !== Number(subscriptionOrder.amount_paise) ||
          String(gatewayOrder.currency).toUpperCase() !== String(subscriptionOrder.currency).toUpperCase() ||
          String(gatewayOrder.notes?.tenantId || '') !== String(tenantId) ||
          String(gatewayOrder.notes?.type || '') !== 'subscription' ||
          gatewayPayment.order_id !== gatewayOrder.id ||
          Number(gatewayPayment.amount) !== Number(subscriptionOrder.amount_paise) ||
          String(gatewayPayment.currency).toUpperCase() !== String(subscriptionOrder.currency).toUpperCase() ||
          gatewayPayment.status !== 'captured') {
        return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Razorpay payment does not match the stored subscription order.', 400);
      }
    } else if (method === 'phonepe') {
      const phonePeStatus = await getPhonePeOrderStatus({ merchantOrderId: transactionId });
      if (!isPhonePeOrderPaid(phonePeStatus, {
        merchantOrderId: subscriptionOrder.gateway_order_id,
        amount: subscriptionOrder.amount_paise,
      })) {
        return sendError(res, ERROR_CODES.UNAUTHORIZED, 'PhonePe status does not match the stored subscription order amount and transaction.', 400);
      }
      resolvedPaymentId = phonePeStatus.paymentDetails.find((payment) =>
        payment?.state === 'COMPLETED' &&
        Number(payment.amount) === Number(subscriptionOrder.amount_paise)
      ).transactionId;
    }

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + normalizedBillingMonths);

    let calculatedPrice = null;
    if (selectedPlanSlug && !['basic', 'full', 'trial'].includes(selectedPlanSlug)) {
      calculatedPrice = await plansService.calculatePrice({
        planSlug: selectedPlanSlug,
        selectedAddons: normalizedAddons,
        billingMonths: normalizedBillingMonths,
        employeeCount: Number(employeeCount) || 0,
        promoCode,
      });
      if (calculatedPrice?.isCustomQuote) {
        return sendError(res, ERROR_CODES.VALIDATION, 'Custom quote plans cannot be auto-verified', 400);
      }
    }

    const normalizedPlan = selectedPlanSlug === 'full' ? 'pro' : (selectedPlanSlug === 'basic' ? 'starter' : selectedPlanSlug);
    const planCatalog = await plansService.getPlans({ includeInactive: true });
    const planDef = planCatalog.find((p) => p.slug === normalizedPlan || p.id === normalizedPlan);

    const maxEmployees = planDef?.employee_cap ?? (
      normalizedPlan === 'free' ? 200 :
      normalizedPlan === 'pro' ? 999999 :
      100
    );

    const existingConfig = await withBillingRLS(req, tenantId, (tx) => tx.tenant_pricing_configs.findUnique({ where: { tenant_id: tenantId } }));
    const existingModuleDiscounts = (existingConfig?.discount_module_pct && typeof existingConfig.discount_module_pct === 'object')
      ? existingConfig.discount_module_pct
      : {};
    const discountModuleMeta = {
      ...existingModuleDiscounts,
      __renewalMode: normalizedRenewalMode,
      __lastPaymentMethod: method,
    };

    const basePricePaise = calculatedPrice?.breakdown?.base_monthly_paise
      ?? planDef?.base_price_paise
      ?? planBasePrices[selectedPlanSlug]
      ?? 0;

    const tenantForInvoice = await withBillingRLS(req, tenantId, (tx) =>
      tx.tenants.findUnique({ where: { id: tenantId }, select: { subdomain: true } })
    );
    const now = new Date();
    const invoiceNo = `SUB-${String((tenantForInvoice?.subdomain || 'TENANT')).toUpperCase()}-${now.getTime()}`;
    const breakdown = calculatedPrice?.breakdown || {
      base_monthly_paise: basePricePaise,
      excess_paise: 0,
      addons: [],
      discount_paise: 0,
      gst_paise: 0,
      amount_before_tax: basePricePaise * normalizedBillingMonths,
    };
    const grossBeforeTax = breakdown.amount_before_tax ?? (basePricePaise * normalizedBillingMonths);
    const gstPaise = breakdown.gst_paise ?? Math.round(grossBeforeTax * 0.18);
    const totalPaise = calculatedPrice?.total_paise ?? (grossBeforeTax + gstPaise);

    const offerExpiry = expiryDate;
    const billingCycle = toBillingCycleLabel(normalizedBillingMonths);

    await withBillingRLS(req, tenantId, async (tx) => {
      await tx.tenants.update({
        where: { id: tenantId },
        data: {
          plan: normalizedPlan,
          plan_expires_at: expiryDate,
          max_employees: maxEmployees
        }
      });
      await tx.tenant_pricing_configs.upsert({
        where: { tenant_id: tenantId },
        update: {
          billing_cycle: billingCycle,
          offer_expiry_date: offerExpiry,
          base_price_paise: basePricePaise,
          employee_cap: maxEmployees === 999999 ? null : maxEmployees,
          tenure_months: normalizedBillingMonths,
          discount_module_pct: discountModuleMeta,
        },
        create: {
          tenant_id: tenantId,
          billing_cycle: billingCycle,
          offer_expiry_date: offerExpiry,
          base_price_paise: basePricePaise,
          employee_cap: maxEmployees === 999999 ? null : maxEmployees,
          tenure_months: normalizedBillingMonths,
          discount_module_pct: discountModuleMeta,
        }
      });
      // Update enabled modules based on selection
      for (const mod of normalizedAddons) {
        await tx.tenant_modules.upsert({
          where: { tenant_id_module_name: { tenant_id: tenantId, module_name: String(mod).toLowerCase() } },
          update: { is_active: true, enabled_at: new Date() },
          create: { tenant_id: tenantId, module_name: String(mod).toLowerCase(), is_active: true, enabled_at: new Date() }
        });
      }
      const claimedOrder = await tx.payment_orders.updateMany({
        where: { id: subscriptionOrder.id, tenant_id: tenantId, purpose: 'subscription', status: 'created' },
        data: {
          gateway_payment_id: resolvedPaymentId || transactionId,
          status: 'captured',
          updated_at: new Date(),
        },
      });
      if (claimedOrder.count !== 1) {
        throw new Error('Subscription payment order was already processed');
      }
      if (calculatedPrice) {
        await plansService.saveSelectionToTenantConfig(tenantId, calculatedPrice, {
          renewalMode: normalizedRenewalMode,
          paymentMethod: method,
        }, tx);
      }
      await tx.invoices.create({
        data: {
          tenant_id: tenantId,
          invoice_no: invoiceNo,
          period_start: now,
          period_end: expiryDate,
          due_date: now,
          base_amount_paise: (breakdown.base_monthly_paise || basePricePaise) * normalizedBillingMonths,
          module_amount_paise: (breakdown.addon_total_monthly || 0) * normalizedBillingMonths,
          excess_amount_paise: (breakdown.excess_paise || 0) * normalizedBillingMonths,
          discount_amount_paise: (breakdown.discount_paise || 0) + (breakdown.promo_deduction_paise || 0),
          tax_amount_paise: gstPaise,
          total_paise: totalPaise,
          status: 'paid',
          payment_id: resolvedPaymentId || transactionId || null,
          breakdown: {
            ...(calculatedPrice || {}),
            renewalMode: normalizedRenewalMode,
            paymentMethod: method,
            purchaseType: 'subscription_activation',
          },
        },
      });
    });

    return sendSuccess(res, null, "Subscription activated successfully.");
  } catch (error) {
    const sanitizedError = { message: error.message, stack: error.stack, code: error.code };
    logger.error(`${THEME.ICONS.ERROR} [verifySubscription] Failed:`, sanitizedError);
    return sendError(res, ERROR_CODES.SERVER, `Verification failed: ${error.message}`, 500);
  }
};

/**
 * Handles Payout-specific Webhooks (e.g., RazorpayX)
 * Updates individual employee transfer status in the tenant DB.
 */
exports.handlePayoutWebhook = async (req, res) => {
  try {
    const event = req.body.event; // e.g., 'payout.processed' or 'payout.failed'
    const payload = req.body.payload.payout.entity;
    
    // We find the tenant using metadata/notes sent during initiatePayout
    const tenantId = payload.notes?.tenantId;
    const employeeId = payload.notes?.employeeId;

    if (!tenantId || !employeeId) return res.status(200).json({ status: 'ignored' });

    // Resolve the specific tenant database connection
    const tenant = await withPlatformAdminRLS(centralPrisma, (tx) => tx.tenants.findUnique({ where: { id: tenantId } }));
    const dbUrl = decrypt(tenant.db_url); // Simplified resolution
    const { PrismaClient: TenantClient } = require('@prisma/client');
    const tenantDb = new TenantClient({ datasources: { db: { url: dbUrl } } });

    try {
      let newStatus = 'pending';
      if (event === 'payout.processed') newStatus = 'processed';
      if (event === 'payout.failed') newStatus = 'failed';
      if (event === 'payout.reversed') newStatus = 'reversed';

      await tenantDb.$executeRaw`
        UPDATE payout_logs 
        SET status = ${newStatus}, 
            payout_id = ${payload.id}, 
            utr = ${payload.utr || null},
            failure_reason = ${payload.failure_reason || null},
            updated_at = NOW()
        WHERE employee_id = ${employeeId}::uuid 
          AND status != 'processed'
      `;

      logger.info(`${THEME.ICONS.SUCCESS} [Payout Webhook] Updated employee ${employeeId} to ${newStatus}`);
    } finally {
      await tenantDb.$disconnect();
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    logger.error(`${THEME.ICONS.ERROR} [Payout Webhook] Error:`, error);
    return res.status(500).send('Internal Error');
  }
};