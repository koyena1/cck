import nodemailer from 'nodemailer';

const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

const DEV_MODE = process.env.EMAIL_DEV_MODE === 'true';
const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || 'protechtur@gmail.com';
const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME || 'CCTV Store';
const WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://protechtur.com';

function getTransporter() {
  if (DEV_MODE) {
    console.log('📧 EMAIL DEV MODE - Proforma email logged to console');
    return null;
  }
  if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
    console.error('❌ SMTP credentials not configured');
    return null;
  }
  return nodemailer.createTransport(EMAIL_CONFIG);
}

interface ProformaEmailData {
  dealerName: string;
  dealerEmail: string;
  proformaNumber: string;
  totalAmount: number;
  proformaId: number;
}

export async function sendProformaEmail(data: ProformaEmailData): Promise<boolean> {
  try {
    const { dealerName, dealerEmail, proformaNumber, totalAmount, proformaId } = data;
    const viewUrl = `${WEBSITE_URL}/dealer/proforma?id=${proformaId}`;
    const subject = `Proforma ${proformaNumber} Generated - Please Review | ${COMPANY_NAME}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proforma Invoice</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #c77a30 0%, #a35f1c 100%); color: #fff; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 26px; font-weight: bold; }
    .header p { margin: 10px 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 30px 20px; }
    .greeting { font-size: 18px; font-weight: 600; color: #c77a30; margin-bottom: 15px; }
    .message { font-size: 14px; color: #555; margin-bottom: 20px; }
    .info-box { background: #fef7ed; border-left: 4px solid #c77a30; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .info-box h3 { margin: 0 0 10px; color: #a35f1c; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #fde8cc; }
    .info-row:last-child { border-bottom: none; }
    .label { font-weight: 600; color: #666; }
    .value { font-weight: 700; color: #333; }
    .total-row { background: #c77a30; color: #fff; padding: 15px 20px; border-radius: 6px; margin: 20px 0; display: flex; justify-content: space-between; align-items: center; font-size: 18px; }
    .btn { display: inline-block; background: #c77a30; color: #fff !important; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 700; margin: 20px 0; text-align: center; }
    .btn:hover { background: #a35f1c; }
    .notice { background: #fff9db; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 13px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0; }
    .footer a { color: #c77a30; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PROFORMA INVOICE</h1>
      <p>Your proforma has been generated. Please finalize it.</p>
    </div>
    <div class="content">
      <p class="greeting">Hello ${dealerName},</p>
      <p class="message">
        A proforma invoice has been generated for your recent sales. Please review the details and finalize it at your earliest convenience.
      </p>
      <div class="info-box">
        <h3>Proforma Details</h3>
        <div class="info-row">
          <span class="label">Proforma Number:</span>
          <span class="value">${proformaNumber}</span>
        </div>
        <div class="info-row">
          <span class="label">Total Amount:</span>
          <span class="value">${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
      <div class="notice">
        <strong>Action Required:</strong> Please review and finalize this proforma. You can edit the line items if needed before finalizing.
      </div>
      <div style="text-align: center;">
        <a href="${viewUrl}" class="btn">View & Finalize Proforma →</a>
      </div>
      <p style="margin-top: 30px; font-size: 14px; color: #555;">
        If you have any questions, please contact the admin team.
      </p>
      <p style="font-size: 14px; color: #555;">
        Best regards,<br>
        <strong>${COMPANY_NAME} Team</strong>
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
      <p><a href="${WEBSITE_URL}">Visit Website</a></p>
    </div>
  </div>
</body>
</html>`;

    const textContent = `
Proforma Invoice - ${proformaNumber}

Hello ${dealerName},

Your proforma has been generated. Please finalize it.

Proforma Number: ${proformaNumber}
Total Amount: ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}

Please review and finalize: ${viewUrl}

Best regards,
${COMPANY_NAME} Team
`;

    if (DEV_MODE) {
      console.log('\n📧 ========== PROFORMA EMAIL (DEV MODE) ==========');
      console.log(`To: ${dealerEmail}`);
      console.log(`Subject: ${subject}`);
      console.log(`Proforma: ${proformaNumber}`);
      console.log(`View URL: ${viewUrl}`);
      console.log('================================================\n');
      return true;
    }

    const transport = getTransporter();
    if (!transport) {
      console.error('❌ Email transporter not available for proforma');
      return false;
    }

    await transport.sendMail({
      from: `"${COMPANY_NAME}" <${FROM_EMAIL}>`,
      to: dealerEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(`✓ Proforma email sent to ${dealerEmail} for ${proformaNumber}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send proforma email:', error);
    return false;
  }
}
