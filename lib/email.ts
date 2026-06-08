// lib/email.ts
import nodemailer from 'nodemailer';
import { generateInvoicePDFBuffer } from './generate-invoice-pdf';
import { buildPaymentBreakdown } from './payment-breakdown';
import { getPool } from './db';
import { getOrCreateCustomerInvoiceNumber } from './order-numbering';

const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS_RAW = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '';
const SMTP_PASS = SMTP_PASS_RAW.replace(/\s+/g, '');

// Email configuration
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
};

const DEV_MODE = process.env.EMAIL_DEV_MODE === 'true';
const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || 'protechtur@gmail.com';
const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME || process.env.COMPANY_NAME || 'Protechtur';
const WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://protechtur.com';

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    if (DEV_MODE) {
      console.log('📧 EMAIL DEV MODE - Emails will be logged to console');
      return null;
    }

    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
      console.error('❌ SMTP credentials not configured');
      return null;
    }

    transporter = nodemailer.createTransport(EMAIL_CONFIG);
  }
  return transporter;
}

interface OrderItem {
  item_name: string;
  product_code?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  item_type?: string;
}

interface OrderEmailData {
  orderNumber: string;
  orderToken: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderDate: string;
  trackingUrl: string;
  orderDetails?: any;
  orderItems?: OrderItem[];
  // For PDF invoice attachment — pass the full order DB row
  fullOrderData?: Record<string, any>;
  // COD Payment Breakdown (optional)
  productTotal?: number;
  installationCharges?: number;
  codExtraCharges?: number;
  baseAmount?: number;
  codAdvancePaid?: number;
  codPendingAmount?: number;
  taxAmount?: number;
}

/**
 * Send order confirmation email to customer with tracking link
 */
