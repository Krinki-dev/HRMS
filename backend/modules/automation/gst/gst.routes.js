'use strict';

const express = require('express');
const crypto  = require('crypto');
const router  = express.Router();
const auth    = require('../../../shared/middleware/auth');

const {
  GSTIN_REGEX,
  parseGstinStructure,
  scrapeGstSearchSite,
  readCentralGstRecord,
  getCachedGstRecord,
  upsertCentralGstRecord,
} = require('./gst.service');

const taskStore = new Map();

function setTask(taskId, data) {
  taskStore.set(taskId, { ...data, updatedAt: new Date().toISOString() });
}
function getTask(taskId) {
  return taskStore.get(taskId) || null;
}
function addLog(taskId, message, level = 'info') {
  const task = getTask(taskId);
  if (!task) return;
  const logs = task.logs || [];
  logs.push({ timestamp: new Date().toISOString(), level, message });
  setTask(taskId, { ...task, logs });
}

router.get('/central/:gstin', async (req, res) => {
  const gstin = (req.params.gstin || '').trim().toUpperCase();

  if (!GSTIN_REGEX.test(gstin)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid GSTIN format. Example: 29ABCDE1234F1Z5',
    });
  }

  try {
    const record = await readCentralGstRecord(gstin);

    if (!record) {
      return res.status(404).json({
        success: false,
        message:  'GSTIN not found in central database',
        gstin,
      });
    }

    const createdAt = record.cachedAt ? new Date(record.cachedAt) : null;
    const recordAgeDays = createdAt && !Number.isNaN(createdAt.getTime())
      ? Math.round(((Date.now() - createdAt.getTime()) / 86400000) * 10) / 10
      : null;
    const stale = recordAgeDays !== null ? recordAgeDays >= 90 : false;

    const base = parseGstinStructure(gstin);
    return res.json({
      success:   true,
      fromCache: true,
      stale,
      recordAgeDays,
      data: { ...base, ...record, gstin },
    });

  } catch (err) {
    console.error('[gst/central] DB error:', err.message);
    return res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.post('/automation/trigger/:gstin', async (req, res) => {
  const gstin = (req.params.gstin || '').trim().toUpperCase();

  if (!GSTIN_REGEX.test(gstin)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid GSTIN format.',
    });
  }

  const taskId = crypto.randomBytes(16).toString('hex');

  setTask(taskId, {
    status:    'running',
    gstin,
    logs:      [{ timestamp: new Date().toISOString(), level: 'info', message: 'Automation queued' }],
    startedAt: new Date().toISOString(),
  });

  runGstAutomation(gstin, taskId).catch(err => {
    console.error(`[gst/automation] Task ${taskId} threw:`, err.message);
    setTask(taskId, {
      ...getTask(taskId),
      status: 'failed',
      error:  err.message,
    });
  });

  setTimeout(() => taskStore.delete(taskId), 10 * 60 * 1000);

  return res.json({ success: true, taskId, message: 'Automation started' });
});

router.get('/automation/status/:taskId', (req, res) => {
  const task = getTask(req.params.taskId);
  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found or expired' });
  }
  return res.json(task);
});

async function runGstAutomation(gstin, taskId) {
  try {
    addLog(taskId, 'Launching Playwright browser…');

    const scraped = await scrapeGstSearchSite(gstin);

    if (!scraped) {
      addLog(taskId, 'Page loaded but no GST data returned for this GSTIN', 'warn');
      setTask(taskId, {
        ...getTask(taskId),
        status: 'failed',
        error:  'GST search page returned no data for this GSTIN — try again or fill manually',
      });
      return;
    }

    addLog(taskId, `Scraped ${Object.keys(scraped).length} fields from ${scraped.source || 'gstsearch.in'} — saving to central_gst_records…`);

    const base = parseGstinStructure(gstin);
    const merged = {
      ...base,
      ...scraped,
      gstin,
      pan:        scraped.pan        || base.pan,
      state:      scraped.state      || base.state,
      state_code: scraped.state_code || scraped.statecode || base.stateCode,
      source:     scraped.source     || 'gstsearch.in',
    };

    await upsertCentralGstRecord(merged);

    addLog(taskId, '✓ Saved to central_gst_records — data ready', 'success');

    setTask(taskId, {
      ...getTask(taskId),
      status:      'completed',
      completedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error(`[gst/automation] Runner failed for ${gstin}:`, err.message);
    addLog(taskId, `Failed: ${err.message}`, 'error');
    setTask(taskId, {
      ...getTask(taskId),
      status: 'failed',
      error:  err.message,
    });
  }
}

router.get('/lookup/:gstin', async (req, res) => {
  const gstin = (req.params.gstin || '').trim().toUpperCase();

  if (!GSTIN_REGEX.test(gstin)) {
    return res.status(400).json({ success: false, message: 'Invalid GSTIN format.' });
  }

  const base   = parseGstinStructure(gstin);
  const cached = await getCachedGstRecord(gstin);

  if (cached) {
    return res.json({
      success: true, fromCache: true, partial: false,
      note:    `From cache — last fetched ${new Date(cached.cachedAt || cached.created_at).toLocaleString('en-IN')}`,
      data:    { ...base, ...cached, gstin },
    });
  }

  return res.json({
    success: true, fromCache: false, partial: true,
    note:    'Not cached yet. State, PAN and entity type derived from GSTIN.',
    data:    base,
  });
});

router.use(auth);

router.post('/search', async (req, res) => {
  const gstin = (req.body?.gstin || '').trim().toUpperCase();

  if (!GSTIN_REGEX.test(gstin)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid GSTIN format. Must be 15 characters — example: 29ABCDE1234F1Z5',
    });
  }

  const base = parseGstinStructure(gstin);

  const cached = await getCachedGstRecord(gstin);
  if (cached) {
    return res.json({
      success: true, saved: true, fromCache: true,
      note:    `Loaded from cache. Last fetched: ${new Date(cached.cachedAt || cached.created_at).toLocaleString('en-IN')}`,
      data:    { ...base, ...cached, gstin },
    });
  }

  let scraped  = null;
  let note     = '';
  let scrapeOk = false;

  try {
    scraped  = await scrapeGstSearchSite(gstin);
    scrapeOk = scraped !== null;
    if (!scrapeOk) note = 'GST search page returned no data for this GSTIN.';
  } catch (err) {
    console.warn(`[automation/gst/search] Scrape failed for ${gstin}:`, err.message);
    note = 'GST lookup site unreachable. Showing data from GSTIN structure.';
  }

  const merged = {
    ...base,
    ...(scraped || {}),
    gstin,
    pan:        (scraped?.pan        || base.pan),
    state:      (scraped?.state      || base.state),
    state_code: (scraped?.state_code || scraped?.statecode || base.stateCode),
    constitutionofbusiness: (scraped?.constitutionofbusiness || base.constitutionofbusiness),
  };

  let saved = false;
  if (scrapeOk && scraped) {
    try {
      const savedRecord = await upsertCentralGstRecord(merged);
      saved = !!savedRecord;
      if (!note) note = saved ? 'Live data fetched and saved to central GST records.' : 'Live data fetched. Central DB save failed.';
    } catch (err) {
      console.warn(`[automation/gst/search] Central save failed for ${gstin}:`, err.message);
      if (!note) note = 'Live data fetched but central save failed.';
    }
  }

  return res.json({
    success: true, saved, fromCache: false, partial: !scrapeOk,
    note:    note || undefined,
    data:    merged,
  });
});

module.exports = router;

