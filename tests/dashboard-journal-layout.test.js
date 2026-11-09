const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = name => fs.readFileSync(path.resolve(__dirname, '..', name), 'utf8');
const { canCompleteTask, canManagePendingTask } = require('../backend/services/CarePolicy');

test('metrics page displays seven most recent entries without truncating chart history', () => {
  const html = source('frontend/views/metrics/index.ejs');
  assert.match(html, /history\.slice\(0,7\)\.forEach/);
  assert.match(html, /Math\.min\(history\.length, 7\)/);
  assert.match(source('backend/controllers/MetricController.js'), /history\.slice\(\)\.reverse\(\)/);
});

test('pending due-today task shows a complete form while future task remains disabled', () => {
  const now = new Date('2026-11-03T12:00:00+07:00');
  const due = { status: 'pending', due_at: '2026-11-03T11:30:00+07:00' };
  const future = { status: 'pending', due_at: '2026-11-03T13:00:00+07:00' };
  assert.equal(canCompleteTask(due, now), true);
  assert.equal(canManagePendingTask(due, now), false);
  assert.equal(canCompleteTask(future, now), false);
  assert.equal(canManagePendingTask(future, now), true);
  assert.equal(canCompleteTask({ ...due, due_at: '2026-11-02T12:00:00+07:00' }, now), false);
  const view = source('frontend/views/care/index.ejs');
  assert.match(view, /\(ui\.canManagePendingTask\(t\) \|\| ui\.canCompleteTask\(t\)\)/);
  assert.match(view, /scheduledFuture\?'disabled'/);
});

test('sidebar keeps account outside the navigation and has a safe low-height scroll fallback', () => {
  const view = source('frontend/views/partials/app-start.ejs');
  assert.match(view, /class="sidebar-links"/);
  const idxNavEnd = view.indexOf('</div>\n<div class="sidebar-foot">');
  assert.ok(idxNavEnd > view.indexOf('class="sidebar-links"'));
  assert.match(source('frontend/public/css/carely.css'), /\.sidebar-links \{ flex: 1 1 auto; min-height: 0; overflow: visible/);
  assert.match(source('frontend/public/css/carely.css'), /max-height: 640px/);
});

test('journal uses a responsive timeline and preserves escaped note output', () => {
  const view = source('frontend/views/notes/index.ejs');
  assert.match(view, /class="journal-timeline"/);
  assert.match(view, /<%= x\.note\.content %>/);
  assert.match(source('frontend/public/css/carely.css'), /\.care-journal \.journal-entry/);
});
