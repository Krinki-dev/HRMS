const { centralPrisma } = require('../../shared/utils/centralPrisma');
const { calculateSubscription } = require('./subscriptionCalculator');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');
const { THEME } = require('../../shared/utils/uiConstants');
const logger = require('../../shared/utils/logger');
const { generateInvoicePDF } = require('../../shared/utils/pdf.service');

/**
 * Fetches the pricing configuration and current subscription status for a tenant.
 */
exports.getTenantPricing = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const [config, modules, tenant] = await Promise.all([
      centralPrisma.tenant_pricing_config.findUnique({ where: { tenant_id: tenantId } }),
      centralPrisma.tenant_module.findMany({ where: { tenant_id: tenantId, is_active: true } }),
      centralPrisma.tenants.findUnique({ where: { id: tenantId }, select: { max_employees: true } })
    ]);

    if (!config) {
      return sendError(res, ERROR_CODES.NOT_FOUND, 'Pricing configuration not found.', 404);
    }

    // Get current employee count (This usually comes from the tenant's specific DB)
    // For billing preview, we use the max_employees or a cached count
    const employeeCount = tenant?.max_employees || 0;
    const activeModuleNames = modules.map(m => m.module_name);

    const calculation = calculateSubscription(config, activeModuleNames, employeeCount);

    return sendSuccess(res, {
      config,
      activeModules: activeModuleNames,
      employeeCount,
      currentBillingPreview: calculation
    }, 'Pricing configuration retrieved.');
  } catch (error) {
    logger.error(`${THEME.ICONS.ERROR} [getTenantPricing] Failed:`, error);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to fetch pricing config.', 500);
  }
};

/**
 * Updates the pricing configuration for a tenant.
 */
exports.updateTenantPricing = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const updateData = req.body;

    // Sanitize input: Percentages should be decimals/numbers
    const formattedData = {
      base_price_paise: updateData.basePricePaise,
      employee_cap: updateData.employeeCap,
      discount_base_pct: updateData.discountBasePct,
      discount_bundle_pct: updateData.discountBundlePct,
      bundle_trigger_count: updateData.bundleTriggerCount,
      discount_tenure_pct: updateData.discountTenurePct,
      tenure_months: updateData.tenureMonths,
      offer_flat_paise: updateData.offerFlatPaise,
      offer_expiry_date: updateData.offerExpiryDate ? new Date(updateData.offerExpiryDate) : undefined,
      is_stackable: updateData.isStackable,
      final_override_paise: updateData.finalOverridePaise,
      billing_cycle: updateData.billingCycle,
      discount_module_pct: updateData.discountModulePct // Should be JSON
    };

    // Remove undefined fields
    Object.keys(formattedData).forEach(key => formattedData[key] === undefined && delete formattedData[key]);

    const updated = await centralPrisma.tenant_pricing_config.update({
      where: { tenant_id: tenantId },
      data: formattedData
    });

    logger.info(`${THEME.ICONS.SUCCESS} Updated pricing for tenant ${tenantId}`);
    return sendSuccess(res, updated, 'Pricing configuration updated successfully.');
  } catch (error) {
    logger.error(`${THEME.ICONS.ERROR} [updateTenantPricing] Failed:`, error);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to update pricing.', 500);
  }
};

/**
 * Live preview calculation based on potential configuration changes.
 */
exports.calculatePreview = async (req, res) => {
  try {
    const { config, activeModules, employeeCount } = req.body;

    if (!config) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Configuration object is required.', 400);
    }

    // Transform CamelCase to snake_case for the utility if needed
    const normalizedConfig = {
      ...config,
      base_price_paise: config.basePricePaise,
      discount_base_pct: config.discountBasePct,
      discount_module_pct: config.discountModulePct,
      discount_bundle_pct: config.discountBundlePct,
      bundle_trigger_count: config.bundleTriggerCount,
      discount_tenure_pct: config.discountTenurePct,
      is_stackable: config.isStackable,
      offer_flat_paise: config.offerFlatPaise,
      final_override_paise: config.finalOverridePaise
    };

    const result = calculateSubscription(normalizedConfig, activeModules, employeeCount);
    return sendSuccess(res, result, 'Price preview calculated.');
  } catch (error) {
    return sendError(res, ERROR_CODES.SERVER, 'Calculation failed.', 500);
  }
};

/**
 * Fetches invoice history for a tenant.
 */
exports.getTenantInvoices = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const invoices = await centralPrisma.invoice.findMany({
      where: { tenant_id: tenantId },
      orderBy: { period_start: 'desc' },
      take: 24 // Last 2 years
    });

    return sendSuccess(res, invoices, 'Invoice history retrieved.');
  } catch (error) {
    logger.error(`${THEME.ICONS.ERROR} [getTenantInvoices] Failed:`, error);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to fetch invoices.', 500);
  }
};

/**
 * Generates and downloads the PDF for a specific invoice.
 */
exports.downloadInvoicePDF = async (req, res) => {
  try {
    const { tenantId, invoiceId } = req.params;

    const [invoice, tenant] = await Promise.all([
      centralPrisma.invoice.findFirst({ where: { id: invoiceId, tenant_id: tenantId } }),
      centralPrisma.tenants.findUnique({ where: { id: tenantId } })
    ]);

    if (!invoice || !tenant) {
      return sendError(res, ERROR_CODES.NOT_FOUND, 'Invoice or Tenant not found.', 404);
    }

    const pdfBuffer = await generateInvoicePDF(invoice, tenant);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoice.invoice_no}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    logger.error(`${THEME.ICONS.ERROR} [downloadInvoicePDF] Failed:`, error);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to generate PDF.', 500);
  }
};

