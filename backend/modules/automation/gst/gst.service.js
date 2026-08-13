'use strict';

const { chromium } = require('playwright');
const { getOptionalCentralDB } = require('../../../shared/utils/centralDb');

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const CACHE_TTL_HOURS = 24;
const ASSISTED_SESSION_TTL_MS = 5 * 60 * 1000;

const assistedSessions = new Map();

// Optional: Tesseract for CAPTCHA OCR (install: npm install tesseract.js)
let Tesseract;
try {
  Tesseract = require('tesseract.js');
} catch (e) {
  console.warn('[gst.service] Tesseract not installed. CAPTCHA OCR disabled. Install: npm install tesseract.js');
}

const STATE_CODES = {
  '01':'Jammu & Kashmir','02':'Himachal Pradesh','03':'Punjab','04':'Chandigarh',
  '05':'Uttarakhand','06':'Haryana','07':'Delhi','08':'Rajasthan','09':'Uttar Pradesh',
  '10':'Bihar','11':'Sikkim','12':'Arunachal Pradesh','13':'Nagaland','14':'Manipur',
  '15':'Mizoram','16':'Tripura','17':'Meghalaya','18':'Assam','19':'West Bengal',
  '20':'Jharkhand','21':'Odisha','22':'Chhattisgarh','23':'Madhya Pradesh','24':'Gujarat',
  '25':'Daman & Diu','26':'Dadra & Nagar Haveli','27':'Maharashtra',
  '28':'Andhra Pradesh (Old)','29':'Karnataka','30':'Goa','31':'Lakshadweep',
  '32':'Kerala','33':'Tamil Nadu','34':'Puducherry','35':'Andaman & Nicobar',
  '36':'Telangana','37':'Andhra Pradesh','38':'Ladakh',
  '97':'Other Territory','99':'Central Government',
};

const CONSTITUTION_MAP = {
  P:'Proprietorship', C:'Private/Public Limited Company',
  H:'Hindu Undivided Family (HUF)', F:'Partnership Firm',
  A:'Association of Persons (AOP)', T:'Trust',
  B:'Body of Individuals (BOI)', L:'Local Authority',
  J:'Artificial Juridical Person', G:'Government',
};

function parseGstinStructure(gstinUpper) {
  const stateCode  = gstinUpper.substring(0, 2);
  const pan        = gstinUpper.substring(2, 12);
  const entityChar = pan[3];
  return {
    gstin: gstinUpper,
    pan,
    stateCode,
    statecode: stateCode,
    state_code: stateCode,
    state: STATE_CODES[stateCode] || null,
    constitutionofbusiness: CONSTITUTION_MAP[entityChar] || null,
    type: null, tradename: null, legalname: null,
    status: null, regdate: null, cancel_date: null,
    state_juri: null, center_juri: null, center_code: null,
    location: null, district: null, branch_no: null,
    branch_name: null, flat_no: null, street: null, pincode: null,
    business_nature: [], dealing_in: [],
    source: 'gstin-parse',
  };
}

async function readCentralGstRecord(gstin) {
  const db = getOptionalCentralDB();
  if (!db) return null; 

  try {
    const rows = await db.$queryRaw`
      SELECT
        gstin, pan, company_name, legal_name AS legalname, trade_name AS tradename,
        state, state_code, gst_status AS status, gst_reg_date AS regdate,
        taxpayer_type AS type, constitution AS constitutionofbusiness, business_nature, pincode,
        centre_jurisdiction AS center_juri, centre_code AS center_code,
        state_jurisdiction AS state_juri, cancellation_date AS cancel_date,
        dealing_in, district, branch_no, flat_no, street,
        branch_name, location, raw_data, verification_status, data_source AS source,
        lookup_error_message, last_verified_at, created_at
      FROM public.central_gst_records
      WHERE gstin = ${gstin}
      LIMIT 1
    `;

    if (!rows || rows.length === 0) return null;

    const row = rows[0];

    const parseJsonb = (v) => {
      if (!v) return [];
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
      return Array.isArray(v) ? v : [];
    };

    return {
      ...row,
      business_nature: parseJsonb(row.business_nature),
      dealing_in:      parseJsonb(row.dealing_in),
      raw:             row.raw_data || row.raw || null,
      cachedAt:        row.created_at || row.last_verified_at,
      source:          row.source || row.data_source || 'official',
    };

  } catch (err) {
    console.error('[gst.service] readCentralGstRecord error:', err.message);
    return null;
  }
}

async function getCachedGstRecord(gstin) {
  const record = await readCentralGstRecord(gstin);
  if (!record) return null;

  if (record.cachedAt) {
    const ageHours = (Date.now() - new Date(record.cachedAt).getTime()) / 3600000;
    if (ageHours > CACHE_TTL_HOURS) {
      console.log(`[gst.service] Cache expired for ${gstin} (${ageHours.toFixed(1)}h old)`);
      return null; 
    }
  }

  return record;
}

