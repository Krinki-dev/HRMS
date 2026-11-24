/**
 * @file brand.routes.js
 * @description Handles dynamic branding lookups for tenants.
 */
const express = require('express');
const router = express.Router();
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');
const { centralPrisma } = require('../../shared/utils/centralPrisma');
const logger = require('../../shared/utils/logger');
const { normalizeHostname, buildHostnameCandidates } = require('../../shared/utils/domainRouting');

/**
 * GET /brand
 * Fetches tenant-specific branding like colors and logos based on hostname.
 */
router.get('/brand', async (req, res) => {
  try {
    const { subdomain, hostname, domain: customdomain } = req.query;
    const host = normalizeHostname(req.hostname || req.headers.host || '');

    let lookupSubdomain = (subdomain || hostname || customdomain)?.toLowerCase?.().trim();
    let lookupDomain = null;
    if (!lookupSubdomain && host) {
      lookupDomain = host;
    } else if (lookupSubdomain && !lookupSubdomain.includes('.')) {
      lookupSubdomain = lookupSubdomain.trim();
    }

    if (!lookupSubdomain && !lookupDomain) {
      return sendError(res, ERROR_CODES.VALIDATION, 'subdomain or domain required', 400);
    }

    const hostnameCandidates = buildHostnameCandidates(lookupDomain || lookupSubdomain || host || '');
    const lookupValues = [...new Set([lookupSubdomain, lookupDomain, ...(hostnameCandidates || [])].filter(Boolean))];

    let rows = [];
    try {
      rows = await centralPrisma.$queryRaw`
        SELECT
          subdomain,
          custom_domain,
          name           AS company_name,
          logo_url,
          primary_color,
          background_color,
          background_url,
          sitemap_url
        FROM tenants
        WHERE (
          LOWER(subdomain) = LOWER(${lookupSubdomain || ''})
          OR LOWER(custom_domain) = LOWER(${lookupDomain || lookupSubdomain || ''})
          OR LOWER(custom_domain) = LOWER(${lookupDomain ? lookupDomain.replace(/^hrms\./, '') : ''})
          OR LOWER(custom_domain) = LOWER(${lookupDomain ? `hrms.${lookupDomain.replace(/^hrms\./, '')}` : ''})
        )
          AND deleted_at IS NULL
          AND is_active = true
        LIMIT 1
      `;
    } catch (dbErr) {
      // Fallback to basic columns if branding columns are missing from schema
      logger.warn(`[Brand] Advanced columns missing, falling back to basic query: ${dbErr.message}`);
      rows = await centralPrisma.$queryRaw`
        SELECT subdomain, custom_domain, name AS company_name, logo_url
        FROM tenants
        WHERE (
          LOWER(subdomain) = LOWER(${lookupSubdomain || ''})
          OR LOWER(custom_domain) = LOWER(${lookupDomain || lookupSubdomain || ''})
          OR LOWER(custom_domain) = LOWER(${lookupDomain ? lookupDomain.replace(/^hrms\./, '') : ''})
          OR LOWER(custom_domain) = LOWER(${lookupDomain ? `hrms.${lookupDomain.replace(/^hrms\./, '')}` : ''})
        )
          AND deleted_at IS NULL
          AND is_active = true
        LIMIT 1
      `;
    }

    if (rows.length === 0) {
      // Development Fallback: Allow the login page to load even if the tenant record isn't in central DB yet
      if (process.env.NODE_ENV === 'development') {
        logger.info(`[Brand] Subdomain "${lookupSubdomain}" not found. Returning dev fallback branding.`);
        return sendSuccess(res, {
          companyName:     'Syntern Dev Portal',
          subdomain:       lookupSubdomain,
          logoUrl:         null,
          primaryColor:    '#2563EB',
          backgroundColor: '#040C1A',
          backgroundUrl:   null,
          sitemapUrl:      `https://${lookupSubdomain}.syntern.in/sitemap.xml`,
        });
      }
      return sendError(res, ERROR_CODES.NOT_FOUND, 'No company found for this portal address', 404);
    }

    const tenant = rows[0];
    return sendSuccess(res, {
      companyName:     tenant.company_name,
      subdomain:       tenant.subdomain,
      logoUrl:         tenant.logo_url        || null,
      primaryColor:    tenant.primary_color   || '#2563EB',
      backgroundColor: tenant.background_color || '#040C1A',
      backgroundUrl:   tenant.background_url  || null,
      sitemapUrl:      tenant.sitemap_url     || (tenant.custom_domain ? `https://${tenant.custom_domain}/sitemap.xml` : `https://${tenant.subdomain}.syntern.in/sitemap.xml`),
    });

  } catch (err) {
    logger.error('[Brand] Lookup Failure:', err);
    if (err?.message?.includes('column')) {
      logger.error('[Brand] Schema mismatch: columns missing in tenants table.');
    }
    return sendError(res, ERROR_CODES.SERVER, 'Failed to fetch branding', 500);
  }
});


const auth = require('../../shared/middleware/auth');
const { upsertBackupConfigForTenant } = require('./tenantDeletion.service');

