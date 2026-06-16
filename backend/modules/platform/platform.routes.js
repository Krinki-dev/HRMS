/**
 * @file platform.routes.js
 * @description Public and common platform utility routes (GSTIN, Pincode, Branding).
 */
const express = require('express');
const router  = express.Router();
const axios   = require('axios');

const { registerTenant, requestBranchLink } = require('./platform.service');
const { scrapeGSTPortal } = require('../../shared/utils/gstScraper');
const { centralPrisma } = require('../../shared/utils/centralPrisma');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');
const logger = require('../../shared/utils/logger');

/**
 * Constants for GSTIN analysis
 */
const STATE_CODES = {
  '01':'Jammu & Kashmir',     '02':'Himachal Pradesh',
  '03':'Punjab',               '04':'Chandigarh',
  '05':'Uttarakhand',          '06':'Haryana',
  '07':'Delhi',                '08':'Rajasthan',
  '09':'Uttar Pradesh',        '10':'Bihar',
  '11':'Sikkim',               '12':'Arunachal Pradesh',
  '13':'Nagaland',             '14':'Manipur',
  '15':'Mizoram',              '16':'Tripura',
  '17':'Meghalaya',            '18':'Assam',
  '19':'West Bengal',          '20':'Jharkhand',
  '21':'Odisha',               '22':'Chhattisgarh',
  '23':'Madhya Pradesh',       '24':'Gujarat',
  '25':'Daman & Diu',          '26':'Dadra & Nagar Haveli',
  '27':'Maharashtra',          '28':'Andhra Pradesh (Old)',
  '29':'Karnataka',            '30':'Goa',
  '31':'Lakshadweep',          '32':'Kerala',
  '33':'Tamil Nadu',           '34':'Puducherry',
  '35':'Andaman & Nicobar',    '36':'Telangana',
  '37':'Andhra Pradesh',       '38':'Ladakh',
  '97':'Other Territory',      '99':'Central Government',
};

const CONSTITUTION_MAP = {
  P: 'Proprietorship',
  C: 'Private / Public Limited Company',
  H: 'Hindu Undivided Family (HUF)',
  F: 'Partnership Firm',
  A: 'Association of Persons (AOP)',
  T: 'Trust',
  B: 'Body of Individuals (BOI)',
  L: 'Local Authority',
  J: 'Artificial Juridical Person',
  G: 'Government',
};

/**
 * Route Handlers
 */
router.post('/register', registerTenant);

router.post('/link-branch', async (req, res) => {
  const { gstin, targetTenantId, branchNo, branchName, city, state, pincode } = req.body || {};
  if (!gstin || !targetTenantId) {
    return sendError(res, ERROR_CODES.VALIDATION, 'gstin and targetTenantId are required', 400);
  }

  try {
    const result = await requestBranchLink(gstin, targetTenantId, {
      branchNo,
      branchName,
      city,
      state,
      pincode,
      address: null,
    });
    return res.json(result);
  } catch (err) {
    console.error('[platform/link-branch] Error:', err.message);
    return res.status(400).json({ success: false, message: err.message || 'Unable to create branch link request' });
  }
});