async function upsertCentralGstRecord(data) {
  const db = getOptionalCentralDB();
  if (!db) {
    console.warn('[gst.service] upsertCentralGstRecord: CENTRAL_DATABASE_URL not set — skipping save');
    return null;
  }

  const {
    gstin,
    pan,
    legalname, tradename,
    
    company_name = legalname || tradename || null,
    state, state_code, statecode,
    status, regdate, cancel_date, canceldate,
    type,
    constitutionofbusiness,
    state_juri, statejuri,
    center_juri, centerjuri,
    center_code, centercode,
    pincode,
    district,
    branch_no, branchno,
    branch_name, branchname,
    flat_no, flatno,
    street,
    location,
    business_nature = [], businessnature,
    dealing_in = [], dealingin,
    raw,
    source,
  } = data;

  const sc   = state_code  || statecode  || null;
  const cj   = center_juri || centerjuri || null;
  const cc   = center_code || centercode || null;
  const sj   = state_juri  || statejuri  || null;
  const cd   = cancel_date || canceldate || null;
  const bn   = branch_no   || branchno   || null;
  const bnm  = branch_name || branchname || null;
  const fn   = flat_no     || flatno     || null;
  const bnat = businessnature?.length ? businessnature : (business_nature || []);
  const din  = dealingin?.length      ? dealingin      : (dealing_in     || []);

  const bnatJson = JSON.stringify(bnat);
  const dinJson  = JSON.stringify(din);
  const rawJson  = raw ? JSON.stringify(raw) : null;

  try {
    await db.$executeRaw`
      INSERT INTO public.central_gst_records (
        gstin, pan, company_name, legal_name, trade_name,
        state, state_code, gst_status, gst_reg_date, cancellation_date,
        taxpayer_type, constitution,
        state_jurisdiction, centre_jurisdiction, centre_code,
        pincode, district, branch_no, branch_name, flat_no, street, location,
        business_nature, dealing_in, raw_data, data_source,
        last_verified_at
      ) VALUES (
        ${gstin}, ${pan || null}, ${company_name}, ${legalname || null}, ${tradename || null},
        ${state || null}, ${sc}, ${status || null}, ${regdate || null}, ${cd},
        ${type || null}, ${constitutionofbusiness || null},
        ${sj}, ${cj}, ${cc},
        ${pincode || null}, ${district || null}, ${bn}, ${bnm}, ${fn}, ${street || null}, ${location || null},
        ${bnatJson}::jsonb, ${dinJson}::jsonb, ${rawJson}::jsonb, ${source || 'gstsearch.in'},
        NOW()
      )
      ON CONFLICT (gstin) DO UPDATE SET
        pan                    = EXCLUDED.pan,
        company_name           = EXCLUDED.company_name,
        legal_name             = EXCLUDED.legal_name,
        trade_name             = EXCLUDED.trade_name,
        state                  = EXCLUDED.state,
        state_code             = EXCLUDED.state_code,
        gst_status             = EXCLUDED.gst_status,
        gst_reg_date           = EXCLUDED.gst_reg_date,
        cancellation_date      = EXCLUDED.cancellation_date,
        taxpayer_type          = EXCLUDED.taxpayer_type,
        constitution           = EXCLUDED.constitution,
        state_jurisdiction     = EXCLUDED.state_jurisdiction,
        centre_jurisdiction    = EXCLUDED.centre_jurisdiction,
        centre_code            = EXCLUDED.centre_code,
        pincode                = EXCLUDED.pincode,
        district               = EXCLUDED.district,
        branch_no              = EXCLUDED.branch_no,
        branch_name            = EXCLUDED.branch_name,
        flat_no                = EXCLUDED.flat_no,
        street                 = EXCLUDED.street,
        location               = EXCLUDED.location,
        business_nature        = EXCLUDED.business_nature,
        dealing_in             = EXCLUDED.dealing_in,
        raw_data               = EXCLUDED.raw_data,
        data_source            = EXCLUDED.data_source,
        last_verified_at       = NOW()
    `;

    console.log(`[gst.service] Saved/updated central_gst_records for ${gstin}`);
    return await getCachedGstRecord(gstin);

  } catch (err) {
    console.error('[gst.service] upsertCentralGstRecord error:', err.message);
    throw err;
  }
}

function normValue(value) {
  if (value == null) return null;
  const s = String(value).trim().replace(/\s+/g, ' ');
  return s || null;
}

