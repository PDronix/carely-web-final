const { Op } = require('sequelize');
const { CareTask } = require('../models');
const ProfileAccessService = require('./ProfileAccessService');
const AppError = require('../utils/AppError');
const ReminderService = require('./ReminderService');
const { startOfLocalDay } = require('../utils/dateTime');
const { canCompleteTask, canManagePendingTask } = require('./CarePolicy');

class CareService {
  static async listTasks(userId, profileId, from, to) {
    await ProfileAccessService.requireAccess(userId, profileId, 'view');
    await ReminderService.markMissed();
    const where = { health_profile_id: profileId };
    if (from || to) {
      where.due_at = {};
      if (from) where.due_at[Op.gte] = new Date(from);
      if (to) where.due_at[Op.lte] = new Date(to);
    }
    return CareTask.findAll({ where, order: [['due_at', 'ASC']] });
  }
  static async completeTask(userId, taskId, completionNote = null) {
    const validation = require('../utils/validation');
    const note = validation.text(completionNote, { field: 'Ghi chú hoàn thành', max: 500 });
    const task = await CareTask.findByPk(taskId);
    if (!task) throw new AppError('Không tìm thấy việc chăm sóc.', 404);
    await ProfileAccessService.requireAccess(userId, task.health_profile_id, 'full');
    const now = new Date();
    if (task.status === 'pending' && new Date(task.due_at) > now) {
      throw new AppError('Chưa đến thời gian thực hiện công việc chăm sóc này.', 409);
    }
    if (!canCompleteTask(task, now)) throw new AppError('Việc đã bỏ lỡ, đã hủy hoặc đã hoàn thành không thể xác nhận lại.', 409);
    // Atomic conditional update checks both the lower local-day boundary and
    const [updated] = await CareTask.update({ status: 'completed', completed_at: now, completed_by_user_id: userId, completion_note: note }, {
      where: { id: task.id, status: 'pending', due_at: { [Op.between]: [startOfLocalDay(now), now] } }
    });
    if (updated !== 1) throw new AppError('Trạng thái việc chăm sóc đã thay đổi. Hãy tải lại trang.', 409);
    return CareTask.findByPk(task.id);
  }
  static async updateGeneralTask(userId, taskId, { title, description, dueAt }) {
    const { sequelize } = require('../models');
    const validation = require('../utils/validation');
    const { parseLocalDateTime } = require('../utils/dateTime');
    return sequelize.transaction(async transaction => {
      const task = await CareTask.findByPk(taskId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!task) throw new AppError('Không tìm thấy việc chăm sóc.', 404);
      await ProfileAccessService.requireAccess(userId, task.health_profile_id, 'full');
      if (task.task_type !== 'general' || task.status !== 'pending' || !canManagePendingTask(task)) {
        throw new AppError('Chỉ có thể sửa nhắc chăm sóc tự tạo chưa đến giờ thực hiện.', 409);
      }
      task.title = validation.text(title, { field: 'Tên việc', required: true, max: 180 });
      task.description = validation.text(description, { field: 'Ghi chú', max: 500 });
      task.due_at = parseLocalDateTime(dueAt, { field: 'Thời gian nhắc', allowPast: false });
      await task.save({ transaction });
      return task;
    });
  }
  static async cancelGeneralTask(userId, taskId) {
    const { sequelize } = require('../models');
    return sequelize.transaction(async transaction => {
      const task = await CareTask.findByPk(taskId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!task) throw new AppError('Không tìm thấy việc chăm sóc.', 404);
      await ProfileAccessService.requireAccess(userId, task.health_profile_id, 'full');
      if (task.task_type !== 'general' || task.status !== 'pending' || !canManagePendingTask(task)) {
        throw new AppError('Chỉ có thể hủy nhắc chăm sóc tự tạo chưa đến giờ thực hiện.', 409);
      }
      task.status = 'cancelled';
      await task.save({ transaction });
      return task;
    });
  }
  static async compliance(userId, profileId, from, to) {
    await ProfileAccessService.requireAccess(userId, profileId, 'view');
    await ReminderService.markMissed();
    const now = new Date();
    const where={ health_profile_id:profileId, status:{[Op.ne]:'cancelled'}, due_at:{[Op.lte]:now} };
    if(from) where.due_at[Op.gte]=new Date(from);
    if(to && new Date(to)<now) where.due_at[Op.lte]=new Date(to);
    const tasks=await CareTask.findAll({where}); const total=tasks.length; const completed=tasks.filter(x=>x.status==='completed').length;
    return {total,completed,percentage:total?Math.round(completed/total*100):null};
  }
  static async generateForDate(){ return ReminderService.maintainRollingWindow(7); }
}
module.exports=CareService;
