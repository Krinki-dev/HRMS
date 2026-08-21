﻿const { centralPrisma } = require('../../shared/utils/centralPrisma');
const { calculateSubscription } = require('./subscriptionCalculator');
const logger = require('../../shared/utils/logger');
const { THEME } = require('../../shared/utils/uiConstants');
const billingEmailer = require('../../shared/utils/billingEmailer');
const { withPlatformAdminRLS } = require('../../shared/utils/rlsContext');

function getRenewalContext(pricingConfig) {
  const moduleMeta = pricingConfig?.discount_module_pct && typeof pricingConfig.discount_module_pct === 'object'
    ? pricingConfig.discount_module_pct
    : {};
  const renewalMode = moduleMeta.__renewalMode === 'auto' ? 'auto' : 'manual';
  const paymentMethod = moduleMeta.__lastPaymentMethod || moduleMeta.__paymentMethod || null;
  return { renewalMode, paymentMethod };
}

async function attemptAutoRenewalPayment({ tenant, invoiceNo, totalPaise, paymentMethod }) {
  // Placeholder until tokenized/mandate-backed recurring payments are enabled.
  logger.warn(`${THEME.ICONS.WARNING} [AutoRenewal] ${tenant.subdomain} ${invoiceNo}: no saved mandate for ${paymentMethod || 'gateway'}, fallback to manual collection.`);
  return {
    attempted: true,
    success: false,
    reason: 'No saved recurring mandate/token configured',
    paymentId: null,
  };
}

/**
 * Generates monthly invoices for all active tenants.
 */
async function generateMonthlyInvoices() {
  logger.info(`${THEME.ICONS.PROCESS} Starting monthly invoice generation...`);

  try {
    // SET LOCAL must be issued and consumed inside the SAME transaction as the
    // query it protects — see backend/shared/utils/rlsContext.js.
    const tenants = await withPlatformAdminRLS(centralPrisma, (tx) => tx.tenants.findMany({
      where: { is_active: true, deleted_at: null },
      include: {
        pricing_config: true,
        modules: { where: { is_active: true } }
      }
    }));

    const results = { success: 0, failed: 0 };

    for (const tenant of tenants) {
      try {
        if (!tenant.pricing_config) continue;

        const { renewalMode, paymentMethod } = getRenewalContext(tenant.pricing_config);

        const employeeCount = tenant.max_employees || 0;
        const activeModules = tenant.modules.map(m => m.module_name);

        // Run the pricing engine
        const calc = calculateSubscription(tenant.pricing_config, activeModules, employeeCount);

        const date = new Date();
        const invoiceNo = `INV-${tenant.subdomain.toUpperCase()}-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        const periodStart = new Date(date.getFullYear(), date.getMonth() - 1, 1);
        const periodEnd = new Date(date.getFullYear(), date.getMonth(), 0);

        let invoiceStatus = 'unpaid';
        let paymentId = null;
        let autoAttempt = { attempted: false, success: false, reason: null };

        if (renewalMode === 'auto') {
          autoAttempt = await attemptAutoRenewalPayment({
            tenant,
            invoiceNo,
            totalPaise: calc.finalPrice,
            paymentMethod,
          });
          if (autoAttempt.success) {
            invoiceStatus = 'paid';
            paymentId = autoAttempt.paymentId || `AUTO-${tenant.id}-${Date.now()}`;
          }
        }

        const dueDate = invoiceStatus === 'paid'
          ? date
          : new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);

        await withPlatformAdminRLS(centralPrisma, (tx) => tx.invoices.create({
          data: {
            tenant_id: tenant.id,
            invoice_no: invoiceNo,
            period_start: periodStart,
            period_end: periodEnd,
            due_date: dueDate,
            base_amount_paise: calc.breakDown.base.final,
            module_amount_paise: calc.breakDown.modules.total,
            excess_amount_paise: calc.breakDown.excessCharges,
            discount_amount_paise: calc.breakDown.discounts.amount + calc.breakDown.discounts.flat,
            tax_amount_paise: calc.breakDown.tax.amount, // Ensuring 18% GST is saved
            total_paise: calc.finalPrice,
            payment_id: paymentId,
            breakdown: {
              ...calc.breakDown,
              renewalMode,
              autoPayment: autoAttempt,
            },
            status: invoiceStatus
          }
        }));

        // Notify Tenant Admin
        const amountFormatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(calc.finalPrice / 100);
        try {
          await billingEmailer.sendInvoiceNotification(tenant.admin_email, invoiceNo, amountFormatted);
        } catch (emailErr) {
          logger.error(`${THEME.ICONS.ERROR} Failed to send invoice notification to ${tenant.admin_email}:`, emailErr);
        }

        results.success++;
      } catch (err) {
        logger.error(`Failed to generate invoice for ${tenant.subdomain}:`, err);
        results.failed++;
      }
    }
    return results;
  } catch (error) {
    logger.error('Fatal error in generateMonthlyInvoices:', error);
    throw error;
  }
}

/**
 * Scans for overdue invoices and automatically suspends tenants.
 */
async function checkOverdueInvoices() {
  logger.info(`${THEME.ICONS.PROCESS} Checking for overdue invoices...`);
  try {
    const overdueInvoices = await withPlatformAdminRLS(centralPrisma, (tx) => tx.invoices.findMany({
      where: {
        status: 'unpaid',
        due_date: { lt: new Date() }
      },
      include: { tenant: true }
    }));

    for (const inv of overdueInvoices) {
      if (inv.tenant.is_active) {
        await withPlatformAdminRLS(centralPrisma, (tx) => tx.tenants.update({
          where: { id: inv.tenant_id },
          data: {
            is_active: false,
            suspended_at: new Date(),
            suspension_reason: `Automatic suspension due to unpaid invoice ${inv.invoice_no}`
          }
        }));
        logger.warn(`${THEME.ICONS.WARNING} Suspended tenant ${inv.tenant.subdomain} for non-payment of ${inv.invoice_no}`);
      }
    }
  } catch (error) {
    logger.error('Error in checkOverdueInvoices:', error);
  }
}

module.exports = { generateMonthlyInvoices, checkOverdueInvoices };