function extractAddressComponents(raw) {
  const empty = {
    location: null, district: null, branch_no: null,
    branch_name: null, flat_no: null, street: null,
    state: null, pincode: null,
  };
  if (!raw) return empty;

  const LABELS = ['Branch Name','Branch No','Flat No','District','Location','Street','State','Pincode'];
  const labelPattern = LABELS.map(l => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const splitter = new RegExp(`(${labelPattern})`, 'gi');
  const parts = raw.split(splitter).map(t => t.trim()).filter(Boolean);

  const result = { ...empty };
  let districtCount = 0;
  for (let i = 0; i < parts.length - 1; i += 2) {
    const label = parts[i].replace(/\s+/g, ' ').toLowerCase();
    const value = (parts[i + 1] || '').trim().replace(/\s+/g, ' ') || null;
    if (!value) continue;
    if (label === 'district') {
      districtCount++;
      if (districtCount === 1) result.location  = value;
      else                     result.district   = value;
    } else if (label === 'branch no')   result.branch_no   = value === 'N/A' ? null : value;
    else if (label === 'branch name')   result.branch_name = value;
    else if (label === 'flat no')       result.flat_no     = value === 'N/A' ? null : value;
    else if (label === 'location')    { if (!result.district) result.district = value; }
    else if (label === 'street')        result.street      = value;
    else if (label === 'state')         result.state       = value;
    else if (label === 'pincode')       result.pincode     = value;
  }
  if (!result.pincode) {
    const m = raw.match(/(\d{6})/);
    if (m) result.pincode = m[1];
  }
  return result;
}

function parseSearchPageData(kvData, hsnData) {
  if (!kvData || Object.keys(kvData).length === 0) return null;
  const addrComp  = extractAddressComponents(kvData['Address']);
  const dealing_in = Array.isArray(hsnData) ? hsnData.filter(r => r.hsn) : [];
  return {
    gstin:     normValue(kvData['GSTIN/UIN Number'] || kvData['GSTIN / UIN Number'] || kvData['GSTIN UIN']),
    pan:       null,
    legalname: normValue(kvData['Legal Name of Business']),
    tradename: normValue(kvData['Trade Name']),
    status:    normValue(kvData['GSTIN / UIN Status'] || kvData['GSTIN UIN Status']),
    regdate:   normValue(kvData['Registration Date']),
    cancel_date: normValue(kvData['Date of Cancellation']) || null,
    constitutionofbusiness: normValue(kvData['Constitution of Business']),
    type:      normValue(kvData['Taxpayer Type']),
    business_nature: kvData['Nature of Business Activities']
      ? normValue(kvData['Nature of Business Activities']).split(',').map(s => s.trim()).filter(Boolean)
      : [],
    state_juri:  normValue(kvData['State Jurisdiction']),
    state_code:  normValue(kvData['State Code']),
    center_juri: normValue(kvData['Centre Jurisdiction']),
    center_code: normValue(kvData['Centre Code']),
    location:    addrComp.location,
    district:    addrComp.district,
    branch_no:   addrComp.branch_no,
    branch_name: addrComp.branch_name,
    flat_no:     addrComp.flat_no,
    street:      addrComp.street,
    state:       addrComp.state,
    pincode:     addrComp.pincode,
    dealing_in,
    raw: kvData,
  };
}

function buildEvaluateFn() {
  return () => {
    const n = v => v ? String(v).trim().replace(/\s+/g, ' ') || null : null;
    const kvData   = {};
    const hsnRows  = [];
    const HSN_HEADERS = new Set(['hsn','description','sac','goods','services','hsn / sac']);
    const tables = Array.from(document.querySelectorAll('table'));
    tables.forEach(table => {
      const rows = Array.from(table.querySelectorAll('tr'));
      if (!rows.length) return;
      const headerCells = rows.slice(0, 2).flatMap(r =>
        Array.from(r.querySelectorAll('th, td')).map(c => n(c.textContent))
      );
      const isHSNTable = headerCells.some(h =>
        h && (h.toLowerCase().includes('hsn') || h.toLowerCase().includes('sac'))
      );
      if (isHSNTable) {
        rows.forEach(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          const cols  = cells.map(td => n(td.textContent));
          const hasHSN = cols.some(c => c && /^\d{4,8}$/.test(c.replace(/\s/g, '')));
          if (!hasHSN) return;
          if (cols.length >= 4) {
            const gHsn = /^\d{4,8}$/.test((cols[0]||'').replace(/\s/g,'')) ? cols[0]?.replace(/\s/g,'') : null;
            const sHsn = /^\d{4,8}$/.test((cols[2]||'').replace(/\s/g,'')) ? cols[2]?.replace(/\s/g,'') : null;
            if (gHsn) hsnRows.push({ type: 'Goods',    hsn: gHsn, description: cols[1] || null });
            if (sHsn) hsnRows.push({ type: 'Services', hsn: sHsn, description: cols[3] || null });
          } else if (cols.length >= 2) {
            for (let i = 0; i < cols.length; i++) {
              if (cols[i] && /^\d{4,8}$/.test(cols[i].replace(/\s/g,''))) {
                hsnRows.push({ type: null, hsn: cols[i].replace(/\s/g,''), description: cols[i+1] || null });
                break;
              }
            }
          }
        });
      } else {
        rows.forEach(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          if (cells.length < 2) return;
          const key = n(cells[0].textContent);
          if (!key || key.length > 80) return;
          if (HSN_HEADERS.has(key.toLowerCase())) return;
          const val = key === 'Address'
            ? n(cells[1].innerText)
            : n(cells[1].textContent);
          if (val) kvData[key] = val;
        });
      }
    });
    return { kvData, hsnRows };
  };
}

