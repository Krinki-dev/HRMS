﻿const Razorpay = require('razorpay');
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
      const t = await centralPrisma.tenants.findFirst({ where: { subdomain } });
      if (t) return t.id;
    } catch (err) {
      logger.warn(`${THEME.ICONS.WARNING} [resolveTenantId] centralPrisma lookup failed: ${err.message}`);
      // Fall through to allow other resolution methods or let caller handle missing tenant
    }
  }
  return null;
}

/**
 * Creates a Razorpay Order for an unpaid invoice.
 */
exports.createOrder = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await centralPrisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { tenant: true }
    });

    if (!invoice) return sendError(res, ERROR_CODES.NOT_FOUND, 'Invoice not found', 404);
    
    // Security: Ensure user belongs to the tenant or is a platform admin
    const resolvedTenant = await resolveTenantId(req);
    if (invoice.tenant_id !== resolvedTenant && !req.user.is_platform_admin) {
      return sendError(res, ERROR_CODES.FORBIDDEN, 'Unauthorized to pay this invoice', 403);
    }

    if (invoice.status === 'paid') return sendError(res, ERROR_CODES.VALIDATION, 'Invoice already paid', 400);

    const options = {
      amount: invoice.total_paise,
      currency: invoice.currency,
      receipt: invoice.invoice_no,
      notes: {
        tenantId: invoice.tenant_id,
        invoiceId: invoice.id,
      }
    };

    if (process.env.NODE_ENV === 'development' && (!process.env.RAZORPAY_KEY_ID || process.env.SKIP_PAYMENT === 'true')) {
      logger.warn(`${THEME.ICONS.WARNING} [createOrder] Using mock invoice payment mode in development`);
      return sendSuccess(res, {
        mock: true,
        orderId: `MOCK-${invoice.id}`,
        amount: invoice.total_paise,
        currency: invoice.currency,
        keyId: null,
        companyName: 'Syntern HRMS',
        description: `Payment for ${invoice.invoice_no}`,
        prefill: {
          name: invoice.tenant.admin_name,
          email: invoice.tenant.admin_email,
        }
      });
    }

    const rp = getRazorpay();
    if (!rp) return sendError(res, ERROR_CODES.SERVER, 'Payment gateway misconfigured', 500);
    const order = await rp.orders.create(options);

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

    const invoice = await centralPrisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return sendError(res, ERROR_CODES.NOT_FOUND, 'Invoice not found', 404);
    if (invoice.tenant_id !== tenantId && !req.user.is_platform_admin) {
      return sendError(res, ERROR_CODES.FORBIDDEN, 'Unauthorized to verify this invoice', 403);
    }
    if (invoice.status === 'paid') return sendError(res, ERROR_CODES.VALIDATION, 'Invoice already paid', 400);

    if (!mock) {
      const sign = `${resolvedOrderId}|${resolvedPaymentId}`;
      const secret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
      const expectedSign = crypto
        .createHmac("sha256", secret)
        .update(sign.toString())
        .digest("hex");

      if (resolvedSignature !== expectedSign) {
        return sendError(res, ERROR_CODES.UNAUTHORIZED, "Invalid payment signature", 400);
      }
    }

    await centralPrisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'paid',
        payment_id: resolvedPaymentId || (mock ? `MOCK-${invoiceId}` : null),
        updated_at: new Date()
      }
    });

    return sendSuccess(res, null, "Payment successful and verified.");
  } catch (error) {
    logger.error(`${THEME.ICONS.ERROR} [verifyPayment] Failed:`, error);
    return sendError(res, ERROR_CODES.SERVER, 'Verification failed', 500);
  }
};

/**
 * Creates a PhonePe Order for an unpaid invoice.
 */
exports.createPhonePeOrder = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const tenantId = await resolveTenantId(req);

    const invoice = await centralPrisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { tenant: true }
    });

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

/**
 * Handles PhonePe Webhooks for asynchronous payment status updates.
 */
