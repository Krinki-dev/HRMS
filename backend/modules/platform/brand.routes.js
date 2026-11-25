/**
 * @file brand.routes.js
 * @description Handles dynamic branding lookups for tenants.
 */
const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const { scanBuffer } = require('../../shared/utils/clamavScanner');
const { withTenantRLS, withPlatformAdminRLS } = require('../../shared/utils/rlsContext');
const { resolveCentralTenantId } = require('../../shared/utils/tenantResolver');
const minio = require('../../shared/utils/minio');
const router = express.Router();
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');
const { centralPrisma } = require('../../shared/utils/centralPrisma');
const logger = require('../../shared/utils/logger');
const { normalizeHostname, buildHostnameCandidates } = require('../../shared/utils/domainRouting');

/**
 * GET /marketing
 * Public, read-only landing-page content. Never exposes platform secrets.
 */
router.get('/marketing', async (req, res) => {
  try {
    const rows = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
      SELECT values
      FROM platform_settings
      WHERE id = 'Marketing'
      LIMIT 1
    `);
    const values = rows[0]?.values || {};
    return sendSuccess(res, {
      heroHeading: typeof values.heroHeading === 'string' ? values.heroHeading : null,
      heroSubhead: typeof values.heroSubhead === 'string' ? values.heroSubhead : null,
      ctaText: typeof values.ctaText === 'string' ? values.ctaText : null,
      ctaUrl: typeof values.ctaUrl === 'string' ? values.ctaUrl : null,
      ctaSub: typeof values.ctaSub === 'string' ? values.ctaSub.slice(0, 180) : null,
      bottomCtaHeading: typeof values.bottomCtaHeading === 'string' ? values.bottomCtaHeading.slice(0, 180) : null,
      bottomCtaSubhead: typeof values.bottomCtaSubhead === 'string' ? values.bottomCtaSubhead.slice(0, 400) : null,
      bottomCtaPrimaryText: typeof values.bottomCtaPrimaryText === 'string' ? values.bottomCtaPrimaryText.slice(0, 50) : null,
      bottomCtaPrimaryUrl: typeof values.bottomCtaPrimaryUrl === 'string' && values.bottomCtaPrimaryUrl.startsWith('/') && !values.bottomCtaPrimaryUrl.startsWith('//') ? values.bottomCtaPrimaryUrl.slice(0, 180) : null,
      bottomCtaSecondaryText: typeof values.bottomCtaSecondaryText === 'string' ? values.bottomCtaSecondaryText.slice(0, 50) : null,
      bottomCtaSecondaryUrl: typeof values.bottomCtaSecondaryUrl === 'string' && values.bottomCtaSecondaryUrl.startsWith('/') && !values.bottomCtaSecondaryUrl.startsWith('//') ? values.bottomCtaSecondaryUrl.slice(0, 180) : null,
      bottomCtaContactText: typeof values.bottomCtaContactText === 'string' ? values.bottomCtaContactText.slice(0, 50) : null,
      bottomCtaContactUrl: typeof values.bottomCtaContactUrl === 'string' && values.bottomCtaContactUrl.startsWith('/') && !values.bottomCtaContactUrl.startsWith('//') ? values.bottomCtaContactUrl.slice(0, 180) : null,
      features: Array.isArray(values.features) ? values.features.slice(0, 12).filter((item) =>
        item && typeof item.icon === 'string' && typeof item.title === 'string' && typeof item.desc === 'string'
      ).map((item) => ({
        icon: item.icon.slice(0, 8),
        title: item.title.slice(0, 100),
        desc: item.desc.slice(0, 300),
      })) : null,
      testimonials: Array.isArray(values.testimonials) ? values.testimonials.slice(0, 8).filter((item) =>
        item && typeof item.quote === 'string' && typeof item.author === 'string'
      ).map((item) => ({
        quote: item.quote.slice(0, 500),
        author: item.author.slice(0, 100),
        role: typeof item.role === 'string' ? item.role.slice(0, 100) : '',
        company: typeof item.company === 'string' ? item.company.slice(0, 100) : '',
      })) : null,
    });
  } catch (err) {
    logger.warn(`[Marketing] Public content unavailable: ${err.message}`);
    return sendSuccess(res, {});
  }
});

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
      rows = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
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
      `);
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
const ONBOARDING_STEPS = new Set(['org', 'branding', 'work', 'payroll', 'email', 'compliance', 'documents', 'backup']);


// Return persisted step markers so a customer can resume onboarding after login/reload.
router.get('/onboarding/progress', auth, async (req, res) => {
  try {
    const tenantId = resolveCentralTenantId(req);
    if (!tenantId) return sendError(res, ERROR_CODES.VALIDATION, 'Tenant ID required', 400);
    const rows = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
      SELECT onboarding_progress, is_setup_complete
      FROM tenants WHERE id = ${tenantId}::uuid AND deleted_at IS NULL LIMIT 1
    `);
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
    const tenantId = resolveCentralTenantId(req);
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
      await withPlatformAdminRLS(centralPrisma, (tx) => tx.$executeRaw`
        UPDATE tenants SET logo_url = ${logoUrl}, updated_at = NOW()
        WHERE id = ${tenantId}::uuid AND deleted_at IS NULL
      `);
    }

    if (step === 'backup' && !skipped) {
      await withPlatformAdminRLS(centralPrisma, (tx) => upsertBackupConfigForTenant(tx, tenantId, data));
    }

    // Record only status metadata; never persist passwords, OAuth tokens, SMTP
    // credentials, PF/ESI credentials, or arbitrary client-supplied step data.
    const marker = { completed: true, skipped: Boolean(skipped), updatedAt: new Date().toISOString() };
    const rows = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
      UPDATE tenants
      SET onboarding_progress = COALESCE(onboarding_progress, '{}'::jsonb)
            || jsonb_build_object(${step}, ${JSON.stringify(marker)}::jsonb),
          updated_at = NOW()
      WHERE id = ${tenantId}::uuid AND deleted_at IS NULL
      RETURNING id
    `);
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
    const tenantId = resolveCentralTenantId(req);
    if (!tenantId) return sendError(res, ERROR_CODES.VALIDATION, 'Tenant ID required', 400);
    const requiredSteps = ['org', 'work', 'payroll', 'email', 'compliance', 'documents', 'backup'];
    const rows = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
      SELECT id, is_active, onboarding_progress
      FROM tenants
      WHERE id = ${tenantId}::uuid AND deleted_at IS NULL
      LIMIT 1
    `);
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

    await withPlatformAdminRLS(centralPrisma, (tx) => tx.$executeRaw`
      UPDATE tenants SET is_setup_complete = true, updated_at = NOW()
      WHERE id = ${tenantId}::uuid AND deleted_at IS NULL
    `);
    return sendSuccess(res, { isSetupComplete: true }, 'Company setup completed');
  } catch (err) {
    logger.error('[onboarding/complete]', err);
    return sendError(res, ERROR_CODES.SERVER, 'Could not complete company setup', 500);
  }
});


const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    cb(allowed.includes(file.mimetype) ? null : new Error('Only PDF, JPEG, or PNG files are accepted.'), allowed.includes(file.mimetype));
  },
});

function validDocumentSignature(file) {
  if (!file?.buffer) return false;
  if (file.mimetype === 'application/pdf') return file.buffer.subarray(0, 5).toString() === '%PDF-';
  if (file.mimetype === 'image/jpeg') return file.buffer[0] === 0xff && file.buffer[1] === 0xd8 && file.buffer[2] === 0xff;
  if (file.mimetype === 'image/png') return file.buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return false;
}

function documentStorageReady() {
  return Boolean(process.env.MINIO_ENDPOINT && process.env.MINIO_ACCESS_KEY &&
    process.env.MINIO_SECRET_KEY && minio.isStorageReady() && process.env.CLAMAV_HOST &&
    (process.env.NODE_ENV !== 'production' || process.env.MINIO_USE_SSL === 'true'));
}

router.post('/company-documents', auth, (req, res, next) => {
  documentUpload.single('file')(req, res, (err) => {
    if (err) return sendError(res, ERROR_CODES.VALIDATION, err.message || 'Upload rejected', 400);
    next();
  });
}, async (req, res) => {
  let objectKey = null;
  try {
    const tenantId = resolveCentralTenantId(req);
    if (!tenantId) return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Company session required', 401);
    if (!documentStorageReady()) return sendError(res, ERROR_CODES.SERVER, 'Private document storage is not configured securely.', 503);
    if (!req.file || !validDocumentSignature(req.file)) {
      return sendError(res, ERROR_CODES.VALIDATION, 'File content does not match an accepted PDF/JPEG/PNG format.', 400);
    }
    const allowedTypes = new Set(['gst_certificate', 'pan_card', 'incorporation_certificate', 'address_proof', 'bank_proof', 'other']);
    const documentType = String(req.body.documentType || '');
    if (!allowedTypes.has(documentType)) return sendError(res, ERROR_CODES.VALIDATION, 'Select a valid company document type.', 400);

    await scanBuffer(req.file.buffer);
    const originalName = String(req.file.originalname || 'document').replace(/[\\/\x00-\x1f]/g, '_').slice(0, 180);
    const sha256 = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    objectKey = await minio.uploadFile(tenantId, 'company-documents', req.file.buffer, originalName, req.file.mimetype);
    const rows = await withTenantRLS(centralPrisma, tenantId, (tx) => tx.$queryRaw`
      INSERT INTO company_documents
        (tenant_id, document_type, file_name, object_key, mime_type, size_bytes, sha256, uploaded_by)
      VALUES
        (${tenantId}::uuid, ${documentType}, ${originalName}, ${objectKey},
         ${req.file.mimetype}, ${req.file.size}, ${sha256}, ${req.user?.id || null}::uuid)
      RETURNING id, document_type, file_name, mime_type, size_bytes, status, created_at
    `);
    return sendSuccess(res, rows[0], 'Company document submitted for review.', 201);
  } catch (err) {
    if (objectKey) await minio.deleteFile(objectKey).catch(() => {});
    logger.error('[company-documents/upload]', err);
    if (err.message === 'MALWARE_SCANNER_NOT_CONFIGURED') return sendError(res, ERROR_CODES.SERVER, 'Secure malware scanning is not configured; upload is disabled.', 503);
    if (err.message === 'MALWARE_DETECTED') return sendError(res, ERROR_CODES.VALIDATION, 'The uploaded file was rejected by malware scanning.', 400);
    return sendError(res, ERROR_CODES.SERVER, 'Document upload failed. Please retry.', 500);
  }
});

router.get('/company-documents', auth, async (req, res) => {
  try {
    const tenantId = resolveCentralTenantId(req);
    if (!tenantId) return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Company session required', 401);
    const rows = await withTenantRLS(centralPrisma, tenantId, (tx) => tx.$queryRaw`
      SELECT id, document_type, file_name, mime_type, size_bytes, status,
             reviewer_note, reviewed_at, created_at, updated_at
      FROM company_documents WHERE tenant_id = ${tenantId}::uuid
      ORDER BY created_at DESC
    `);
    return sendSuccess(res, rows);
  } catch (err) {
    logger.error('[company-documents/list]', err);
    return sendError(res, ERROR_CODES.SERVER, 'Could not load company documents.', 500);
  }
});

router.get('/company-documents/:id/download', auth, async (req, res) => {
  try {
    const tenantId = resolveCentralTenantId(req);
    if (!tenantId) return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Company session required', 401);
    const rows = await withTenantRLS(centralPrisma, tenantId, (tx) => tx.$queryRaw`
      SELECT object_key, file_name FROM company_documents
      WHERE id = ${req.params.id}::uuid AND tenant_id = ${tenantId}::uuid LIMIT 1
    `);
    if (!rows.length) return sendError(res, ERROR_CODES.NOT_FOUND, 'Document not found.', 404);
    if (!documentStorageReady()) return sendError(res, ERROR_CODES.SERVER, 'Private document storage is unavailable.', 503);
    const url = await minio.getPresignedUrl(rows[0].object_key, 300);
    return sendSuccess(res, { url, expiresInSeconds: 300, fileName: rows[0].file_name }, 'Short-lived download link created.');
  } catch (err) {
    logger.error('[company-documents/download]', err);
    return sendError(res, ERROR_CODES.SERVER, 'Could not create document download link.', 500);
  }
});


function requireDocumentReviewer(req, res) {
  if (!req.user?.is_platform_admin && req.user?.role !== 'super_admin') {
    sendError(res, ERROR_CODES.FORBIDDEN, 'Platform reviewer access required.', 403);
    return false;
  }
  return true;
}

router.get('/company-documents/review-queue', auth, async (req, res) => {
  try {
    if (!requireDocumentReviewer(req, res)) return;
    const rows = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
      SELECT d.id, d.tenant_id, t.name AS company_name, t.subdomain,
             d.document_type, d.file_name, d.mime_type, d.size_bytes,
             d.status, d.created_at
      FROM company_documents d
      JOIN tenants t ON t.id = d.tenant_id
      WHERE d.status IN ('submitted', 'under_review', 'resubmission_required')
      ORDER BY d.created_at ASC
      LIMIT 200
    `);
    return sendSuccess(res, rows);
  } catch (err) {
    logger.error('[company-documents/review-queue]', err);
    return sendError(res, ERROR_CODES.SERVER, 'Could not load document review queue.', 500);
  }
});