function isHeadless() {
  const env = String(process.env.GST_HEADLESS || process.env.PLAYWRIGHT_HEADLESS || '').toLowerCase();
  return env === 'false' || env === '0' ? false : true;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchResource(context, resourceUrl) {
  const response = await context.request.get(resourceUrl);
  if (!response.ok()) {
    throw new Error(`Failed to fetch resource ${resourceUrl} (${response.status()})`);
  }
  return {
    body: await response.body(),
    contentType: response.headers()['content-type'] || '',
  };
}

async function fetchResourceBytes(context, resourceUrl) {
  const { body } = await fetchResource(context, resourceUrl);
  return body;
}

function cleanupAssistedSessions() {
  const now = Date.now();
  for (const [sessionId, session] of assistedSessions.entries()) {
    if ((now - session.createdAt) <= ASSISTED_SESSION_TTL_MS) continue;
    assistedSessions.delete(sessionId);
    Promise.resolve(session.browser?.close()).catch(() => {});
  }
}

async function closeAssistedSession(sessionId) {
  const session = assistedSessions.get(sessionId);
  if (!session) return;
  assistedSessions.delete(sessionId);
  try {
    await session.browser.close();
  } catch {
    // ignore browser close errors
  }
}

async function getCaptchaImageDataUrl(context, page) {
  const imgSrc = await page.evaluate(() => {
    const image = document.querySelector('img#imgCaptcha, img[src*="captcha"], img[src*="Captcha"], img[alt*="captcha" i], img[title*="captcha" i]');
    return image ? image.src || image.getAttribute('src') : null;
  });

  if (!imgSrc) return null;
  const imageUrl = new URL(imgSrc, page.url()).href;
  const { body: buffer, contentType } = await fetchResource(context, imageUrl);
  const mimeType = String(contentType || '').split(';')[0].trim().toLowerCase();
  const asText = buffer.slice(0, 16).toString('utf8').trim().toLowerCase();

  // Bot protection can return an HTML challenge at the image URL.
  if (!mimeType.startsWith('image/') || asText.startsWith('<!doctype') || asText.startsWith('<html')) {
    return null;
  }

  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

async function getCaptchaScreenshotDataUrl(page) {
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const captchaImgSelectors = [
    'img#imgCaptcha',
    'img[src*="captcha" i]',
    'img[alt*="captcha" i]',
    'img[title*="captcha" i]'
  ];

  try {
    let box = null;

    for (const selector of captchaImgSelectors) {
      const loc = page.locator(selector).first();
      const count = await loc.count();
      if (!count) continue;
      const b = await loc.boundingBox().catch(() => null);
      if (b && b.width > 20 && b.height > 10) {
        box = { ...b };
        break;
      }
    }

    if (!box) {
      const input = await findCaptchaInput(page, 1500);
      if (input) {
        const b = await input.boundingBox().catch(() => null);
        if (b && b.width > 20 && b.height > 10) {
          box = {
            x: b.x - 30,
            y: b.y - 30,
            width: Math.max(b.width + 60, 320),
            height: Math.max(b.height + 130, 120),
          };
        }
      }
    }

    if (box) {
      const viewport = page.viewportSize() || { width: 1366, height: 768 };
      const clip = {
        x: clamp(Math.floor(box.x), 0, Math.max(0, viewport.width - 1)),
        y: clamp(Math.floor(box.y), 0, Math.max(0, viewport.height - 1)),
        width: clamp(Math.ceil(box.width), 40, viewport.width),
        height: clamp(Math.ceil(box.height), 30, viewport.height),
      };

      if (clip.x + clip.width > viewport.width) {
        clip.width = viewport.width - clip.x;
      }
      if (clip.y + clip.height > viewport.height) {
        clip.height = viewport.height - clip.y;
      }

      const buffer = await page.screenshot({ type: 'png', clip });
      return `data:image/png;base64,${buffer.toString('base64')}`;
    }

    const challengeSection = page.locator('form, .searchtp-content, .container, body').first();
    const buffer = await challengeSection.screenshot({ type: 'png' });
    return `data:image/png;base64,${buffer.toString('base64')}`;
  } catch {
    try {
      const buffer = await page.screenshot({ type: 'png', fullPage: false });
      return `data:image/png;base64,${buffer.toString('base64')}`;
    } catch {
      return null;
    }
  }
}

async function findCaptchaInput(page, timeoutMs = 20000) {
  const selectors = [
    'input[id*="captcha" i]',
    'input[name*="captcha" i]',
    'input[placeholder*="Characters" i]',
    'input[placeholder*="captcha" i]',
    'input[aria-label*="captcha" i]',
    'input[type="text"]',
  ];

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const sel of selectors) {
      const handle = await page.$(sel);
      if (!handle) continue;
      const visible = await handle.isVisible().catch(() => false);
      const enabled = await handle.isEnabled().catch(() => false);
      if (visible && enabled) return handle;
    }
    await page.waitForTimeout(500);
  }
  return null;
}

async function dismissPortalModalIfPresent(page) {
  const candidates = [
    'button:has-text("OK")',
    'button:has-text("I Agree")',
    'button:has-text("Accept")',
    '.modal-dialog button.btn-primary',
  ];

  for (const selector of candidates) {
    const el = await page.$(selector);
    if (!el) continue;
    const visible = await el.isVisible().catch(() => false);
    if (!visible) continue;
    await el.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(400);
    break;
  }
}

async function clickSearchOnPortal(page) {
  const candidates = [
    '#lotsearch',
    'button[type="submit"]',
    'input[type="submit"]',
    'input[type="button"][value*="Search" i]',
    'button:has-text("Search")',
  ];

  for (const selector of candidates) {
    const el = await page.$(selector);
    if (!el) continue;
    const visible = await el.isVisible().catch(() => false);
    if (visible) {
      await el.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(700);
      return true;
    }
  }

  // Final fallback: click by JS in case visibility checks are strict due overlays.
  const clicked = await page.evaluate(() => {
    const btn = document.querySelector('#lotsearch, button[type="submit"], input[type="submit"], button');
    if (!btn) return false;
    btn.click();
    return true;
  }).catch(() => false);

  if (clicked) await page.waitForTimeout(700);
  return clicked;
}

async function typeIntoFieldLikeHuman(page, fieldHandle, text) {
  await fieldHandle.click({ clickCount: 3 }).catch(() => {});
  await page.keyboard.press('Backspace').catch(() => {});
  await page.waitForTimeout(120);

  for (const ch of String(text || '')) {
    await page.keyboard.type(ch, { delay: 95 });
    await page.waitForTimeout(45);
  }

  // Trigger blur/change style listeners used by some anti-bot forms.
  await page.keyboard.press('Tab').catch(() => {});
  await page.waitForTimeout(150);
}

async function extractOfficialPageData(page) {
  return await page.evaluate(() => {
    const root = document.querySelector('#lottable') || document.querySelector('div[data-ng-show="for_gstin.searchresult"]') || document.body;
    const kvData = {};
    const hsnRows = [];

    const heading = root.querySelector('h4');
    if (heading) {
      const match = heading.innerText.match(/GSTIN\/?UIN\s*:\s*(\S+)/i);
      if (match) kvData['GSTIN/UIN Number'] = match[1].trim();
    }

    const strongs = Array.from(root.querySelectorAll('p strong'));
    strongs.forEach(strong => {
      const label = strong.textContent.trim().replace(/:$/, '');
      let value = '';
      const parent = strong.parentElement;
      if (parent?.nextElementSibling?.tagName === 'P') {
        value = parent.nextElementSibling.textContent.trim();
      } else {
        value = parent.textContent.replace(strong.textContent, '').trim();
      }
      if (label && value) {
        kvData[label] = value;
      }
    });

    const addressEl = root.querySelector('p[data-ng-bind*="pradr"], p.wordCls, .principal-place, .address, #principalPlace');
    if (addressEl) kvData['Address'] = addressEl.innerText.trim();

    const natureItems = Array.from(root.querySelectorAll('ul.list-child-inline li')).map(li => li.textContent.trim()).filter(Boolean);
    if (natureItems.length) {
      kvData['Nature of Business Activities'] = natureItems.join(', ');
    }

    const rows = Array.from(root.querySelectorAll('table.table tbody tr'));
    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim());
      if (cells.length >= 4) {
        const gHsn = cells[0].replace(/\s/g, '');
        const gDesc = cells[1].trim();
        const sHsn = cells[2].replace(/\s/g, '');
        const sDesc = cells[3].trim();
        if (/^\d{4,8}$/.test(gHsn)) hsnRows.push({ type: 'Goods', hsn: gHsn, description: gDesc || null });
        if (/^\d{4,8}$/.test(sHsn)) hsnRows.push({ type: 'Services', hsn: sHsn, description: sDesc || null });
      }
    });

    const errorMsg = document.querySelector('.err, .error, .alert-danger, .text-danger')?.textContent?.trim() || null;
    return { kvData, hsnRows, errorMsg };
  });
}

