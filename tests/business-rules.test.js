const test = require('node:test');
const assert = require('node:assert/strict');
const { parseDateOnly, parseLocalDateTime, toDateOnlyLocal } = require('../backend/utils/dateTime');
const { canCompleteTask, classifyFacilityVisit } = require('../backend/services/CarePolicy');

function refuses(fn) { assert.throws(fn, /không hợp lệ|không được/); }

test('ngày Việt Nam kiểm tra đúng lịch, kể cả năm nhuận', () => {
  assert.equal(parseDateOnly('2024-02-29'), '2024-02-29');
  refuses(() => parseDateOnly('2026-02-30'));
  refuses(() => parseDateOnly('2025-02-29'));
  refuses(() => parseDateOnly('2026-13-01'));
});
test('datetime-local không được JS Date âm thầm chuyển 30/02 thành 02/03', () => {
  refuses(() => parseLocalDateTime('2026-02-30T09:00'));
  refuses(() => parseLocalDateTime('2026-10-31T24:00'));
  refuses(() => parseLocalDateTime('2026-10-31T09:60'));
  refuses(() => parseLocalDateTime('2026-10-31T09:00:63'));
  assert.equal(parseLocalDateTime('2026-10-31T09:00').toISOString(), '2026-10-31T02:00:00.000Z');
  assert.equal(parseLocalDateTime('2026-10-31T09:00+07:00').toISOString(), '2026-10-31T02:00:00.000Z');
});
test('CareTask missed/completed/cancelled không thể hoàn thành lại', () => {
  const now = new Date('2026-10-31T15:30:00+07:00');
  const task = {status:'pending', due_at: new Date('2026-10-31T08:00:00+07:00')};
  assert.equal(canCompleteTask(task,now), true);
  assert.equal(canCompleteTask({...task,due_at:new Date('2026-10-31T16:00:00+07:00')},now), false);
  assert.equal(canCompleteTask({...task,due_at:new Date('2026-11-01T08:00:00+07:00')},now), false);
  for(const status of ['missed','completed','cancelled']) assert.equal(canCompleteTask({...task,status},now), false);
  assert.equal(canCompleteTask({...task,due_at:new Date('2026-10-30T23:59:59+07:00')},now), false);
});
test('hàng đợi kết quả khám phân loại theo ngày VN, không tính hoàn tất và revoked', () => {
  const now = new Date('2026-10-31T10:00:00+07:00');
  const base = {status:'confirmed',access_revoked_at:null,visitResult:null};
  assert.equal(classifyFacilityVisit({...base,confirmed_for:'2026-10-30T09:00:00+07:00'},now),'overdue');
  assert.equal(classifyFacilityVisit({...base,confirmed_for:'2026-10-31T17:00:00+07:00'},now),'today');
  assert.equal(classifyFacilityVisit({...base,confirmed_for:'2026-11-01T09:00:00+07:00'},now),'upcoming');
  assert.equal(classifyFacilityVisit({...base,confirmed_for:'2026-10-31T09:00:00+07:00',access_revoked_at:now},now),null);
  assert.equal(classifyFacilityVisit({...base,confirmed_for:'2026-10-31T09:00:00+07:00',visitResult:{id:1}},now),null);
  assert.equal(classifyFacilityVisit({...base,confirmed_for:'2026-10-31T09:00:00+07:00',status:'completed'},now),null);
});
test('quy đổi ngày ở Asia/Ho_Chi_Minh nhất quán', () => {
  assert.equal(toDateOnlyLocal(new Date('2026-10-30T18:00:00Z')), '2026-10-31');
});
