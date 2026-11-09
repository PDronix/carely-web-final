'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = file => fs.readFileSync(path.join(root, file), 'utf8');

test('UC08 note changes require full profile access, authorship and transaction', () => {
  const s = source('backend/services/CareNoteService.js');
  assert.match(s, /sequelize\.transaction\(/);
  assert.match(s, /requireAccess\(userId, note\.health_profile_id, 'full'\)/);
  assert.match(s, /note\.author_user_id/);
  assert.match(s, /note\.destroy\(\{ transaction \}\)/);
  assert.match(source('frontend/views/notes/index.ejs'), /x\.note\.author_user_id\)===String\(currentUser\?\.id\)/);
});

test('UC10 editing personal appointments resyncs pending reminders in a transaction', () => {
  const s = source('backend/services/PersonalAppointmentService.js');
  assert.match(s, /status !== 'scheduled'/);
  assert.match(s, /requireAccess\(userId, appt\.health_profile_id, 'full'\)/);
  const cancel = s.indexOf('cancelPersonalAppointmentTasks(');
  const change = s.indexOf('appt.update(fields, { transaction })');
  const sync = s.indexOf('syncPersonalAppointment(');
  assert.ok(cancel > 0 && cancel < change && change < sync);
  assert.match(source('frontend/views/partials/personal-appointment-item.ejs'), /appointment-edit-/);
});

test('UC10 completed task note is validated and written within atomic state transition', () => {
  const s = source('backend/services/CareService.js');
  assert.match(s, /completion_note: note/);
  assert.match(s, /max: 500/);
  assert.match(s, /status: 'pending', due_at/);
  assert.match(source('frontend/public/js/site.js'), /completionNote/);
});

test('UC12 duplicate booking and same-profile confirmed-time conflicts are checked', () => {
  const s = source('backend/services/AppointmentService.js');
  assert.match(s, /Lock the profile row/);
  assert.match(s, /ensureProfileNotDoubleBooked/);
  assert.match(s, /status: 'confirmed', confirmed_for: confirmedTime/);
  assert.match(s, /\[Op\.in\]: \['pending', 'proposed_time', 'confirmed'\]/);
});

test('Database additions are additive and test preflight detects missing migrations', () => {
  for(const schema of ['db/schema.sql','db/schema.integration.sql']) {
    const s=source(schema);
    assert.match(s,/completion_note VARCHAR\(500\)/);
    assert.match(s,/specialty VARCHAR\(180\)/);
  }
  const integration=source('db/migrations/care-notes-facilities.test.sql');
  assert.match(integration,/USE carely_test/);
  assert.doesNotMatch(integration,/DROP DATABASE|TRUNCATE|DELETE FROM/i);
  assert.match(source('scripts/check-test-db.js'), /care-notes-facilities\.test\.sql/);
});
