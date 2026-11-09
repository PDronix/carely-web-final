const { Op } = require('sequelize');
const { sequelize, Appointment, Facility, User, HealthProfile, Person, VisitResult, Invoice, Medication, MedicationSchedule } = require('../models');
const ProfileAccessService = require('./ProfileAccessService');
const AuditService = require('./AuditService');
const AppError = require('../utils/AppError');
const { parseLocalDateTime } = require('../utils/dateTime');
const validation = require('../utils/validation');

class AppointmentService {
  static async createRequest(memberUserId, { profileId, facilityId, requestedFor, reason }) {
    if (!(await ProfileAccessService.canDelegateFacilityAccess(memberUserId, profileId))) {
      throw new AppError('Chỉ chủ hồ sơ hoặc người quản lý hồ sơ người phụ thuộc được đặt lịch với cơ sở y tế.', 403);
    }
    const facility = await Facility.findByPk(facilityId, { include: [{ model: User, as: 'user' }] });
    if (!facility || facility.verification_status !== 'approved' || facility.user?.status !== 'active') throw new AppError('Cơ sở y tế chưa được phép hoạt động.', 400);
    const requestedDate = parseLocalDateTime(requestedFor, { field: 'Thời gian đặt lịch', allowPast: false });
    // Lock the profile row to serialize concurrent duplicate requests.
    return sequelize.transaction(async transaction => {
      const profile = await HealthProfile.findByPk(profileId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!profile) throw new AppError('Không tìm thấy hồ sơ sức khỏe.', 404);
      const duplicate = await Appointment.findOne({
        where: {
          health_profile_id: profileId, facility_id: facilityId, requested_for: requestedDate,
          status: { [Op.in]: ['pending', 'proposed_time', 'confirmed'] }
        }, transaction
      });
      if (duplicate) throw new AppError('Hồ sơ này đã có yêu cầu tại cơ sở và thời gian đã chọn.', 409);
      return Appointment.create({
        health_profile_id: profileId,
        facility_id: facilityId,
        requested_by_user_id: memberUserId,
        reason: validation.text(reason, { field: 'Lý do khám', max: 500 }),
        requested_for: requestedDate,
        status: 'pending'
      }, { transaction });
    });
  }

