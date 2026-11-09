const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const AppError = require('../backend/utils/AppError');
const { errorHandler } = require('../backend/middlewares/errorHandler');
const root = path.join(__dirname, '..');
const source = file => fs.readFileSync(path.join(root, file), 'utf8');

async function trigger(pathname, referer) {
  const result = {};
  const session = { userId: 1, authVersion: 1, save(callback) { setImmediate(() => callback(null)); } };
  const req = { method: 'POST', path: pathname, protocol: 'http', session,
    get(name) { return { host: 'localhost:5000', accept: 'text/html', referer }[String(name).toLowerCase()]; } };
  const response = new Promise(resolve => {
    const res = { redirect(status, location) { result.status = status; result.location = location; resolve(); return this; } };
    const original = console.error;
    try {
      console.error = () => {};
      errorHandler(new AppError('Không thể thực hiện thay đổi trạng thái.', 409), req, res, error => {
        result.error = error; resolve();
      });
    } finally { console.error = original; }
  });
  await response;
  return { result, session };
}

test('UC13 member action errors without Referer remain within /appointments', async () => {
  const { result, session } = await trigger('/appointments/17');
  assert.equal(result.status, 303);
  assert.equal(result.location, '/appointments');
  assert.equal(session.userId, 1);
  assert.match(session.flash.message, /Không thể thực hiện/);
});

test('UC13 Facility action errors without Referer remain within Facility appointments', async () => {
  const { result } = await trigger('/facility/appointments/17');
  assert.equal(result.location, '/facility/appointments');
});

test('UC13 errors ignore unrelated same-origin and external Referer', async () => {
  assert.equal((await trigger('/appointments/17', 'http://localhost:5000/auth')).result.location, '/appointments');
  assert.equal((await trigger('/facility/appointments/17', 'https://example.org/path')).result.location, '/facility/appointments');
});

test('UC13 errors preserve same-origin status filter on Facility appointments', async () => {
  assert.equal((await trigger('/facility/appointments/17', 'http://localhost:5000/facility/appointments?status=confirmed')).result.location,
    '/facility/appointments?status=confirmed');
});

test('UC13 shows confirmed appointment time and original request separately in Facility UI', () => {
  const html = source('frontend/views/facility/appointments.ejs');
  assert.match(html, /Thời gian đã xác nhận/);
  assert.match(html, /Yêu cầu ban đầu:/);
  assert.match(html, /new Date\(a\.confirmed_for\)/);
});

test('UC13 displays Facility response notes escaped in Member and Facility templates', () => {
  for (const file of ['frontend/views/appointments/index.ejs', 'frontend/views/facility/appointments.ejs']) {
    const html = source(file);
    assert.match(html, /<%= a\.facility_response_note %>/);
    assert.match(html, /ui-appointments-facility-feedback/);
    assert.doesNotMatch(html, /<%- a\.facility_response_note %>/);
  }
});

test('UC13 completed appointment is described as ended access, not never-granted access', () => {
  const html = source('frontend/views/appointments/index.ejs');
  assert.match(html, /Lịch đã hoàn thành; quyền truy cập theo lịch hẹn đã kết thúc/);
});
