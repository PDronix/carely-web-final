function notFound(req, res) { res.status(404).render('errors/404', { title: 'Không tìm thấy trang' }); }
function normalizeError(err) {
  if (err.name === 'MulterError') return { status: 400, message: err.code === 'LIMIT_FILE_SIZE' ? 'File tải lên vượt quá dung lượng cho phép.' : 'File tải lên không hợp lệ.' };
  if (err.name === 'SequelizeValidationError') return { status: 422, message: 'Một số dữ liệu chưa đúng định dạng. Vui lòng kiểm tra lại.' };
  if (err.name === 'SequelizeUniqueConstraintError') return { status: 409, message: 'Thông tin này đã tồn tại trong hệ thống.' };
  if (err.name === 'SequelizeForeignKeyConstraintError') return { status: 409, message: 'Không thể thực hiện vì dữ liệu đang được sử dụng ở phần khác.' };
  if (err.name === 'SequelizeDatabaseError') {
    const code = err.parent?.code || err.original?.code;
    if (['ER_TRUNCATED_WRONG_VALUE','ER_TRUNCATED_WRONG_VALUE_FOR_FIELD','ER_DATA_TOO_LONG','ER_WARN_DATA_OUT_OF_RANGE','WARN_DATA_TRUNCATED'].includes(code)) return { status: 422, message: 'Dữ liệu nhập vào chưa đúng định dạng. Vui lòng kiểm tra lại.' };
    return { status: 500, message: 'Hệ thống chưa thể xử lý yêu cầu này. Vui lòng thử lại.' };
  }
  return { status: err.statusCode || 500, message: err.message || 'Không thể thực hiện yêu cầu.' };
}
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (process.env.NODE_ENV !== 'production') console.error(err);
  const normalized = normalizeError(err); const statusCode = normalized.status;
  if (req.get('accept')?.includes('application/json') || req.get('x-requested-with') === 'XMLHttpRequest') {
    return res.status(statusCode).json({ ok: false, message: statusCode >= 500 ? 'Hệ thống chưa thể xử lý yêu cầu này.' : normalized.message });
  }
  if (req.method !== 'GET' && statusCode < 500 && req.session) {
    const referer = req.get('referer');
    const safeDestinations = [
      [/^\/facilities\/\d+\/appointments\/?$/, '/facilities'],
      [/^\/appointments\/\d+\/?$/, '/appointments'],
      [/^\/facility\/appointments\/\d+\/result\/?$/, '/facility/results'],
      [/^\/facility\/appointments\/\d+\/?$/, '/facility/appointments']
    ];
    const matched = safeDestinations.find(([pattern]) => pattern.test(req.path));
    // For appointment actions, never return to /auth or the public landing
    let safePath = matched ? matched[1] : '/';
    if (referer) {
      try {
        const origin = `${req.protocol}://${req.get('host')}`;
        const url = new URL(referer, origin);
        if (url.origin === origin && url.pathname.startsWith('/') && !url.pathname.startsWith('//') &&
            (!matched || url.pathname === matched[1])) {
          safePath = url.pathname + url.search;
        }
      } catch (_) { /* Invalid Referer: use safe fallback */ }
    }
    req.session.flash = { type: 'warning', message: normalized.message };
    // Wait for MySQL session persistence before redirecting. Otherwise the next
    // request may consume an older session without the flash message.
    if (typeof req.session.save !== 'function') return res.redirect(303, safePath);
    return req.session.save((saveError) => {
      if (saveError) return next(saveError);
      return res.redirect(303, safePath);
    });
  }
  return res.status(statusCode).render(statusCode === 403 ? 'errors/403' : statusCode === 404 ? 'errors/404' : 'errors/500', { title: normalized.message, error: process.env.NODE_ENV === 'development' && statusCode >= 500 ? err : null });
}
module.exports = { notFound, errorHandler };
