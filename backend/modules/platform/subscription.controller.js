const { centralPrisma } = require('../../shared/utils/centralPrisma');
const { calculateSubscription } = require('./subscriptionCalculator');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');
const { THEME } = require('../../shared/utils/uiConstants');
const logger = require('../../shared/utils/logger');
const { generateInvoicePDF } = require('../../shared/utils/pdf.service');
const { withTenantRLS, withPlatformAdminRLS } = require('../../shared/utils/rlsContext');
const plansService = require('./plans.service');
const { buildFreePlanEntitlements, buildTrialPlanEntitlements } = require('./subscriptionEntitlements');

/**
 * Fetches the pricing configuration and current subscription status for a tenant.
 */
exports.getTenantPricing = async (req, res) => {
  try {
    const { tenantId } = req.params;

    // SET LOCAL app.current_tenant must be issued and consumed inside the
    // SAME transaction as the queries it protects — see shared/utils/rlsContext.js.
    const [config, modules, tenant] = await withTenantRLS(centralPrisma, tenantId, (tx) => Promise.all([
      tx.tenant_pricing_configs.findUnique({ where: { tenant_id: tenantId } }),
      tx.tenant_modules.findMany({ where: { tenant_id: tenantId, is_active: true } }),
      tx.tenants.findUnique({ where: { id: tenantId }, select: { max_employees: true } })
    ]));

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

    const updated = await withTenantRLS(centralPrisma, tenantId, (tx) => tx.tenant_pricing_configs.update({
      where: { tenant_id: tenantId },
      data: formattedData
    }));

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

    const invoices = await withTenantRLS(centralPrisma, tenantId, (tx) => tx.invoices.findMany({
      where: { tenant_id: tenantId },
      orderBy: { period_start: 'desc' },
      take: 24 // Last 2 years
    }));

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

    const [invoice, tenant] = await withTenantRLS(centralPrisma, tenantId, (tx) => Promise.all([
      tx.invoices.findFirst({ where: { id: invoiceId, tenant_id: tenantId } }),
      tx.tenants.findUnique({ where: { id: tenantId } })
    ]));

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
 * Activates the catalog's permanent Free plan for a newly registered tenant.
 * Registration starts a trial by default; selecting Free during onboarding
 * must explicitly replace that temporary trial with permanent Free entitlements.
 * This path never creates a payment order or invoice.
 */
exports.activateFreePlan = async (req, res) => {
  const tenantId = req.user?.tenantId || req.user?.company_id;
  if (!tenantId) return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Tenant session required', 401);

  try {
    const plans = await plansService.getPlans();
    const freePlan = plans.find((plan) => plan.slug === 'free');
    let entitlements;
    try {
      entitlements = buildFreePlanEntitlements(freePlan);
    } catch (error) {
      logger.error('[activateFreePlan] Free plan catalog is invalid:', error);
      return sendError(res, ERROR_CODES.SERVER, 'The Free plan is not configured correctly. Please contact support.', 503);
    }

    await withPlatformAdminRLS(centralPrisma, async (tx) => {
      await tx.$queryRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
      const tenant = await tx.tenants.findUnique({
        where: { id: tenantId },
        select: { id: true, plan: true, is_active: true },
      });
      if (!tenant || !tenant.is_active) throw new Error('FREE_PLAN_TENANT_NOT_ACTIVE');
      if (!['free', 'trial'].includes(tenant.plan)) throw new Error('FREE_PLAN_TRANSITION_NOT_ALLOWED');

      // A captured subscription payment is an irreversible billing fact.
      // Never let the onboarding Free action downgrade a paid subscription.
      const capturedOrder = await tx.payment_orders.findFirst({
        where: { tenant_id: tenantId, purpose: 'subscription', status: 'captured' },
        select: { id: true },
      });
      if (capturedOrder) throw new Error('FREE_PLAN_PAID_SUBSCRIPTION_EXISTS');

      await tx.tenants.update({
        where: { id: tenantId },
        data: {
          plan: 'free',
          plan_expires_at: null,
          max_employees: entitlements.employeeCap ?? 999999,
        },
      });

      for (const moduleName of entitlements.modules) {
        await tx.tenant_modules.upsert({
          where: { uq_tenant_module: { tenant_id: tenantId, module_name: moduleName } },
          update: { is_active: true, disabled_at: null, enabled_at: new Date() },
          create: { tenant_id: tenantId, module_name: moduleName, is_active: true },
        });
      }
      await tx.tenant_modules.updateMany({
        where: { tenant_id: tenantId, module_name: { notIn: entitlements.modules } },
        data: { is_active: false, disabled_at: new Date() },
      });

      await tx.tenant_pricing_configs.upsert({
        where: { tenant_id: tenantId },
        update: entitlements.pricingConfig,
        create: { tenant_id: tenantId, ...entitlements.pricingConfig },
      });
    });

    return sendSuccess(res, {
      plan: 'free',
      expiresAt: null,
      employeeCap: entitlements.employeeCap,
      modules: entitlements.modules,
    }, 'Free plan activated successfully.');
  } catch (error) {
    if (error.message === 'FREE_PLAN_TENANT_NOT_ACTIVE') {
      return sendError(res, ERROR_CODES.NOT_FOUND, 'Active company account not found.', 404);
    }
    if (error.message === 'FREE_PLAN_TRANSITION_NOT_ALLOWED' || error.message === 'FREE_PLAN_PAID_SUBSCRIPTION_EXISTS') {
      return sendError(res, ERROR_CODES.VALIDATION, 'This account already has a paid or non-onboarding subscription. The Free plan cannot replace it.', 409);
    }
    logger.error('[activateFreePlan] Failed:', error);
    return sendError(res, ERROR_CODES.SERVER, 'Could not activate the Free plan. No plan change was confirmed.', 500);
  }
};

/**
 * Applies the selected eligible plan to the registration trial already granted
 * by registerTenant. Registration controls the trial duration (90 days for
 * managed cloud, 14 days for self-hosted); this endpoint does not extend it.
 */
exports.activateTrial = async (req, res) => {
  const tenantId = req.user?.tenantId || req.user?.company_id;
  if (!tenantId) return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Tenant session required', 401);

  try {
    const { planSlug, selectedAddons = [] } = req.body || {};
    if (typeof planSlug !== 'string' || !planSlug.trim() ||
        !Array.isArray(selectedAddons) || selectedAddons.length > 20 ||
        selectedAddons.some((module) => typeof module !== 'string')) {
      return sendError(res, ERROR_CODES.VALIDATION, 'A valid trial plan and add-on selection are required.', 400);
    }

    const plans = await plansService.getPlans();
    const plan = plans.find((item) => item.slug === planSlug);
    let entitlements;
    try {
      entitlements = buildTrialPlanEntitlements(plan, selectedAddons);
    } catch (error) {
      return sendError(res, ERROR_CODES.VALIDATION, error.message, 400);
    }

    let expiryDate = null;
    await withPlatformAdminRLS(centralPrisma, async (tx) => {
      await tx.$queryRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
      const tenant = await tx.tenants.findUnique({
        where: { id: tenantId },
        select: { id: true, plan: true, plan_expires_at: true, is_active: true },
      });
      if (!tenant || !tenant.is_active) throw new Error('TRIAL_TENANT_NOT_ACTIVE');
      if (tenant.plan !== 'trial' || !tenant.plan_expires_at || new Date(tenant.plan_expires_at) <= new Date()) {
        throw new Error('REGISTRATION_TRIAL_NOT_ACTIVE');
      }

      const capturedOrder = await tx.payment_orders.findFirst({
        where: { tenant_id: tenantId, purpose: 'subscription', status: 'captured' },
        select: { id: true },
      });
      if (capturedOrder) throw new Error('TRIAL_PAID_SUBSCRIPTION_EXISTS');

      expiryDate = tenant.plan_expires_at;
      await tx.tenants.update({
        where: { id: tenantId },
        data: { max_employees: entitlements.employeeCap ?? 999999 },
      });

      for (const moduleName of entitlements.modules) {
        await tx.tenant_modules.upsert({
          where: { uq_tenant_module: { tenant_id: tenantId, module_name: moduleName } },
          update: { is_active: true, disabled_at: null, enabled_at: new Date() },
          create: { tenant_id: tenantId, module_name: moduleName, is_active: true },
        });
      }
      await tx.tenant_modules.updateMany({
        where: { tenant_id: tenantId, module_name: { notIn: entitlements.modules } },
        data: { is_active: false, disabled_at: new Date() },
      });
      await tx.tenant_pricing_configs.upsert({
        where: { tenant_id: tenantId },
        update: entitlements.pricingConfig,
        create: { tenant_id: tenantId, ...entitlements.pricingConfig },
      });
    });

    return sendSuccess(res, {
      plan: 'trial',
      selectedPlan: plan.slug,
      expiresAt: expiryDate,
      employeeCap: entitlements.employeeCap,
      modules: entitlements.modules,
    }, 'Your selected plan is enabled for the existing registration trial.');
  } catch (error) {
    if (error.message === 'TRIAL_TENANT_NOT_ACTIVE') {
      return sendError(res, ERROR_CODES.NOT_FOUND, 'Active company account not found.', 404);
    }
    if (error.message === 'REGISTRATION_TRIAL_NOT_ACTIVE' || error.message === 'TRIAL_PAID_SUBSCRIPTION_EXISTS') {
      return sendError(res, ERROR_CODES.VALIDATION, 'The registration trial is no longer available for this account.', 409);
    }
    logger.error('[activateTrial] Failed:', error);
    return sendError(res, ERROR_CODES.SERVER, 'Could not apply the selected trial plan. No plan change was confirmed.', 500);
  }
};
