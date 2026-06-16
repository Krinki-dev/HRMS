'use strict';
/**
 * @file plans.routes.js
 * Mount ONCE in server.js at: app.use('/api/v1/platform', require('./modules/platform/plans.routes'));
 *
 * PUBLIC (no auth):
 *   GET  /api/v1/platform/plans                  → list active plans for onboarding
 *   POST /api/v1/platform/plans/calculate         → real-time price calculator
 *   POST /api/v1/platform/plans/validate-promo    → promo code check
 *
 * ADMIN (requires is_platform_admin):
 *   GET    /api/v1/platform/admin/plans            → all plans (incl. inactive)
 *   POST   /api/v1/platform/admin/plans            → create plan
 *   PUT    /api/v1/platform/admin/plans/:id        → update plan
 *   DELETE /api/v1/platform/admin/plans/:id        → delete plan
 *   GET    /api/v1/platform/admin/plans/pricing    → get module pricing
 *   PUT    /api/v1/platform/admin/plans/pricing    → save module pricing
 *   GET    /api/v1/platform/admin/plans/discounts  → get discount config
 *   PUT    /api/v1/platform/admin/plans/discounts  → save discount config
 *   GET    /api/v1/platform/admin/plans/promos     → list promo codes
 *   POST   /api/v1/platform/admin/plans/promos     → create/update promo code
 *   DELETE /api/v1/platform/admin/plans/promos/:code → delete promo
 */
const express = require('express');
const router  = express.Router();
const auth    = require('../../shared/middleware/auth');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');
const logger  = require('../../shared/utils/logger');
const svc     = require('./plans.service');

function superAdmin(req, res, next) {
  if (!req.user?.is_platform_admin && req.user?.role !== 'super_admin')
    return sendError(res, ERROR_CODES.FORBIDDEN, 'Super admin access required', 403);
  next();
}

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC — no auth, used during tenant onboarding
// ══════════════════════════════════════════════════════════════════════════════

router.get('/plans', async (req, res) => {
  try {
    const [plans, modulePricing, discounts] = await Promise.all([
      svc.getPlans(),
      svc.getModulePricing(),
      svc.getDiscounts(),
    ]);
    return sendSuccess(res, { plans, modulePricing, discounts });
  } catch (err) {
    logger.error('[plans/list]', err);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to load plans', 500);
  }
});

router.post('/plans/calculate', async (req, res) => {
  try {
    const { planSlug, selectedAddons, billingMonths, employeeCount, promoCode } = req.body;
    if (!planSlug) return sendError(res, ERROR_CODES.VALIDATION, 'planSlug required', 400);
    const result = await svc.calculatePrice({ planSlug, selectedAddons, billingMonths, employeeCount, promoCode });
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, ERROR_CODES.SERVER, err.message || 'Calculation failed', 500);
  }
});

router.post('/plans/validate-promo', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return sendError(res, ERROR_CODES.VALIDATION, 'code required', 400);
    const promo = await svc.validatePromoCode(code);
    if (!promo) return sendError(res, ERROR_CODES.NOT_FOUND, 'Invalid or expired promo code', 404);
    return sendSuccess(res, { promo }, 'Promo code applied!');
  } catch (err) {
    return sendError(res, ERROR_CODES.SERVER, 'Validation failed', 500);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — platform owner only
// NOTE: /admin/* paths are served at /api/v1/platform/admin/* because this
//       router is mounted at /api/v1/platform — NOT inside admin.routes.js
// ══════════════════════════════════════════════════════════════════════════════

router.get('/admin/plans', auth, superAdmin, async (req, res) => {
  try {
    const [plans, modulePricing, discounts, promoCodes] = await Promise.all([
      svc.getPlans({ includeInactive: true }),
      svc.getModulePricing(),
      svc.getDiscounts(),
      svc.getPromoCodes(),
    ]);
    return sendSuccess(res, { plans, modulePricing, discounts, promoCodes });
  } catch (err) {
    return sendError(res, ERROR_CODES.SERVER, 'Failed to load plan catalog', 500);
  }
});

router.post('/admin/plans', auth, superAdmin, async (req, res) => {
  try {
    const plan = await svc.savePlan({ ...req.body });
    logger.info(`[Admin] Plan created: ${plan.name} by ${req.user?.email}`);
    return sendSuccess(res, plan, 'Plan created');
  } catch (err) {
    return sendError(res, ERROR_CODES.SERVER, err.message || 'Create failed', 500);
  }
});

router.put('/admin/plans/pricing', auth, superAdmin, async (req, res) => {
  try {
    const pricing = await svc.saveModulePricing(req.body);
    logger.info(`[Admin] Module pricing updated by ${req.user?.email}`);
    return sendSuccess(res, pricing, 'Module pricing saved');
  } catch (err) {
    return sendError(res, ERROR_CODES.SERVER, 'Save failed', 500);
  }
});

router.get('/admin/plans/pricing', auth, superAdmin, async (req, res) => {
  try { return sendSuccess(res, await svc.getModulePricing()); }
  catch (err) { return sendError(res, ERROR_CODES.SERVER, 'Failed', 500); }
});

router.put('/admin/plans/discounts', auth, superAdmin, async (req, res) => {
  try {
    const d = await svc.saveDiscounts(req.body);
    return sendSuccess(res, d, 'Discounts saved');
  } catch (err) {
    return sendError(res, ERROR_CODES.SERVER, 'Save failed', 500);
  }
});

router.get('/admin/plans/discounts', auth, superAdmin, async (req, res) => {
  try { return sendSuccess(res, await svc.getDiscounts()); }
  catch (err) { return sendError(res, ERROR_CODES.SERVER, 'Failed', 500); }
});

router.get('/admin/plans/promos', auth, superAdmin, async (req, res) => {
  try { return sendSuccess(res, await svc.getPromoCodes()); }
  catch (err) { return sendError(res, ERROR_CODES.SERVER, 'Failed', 500); }
});

router.post('/admin/plans/promos', auth, superAdmin, async (req, res) => {
  try {
    const { code, type, value_paise, value_pct, expiry, is_active = true, description } = req.body;
    if (!code || !type) return sendError(res, ERROR_CODES.VALIDATION, 'code and type required', 400);
    const promo = await svc.savePromoCode({ code: code.toUpperCase(), type, value_paise, value_pct, expiry, is_active, description });
    return sendSuccess(res, promo, 'Promo code saved');
  } catch (err) {
    return sendError(res, ERROR_CODES.SERVER, 'Save failed', 500);
  }
});

router.delete('/admin/plans/promos/:code', auth, superAdmin, async (req, res) => {
  try {
    await svc.deletePromoCode(req.params.code);
    return sendSuccess(res, null, 'Deleted');
  } catch (err) {
    return sendError(res, ERROR_CODES.SERVER, 'Failed', 500);
  }
});

// ─── PUT and DELETE for plans come AFTER /pricing and /discounts to avoid
//     Express matching ":id" as "pricing" or "discounts"
router.put('/admin/plans/:id', auth, superAdmin, async (req, res) => {
  try {
    const plan = await svc.savePlan({ ...req.body, id: req.params.id });
    return sendSuccess(res, plan, 'Plan updated');
  } catch (err) {
    return sendError(res, ERROR_CODES.SERVER, err.message || 'Update failed', 500);
  }
});

router.delete('/admin/plans/:id', auth, superAdmin, async (req, res) => {
  try {
    await svc.deletePlan(req.params.id);
    return sendSuccess(res, null, 'Plan deleted');
  } catch (err) {
    return sendError(res, ERROR_CODES.SERVER, 'Delete failed', 500);
  }
});

module.exports = router;
