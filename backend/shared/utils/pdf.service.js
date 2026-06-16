const PDFDocument = require('pdfkit');

/**
 * Formats Paise into a human-readable INR string.
 */
const formatPaise = (paise) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(paise / 100);
};

/**
 * Generates an Invoice PDF buffer.
 * @param {Object} invoice - Invoice record from DB
 * @param {Object} tenant - Tenant record from DB
 */
async function generateInvoicePDF(invoice, tenant) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    // --- Header ---
    doc.fillColor('#444444').fontSize(20).text('INVOICE', 50, 50, { align: 'right' });
    
    // Platform Branding
    doc.fillColor('#2563EB').fontSize(18).text('Syntern HRMS', 50, 50, { align: 'left' });
    doc.fillColor('#64748B').fontSize(10).text('Platform Administration', 50, 70);

    doc.moveDown();
    const top = 120;

    // --- Bill To vs Invoice Details ---
    doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold').text('BILL TO:', 50, top);
    doc.font('Helvetica').text(tenant.name, 50, top + 15);
    doc.text(tenant.legal_name || '', 50, top + 30);
    doc.text(`GSTIN: ${tenant.gstin || 'N/A'}`, 50, top + 45);

    doc.font('Helvetica-Bold').text('INVOICE NO:', 350, top);
    doc.font('Helvetica').text(invoice.invoice_no, 450, top);
    doc.font('Helvetica-Bold').text('DATE:', 350, top + 15);
    doc.font('Helvetica').text(new Date(invoice.issue_date).toLocaleDateString(), 450, top + 15);
    doc.font('Helvetica-Bold').text('PERIOD:', 350, top + 30);
    doc.font('Helvetica').text(`${new Date(invoice.period_start).toLocaleDateString()} - ${new Date(invoice.period_end).toLocaleDateString()}`, 450, top + 30);
    doc.font('Helvetica-Bold').text('STATUS:', 350, top + 45);
    doc.fillColor(invoice.status === 'paid' ? '#16A34A' : '#D97706').text(invoice.status.toUpperCase(), 450, top + 45);

    // --- Items Table Header ---
    doc.moveDown(4);
    const tableTop = 230;
    doc.fillColor('#F1F5F9').rect(50, tableTop, 500, 20).fill();
    doc.fillColor('#475569').font('Helvetica-Bold').fontSize(10);
    doc.text('Description', 60, tableTop + 5);
    doc.text('Amount', 450, tableTop + 5, { width: 90, align: 'right' });

    // --- Line Items ---
    doc.fillColor('#000000').font('Helvetica').fontSize(10);
    let currentY = tableTop + 30;

    // Base Plan
    doc.text('Base Plan Subscription', 60, currentY);
    doc.text(formatPaise(invoice.base_amount_paise), 450, currentY, { width: 90, align: 'right' });
    currentY += 20;

    // Modules
    if (invoice.breakdown?.modules?.list?.length > 0) {
      invoice.breakdown.modules.list.forEach(mod => {
        doc.text(`Module: ${mod.name.toUpperCase()}`, 60, currentY);
        doc.text(formatPaise(mod.final), 450, currentY, { width: 90, align: 'right' });
        currentY += 20;
      });
    }

    // Excess Charges
    if (invoice.excess_amount_paise > 0) {
      doc.text('Excess Employee Capacity Charges', 60, currentY);
      doc.text(formatPaise(invoice.excess_amount_paise), 450, currentY, { width: 90, align: 'right' });
      currentY += 20;
    }

    // --- Summary ---
    doc.moveDown();
    const summaryTop = currentY + 20;
    doc.lineCap('butt').moveTo(300, summaryTop).lineTo(550, summaryTop).stroke('#E2E8F0');

    doc.font('Helvetica-Bold').text('Subtotal:', 350, summaryTop + 10);
    doc.font('Helvetica').text(formatPaise(invoice.base_amount_paise + invoice.module_amount_paise + invoice.excess_amount_paise), 450, summaryTop + 10, { width: 90, align: 'right' });

    if (invoice.discount_amount_paise > 0) {
      doc.fillColor('#16A34A').font('Helvetica-Bold').text('Discounts:', 350, summaryTop + 25);
      doc.font('Helvetica').text(`-${formatPaise(invoice.discount_amount_paise)}`, 450, summaryTop + 25, { width: 90, align: 'right' });
    }

    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(12).text('TOTAL PAYABLE:', 350, summaryTop + 50);
    doc.text(formatPaise(invoice.total_paise), 450, summaryTop + 50, { width: 90, align: 'right' });

    // --- Footer ---
    const footerTop = 750;
    doc.fontSize(8).fillColor('#94A3CE').text('This is a computer-generated invoice and does not require a signature.', 50, footerTop, { align: 'center', width: 500 });
    doc.text('Thank you for choosing Syntern HRMS.', 50, footerTop + 15, { align: 'center', width: 500 });

    doc.end();
  });
}

module.exports = { generateInvoicePDF };

