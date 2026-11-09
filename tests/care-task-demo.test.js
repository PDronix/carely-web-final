const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const load = (name) => fs.readFileSync(path.join(root,name),'utf8');
const { canCompleteTask } = require('../backend/services/CarePolicy');

test('CareTask chỉ xác nhận khi đúng giờ hoặc đã đến giờ trong ngày VN', () => {
  const now = new Date('2026-10-31T21:00:00+07:00');
  assert.equal(canCompleteTask({status:'pending',due_at:new Date('2026-10-31T08:00:00+07:00')},now),true);
  assert.equal(canCompleteTask({status:'pending',due_at:new Date('2026-10-31T22:00:00+07:00')},now),false);
  assert.equal(canCompleteTask({status:'pending',due_at:new Date('2026-11-01T08:00:00+07:00')},now),false);
  assert.equal(canCompleteTask({status:'pending',due_at:new Date('2026-10-30T23:59:59+07:00')},now),false);
  assert.equal(canCompleteTask({status:'missed',due_at:new Date('2026-10-31T08:00:00+07:00')},now),false);
});
test('CareTask AJAX dùng urlencoded để middleware đọc được _csrf', () => {
  const client = load('frontend/public/js/site.js');
  const server = load('backend/middlewares/csrf.js');
  assert.match(client,/body:new URLSearchParams\(new FormData\(form\)\)/);
  assert.match(client,/application\/x-www-form-urlencoded/);
  assert.match(server,/req\.body\?\._csrf/);
  assert.match(server,/res\.status\(403\)\.json/);
});
test('Reset demo không chạy ngầm lúc start và có xác nhận phá hủy', () => {
  const pkg = JSON.parse(load('package.json'));
  assert.equal(pkg.scripts.start,'node backend/server.js');
  assert.equal(pkg.scripts.dev,'nodemon backend/server.js');
  assert.ok(pkg.scripts['demo:reset']);
  const reset = load('scripts/reset-demo.js');
  assert.match(reset,/--confirm=ERASE_LOCAL_CARELY/);
  assert.match(reset,/--backup-acknowledged/);
  assert.match(reset,/localhost/);
  assert.match(reset,/env\.nodeEnv === 'production'/);
});
test('Demo có 6 Member, 7 Facility và 21 ngày x 3 chỉ số', () => {
  const seed = load('scripts/seed-demo.js');
  const members = seed.match(/\['member(?:\d)?@carely\.local'/g) || [];
  const facilities = seed.match(/\['(?:facility(?:\d)?|pending2?)@carely\.local'/g) || [];
  assert.equal(members.length,6);
  assert.equal(facilities.length,7);
  assert.match(seed,/Array\.from\(\{length:21\}/);
  assert.match(seed,/const expectedCodes=\['blood_pressure','heart_rate','weight'\]/);
});
