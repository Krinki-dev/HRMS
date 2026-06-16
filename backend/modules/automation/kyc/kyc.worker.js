const path = require('path');
const fs   = require('fs');
const os   = require('os');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { upsertKycRecord } = require('../../../shared/utils/centralDb');
const { encrypt }         = require('../../../shared/utils/encryption');
const logger = require('../../../shared/utils/logger');
const { THEME } = require('../../../shared/utils/uiConstants');

const T = {
  CHAR_MIN:        80,   
  CHAR_MAX:        200,  
  AFTER_FILL:      800,  
  AFTER_CLICK:     2500, 
  AFTER_NAV:       3000, 
  CAPTCHA_LOAD:    4000, 
  OTP_CONFIRM:     5000, 
  DOWNLOAD_WAIT:   120 * 1000, 
  PAGE_LOAD:       60 * 1000,  
  ELEMENT_WAIT:    30 * 1000,  
  ELEMENT_LONG:    60 * 1000,  
  POLL_DB:         2000,        
  CAPTCHA_TIMEOUT: 10 * 60 * 1000, 
  OTP_TIMEOUT:     15 * 60 * 1000, 
  REVIEW_TIMEOUT:  15 * 60 * 1000, 
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const jitter = (base, spread = 200) =>
  sleep(base + Math.floor(Math.random() * spread));

function makeLogger(taskId, addTaskLog) {
  let n = 0;
  return async (msg, status = 'success', err = null) => {
    n++;
    const icon = status === 'failed' ? THEME.ICONS.ERROR : (status === 'warning' ? THEME.ICONS.WARNING : THEME.ICONS.SUCCESS);
    console.log(`${icon} [AadhaarWorker] [Step ${String(n).padStart(2,'0')}] ${msg}${err ? ' | ERR: '+err : ''}`);
    try { await addTaskLog(taskId, n, msg, status, err || undefined); } catch {}
  };
}

function friendlyErrorMessage(err) {
  const message = String(err?.message || err || 'Automation failed').toLowerCase();
  if (message.includes('review not confirmed')) return `${THEME.ICONS.WARNING} Review was not confirmed. Please verify the data.`;
  if (message.includes('otp not confirmed')) return `${THEME.ICONS.ERROR} OTP verification failed. Please retry with the correct 6-digit code.`;
  if (message.includes('too many captcha attempts')) return `${THEME.ICONS.LOCK} Too many captcha attempts. Task aborted for security.`;
  if (message.includes('dashboard not reached')) return `${THEME.ICONS.BROWSER} UIDAI dashboard unreachable. Portal might be down.`;
  if (message.includes('share code section not found')) return `${THEME.ICONS.WARNING} Share code section missing. Session may have timed out.`;
  if (message.includes('captcha may have been wrong')) return `${THEME.ICONS.ERROR} Captcha rejected. Please try again with a fresh image.`;
  if (message.includes('could not extract captcha image')) return `${THEME.ICONS.BROWSER} Image load error. Check your connection.`;
  if (message.includes('session expired')) return `${THEME.ICONS.WAIT} UIDAI session expired. Please restart the KYC flow.`;
  return `${THEME.ICONS.PROCESS} Automation failed. View technical logs for details.`;
}

async function humanType(page, selector, text) {
  await page.click(selector);
  await jitter(300, 200);
  await page.evaluate(sel => {
    const el = document.querySelector(sel);
    if (el) { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); }
  }, selector);
  await jitter(200, 100);
  for (const char of text) {
    await page.type(selector, char, { delay: T.CHAR_MIN + Math.floor(Math.random() * (T.CHAR_MAX - T.CHAR_MIN)) });
  }
  await jitter(T.AFTER_FILL, 200);
}

