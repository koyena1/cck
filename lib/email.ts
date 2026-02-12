// lib/email.ts
import nodemailer from 'nodemailer';

// Email configuration
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

const DEV_MODE = process.env.EMAIL_DEV_MODE === 'true';
const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || 'protechtur@gmail.com';
const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME || 'CCTV Store';
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
}

/**
 * Send order confirmation email to customer with tracking link
 */
export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  try {
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
    } = data;

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
            <span class="value">₹${totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

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
- Total Amount: ₹${totalAmount.toLocaleString('en-IN')}
- Payment Method: ${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
- Payment Status: ${paymentStatus}

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

    // Development mode - just log to console
    if (DEV_MODE) {
      console.log('\n📧 ========== EMAIL (DEV MODE) ==========');
      console.log(`To: ${customerEmail}`);
      console.log(`Subject: ${subject}`);
      console.log(`Order Token: ${orderToken}`);
      console.log(`Tracking URL: ${trackingUrl}`);
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
    const subject = `Order Update: ${newStatus} - ${orderNumber}`;

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
    <p>Your order <strong>${orderNumber}</strong> has been updated:</p>
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
      console.log(`\n📧 Status Update Email (DEV): ${newStatus} - ${orderNumber}`);
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

export default {
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
};
