import jsPDF from 'jspdf';
import nodemailer from 'nodemailer';

type DealerEmailTarget = {
  dealerId: number;
  dealerName: string;
  businessName: string | null;
  email: string | null;
  uniqueDealerId: string | null;
  district?: string | null;
};

type StockAlertProduct = {
  product_id: number;
  product_code?: string;
  company: string;
  segment: string;
  model_number: string;
  product_type: string;
  dealer_purchase_price: number;
  quantity_available: number;
  item_stock_value: number;
};

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

function formatCurrency(value: number) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function classifyProduct(quantityAvailable: number) {
  if (quantityAvailable <= 0) return 'Out of Stock';
  return 'Low Stock';
}

function fitText(doc: jsPDF, value: string, maxWidth: number) {
  const safeValue = value || '—';
  if (doc.getTextWidth(safeValue) <= maxWidth) {
    return safeValue;
  }

  let trimmed = safeValue;
  while (trimmed.length > 1 && doc.getTextWidth(`${trimmed}...`) > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }

  return `${trimmed}...`;
}

export function generateStockAlertPDFBuffer(
  dealer: DealerEmailTarget,
  products: StockAlertProduct[],
  sentByRole: 'admin' | 'district',
  sentByLabel: string,
  customMessage?: string | null
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  const outOfStockCount = products.filter((item) => item.quantity_available <= 0).length;
  const lowStockCount = products.filter((item) => item.quantity_available > 0 && item.quantity_available < 5).length;

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
  doc.text(`Name: ${dealer.dealerName}`, margin, y);
  y += 5;
  doc.text(`Business: ${dealer.businessName || '—'}`, margin, y);
  y += 5;
  doc.text(`Dealer ID: ${dealer.uniqueDealerId || dealer.dealerId}`, margin, y);
  if (dealer.district) {
    y += 5;
    doc.text(`District: ${dealer.district}`, margin, y);
  }

  let summaryY = 42;
  doc.text(`Out of Stock: ${outOfStockCount}`, pageWidth / 2, summaryY);
  summaryY += 5;
  doc.text(`Low Stock: ${lowStockCount}`, pageWidth / 2, summaryY);
  summaryY += 5;
  doc.text(`Reported by: ${sentByLabel}`, pageWidth / 2, summaryY);
  summaryY += 5;
  doc.text(`Role: ${sentByRole === 'admin' ? 'Admin' : 'District Manager'}`, pageWidth / 2, summaryY);

  y = Math.max(y, summaryY) + 8;

  if (customMessage) {
    doc.setFillColor(248, 250, 252);
    const messageHeight = 16;
    doc.roundedRect(margin, y, pageWidth - margin * 2, messageHeight, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Message', margin + 3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(customMessage, pageWidth - margin * 2 - 6), margin + 3, y + 10);
    y += messageHeight + 6;
  }

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

    const isOddRow = index % 2 === 0;
    if (isOddRow) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 4, pageWidth - margin * 2, 8, 'F');
    }

    const status = classifyProduct(product.quantity_available);
    const modelLabel = product.product_code
      ? `${product.model_number} (${product.product_code})`
      : product.model_number;
    const modelText = fitText(doc, modelLabel, 50);
    const brandText = fitText(doc, `${product.company} / ${product.product_type}`, 46);
    const statusText = fitText(doc, status, 22);

    doc.text(modelText, modelX, y);
    doc.text(brandText, brandX, y);
    doc.text(statusText, statusX, y);
    doc.text(String(product.quantity_available), qtyRightX, y, { align: 'right' });
    doc.text(formatCurrency(Number(product.dealer_purchase_price)), priceRightX, y, { align: 'right' });
    y += 8;
  });

  const pdfArrayBuffer = doc.output('arraybuffer');
  return Buffer.from(pdfArrayBuffer);
}

export async function sendStockAlertEmail(options: {
  dealer: DealerEmailTarget;
  products: StockAlertProduct[];
  sentByRole: 'admin' | 'district';
  sentByLabel: string;
  customMessage?: string | null;
}) {
  const { dealer, products, sentByRole, sentByLabel, customMessage } = options;

  if (!dealer.email) {
    throw new Error('Dealer email is not available');
  }

  if (products.length === 0) {
    throw new Error('No low-stock or out-of-stock items found for this dealer');
  }

  const pdfBuffer = generateStockAlertPDFBuffer(dealer, products, sentByRole, sentByLabel, customMessage);
  const outOfStockCount = products.filter((item) => item.quantity_available <= 0).length;
  const lowStockCount = products.filter((item) => item.quantity_available > 0 && item.quantity_available < 5).length;
  const dealerLabel = dealer.businessName || dealer.dealerName;

  const subject = `Stock Alert Report - ${dealerLabel}`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
      <h2 style="margin-bottom: 8px;">Stock Alert Report</h2>
      <p>Hello ${dealer.dealerName},</p>
      <p>Please review the attached stock report. It includes products that are currently low in stock or out of stock.</p>
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin:16px 0;">
        <p style="margin:0 0 6px 0;"><strong>Out of Stock:</strong> ${outOfStockCount}</p>
        <p style="margin:0 0 6px 0;"><strong>Low Stock:</strong> ${lowStockCount}</p>
        <p style="margin:0;"><strong>Sent By:</strong> ${sentByLabel} (${sentByRole === 'admin' ? 'Admin' : 'District Manager'})</p>
      </div>
      ${customMessage ? `<p><strong>Message:</strong> ${customMessage.replace(/\n/g, '<br>')}</p>` : ''}
      <p>Please update or replenish these items as soon as possible.</p>
      <p>Regards,<br>${COMPANY_NAME}</p>
    </div>
  `;

  if (DEV_MODE) {
    console.log('EMAIL DEV MODE: stock alert email', {
      to: dealer.email,
      subject,
      productCount: products.length,
    });
    return { emailSent: true, pdfBuffer };
  }

  const transporter = getTransporter();
  if (!transporter) {
    throw new Error('Email transporter is unavailable');
  }

  await transporter.sendMail({
    from: FROM_EMAIL,
    to: dealer.email,
    subject,
    html,
    attachments: [
      {
        filename: `stock-alert-${dealer.uniqueDealerId || dealer.dealerId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });

  return { emailSent: true, pdfBuffer };
}

export type { DealerEmailTarget, StockAlertProduct };