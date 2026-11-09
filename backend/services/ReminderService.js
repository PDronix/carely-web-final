const { Op } = require('sequelize');
const { Medication, MedicationSchedule, CareTask, PersonalAppointment, HealthProfile } = require('../models');
const ConsentService = require('./ConsentService');
const { toDateOnlyLocal, addDaysDateOnly, combineDateAndTime, startOfLocalDay } = require('../utils/dateTime');

class ReminderService {
  static async canProcessProfile(profileId) {
    const profile = await HealthProfile.findByPk(profileId);
    return Boolean(profile && await ConsentService.hasActiveHealthConsentForSubject(profile.person_id));
  }

  static async syncMedication(medicationId, { days = 7, transaction = null } = {}) {
    const medication = await Medication.findByPk(medicationId, {
      include: [{ model: MedicationSchedule, as: 'schedules' }], transaction
    });
    if (!medication) return;
    if (medication.status !== 'active' || medication.reminder_state !== 'active' || !(await this.canProcessProfile(medication.health_profile_id))) {
      await this.cancelMedicationTasks(medicationId, transaction);
      return;
    }
    const today = toDateOnlyLocal();
    const now = new Date();
    for (let offset = 0; offset <= days; offset += 1) {
      const dateOnly = addDaysDateOnly(today, offset);
      if (dateOnly < medication.start_date || (medication.end_date && dateOnly > medication.end_date)) continue;
      for (const schedule of (medication.schedules || []).filter((item) => item.is_active !== false)) {
        const due = combineDateAndTime(dateOnly, schedule.time_of_day);
        if (due <= now) continue;
        const [task, created] = await CareTask.findOrCreate({
          where: { medication_schedule_id: schedule.id, due_at: due },
          defaults: {
            health_profile_id: medication.health_profile_id,
            task_type: 'medication', medication_schedule_id: schedule.id, personal_appointment_id: null,
            title: `Uống thuốc: ${medication.name}`,
            description: medication.dosage || medication.instructions || null,
            status: 'pending'
          }, transaction
        });
        if (!created && task.status === 'cancelled') {
          task.status = 'pending';
          task.completed_at = null;
          task.completed_by_user_id = null;
          task.title = `Uống thuốc: ${medication.name}`;
          task.description = medication.dosage || medication.instructions || null;
          await task.save({ transaction });
        }
      }
    }
  }

  static async cancelMedicationTasks(medicationId, transaction = null) {
    const schedules = await MedicationSchedule.findAll({ where: { medication_id: medicationId }, attributes: ['id'], transaction });
    const ids = schedules.map((x) => x.id);
    if (!ids.length) return;
    await CareTask.update({ status: 'cancelled' }, {
      where: { medication_schedule_id: { [Op.in]: ids }, status: 'pending' }, transaction
    });
  }

  static async syncPersonalAppointment(appointmentId, transaction = null) {
    const appt = await PersonalAppointment.findByPk(appointmentId, { transaction });
    if (!appt) return;
    if (appt.status !== 'scheduled' || !(await this.canProcessProfile(appt.health_profile_id))) {
      await this.cancelPersonalAppointmentTasks(appointmentId, transaction); return;
    }
    const due = appt.reminder_at || appt.scheduled_at;
    if (!due || new Date(due) <= new Date()) return;
    const [task, created] = await CareTask.findOrCreate({
      where: { personal_appointment_id: appt.id, due_at: due },
      defaults: {
        health_profile_id: appt.health_profile_id, task_type: 'appointment', medication_schedule_id: null,
        personal_appointment_id: appt.id, title: `Lịch khám cá nhân: ${appt.title}`,
        description: appt.facility_name || appt.note || null, status: 'pending'
      }, transaction
    });
    if (!created && task.status === 'cancelled') {
      task.status = 'pending';
      task.completed_at = null;
      task.completed_by_user_id = null;
      task.title = `Lịch khám cá nhân: ${appt.title}`;
      task.description = appt.facility_name || appt.note || null;
      await task.save({ transaction });
    }
  }

  static async cancelPersonalAppointmentTasks(appointmentId, transaction = null) {
    await CareTask.update({ status: 'cancelled' }, {
      where: { personal_appointment_id: appointmentId, status: 'pending' }, transaction
    });
  }


  static async cancelProfilePendingTasks(profileId, transaction = null) {
    await CareTask.update({ status: 'cancelled' }, {
      where: { health_profile_id: profileId, status: 'pending' }, transaction
    });
  }

  static async syncProfile(profileId, { days = 7 } = {}) {
    if (!(await this.canProcessProfile(profileId))) {
      await this.cancelProfilePendingTasks(profileId);
      return;
    }
    const medications = await Medication.findAll({ where: { health_profile_id: profileId, status: 'active', reminder_state: 'active' }, attributes: ['id'] });
    for (const medication of medications) await this.syncMedication(medication.id, { days });
    const appointments = await PersonalAppointment.findAll({ where: { health_profile_id: profileId, status: 'scheduled' }, attributes: ['id'] });
    for (const appointment of appointments) await this.syncPersonalAppointment(appointment.id);
  }

  static async createGeneralTask({ userId, profileId, title, description = null, dueAt }, transaction = null) {
    return CareTask.create({
      health_profile_id: profileId, task_type: 'general', medication_schedule_id: null, personal_appointment_id: null,
      title, description, due_at: dueAt, status: 'pending', completed_by_user_id: null
    }, { transaction });
  }

  static async markMissed() {
    const cutoff = startOfLocalDay(new Date());
    await CareTask.update({ status: 'missed' }, { where: { status: 'pending', due_at: { [Op.lt]: cutoff } } });
  }

  static async maintainRollingWindow(days = 7) {
    const medications = await Medication.findAll({ where: { status: 'active' }, attributes: ['id','end_date','reminder_state'] });
    const today=toDateOnlyLocal();
    for (const med of medications) { if(med.end_date && med.end_date < today){ med.status='completed'; med.reminder_state='none'; await med.save(); await this.cancelMedicationTasks(med.id); continue; } if(med.reminder_state==='active') await this.syncMedication(med.id,{days}); }
    const appts = await PersonalAppointment.findAll({ where: { status: 'scheduled' }, attributes: ['id'] });
    for (const appt of appts) await this.syncPersonalAppointment(appt.id);
    await this.markMissed();
  }
}
module.exports = ReminderService;
