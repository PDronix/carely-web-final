const { sequelize, PersonalAppointment } = require('../models');
const ProfileAccessService = require('./ProfileAccessService');
const ReminderService = require('./ReminderService');
const { parseLocalDateTime } = require('../utils/dateTime');
const validation = require('../utils/validation');
const AppError = require('../utils/AppError');

function validatedFields(body) {
  const scheduledAt = parseLocalDateTime(body.scheduledAt, { field: 'Thời gian khám', allowPast: false });
  const reminderAt = parseLocalDateTime(body.reminderAt, { field: 'Thời gian nhắc', required: false, allowPast: false });
  if (reminderAt && reminderAt > scheduledAt) throw new AppError('Thời gian nhắc không được sau thời gian khám.', 422);
  return {
    title: validation.text(body.title, { field: 'Tiêu đề lịch khám', required: true, max: 180 }),
    facility_name: validation.text(body.facilityName, { field: 'Tên cơ sở', max: 180 }),
    doctor_name: validation.text(body.doctorName, { field: 'Tên bác sĩ', max: 120 }),
    note: validation.text(body.note, { field: 'Ghi chú', max: 1200 }),
    scheduled_at: scheduledAt, reminder_at: reminderAt
  };
}

class PersonalAppointmentService {
  static async update(userId, appointmentId, body) {
    return sequelize.transaction(async transaction => {
      const appt = await PersonalAppointment.findByPk(appointmentId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!appt) throw new AppError('Không tìm thấy lịch khám cá nhân.', 404);
      await ProfileAccessService.requireAccess(userId, appt.health_profile_id, 'full');
      if (appt.status !== 'scheduled' || new Date(appt.scheduled_at) <= new Date()) {
        throw new AppError('Chỉ sửa lịch khám chưa đến giờ và chưa bị hủy/hoàn thành.', 409);
      }
      const fields = validatedFields(body);
      // Only pending reminders are cancelled. Completed/missed history is preserved.
      await ReminderService.cancelPersonalAppointmentTasks(appt.id, transaction);
      await appt.update(fields, { transaction });
      await ReminderService.syncPersonalAppointment(appt.id, transaction);
      return appt;
    });
  }
}
module.exports = { PersonalAppointmentService, validatedFields };
