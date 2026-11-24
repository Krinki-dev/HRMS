'use strict';

const { centralPrisma } = require('../../shared/utils/centralPrisma');
const { calculateSubscription } = require('./subscriptionCalculator');
const { getMonthlyRenewalPeriod, buildRenewalInvoiceNumber } = require('./billingRenewal');
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

/**
 * Creates a one-month manual renewal invoice only after the prepaid term ends.
 * Legacy paid tenants without plan_expires_at are deliberately skipped for
 * manual reconciliation; the system must not guess their billing dates.
 */
async function generateMonthlyInvoices(now = new Date()) {
  logger.info(`${THEME.ICONS.PROCESS} Starting subscription renewal invoice generation...`);
  try {
    const tenants = await withPlatformAdminRLS(centralPrisma, (tx) => tx.tenants.findMany({
      where: {
        is_active: true,
        deleted_at: null,
        plan: { notIn: ['free', 'trial'] },
        plan_expires_at: { lte: now },
      },
      include: {
        tenant_pricing_configs: true,
        tenant_modules: { where: { is_active: true } },
      },
    }));

    const results = { success: 0, failed: 0, skipped: 0 };
    for (const tenant of tenants) {
      try {
        if (!tenant.tenant_pricing_configs) {
          results.skipped++;
          continue;
        }
        const period = getMonthlyRenewalPeriod(tenant.plan_expires_at, now);
        if (!period) {
          results.skipped++;
          continue;
        }

        const legacyRenewal = getRenewalContext(tenant.tenant_pricing_configs);
        if (legacyRenewal.renewalMode === 'auto') {
          logger.warn(`[Billing] Ignoring legacy automatic-renewal setting for ${tenant.subdomain}; manual renewal is enforced.`);
        }

        const employeeCount = tenant.max_employees || 0;
        const activeModules = tenant.tenant_modules.map((module) => module.module_name);
        const calc = calculateSubscription(tenant.tenant_pricing_configs, activeModules, employeeCount);
        if (!Number.isSafeInteger(calc.finalPrice) || calc.finalPrice <= 0) {
          throw new Error('Calculated monthly renewal amount is invalid.');
        }

        const invoiceNo = buildRenewalInvoiceNumber(tenant.subdomain, period.periodStart);
        const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const breakdown = {
          billingType: 'manual_subscription_renewal',
          renewalMode: 'manual',
          renewalMonths: 1,
          renewalStartAt: period.startAt.toISOString(),
          renewalExpiresAt: period.expiresAt.toISOString(),
          monthlyPricing: calc.breakDown,
          autoPayment: { attempted: false, success: false, reason: 'Manual renewal is enforced at launch' },
        };

        const inserted = await withPlatformAdminRLS(centralPrisma, (tx) => tx.invoices.createMany({
          data: [{
            tenant_id: tenant.id,
            invoice_no: invoiceNo,
            period_start: period.periodStart,
            period_end: period.periodEnd,
            due_date: dueDate,
            base_amount_paise: calc.breakDown.base?.final || 0,
            module_amount_paise: calc.breakDown.modules?.total || 0,
            excess_amount_paise: calc.breakDown.excessCharges || 0,
            discount_amount_paise: (calc.breakDown.discounts?.amount || 0) + (calc.breakDown.discounts?.flat || 0),
            tax_amount_paise: calc.breakDown.tax?.amount || 0,
            total_paise: calc.finalPrice,
            currency: 'INR',
            payment_id: null,
            breakdown,
            status: 'unpaid',
          }],
          skipDuplicates: true,
        }));

        if (inserted.count === 0) {
          logger.info(`[Billing] Renewal invoice ${invoiceNo} already exists; skipping duplicate cron execution.`);
          results.skipped++;
          continue;
        }

        const amountFormatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
          .format(calc.finalPrice / 100);
        try {
          await billingEmailer.sendInvoiceNotification(tenant.admin_email, invoiceNo, amountFormatted);
        } catch (emailError) {
          logger.error(`${THEME.ICONS.ERROR} Failed to send renewal invoice notification to ${tenant.admin_email}:`, emailError);
        }
        results.success++;
      } catch (error) {
        logger.error(`Failed to generate renewal invoice for ${tenant.subdomain}:`, error);
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
 * Suspends tenants only after an unpaid invoice reaches its due date.
 * The tenant middleware retains a narrow authenticated billing-recovery path.
 */
async function checkOverdueInvoices(now = new Date()) {
  logger.info(`${THEME.ICONS.PROCESS} Checking for overdue invoices...`);
  try {
    const overdueInvoices = await withPlatformAdminRLS(centralPrisma, (tx) => tx.invoices.findMany({
      where: { status: 'unpaid', due_date: { lt: now } },
      include: { tenant: true },
    }));

    for (const invoice of overdueInvoices) {
      if (invoice.tenant.is_active) {
        await withPlatformAdminRLS(centralPrisma, (tx) => tx.tenants.updateMany({
          where: { id: invoice.tenant_id, is_active: true },
          data: {
            is_active: false,
            suspended_at: now,
            suspension_reason: `Automatic suspension due to unpaid invoice ${invoice.invoice_no}`,
          },
        }));
        logger.warn(`${THEME.ICONS.WARNING} Suspended tenant ${invoice.tenant.subdomain} for non-payment of ${invoice.invoice_no}`);
      }
    }
  } catch (error) {
    logger.error('Error in checkOverdueInvoices:', error);
  }
}

module.exports = { generateMonthlyInvoices, checkOverdueInvoices };
