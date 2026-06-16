const express = require('express');
const router  = express.Router();

// Shared automation task routes (GET /tasks, GET /task/:id etc.)
// This route was missing, causing 404s for /api/v1/automation/tasks.
router.use('/', require('./automation.routes'));

// Sub-module routers
// Each sub-module handles its specific automation tasks (e.g., KYC, GST management).
router.use('/kyc', require('./kyc/kyc.routes'));
router.use('/management', require('./management/management.routes'));
router.use('/gst', require('./gst/gst.routes'));

module.exports = router;