router.get('/gstin-lookup/:gstin', async (req, res) => {
  const { gstin } = req.params;
  const gstinUpper = (gstin || '').trim().toUpperCase();

  const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!GSTIN_REGEX.test(gstinUpper)) {
    return sendError(res, ERROR_CODES.VALIDATION, 'Invalid GSTIN format. Example: 29ABCDE1234F1Z5', 400);
  }

  const stateCode = gstinUpper.substring(0, 2);
  const pan       = gstinUpper.substring(2, 12);
  const entityChar = pan[3]; 

  // 1. CACHE CHECK: Query central database before running Scraper/API to save resources
  try {
    const cached = await centralPrisma.central_gst_records.findUnique({
      where: { gstin: gstinUpper }
    });
    if (cached) {
      logger.info(`[gstin-lookup] Cache hit for ${gstinUpper}`);
      return sendSuccess(res, {
        source: 'cache',
        ...cached,
        constitutionOfBusiness: cached.constitution,
        gstStatus: cached.gst_status,
        legalName: cached.legal_name,
        tradeName: cached.trade_name
      });
    }
  } catch (dbErr) {
    logger.warn(`[gstin-lookup] Cache check failed: ${dbErr.message}`);
  }

  const baseData = {
    gstin:         gstinUpper,
    pan,
    stateCode,
    state:         STATE_CODES[stateCode] || null,
    constitutionOfBusiness: CONSTITUTION_MAP[entityChar] || null,
    tradeName:     null,
    legalName:     null,
    city:          null,
    pincode:       null,
    address:       null,
    gstStatus:     null,
    gstRegDate:    null,
    taxpayerType:  null,
    businessNature:[],
    eInvoiceEnabled: false,
  };

  const apiKey = process.env.GST_API_KEY;

  if (apiKey) {
    try {
      const response = await axios.get(
        `https://api.gst.gov.in/commonapi/v1.1/taxpayerDetails/${gstinUpper}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          timeout: 8000,
        }
      );

      const raw  = response.data;
      const info = raw.taxpayerInfo || raw.data || raw;

      if (info && !raw.errorCode) {
        const pradr     = info.pradr?.addr || {};
        const addrParts = [pradr.bno, pradr.bnm, pradr.st, pradr.loc, pradr.dst, pradr.pncd]
          .filter(Boolean);

        // 2. CACHE SAVE: Persist new lookup results for future visitors
        centralPrisma.central_gst_records.upsert({
          where: { gstin: gstinUpper },
          update: { raw: raw, updated_at: new Date() },
          create: {
            gstin: gstinUpper,
            pan: pan,
            legal_name: info.lgnm,
            trade_name: info.tradeNam,
            state: STATE_CODES[stateCode],
            gst_status: info.sts,
            address: addrParts.join(', '),
            pincode: pradr.pncd,
            raw: raw,
            data_source: 'gst-api'
          }
        }).catch(e => logger.error(`[gstin-lookup] Cache save failed: ${e.message}`));

        logger.info(`[gstin-lookup] ✅ API success: ${gstinUpper} → ${info.lgnm || info.tradeNam}`);
        return sendSuccess(res, {
          source:  'gst-api',
          ...baseData,
          tradeName:     info.tradeNam || null,
          legalName:     info.lgnm     || null,
          city:          pradr.dst     || pradr.loc || null,
          pincode:       pradr.pncd   || null,
          address:       addrParts.join(', ') || null,
          gstStatus:     info.sts      || null,
          gstRegDate:    info.rgdt     || null,
          taxpayerType:  info.dty      || null,
          businessNature:info.nba      || [],
          eInvoiceEnabled: info.einvoiceStatus === 'Yes',
        });
      }
    } catch (apiErr) {
      logger.warn(`[gstin-lookup] API failed: ${apiErr.message}. Falling back to GSTIN parsing.`);
    }
  } else {
    logger.info(`[gstin-lookup] No GST_API_KEY set — returning GSTIN-derived data for ${gstinUpper}`);
  }

  logger.info(`[gstin-lookup] GSTIN parse: ${gstinUpper} → state=${baseData.state}, pan=${pan}, type=${baseData.constitutionOfBusiness}`);
  
  // Attempt scraper fallback
  try {
    const scraperResult = await scrapeGSTPortal(gstinUpper);
    if (scraperResult && scraperResult.success) {
      return sendSuccess(res, {
        source: 'gst-portal-scrape',
        ...baseData,
        ...scraperResult.data
      });
    }
  } catch (scrapeErr) {
    logger.error(`[gstin-lookup] Scraper failed for ${gstinUpper}:`, scrapeErr.message);
    // Fail gracefully: do not crash, fall through to return partial data derived from GSTIN
  }

  return sendSuccess(res, {
    source:  'gstin-parse',
    partial: true,  
    ...baseData,
    note: apiKey
      ? 'GST API returned no data. Core fields extracted from GSTIN. Fill name and address manually.'
      : 'Add GST_API_KEY to .env to enable full auto-fill. State, PAN, and entity type extracted from GSTIN.',
  });
});

/**
 * GET /sitemap.xml
 * Dynamically generates a sitemap for search engines.
 * Includes the landing page and all cached GST lookup records for SEO.
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    // 1. Fetch all cached GST records to create dynamic SEO-friendly links
    const gstRecords = await centralPrisma.central_gst_records.findMany({
      select: { gstin: true, updated_at: true },
      orderBy: { updated_at: 'desc' },
      take: 5000 // Limit to prevent massive XML files
    });

    const host = req.get('host') || 'syntern.in';
    const protocol = req.protocol || 'https';
    const baseUrl = `${protocol}://${host}`;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static core pages
    xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${baseUrl}/register</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;

    // Dynamic GST lookup pages for SEO traffic
    gstRecords.forEach(rec => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/gst-lookup/${rec.gstin}</loc>\n`;
      if (rec.updated_at) {
        xml += `    <lastmod>${rec.updated_at.toISOString().split('T')[0]}</lastmod>\n`;
      }
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
    
    logger.info(`[Sitemap] Generated XML with ${gstRecords.length} dynamic links`);
  } catch (err) {
    logger.error('[Sitemap] Generation failed:', err);
    // Return an empty but valid sitemap on error to prevent 500s for crawlers
    res.header('Content-Type', 'application/xml');
    res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
});

router.get('/gstin-check/:gstin', async (req, res) => {
  const gstinUpper = (req.params.gstin || '').trim().toUpperCase();
  const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!GSTIN_REGEX.test(gstinUpper)) {
    return sendError(res, ERROR_CODES.VALIDATION, 'Invalid GSTIN format. Example: 29ABCDE1234F1Z5', 400);
  }

  const pan = gstinUpper.substring(2, 12);
  try {
    const exactRows = await centralPrisma.$queryRaw`
      SELECT id, name, legal_name, subdomain, gstin, pan, state, city
      FROM tenants
      WHERE gstin = ${gstinUpper} AND deleted_at IS NULL
      LIMIT 1
    `;

    const samePanRows = await centralPrisma.$queryRaw`
      SELECT id, name, legal_name, subdomain, gstin, pan, state, city
      FROM tenants
      WHERE pan = ${pan} AND gstin != ${gstinUpper} AND deleted_at IS NULL
    `;

    return sendSuccess(res, {
      exists: exactRows.length > 0,
      exact: exactRows[0] || null,
      samePan: samePanRows || [],
    });
  } catch (err) {
    logger.error('[platform/gstin-check] DB error:', err);
    return sendError(res, ERROR_CODES.SERVER, 'Unable to verify GSTIN.');
  }
});

router.get('/pincode/:pincode', async (req, res) => {
  const { pincode } = req.params;
  const pin = (pincode || '').trim();
  if (!/^[0-9]{6}$/.test(pin)) return sendError(res, ERROR_CODES.VALIDATION, 'Pincode must be 6 digits.', 400);

  try {
    const response = await axios.get(`https://api.postalpincode.in/pincode/${pin}`, { timeout: 8000 });
    const result = Array.isArray(response.data) ? response.data[0] : null;
    if (!result || result.Status !== 'Success') throw new Error('Invalid pincode');

    const office = result.PostOffice[0];
    return sendSuccess(res, {
      pincode: pin,
      state: office.State || null,
      district: office.District || null,
      city: office.Block || office.District || null,
    });
  } catch (err) {
    logger.warn(`[pincode-lookup] ${err.message}`);
    return sendError(res, ERROR_CODES.SERVER, 'Pincode lookup failed.', 502);
  }
});

module.exports = router;

