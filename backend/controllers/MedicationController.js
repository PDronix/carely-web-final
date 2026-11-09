const { sequelize, Medication, MedicationSchedule } = require('../models');
const ProfileAccessService = require('../services/ProfileAccessService');
const ReminderService = require('../services/ReminderService');
const AppError = require('../utils/AppError');
const { parseDateOnly } = require('../utils/dateTime');
const validation = require('../utils/validation');

function normalizeTimes(input) {
  const values = Array.isArray(input) ? input : (input ? [input] : []);
  const unique = [];
  for (const raw of values) {
    const value = String(raw || '').trim();
    if (!value) continue;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
      throw new AppError(`Giờ uống thuốc "${value}" không hợp lệ.`, 422);
    }
    const normalized = `${value}:00`;
    if (!unique.includes(normalized)) unique.push(normalized);
  }
  return unique;
}

exports.index = async (req, res, next) => {
  try {
    const profiles = await ProfileAccessService.listAccessibleProfiles(req.user.id);
    const profileId = req.query.profileId || profiles[0]?.profile?.id;
    let medications = [];
    let selected = null;
    if (profileId) {
      await ProfileAccessService.requireAccess(req.user.id, profileId, 'view');
      selected = profiles.find((x) => Number(x.profile.id) === Number(profileId));
      medications = await Medication.findAll({
        where: { health_profile_id: profileId },
        include: [{ model: MedicationSchedule, as: 'schedules' }],
        order: [['created_at', 'DESC']]
      });
    }
    res.render('medications/index', { title: 'Thuốc và lịch dùng thuốc', profiles, profileId, selected, medications });
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const profileId = req.body.profileId;
    await ProfileAccessService.requireAccess(req.user.id, profileId, 'full');

    const name = validation.text(req.body.name, { field: 'Tên thuốc', required: true, max: 180 });
    const startDate = parseDateOnly(req.body.startDate, 'Ngày bắt đầu');
    const endDate = req.body.endDate ? parseDateOnly(req.body.endDate, 'Ngày kết thúc') : null;
    if (endDate && endDate < startDate) throw new AppError('Ngày kết thúc không được trước ngày bắt đầu.', 422);

    const times = normalizeTimes(req.body.times);
    const reminderEnabled = req.body.enableReminder === 'on';
    if (reminderEnabled && !times.length) {
      throw new AppError('Hãy thêm ít nhất một giờ uống thuốc khi bật lịch nhắc.', 422);
    }

    await sequelize.transaction(async (transaction) => {
      const medication = await Medication.create({
        health_profile_id: profileId,
        visit_result_id: null,
        created_by_user_id: req.user.id,
        name,
        dosage: validation.text(req.body.dosage, { field: 'Liều dùng', max: 120 }),
        instructions: validation.text(req.body.instructions, { field: 'Hướng dẫn' }),
        start_date: startDate,
        end_date: endDate,
        source_type: 'self_recorded',
        status: 'active',
        reminder_state: reminderEnabled ? 'active' : 'none'
      }, { transaction });

      for (const time of times) {
        await MedicationSchedule.create({ medication_id: medication.id, time_of_day: time }, { transaction });
      }

      if (reminderEnabled) {
        await ReminderService.syncMedication(medication.id, { days: 7, transaction });
      }
    });

    req.session.flash = { type: 'success', message: 'Đã thêm thuốc và cập nhật lịch nhắc.' };
    res.redirect(`/medications?profileId=${profileId}`);
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const medication = await Medication.findByPk(req.params.id, { include: [{ model: MedicationSchedule, as: 'schedules' }] });
    if (!medication) throw new AppError('Không tìm thấy thuốc.', 404);
    await ProfileAccessService.requireAccess(req.user.id, medication.health_profile_id, 'full');
    if (medication.source_type !== 'self_recorded') throw new AppError('Đơn thuốc do Cơ sở y tế tạo chỉ được xem và điều khiển lịch nhắc.', 403);
    if (medication.status !== 'active') throw new AppError('Thuốc đã ngừng nên không thể chỉnh sửa.', 409);

    const name = validation.text(req.body.name, { field: 'Tên thuốc', required: true, max: 180 });
    const startDate = parseDateOnly(req.body.startDate, 'Ngày bắt đầu');
    const endDate = req.body.endDate ? parseDateOnly(req.body.endDate, 'Ngày kết thúc') : null;
    if (endDate && endDate < startDate) throw new AppError('Ngày kết thúc không được trước ngày bắt đầu.', 422);
    const times = normalizeTimes(req.body.times);
    const reminderEnabled = req.body.enableReminder === 'on';
    if (reminderEnabled && !times.length) throw new AppError('Hãy thêm ít nhất một giờ uống thuốc khi bật lịch nhắc.', 422);

    await sequelize.transaction(async (transaction) => {
      const locked = await Medication.findByPk(req.params.id, {
        include: [{ model: MedicationSchedule, as: 'schedules' }],
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      await ReminderService.cancelMedicationTasks(locked.id, transaction);

      locked.name = name;
      locked.dosage = validation.text(req.body.dosage, { field: 'Liều dùng', max: 120 });
      locked.instructions = validation.text(req.body.instructions, { field: 'Hướng dẫn' });
      locked.start_date = startDate;
      locked.end_date = endDate;
      locked.reminder_state = reminderEnabled ? 'active' : 'none';
      locked.reminder_confirmed_at = reminderEnabled ? new Date() : null;
      await locked.save({ transaction });

      const schedules = locked.schedules || [];
      for (const schedule of schedules) {
        schedule.is_active = false;
        await schedule.save({ transaction });
      }
      for (const time of times) {
        let schedule = schedules.find((item) => String(item.time_of_day).slice(0, 8) === time);
        if (schedule) {
          schedule.is_active = true;
          await schedule.save({ transaction });
        } else {
          await MedicationSchedule.create({ medication_id: locked.id, time_of_day: time, is_active: true }, { transaction });
        }
      }

      if (reminderEnabled) await ReminderService.syncMedication(locked.id, { days: 7, transaction });
    });

    req.session.flash = { type: 'success', message: 'Đã cập nhật thuốc và đồng bộ lại lịch nhắc.' };
    res.redirect(`/medications?profileId=${medication.health_profile_id}`);
  } catch (error) { next(error); }
};

exports.confirmReminder = async (req, res, next) => {
  try {
    const medication = await Medication.findByPk(req.params.id);
    if (!medication) throw new AppError('Không tìm thấy thuốc.', 404);
    await ProfileAccessService.requireAccess(req.user.id, medication.health_profile_id, 'full');

    await sequelize.transaction(async (transaction) => {
      const locked = await Medication.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (locked.source_type !== 'facility_prescribed' || locked.reminder_state !== 'draft') {
        throw new AppError('Thuốc không có lịch nhắc chờ xác nhận.', 409);
      }
      if (locked.status !== 'active') throw new AppError('Thuốc đã ngừng nên không thể bật lịch nhắc.', 409);
      locked.reminder_state = 'active';
      locked.reminder_confirmed_at = new Date();
      await locked.save({ transaction });
      await ReminderService.syncMedication(locked.id, { days: 7, transaction });
    });

    req.session.flash = { type: 'success', message: 'Đã kích hoạt lịch nhắc từ đơn thuốc.' };
    res.redirect(`/medications?profileId=${medication.health_profile_id}`);
  } catch (error) { next(error); }
};

exports.stop = async (req, res, next) => {
  try {
    const medication = await Medication.findByPk(req.params.id);
    if (!medication) throw new AppError('Không tìm thấy thuốc.', 404);
    await ProfileAccessService.requireAccess(req.user.id, medication.health_profile_id, 'full');
    if (medication.source_type === 'facility_prescribed') {
      throw new AppError('Không chỉnh sửa trực tiếp đơn thuốc chính thức. Bạn có thể tắt lịch nhắc nếu cần.', 403);
    }

    await sequelize.transaction(async (transaction) => {
      const locked = await Medication.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (locked.status !== 'active') throw new AppError('Thuốc này đã ngừng trước đó.', 409);
      locked.status = 'stopped';
      locked.reminder_state = 'none';
      locked.reminder_confirmed_at = null;
      await locked.save({ transaction });
      await ReminderService.cancelMedicationTasks(locked.id, transaction);
    });

    req.session.flash = { type: 'success', message: 'Đã ngừng thuốc và hủy các nhắc lịch chưa đến hạn.' };
    res.redirect(`/medications?profileId=${medication.health_profile_id}`);
  } catch (error) { next(error); }
};

exports.setReminder = async (req, res, next) => {
  try {
    const medication = await Medication.findByPk(req.params.id);
    if (!medication) throw new AppError('Không tìm thấy thuốc.', 404);
    await ProfileAccessService.requireAccess(req.user.id, medication.health_profile_id, 'full');
    const action = req.body.action;

    await sequelize.transaction(async (transaction) => {
      const locked = await Medication.findByPk(req.params.id, {
        include: [{ model: MedicationSchedule, as: 'schedules' }],
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (locked.status !== 'active') throw new AppError('Thuốc đã ngừng nên không thể thay đổi lịch nhắc.', 409);

      if (action === 'disable') {
        if (locked.reminder_state === 'none') throw new AppError('Lịch nhắc đã được tắt trước đó.', 409);
        locked.reminder_state = 'none';
        locked.reminder_confirmed_at = null;
        await locked.save({ transaction });
        await ReminderService.cancelMedicationTasks(locked.id, transaction);
        return;
      }

      if (action === 'enable') {
        if (!(locked.schedules || []).some((item) => item.is_active !== false)) throw new AppError('Thuốc chưa có giờ dùng để bật lịch nhắc.', 422);
        locked.reminder_state = 'active';
        if (locked.source_type === 'facility_prescribed') locked.reminder_confirmed_at = new Date();
        await locked.save({ transaction });
        await ReminderService.syncMedication(locked.id, { days: 7, transaction });
        return;
      }

      throw new AppError('Hành động lịch nhắc không hợp lệ.', 400);
    });

    req.session.flash = { type: 'success', message: action === 'disable' ? 'Đã tắt lịch nhắc.' : 'Đã bật lịch nhắc.' };
    res.redirect(`/medications?profileId=${medication.health_profile_id}`);
  } catch (error) { next(error); }
};