/**
 * Fetches subscription details for the logged-in tenant.
 */
exports.getMySubscription = async (req, res) => {
  // Identify tenant from the auth token
  req.params.tenantId = req.user.tenantId;
  return exports.getTenantPricing(req, res);
};

/**
 * Fetches invoice history for the logged-in tenant.
 */
exports.getMyInvoices = async (req, res) => {
  // Identify tenant from the auth token
  req.params.tenantId = req.user.tenantId;
  return exports.getTenantInvoices(req, res);
};

/**
 * Activates the free trial for a tenant during onboarding.
 */
exports.activateTrial = async (req, res) => {
  try {
    // Resolve tenant id: attempt JWT first but validate it exists in central DB.
    let resolvedTenantId = null;
    const jwtTenantId = req.user?.tenantId;

    if (jwtTenantId) {
      try {
        const maybe = await centralPrisma.tenants.findUnique({ where: { id: jwtTenantId }, select: { id: true } });
        if (maybe) resolvedTenantId = maybe.id;
        else logger.warn(`${THEME.ICONS.WARNING} [activateTrial] JWT tenantId present but not found in central DB: ${jwtTenantId}`);
      } catch (e) {
        logger.warn(`${THEME.ICONS.WARNING} [activateTrial] central DB lookup for jwtTenantId failed: ${e.message}`);
      }
    }

    // Next, prefer req.tenant set by tenantMiddleware (dev fallback or resolved tenant)
    if (!resolvedTenantId && req.tenant?.id) resolvedTenantId = req.tenant.id;

    // Finally, attempt to resolve from header subdomain
    if (!resolvedTenantId) {
      const subdomain = req.headers['x-tenant-subdomain'] || req.headers['x-tenant'];
      if (subdomain) {
        try {
          const t = await centralPrisma.tenants.findFirst({ where: { subdomain } });
          if (t) resolvedTenantId = t.id;
        } catch (e) {
          logger.warn(`${THEME.ICONS.WARNING} [activateTrial] central DB lookup for subdomain failed: ${e.message}`);
        }
      }
    }

    if (!resolvedTenantId) {
      logger.warn(`${THEME.ICONS.WARNING} [activateTrial] Tenant resolution failed: no tenantId in JWT, req.tenant or X-Tenant-Subdomain`);
      return sendError(res, ERROR_CODES.NOT_FOUND, 'Tenant not resolved. Ensure you are calling from a tenant context or include X-Tenant-Subdomain header.', 404);
    }

    let tenant;
    try {
      tenant = await centralPrisma.tenants.findUnique({
        where: { id: resolvedTenantId },
        select: { id: true, plan: true, db_mode: true }
      });
    } catch (err) {
      logger.warn(`${THEME.ICONS.WARNING} [activateTrial] central DB lookup failed: ${err.message}`);
      // In development, allow onboarding to continue even if central DB is unreachable.
      if (process.env.NODE_ENV === 'development' && req.tenant) {
        const trialDays = req.tenant.dbMode === 'cloud' ? 90 : 14;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + trialDays);
        logger.warn(`${THEME.ICONS.WARNING} [activateTrial] Dev fallback — returning mock trial expiry for tenant ${req.tenant.subdomain}`);
        return sendSuccess(res, { expiryDate }, 'Trial activated (dev fallback).');
      }
      return sendError(res, ERROR_CODES.SERVER, 'Central database unavailable. Try again later.', 503);
    }

    if (!tenant) {
      logger.warn(`${THEME.ICONS.WARNING} [activateTrial] Tenant not found in central DB: ${resolvedTenantId}`);
      if (process.env.NODE_ENV === 'development' && req.tenant) {
        const trialDays = req.tenant.dbMode === 'cloud' ? 90 : 14;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + trialDays);
        logger.warn(`${THEME.ICONS.WARNING} [activateTrial] Dev fallback — tenant missing in central DB, returning mock trial expiry for ${req.tenant.subdomain}`);
        return sendSuccess(res, { expiryDate }, 'Trial activated (dev fallback).');
      }
      return sendError(res, ERROR_CODES.NOT_FOUND, 'Tenant not found in central database.', 404);
    }

    const trialDays = tenant.db_mode === 'cloud' ? 90 : 14;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + trialDays);

    try {
      await centralPrisma.$transaction([
        centralPrisma.tenants.update({
          where: { id: resolvedTenantId },
          data: { plan: 'trial', plan_expires_at: expiryDate }
        }),
        centralPrisma.tenant_pricing_config.upsert({
          where: { tenant_id: resolvedTenantId },
          update: { offer_expiry_date: expiryDate },
          create: {
            tenant_id: resolvedTenantId,
            base_price_paise: 149900,
            employee_cap: 25,
            offer_expiry_date: expiryDate
          }
        })
      ]);
    } catch (err) {
      logger.warn(`${THEME.ICONS.WARNING} [activateTrial] central DB transaction failed: ${err.message}`);
      if (process.env.NODE_ENV === 'development') {
        logger.warn(`${THEME.ICONS.WARNING} [activateTrial] Dev fallback — returning success despite central DB transaction failure.`);
        return sendSuccess(res, { expiryDate }, 'Trial activated (dev fallback).');
      }
      return sendError(res, ERROR_CODES.SERVER, 'Failed to activate trial.', 500);
    }

    return sendSuccess(res, { expiryDate }, 'Trial activated successfully.');
  } catch (error) {
    logger.error(`${THEME.ICONS.ERROR} [activateTrial] Failed:`, error);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to activate trial.', 500);
  }
};

