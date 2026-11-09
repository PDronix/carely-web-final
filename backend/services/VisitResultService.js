const { sequelize, VisitResult, Medication, MedicationSchedule, Invoice, Appointment, Facility } = require('../models');
const AppointmentService = require('./AppointmentService');
const AppError = require('../utils/AppError');
const AuditService = require('./AuditService');
const { parseLocalDateTime, parseDateOnly, toDateOnlyLocal, startOfLocalDay } = require('../utils/dateTime');
const validation = require('../utils/validation');

class VisitResultService {
  static async completeVisit(facilityUserId, appointmentId, data) {
    return sequelize.transaction(async (transaction) => {
      const { appointment } = await AppointmentService.assertFacilityAccess(facilityUserId, appointmentId, transaction);
      const existing = await VisitResult.findOne({ where: { appointment_id: appointmentId }, transaction });
      if (existing) throw new AppError('Lịch hẹn đã có kết quả khám chính thức.', 409);

      const examinedAt = data.examinedAt ? parseLocalDateTime(data.examinedAt,{field:'Thời điểm khám'}) : new Date();
      if (examinedAt > new Date()) throw new AppError('Thời điểm khám không được ở tương lai.',422);
      if (!appointment.confirmed_for || new Date() < startOfLocalDay(new Date(appointment.confirmed_for))) throw new AppError('Lịch khám chưa đến ngày đã xác nhận.', 409);
      if (examinedAt < startOfLocalDay(new Date(appointment.confirmed_for))) throw new AppError('Thời điểm khám không được trước ngày hẹn đã xác nhận.', 422);
      const result = await VisitResult.create({
        appointment_id: appointmentId,
        recorded_by_user_id: facilityUserId,
        doctor_name: validation.text(data.doctorName, { field: 'Tên bác sĩ', required: true, max: 120 }),
        examined_at: examinedAt,
        diagnosis: validation.text(data.diagnosis, { field: 'Chẩn đoán' }),
        conclusion: validation.text(data.conclusion, { field: 'Kết luận' }),
        instructions: validation.text(data.instructions, { field: 'Hướng dẫn sau khám' })
      }, { transaction });

      const prescriptions = Array.isArray(data.prescriptions) ? data.prescriptions : [];
      for (const p of prescriptions) {
        if (!p.name) continue;

        const startDate = p.startDate
          ? parseDateOnly(p.startDate, 'Ngày bắt đầu thuốc')
          : toDateOnlyLocal();
        const endDate = p.endDate
          ? parseDateOnly(p.endDate, 'Ngày kết thúc thuốc')
          : null;
        if (endDate && endDate < startDate) {
          throw new AppError('Ngày kết thúc thuốc không được trước ngày bắt đầu.', 422);
        }

        const medication = await Medication.create({
          health_profile_id: appointment.health_profile_id,
          visit_result_id: result.id,
          created_by_user_id: facilityUserId,
          name: validation.text(p.name, { field: 'Tên thuốc', required: true, max: 180 }),
          dosage: validation.text(p.dosage, { field: 'Liều dùng', max: 120 }),
          instructions: validation.text(p.instructions, { field: 'Hướng dẫn dùng thuốc' }),
          start_date: startDate,
          end_date: endDate,
          source_type: 'facility_prescribed',
          status: 'active',
          reminder_state: p.times?.length ? 'draft' : 'none'
        }, { transaction });
        for (const time of (p.times || [])) {
          await MedicationSchedule.create({ medication_id: medication.id, time_of_day: time }, { transaction });
        }
      }

      if (data.invoiceAmount !== undefined && data.invoiceAmount !== null && data.invoiceAmount !== '') {
        const amount = Number(data.invoiceAmount);
        if (!Number.isFinite(amount) || amount < 0) throw new AppError('Số tiền hóa đơn không hợp lệ.', 400);
        await Invoice.create({
          visit_result_id: result.id,
          invoice_number: validation.text(data.invoiceNumber, { field: 'Số hóa đơn', max: 50 }) || `INV-${appointmentId}-${Date.now()}`, 
          total_amount: amount,
          payment_status: data.paymentStatus === 'paid' ? 'paid' : 'unpaid',
          paid_at: data.paymentStatus === 'paid' ? new Date() : null,
          note: validation.text(data.invoiceNote, { field: 'Ghi chú hóa đơn' })
        }, { transaction });
      }

      appointment.status = 'completed';
      appointment.completed_at = new Date();
      await appointment.save({ transaction });

      await AuditService.write({
        actorUserId: facilityUserId,
        action: 'VISIT_RESULT_COMPLETED',
        resourceType: 'appointment',
        resourceId: appointment.id,
        metadata: { visitResultId: result.id, facilityId: appointment.facility_id }
      }, { transaction });

      return result;
    });
  }
  static async updateInvoicePayment(facilityUserId, invoiceId, paymentStatus) {
    const facility = await AppointmentService.requireApprovedFacility(facilityUserId);
    const invoice = await Invoice.findByPk(invoiceId, {
      include: [{ model: VisitResult, as: 'visitResult', include: [{ model: Appointment, as: 'appointment' }] }]
    });
    const appointment = invoice?.visitResult?.appointment;
    if (!invoice || !appointment || Number(appointment.facility_id) !== Number(facility.id)) {
      throw new AppError('Không tìm thấy hóa đơn thuộc cơ sở y tế này.', 404);
    }
    if (!['paid', 'unpaid'].includes(paymentStatus)) throw new AppError('Trạng thái thanh toán không hợp lệ.', 400);
    invoice.payment_status = paymentStatus;
    invoice.paid_at = paymentStatus === 'paid' ? new Date() : null;
    await invoice.save();
    await AuditService.write({
      actorUserId: facilityUserId,
      action: 'INVOICE_PAYMENT_STATUS_UPDATED',
      resourceType: 'invoice',
      resourceId: invoice.id,
      metadata: { paymentStatus, appointmentId: appointment.id }
    });
    return invoice;
  }

}

module.exports = VisitResultService;
