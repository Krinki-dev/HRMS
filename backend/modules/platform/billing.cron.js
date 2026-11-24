'use strict';

const cron = require('node-cron');
const { generateMonthlyInvoices, checkOverdueInvoices } = require('./billing.service');
const logger = require('../../shared/utils/logger');
const { THEME } = require('../../shared/utils/uiConstants');

/**
 * Runs renewal generation daily because prepaid subscriptions can expire on
 * any calendar day. The service is idempotent per tenant and expiry date.
 */
function startBillingCron() {
  cron.schedule('5 0 * * *', async () => {
    logger.info(`${THEME.ICONS.PROCESS} [Cron] Triggering daily subscription renewal invoice generation...`);
    try {
      const results = await generateMonthlyInvoices();
      logger.info(`${THEME.ICONS.SUCCESS} [Cron] Renewal invoice generation complete: ${results.success} created, ${results.skipped} skipped, ${results.failed} failed.`);
    } catch (error) {
      logger.error(`${THEME.ICONS.ERROR} [Cron] Renewal invoice generation failed!`, error);
    }
  });

  cron.schedule('0 1 * * *', async () => {
    logger.info(`${THEME.ICONS.PROCESS} [Cron] Running daily overdue check...`);
    try {
      await checkOverdueInvoices();
    } catch (error) {
      logger.error(`${THEME.ICONS.ERROR} [Cron] Overdue invoice check failed!`, error);
    }
  });
}

module.exports = { startBillingCron };
