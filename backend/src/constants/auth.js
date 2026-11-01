'use strict';

const OTP_PURPOSES = Object.freeze({
  VERIFY_EMAIL: 'verify_email',
  RESET_PASSWORD: 'reset_password'
});

const OTP_CONFIG = Object.freeze({
  LENGTH: 6,
  EXPIRY_MINUTES: 10,
  MAX_ATTEMPTS: 5,
  COOLDOWN_SECONDS: 60
});

module.exports = {
  OTP_PURPOSES,
  OTP_CONFIG
};
