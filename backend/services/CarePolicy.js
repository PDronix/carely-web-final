const { startOfLocalDay, toDateOnlyLocal } = require('../utils/dateTime');

function canManagePendingTask(task, now = new Date()) {
  if (task?.status !== 'pending') return false;
  const due = new Date(task.due_at);
  return Number.isFinite(due.getTime()) && due > now;
}

function canCompleteTask(task, now = new Date()) {
  if (task?.status !== 'pending') return false;
  const due = new Date(task.due_at);
  return Number.isFinite(due.getTime()) && due >= startOfLocalDay(now) && due <= now;
}

function classifyFacilityVisit(appointment, now = new Date()) {
  if (appointment.status !== 'confirmed' || appointment.access_revoked_at || appointment.visitResult) return null;
  const due = appointment.confirmed_for && new Date(appointment.confirmed_for);
  if (!due || Number.isNaN(due.getTime())) return null;
  const today = toDateOnlyLocal(now);
  const scheduledDate = toDateOnlyLocal(due);
  if (scheduledDate < today) return 'overdue';
  if (scheduledDate === today) return 'today';
  return 'upcoming';
}

module.exports = { canCompleteTask, canManagePendingTask, classifyFacilityVisit };
