const { Op } = require('sequelize');
const { sequelize, PersonalAppointment, CareTask } = require('../models');
const ProfileAccessService = require('../services/ProfileAccessService');
const CareService = require('../services/CareService');
const ReminderService = require('../services/ReminderService');
const AppError = require('../utils/AppError');
const { parseLocalDateTime, startOfLocalDay } = require('../utils/dateTime');
const validation = require('../utils/validation');
const { PersonalAppointmentService } = require('../services/PersonalAppointmentService');

exports.index = async (req, res, next) => {
  try {
    const profiles = await ProfileAccessService.listAccessibleProfiles(req.user.id);
    const profileId = req.query.profileId || profiles[0]?.profile?.id;
    const selected = profiles.find((x) => Number(x.profile.id) === Number(profileId)) || null;
    let tasks = [];
    let compliance = { total: 0, completed: 0, percentage: null };
    let personalAppointments = [];
    let taskTotal = 0; let page = 1; let totalPages = 1;
    const allowedViews = ['upcoming', 'missed', 'completed', 'all'];
    const view = allowedViews.includes(String(req.query.view)) ? String(req.query.view) : 'upcoming';
    if (selected) {
      const now = new Date();
      const start = new Date(now.getTime() - 30 * 86400000);
      await ReminderService.markMissed();
      const where = { health_profile_id: selected.profile.id };
      if (view === 'upcoming') {
        where.status = 'pending';
        where.due_at = { [Op.between]: [startOfLocalDay(now), new Date(now.getTime() + 7 * 86400000)] };
      } else if (view !== 'all') {
        where.status = view;
      }
      const pageSize = 30;
      const requestedPage = Number(req.query.page);
      taskTotal = await CareTask.count({ where });
      totalPages = Math.max(1, Math.ceil(taskTotal / pageSize));
      page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, totalPages) : 1;
      tasks = await CareTask.findAll({ where,
        order: [['due_at', view === 'upcoming' ? 'ASC' : 'DESC'], ['id', 'DESC']],
        limit: pageSize, offset: (page - 1) * pageSize
      });
      compliance = await CareService.compliance(req.user.id, selected.profile.id, start, now);
      personalAppointments = await PersonalAppointment.findAll({
        where: { health_profile_id: selected.profile.id },
        order: [['scheduled_at', 'DESC']], limit: 12
      });
    }
    res.render('care/index', { title: 'Lịch chăm sóc và tuân thủ', profiles, selected, profileId: selected?.profile.id || null, tasks, compliance, personalAppointments, view, taskTotal, page, totalPages });
  } catch (error) { next(error); }
};

exports.completeTask = async (req, res, next) => {
  const wantsJson = req.get('accept')?.includes('application/json') || req.get('x-requested-with') === 'XMLHttpRequest';
  try {
    const task = await CareService.completeTask(req.user.id, req.params.id, req.body.completionNote);
    if (wantsJson) return res.json({ ok: true, task: { id: task.id, status: task.status, completedAt: task.completed_at, completionNote: task.completion_note } });
    req.session.flash = { type: 'success', message: 'Đã xác nhận hoàn thành.' };
    return res.redirect(`/care?profileId=${task.health_profile_id}`);
  } catch (error) {
    if (wantsJson) {
      const status = error.statusCode || 500;
      return res.status(status).json({ ok: false, message: status >= 500 ? 'Hệ thống chưa thể xử lý yêu cầu này.' : error.message });
    }
    return next(error);
  }
};

exports.createPersonalAppointment = async (req, res, next) => {
  try {
    const profileId = req.body.profileId;
    await ProfileAccessService.requireAccess(req.user.id, profileId, 'full');
    const title = validation.text(req.body.title, { field: 'Tiêu đề lịch khám', required: true, max: 180 });
    const scheduledAt = parseLocalDateTime(req.body.scheduledAt, { field: 'Thời gian khám', allowPast: false });
    const reminderAt = parseLocalDateTime(req.body.reminderAt, { required: false, field: 'Thời gian nhắc', allowPast: false });
    if (reminderAt && reminderAt > scheduledAt) throw new AppError('Thời gian nhắc phải trước hoặc bằng thời gian khám.', 422);

    await sequelize.transaction(async (transaction) => {
      const appointment = await PersonalAppointment.create({
        health_profile_id: profileId,
        created_by_user_id: req.user.id,
        title,
        facility_name: validation.text(req.body.facilityName, { field: 'Tên cơ sở', max: 180 }),
        doctor_name: validation.text(req.body.doctorName, { field: 'Tên bác sĩ', max: 120 }),
        scheduled_at: scheduledAt,
        reminder_at: reminderAt,
        status: 'scheduled',
        note: validation.text(req.body.note, { field: 'Ghi chú' })
      }, { transaction });
      await ReminderService.syncPersonalAppointment(appointment.id, transaction);
    });

    req.session.flash = { type: 'success', message: 'Đã thêm lịch khám cá nhân.' };
    res.redirect(`/care?profileId=${profileId}`);
  } catch (error) { next(error); }
};