async function humanClick(page, selector) {
  const el = await page.$(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  const box = await el.boundingBox();
  if (box) {
    const rx = box.x + box.width  * (0.3 + Math.random() * 0.4);
    const ry = box.y + box.height * (0.3 + Math.random() * 0.4);
    await page.mouse.move(rx + Math.random() * 10 - 5,
                          ry + Math.random() * 10 - 5, { steps: 8 });
    await jitter(150, 100);
  }
  await el.click();
  await jitter(T.AFTER_CLICK, 300);
}

async function tryFill(log, label, page, selectors, value) {
  let lastErr;
  for (const sel of selectors) {
    try {
      await log(`${THEME.ICONS.PROCESS} ${label} → trying: ${sel}`);
      await page.waitForSelector(sel, { timeout: T.ELEMENT_WAIT, state: 'visible' });
      await humanType(page, sel, value);
      await log(`${label} → ✓ worked: ${sel}`);
      return sel;
    } catch (e) {
      await log(`${label} → ✗ failed: ${sel} — ${(e?.message || String(e)).split('\n')[0]}`, 'warning');
      lastErr = e;
    }
  }
  throw new Error(`${label}: all selectors failed. Last: ${lastErr?.message?.split('\n')[0]}`);
}

async function tryClick(log, label, page, selectors) {
  let lastErr;
  for (const sel of selectors) {
    try {
      await log(`${THEME.ICONS.PROCESS} ${label} → trying: ${sel}`);
      await page.waitForSelector(sel, { timeout: T.ELEMENT_WAIT, state: 'visible' });
      await humanClick(page, sel);
      await log(`${label} → ✓ worked: ${sel}`);
      return sel;
    } catch (e) {
      await log(`${label} → ✗ failed: ${sel} — ${(e?.message || String(e)).split('\n')[0]}`, 'warning');
      lastErr = e;
    }
  }
  throw new Error(`${label}: all selectors failed. Last: ${lastErr?.message?.split('\n')[0]}`);
}

async function extractCaptcha(log, page) {
  await log(`${THEME.ICONS.BROWSER} Extracting captcha image (4 strategies)`);
  await sleep(T.CAPTCHA_LOAD); 
  const imgSelectors = ['.form-section__captcha-field img', 'img[src*="captcha" i]', 'img[alt*="captcha" i]', 'img[class*="captcha" i]', '.captcha-img img'];
  for (const sel of imgSelectors) {
    try {
      const el  = await page.$(sel);
      if (!el) continue;
      const buf = await el.screenshot({ type: 'png' });
      if (buf && buf.length > 500) {
        await log(`${THEME.ICONS.SUCCESS} Captcha via element screenshot: ${sel}`);
        return `data:image/png;base64,${buf.toString('base64')}`;
      }
    } catch {}
  }
  try {
    const imgs = await page.$$('img');
    for (const img of imgs) {
      const src = await img.getAttribute('src').catch(() => null);
      if (!src) continue;
      if (src.startsWith('data:image')) { await log(`${THEME.ICONS.SUCCESS} Captcha via src data URL`); return src; }
      if (src.toLowerCase().includes('captcha')) {
        const b64 = await page.evaluate(async url => {
          try {
            const r = await fetch(url);
            const ab = await r.arrayBuffer();
            let b = ''; new Uint8Array(ab).forEach(x => { b += String.fromCharCode(x); });
            return btoa(b);
          } catch { return null; }
        }, src);
        if (b64) { await log(`${THEME.ICONS.SUCCESS} Captcha via fetch`); return `data:image/png;base64,${b64}`; }
      }
    }
  } catch {}
  try {
    const inputSel = "input[placeholder*='Captcha'], input[placeholder*='captcha'], input[name='captcha']";
    const inp = await page.$(inputSel);
    if (inp) {
      const box = await inp.boundingBox();
      if (box) {
        const buf = await page.screenshot({
          type: 'jpeg', quality: 90,
          clip: { x: Math.max(0, box.x - 5), y: Math.max(0, box.y - 70),
                  width: 220, height: box.height + 90 },
        });
        if (buf) { await log(`${THEME.ICONS.SUCCESS} Captcha via area screenshot`); return `data:image/jpeg;base64,${buf.toString('base64')}`; }
      }
    }
  } catch {}
  await log('Falling back to full-page screenshot', 'warning');
  const full = await page.screenshot({ type: 'jpeg', quality: 65 }).catch(() => null);
  if (full) return `data:image/jpeg;base64,${full.toString('base64')}`;
  return null;
}

async function pollForInput(log, prisma, taskId, key, timeoutMs) {
  const deadline    = Date.now() + timeoutMs;
  let   lastBeat    = Date.now();
  await log(`${THEME.ICONS.WAIT} Waiting for HR input: "${key}" (${timeoutMs/60000} min max)`);
  while (Date.now() < deadline) {
    if (Date.now() - lastBeat > 60000) {
      const rem = Math.round((deadline - Date.now()) / 60000);
      await log(`Still waiting for "${key}"... ${rem} min remaining`);
      lastBeat = Date.now();
    }
    const task = await prisma.automation_tasks.findUnique({
      where:  { id: taskId },
      select: { input_data: true, status: true },
    });
    if (!task)                       throw new Error('Task not found');
    if (task.status === 'cancelled') throw new Error('Task cancelled by user');
    if (task.input_data) {
      let d = {};
      try { d = JSON.parse(task.input_data); } catch {}
      if (key === 'captcha' && d.refreshCaptcha) {
        await log('HR requested captcha refresh');
        await prisma.automation_tasks.update({ where:{id:taskId}, data:{input_data:null} });
        return { __refresh: true }; 
      }
      if (d[key]) {
        const result = key === 'confirm' ? d : d[key];
        await prisma.automation_tasks.update({ where:{id:taskId}, data:{input_data:null} });
        await log(`${THEME.ICONS.SUCCESS} Received "${key}" from HR`);
        return result;
      }
    }
    await sleep(T.POLL_DB);
  }
  throw new Error(`Timeout: "${key}" not submitted within ${timeoutMs/60000} min`);
}

function parseKycXml(xmlString, aadhaarNumber = null) {
  const a = (tag, key) => {
    const m = xmlString.match(new RegExp(`<${tag}[^>]+\\s${key}="([^"]*)"`, 'i'));
    return (m && m[1].trim()) ? m[1].trim() : null;
  };
  const t = (tag) => {
    const m = xmlString.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    return (m && m[1].trim()) ? m[1].trim() : null;
  };
  const any = (key) => {
    const m = xmlString.match(new RegExp(`\\b${key}="([^"]+)"`, 'i'));
    return m ? m[1].trim() : null;
  };
  const status = (xmlString.match(/Status="(\d+)"/i) || [])[1];
  if (status && status !== '1') throw new Error(`UIDAI Status=${status} — KYC verification failed`);
  const referenceId = a('OfflinePaperlessKyc', 'referenceId') || a('OfflinePaperlessKycVer2', 'referenceId') || a('KycRes', 'referenceId') || a('UidData', 'referenceId') || any('referenceId') || null;
  const uid = a('UidData', 'uid') || any('uid') || null;
  const kycTimestamp = any('ts') || null;
  const aadhaarHash = (() => {
    if (aadhaarNumber) return crypto.createHash('sha256').update(String(aadhaarNumber).replace(/\s/g, '')).digest('hex');
    if (referenceId) return crypto.createHash('sha256').update(referenceId).digest('hex');
    if (uid) return crypto.createHash('sha256').update(uid+(kycTimestamp||Date.now())).digest('hex');
    return crypto.createHash('sha256').update(xmlString.slice(0,500)).digest('hex');
  })();
  const name = a('Poi', 'name') || null;
  const gender = a('Poi', 'gender') || null;
  const careof = a('Poi', 'co') || null;
  const m = a('Poi', 'm') || null;
  const e = a('Poi', 'e') || null;
  const dobRaw = a('Poi', 'dob') || null;
  const yob = a('Poi', 'yob') || null; 
  const dob = dobRaw || (yob ? `01-01-${yob}` : null);
  const house = a('Poa', 'house') || null;
  const street = a('Poa', 'street') || null;
  const loc = a('Poa', 'lm') || null;
  const vtc = a('Poa', 'vtc') || null;
  const pc = a('Poa', 'pc') || null;
  const photoBase64 = t('Pht') || null;
  const parts = (name||'').trim().split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.length > 1 ? parts[parts.length-1] : '';
  const middleName = parts.length > 2  ? parts.slice(1,-1).join(' ') : '';
  let fatherName = null;
  if (careof) {
    const fm = careof.match(/(?:S\/O|D\/O|C\/O|W\/O)[\s:]+(.+)/i);
    fatherName = fm?.[1]?.trim() || null;
  }
  let dobIso = null;
  if (dob) {
    const p = dob.split('-');
    if (p.length === 3) dobIso = p[2].length === 4 ? `${p[2]}-${p[1]}-${p[0]}` : `${p[0]}-${p[1]}-${p[2]}`;
  }
  const gMap = { M:'male', F:'female', T:'other' };
  return {
    aadhaarHash, referenceId, kycTimestamp, uid, name, dob, gender, careof, m, e,
    house, street, loc, vtc, pc, photoBase64,
    photoDataUrl: photoBase64 ? `data:image/jpeg;base64,${photoBase64}` : null,
    fullName: name, firstName, lastName, middleName, fatherName,
    dateOfBirth: dobIso, gender: gender ? (gMap[gender.toUpperCase()]||gender.toLowerCase()) : null,
    address: [house, street, loc, vtc].filter(Boolean).join(', ')||null,
    city: vtc, pincode: pc,
  };
}

function encodePhoto(photoBase64) {
  if (!photoBase64) return null;
  if (photoBase64.startsWith('data:')) return photoBase64;
  return `data:image/jpeg;base64,${photoBase64}`;
}

async function run(taskId, payload, helpers) {
  const { updateTask, addTaskLog, db } = helpers;
  const log = makeLogger(taskId, addTaskLog);
  const prisma = db || new PrismaClient();
  const shouldDisconnectPrisma = !db;
  let playwright, AdmZip;
  try { playwright = require('playwright'); } catch {
    const msg = 'Playwright not installed.';
    await updateTask(taskId, { status:'failed', error_message:msg });
    throw new Error(msg);
  }
  try { AdmZip = require('adm-zip'); } catch {
    const msg = 'adm-zip not installed.';
    await updateTask(taskId, { status:'failed', error_message:msg });
    throw new Error(msg);
  }

  const { aadhaarNumber, companyId, mode = 'direct' } = payload;
  const clean = (aadhaarNumber || '').replace(/\s/g, '');
  await log(`${THEME.ICONS.AADHAAR} Initializing KYC for Aadhaar: ${clean.slice(0,4)}...${clean.slice(-4)}`);
  if (!/^\d{12}$/.test(clean)) throw new Error('Aadhaar must be 12 digits');
  const now = new Date();
  const shareCode = String(now.getDate()).padStart(2,'0') + String(now.getMonth()+1).padStart(2,'0');
  const tmpDir = path.join(os.tmpdir(), `kyc_${taskId}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  let browser = null;
  try {
    await updateTask(taskId, { status: 'running' });
    const headless = process.env.PLAYWRIGHT_HEADLESS === 'false';
    await log(`${THEME.ICONS.BROWSER} Launching ${headless ? 'headless' : 'visible'} Chromium engine`);
    browser = await playwright.chromium.launch({
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      locale: 'en-IN',
      timezoneId: 'Asia/Kolkata',
      acceptDownloads: true,
    });
    const page = await context.newPage();
    page.on('dialog', async d => { try { await d.accept(); } catch {} });
    await log(`${THEME.ICONS.BROWSER} Opening myaadhaar.uidai.gov.in`);
    await page.goto('https://myaadhaar.uidai.gov.in/', { waitUntil: 'domcontentloaded', timeout: T.PAGE_LOAD });
    await log(`${THEME.ICONS.SUCCESS} Portal loaded`);
    await tryClick(log, 'Login button', page, ["button:has-text('Login')", "text=Login"]);
    await page.waitForSelector("input[name='uid']", { timeout: T.ELEMENT_LONG });
    await humanType(page, "input[name='uid']", clean);
    let captchaText;
    captchaLoop: while (true) {
      const captchaImg = await extractCaptcha(log, page);
      await updateTask(taskId, { status: 'captcha_required', captcha_image: captchaImg });
      const result = await pollForInput(log, prisma, taskId, 'captcha', T.CAPTCHA_TIMEOUT);
      if (result?.__refresh) {
        await page.reload();
        await page.waitForSelector("input[name='uid']");
        await humanType(page, "input[name='uid']", clean);
        continue captchaLoop;
      }
      captchaText = result;
      break;
    }
    await updateTask(taskId, { status: 'running' });
    await tryFill(log, 'Captcha field', page, ["input[name='captcha']", "input[placeholder*='Captcha']"], captchaText);
    await tryClick(log, 'Login With OTP', page, ["button:has-text('Login With OTP')", "button:has-text('Send OTP')"]);
    await page.waitForSelector("input[name='otp']", { timeout: T.OTP_TIMEOUT });
    await log(`${THEME.ICONS.SUCCESS} OTP sent to employee mobile`);
    await updateTask(taskId, { status: 'otp_required' });
    const otpText = await pollForInput(log, prisma, taskId, 'otp', T.OTP_TIMEOUT);
    await updateTask(taskId, { status: 'running' });
    await tryFill(log, 'OTP field', page, ["input[name='otp']"], otpText);
    await tryClick(log, 'Login OTP submit', page, ["button:has-text('Login')", "button[type='submit']"]);
    await sleep(5000);
    await log(`${THEME.ICONS.SUCCESS} Dashboard reached`);
    await page.goto('https://myaadhaar.uidai.gov.in/offline-ekyc', { waitUntil: 'domcontentloaded' });
    await log(`${THEME.ICONS.PROCESS} Entering share code: ${shareCode}`);
    const pinInputs = await page.$$('section.sharecode input, [class*="sharecode"] input');
    if (pinInputs.length >= 1) {
      await pinInputs[0].fill(shareCode);
    } else {
      await page.keyboard.type(shareCode);
    }
    const dlPromise = page.waitForEvent('download', { timeout: 60000 });
    await tryClick(log, 'Download button', page, ["button:has-text('Download')"]);
    const download = await dlPromise;
    const zipPath = path.join(tmpDir, download.suggestedFilename());
    await download.saveAs(zipPath);
    await browser.close(); browser = null;
    const zip = new AdmZip(zipPath);
    const xmlContent = zip.readFile(zip.getEntries()[0], shareCode).toString('utf-8');
    const kyc = parseKycXml(xmlContent, clean);
    const photoDataUrl = encodePhoto(kyc.photoBase64);
    const reviewData = { ...kyc, photo: photoDataUrl, shareCode, method: 'otp_based' };
    await updateTask(taskId, { status: 'review_required', result_data: JSON.stringify(reviewData) });
    const confirmation = await pollForInput(log, prisma, taskId, 'confirm', T.REVIEW_TIMEOUT);
    if (confirmation.confirm !== 'YES') throw new Error('Review not confirmed');
    const kycRecord = await upsertKycRecord(kyc.aadhaarHash, {
      method: 'otp_based',
      name: kyc.name ? encrypt(kyc.name) : null,
      dob: kyc.dob ? encrypt(kyc.dob) : null,
      gender: kyc.gender ? encrypt(kyc.gender) : null,
      house: kyc.house ? encrypt(kyc.house) : null,
      pc: kyc.pincode ? encrypt(kyc.pincode) : null,
      pht: photoDataUrl,
      taskId,
    });
    await log(`${THEME.ICONS.SUCCESS} KYC completed and saved.`);
    await updateTask(taskId, {
      status: 'completed',
      completed_at: new Date(),
      result_data: JSON.stringify({ kycId: kycRecord?.id, name: kyc.name, photo: photoDataUrl, mode }),
    });
    return { kycId: kycRecord?.id, mode };
  } catch (err) {
    const friendly = friendlyErrorMessage(err);
    logger.error(`${THEME.ICONS.ERROR} [AadhaarWorker] FATAL ERROR:`, err);
    await updateTask(taskId, { status: 'failed', error_message: friendly });
    throw err;
  } finally {
    if (browser) await browser.close().catch(()=>{});
    fs.rmSync(tmpDir, { recursive: true, force: true });
    if (shouldDisconnectPrisma) await prisma.$disconnect().catch(()=>{});
  }
}

module.exports = { run, parseKycXml };

