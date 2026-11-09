'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const { isActiveFamilyManager } = require('../backend/services/ProfilePolicy');
const { canManagePendingTask, canCompleteTask } = require('../backend/services/CarePolicy');

test('dependent manager access requires active same-family member', () => {
  const dependent = { person_type: 'dependent', family_id: 8, manager_user_id: 42 };
  const manager = { person_type: 'member', status: 'active', family_id: 8, user_id: 42 };
  assert.equal(isActiveFamilyManager(dependent, manager, 42), true);
  assert.equal(isActiveFamilyManager(dependent, { ...manager, family_id: 9 }, 42), false);
  assert.equal(isActiveFamilyManager(dependent, { ...manager, status: 'inactive' }, 42), false);
  assert.equal(isActiveFamilyManager(dependent, manager, 43), false);
  assert.equal(isActiveFamilyManager({ ...dependent, family_id: null }, manager, 42), false);
  assert.match(source('backend/services/ProfileAccessService.js'), /isActiveFamilyManager\(person, activeMember, userId\)/);
});

test('future general tasks may be edited; once due they can be completed but not rescheduled', () => {
  const now = new Date('2026-11-03T12:00:00+07:00');
  const future = { status: 'pending', due_at: '2026-11-03T13:00:00+07:00' };
  const due = { status: 'pending', due_at: '2026-11-03T11:30:00+07:00' };
  assert.equal(canManagePendingTask(future, now), true);
  assert.equal(canCompleteTask(future, now), false);
  assert.equal(canManagePendingTask(due, now), false);
  assert.equal(canCompleteTask(due, now), true);
  assert.equal(canCompleteTask({ ...due, status: 'missed' }, now), false);
  assert.equal(canCompleteTask({ ...due, due_at: '2026-11-02T11:30:00+07:00' }, now), false);
});

test('care history is paginated by SQL and not silently truncated to last 30 days', () => {
  const controller = source('backend/controllers/CareController.js');
  assert.match(controller, /CareTask\.count\(\{ where \}\)/);
  assert.match(controller, /limit: pageSize, offset: \(page - 1\) \* pageSize/);
  assert.doesNotMatch(controller, /limit: 200/);
  assert.match(source('frontend/views/care/index.ejs'), /aria-label="Phân trang việc chăm sóc"/);
});

test('member and facility cannot cancel a confirmed appointment after its scheduled time', () => {
  const service = source('backend/services/AppointmentService.js');
  assert.match(service, /appt\.status === 'confirmed' && \(!appt\.confirmed_for \|\| new Date\(appt\.confirmed_for\) <= now\)/);
  assert.match(source('frontend/views/appointments/index.ejs'), /new Date\(a\.confirmed_for\) > new Date\(\)/);
});

test('dynamic chart tooltip content is encoded rather than injected into attributes', () => {
  const js = source('frontend/public/js/site.js');
  const start = js.indexOf('function escapeAttribute(value)');
  const end = js.indexOf('function renderMultiChart(svg)', start);
  assert.ok(start >= 0 && end > start);
  const escapeAttribute = vm.runInNewContext(`${js.slice(start,end)};escapeAttribute;`);
  assert.equal(escapeAttribute('" onmouseover="alert(1)'), '&quot; onmouseover=&quot;alert(1)');
  assert.equal(escapeAttribute('<svg> &'), '&lt;svg&gt; &amp;');
  assert.match(js, /data-tip="\$\{escapeAttribute\(s\.name\)\}/);
  assert.doesNotMatch(js, /<span class="legend-dot"><\/span>\$\{s\.name\}/);
});

test('carousel is keyboard focus-aware and can be paused; dashboard fake checkbox removed', () => {
  const js = source('frontend/public/js/site.js');
  const landing = source('frontend/views/landing.ejs');
  assert.match(js, /carousel\.addEventListener\('focusin', stop\)/);
  assert.match(js, /data-carousel-pause/);
  assert.match(landing, /aria-label="Tạm dừng chuyển cảnh"/);
  assert.doesNotMatch(source('frontend/views/member/dashboard.ejs'), /<span class="check-btn"><\/span>/);
});

test('CSRF is not read from URL query string', () => {
  const csrf = require('../backend/middlewares/csrf');
  const session = { csrfToken: 's'.repeat(64) };
  const req = { session, method:'POST', body:{}, query:{_csrf: session.csrfToken}, file:null,
    get:(key)=> key==='accept' ? 'application/json' : undefined };
  let status;
  const res = { locals:{}, status(code){status=code; return this;}, json(data){this.payload=data; return this;} };
  csrf(req, res, ()=>{throw new Error('CSRF query token must not pass');});
  assert.equal(status,403);
  assert.equal(res.payload.ok,false);
});
