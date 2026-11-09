const { rateLimit } = require('express-rate-limit');

const common = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.'
};

const authLimiter = rateLimit({ ...common, windowMs: 15 * 60 * 1000, limit: 20 });
const passwordResetLimiter = rateLimit({ ...common, windowMs: 30 * 60 * 1000, limit: 8 });

module.exports = { authLimiter, passwordResetLimiter };
