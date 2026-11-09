const test = require('node:test');
const assert = require('node:assert/strict');
const AppError = require('../backend/utils/AppError');
const { errorHandler } = require('../backend/middlewares/errorHandler');

function exercise({ accept = 'text/html', referer = undefined } = {}) {
  const session = { userId: 12, authVersion: 1 };
  const req = {
    method: 'POST',
    path: '/facilities/7/appointments',
    protocol: 'http',
    session,
    get(name) {
      const key = String(name).toLowerCase();
      return { accept, host: 'localhost:5000', referer }[key];
    }
  };
  const result = {};
  const res = {
    status(status) { result.status = status; return this; },
    redirect(status, path) { result.status = status; result.location = path; return this; },
    json(body) { result.body = body; return this; }
  };
  const originalError = console.error;
  try {
    console.error = () => {}; // Expected test conflict, not a server fault.
    errorHandler(new AppError('Hồ sơ này đã có yêu cầu tại cơ sở và thời gian đã chọn.', 409), req, res);
  } finally { console.error = originalError; }
  return { result, session };
}

test('booking duplicate without Referer returns to Facility directory and preserves session', () => {
  const { result, session } = exercise();
  assert.equal(result.status, 303);
  assert.equal(result.location, '/facilities');
  assert.equal(session.userId, 12);
  assert.equal(session.authVersion, 1);
  assert.match(session.flash.message, /đã có yêu cầu/);
});

test('booking duplicate preserves safe same-origin Facility search filter', () => {
  const { result } = exercise({ referer: 'http://localhost:5000/facilities?q=tim' });
  assert.equal(result.location, '/facilities?q=tim');
});

test('booking duplicate ignores unrelated or external Referer', () => {
  assert.equal(exercise({ referer: 'http://localhost:5000/auth' }).result.location, '/facilities');
  assert.equal(exercise({ referer: 'https://example.com/malicious' }).result.location, '/facilities');
});

test('booking duplicate JSON callers receive 409 without redirect', () => {
  const { result, session } = exercise({ accept: 'application/json' });
  assert.equal(result.status, 409);
  assert.equal(result.location, undefined);
  assert.equal(result.body.ok, false);
  assert.equal(session.userId, 12);
});
