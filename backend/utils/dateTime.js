const AppError = require('./AppError');

const APP_OFFSET = '+07:00';

function pad(n) { return String(n).padStart(2, '0'); }

function toDateOnlyLocal(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function parseDateOnly(value, field = 'Ngày') {
  const raw = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new AppError(`${field} không hợp lệ.`, 422);
  const d = new Date(`${raw}T00:00:00${APP_OFFSET}`);
  if (Number.isNaN(d.getTime()) || toDateOnlyLocal(d)!==raw) throw new AppError(`${field} không hợp lệ.`, 422);
  return raw;
}

function parseLocalDateTime(value, { required = true, field = 'Thời gian', allowPast = true } = {}) {
  const raw = String(value || '').trim();
  if (!raw) {
    if (required) throw new AppError(`${field} không được để trống.`, 422);
    return null;
  }
  const match = /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?(Z|[+-]\d{2}:\d{2})?$/.exec(raw);
  if (!match) throw new AppError(`${field} không hợp lệ.`, 422);
  const [, dateOnly, hour, minute, second = '00', suppliedOffset] = match;
  parseDateOnly(dateOnly, field); // rejects e.g. 2026-02-30, including leap-year errors
  const offset = suppliedOffset || APP_OFFSET;
  if (offset !== 'Z') {
    const offsetMatch = /^([+-])(\d{2}):(\d{2})$/.exec(offset);
    if (!offsetMatch || Number(offsetMatch[2]) > 23 || Number(offsetMatch[3]) > 59) {
      throw new AppError(`${field} không hợp lệ.`, 422);
    }
  }
  const valueDate = new Date(`${dateOnly}T${hour}:${minute}:${second}${offset}`);
  if (Number.isNaN(valueDate.getTime())) throw new AppError(`${field} không hợp lệ.`, 422);
  if (!allowPast && valueDate.getTime() <= Date.now()) throw new AppError(`${field} phải ở thời điểm tương lai.`, 422);
  return valueDate;
}

function combineDateAndTime(dateOnly, time) {
  const date = parseDateOnly(dateOnly, 'Ngày dùng thuốc');
  const rawTime = String(time || '').trim();
  if (!/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(rawTime)) throw new AppError('Giờ dùng thuốc không hợp lệ.', 422);
  const t = rawTime.length === 5 ? `${rawTime}:00` : rawTime;
  return new Date(`${date}T${t}${APP_OFFSET}`);
}

function addDaysDateOnly(dateOnly, days) {
  const d = new Date(`${parseDateOnly(dateOnly)}T12:00:00${APP_OFFSET}`);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateOnlyLocal(d);
}

function startOfLocalDay(date = new Date()) { return new Date(`${toDateOnlyLocal(date)}T00:00:00${APP_OFFSET}`); }
function endOfLocalDay(date = new Date()) { return new Date(`${toDateOnlyLocal(date)}T23:59:59${APP_OFFSET}`); }

module.exports = { APP_OFFSET, toDateOnlyLocal, parseDateOnly, parseLocalDateTime, combineDateAndTime, addDaysDateOnly, startOfLocalDay, endOfLocalDay };
