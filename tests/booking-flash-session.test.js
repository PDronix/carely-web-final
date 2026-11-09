const test = require('node:test');
const assert = require('node:assert/strict');
const AppError = require('../backend/utils/AppError');
const { errorHandler } = require('../backend/middlewares/errorHandler');

const conflict = () => new AppError('Hồ sơ này đã có yêu cầu tại cơ sở và thời gian đã chọn.', 409);

function scenario({ failSave = false, accept = 'text/html' } = {}) {
  const result = { saved: false, redirected: false, savedFlash: null, error: null, status: null };
  const session = {
    userId: 12,
    authVersion: 1,
    save(callback) {
      // Deliberately async, like a real DB-backed session store.
      setImmediate(() => {
        if (failSave) return callback(new Error('Session store temporarily unavailable'));
        result.saved = true;
        result.savedFlash = { ...this.flash };
        callback(null);
      });
    }
  };
  const req = {
    method: 'POST', path: '/facilities/7/appointments', session, protocol: 'http',
    get(name) { return { accept, host: 'localhost:5000' }[String(name).toLowerCase()]; }
  };
  let resolve;
  const complete = new Promise(r => { resolve = r; });
  const res = {
    status(status) { result.status = status; return this; },
    redirect(status, location) {
      result.status = status;
      result.location = location;
      result.redirected = true;
      resolve();
      return this;
    },
    json(body) { result.body = body; resolve(); return this; }
  };
  const originalError = console.error;
  try {
    console.error = () => {}; // 409 is intentionally generated here.
    errorHandler(conflict(), req, res, (error) => { result.error = error; resolve(); });
  } finally {
    console.error = originalError;
  }
  return { result, session, complete };
}

test('UC12 flash is persisted before HTML redirect; session identity is unchanged', async () => {
  const { result, session, complete } = scenario();
  assert.equal(result.redirected, false, 'redirect must not happen before async save');
  await complete;
  assert.equal(result.saved, true);
  assert.equal(result.status, 303);
  assert.equal(result.location, '/facilities');
  assert.match(result.savedFlash.message, /đã có yêu cầu/);
  assert.equal(session.userId, 12);
  assert.equal(session.authVersion, 1);
});

test('UC12 session storage error is not disguised as successful redirect', async () => {
  const { result, complete } = scenario({ failSave: true });
  await complete;
  assert.equal(result.redirected, false);
  assert.match(result.error?.message || '', /Session store/);
});

test('UC12 JSON duplicate keeps HTTP 409 and does not write flash', async () => {
  const { result, complete } = scenario({ accept: 'application/json' });
  await complete;
  assert.equal(result.status, 409);
  assert.equal(result.saved, false);
  assert.equal(result.body.ok, false);
});
