const express = require('express');
const router = express.Router();
const subscriptionController = require('./subscription.controller');
const paymentController = require('./payment.controller');
const authMiddleware = require('../../shared/middleware/auth');
const { restrictTo } = require('../../shared/middleware/auth');

// Public Webhook (JioPay calls this directly)
router.post('/jiopay-webhook', paymentController.handleJioPayWebhook);

// Public Webhook (Payout updates)
router.post('/payout-webhook', paymentController.handlePayoutWebhook);

// Public Webhook (PhonePe calls this directly)
router.post('/phonepe-webhook', paymentController.handlePhonePeWebhook);

// Public Webhook (Razorpay calls this directly)
router.post('/razorpay-webhook', paymentController.handleWebhook);

// Public/Tenant accessible preview (Self-service billing view)
router.post('/preview', authMiddleware, subscriptionController.calculatePreview);

// Onboarding & Plan Selection Routes
router.post('/trial', authMiddleware, subscriptionController.activateTrial);
router.post('/order', authMiddleware, paymentController.createSubscriptionOrder);
router.post('/verify', authMiddleware, paymentController.verifySubscription);

// Tenant Self-Service Routes
router.get('/my-subscription', authMiddleware, subscriptionController.getMySubscription);
router.get('/my-invoices', authMiddleware, subscriptionController.getMyInvoices);

// Platform Admin Routes (Management of client pricing)
router.get(
  '/admin/subscription/:tenantId', 
  authMiddleware, 
  restrictTo('super_admin', 'Admin'), 
  subscriptionController.getTenantPricing
);

router.patch(
  '/admin/subscription/:tenantId', 
  authMiddleware, 
  restrictTo('super_admin', 'Admin'), 
  subscriptionController.updateTenantPricing
);

router.get(
  '/admin/subscription/:tenantId/invoices',
  authMiddleware,
  restrictTo('super_admin', 'Admin'),
  subscriptionController.getTenantInvoices
);

router.get(
  '/admin/subscription/:tenantId/invoices/:invoiceId/pdf',
  authMiddleware,
  restrictTo('super_admin', 'Admin'),
  subscriptionController.downloadInvoicePDF
);

// Payment Routes
router.post('/invoices/:invoiceId/pay', authMiddleware, paymentController.createOrder);
router.post('/invoices/:invoiceId/verify', authMiddleware, paymentController.verifyPayment);

module.exports = router;

