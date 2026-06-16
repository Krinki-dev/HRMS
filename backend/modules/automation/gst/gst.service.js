'use strict';

const { chromium } = require('playwright');
const { getOptionalCentralDB } = require('../../../shared/utils/centralDb');

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const CACHE_TTL_HOURS = 24;

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
        gstin, pan, company_name, legalname, tradename,
        state, state_code, status, regdate, type,
        constitutionofbusiness, business_nature, pincode,
        center_juri, center_code, state_juri, cancel_date,
        dealing_in, district, branch_no, flat_no, street,
        branch_name, location, created_at
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
      cachedAt:        row.created_at,
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
        gstin, pan, company_name, legalname, tradename,
        state, state_code, status, regdate, cancel_date,
        type, constitutionofbusiness,
        state_juri, center_juri, center_code,
        pincode, district, branch_no, branch_name, flat_no, street, location,
        business_nature, dealing_in, raw_data, source,
        cached_at
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
        legalname              = EXCLUDED.legalname,
        tradename              = EXCLUDED.tradename,
        state                  = EXCLUDED.state,
        state_code             = EXCLUDED.state_code,
        status                 = EXCLUDED.status,
        regdate                = EXCLUDED.regdate,
        cancel_date            = EXCLUDED.cancel_date,
        type                   = EXCLUDED.type,
        constitutionofbusiness = EXCLUDED.constitutionofbusiness,
        state_juri             = EXCLUDED.state_juri,
        center_juri            = EXCLUDED.center_juri,
        center_code            = EXCLUDED.center_code,
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
        source                 = EXCLUDED.source,
        cached_at              = NOW()
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

async function fetchResourceBytes(context, resourceUrl) {
  const response = await context.request.get(resourceUrl);
  if (!response.ok()) {
    throw new Error(`Failed to fetch resource ${resourceUrl} (${response.status()})`);
  }
  return await response.body();
}

async function recognizeAudioCaptchaBuffer(buffer) {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    throw new Error('ASSEMBLYAI_API_KEY is not set; audio CAPTCHA recognition is unavailable');
  }

  const uploadResp = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'Content-Type': 'application/octet-stream',
    },
    body: buffer,
  });

  if (!uploadResp.ok) {
    const body = await uploadResp.text();
    throw new Error(`AssemblyAI upload failed: ${uploadResp.status} ${body}`);
  }

  const uploadData = await uploadResp.json();
  const uploadUrl = uploadData.upload_url;
  if (!uploadUrl) {
    throw new Error('AssemblyAI upload did not return an upload_url');
  }

  const transcriptResp = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ audio_url: uploadUrl, punctuate: false, language_model: 'assemblyai_default' }),
  });

  if (!transcriptResp.ok) {
    const body = await transcriptResp.text();
    throw new Error(`AssemblyAI transcript request failed: ${transcriptResp.status} ${body}`);
  }

  const transcriptData = await transcriptResp.json();
  const transcriptId = transcriptData.id;
  if (!transcriptId) {
    throw new Error('AssemblyAI transcript creation failed');
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    await sleep(1200);
    const statusResp = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      method: 'GET',
      headers: { authorization: apiKey },
    });
    if (!statusResp.ok) {
      const body = await statusResp.text();
      throw new Error(`AssemblyAI status failed: ${statusResp.status} ${body}`);
    }
    const statusData = await statusResp.json();
    if (statusData.status === 'completed') {
      return statusData.text?.trim() || null;
    }
    if (statusData.status === 'error') {
      throw new Error(`AssemblyAI transcription error: ${statusData.error || 'unknown'}`);
    }
  }

  throw new Error('AssemblyAI transcription timed out');
}

async function recognizeImageCaptcha(context, page) {
  if (!Tesseract) {
    throw new Error('Tesseract not installed; image CAPTCHA recognition not available');
  }

  const imgSrc = await page.evaluate(() => {
    const image = document.querySelector('img#imgCaptcha, img[src*="captcha"], img[src*="Captcha"]');
    return image ? image.src || image.getAttribute('src') : null;
  });
  if (!imgSrc) {
    throw new Error('No CAPTCHA image found for OCR');
  }
  const imageUrl = new URL(imgSrc, page.url()).href;
  const buffer = await fetchResourceBytes(context, imageUrl);
  const result = await Tesseract.recognize(buffer);
  return result.data.text.replace(/\s/g, '').toUpperCase().slice(0, 8);
}

