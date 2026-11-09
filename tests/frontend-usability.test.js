const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.resolve(__dirname, '..', name), 'utf8');

test('all app screens use the unified CSS bundle without legacy stylesheets', () => {
  const head = read('frontend/views/partials/head.ejs');
  assert.match(head, /href="\/css\/carely\.css"/);
  assert.doesNotMatch(head, /href="\/css\/(?:app|v4|v41)\.css"/);
  const css = read('frontend/public/css/carely.css');
  assert.match(css, /--canvas:\s*#[0-9a-f]{6}/i);
  assert.match(css, /\.care-planner-grid\s*\{/);
  assert.equal(fs.existsSync(path.resolve(__dirname, '../frontend/public/css/legacy')), false);
});

test('sidebar stays compact on desktop while providing low-height and mobile fallbacks', () => {
  const css = read('frontend/public/css/carely.css');
  assert.match(css, /--care-sidebar-item-height:\s*41px/);
  assert.match(css, /@media \(min-width: 981px\) and \(max-height: 640px\)/);
  assert.match(css, /@media \(max-width: 980px\)/);
  assert.match(css, /\.sidebar-foot \{ flex: 0 0 auto/);
  const view = read('frontend/views/partials/app-start.ejs');
  assert.ok(view.indexOf('class="sidebar-foot"') > view.indexOf('class="sidebar-links"'));
  assert.equal((view.match(/class="nav-item /g) || []).length, 14);
});

test('personal appointments & general reminders are grouped, editable only with permissions', () => {
  const view = read('frontend/views/care/index.ejs');
  assert.match(view, /class="care-planner"/);
  assert.match(view, /class="care-planner-grid"/);
  assert.match(view, /personalAppointments\.slice\(0,3\)/);
  assert.match(view, /personalAppointments\.slice\(3\)/);
  assert.match(view, /<details class="care-create-panel"/);
  assert.match(view, /selected\?\.capabilities\.canManagePersonalAppointment/);
  assert.match(view, /selected\?\.capabilities\.canCompleteCareTask/);
  assert.match(view, /action="\/care\/personal-appointments"/);
  assert.match(view, /action="\/care\/tasks"/);
  assert.match(view, /name="scheduledAt" required/);
  assert.match(view, /name="dueAt" required/);
  assert.match(view, /name="_csrf"/);
});

test('responsive care forms and interaction affordances are keyboard usable', () => {
  const css = read('frontend/public/css/carely.css');
  assert.match(css, /\.care-form-row\s*\{\s*display:grid/);
  assert.match(css, /@media\(max-width: 680px\)/);
  assert.match(css, /\.care-create-trigger:focus-visible/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css, /\.care-planner-grid \{ display: grid/);
});
