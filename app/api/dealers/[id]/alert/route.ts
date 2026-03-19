import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import nodemailer from 'nodemailer';

// POST - Send alert to dealer
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const dealerId = parseInt(params.id);
    const { title, message, type, priority, sendEmail } = await request.json();
    
    if (isNaN(dealerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid dealer ID' },
        { status: 400 }
      );
    }

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: 'Title and message are required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    
    // Get dealer info
    const dealerQuery = `
      SELECT dealer_id, full_name, email, business_name
      FROM dealers
      WHERE dealer_id = $1
    `;
    
    const dealerResult = await pool.query(dealerQuery, [dealerId]);
    
    if (dealerResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Dealer not found' },
        { status: 404 }
      );
    }

    const dealer = dealerResult.rows[0];

    // Insert notification into database
    const insertQuery = `
      INSERT INTO dealer_notifications (
        dealer_id,
        title,
        message,
        type,
        priority,
        sent_via_email,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const notificationResult = await pool.query(insertQuery, [
      dealerId,
      title,
      message,
      type || 'alert',
      priority || 'normal',
      sendEmail || false,
      'admin'
    ]);

    const notification = notificationResult.rows[0];

    // Send email if requested
    let emailSent = false;
    if (sendEmail && dealer.email) {
      try {
        // Configure email transporter
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        });

        // Email content
        const mailOptions = {
          from: process.env.SMTP_FROM || 'noreply@cctvwebsite.com',
          to: dealer.email,
          subject: `[${type?.toUpperCase() || 'ALERT'}] ${title}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                .alert-badge { display: inline-block; padding: 8px 16px; background: #facc15; color: #0f172a; font-weight: bold; border-radius: 20px; margin: 10px 0; }
                .message-box { background: white; padding: 20px; border-left: 4px solid #facc15; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                .button { display: inline-block; padding: 12px 24px; background: #facc15; color: #0f172a; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">CCTV Dealer Portal</h1>
                  <p style="margin: 10px 0 0 0; opacity: 0.9;">Important Notification</p>
                </div>
                <div class="content">
                  <div class="alert-badge">${type?.toUpperCase() || 'ALERT'}</div>
                  <h2 style="margin-top: 10px;">${title}</h2>
                  <div class="message-box">
                    <p>${message.replace(/\n/g, '<br>')}</p>
                  </div>
                  <p><strong>Dealer:</strong> ${dealer.full_name} ${dealer.business_name ? `(${dealer.business_name})` : ''}</p>
                  <p><strong>Priority:</strong> ${priority?.toUpperCase() || 'NORMAL'}</p>
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dealer/dashboard" class="button">
                    View in Dashboard
                  </a>
                  <div class="footer">
                    <p>This is an automated message from CCTV Dealer Portal Admin</p>
                    <p>Please do not reply to this email</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `,
        };

        await transporter.sendMail(mailOptions);
        emailSent = true;

        // Update notification with email sent timestamp
        await pool.query(
          'UPDATE dealer_notifications SET email_sent_at = CURRENT_TIMESTAMP WHERE id = $1',
          [notification.id]
        );
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      notification: notification,
      emailSent: emailSent,
      message: emailSent 
        ? 'Alert sent successfully and email delivered' 
        : 'Alert sent successfully'
    });
  } catch (error) {
    console.error('Error sending alert:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send alert' },
      { status: 500 }
    );
  }
}
