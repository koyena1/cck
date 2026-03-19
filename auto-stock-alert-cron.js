/**
 * AUTOMATIC PDF STOCK ALERT CRON JOB
 *
 * Sends PDF stock alerts when dealer stock is low/out-of-stock and then
 * keeps sending reminders every 5 days until the dealer updates stock.
 */

require('dotenv').config();
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const { jsPDF } = require('jspdf');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Protechtur';
const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@protechtur.com';
const DEV_MODE = process.env.EMAIL_DEV_MODE === 'true';

function getTransporter() {
  if (DEV_MODE) return null;

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
  if (!user || !pass) {
    throw new Error('SMTP credentials are not configured');
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: { user, pass },
  });
}

function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function classifyProduct(quantityAvailable) {
  if (quantityAvailable <= 0) return 'Out of Stock';
  return 'Low Stock';
}

function fitText(doc, value, maxWidth) {
  const safeValue = value || '-';
  if (doc.getTextWidth(safeValue) <= maxWidth) {
    return safeValue;
  }

  let trimmed = safeValue;
  while (trimmed.length > 1 && doc.getTextWidth(`${trimmed}...`) > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }

  return `${trimmed}...`;
}

function generateStockAlertPDFBuffer(dealer, products, alertType) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  const outOfStockCount = products.filter((item) => Number(item.quantity_available) <= 0).length;
  const lowStockCount = products.filter((item) => {
    const qty = Number(item.quantity_available);
    return qty > 0 && qty < 5;
  }).length;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(`${COMPANY_NAME} STOCK ALERT`, margin, 14);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated ${new Date().toLocaleString('en-IN')}`, margin, 21);

  y = 36;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Dealer', margin, y);
  doc.text('Summary', pageWidth / 2, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Name: ${dealer.full_name}`, margin, y);
  y += 5;
  doc.text(`Business: ${dealer.business_name || '-'}`, margin, y);
  y += 5;
  doc.text(`Dealer ID: ${dealer.unique_dealer_id || dealer.dealer_id}`, margin, y);
  if (dealer.district) {
    y += 5;
    doc.text(`District: ${dealer.district}`, margin, y);
  }

  let summaryY = 42;
  doc.text(`Out of Stock: ${outOfStockCount}`, pageWidth / 2, summaryY);
  summaryY += 5;
  doc.text(`Low Stock: ${lowStockCount}`, pageWidth / 2, summaryY);
  summaryY += 5;
  doc.text(`Alert Type: ${alertType === 'threshold_followup_5day' ? '5-Day Reminder' : 'Initial Alert'}`, pageWidth / 2, summaryY);

  y = Math.max(y, summaryY) + 8;

  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);

  const modelX = margin + 2;
  const brandX = margin + 56;
  const statusX = margin + 108;
  const qtyRightX = margin + 143;
  const priceRightX = pageWidth - margin - 2;

  doc.text('MODEL', modelX, y + 5.5);
  doc.text('BRAND / TYPE', brandX, y + 5.5);
  doc.text('STATUS', statusX, y + 5.5);
  doc.text('QTY', qtyRightX, y + 5.5, { align: 'right' });
  doc.text('PRICE', priceRightX, y + 5.5, { align: 'right' });

  y += 10;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);

  products.forEach((product, index) => {
    if (y > pageHeight - 18) {
      doc.addPage();
      y = margin;
    }

    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 4, pageWidth - margin * 2, 8, 'F');
    }

    const status = classifyProduct(Number(product.quantity_available));
    const modelText = fitText(doc, product.model_number, 50);
    const brandText = fitText(doc, `${product.company} / ${product.product_type}`, 46);
    const statusText = fitText(doc, status, 22);

    doc.text(modelText, modelX, y);
    doc.text(brandText, brandX, y);
    doc.text(statusText, statusX, y);
    doc.text(String(Number(product.quantity_available)), qtyRightX, y, { align: 'right' });
    doc.text(formatCurrency(Number(product.dealer_purchase_price)), priceRightX, y, { align: 'right' });
    y += 8;
  });

  const pdfArrayBuffer = doc.output('arraybuffer');
  return Buffer.from(pdfArrayBuffer);
}

async function ensureAutoAlertHistoryTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS dealer_auto_alert_history (
      id SERIAL PRIMARY KEY,
      dealer_id INTEGER REFERENCES dealers(dealer_id) ON DELETE CASCADE,
      alert_type VARCHAR(50) NOT NULL,
      days_since_update INTEGER NOT NULL DEFAULT 0,
      low_stock_count INTEGER DEFAULT 0,
      out_of_stock_count INTEGER DEFAULT 0,
      alert_sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      notification_id INTEGER REFERENCES dealer_notifications(id),
      email_sent BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getDealersNeedingAlerts(client) {
  const query = `
    WITH dealer_stock_status AS (
      SELECT
        d.dealer_id,
        d.full_name,
        d.business_name,
        d.email,
        d.unique_dealer_id,
        d.district,
        COALESCE(get_dealer_last_stock_update(d.dealer_id), MAX(di.updated_at)) AS last_stock_update,
        COALESCE(get_days_since_stock_update(d.dealer_id), 0) AS days_since_update,
        COUNT(CASE WHEN COALESCE(di.quantity_available, 0) = 0 THEN 1 END) AS out_of_stock_count,
        COUNT(CASE WHEN COALESCE(di.quantity_available, 0) > 0 AND COALESCE(di.quantity_available, 0) < 5 THEN 1 END) AS low_stock_count
      FROM dealers d
      LEFT JOIN dealer_inventory di ON d.dealer_id = di.dealer_id
      WHERE d.status = 'Active'
      GROUP BY d.dealer_id, d.full_name, d.business_name, d.email, d.unique_dealer_id, d.district
    ),
    last_threshold_alert AS (
      SELECT
        dealer_id,
        MAX(alert_sent_at) AS last_alert_sent
      FROM dealer_auto_alert_history
      WHERE alert_type IN ('threshold_initial', 'threshold_followup_5day')
      GROUP BY dealer_id
    )
    SELECT
      dss.*,
      lta.last_alert_sent,
      CASE
        WHEN lta.last_alert_sent IS NULL THEN 'threshold_initial'
        WHEN dss.last_stock_update > lta.last_alert_sent THEN 'threshold_initial'
        WHEN (CURRENT_TIMESTAMP - lta.last_alert_sent) >= INTERVAL '5 days'
             AND (dss.last_stock_update IS NULL OR dss.last_stock_update <= lta.last_alert_sent)
        THEN 'threshold_followup_5day'
        ELSE NULL
      END AS alert_needed
    FROM dealer_stock_status dss
    LEFT JOIN last_threshold_alert lta ON lta.dealer_id = dss.dealer_id
    WHERE dss.email IS NOT NULL
      AND (dss.out_of_stock_count > 0 OR dss.low_stock_count > 0)
  `;

  const result = await client.query(query);
  return result.rows.filter((row) => row.alert_needed);
}

async function getLowStockProducts(client, dealerId) {
  const productsResult = await client.query(
    `SELECT
       dp.id AS product_id,
       dp.company,
       dp.segment,
       dp.model_number,
       dp.product_type,
       dp.dealer_purchase_price,
       COALESCE(di.quantity_available, 0) AS quantity_available,
       COALESCE(di.quantity_available, 0) * dp.dealer_purchase_price::NUMERIC AS item_stock_value
     FROM dealer_products dp
     LEFT JOIN dealer_inventory di ON di.product_id = dp.id AND di.dealer_id = $1
     WHERE dp.is_active = TRUE
       AND (COALESCE(di.quantity_available, 0) = 0 OR COALESCE(di.quantity_available, 0) < 5)
     ORDER BY COALESCE(di.quantity_available, 0) ASC, dp.company, dp.model_number`,
    [dealerId]
  );

  return productsResult.rows;
}

async function sendAlertToDealer(client, transporter, dealer) {
  const products = await getLowStockProducts(client, dealer.dealer_id);
  if (products.length === 0) {
    return { success: true, emailSent: false, skipped: true };
  }

  const title = dealer.alert_needed === 'threshold_followup_5day'
    ? 'Reminder: Stock Alert Report (5-Day Follow-up)'
    : 'Stock Alert Report';

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
      <h2 style="margin-bottom: 8px;">${title}</h2>
      <p>Hello ${dealer.full_name},</p>
      <p>Please review the attached stock report PDF. It includes products currently low in stock or out of stock.</p>
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin:16px 0;">
        <p style="margin:0 0 6px 0;"><strong>Out of Stock:</strong> ${dealer.out_of_stock_count}</p>
        <p style="margin:0 0 6px 0;"><strong>Low Stock:</strong> ${dealer.low_stock_count}</p>
        <p style="margin:0;"><strong>Alert Type:</strong> ${dealer.alert_needed === 'threshold_followup_5day' ? '5-Day Reminder' : 'Initial Automatic Alert'}</p>
      </div>
      <p>${dealer.alert_needed === 'threshold_followup_5day'
        ? 'This is an automatic reminder. Please update your stock to stop these 5-day reminder emails.'
        : 'This alert is sent automatically when stock becomes low or out of stock.'}</p>
      <p>Regards,<br>${COMPANY_NAME}</p>
    </div>
  `;

  const pdfBuffer = generateStockAlertPDFBuffer(dealer, products, dealer.alert_needed);

  let emailSent = false;
  if (DEV_MODE) {
    console.log(`   EMAIL DEV MODE -> ${dealer.email} (${products.length} items)`);
    emailSent = true;
  } else {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: dealer.email,
      subject: title,
      html,
      attachments: [
        {
          filename: `stock-alert-${dealer.unique_dealer_id || dealer.dealer_id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
    emailSent = true;
  }

  const notificationResult = await client.query(
    `INSERT INTO dealer_notifications (dealer_id, title, message, type, priority, sent_via_email, email_sent_at, created_by)
     VALUES ($1, $2, $3, 'stock_alert_pdf', 'high', $4, CASE WHEN $4 THEN NOW() ELSE NULL END, 'system')
     RETURNING id`,
    [
      dealer.dealer_id,
      title,
      'An automatic PDF stock alert report was sent for low-stock and out-of-stock products.',
      emailSent,
    ]
  );

  await client.query(
    `INSERT INTO dealer_auto_alert_history (
      dealer_id,
      alert_type,
      days_since_update,
      low_stock_count,
      out_of_stock_count,
      notification_id,
      email_sent
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      dealer.dealer_id,
      dealer.alert_needed,
      Number(dealer.days_since_update || 0),
      Number(dealer.low_stock_count || 0),
      Number(dealer.out_of_stock_count || 0),
      notificationResult.rows[0].id,
      emailSent,
    ]
  );

  return { success: true, emailSent };
}

async function runAutoStockAlertCron() {
  const startTime = new Date();
  const client = await pool.connect();

  console.log('\n=======================================================');
  console.log('AUTOMATIC PDF STOCK ALERT CRON JOB');
  console.log(`Started at: ${startTime.toLocaleString()}`);
  console.log('=======================================================\n');

  try {
    await ensureAutoAlertHistoryTable(client);

    const transporter = getTransporter();
    const dealersNeedingAlert = await getDealersNeedingAlerts(client);

    console.log(`Found ${dealersNeedingAlert.length} dealer(s) needing automatic PDF alerts\n`);

    if (dealersNeedingAlert.length === 0) {
      console.log('No alerts needed at this time.\n');
      return;
    }

    let successful = 0;
    let failed = 0;
    let emailsSent = 0;

    for (const dealer of dealersNeedingAlert) {
      try {
        console.log(`Processing dealer ${dealer.dealer_id} -> ${dealer.full_name} [${dealer.alert_needed}]`);
        const result = await sendAlertToDealer(client, transporter, dealer);
        if (result.success) successful += 1;
        if (result.emailSent) emailsSent += 1;
      } catch (error) {
        failed += 1;
        console.error(`Failed dealer ${dealer.dealer_id}:`, error.message);
      }
    }

    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;

    console.log('\n=======================================================');
    console.log('SUMMARY');
    console.log('=======================================================');
    console.log(`Total Dealers Processed: ${dealersNeedingAlert.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    console.log(`Emails Sent: ${emailsSent}`);
    console.log(`Duration: ${duration.toFixed(2)} seconds`);
    console.log(`Completed at: ${endTime.toLocaleString()}`);
    console.log('=======================================================\n');
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runAutoStockAlertCron()
    .then(() => {
      console.log('Cron job completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Cron job failed:', error);
      process.exit(1);
    });
}

module.exports = { runAutoStockAlertCron };
