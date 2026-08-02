const nodemailer = require('nodemailer');

/**
 * Sends a 6-digit OTP verification code via Gmail SMTP if configured,
 * or logs prominently to console in Development Mode.
 */
async function sendOtpEmail({ email, code }) {
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_PASS;

  // Always log to terminal console for seamless FYP testing & defense
  console.log(`\n==========================================================`);
  console.log(`🔑 [LEGALHUB OTP CODE] Email: ${email}`);
  console.log(`🔑 [LEGALHUB OTP CODE] 6-Digit OTP Code: ${code}`);
  console.log(`🔑 [LEGALHUB OTP CODE] Expires In: 10 Minutes`);
  console.log(`==========================================================\n`);

  if (!smtpUser || !smtpPass) {
    console.log(`ℹ️ [DEV MODE] Real email delivery skipped because SMTP_USER / SMTP_PASS is not set in backend .env.`);
    return { success: true, devMode: true, code };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions = {
      from: `"LegalHub Pakistan" <${smtpUser}>`,
      to: email,
      subject: '🔐 Your LegalHub Account Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #0F5C3C; color: #FFFFFF; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px;">LegalHub Pakistan</h1>
            <p style="margin: 4px 0 0; font-size: 13px; color: #C9A227;">Digital Legal Workspace & Verified Advocate Directory</p>
          </div>
          <div style="padding: 28px; background-color: #FFFFFF; color: #101512;">
            <h2 style="margin: 0 0 12px; font-size: 18px;">Account Password Reset</h2>
            <p style="margin: 0 0 20px; font-size: 14px; color: #5B655F; line-height: 1.5;">
              You requested a password reset for your LegalHub account. Please use the 6-digit verification code below:
            </p>
            <div style="background-color: #F0FDF4; border: 2px dashed #0F5C3C; border-radius: 8px; padding: 18px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0F5C3C;">${code}</span>
            </div>
            <p style="margin: 0 0 8px; font-size: 12px; color: #5B655F;">
              ⏱️ This code will expire in <strong>10 minutes</strong>. Do not share this code with anyone.
            </p>
            <p style="margin: 0; font-size: 12px; color: #9CA3AF; font-style: italic;">
              If you did not request this, please ignore this email.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ [EMAIL SENT] Verification code successfully delivered to ${email}`);
    return { success: true, devMode: false };
  } catch (err) {
    console.error(`❌ [EMAIL ERROR] Failed to send email via Gmail SMTP:`, err.message);
    // Fallback to devMode response so request does not fail for user
    return { success: true, devMode: true, error: err.message, code };
  }
}

module.exports = { sendOtpEmail };