/**
 * Persist only completion metadata for onboarding steps. Secrets remain in their
 * dedicated encrypted configuration stores and are never copied into this JSON.
 */
const ONBOARDING_STEPS = new Set(['org', 'branding', 'work', 'payroll', 'email', 'compliance', 'backup']);


// Return persisted step markers so a customer can resume onboarding after login/reload.
router.get('/onboarding/progress', auth, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || req.user?.company_id;
    if (!tenantId) return sendError(res, ERROR_CODES.VALIDATION, 'Tenant ID required', 400);
    const rows = await centralPrisma.$queryRaw`
      SELECT onboarding_progress, is_setup_complete
      FROM tenants WHERE id = ${tenantId}::uuid AND deleted_at IS NULL LIMIT 1
    `;
    if (!rows.length) return sendError(res, ERROR_CODES.NOT_FOUND, 'Company account not found', 404);
    return sendSuccess(res, {
      progress: rows[0].onboarding_progress || {},
      isSetupComplete: rows[0].is_setup_complete === true,
    }, 'Onboarding progress retrieved');
  } catch (err) {
    logger.error('[onboarding/progress]', err);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to load onboarding progress', 500);
  }
});

router.post('/onboarding/save-step', auth, async (req, res) => {
  try {
    const { step, data = {}, skipped = false } = req.body || {};
    const tenantId = req.user?.tenantId || req.user?.company_id;
    if (!tenantId) return sendError(res, ERROR_CODES.VALIDATION, 'Tenant ID required', 400);
    if (!ONBOARDING_STEPS.has(step)) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Unknown onboarding step', 400);
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Invalid step data', 400);
    }

    if (step === 'branding' && data.logoUrl) {
      const logoUrl = String(data.logoUrl).trim();
      if (!/^https:\/\//i.test(logoUrl)) {
        return sendError(res, ERROR_CODES.VALIDATION, 'Logo must use a secure HTTPS URL', 400);
      }
      await centralPrisma.$executeRaw`
        UPDATE tenants SET logo_url = ${logoUrl}, updated_at = NOW()
        WHERE id = ${tenantId}::uuid AND deleted_at IS NULL
      `;
    }

    if (step === 'backup' && !skipped) {
      await upsertBackupConfigForTenant(centralPrisma, tenantId, data);
    }

    // Record only status metadata; never persist passwords, OAuth tokens, SMTP
    // credentials, PF/ESI credentials, or arbitrary client-supplied step data.
    const marker = { completed: true, skipped: Boolean(skipped), updatedAt: new Date().toISOString() };
    const rows = await centralPrisma.$queryRaw`
      UPDATE tenants
      SET onboarding_progress = COALESCE(onboarding_progress, '{}'::jsonb)
            || jsonb_build_object(${step}, ${JSON.stringify(marker)}::jsonb),
          updated_at = NOW()
      WHERE id = ${tenantId}::uuid AND deleted_at IS NULL
      RETURNING id
    `;
    if (!rows.length) return sendError(res, ERROR_CODES.NOT_FOUND, 'Company account not found', 404);
    return sendSuccess(res, { step, ...marker }, 'Onboarding progress saved');
  } catch (err) {
    logger.error('[onboarding/save-step]', err);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to save onboarding step', 500);
  }
});

/**
 * Mark onboarding complete only after all required steps have a persisted
 * completion marker. Skipped steps are explicit customer choices, not missing data.
 */
router.post('/onboarding/complete', auth, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || req.user?.company_id;
    if (!tenantId) return sendError(res, ERROR_CODES.VALIDATION, 'Tenant ID required', 400);
    const requiredSteps = ['org', 'work', 'payroll', 'email', 'compliance', 'backup'];
    const rows = await centralPrisma.$queryRaw`
      SELECT id, is_active, onboarding_progress
      FROM tenants
      WHERE id = ${tenantId}::uuid AND deleted_at IS NULL
      LIMIT 1
    `;
    const tenant = rows[0];
    if (!tenant) return sendError(res, ERROR_CODES.NOT_FOUND, 'Company account not found', 404);
    if (!tenant.is_active) return sendError(res, ERROR_CODES.FORBIDDEN, 'Company account is not active', 403);

    const progress = tenant.onboarding_progress || {};
    const missing = requiredSteps.filter((key) => progress[key]?.completed !== true);
    if (missing.length) {
      return sendError(res, ERROR_CODES.VALIDATION,
        'Complete or explicitly skip each remaining setup step before launching.',
        409, { missingSteps: missing });
    }

    await centralPrisma.$executeRaw`
      UPDATE tenants SET is_setup_complete = true, updated_at = NOW()
      WHERE id = ${tenantId}::uuid AND deleted_at IS NULL
    `;
    return sendSuccess(res, { isSetupComplete: true }, 'Company setup completed');
  } catch (err) {
    logger.error('[onboarding/complete]', err);
    return sendError(res, ERROR_CODES.SERVER, 'Could not complete company setup', 500);
  }
});

module.exports = router;
