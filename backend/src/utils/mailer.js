const nodemailer = require('nodemailer');

/**
 * Sends a 6-digit OTP verification code via Gmail SMTP.
 * Fallbacks to configured default app password if env variables are not present.
 */
async function sendOtpEmail({ email, code }) {
  const rawUser = process.env.SMTP_USER || process.env.GMAIL_USER || 'asadraza5670@gmail.com';
  const rawPass = process.env.SMTP_PASS || process.env.GMAIL_PASS || 'qqrtdtnkusxwyroq';

  console.log(`\n==========================================================`);
  console.log(`🔑 [LEGALHUB OTP EMAIL DISPATCH] Target Email: ${email}`);
  console.log(`🔑 [LEGALHUB OTP EMAIL DISPATCH] Sender Email: ${rawUser}`);
  console.log(`🔑 [LEGALHUB OTP EMAIL DISPATCH] 6-Digit OTP Code: ${code}`);
  console.log(`==========================================================\n`);

  const cleanUser = rawUser.trim();
  const cleanPass = rawPass.trim().replace(/\s+/g, ''); // strip spaces from App Password

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
    });

    const mailOptions = {
      from: `"LegalHub Pakistan Security" <${cleanUser}>`,
      to: email.trim(),
      subject: `🔐 ${code} is your LegalHub Verification Code`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>LegalHub Account Verification</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F3F4F6; padding: 40px 10px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" style="max-width: 580px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #E5E7EB;" cellspacing="0" cellpadding="0">
                  
                  <!-- Executive Emerald Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #072E1E 0%, #0F5C3C 100%); padding: 32px 28px; text-align: center; border-bottom: 4px solid #C9A227;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td align="center">
                            <div style="display: inline-block; background: rgba(201, 162, 39, 0.15); border: 1px solid rgba(201, 162, 39, 0.4); padding: 6px 14px; border-radius: 20px; color: #F3E08A; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px;">
                              OFFICIAL SECURITY NOTICE
                            </div>
                            <h1 style="margin: 0; color: #FFFFFF; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">LegalHub Pakistan</h1>
                            <p style="margin: 6px 0 0; color: #E5E7EB; font-size: 13px; opacity: 0.9;">Digital Legal Workspace & Verified Advocate Directory</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Main Content Area -->
                  <tr>
                    <td style="padding: 36px 32px; background-color: #FFFFFF;">
                      <h2 style="margin: 0 0 12px; color: #072E1E; font-size: 20px; font-weight: 700;">Account Password Reset & Verification</h2>
                      <p style="margin: 0 0 24px; color: #4B5563; font-size: 14.5px; line-height: 1.6;">
                        You requested a verification code for your LegalHub account (<strong>${email}</strong>). Use the 6-digit code below:
                      </p>

                      <!-- Premium OTP Code Display Box -->
                      <div style="background-color: #F0FDF4; border: 2px dashed #0F5C3C; border-radius: 12px; padding: 24px; text-align: center; margin: 28px 0;">
                        <span style="display: block; font-size: 11px; font-weight: 700; color: #0F5C3C; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Your 6-Digit Code</span>
                        <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #0F5C3C; display: inline-block;">${code}</span>
                      </div>

                      <div style="background-color: #FEF3C7; border-left: 4px solid #D97706; padding: 12px 16px; border-radius: 6px; margin-bottom: 24px;">
                        <p style="margin: 0; color: #92400E; font-size: 12.5px; font-weight: 600;">
                          ⏱️ Code Expiry Notice: This verification code expires in <strong>10 minutes</strong>. Never share this code with anyone.
                        </p>
                      </div>

                      <p style="margin: 0; color: #6B7280; font-size: 13px; line-height: 1.5;">
                        If you did not request this, please ignore this email. Your LegalHub account remains protected.
                      </p>
                    </td>
                  </tr>

                  <!-- Professional Footer -->
                  <tr>
                    <td style="background-color: #F9FAFB; padding: 24px 32px; border-top: 1px solid #E5E7EB; text-align: center;">
                      <p style="margin: 0 0 8px; color: #6B7280; font-size: 12px; font-weight: 600;">
                        🛡️ Protected by 256-Bit SSL Encryption & High Court Data Compliance
                      </p>
                      <p style="margin: 0; color: #9CA3AF; font-size: 11.5px;">
                        © ${new Date().getFullYear()} LegalHub Pakistan. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [GMAIL DELIVERED] Verification code successfully sent to ${email}! Message ID: ${info.messageId}`);
    return { success: true, devMode: false, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ [GMAIL SMTP ERROR] Failed to send email via Gmail SMTP:`, err.message);
    return { success: true, devMode: true, error: err.message, code };
  }
}

module.exports = { sendOtpEmail };
