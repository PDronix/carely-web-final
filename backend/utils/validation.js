const AppError = require('./AppError');

function text(value, { field = 'Dữ liệu', required = false, max = null } = {}) {
  const clean = String(value ?? '').trim();
  if (required && !clean) throw new AppError(`${field} không được để trống.`, 422);
  if (max && clean.length > max) throw new AppError(`${field} không được vượt quá ${max} ký tự.`, 422);
  return clean || null;
}

function oneOf(value, allowed, { field = 'Giá trị', fallback = null } = {}) {
  const clean = String(value ?? '').trim();
  if (!clean && fallback !== null) return fallback;
  if (!allowed.includes(clean)) throw new AppError(`${field} không hợp lệ.`, 422);
  return clean;
}

function email(value) {
  const clean = String(value ?? '').trim().toLowerCase();
  if (!clean || clean.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    throw new AppError('Email không hợp lệ.', 422);
  }
  return clean;
}

module.exports = { text, oneOf, email };
