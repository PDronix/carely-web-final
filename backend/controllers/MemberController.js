const { Op } = require('sequelize');
const { CareTask, Appointment, Facility } = require('../models');
const ProfileAccessService = require('../services/ProfileAccessService');
const NotificationService = require('../services/NotificationService');
const ReminderService = require('../services/ReminderService');
const { startOfLocalDay } = require('../utils/dateTime');

exports.dashboard = async (req, res, next) => {
  try {
    const profiles = await ProfileAccessService.listAccessibleProfiles(req.user.id);
    const profileIds = profiles.map((x) => x.profile.id);
    await ReminderService.markMissed();
    const now = new Date();
    const in7Days = new Date(Date.now() + 7 * 86400000);
    const tasks = profileIds.length ? await CareTask.findAll({ where: { health_profile_id: profileIds, due_at: { [Op.between]: [startOfLocalDay(now), in7Days] }, status: 'pending' }, order: [['due_at', 'ASC']], limit: 50 }) : [];
    const groupedTasks = new Map();
    for (const task of tasks) {
      const key = `${task.health_profile_id}|${task.task_type}|${task.title}`;
      if (!groupedTasks.has(key)) groupedTasks.set(key, { task, count: 0, personName: profiles.find(x => Number(x.profile.id) === Number(task.health_profile_id))?.person.full_name || 'Hồ sơ' });
      groupedTasks.get(key).count += 1;
    }
    const taskGroups = [...groupedTasks.values()].slice(0, 4);
    const appointments = profileIds.length ? await Appointment.findAll({ where: { health_profile_id: profileIds, status: 'confirmed', confirmed_for: { [Op.gte]: now } }, include: [{ model: Facility, as: 'facility' }], order: [['confirmed_for', 'ASC']], limit: 6 }) : [];
    const awaitingAppointments = profileIds.length ? await Appointment.findAll({ where: { health_profile_id: profileIds, status: { [Op.in]: ['pending', 'proposed_time'] } }, include: [{ model: Facility, as: 'facility' }], order: [['created_at', 'DESC']], limit: 6 }) : [];
    const since = new Date(Date.now() - 30 * 86400000);
    const complianceTasks = profileIds.length ? await CareTask.findAll({ where: { health_profile_id: profileIds, due_at: { [Op.between]: [since, now] }, status: { [Op.ne]: 'cancelled' } }, attributes: ['status'] }) : [];
    const completed = complianceTasks.filter((task) => task.status === 'completed').length;
    const compliance = { total: complianceTasks.length, completed, percentage: complianceTasks.length ? Math.round((completed / complianceTasks.length) * 100) : null };
    const notifications = await NotificationService.forProfiles(profileIds);
    res.render('member/dashboard', { title: 'Tổng quan', profiles, tasks, taskGroups, appointments, awaitingAppointments, compliance, notifications });
  } catch (e) { next(e); }
};