export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  try {
    const roundTo2 = (value: number) => Math.round(value * 100) / 100;

    const {
      orderNumber,
      orderToken,
      customerName,
      customerEmail,
      totalAmount,
      paymentMethod,
      paymentStatus,
      orderDate,
      trackingUrl,
      orderDetails,
      productTotal,
      installationCharges,
      codExtraCharges,
      taxAmount,
      baseAmount,
      codAdvancePaid,
      codPendingAmount,
      orderItems,
      fullOrderData,
    } = data;

    const isCOD = paymentMethod === 'cod';
    const resolvedCodAdvancePaid = isCOD
      ? parseFloat(String(
          codAdvancePaid
          ?? orderDetails?.advance_amount
          ?? fullOrderData?.advance_amount
          ?? 0
        )) || 0
      : 0;
    const resolvedCodPendingAmount = isCOD
      ? Math.max(0, totalAmount - resolvedCodAdvancePaid)
      : 0;

    const paymentBreakdown = buildPaymentBreakdown({
      productsTotal: productTotal ?? fullOrderData?.products_total,
      subtotal: orderDetails?.subtotal ?? fullOrderData?.subtotal ?? baseAmount,
      installationCharges: installationCharges ?? orderDetails?.installation_charges ?? fullOrderData?.installation_charges,
      amcCharges: orderDetails?.amc_cost ?? fullOrderData?.amc_cost,
      deliveryCharges: orderDetails?.delivery_charges ?? fullOrderData?.delivery_charges,
      taxAmount: taxAmount ?? orderDetails?.tax_amount ?? fullOrderData?.tax_amount,
      totalAmount,
      paymentMethod,
      codFlatAmount: codExtraCharges ?? fullOrderData?._codFlatAmount,
      discountAmount: orderDetails?.discount_amount ?? fullOrderData?.discount_amount,
      referralDiscount: orderDetails?.referral_discount ?? fullOrderData?.referral_discount,
      pointsRedeemed: orderDetails?.points_redeemed ?? fullOrderData?.points_redeemed,
    });

    const resolvedTaxAmount = roundTo2(paymentBreakdown.gstAmount);
    const resolvedCodExtraCharges = roundTo2(paymentBreakdown.codExtraCharges);
    const actualProductPrice = roundTo2(paymentBreakdown.actualProductPrice);
    const resolvedInstallationCharges = roundTo2(paymentBreakdown.installationCharges);
    const resolvedAmcCharges = roundTo2(paymentBreakdown.amcCharges);
    const resolvedDeliveryCharges = roundTo2(paymentBreakdown.deliveryCharges);

    const subject = `Order Confirmation - ${orderNumber} | ${COMPANY_NAME}`;
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #e63946 0%, #c62936 100%); color: #ffffff; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .header p { margin: 10px 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 30px 20px; }
    .success-icon { text-align: center; margin-bottom: 20px; }
    .success-icon svg { width: 60px; height: 60px; }
    .greeting { font-size: 18px; font-weight: 600; color: #e63946; margin-bottom: 15px; }
    .message { font-size: 14px; color: #555; margin-bottom: 25px; }
    .order-box { background: #f8f9fa; border-left: 4px solid #e63946; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .order-box h2 { margin: 0 0 15px; font-size: 18px; color: #333; }
    .order-info { margin: 10px 0; }
    .order-info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
    .order-info-row:last-child { border-bottom: none; }
    .label { font-weight: 600; color: #666; }
    .value { color: #333; text-align: right; }
    .payment-breakdown { background: #f0f9ff; border: 2px solid #0ea5e9; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .payment-breakdown h3 { margin: 0 0 15px; font-size: 16px; color: #0369a1; display: flex; align-items: center; gap: 8px; }
    .breakdown-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #bae6fd; }
    .breakdown-row:last-child { border-bottom: none; }
    .breakdown-label { font-weight: 500; color: #0c4a6e; }
    .breakdown-value { font-weight: 600; color: #0c4a6e; }
    .breakdown-highlight { background: #dcfce7; padding: 12px; border-radius: 6px; margin-top: 10px; border: 2px solid #22c55e; }
    .breakdown-highlight .breakdown-label { color: #15803d; font-weight: 700; font-size: 15px; }
    .breakdown-highlight .breakdown-value { color: #15803d; font-weight: 700; font-size: 15px; }
    .breakdown-pending { background: #fef3c7; padding: 12px; border-radius: 6px; margin-top: 10px; border: 2px solid #f59e0b; }
    .breakdown-pending .breakdown-label { color: #92400e; font-weight: 700; font-size: 15px; }
    .breakdown-pending .breakdown-value { color: #92400e; font-weight: 700; font-size: 15px; }
    .total-row { background: #fff3cd; padding: 12px; margin-top: 15px; border-radius: 4px; font-size: 16px; font-weight: bold; }
    .tracking-box { background: #e7f5ff; border: 2px dashed #1971c2; padding: 20px; margin: 25px 0; border-radius: 8px; text-align: center; }
    .tracking-box h3 { margin: 0 0 10px; color: #1971c2; font-size: 16px; }
    .tracking-token { font-size: 24px; font-weight: bold; color: #e63946; letter-spacing: 1px; margin: 15px 0; padding: 10px; background: white; border-radius: 4px; display: inline-block; }
    .btn { display: inline-block; background: #e63946; color: #ffffff !important; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 15px 0; transition: background 0.3s; }
    .btn:hover { background: #c62936; }
    .instructions { background: #fff9db; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 13px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0; }
    .footer a { color: #e63946; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .container { margin: 10px; }
      .content { padding: 20px 15px; }
      .tracking-token { font-size: 18px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Order Confirmed!</h1>
      <p>Thank you for your order</p>
    </div>
    
    <div class="content">
      <div class="success-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#22c55e">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      
      <p class="greeting">Hello ${customerName},</p>
      <p class="message">
        Your order has been successfully placed! We're excited to help you secure your property with our CCTV solutions.
      </p>

      <div class="order-box">
        <h2>📦 Order Details</h2>
        <div class="order-info">
          <div class="order-info-row">
            <span class="label">Order Number:</span>
            <span class="value"><strong>${orderNumber}</strong></span>
          </div>
          <div class="order-info-row">
            <span class="label">Order Date:</span>
            <span class="value">${new Date(orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <div class="order-info-row">
            <span class="label">Payment Method:</span>
            <span class="value">${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
          </div>
          <div class="order-info-row">
            <span class="label">Payment Status:</span>
            <span class="value">${paymentStatus}</span>
          </div>
        </div>
        <div class="total-row">
          <div class="order-info-row" style="border: none; margin: 0;">
            <span class="label">Total Amount:</span>
            <span class="value">RS ${totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div class="payment-breakdown">
        <h3>Payment Breakdown</h3>
        <div class="breakdown-row">
          <span class="breakdown-label">Actual Product Price:</span>
          <span class="breakdown-value">RS ${actualProductPrice.toLocaleString('en-IN')}</span>
        </div>
        ${resolvedInstallationCharges > 0 ? `
        <div class="breakdown-row">
          <span class="breakdown-label">Installation Charges:</span>
          <span class="breakdown-value">RS ${resolvedInstallationCharges.toLocaleString('en-IN')}</span>
        </div>
        ` : ''}
        ${resolvedAmcCharges > 0 ? `
        <div class="breakdown-row">
          <span class="breakdown-label">AMC Charges:</span>
          <span class="breakdown-value">RS ${resolvedAmcCharges.toLocaleString('en-IN')}</span>
        </div>
        ` : ''}
        ${resolvedDeliveryCharges > 0 ? `
        <div class="breakdown-row">
          <span class="breakdown-label">Delivery Charges:</span>
          <span class="breakdown-value">RS ${resolvedDeliveryCharges.toLocaleString('en-IN')}</span>
        </div>
        ` : ''}
        ${resolvedTaxAmount > 0 ? `
        <div class="breakdown-row">
          <span class="breakdown-label">GST (18%):</span>
          <span class="breakdown-value">RS ${resolvedTaxAmount.toLocaleString('en-IN')}</span>
        </div>
        ` : ''}
        ${isCOD && resolvedCodExtraCharges > 0 ? `
        <div class="breakdown-row">
          <span class="breakdown-label">COD Extra Charges:</span>
          <span class="breakdown-value">RS ${resolvedCodExtraCharges.toLocaleString('en-IN')}</span>
        </div>
        ` : ''}
        <div class="breakdown-row" style="background: linear-gradient(to right, #eff6ff, #dbeafe); padding: 15px; border-radius: 8px; margin-top: 12px; border: 2px solid #0ea5e9;">
          <span class="breakdown-label" style="font-size: 16px; font-weight: 700; color: #0c4a6e;">Grand Total:</span>
          <span class="breakdown-value" style="font-size: 16px; font-weight: 700; color: #0c4a6e;">RS ${totalAmount.toLocaleString('en-IN')}</span>
        </div>
      </div>

      ${orderItems && orderItems.length > 0 ? `
      <div style="margin: 20px 0; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden;">
        <div style="background: #e63946; padding: 12px 16px;">
          <h2 style="margin: 0; font-size: 17px; color: #ffffff;">🛒 Items Ordered</h2>
        </div>
        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th class="text-right" style="width: 45px;">Qty</th>
              <th class="text-right" style="width: 90px;">Unit Price</th>
              <th class="text-right" style="width: 90px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${orderItems.map(item => `
            <tr>
              <td>${item.item_name}${item.product_code ? ` <span style="color:#475569;font-size:11px;font-weight:700;">(Product Unique_ID: ${item.product_code})</span>` : ''}${item.item_type && item.item_type !== 'Product' ? ` <span style="color:#777;font-size:11px;">(${item.item_type})</span>` : ''}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">RS ${parseFloat(String(item.unit_price)).toLocaleString('en-IN')}</td>
              <td class="text-right">RS ${parseFloat(String(item.total_price)).toLocaleString('en-IN')}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      ${isCOD ? `
      <div class="payment-breakdown">
        <h3>COD Payment Status</h3>
        
        <div class="breakdown-highlight">
          <div class="breakdown-row" style="border: none; padding: 0;">
            <span class="breakdown-label">✅ Already Paid (Advance):</span>
            <span class="breakdown-value">RS ${resolvedCodAdvancePaid.toLocaleString('en-IN')}</span>
          </div>
        </div>
        
        <div class="breakdown-pending">
          <div class="breakdown-row" style="border: none; padding: 0;">
            <span class="breakdown-label">⏳ Pending (Pay on Delivery):</span>
            <span class="breakdown-value">RS ${resolvedCodPendingAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin-top: 15px;">
          <p style="margin: 0 0 5px; font-size: 14px; font-weight: 600; color: #92400e;">
            ⚠️ Important: Payment Pending
          </p>
          <p style="margin: 0; font-size: 13px; color: #78350f; line-height: 1.5;">
            You have already paid <strong>RS ${resolvedCodAdvancePaid.toLocaleString('en-IN')}</strong> as advance. <br>
            The remaining <strong>RS ${resolvedCodPendingAmount.toLocaleString('en-IN')}</strong> must be paid in cash at the time of delivery.
          </p>
        </div>
      </div>
      ` : ''}

      <div class="tracking-box">
        <h3>🔍 Track Your Order</h3>
        <p style="margin: 10px 0; font-size: 14px; color: #555;">
          Use this tracking token to check your order status anytime:
        </p>
        <div class="tracking-token">${orderToken}</div>
        <p style="margin: 10px 0; font-size: 13px; color: #666;">
          Keep this token safe - you'll need it to track your order
        </p>
        <a href="${trackingUrl}" class="btn">Track Order Now →</a>
      </div>

      <div class="instructions">
        <strong>📋 What's Next?</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Our team will verify your order within 24 hours</li>
          <li>You'll receive updates via SMS and email</li>
          <li>Installation will be scheduled after delivery</li>
          <li>Track your order anytime using the token above</li>
        </ul>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #555;">
        If you have any questions, feel free to contact our support team.
      </p>
      
      <p style="font-size: 14px; color: #555;">
        Best regards,<br>
        <strong>${COMPANY_NAME} Team</strong>
      </p>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
      <p>
        <a href="${WEBSITE_URL}">Visit Website</a> | 
        <a href="${WEBSITE_URL}/contact">Contact Support</a> | 
        <a href="${trackingUrl}">Track Order</a>
      </p>
      <p style="margin-top: 10px; font-size: 11px; color: #999;">
        This is an automated email. Please do not reply to this message.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
Order Confirmation - ${orderNumber}

Hello ${customerName},

Your order has been successfully placed!

Order Details:
- Order Number: ${orderNumber}
- Order Date: ${new Date(orderDate).toLocaleDateString()}
- Total Amount: RS ${totalAmount.toLocaleString('en-IN')}
- Payment Method: ${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
- Payment Status: ${paymentStatus}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PAYMENT BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Actual Product Price: RS ${actualProductPrice.toLocaleString('en-IN')}
${resolvedInstallationCharges > 0 ? `Installation Charges: RS ${resolvedInstallationCharges.toLocaleString('en-IN')}
` : ''}${resolvedAmcCharges > 0 ? `AMC Charges: RS ${resolvedAmcCharges.toLocaleString('en-IN')}
` : ''}${resolvedDeliveryCharges > 0 ? `Delivery Charges: RS ${resolvedDeliveryCharges.toLocaleString('en-IN')}
` : ''}${resolvedTaxAmount > 0 ? `GST (18%): RS ${resolvedTaxAmount.toLocaleString('en-IN')}
` : ''}${isCOD && resolvedCodExtraCharges > 0 ? `COD Extra Charges: RS ${resolvedCodExtraCharges.toLocaleString('en-IN')}
` : ''}Grand Total: RS ${totalAmount.toLocaleString('en-IN')}

${isCOD ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 COD PAYMENT STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Already Paid (Advance): RS ${resolvedCodAdvancePaid.toLocaleString('en-IN')}
⏳ Pending (Pay on Delivery): RS ${resolvedCodPendingAmount.toLocaleString('en-IN')}

The remaining RS ${resolvedCodPendingAmount.toLocaleString('en-IN')} must be paid in cash at the time of delivery.
` : ''}

${orderItems && orderItems.length > 0 ? `
Items Ordered:
${orderItems.map(item => `- ${item.item_name}${item.product_code ? ` [Product Unique_ID: ${item.product_code}]` : ''}${item.item_type && item.item_type !== 'Product' ? ` (${item.item_type})` : ''} x${item.quantity}  RS ${parseFloat(String(item.total_price)).toLocaleString('en-IN')}`).join('\n')}
` : ''}
Track Your Order:
Use this tracking token: ${orderToken}
Track URL: ${trackingUrl}

What's Next?
1. Our team will verify your order within 24 hours
2. You'll receive updates via SMS and email
3. Installation will be scheduled after delivery
4. Track your order anytime using the token above

Best regards,
${COMPANY_NAME} Team

© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.
    `;

    // Generate PDF invoice if full order data is available
    let invoicePdfBuffer: Buffer | null = null;
    let invoiceFileName = 'Invoice.pdf';
    if (fullOrderData) {
      try {
        const invoiceNumber = await getOrCreateCustomerInvoiceNumber(getPool(), fullOrderData);
        invoiceFileName = `Invoice-${invoiceNumber}.pdf`;
        const codFlatAmt = fullOrderData._codFlatAmount || 500;
        invoicePdfBuffer = generateInvoicePDFBuffer(
          fullOrderData,
          orderItems || [],
          invoiceNumber,
          codFlatAmt
        );
      } catch (pdfErr) {
        console.error('⚠️ PDF generation failed (email will be sent without attachment):', pdfErr);
      }
    }

    // Development mode - just log to console
    if (DEV_MODE) {
      console.log('\n📧 ========== EMAIL (DEV MODE) ==========');
      console.log(`To: ${customerEmail}`);
      console.log(`Subject: ${subject}`);
      console.log(`Order Token: ${orderToken}`);
      console.log(`Tracking URL: ${trackingUrl}`);
      if (invoicePdfBuffer) console.log(`📎 PDF attachment ready: ${invoiceFileName}`);
      console.log('=======================================\n');
      return true;
    }

    // Production mode - send actual email
    const transport = getTransporter();
    if (!transport) {
      console.error('❌ Email transporter not available');
      return false;
    }

    await transport.sendMail({
      from: `"${COMPANY_NAME}" <${FROM_EMAIL}>`,
      to: customerEmail,
      subject,
      text: textContent,
      html: htmlContent,
      attachments: invoicePdfBuffer
        ? [{ filename: invoiceFileName, content: invoicePdfBuffer, contentType: 'application/pdf' }]
        : [],
    });

    console.log(`✓ Order confirmation email sent to ${customerEmail}`);
    return true;

  } catch (error) {
    console.error('❌ Failed to send order confirmation email:', error);
    return false;
  }
}

/**
 * Send order status update email
 */
export async function sendOrderStatusUpdateEmail(
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  orderToken: string,
  newStatus: string,
  statusMessage: string
): Promise<boolean> {
  try {
    const trackingUrl = `${WEBSITE_URL}/guest-track-order?token=${orderToken}`;
    const customerOrderNumber = /^PR-\d{6}-\d+-\d+$/.test(orderNumber)
      ? orderNumber.replace(/-\d+$/, '')
      : orderNumber;
    const subject = `Order Update: ${newStatus} - ${customerOrderNumber}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; padding: 30px; }
    .header { background: #e63946; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; margin: -30px -30px 20px; }
    .status-badge { display: inline-block; background: #22c55e; color: white; padding: 8px 16px; border-radius: 20px; font-weight: 600; }
    .btn { display: inline-block; background: #e63946; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Status Update</h1>
    </div>
    <p>Hello ${customerName},</p>
    <p>Your order <strong>${customerOrderNumber}</strong> has been updated:</p>
    <p><span class="status-badge">${newStatus}</span></p>
    <p style="background: #f8f9fa; padding: 15px; border-left: 4px solid #e63946; margin: 20px 0;">
      ${statusMessage}
    </p>
    <p>Track your order: <strong>${orderToken}</strong></p>
    <a href="${trackingUrl}" class="btn">Track Order →</a>
    <p style="margin-top: 30px; font-size: 14px; color: #666;">
      Best regards,<br>${COMPANY_NAME} Team
    </p>
  </div>
</body>
</html>
    `;

    if (DEV_MODE) {
      console.log(`\n📧 Status Update Email (DEV): ${newStatus} - ${customerOrderNumber}`);
      return true;
    }

    const transport = getTransporter();
    if (!transport) return false;

    await transport.sendMail({
      from: `"${COMPANY_NAME}" <${FROM_EMAIL}>`,
      to: customerEmail,
      subject,
      html: htmlContent,
    });

    console.log(`✓ Status update email sent to ${customerEmail}`);
    return true;

  } catch (error) {
    console.error('❌ Failed to send status update email:', error);
    return false;
  }
}

/**
 * Send OTP verification email for customer registration
 */
export async function sendOTPEmail(
  customerEmail: string,
  otpCode: string,
  customerName?: string
): Promise<boolean> {
  try {
    const subject = `Your Verification Code - ${COMPANY_NAME}`;
    const displayName = customerName || 'Valued Customer';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #e63946 0%, #c62936 100%); color: #ffffff; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .content { padding: 40px 30px; }
    .otp-box { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #0ea5e9; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
    .otp-code { font-size: 42px; font-weight: bold; color: #0c4a6e; letter-spacing: 8px; font-family: 'Courier New', monospace; margin: 10px 0; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; color: #78350f; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .icon { font-size: 48px; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">🔐</div>
      <h1>Email Verification</h1>
      <p style="margin: 10px 0 0; font-size: 14px; opacity: 0.9;">Secure your account</p>
    </div>
    
    <div class="content">
      <p style="font-size: 16px; margin-bottom: 10px;">Hello <strong>${displayName}</strong>,</p>
      <p style="color: #555;">Thank you for registering with ${COMPANY_NAME}! To complete your registration, please verify your email address.</p>
      
      <div class="otp-box">
        <p style="margin: 0 0 10px; font-size: 14px; color: #475569;">Your Verification Code:</p>
        <div class="otp-code">${otpCode}</div>
        <p style="margin: 15px 0 0; font-size: 13px; color: #64748b;">Valid for 10 minutes</p>
      </div>
      
      <p style="color: #555; margin: 20px 0;">Enter this code in the registration form to verify your email address and complete your account setup.</p>
      
      <div class="warning">
        <p style="margin: 0; font-size: 13px; font-weight: 600;">⚠️ Security Notice:</p>
        <ul style="margin: 10px 0 0; padding-left: 20px; font-size: 13px;">
          <li>Never share this code with anyone</li>
          <li>Our team will never ask for your OTP</li>
          <li>This code expires in 10 minutes</li>
        </ul>
      </div>
      
      <p style="margin-top: 30px; font-size: 13px; color: #666;">
        If you didn't request this verification code, please ignore this email or contact our support team.
      </p>
    </div>
    
    <div class="footer">
      <p style="margin: 0;">© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
      <p style="margin: 5px 0 0;">This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
Email Verification - ${COMPANY_NAME}

Hello ${displayName},

Thank you for registering with ${COMPANY_NAME}! To complete your registration, please verify your email address.

Your Verification Code: ${otpCode}

This code is valid for 10 minutes.

Enter this code in the registration form to verify your email address and complete your account setup.

⚠️ SECURITY NOTICE:
- Never share this code with anyone
- Our team will never ask for your OTP
- This code expires in 10 minutes

If you didn't request this verification code, please ignore this email or contact our support team.

© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.
    `;

    if (DEV_MODE) {
      console.log(`\n📧 OTP Email (DEV MODE)`);
      console.log(`   To: ${customerEmail}`);
      console.log(`   OTP Code: ${otpCode}`);
      console.log(`   Expires: 10 minutes\n`);
      return true;
    }

    const transport = getTransporter();
    if (!transport) {
      console.error('❌ Email transporter not available');
      return false;
    }

    await transport.sendMail({
      from: `"${COMPANY_NAME}" <${FROM_EMAIL}>`,
      to: customerEmail,
      subject,
      html: htmlContent,
      text: textContent,
    });

    console.log(`✅ OTP email sent to ${customerEmail}`);
    return true;

  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    return false;
  }
}

export default {
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendOTPEmail,
};