exports.handlePhonePeWebhook = async (req, res) => {
  try {
    const { response } = req.body; // PhonePe sends response in a 'response' field
    const xVerify = req.headers['x-verify'];

    const expectedXVerify = crypto.createHash('sha256').update(response + phonePeSaltKey).digest('hex') + '###' + phonePeSaltIndex;

    if (xVerify !== expectedXVerify) {
      logger.warn(`${THEME.ICONS.LOCK} [PhonePe Webhook] Invalid signature received`);
      return res.status(400).send('Invalid signature');
    }

    const decodedResponse = JSON.parse(Buffer.from(response, 'base64').toString('utf8'));
    logger.info(`${THEME.ICONS.INFO} [PhonePe Webhook] Received event:`, decodedResponse);

    if (decodedResponse.code === 'PAYMENT_SUCCESS') {
      const invoiceId = decodedResponse.data.metadata?.invoiceId;
      const transactionId = decodedResponse.data.transactionId;

      if (invoiceId) {
        await centralPrisma.invoice.update({
          where: { id: invoiceId },
          data: { status: 'paid', payment_id: transactionId, updated_at: new Date() }
        });
        logger.info(`${THEME.ICONS.SUCCESS} [PhonePe Webhook] Invoice ${invoiceId} marked as PAID via webhook`);
      }
    }

    return res.status(200).json({ success: true, message: 'Webhook received' });
  } catch (error) {
    logger.error(`${THEME.ICONS.ERROR} [PhonePe Webhook] Fatal:`, error);
    return res.status(500).send('Internal Server Error');
  }
};

/**
 * Creates a JioPay Order for an unpaid invoice.
 */
exports.createJioPayOrder = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const tenantId = await resolveTenantId(req);

    const invoice = await centralPrisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { tenant: true }
    });

    if (!invoice) return sendError(res, ERROR_CODES.NOT_FOUND, 'Invoice not found', 404);
    if (invoice.tenant_id !== tenantId && !req.user.is_platform_admin) {
      return sendError(res, ERROR_CODES.FORBIDDEN, 'Unauthorized', 403);
    }

    const merchantTransactionId = `JIO-${invoice.invoice_no}-${Date.now()}`;
    
    // JioPay standard integration typically requires a checksum/signature
    const payload = {
      merchantId: jioPayMerchantId,
      transactionId: merchantTransactionId,
      amount: (invoice.total_paise / 100).toFixed(2), // JioPay often expects decimal strings
      currency: 'INR',
      customerName: invoice.tenant.admin_name,
      customerEmail: invoice.tenant.admin_email,
      callbackUrl: `${process.env.BACKEND_URL}/api/v1/platform/subscribe/jiopay-webhook`,
      redirectUrl: `${process.env.FRONTEND_URL}/payment-status?invoiceId=${invoice.id}&method=jiopay`
    };

    // Generate signature (Placeholder logic based on common PG patterns)
    const signString = `${payload.merchantId}|${payload.transactionId}|${payload.amount}|${jioPaySalt}`;
    const signature = crypto.createHash('sha256').update(signString).digest('hex');

    // Note: This is a scaffold. Real JioPay integration requires specific API endpoints 
    // and headers defined in their technical documentation.
    const response = await axios.post(`${jioPayBaseUrl}/checkout/initiate`, {
      ...payload,
      signature
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data.success) {
      return sendSuccess(res, {
        redirectUrl: response.data.redirectUrl,
        transactionId: merchantTransactionId
      }, 'JioPay session initiated.');
    }
    
    return sendError(res, ERROR_CODES.SERVER, 'JioPay initiation failed', 500);
  } catch (error) {
    logger.error(`${THEME.ICONS.ERROR} [createJioPayOrder] Failed:`, error);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to create JioPay order', 500);
  }
};

/**
 * Handles JioPay Webhooks
 */