async function scrapeOfficialGstSite(gstinUpper) {
  const headless = isHeadless();
  const browser = await chromium.launch({
    headless,
    args: [
      '--no-sandbox','--disable-setuid-sandbox',
      '--disable-dev-shm-usage','--disable-gpu',
      '--disable-blink-features=AutomationControlled',
    ],
  });
  const context = await browser.newContext({
    locale: 'en-IN',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });
  const page = await context.newPage();

  try {
    console.log(`[gst.service] Opening official GST search page for ${gstinUpper} headless=${headless}`);
    await page.goto('https://services.gst.gov.in/services/searchtp', { waitUntil: 'domcontentloaded', timeout: 45000 });

    const gstInput = 'input#for_gstin[name="for_gstin"]';
    await page.waitForSelector(gstInput, { timeout: 20000 });
    await page.click(gstInput, { clickCount: 3 });
    await page.fill(gstInput, '');
    await page.waitForTimeout(300);
    for (const char of gstinUpper) {
      await page.keyboard.type(char);
      await page.waitForTimeout(80);
    }

    const captchaInput = 'input[id*="captcha"], input[name*="captcha"], input[placeholder*="Characters"]';
    await page.waitForSelector(captchaInput, { timeout: 20000 });

    let captchaValue = null;
    const audioSrc = await page.evaluate(() => {
      const audio = document.querySelector('audio#audioCap, audio[autoplay], audio');
      if (!audio) return null;
      return audio.currentSrc || audio.src || audio.querySelector('source')?.src || null;
    });

    if (audioSrc) {
      try {
        const audioUrl = new URL(audioSrc, page.url()).href;
        const audioBuffer = await fetchResourceBytes(context, audioUrl);
        const recognized = await recognizeAudioCaptchaBuffer(audioBuffer);
        if (recognized) {
          captchaValue = recognized.replace(/\s/g, '').toUpperCase();
          console.log(`[gst.service] Audio CAPTCHA recognized: ${captchaValue}`);
        }
      } catch (err) {
        console.warn('[gst.service] Audio CAPTCHA recognition failed:', err.message);
      }
    }

    if (!captchaValue) {
      try {
        captchaValue = await recognizeImageCaptcha(context, page);
        console.log(`[gst.service] OCR CAPTCHA fallback: ${captchaValue}`);
      } catch (err) {
        console.warn('[gst.service] Image CAPTCHA fallback failed:', err.message);
      }
    }

    if (!captchaValue) {
      throw new Error('Could not solve CAPTCHA automatically. Set ASSEMBLYAI_API_KEY for audio or install tesseract.js for OCR fallback.');
    }

    await page.fill(captchaInput, captchaValue);

    const searchButton = await page.$('#lotsearch, button[type="submit"], button:has-text("Search")');
    if (!searchButton) {
      throw new Error('Search button not found on official GST page');
    }

    await Promise.all([
      searchButton.click(),
      page.waitForSelector('#lottable, .searchresult, div.tbl-format, .err, .alert', { timeout: 30000 }),
    ]);

    await page.waitForTimeout(800);

    const result = await page.evaluate(() => {
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

      return { kvData, hsnRows };
    });

    if (!result || Object.keys(result.kvData).length === 0) {
      throw new Error('Official GST page returned no usable data');
    }
    console.log(`[gst.service] Official GST page scraped ${gstinUpper}: keys=${Object.keys(result.kvData).length} rows=${result.hsnRows.length}`);
    return parseSearchPageData(result.kvData, result.hsnRows);
  } finally {
    await browser.close();
  }
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

module.exports = {
  GSTIN_REGEX,
  parseGstinStructure,
  scrapeGstSearchSite,
  readCentralGstRecord,      
  getCachedGstRecord,
  upsertCentralGstRecord,
};