exports.updatePersonalAppointment = async (req, res, next) => {
  try {
    const appt = await PersonalAppointmentService.update(req.user.id, req.params.id, req.body);
    req.session.flash = { type: 'success', message: 'Đã cập nhật lịch khám và đồng bộ nhắc việc.' };
    res.redirect(`/care?profileId=${appt.health_profile_id}`);
  } catch (e) { next(e); }
};

exports.cancelPersonalAppointment = async (req, res, next) => {
  try {
    const appointment = await PersonalAppointment.findByPk(req.params.id);
    if (!appointment) throw new AppError('Không tìm thấy lịch khám cá nhân.', 404);
    await ProfileAccessService.requireAccess(req.user.id, appointment.health_profile_id, 'full');

    await sequelize.transaction(async (transaction) => {
      const locked = await PersonalAppointment.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (locked.status !== 'scheduled') throw new AppError('Lịch khám này không còn ở trạng thái có thể hủy.', 409);
      locked.status = 'cancelled';
      await locked.save({ transaction });
      await ReminderService.cancelPersonalAppointmentTasks(locked.id, transaction);
    });

    req.session.flash = { type: 'success', message: 'Đã hủy lịch khám cá nhân.' };
    res.redirect(`/care?profileId=${appointment.health_profile_id}`);
  } catch (error) { next(error); }
};

exports.createGeneralTask = async (req, res, next) => {
  try {
    const profileId = req.body.profileId;
    await ProfileAccessService.requireAccess(req.user.id, profileId, 'full');
    const title = validation.text(req.body.title, { field: 'Tên việc chăm sóc', required: true, max: 180 });
    const dueAt = parseLocalDateTime(req.body.dueAt, { field: 'Thời gian nhắc', allowPast: false });
    await ReminderService.createGeneralTask({
      userId: req.user.id,
      profileId,
      title,
      description: validation.text(req.body.description, { field: 'Mô tả', max: 500 }),
      dueAt
    });
    req.session.flash = { type: 'success', message: 'Đã thêm nhắc chăm sóc.' };
    res.redirect(`/care?profileId=${profileId}`);
  } catch (error) { next(error); }
};

exports.updateGeneralTask = async (req, res, next) => {
  try {
    const task = await CareService.updateGeneralTask(req.user.id, req.params.id, req.body);
    req.session.flash = { type: 'success', message: 'Đã cập nhật lịch chăm sóc.' };
    res.redirect(`/care?profileId=${task.health_profile_id}`);
  } catch (e) { next(e); }
};

exports.cancelGeneralTask = async (req, res, next) => {
  try {
    const task = await CareService.cancelGeneralTask(req.user.id, req.params.id);
    req.session.flash = { type: 'success', message: 'Đã hủy nhắc chăm sóc.' };
    res.redirect(`/care?profileId=${task.health_profile_id}`);
  } catch (e) { next(e); }
};

exports.completePersonalAppointment = async (req, res, next) => {
  try {
    const appointment = await PersonalAppointment.findByPk(req.params.id);
    if (!appointment) throw new AppError('Không tìm thấy lịch khám cá nhân.', 404);
    await ProfileAccessService.requireAccess(req.user.id, appointment.health_profile_id, 'full');
    await sequelize.transaction(async transaction => {
      const locked = await PersonalAppointment.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (locked.status !== 'scheduled') throw new AppError('Lịch khám không còn ở trạng thái có thể hoàn thành.', 409);
      if (new Date(locked.scheduled_at) > new Date()) throw new AppError('Chưa đến thời gian khám.', 409);
      locked.status = 'completed';
      await locked.save({ transaction });
      await ReminderService.cancelPersonalAppointmentTasks(locked.id, transaction);
    });
    req.session.flash = { type: 'success', message: 'Đã ghi nhận hoàn thành lịch khám cá nhân.' };
    res.redirect(`/care?profileId=${appointment.health_profile_id}`);
  } catch (e) { next(e); }
};