router.get('/company-documents/:id/review-download', auth, async (req, res) => {
  try {
    if (!requireDocumentReviewer(req, res)) return;
    if (!documentStorageReady()) return sendError(res, ERROR_CODES.SERVER, 'Private document storage is unavailable.', 503);
    const rows = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
      SELECT object_key, file_name FROM company_documents WHERE id = ${req.params.id}::uuid LIMIT 1
    `);
    if (!rows.length) return sendError(res, ERROR_CODES.NOT_FOUND, 'Company document not found.', 404);
    const url = await minio.getPresignedUrl(rows[0].object_key, 300);
    return sendSuccess(res, { url, expiresInSeconds: 300, fileName: rows[0].file_name });
  } catch (err) {
    logger.error('[company-documents/review-download]', err);
    return sendError(res, ERROR_CODES.SERVER, 'Could not create review download link.', 500);
  }
});

router.get('/company-documents/:id/reviews', auth, async (req, res) => {
  try {
    if (!requireDocumentReviewer(req, res)) return;
    const rows = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
      SELECT id, document_id, tenant_id, reviewer_id, from_status, to_status, reviewer_note, created_at
      FROM company_document_reviews WHERE document_id = ${req.params.id}::uuid
      ORDER BY created_at DESC
    `);
    return sendSuccess(res, rows);
  } catch (err) {
    logger.error('[company-documents/reviews]', err);
    return sendError(res, ERROR_CODES.SERVER, 'Could not load document review history.', 500);
  }
});

