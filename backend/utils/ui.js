const appointmentStatus = {
  pending: 'Chờ xác nhận', proposed_time: 'Đề xuất giờ khác', confirmed: 'Đã xác nhận',
  completed: 'Hoàn thành', rejected: 'Đã từ chối', cancelled: 'Đã hủy'
};
const genericStatus = { active: 'Hoạt động', inactive: 'Ngừng hoạt động', locked: 'Đã khóa',
  approved: 'Đã duyệt', rejected: 'Đã từ chối', pending: 'Chờ duyệt', scheduled: 'Đã lên lịch',
  completed: 'Hoàn thành', missed: 'Đã bỏ lỡ', cancelled: 'Đã hủy', draft: 'Chờ xác nhận', none: 'Không bật nhắc',
  view: 'Chỉ xem', full: 'Toàn quyền' };
const taskType = { medication: 'Thuốc', appointment: 'Lịch khám', general: 'Chăm sóc', other: 'Chăm sóc' };
const taskStatus = { pending: 'Chờ thực hiện', completed: 'Hoàn thành', missed: 'Đã bỏ lỡ', cancelled: 'Đã hủy' };
const { toDateOnlyLocal } = require('./dateTime');
const { canCompleteTask, canManagePendingTask } = require('../services/CarePolicy');
module.exports = {
  localDay: (value) => toDateOnlyLocal(new Date(value)),
  canCompleteTask,
  canManagePendingTask,
  appointmentStatus: (v) => appointmentStatus[v] || v || '—',
  status: (v) => genericStatus[v] || v || '—',
  access: (v) => genericStatus[v] || v || '—',
  taskType: (v) => taskType[v] || 'Chăm sóc',
  taskStatus: (v) => taskStatus[v] || v || '—'
};