async function createAssistedCaptchaSession(gstinUpper) {
  cleanupAssistedSessions();

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox','--disable-setuid-sandbox',
      '--disable-dev-shm-usage','--disable-gpu',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  try {
    const context = await browser.newContext({
      locale: 'en-IN',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    const page = await context.newPage();
    const possibleUrls = [
      'https://services.gst.gov.in/services/searchtp',
      'https://www.gst.gov.in/search-taxpayer',
    ];

    let loaded = false;
    for (const url of possibleUrls) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        loaded = true;
        break;
      } catch {
        // try next URL
      }
    }
    if (!loaded) throw new Error('Could not open GST search page');

    await dismissPortalModalIfPresent(page);

    const gstInput = await page.waitForSelector('input#for_gstin[name="for_gstin"], input[name*="gst" i], input[id*="gst" i]', { timeout: 25000 });
    await gstInput.click().catch(() => {});
    await page.waitForTimeout(100);
    await typeIntoFieldLikeHuman(page, gstInput, gstinUpper);
    await page.waitForTimeout(350);

    let captchaInput = await findCaptchaInput(page, 15000);
    if (!captchaInput) {
      await clickSearchOnPortal(page);
      await dismissPortalModalIfPresent(page);
      captchaInput = await findCaptchaInput(page, 12000);
    }
    if (!captchaInput) {
      const refreshBtn = await page.$('img[src*="refresh" i], button[aria-label*="refresh" i], a[title*="refresh" i]');
      if (refreshBtn) {
        await refreshBtn.click().catch(() => {});
        await page.waitForTimeout(1000);
      }
      captchaInput = await findCaptchaInput(page, 15000);
    }
    if (!captchaInput) throw new Error('CAPTCHA input not available on GST portal right now');

    let captchaImageDataUrl = await getCaptchaImageDataUrl(context, page);
    if (!captchaImageDataUrl) {
      captchaImageDataUrl = await getCaptchaScreenshotDataUrl(page);
    }
    if (!captchaImageDataUrl) {
      throw new Error('CAPTCHA challenge unavailable on GST portal right now');
    }

    const sessionId = require('crypto').randomUUID();
    assistedSessions.set(sessionId, {
      sessionId,
      gstin: gstinUpper,
      browser,
      context,
      page,
      createdAt: Date.now(),
      attempts: 0,
    });

    return {
      sessionId,
      gstin: gstinUpper,
      captchaImageDataUrl,
      expiresInSeconds: Math.floor(ASSISTED_SESSION_TTL_MS / 1000),
    };
  } catch (err) {
    await browser.close().catch(() => {});
    throw err;
  }
}

async function submitAssistedCaptchaSession(sessionId, captchaText) {
  cleanupAssistedSessions();

  const session = assistedSessions.get(sessionId);
  if (!session) {
    return {
      status: 'expired',
      message: 'Assisted session expired. Start again.',
    };
  }

  const { context, page, gstin } = session;
  session.attempts += 1;

  const searchButton = '#lotsearch, button[type="submit"], button:has-text("Search")';

  const captchaInput = await findCaptchaInput(page, 15000);
  if (!captchaInput) {
    await closeAssistedSession(sessionId);
    return {
      status: 'failed',
      message: 'CAPTCHA input is not available anymore. Please start again.',
    };
  }

  await typeIntoFieldLikeHuman(page, captchaInput, String(captchaText || '').trim());

  const button = await page.$(searchButton);
  if (!button) {
    await closeAssistedSession(sessionId);
    throw new Error('Search button not found on GST portal');
  }

  await Promise.all([
    button.click(),
    page.waitForTimeout(1200),
  ]);

  const extracted = await extractOfficialPageData(page);
  if (extracted.errorMsg && /invalid|captcha|character/i.test(extracted.errorMsg)) {
    const captchaImageDataUrl = await getCaptchaImageDataUrl(context, page);
    return {
      status: 'captcha_invalid',
      message: extracted.errorMsg,
      captchaImageDataUrl,
      attempts: session.attempts,
    };
  }

  if (!extracted.kvData || Object.keys(extracted.kvData).length === 0) {
    await closeAssistedSession(sessionId);
    return {
      status: 'failed',
      message: extracted.errorMsg || 'Could not extract GST details from result page.',
    };
  }

  const parsed = parseSearchPageData(extracted.kvData, extracted.hsnRows);
  if (!parsed) {
    await closeAssistedSession(sessionId);
    return {
      status: 'failed',
      message: 'GST details could not be parsed.',
    };
  }

  const hasMeaningfulResult = Boolean(
    parsed.gstin && (
      parsed.legalname ||
      parsed.tradename ||
      parsed.status ||
      parsed.regdate ||
      parsed.state ||
      parsed.pincode ||
      parsed.center_juri ||
      parsed.state_juri
    )
  );

  if (!hasMeaningfulResult) {
    const captchaImageDataUrl = await getCaptchaImageDataUrl(context, page) || await getCaptchaScreenshotDataUrl(page);
    return {
      status: 'captcha_invalid',
      message: 'Captcha validation failed or GST details not available. Please try again.',
      captchaImageDataUrl,
      attempts: session.attempts,
    };
  }

  parsed.gstin = parsed.gstin || gstin;
  parsed.source = 'gst.gov.in-assisted';
  await closeAssistedSession(sessionId);

  return {
    status: 'completed',
    data: parsed,
  };
}