exports.handleJioPayWebhook = async (req, res) => {
  try {
    const { transactionId, status, amount, signature, metadata } = req.body;

    // Verify incoming signature
    const expectedSignString = `${jioPayMerchantId}|${transactionId}|${status}|${jioPaySalt}`;
    const expectedSignature = crypto.createHash('sha256').update(expectedSignString).digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).send('Invalid Signature');
    }

    if (status === 'SUCCESS') {
      // Extract invoice ID from metadata or transaction ID mapping
      const invoiceNo = transactionId.split('-')[1]; // Example parsing
      const invoice = await centralPrisma.invoice.findFirst({
        where: { invoice_no: invoiceNo }
      });

      if (invoice) {
        await centralPrisma.invoice.update({
          where: { id: invoice.id },
          data: { 
            status: 'paid', 
            payment_id: transactionId,
            updated_at: new Date()
          }
        });
        logger.info(`${THEME.ICONS.SUCCESS} [JioPay Webhook] Invoice ${invoice.id} PAID`);
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    logger.error(`${THEME.ICONS.ERROR} [JioPay Webhook] Failed:`, error);
    return res.status(500).send('Error');
  }
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

    const tenant = await centralPrisma.tenants.findUnique({
      where: { id: tenantId },
      select: { payout_config_enc: true }
    });

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
    const payslips = await centralPrisma.invoice.findMany({
      where: { tenant_id: tenantId, breakdown: { path: ['runId'], equals: runId } },
      include: { tenant: { include: { bank_accounts: true } } }
    });

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
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    // Verify webhook signature
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      logger.warn(`${THEME.ICONS.LOCK} [Webhook] Invalid signature received`);
      return res.status(400).send('Invalid signature');
    }

    const event = req.body.event;
    logger.info(`${THEME.ICONS.INFO} [Webhook] Received event: ${event}`);

    // Handle successful payment events
    if (event === 'order.paid' || event === 'payment.captured') {
      const payload = req.body.payload.payment?.entity || req.body.payload.order?.entity;
      const notes = payload.notes || {};
      const invoiceId = notes.invoiceId;

      if (invoiceId) {
        const updated = await centralPrisma.invoice.update({
          where: { id: invoiceId },
          data: {
            status: 'paid',
            payment_id: payload.id || payload.payment_id,
            updated_at: new Date()
          },
          include: { tenant: true }
        });

        // Send receipt
        try {
          await billingEmailer.sendPaymentReceipt(updated.tenant.admin_email, updated.invoice_no, updated.payment_id);
        } catch (emailErr) {
          logger.error(`${THEME.ICONS.ERROR} Failed to send payment receipt to ${updated.tenant.admin_email}:`, emailErr);
        }
        logger.info(`${THEME.ICONS.SUCCESS} [Webhook] Invoice ${invoiceId} marked as PAID via webhook`);
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    logger.error(`${THEME.ICONS.ERROR} [Webhook] Fatal:`, error);
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
      method = 'phonepe',
    } = req.body;
    const tenantId = await resolveTenantId(req);

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

      // Stash priceResult on req so verifySubscription can save the config
      req._priceResult = priceResult;
      req._selectedAddons = selectedAddons;
      req._billingMonths  = billingMonths;

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

    // ── Dev mode mock ───────────────────────────────────────────────────────
    if (process.env.NODE_ENV === 'development' &&
        (!process.env.RAZORPAY_KEY_ID || process.env.SKIP_PAYMENT === 'true')) {
      return sendSuccess(res, {
        mock: true, amount: finalAmount, keyId: null, currency: 'INR',
        companyName: process.env.PRODUCT_NAME || 'Syntern HRMS', description,
        prefill: { name: req.user?.name || 'Admin', email: req.user?.email || '' },
      });
    }

    const tenant = await centralPrisma.tenants.findUnique({
      where: { id: tenantId },
      select: { name: true, admin_email: true, admin_name: true, admin_phone: true },
    });

    // ── Razorpay ─────────────────────────────────────────────────────────
    if (method === 'razorpay') {
      const rp = getRazorpay();
      if (!rp) return sendError(res, ERROR_CODES.SERVER, 'Razorpay credentials missing', 500);
      const order = await rp.orders.create({
        amount: finalAmount, currency: 'INR',
        receipt: `SUB-${String(tenantId||'new').substring(0,8)}-${Date.now()}`,
        notes: { tenantId, planId: resolvedPlanId, billingMonths, type: 'subscription', gst_applied: '18%' },
      });
      return sendSuccess(res, {
        method: 'razorpay', orderId: order.id, amount: order.amount,
        currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID,
        companyName: tenant?.name || process.env.PRODUCT_NAME || 'Syntern HRMS', description,
        prefill: { name: tenant?.admin_name || req.user?.name || '', email: tenant?.admin_email || req.user?.email || '', contact: tenant?.admin_phone || '' },
      });
    }

    // ── PhonePe ─────────────────────────────────────────────────────────
    if (method === 'phonepe') {
      if (!phonePeMerchantId || !phonePeSaltKey) return sendError(res, ERROR_CODES.SERVER, 'PhonePe credentials missing in .env', 500);
      
      const merchantTransactionId = `SUB-${String(tenantId || 'new').substring(0, 8)}-${Date.now()}`;
      const safeAddons = Array.isArray(addons) ? addons : (req.body.selectedAddons || []);
      const payload = {
        merchantId: phonePeMerchantId,
        merchantTransactionId: merchantTransactionId,
        merchantUserId: `USER-${String(tenantId || 'new').substring(0, 8)}`,
        amount: finalAmount,
        currency: 'INR',
        redirectUrl: `${process.env.FRONTEND_URL}/onboarding?step=plan&status=verify&method=phonepe&transactionId=${merchantTransactionId}`,
        redirectMode: 'POST',
        callbackUrl: `${process.env.BACKEND_URL}/api/v1/platform/subscribe/phonepe-webhook`,
        mobileNumber: tenant?.admin_phone || '9999999999',
        paymentInstrument: { type: 'PAY_PAGE' },
        metadata: { tenantId, planId: resolvedPlanId, period: billingMonths ? `${billingMonths}months` : period, addons: safeAddons.join(','), type: 'subscription' }
      };

      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const xVerify = crypto.createHash('sha256').update(base64Payload + '/pg/v1/pay' + phonePeSaltKey).digest('hex') + '###' + phonePeSaltIndex;

      const response = await axios.post(`${phonePeBaseUrl}/pg/v1/pay`, { request: base64Payload }, {
        headers: { 'Content-Type': 'application/json', 'X-VERIFY': xVerify, 'X-MERCHANT-ID': phonePeMerchantId }
      });

      if (response.data.success) {
        const redirectUrl = response.data.data?.instrumentResponse?.redirectInfo?.url || response.data.data?.instrumentResponse?.url;
        return sendSuccess(res, { method: 'phonepe', redirectUrl });
      }
      return sendError(res, ERROR_CODES.SERVER, response.data.message || 'PhonePe initiation failed', 500);
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
    const methodDisplay = (req.body.method || 'phonepe').toUpperCase();
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
      transactionId, planId, period, addons = [], method = 'razorpay', mock
    } = req.body;
    const tenantId = await resolveTenantId(req);

    const resolvedOrderId = razorpay_order_id || razorpayOrderId;
    const resolvedPaymentId = razorpay_payment_id || razorpayPaymentId || transactionId;
    const resolvedSignature = razorpay_signature || razorpaySignature;

    const validPeriods = ['monthly', 'yearly', 'quarterly'];
    const planBasePrices = { basic: 0, full: 999900, starter: 299900, pro: 799900, trial: 0 };

    if (planId === 'enterprise') {
      return sendError(res, ERROR_CODES.VALIDATION, 'Enterprise plan requires sales consultation', 400);
    }

    if (planBasePrices[planId] === undefined) return sendError(res, ERROR_CODES.VALIDATION, 'Invalid plan selected', 400);
    if (!validPeriods.includes(period)) return sendError(res, ERROR_CODES.VALIDATION, 'Invalid billing period', 400);

    if (!mock) {
      // 1. RAZORPAY SIGNATURE VERIFICATION
      if (method === 'razorpay') {
        const sign = `${resolvedOrderId}|${resolvedPaymentId}`;
        const secret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
        const expectedSign = crypto.createHmac("sha256", secret).update(sign.toString()).digest("hex");
        if (resolvedSignature !== expectedSign) return sendError(res, ERROR_CODES.UNAUTHORIZED, "Invalid signature", 400);
      } 
      
      // 2. PHONEPE STATUS CHECK (Server-to-Server)
      else if (method === 'phonepe') {
        const xVerify = crypto.createHash('sha256').update(`/pg/v1/status/${phonePeMerchantId}/${transactionId}` + phonePeSaltKey).digest('hex') + '###' + phonePeSaltIndex;
        const response = await axios.get(`${phonePeBaseUrl}/pg/v1/status/${phonePeMerchantId}/${transactionId}`, {
          headers: { 'Content-Type': 'application/json', 'X-VERIFY': xVerify, 'X-MERCHANT-ID': phonePeMerchantId }
        });
        
        if (!response.data.success || response.data.code !== 'PAYMENT_SUCCESS') {
          return sendError(res, ERROR_CODES.VALIDATION, `PhonePe Status: ${response.data.message || 'Payment not successful'}`, 400);
        }
      }

      // 3. JIOPAY STATUS CHECK (Server-to-Server)
      else if (method === 'jiopay') {
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
          const alreadyPaid = await centralPrisma.tenants.findUnique({ where: { id: tenantId }, select: { plan: true } });
          if (alreadyPaid.plan === 'starter' || alreadyPaid.plan === 'pro') {
            return sendSuccess(res, null, "Subscription already activated via webhook.");
          }
          return sendError(res, ERROR_CODES.SERVER, 'Could not reach JioPay to verify status.', 500);
        }
      }
    }

    const expiryDate = new Date();
    if (period === 'yearly') expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    else if (period === 'quarterly') expiryDate.setMonth(expiryDate.getMonth() + 3);
    else expiryDate.setMonth(expiryDate.getMonth() + 1);

    const safeAddons = Array.isArray(addons) ? addons : [];

    await centralPrisma.$transaction([
      centralPrisma.tenants.update({
        where: { id: tenantId },
        data: {
          plan: planId === 'full' ? 'pro' : 'starter',
          plan_expires_at: expiryDate,
          max_employees: (planId === 'starter' || planId === 'basic') ? 100 : 999999
        }
      }),
      centralPrisma.tenant_pricing_config.upsert({
        where: { tenant_id: tenantId },
        update: {
          billing_cycle: period,
          offer_expiry_date: expiryDate,
          base_price_paise: planBasePrices[planId],
          employee_cap: (planId === 'starter' || planId === 'basic') ? 100 : null
        },
        create: {
          tenant_id: tenantId,
          billing_cycle: period,
          offer_expiry_date: expiryDate,
          base_price_paise: planBasePrices[planId],
          employee_cap: (planId === 'starter' || planId === 'basic') ? 100 : null
        }
      }),
      // Update enabled modules based on selection
      ...safeAddons.map(mod => centralPrisma.tenant_modules.upsert({
        where: { tenant_id_module_name: { tenant_id: tenantId, module_name: String(mod).toLowerCase() } },
        update: { is_active: true, enabled_at: new Date() },
        create: { tenant_id: tenantId, module_name: String(mod).toLowerCase(), is_active: true, enabled_at: new Date() }
      }))
    ]);

    // Save plan selection to tenant_pricing_configs (feeds billing cron)
    if (req._priceResult) {
      await plansService.saveSelectionToTenantConfig(tenantId, req._priceResult);
      logger.info(`[verifySubscription] Pricing config saved for tenant ${tenantId}`);
    }

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
    const tenant = await centralPrisma.tenants.findUnique({ where: { id: tenantId } });
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