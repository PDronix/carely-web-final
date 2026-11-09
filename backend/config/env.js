const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

function int(name, fallback) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) ? n : fallback;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const sessionSecret = process.env.SESSION_SECRET || 'development-only-change-me-please-32-characters';
if (nodeEnv === 'production' && (!process.env.SESSION_SECRET || sessionSecret.length < 32)) {
  throw new Error('Production requires SESSION_SECRET with at least 32 characters.');
}

module.exports = {
  nodeEnv,
  port: int('PORT', 5000),
  appUrl: process.env.APP_URL || `http://localhost:${int('PORT', 5000)}`,
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: int('DB_PORT', 3306),
    name: process.env.DB_NAME || 'carely',
    user: process.env.DB_USER || 'root',
    pass: process.env.DB_PASS || ''
  },
  sessionSecret,
  sessionCookieName: process.env.SESSION_COOKIE_NAME || 'carely.sid',
  rememberMeDays: int('REMEMBER_ME_DAYS', 7),
  passwordResetMinutes: int('PASSWORD_RESET_MINUTES', 30),
  mailMode: process.env.MAIL_MODE || 'console',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: int('SMTP_PORT', 587),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'Carely <no-reply@carely.local>'
  },
  termsVersion: process.env.TERMS_VERSION || '1.0',
  privacyVersion: process.env.PRIVACY_VERSION || '1.0',
  healthConsentVersion: process.env.HEALTH_CONSENT_VERSION || '1.0',
  uploadMaxMb: int('UPLOAD_MAX_MB', 10)
};