router.patch('/company-documents/:id/review', auth, async (req, res) => {
  try {
    if (!requireDocumentReviewer(req, res)) return;
    const { status, reviewerNote = '' } = req.body || {};
    const allowed = new Set(['under_review', 'approved', 'rejected', 'resubmission_required']);
    if (!allowed.has(status) || String(reviewerNote).length > 2000) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Invalid review status or note.', 400);
    }
    const result = await withPlatformAdminRLS(centralPrisma, async (tx) => {
      // Lock the row so concurrent reviewers cannot create contradictory audit
      // entries or move an approved document back into the review queue.
      const currentRows = await tx.$queryRaw`
        SELECT id, tenant_id, status
        FROM company_documents
        WHERE id = ${req.params.id}::uuid
        FOR UPDATE
      `;
      if (!currentRows.length) return { notFound: true };
      const current = currentRows[0];
      const transitions = {
        submitted: new Set(['under_review', 'approved', 'rejected', 'resubmission_required']),
        under_review: new Set(['approved', 'rejected', 'resubmission_required']),
        rejected: new Set(['under_review']),
        resubmission_required: new Set(['under_review']),
        approved: new Set(),
      };
      if (!transitions[current.status]?.has(status)) {
        return { invalidTransition: true, fromStatus: current.status };
      }
      const rows = await tx.$queryRaw`
        UPDATE company_documents
        SET status = ${status}, reviewer_id = ${req.user?.id || null}::uuid,
            reviewer_note = ${String(reviewerNote)}, reviewed_at = NOW(), updated_at = NOW()
        WHERE id = ${current.id}::uuid AND tenant_id = ${current.tenant_id}::uuid
        RETURNING id, tenant_id, status, reviewer_note, reviewed_at
      `;
      if (!rows.length) throw new Error('COMPANY_DOCUMENT_REVIEW_UPDATE_LOST');
      await tx.$executeRaw`
        INSERT INTO company_document_reviews
          (document_id, tenant_id, reviewer_id, from_status, to_status, reviewer_note)
        VALUES
          (${rows[0].id}::uuid, ${rows[0].tenant_id}::uuid, ${req.user?.id || null}::uuid,
           ${current.status}, ${status}, ${String(reviewerNote)})
      `;
      return rows[0];
    });
    if (result?.notFound) return sendError(res, ERROR_CODES.NOT_FOUND, 'Company document not found.', 404);
    if (result?.invalidTransition) {
      return sendError(res, ERROR_CODES.VALIDATION,
        `Cannot move a document from ${result.fromStatus} to ${status}.`, 409);
    }
    return sendSuccess(res, result, 'Document review status updated.');
  } catch (err) {
    logger.error('[company-documents/review]', err);
    return sendError(res, ERROR_CODES.SERVER, 'Could not update document review.', 500);
  }
});

module.exports = router;