async function scrapeOfficialGstSite(gstinUpper) {
  // The official GST portal requires a human to solve the CAPTCHA. We intentionally avoid
  // any voice/OCR auto-solver here to keep the flow stable, fast, and compatible with low-speed networks.
  // The public UI uses the assisted/manual captcha flow that opens the official GST page,
  // shows the captcha image, and waits for the user to submit it.
  throw new Error(`Official GST verification for ${gstinUpper} requires manual captcha entry via the assisted flow.`);
}

async function doScrape(gstinUpper) {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox','--disable-setuid-sandbox',
      '--disable-dev-shm-usage','--disable-gpu',
      '--disable-blink-features=AutomationControlled',
    ],
  });
  const context = await browser.newContext({
    locale:    'en-IN',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });
  const page = await context.newPage();
  try {
    await page.goto('https://www.gstsearch.in', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const inputSelector = 'input[name="gstn"], input#gst, input.form-control[type="text"]';
    await page.waitForSelector(inputSelector, { timeout: 15000 });
    await page.fill(inputSelector, gstinUpper);
    const submitSelector = 'button[name="submit"], button[type="submit"], input[type="submit"], button:has-text("Search")';
    await Promise.all([
      page.click(submitSelector),
      page.waitForSelector('.panel.panel-primary table tr, .panel-body table tr, table tr td', { timeout: 25000 }),
    ]);
    await page.waitForTimeout(600);
    const { kvData, hsnRows } = await page.evaluate(buildEvaluateFn());
    console.log(`[gst.service] Scraped ${gstinUpper}: kv=${Object.keys(kvData).length} HSN=${hsnRows.length}`);
    if (Object.keys(kvData).length === 0) return null;
    return parseSearchPageData(kvData, hsnRows);
  } finally {
    await browser.close();
  }
}

async function scrapeKnowYourGST(gstinUpper) {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox','--disable-setuid-sandbox',
      '--disable-dev-shm-usage','--disable-gpu',
      '--disable-blink-features=AutomationControlled',
    ],
  });
  const context = await browser.newContext({
    locale:    'en-IN',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });
  const page = await context.newPage();
  try {
    await page.goto(`https://www.knowyourgst.com/gst-search/?gstin=${gstinUpper}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.result-box, .gst-details, .result-panel', { timeout: 15000 });
    
    const data = await page.evaluate(() => {
      const getText = (sel) => document.querySelector(sel)?.innerText?.trim() || '';
      // Try JSON-LD first
      const ldJson = document.querySelector('script[type="application/ld+json"]');
      let result = {};
      if (ldJson) {
        try {
          const json = JSON.parse(ldJson.innerText);
          result = {
            gstin: json.gstin || json.taxID?.replace('GSTIN:', ''),
            legalname: json.name,
            tradename: json.alternateName,
            pan: json.taxID?.includes('PAN') ? json.taxID.split('PAN')[1]?.trim() : '',
            regdate: json.startDate,
            status: json.status,
          };
        } catch(e) {}
      }
      // Fallback to DOM selectors
      return {
        ...result,
        address: getText('.address, .principal-place'),
        state: getText('.state'),
        pincode: getText('.pincode'),
        taxpayerType: getText('.taxpayer-type'),
        constitutionofbusiness: getText('.constitution'),
      };
    });
    
    if (!data.gstin && !data.legalname) {
      throw new Error('No GST data found on KnowYourGST');
    }
    
    // Normalize to match gstsearch.in format
    return {
      gstin: data.gstin || gstinUpper,
      pan: data.pan || null,
      legalname: data.legalname || null,
      tradename: data.tradename || null,
      status: data.status || 'Active',
      regdate: data.regdate || null,
      constitutionofbusiness: data.constitutionofbusiness || null,
      type: data.taxpayerType || null,
      business_nature: [],
      state_juri: null,
      state_code: null,
      center_juri: null,
      center_code: null,
      location: null,
      district: null,
      branch_no: null,
      branch_name: null,
      flat_no: null,
      street: null,
      state: data.state || null,
      pincode: data.pincode || null,
      dealing_in: [],
      raw: data,
      source: 'knowyourgst',
    };
  } finally {
    await browser.close();
  }
}

async function scrapeTallyGST(gstinUpper) {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox','--disable-setuid-sandbox',
      '--disable-dev-shm-usage','--disable-gpu',
      '--disable-blink-features=AutomationControlled',
    ],
  });
  const context = await browser.newContext({
    locale:    'en-IN',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });
  const page = await context.newPage();
  try {
    await page.goto('https://tallysolutions.com/gst-verification/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('input#gstin[name="gstin"]', { timeout: 15000 });
    await page.fill('input#gstin[name="gstin"]', gstinUpper);
    await Promise.all([
      page.click('#generateDetailsBtn'),
      page.waitForSelector('.gstinDetailsSection, #legalName, .gstin-search-result', { timeout: 25000 }),
    ]);
    const data = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.gstinDetailsSection h4'));
      const result = {};
      rows.forEach(header => {
        const label = header.innerText.trim();
        const value = header.nextElementSibling?.innerText.trim() || '';
        if (label && value) {
          result[label] = value;
        }
      });
      // fallback by element IDs if available
      const pick = (id, label) => {
        const el = document.querySelector(`#${id}`);
        if (el?.innerText?.trim()) result[label] = el.innerText.trim();
      };
      pick('legalName', 'Legal Name of Business');
      pick('tradeName', 'Trade Name');
      pick('effectiveDate', 'Effective Date of registration');
      pick('gstinStatus', 'GSTIN / UIN Status');
      pick('principalPlace', 'Principal Place of Business');
      pick('natureOfBusiness', 'Nature of Business Activities');
      return result;
    });

    if (!data['GSTIN / UIN'] && !data['Legal Name of Business']) {
      throw new Error('No GST data found on Tally Solutions');
    }

    return {
      gstin: data['GSTIN / UIN'] || gstinUpper,
      pan: null,
      legalname: data['Legal Name of Business'] || null,
      tradename: data['Trade Name'] || null,
      status: data['GSTIN / UIN Status'] || null,
      regdate: data['Effective Date of registration'] || null,
      constitutionofbusiness: data['Constitution of Business'] || null,
      type: data['Taxpayer Type'] || null,
      business_nature: data['Nature of Business Activities'] ? [data['Nature of Business Activities']] : [],
      state_juri: null,
      state_code: null,
      center_juri: null,
      center_code: null,
      location: null,
      district: null,
      branch_no: null,
      branch_name: null,
      flat_no: null,
      street: null,
      state: null,
      pincode: null,
      dealing_in: [],
      raw: data,
    };
  } finally {
    await browser.close();
  }
}

