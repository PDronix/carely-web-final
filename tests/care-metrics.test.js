const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { canCompleteTask, canManagePendingTask } = require('../backend/services/CarePolicy');
const { SUPPORTED_METRIC_CODES, isSupportedMetricCode } = require('../backend/config/healthMetrics');
const root = path.resolve(__dirname, '..');
const source = file => fs.readFileSync(path.join(root, file), 'utf8');

test('future pending tasks are editable but cannot be marked completed', () => {
  const now = new Date('2026-10-31T10:00:00+07:00');
  const futureToday = { status: 'pending', due_at: '2026-10-31T11:00:00+07:00' };
  const tomorrow = { status: 'pending', due_at: '2026-11-01T11:00:00+07:00' };
  assert.equal(canManagePendingTask(futureToday, now), true);
  assert.equal(canCompleteTask(futureToday, now), false);
  assert.equal(canManagePendingTask(tomorrow, now), true);
  assert.equal(canCompleteTask(tomorrow, now), false);
  assert.equal(canCompleteTask({ ...futureToday, due_at: now }, now), true);
  assert.equal(canCompleteTask({ ...futureToday, due_at: '2026-10-31T09:00:00+07:00' }, now), true);
  assert.equal(canCompleteTask({ ...futureToday, due_at: '2026-10-30T23:59:00+07:00' }, now), false);
  assert.equal(canCompleteTask({ ...futureToday, status: 'missed' }, now), false);
});

test('database completion is atomic and cannot bypass due time', () => {
  const content = source('backend/services/CareService.js');
  assert.match(content, /\[Op\.between\]: \[startOfLocalDay\(now\), now\]/);
  assert.match(content, /Chưa đến thời gian thực hiện/);
  assert.match(content, /canManagePendingTask/);
});

test('UI exposes disabled future complete button and auto checks due time', () => {
  const view = source('frontend/views/care/index.ejs');
  const js = source('frontend/public/js/site.js');
  assert.match(view, /scheduledFuture\?'disabled'/);
  assert.match(view, /data-care-due=/);
  assert.match(js, /refreshCareTaskEligibility/);
  assert.match(js, /button\.disabled = !eligible/);
});

test('catalog has only blood pressure, heart rate, weight', () => {
  assert.deepEqual(SUPPORTED_METRIC_CODES, ['blood_pressure', 'heart_rate', 'weight']);
  assert.equal(isSupportedMetricCode('body_temperature'), false);
  assert.doesNotMatch(source('scripts/seed.js'), /body_temperature/);
  assert.doesNotMatch(source('scripts/seed-demo.js'), /body_temperature/);
  assert.match(source('backend/services/MetricService.js'), /SUPPORTED_METRIC_CODES/);
});

test('verify demo counts updated: 378 records / 504 component values', () => {
  const verify = source('scripts/verify-demo.js');
  assert.match(verify, /records\.length===378/);
  assert.match(verify, /values===504/);
});
