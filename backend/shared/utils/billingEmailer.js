const nodemailer = require('nodemailer');
const logger = require('./logger');
const { THEME } = require('./uiConstants');

/**
 * Sends automated billing emails using platform SMTP.
 */
async function sendBillingEmail(to, subject, content) {
  try {
    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
        <h2 style="color: #2563eb;">Syntern HRMS</h2>
        <hr style="border: 0; border-top: 1px solid #f1f5f9;" />
        <div style="padding: 20px 0; color: #334155; line-height: 1.6;">
          ${content}
        </div>
        <hr style="border: 0; border-top: 1px solid #f1f5f9;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
          This is an automated billing notification from Syntern HRMS.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });

    logger.info(`${THEME.ICONS.SUCCESS} Billing email sent to ${to}: ${subject}`);
  } catch (err) {
    logger.error(`${THEME.ICONS.ERROR} Failed to send billing email: ${err.message}`);
  }
}

const billingEmailer = {
  sendInvoiceNotification: (email, invoiceNo, amount) => {
    return sendBillingEmail(
      email,
      `New Invoice Generated: ${invoiceNo}`,
      `<p>Hello,</p>
       <p>A new invoice <strong>${invoiceNo}</strong> for <strong>${amount}</strong> has been generated for your HRMS account.</p>
       <p>Please log in to your portal to view and pay the invoice.</p>
       <div style="margin-top: 20px;"><a href="${process.env.FRONTEND_URL}/subscription" style="background: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">View Subscription</a></div>`
    );
  },
  sendPaymentReceipt: (email, invoiceNo, paymentId) => {
    return sendBillingEmail(
      email,
      `Payment Received - Thank You!`,
      `<p>Hello,</p>
       <p>We have successfully received your payment for invoice <strong>${invoiceNo}</strong>.</p>
       <p><strong>Transaction ID:</strong> ${paymentId}</p>
       <p>Your subscription is active and up to date.</p>
       <p>Thank you for choosing Syntern HRMS.</p>`
    );
  }
};

module.exports = billingEmailer;