async function scrapeGstSearchSite(gstinUpper) {
  const providers = [
    { name: 'gst.gov.in', fn: () => scrapeOfficialGstSite(gstinUpper) },
    { name: 'gstsearch.in', fn: () => doScrape(gstinUpper) },
    { name: 'knowyourgst', fn: () => scrapeKnowYourGST(gstinUpper) },
    { name: 'tally', fn: () => scrapeTallyGST(gstinUpper) },
  ];

  for (const provider of providers) {
    try {
      console.log(`[gst.service] Trying ${provider.name} for ${gstinUpper}...`);
      const result = await provider.fn();
      if (result) {
        result.source = provider.name;
        console.log(`[gst.service] Success from ${provider.name}`);
        return result;
      }
    } catch (err) {
      console.warn(`[gst.service] ${provider.name} failed: ${err.message}`);
    }
  }

  throw new Error('All GST providers failed to fetch data');
}

const CACHE_TTL_DAYS = 30; // Re-verify GST data every 30 days

function parseIndianDate(dateStr) {
  if (!dateStr) return null;
  const match = String(dateStr).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseAddress(addressStr) {
  if (!addressStr) {
    return {
      address_line: null, flat_no: null, street: null,
      location: null, city: null, district: null, state: null, pincode: null
    };
  }

  const parts = String(addressStr)
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p && p !== 'na' && p !== 'NA' && p !== 'N/A');

  const pincodeMatch = addressStr.match(/(\d{6})/);
  const pincode = pincodeMatch ? pincodeMatch[1] : null;

  let state = null;
  let district = null;
  let location = null;
  if (pincode) {
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
    flat_no: null,
    street: parts[1] || null,
    location,
    city: location || district,
    district,
    state,
    pincode
  };
}

function normalizeStatus(raw = '') {
  const s = String(raw).toLowerCase();
  if (s.includes('active')) return 'Active';
  if (s.includes('cancel')) return 'Cancelled';
  if (s.includes('suspend')) return 'Suspended';
  if (s.includes('provisional')) return 'Provisionally Cancelled';
  return 'Unknown';
}

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
      if (typeof rec.business_nature === 'string') {
        try { rec.business_nature = JSON.parse(rec.business_nature); } catch { rec.business_nature = []; }
      }
      if (typeof rec.dealing_in === 'string') {
        try { rec.dealing_in = JSON.parse(rec.dealing_in); } catch { rec.dealing_in = []; }
      }
      if (typeof rec.raw_data === 'string') {
        try { rec.raw = JSON.parse(rec.raw_data); } catch { rec.raw = {}; }
      } else if (typeof rec.raw === 'string') {
        try { rec.raw = JSON.parse(rec.raw); } catch { rec.raw = {}; }
      } else {
        rec.raw = rec.raw_data || rec.raw || {};
      }
      return rec;
    }
    return null;
  } catch (err) {
    console.warn('[GST.DB] getGstRecord error:', err.message);
    return null;
  }
}

function isGstRecordStale(record) {
  if (!record || !record.last_verified_at) return true;
  const lastVerified = new Date(record.last_verified_at);
  const now = new Date();
  const daysDiff = (now - lastVerified) / (1000 * 60 * 60 * 24);
  return daysDiff > CACHE_TTL_DAYS;
}

