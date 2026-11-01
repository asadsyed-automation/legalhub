const crypto = require('crypto');
const config = require('../config/env');

/**
 * In-memory test outbox for automated test suites.
 */
let testOutbox = [];

/**
 * Returns the current active mail provider.
 * Defaults to 'console' for local development, or 'test' during testing.
 */
const getProvider = () => {
  if (process.env.NODE_ENV === 'test') {
    return process.env.TEST_MAIL_PROVIDER || 'test';
  }
  return process.env.MAIL_PROVIDER || 'console';
};

/**
 * Dispatches an email notification via the configured provider.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} [options.text] - Plain text body
 * @param {string} [options.html] - HTML body
 * @returns {Promise<{ success: boolean, messageId: string, provider: string }>}
 */
const sendEmail = async ({ to, subject, text, html }) => {
  if (!to || typeof to !== 'string') {
    throw new Error('Mailer error: Recipient email address is required');
  }
  if (!subject || typeof subject !== 'string') {
    throw new Error('Mailer error: Email subject is required');
  }

  const provider = getProvider();
  const messageId = `msg_${crypto.randomUUID()}`;
  const timestamp = new Date().toISOString();

  if (provider === 'test') {
    testOutbox.push({
      messageId,
      to,
      subject,
      text: text || '',
      html: html || '',
      timestamp
    });
    return { success: true, messageId, provider: 'test' };
  }

  if (provider === 'resend' && config.resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: config.mailFrom || 'LegalHub <onboarding@resend.dev>',
          to: [to],
          subject,
          text: text || '',
          html: html || undefined
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        console.warn(
          `[MAILER:RESEND_NOTICE] Resend status ${res.status}: ${resData?.message || JSON.stringify(resData)}. Logging to console.`
        );
        console.log(
          `[MAILER:CONSOLE] [${timestamp}] Message ${messageId} -> To: ${to} | Subject: "${subject}" | Content: ${text || ''}`
        );
        return { success: true, messageId: resData?.id || messageId, provider: 'resend_fallback' };
      }

      console.log(
        `[MAILER:RESEND] [${timestamp}] Delivered ${resData.id} -> To: ${to} | Subject: "${subject}"`
      );
      return { success: true, messageId: resData.id, provider: 'resend' };
    } catch (err) {
      console.warn(`[MAILER:RESEND_NETWORK_ERR] ${err.message}. Logging to console.`);
      console.log(
        `[MAILER:CONSOLE] [${timestamp}] Message ${messageId} -> To: ${to} | Subject: "${subject}" | Content: ${text || ''}`
      );
      return { success: true, messageId, provider: 'console' };
    }
  }

  if (provider === 'console') {
    console.log(
      `[MAILER:CONSOLE] [${timestamp}] Message ${messageId} -> To: ${to} | Subject: "${subject}" | Content: ${text || ''}`
    );
    return { success: true, messageId, provider: 'console' };
  }

  // Fallback for custom or skipped providers
  return { success: true, messageId, provider: 'noop' };
};

/**
 * Test helpers for asserting email delivery in Jest suites.
 */
const getOutbox = () => [...testOutbox];
const clearOutbox = () => {
  testOutbox = [];
};
const getLastEmail = () => (testOutbox.length > 0 ? testOutbox[testOutbox.length - 1] : null);

module.exports = {
  sendEmail,
  getOutbox,
  clearOutbox,
  getLastEmail,
  getProvider
};