  static async listForMember(userId) {
    const profiles = await ProfileAccessService.listAccessibleProfiles(userId);
    const profileIds = profiles.map((x) => x.profile.id);
    if (!profileIds.length) return [];
    return Appointment.findAll({
      where: { health_profile_id: { [Op.in]: profileIds } },
      include: [
        { model: Facility, as: 'facility', include: [{ model: User, as: 'user' }] },
        { model: HealthProfile, as: 'profile', include: [{ model: Person, as: 'person' }] },
        { model: VisitResult, as: 'visitResult', include: [
          { model: Invoice, as: 'invoice' },
          { model: Medication, as: 'prescriptions', include: [{ model: MedicationSchedule, as: 'schedules' }] }
        ] }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  static async facilityForUser(userId) {
    const facility = await Facility.findOne({ where: { user_id: userId }, include: [{ model: User, as: 'user' }] });
    if (!facility) throw new AppError('Không tìm thấy hồ sơ cơ sở y tế.', 404);
    return facility;
  }

  static async requireApprovedFacility(userId) {
    const facility = await this.facilityForUser(userId);
    if (facility.verification_status !== 'approved' || facility.user?.status !== 'active') throw new AppError('Cơ sở y tế chưa được phê duyệt hoặc đang bị khóa.', 403);
    return facility;
  }

  static async listForFacility(userId) {
    const facility = await this.requireApprovedFacility(userId);
    return Appointment.findAll({
      where: { facility_id: facility.id },
      include: [
        { model: HealthProfile, as: 'profile', include: [{ model: Person, as: 'person' }] },
        { model: VisitResult, as: 'visitResult', include: [{ model: Invoice, as: 'invoice' }] }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  static async pagedForFacility(userId, { status = 'all', page = 1, pageSize = 15 } = {}) {
    const facility = await this.requireApprovedFacility(userId);
    const allowedStatuses = ['pending','proposed_time','confirmed','completed','cancelled','rejected'];
    const safeStatus = allowedStatuses.includes(status) ? status : 'all';
    const where = { facility_id: facility.id };
    if (safeStatus !== 'all') where.status = safeStatus;
    const total = await Appointment.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
    const rows = await Appointment.findAll({
      where,
      include: [
        { model: HealthProfile, as: 'profile', include: [{ model: Person, as: 'person' }] },
        { model: VisitResult, as: 'visitResult' }
      ],
      order: [['created_at','DESC'],['id','DESC']], limit:pageSize, offset:(safePage-1)*pageSize
    });
    const counts = Object.fromEntries(allowedStatuses.map(key=>[key,0]));
    const aggregates = await Appointment.findAll({
      where:{facility_id:facility.id},
      attributes:['status',[sequelize.fn('COUNT',sequelize.col('id')),'total']],
      group:['status'],raw:true
    });
    aggregates.forEach(item=>{ if(item.status in counts) counts[item.status]=Number(item.total); });
    return { rows, total, page:safePage, totalPages, status:safeStatus, counts };
  }

  static async ensureProfileNotDoubleBooked(profileId, confirmedTime, excludedAppointmentId, transaction) {
    await HealthProfile.findByPk(profileId, { transaction, lock: transaction.LOCK.UPDATE });
    const existing = await Appointment.findOne({ where: {
      health_profile_id: profileId, status: 'confirmed', confirmed_for: confirmedTime,
      id: { [Op.ne]: excludedAppointmentId }
    }, transaction });
    if (existing) throw new AppError('Hồ sơ này đã có lịch khám được xác nhận cùng thời điểm.', 409);
  }

  static async facilityTransition(userId, appointmentId, action, payload = {}) {
    const facility = await this.requireApprovedFacility(userId);
    return sequelize.transaction(async (transaction) => {
      const appt = await Appointment.findByPk(appointmentId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!appt || Number(appt.facility_id) !== Number(facility.id)) throw new AppError('Không tìm thấy lịch hẹn.', 404);
      const now = new Date();
      if (action === 'confirm') {
        if (appt.status !== 'pending') throw new AppError('Chỉ yêu cầu đang chờ mới được cơ sở xác nhận trực tiếp.', 409);
        const directTime = payload.confirmedFor ? parseLocalDateTime(payload.confirmedFor, { field: 'Thời gian xác nhận', allowPast: false }) : new Date(appt.requested_for);
        if (directTime <= now) throw new AppError('Thời gian mong muốn đã qua. Hãy đề xuất một thời gian mới.',409);
        await this.ensureProfileNotDoubleBooked(appt.health_profile_id, directTime, appt.id, transaction);
        appt.status = 'confirmed'; appt.confirmed_for = directTime;
        appt.confirmed_at = now;
      } else if (action === 'propose') {
        if (appt.status !== 'pending' || !payload.proposedFor) throw new AppError('Chỉ lịch đang chờ mới được đề xuất thời gian khác.', 409);
        appt.status = 'proposed_time';
        appt.proposed_for = parseLocalDateTime(payload.proposedFor, { field: 'Thời gian đề xuất', allowPast: false });
      } else if (action === 'reject') {
        if (!['pending', 'proposed_time'].includes(appt.status)) throw new AppError('Không thể từ chối lịch ở trạng thái hiện tại.', 409);
        appt.status = 'rejected';
        appt.rejected_at = now;
        appt.rejected_by_user_id = userId;
      } else if (action === 'cancel') {
        if (!['pending', 'proposed_time', 'confirmed'].includes(appt.status)) throw new AppError('Không thể hủy lịch ở trạng thái hiện tại.', 409);
        if (appt.status === 'confirmed') {
          if (!appt.confirmed_for || new Date(appt.confirmed_for) <= now) throw new AppError('Lịch đã đến thời gian khám; hãy xử lý kết quả hoặc liên hệ người bệnh.', 409);
          if (String(payload.note || '').trim().length < 10) throw new AppError('Hủy lịch đã xác nhận phải ghi lý do ít nhất 10 ký tự.', 422);
        }
        appt.status = 'cancelled';
        appt.cancelled_at = now;
        appt.cancelled_by_user_id = userId;
      } else throw new AppError('Hành động không hợp lệ.', 400);
      if (payload.note !== undefined) appt.facility_response_note = validation.text(payload.note, { field: 'Ghi chú phản hồi', max: 500 });
      await appt.save({ transaction });
      return appt;
    });
  }

  static async memberAction(userId, appointmentId, action) {
    return sequelize.transaction(async (transaction) => {
      const appt = await Appointment.findByPk(appointmentId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!appt) throw new AppError('Không tìm thấy lịch hẹn.', 404);
      if (!(await ProfileAccessService.canDelegateFacilityAccess(userId, appt.health_profile_id))) throw new AppError('Bạn không có quyền quản lý lịch hẹn của hồ sơ này.', 403);
      const now = new Date();
      if (action === 'accept-proposal') {
        if (appt.status !== 'proposed_time' || !appt.proposed_for) throw new AppError('Lịch không có đề xuất thời gian hợp lệ.', 409);
        if (new Date(appt.proposed_for) <= now) throw new AppError('Thời gian đề xuất đã qua. Vui lòng yêu cầu cơ sở y tế tạo lịch mới.', 409);
        await this.ensureProfileNotDoubleBooked(appt.health_profile_id, new Date(appt.proposed_for), appt.id, transaction);
        appt.status = 'confirmed';
        appt.confirmed_for = appt.proposed_for;
        appt.confirmed_at = now;
      } else if (action === 'reject-proposal') {
        if (appt.status !== 'proposed_time') throw new AppError('Chỉ đề xuất thời gian đang chờ phản hồi mới có thể từ chối.', 409);
        appt.status = 'cancelled';
        appt.cancelled_at = now; appt.cancelled_by_user_id = userId;
      } else if (action === 'cancel') {
        if (!['pending', 'confirmed'].includes(appt.status)) throw new AppError('Không thể hủy lịch ở trạng thái hiện tại.', 409);
        if (appt.status === 'confirmed' && (!appt.confirmed_for || new Date(appt.confirmed_for) <= now)) {
          throw new AppError('Lịch đã đến thời gian khám; không thể hủy trực tuyến.', 409);
        }
        appt.status = 'cancelled';
        appt.cancelled_at = now;
        appt.cancelled_by_user_id = userId;
      } else if (action === 'revoke-access') {
        if (appt.status !== 'confirmed') throw new AppError('Chỉ lịch đã xác nhận mới có quyền Facility để thu hồi.', 409);
        appt.access_revoked_at = now;
        appt.access_revoked_by_user_id = userId;
        await AuditService.write({ actorUserId: userId, action: 'FACILITY_ACCESS_REVOKED', resourceType: 'appointment', resourceId: appt.id }, { transaction });
      } else throw new AppError('Hành động không hợp lệ.', 400);
      await appt.save({ transaction });
      return appt;
    });
  }

  static async assertFacilityAccess(userId, appointmentId, transaction = null) {
    const facility = await this.requireApprovedFacility(userId);
    const appt = await Appointment.findByPk(appointmentId, { transaction });
    if (!appt || Number(appt.facility_id) !== Number(facility.id)) throw new AppError('Không tìm thấy lịch hẹn.', 404);
    if (appt.status !== 'confirmed' || appt.access_revoked_at) throw new AppError('Cơ sở y tế không còn quyền truy cập hồ sơ cho lịch hẹn này.', 403);
    // A confirmed appointment alone must not override a withdrawn health-data consent.
    const profile = await HealthProfile.findByPk(appt.health_profile_id, { transaction });
    if (!profile || !(await ProfileAccessService.profileHasActiveConsent(profile.person_id))) {
      throw new AppError('Hồ sơ không còn consent dữ liệu sức khỏe còn hiệu lực.', 403);
    }
    await AuditService.write({ actorUserId: userId, action: 'FACILITY_PROFILE_ACCESS', resourceType: 'appointment', resourceId: appt.id }, transaction ? { transaction } : {});
    return { facility, appointment: appt };
  }
}

module.exports = AppointmentService;
