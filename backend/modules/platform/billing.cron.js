const cron = require('node-cron');
const { generateMonthlyInvoices, checkOverdueInvoices } = require('./billing.service');
const logger = require('../../shared/utils/logger');
const { THEME } = require('../../shared/utils/uiConstants');

/**
 * Schedules the monthly billing job.
 * Pattern: 0 0 1 * * (Minute 0, Hour 0, Day 1 of every month)
 */
function startBillingCron() {
  cron.schedule('0 0 1 * *', async () => {
    logger.info(`${THEME.ICONS.PROCESS} [Cron] Triggering monthly invoice generation...`);
    try {
      const results = await generateMonthlyInvoices();
      logger.info(`${THEME.ICONS.SUCCESS} [Cron] Monthly billing complete: ${results.success} succeeded, ${results.failed} failed.`);
    } catch (err) {
      logger.error(`${THEME.ICONS.ERROR} [Cron] Monthly billing job failed!`, err);
    }
  });

  // Daily job at 01:00 AM to check for overdue payments and suspend access
  cron.schedule('0 1 * * *', async () => {
    logger.info(`${THEME.ICONS.PROCESS} [Cron] Running daily overdue check...`);
    try {
      await checkOverdueInvoices();
    } catch (err) {
      logger.error(`${THEME.ICONS.ERROR} [Cron] Overdue invoice check failed!`, err);
    }
  });
}

module.exports = { startBillingCron };

