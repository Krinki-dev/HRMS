// ============================================================
//  gst.db.service.js
//  Database layer for saving & retrieving GST data
// ============================================================

'use strict';

const { getOptionalCentralDB } = require('../../../shared/utils/centralDb');

const CACHE_TTL_DAYS = 30;  // Re-verify GST data every 30 days

/**
 * Parse date strings in DD/MM/YYYY format to YYYY-MM-DD
 */
function parseIndianDate(dateStr) {
  if (!dateStr) return null;
  const match = String(dateStr).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Extract address components from address string
 * Official format: "ground floor, na, Jhajjar Road, na, Gudha, Jhajjar, Haryana, 124103"
 */
function parseAddress(addressStr) {
  if (!addressStr) {
    return {
      address_line: null, flat_no: null, street: null,
      location: null, city: null, district: null, state: null, pincode: null
    };
  }

  const parts = String(addressStr).split(',').map(p => p.trim()).filter(p => p && p !== 'na' && p !== 'NA' && p !== 'N/A');

  // Try to extract 6-digit pincode
  const pincodeMatch = addressStr.match(/(\d{6})/);
  const pincode = pincodeMatch ? pincodeMatch[1] : null;

  // Typically: [..., District, State, Pincode]
  let state = null, district = null, location = null;
  if (pincode) {
    // Pincode is last, state is second-to-last
    const idx = parts.length - 1;
    state = parts[idx - 1] || null;
    district = parts[idx - 2] || null;
    location = parts.slice(0, Math.max(0, idx - 2)).pop() || null;
  } else {
    state = parts[parts.length - 1] || null;
    district = parts[parts.length - 2] || null;
    location = parts[parts.length - 3] || null;
  }

  return {
    address_line: addressStr,
    flat_no: null,                // Would need more sophisticated parsing
    street: parts[1] || null,     // Typically second element
    location,
    city: location || district,   // Use location or district as city
    district,
    state,
    pincode
  };
}

/**
 * Normalize GSTIN status to enum values
 */
function normalizeStatus(raw = '') {
  const s = String(raw).toLowerCase();
  if (s.includes('active')) return 'Active';
  if (s.includes('cancel')) return 'Cancelled';
  if (s.includes('suspend')) return 'Suspended';
  if (s.includes('provisional')) return 'Provisionally Cancelled';
  return 'Unknown';
}

/**
 * Check if GST data exists in cache and is not expired
 */
async function getCachedGstData(gstin) {
  const db = getOptionalCentralDB();
  if (!db) return null;

  try {
    const rows = await db.$queryRaw`
      SELECT *
      FROM central_gst_records
      WHERE gstin = ${gstin}
      AND last_verified_at > DATE_SUB(NOW(), INTERVAL ${CACHE_TTL_DAYS} DAY)
      LIMIT 1
    `;

    return rows && rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.warn('[GST.DB] getCachedGstData error:', err.message);
    return null;
  }
}

/**
 * Save or update GST data to database
 * Maps scraped data fields to database schema
 */
async function saveGstData(gstinLookupResult, metadata = {}) {
  const db = getOptionalCentralDB();
  if (!db) {
    console.warn('[GST.DB] No database configured — skipping save');
    return null;
  }

  const {
    gstin,
    pan,
    legalName,
    tradeName,
    status,
    registrationDate,
    cancelDate,
    taxpayerType,
    constitution,
    businessType,
    coreBusinessActivity,
    businessNature = [],
    dealingIn = [],
    address,
    state,
    district,
    pincode,
    stateJuri,
    centerJuri,
    centerCode,
    branchNo,
    branchName,
    aadhaarAuthenticated,
    aadhaarAuthDate,
    ekycVerified,
    source = 'official',
    rawData = {}
  } = gstinLookupResult;

  // Parse dates
  const regDate = parseIndianDate(registrationDate);
  const cancelDateParsed = parseIndianDate(cancelDate);
  const aadhaarDateParsed = parseIndianDate(aadhaarAuthDate);

  // Parse address into components
  const addressParts = parseAddress(address);

  // Extract tenant_id if provided
  const { tenantId = null, userId = null } = metadata;

  try {
    // Upsert into central_gst_records (or gst_master if not using Prisma)
    const upsertResult = await db.$executeRaw`
      INSERT INTO central_gst_records (
        gstin, pan, 
        company_name, legalname, tradename,
        state, state_code,
        status, regdate, cancel_date,
        type, constitutionofbusiness,
        state_juri, center_juri, center_code,
        pincode, district, branch_no, branch_name, flat_no, street, location,
        business_nature, dealing_in, 
        raw, data_source,
        last_verified_at, created_at, updated_at
      ) VALUES (
        ${gstin}, ${pan || null},
        ${legalName || tradeName || null}, ${legalName || null}, ${tradeName || null},
        ${state || addressParts.state || null}, 
        ${gstin.substring(0, 2)},  -- State code from GSTIN
        ${normalizeStatus(status)}, ${regDate}, ${cancelDateParsed},
        ${taxpayerType || businessType || null}, ${constitution || null},
        ${stateJuri || null}, ${centerJuri || null}, ${centerCode || null},
        ${pincode || addressParts.pincode}, 
        ${district || addressParts.district},
        ${branchNo}, ${branchName}, 
        ${addressParts.flat_no}, 
        ${addressParts.street}, 
        ${addressParts.location},
        ${JSON.stringify(businessNature)}, 
        ${JSON.stringify(dealingIn)},
        ${JSON.stringify(rawData)}, 
        ${source},
        NOW(), NOW(), NOW()
      )
      ON DUPLICATE KEY UPDATE
        pan                    = VALUES(pan),
        company_name           = VALUES(company_name),
        legalname              = VALUES(legalname),
        tradename              = VALUES(tradename),
        state                  = VALUES(state),
        status                 = VALUES(status),
        regdate                = VALUES(regdate),
        cancel_date            = VALUES(cancel_date),
        type                   = VALUES(type),
        constitutionofbusiness = VALUES(constitutionofbusiness),
        state_juri             = VALUES(state_juri),
        center_juri            = VALUES(center_juri),
        center_code            = VALUES(center_code),
        pincode                = VALUES(pincode),
        district               = VALUES(district),
        branch_no              = VALUES(branch_no),
        branch_name            = VALUES(branch_name),
        flat_no                = VALUES(flat_no),
        street                 = VALUES(street),
        location               = VALUES(location),
        business_nature        = VALUES(business_nature),
        dealing_in             = VALUES(dealing_in),
        raw                    = VALUES(raw),
        data_source            = VALUES(data_source),
        last_verified_at       = NOW(),
        updated_at             = NOW()
    `;

    console.log(`[GST.DB] Saved GSTIN ${gstin} to database`);

    // Log the lookup in audit table
    if (process.env.ENABLE_GST_AUDIT_LOG === 'true') {
      await db.$executeRaw`
        INSERT INTO gst_lookup_log (
          gstin, lookup_by_user_id, tenant_id,
          status, source, response_ms,
          user_agent, ip_address,
          created_at
        ) VALUES (
          ${gstin}, ${userId}, ${tenantId},
          'success', ${source}, ${metadata.responseTimes || null},
          ${metadata.userAgent || null}, ${metadata.ipAddress || null},
          NOW()
        )
      `;
    }

    return { success: true, gstin, saved: true };

  } catch (err) {
    console.error('[GST.DB] saveGstData error:', err.message);
    
    // Log failed lookup
    if (process.env.ENABLE_GST_AUDIT_LOG === 'true') {
      try {
        await db.$executeRaw`
          INSERT INTO gst_lookup_log (
            gstin, tenant_id, status, error_message, created_at
          ) VALUES (
            ${gstin}, ${tenantId}, 'failed', ${err.message}, NOW()
          )
        `;
      } catch { /* ignore */ }
    }

    throw err;
  }
}

/**
 * Retrieve GST data for display (with cache check)
 */
async function getGstRecord(gstin) {
  const db = getOptionalCentralDB();
  if (!db) return null;

  try {
    const rows = await db.$queryRaw`
      SELECT * FROM central_gst_records
      WHERE gstin = ${gstin}
      LIMIT 1
    `;

    if (rows && rows.length > 0) {
      const rec = rows[0];
      // Parse JSON fields
      if (typeof rec.business_nature === 'string') {
        try { rec.business_nature = JSON.parse(rec.business_nature); } catch { rec.business_nature = []; }
      }
      if (typeof rec.dealing_in === 'string') {
        try { rec.dealing_in = JSON.parse(rec.dealing_in); } catch { rec.dealing_in = []; }
      }
      if (typeof rec.raw === 'string') {
        try { rec.raw = JSON.parse(rec.raw); } catch { rec.raw = {}; }
      }
      return rec;
    }
    return null;
  } catch (err) {
    console.warn('[GST.DB] getGstRecord error:', err.message);
    return null;
  }
}

/**
 * Check if GST record needs refresh (older than TTL)
 */
function isGstRecordStale(record) {
  if (!record || !record.last_verified_at) return true;
  const lastVerified = new Date(record.last_verified_at);
  const now = new Date();
  const daysDiff = (now - lastVerified) / (1000 * 60 * 60 * 24);
  return daysDiff > CACHE_TTL_DAYS;
}

module.exports = {
  getCachedGstData,
  saveGstData,
  getGstRecord,
  isGstRecordStale,
  parseAddress,
  normalizeStatus,
  parseIndianDate,
  CACHE_TTL_DAYS
};
