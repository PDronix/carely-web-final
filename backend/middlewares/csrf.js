const crypto = require('crypto');
const fs = require('fs');

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

module.exports = function csrfProtection(req, res, next) {
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  res.locals.csrfToken = req.session.csrfToken;
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const token = req.body?._csrf || req.get('x-csrf-token');
  if (!safeEqual(token, req.session.csrfToken)) {
    // Multer may already have written a private upload before multipart CSRF is verified.
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    if (req.get('accept')?.includes('application/json') || req.get('x-requested-with') === 'XMLHttpRequest') {
      return res.status(403).json({ ok: false, message: 'Phiên làm việc hoặc mã bảo mật đã hết hạn. Hãy tải lại trang và thử lại.' });
    }
    return res.status(403).render('errors/403', { title: 'Yêu cầu không hợp lệ hoặc đã hết hạn' });
  }
  next();
};
