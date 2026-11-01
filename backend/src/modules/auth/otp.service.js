'use strict';

const crypto = require('crypto');
const { EmailOtp } = require('../../models');
const { OTP_CONFIG, OTP_PURPOSES } = require('../../constants/auth');
const AppError = require('../../utils/AppError');

/**
 * Computes a standard SHA-256 hex hash from a 6-digit OTP code string.
 *
 * @param {string} code - 6-digit plain text code
 * @returns {string} - 64-character SHA-256 hex string
 */
const hashOtpCode = (code) => {
  return crypto.createHash('sha256').update(String(code).trim()).digest('hex');
};

/**
 * Generates and stores a cryptographically secure 6-digit OTP token.
 * Enforces a 60-second cooldown and invalidates previous unconsumed tokens of the same purpose.
 *
 * @param {string} userId - User UUID
 * @param {'verify_email'|'reset_password'} purpose - Purpose of token
 * @param {Object} [options]
 * @param {Date} [options.now] - Injectable current timestamp (for deterministic test clocks)
 * @returns {Promise<{ plainCode: string, expiresAt: Date, purpose: string }>}
 */
const generateOtp = async (userId, purpose, { now = new Date() } = {}) => {
  const currentTime = now instanceof Date ? now : new Date(now);

  // 1. Enforce 60-second cooldown against the most recent token of the same purpose
  const latestOtp = await EmailOtp.findOne({
    where: { userId, purpose },
    order: [['createdAt', 'DESC']]
  });

  if (latestOtp) {
    const elapsedMs = currentTime.getTime() - new Date(latestOtp.createdAt).getTime();
    if (elapsedMs < OTP_CONFIG.COOLDOWN_SECONDS * 1000) {
      const waitSeconds = Math.ceil((OTP_CONFIG.COOLDOWN_SECONDS * 1000 - elapsedMs) / 1000);
      throw new AppError(
        `Please wait at least ${waitSeconds} second(s) before requesting another code`,
        429
      );
    }
  }

  // 2. Invalidate any older unconsumed codes of the same purpose for this user
  await EmailOtp.update(
    { consumedAt: currentTime },
    {
      where: {
        userId,
        purpose,
        consumedAt: null
      }
    }
  );

  // 3. Generate 6-digit code via CSPRNG (100000 to 999999 inclusive)
  const plainCode = crypto.randomInt(100000, 1000000).toString();
  const codeHash = hashOtpCode(plainCode);
  const expiresAt = new Date(currentTime.getTime() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);

  // 4. Persist to database
  await EmailOtp.create({
    userId,
    purpose,
    codeHash,
    expiresAt,
    attempts: 0,
    createdAt: currentTime,
    updatedAt: currentTime
  });

  return {
    plainCode,
    expiresAt,
    purpose
  };
};

/**
 * Validates and consumes an OTP token.
 * Enforces expiry (10 min), max attempts (5 wrong attempts = dead), and one-time consumption.
 *
 * @param {string} userId - User UUID
 * @param {'verify_email'|'reset_password'} purpose - Purpose of token
 * @param {string} inputCode - 6-digit code submitted by user
 * @param {Object} [options]
 * @param {Date} [options.now] - Injectable current timestamp
 * @returns {Promise<boolean>}
 */
const verifyAndConsumeOtp = async (userId, purpose, inputCode, { now = new Date() } = {}) => {
  const currentTime = now instanceof Date ? now : new Date(now);
  const genericError = new AppError('Invalid or expired verification code', 400);

  // 1. Find the latest active unconsumed code for this user and purpose
  const otp = await EmailOtp.findOne({
    where: {
      userId,
      purpose,
      consumedAt: null
    },
    order: [['createdAt', 'DESC']]
  });

  if (!otp) {
    throw genericError;
  }

  // 2. Dead code check (already reached 5 wrong attempts)
  if (otp.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
    await otp.update({ consumedAt: currentTime, updatedAt: currentTime });
    throw genericError;
  }

  // 3. Expired code check
  if (new Date(otp.expiresAt).getTime() < currentTime.getTime()) {
    await otp.update({ consumedAt: currentTime, updatedAt: currentTime });
    throw genericError;
  }

  // 4. Hash comparison
  const inputHash = hashOtpCode(inputCode);
  if (inputHash !== otp.codeHash) {
    const nextAttempts = otp.attempts + 1;
    const isNowDead = nextAttempts >= OTP_CONFIG.MAX_ATTEMPTS;

    await otp.update({
      attempts: nextAttempts,
      consumedAt: isNowDead ? currentTime : null,
      updatedAt: currentTime
    });

    throw genericError;
  }

  // 5. Successful match -> Mark consumed
  await otp.update({
    consumedAt: currentTime,
    updatedAt: currentTime
  });

  return true;
};

module.exports = {
  hashOtpCode,
  generateOtp,
  verifyAndConsumeOtp
};