async function saveGstData(gstinLookupResult, metadata = {}) {
  const db = getOptionalCentralDB();
  if (!db) {
    console.warn('[GST.DB] No database configured — skipping save');
    return null;
  }

  const gstin = gstinLookupResult.gstin;
  const pan = gstinLookupResult.pan || null;
  const legalName = gstinLookupResult.legalName || gstinLookupResult.legalname || null;
  const tradeName = gstinLookupResult.tradeName || gstinLookupResult.tradename || null;
  const status = gstinLookupResult.status || null;
  const registrationDate = gstinLookupResult.registrationDate || gstinLookupResult.regdate || null;
  const cancelDate = gstinLookupResult.cancelDate || gstinLookupResult.cancel_date || gstinLookupResult.canceldate || null;
  const taxpayerType = gstinLookupResult.taxpayerType || gstinLookupResult.type || null;
  const constitution = gstinLookupResult.constitution || gstinLookupResult.constitutionofbusiness || null;
  const businessType = gstinLookupResult.businessType || null;
  const businessNature = Array.isArray(gstinLookupResult.businessNature) && gstinLookupResult.businessNature.length
    ? gstinLookupResult.businessNature
    : (Array.isArray(gstinLookupResult.business_nature) ? gstinLookupResult.business_nature : []);
  const dealingIn = Array.isArray(gstinLookupResult.dealingIn) && gstinLookupResult.dealingIn.length
    ? gstinLookupResult.dealingIn
    : (Array.isArray(gstinLookupResult.dealing_in) ? gstinLookupResult.dealing_in : []);

  const composedAddress = [
    gstinLookupResult.flat_no,
    gstinLookupResult.branch_name,
    gstinLookupResult.branch_no ? `Branch No. ${gstinLookupResult.branch_no}` : null,
    gstinLookupResult.street,
    gstinLookupResult.location,
    gstinLookupResult.district,
    gstinLookupResult.state,
    gstinLookupResult.pincode,
  ].filter(Boolean).join(', ');

  const address = gstinLookupResult.address || gstinLookupResult.address_line || composedAddress || null;
  const state = gstinLookupResult.state || null;
  const district = gstinLookupResult.district || null;
  const pincode = gstinLookupResult.pincode || null;
  const stateJuri = gstinLookupResult.stateJuri || gstinLookupResult.state_juri || null;
  const centerJuri = gstinLookupResult.centerJuri || gstinLookupResult.center_juri || null;
  const centerCode = gstinLookupResult.centerCode || gstinLookupResult.center_code || null;
  const branchNo = gstinLookupResult.branchNo || gstinLookupResult.branch_no || null;
  const branchName = gstinLookupResult.branchName || gstinLookupResult.branch_name || null;
  const aadhaarAuthDate = gstinLookupResult.aadhaarAuthDate || gstinLookupResult.aadhaar_auth_date || null;
  const source = gstinLookupResult.source || 'official';
  const rawData = (gstinLookupResult.rawData && Object.keys(gstinLookupResult.rawData).length)
    ? gstinLookupResult.rawData
    : ((gstinLookupResult.raw_data && Object.keys(gstinLookupResult.raw_data).length)
      ? gstinLookupResult.raw_data
      : (gstinLookupResult.raw || {}));

  if (!gstin) {
    throw new Error('saveGstData requires gstin');
  }

  const regDate = parseIndianDate(registrationDate);
  const cancelDateParsed = parseIndianDate(cancelDate);
  const aadhaarDateParsed = parseIndianDate(aadhaarAuthDate);
  const addressParts = parseAddress(address);
  const { tenantId = null, userId = null } = metadata;

  try {
    await db.$executeRaw`
      INSERT INTO central_gst_records (
        gstin, pan,
        company_name, legal_name, trade_name,
        state, state_code,
        gst_status, gst_reg_date, cancellation_date,
        taxpayer_type, constitution,
        state_jurisdiction, centre_jurisdiction, centre_code,
        pincode, district, branch_no, branch_name, flat_no, street, location,
        business_nature, dealing_in,
        raw_data, data_source,
        verification_status, lookup_error_message,
        last_verified_at, created_at
      ) VALUES (
        ${gstin}, ${pan || null},
        ${legalName || tradeName || null}, ${legalName || null}, ${tradeName || null},
        ${state || addressParts.state || null},
        ${gstin.substring(0, 2)},
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
        'verified', NULL,
        NOW(), NOW()
      )
      ON CONFLICT (gstin) DO UPDATE SET
        pan                    = EXCLUDED.pan,
        company_name           = EXCLUDED.company_name,
        legal_name             = EXCLUDED.legal_name,
        trade_name             = EXCLUDED.trade_name,
        state                  = EXCLUDED.state,
        gst_status             = EXCLUDED.gst_status,
        gst_reg_date           = EXCLUDED.gst_reg_date,
        cancellation_date      = EXCLUDED.cancellation_date,
        taxpayer_type          = EXCLUDED.taxpayer_type,
        constitution           = EXCLUDED.constitution,
        state_jurisdiction     = EXCLUDED.state_jurisdiction,
        centre_jurisdiction    = EXCLUDED.centre_jurisdiction,
        centre_code            = EXCLUDED.centre_code,
        pincode                = EXCLUDED.pincode,
        district               = EXCLUDED.district,
        branch_no              = EXCLUDED.branch_no,
        branch_name            = EXCLUDED.branch_name,
        flat_no                = EXCLUDED.flat_no,
        street                 = EXCLUDED.street,
        location               = EXCLUDED.location,
        business_nature        = EXCLUDED.business_nature,
        dealing_in             = EXCLUDED.dealing_in,
        raw_data               = EXCLUDED.raw_data,
        data_source            = EXCLUDED.data_source,
        verification_status    = 'verified',
        lookup_error_message   = NULL,
        last_verified_at       = NOW()
    `;

    console.log(`[GST.DB] Saved GSTIN ${gstin} to database`);

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
    if (process.env.ENABLE_GST_AUDIT_LOG === 'true') {
      try {
        await db.$executeRaw`
          INSERT INTO gst_lookup_log (
            gstin, tenant_id, status, error_message, created_at
          ) VALUES (
            ${gstin}, ${tenantId}, 'failed', ${err.message}, NOW()
          )
        `;
      } catch {
        // Ignore audit log write failure
      }
    }
    throw err;
  }
}

module.exports = {
  GSTIN_REGEX,
  parseGstinStructure,
  scrapeGstSearchSite,
  createAssistedCaptchaSession,
  submitAssistedCaptchaSession,
  closeAssistedSession,
  readCentralGstRecord,      
  getCachedGstRecord,
  upsertCentralGstRecord,
  getGstRecord,
  saveGstData,
  isGstRecordStale,
};

