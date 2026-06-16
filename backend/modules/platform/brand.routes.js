/**
 * @file brand.routes.js
 * @description Handles dynamic branding lookups for tenants.
 */
const express = require('express');
const router = express.Router();
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');
const { centralPrisma } = require('../../shared/utils/centralPrisma');
const logger = require('../../shared/utils/logger');

/**
 * GET /brand
 * Fetches tenant-specific branding like colors and logos based on hostname.
 */
router.get('/brand', async (req, res) => {
  try {
    const { subdomain, hostname, domain: customdomain } = req.query;
    const host = req.hostname;

    let lookupSubdomain = (subdomain || hostname || customdomain)?.toLowerCase?.().trim();
    if (!lookupSubdomain && host) {
      if (host.endsWith('.localhost')) {
        lookupSubdomain = host.split('.')[0];
      } else if (host.endsWith('.syntern.in')) {
        lookupSubdomain = host.split('.')[0];
      } else {
        lookupSubdomain = host;
      }
    }

    if (!lookupSubdomain) {
      return sendError(res, ERROR_CODES.VALIDATION, 'subdomain or domain required', 400);
    }

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
        WHERE (LOWER(subdomain) = LOWER(${lookupSubdomain}) OR LOWER(custom_domain) = LOWER(${lookupSubdomain}))
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
        WHERE (LOWER(subdomain) = LOWER(${lookupSubdomain}) OR LOWER(custom_domain) = LOWER(${lookupSubdomain}))
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

module.exports = router;
