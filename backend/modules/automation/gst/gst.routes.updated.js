// ============================================================
//  gst.routes.js  (UPDATED)
//  REST endpoints for GST lookup with caching and DB persistence
// ============================================================

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

const {
  getGstRecord,
  saveGstData,
  isGstRecordStale
} = require('./gst.db.service');

// In-memory task store (for progress tracking)
const taskStore = new Map();

function setTask(taskId, data) {
  taskStore.set(taskId, { ...data, updatedAt: new Date().toISOString() });
}

function getTask(taskId) {
  return taskStore.get(taskId);
}

function addLog(taskId, message) {
  const task = getTask(taskId);
  if (task) {
    if (!task.logs) task.logs = [];
    task.logs.push({ timestamp: new Date().toISOString(), message });
    setTask(taskId, task);
  }
}

// ============================================================
//  GET /api/gst/central/:gstin
//  Retrieve cached GST record (no scraping)
// ============================================================
router.get('/central/:gstin', async (req, res) => {
  try {
    const gstin = (req.params.gstin || '').trim().toUpperCase();
    if (!GSTIN_REGEX.test(gstin)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_GSTIN',
        message: 'Invalid GSTIN format'
      });
    }

    // Try to get from cache first
    const cached = await getGstRecord(gstin);
    
    if (cached && !isGstRecordStale(cached)) {
      console.log(`[GST] Serving ${gstin} from cache`);
      return res.json({
        success: true,
        data: cached,
        cached: true,
        lastVerified: cached.last_verified_at
      });
    }

    // Not found or stale
    return res.status(404).json({
      success: false,
      code: 'NOT_FOUND',
      message: 'GSTIN not in cache. Call /automation/trigger/:gstin to fetch live data.',
      stale: cached ? true : false
    });

  } catch (err) {
    console.error('[GST] Error in /central:', err);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Server error'
    });
  }
});

// ============================================================
//  POST /api/gst/automation/trigger/:gstin
//  Start GST lookup (async) and return task ID
// ============================================================
router.post('/automation/trigger/:gstin', async (req, res) => {
  try {
    const gstin = (req.params.gstin || '').trim().toUpperCase();
    if (!GSTIN_REGEX.test(gstin)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_GSTIN',
        message: 'Invalid GSTIN format. Example: 27AABCU9603R1ZX'
      });
    }

    // Check if already cached and not stale
    const cached = await getGstRecord(gstin);
    if (cached && !isGstRecordStale(cached)) {
      console.log(`[GST] ${gstin} already cached, returning immediately`);
      return res.json({
        success: true,
        data: cached,
        cached: true,
        message: 'Data already in cache'
      });
    }

    // Create new task
    const taskId = crypto.randomUUID();
    setTask(taskId, {
      id: taskId,
      gstin,
      status: 'pending',
      logs: [{ timestamp: new Date().toISOString(), message: 'Task created' }],
      startedAt: new Date().toISOString()
    });

    console.log(`[GST] Created task ${taskId} for ${gstin}`);

    // Start scraping in background (don't await)
    (async () => {
      try {
        addLog(taskId, 'Starting live lookup from GST portal...');
        addLog(taskId, 'Layer 1: Attempting official GST site (services.gst.gov.in) with audio CAPTCHA');
        
        const result = await scrapeGstSearchSite(gstin);

        if (!result) throw new Error('No data returned from any provider');

        addLog(taskId, `Layer 1 Success: Found ${result.legalName || result.tradeName || 'business'}`);
        addLog(taskId, 'Saving to database...');

        // Save to database
        await saveGstData(result, {
          tenantId: req.body?.tenantId || null,
          userId: req.user?.id || null,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip
        });

        addLog(taskId, 'Data saved to database');
        
        setTask(taskId, {
          ...getTask(taskId),
          status: 'completed',
          result,
          completedAt: new Date().toISOString()
        });

        console.log(`[GST] Task ${taskId} completed successfully`);

      } catch (err) {
        console.error(`[GST] Task ${taskId} failed:`, err.message);
        addLog(taskId, `❌ Error: ${err.message}`);
        
        setTask(taskId, {
          ...getTask(taskId),
          status: 'failed',
          error: err.message,
          completedAt: new Date().toISOString()
        });
      }
    })();

    // Return task ID immediately
    return res.json({
      success: true,
      taskId,
      message: 'Lookup task created, polling /automation/status/:taskId for progress'
    });

  } catch (err) {
    console.error('[GST] Error in /automation/trigger:', err);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Failed to start lookup task'
    });
  }
});

// ============================================================
//  GET /api/gst/automation/status/:taskId
//  Check task progress
// ============================================================
router.get('/automation/status/:taskId', (req, res) => {
  const taskId = req.params.taskId;
  const task = getTask(taskId);

  if (!task) {
    return res.status(404).json({
      success: false,
      code: 'TASK_NOT_FOUND',
      message: `Task ${taskId} not found`
    });
  }

  return res.json({
    success: true,
    id: task.id,
    gstin: task.gstin,
    status: task.status,          // pending | running | completed | failed
    logs: task.logs || [],
    progress: task.progress || 0,
    result: task.result || null,
    error: task.error || null,
    startedAt: task.startedAt,
    completedAt: task.completedAt
  });
});

// ============================================================
//  GET /api/gst/lookup/:gstin
//  Combined endpoint: check cache → trigger if needed → return results
// ============================================================
router.get('/lookup/:gstin', async (req, res) => {
  try {
    const gstin = (req.params.gstin || '').trim().toUpperCase();
    if (!GSTIN_REGEX.test(gstin)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GSTIN format'
      });
    }

    // Try cache first
    const cached = await getGstRecord(gstin);
    if (cached && !isGstRecordStale(cached)) {
      return res.json({
        success: true,
        data: cached,
        source: 'cache',
        lastVerified: cached.last_verified_at
      });
    }

    // Live lookup (sync - waits for result)
    console.log(`[GST] Performing live lookup for ${gstin}`);
    const result = await scrapeGstSearchSite(gstin);

    if (!result) throw new Error('No data found from any provider');

    // Save immediately
    await saveGstData(result, {
      tenantId: req.body?.tenantId || null,
      userId: req.user?.id || null,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      data: result,
      source: result.source,
      timestamp: result.timestamp
    });

  } catch (err) {
    console.error('[GST] Error in /lookup:', err);
    if (/invalid.*gstin/i.test(err.message)) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (/not found/i.test(err.message)) {
      return res.status(404).json({ success: false, message: err.message });
    }
    return res.status(500).json({
      success: false,
      message: 'GST lookup failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// ============================================================
//  Health check
// ============================================================
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'GST Lookup Service',
    status: 'operational',
    capabilities: [
      'Official GST site scraping with audio CAPTCHA',
      'Tesseract OCR fallback',
      'Database caching (30-day TTL)',
      'Multi-provider fallback chain'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
