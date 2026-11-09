const crypto = require('crypto');
const { Op } = require('sequelize');
const { sequelize, Family, Person, FamilyInvite, FamilyJoinRequest, HealthProfile, ProfilePermission, User } = require('../models');
const ConsentService = require('./ConsentService');
const AuditService = require('./AuditService');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { parseDateOnly, toDateOnlyLocal } = require('../utils/dateTime');
const validation = require('../utils/validation');
const ReminderService = require('./ReminderService');

class FamilyService {
  static async getMemberPerson(userId, transaction) {
    return Person.findOne({ where: { user_id: userId, person_type: 'member', status: 'active' }, transaction });
  }

  static async createFamily(userId, name) {
    return sequelize.transaction(async (transaction) => {
      const person = await this.getMemberPerson(userId, transaction);
      if (!person) throw new AppError('Không tìm thấy hồ sơ Thành viên.', 404);
      if (person.family_id) throw new AppError('Tài khoản đã thuộc một nhóm gia đình.', 400);
      const familyName = validation.text(name, { field: 'Tên nhóm gia đình', required: true, max: 120 });
      const family = await Family.create({ name: familyName, owner_user_id: userId }, { transaction });
      person.family_id = family.id;
      await person.save({ transaction });
      return family;
    });
  }

  static async createInvite(ownerUserId, days = 1) {
    return sequelize.transaction(async (transaction) => {
      const person = await this.getMemberPerson(ownerUserId, transaction);
      if (!person?.family_id) throw new AppError('Bạn chưa có nhóm gia đình.', 400);
      const family = await Family.findByPk(person.family_id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!family || Number(family.owner_user_id) !== Number(ownerUserId)) throw new AppError('Chỉ Chủ nhà được tạo mã mời.', 403);
      await FamilyInvite.update({ status: 'revoked' }, { where: { family_id: family.id, status: 'active' }, transaction });
      const code = crypto.randomBytes(8).toString('hex').toUpperCase();
      const expiresAt = new Date(Date.now() + Math.min(1, days) * 24 * 60 * 60 * 1000);
      return FamilyInvite.create({ family_id: family.id, code, created_by_user_id: ownerUserId, expires_at: expiresAt, status: 'active' }, { transaction });
    });
  }

  static async requestJoin(userId, inviteCode) {
    const person = await this.getMemberPerson(userId);
    if (!person) throw new AppError('Không tìm thấy Thành viên.', 404);
    if (person.family_id) throw new AppError('Bạn đã thuộc một nhóm gia đình.', 400);
    const code = validation.text(inviteCode, { field: 'Mã mời', required: true, max: 64 }).toUpperCase();
    const now = new Date();
    const invite = await FamilyInvite.findOne({
      where: {
        code,
        status: 'active',
        expires_at: { [Op.gt]: now },
        created_at: { [Op.gt]: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
      }
    });
    if (!invite) throw new AppError('Mã mời không hợp lệ hoặc đã hết hạn.', 400);
    const existing = await FamilyJoinRequest.findOne({ where: { user_id: userId, invite_id: invite.id, status: 'pending' } });
    if (existing) return existing;
    return FamilyJoinRequest.create({ user_id: userId, invite_id: invite.id, status: 'pending', requested_at: new Date() });
  }

  static async approveJoin(ownerUserId, requestId, approve = true) {
    return sequelize.transaction(async (transaction) => {
      const request = await FamilyJoinRequest.findByPk(requestId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!request || request.status !== 'pending') throw new AppError('Yêu cầu tham gia không còn hiệu lực.', 400);
      const invite = await FamilyInvite.findByPk(request.invite_id, { transaction });
      const family = invite ? await Family.findByPk(invite.family_id, { transaction }) : null;
      if (!family || Number(family.owner_user_id) !== Number(ownerUserId)) throw new AppError('Bạn không có quyền duyệt yêu cầu này.', 403);
      request.status = approve ? 'approved' : 'rejected';
      request.reviewed_at = new Date();
      request.reviewed_by_user_id = ownerUserId;
      await request.save({ transaction });
      if (approve) {
        const person = await this.getMemberPerson(request.user_id, transaction);
        if (!person || person.family_id) throw new AppError('Thành viên đã thuộc một nhóm khác.', 409);
        person.family_id = family.id;
        await person.save({ transaction });
      }
      return request;
    });
  }

  static async transferOwner(ownerUserId, newOwnerUserId) {
    return sequelize.transaction(async (transaction) => {
      const ownerPerson = await this.getMemberPerson(ownerUserId, transaction);
      if (!ownerPerson?.family_id) throw new AppError('Không có nhóm gia đình.', 400);
      const family = await Family.findByPk(ownerPerson.family_id, { transaction, lock: transaction.LOCK.UPDATE });
      if (Number(family.owner_user_id) !== Number(ownerUserId)) throw new AppError('Chỉ Chủ nhà được chuyển quyền.', 403);
      const newOwnerPerson = await Person.findOne({ where: { user_id: newOwnerUserId, family_id: family.id, person_type: 'member', status: 'active' }, transaction });
      if (!newOwnerPerson) throw new AppError('Người nhận phải là Thành viên đang hoạt động trong nhóm.', 400);
      family.owner_user_id = newOwnerUserId;
      await family.save({ transaction });
      await AuditService.write({
        actorUserId: ownerUserId,
        action: 'FAMILY_OWNER_TRANSFER',
        resourceType: 'family',
        resourceId: family.id,
        metadata: { from: Number(ownerUserId), to: Number(newOwnerUserId) }
      }, { transaction });
    });
  }

  static async leaveFamily(userId) {
    return sequelize.transaction(async (transaction) => {
      const person = await this.getMemberPerson(userId, transaction);
      if (!person?.family_id) throw new AppError('Bạn chưa thuộc nhóm gia đình.', 400);
      const family = await Family.findByPk(person.family_id, { transaction });
      if (Number(family.owner_user_id) === Number(userId)) throw new AppError('Chủ nhà phải chuyển quyền trước khi rời nhóm.', 400);
      const managedDependents = await Person.count({ where: { manager_user_id: userId, family_id: family.id, person_type: 'dependent', status: 'active' }, transaction });
      if (managedDependents > 0) throw new AppError('Bạn đang quản lý Người phụ thuộc. Hãy chuyển người quản lý trước khi rời nhóm.', 400);
      const profile = await HealthProfile.findOne({ where: { person_id: person.id }, transaction });
      person.family_id = null; await person.save({ transaction });
      await ProfilePermission.destroy({ where: { grantee_user_id: userId }, transaction });
      if (profile) await ProfilePermission.destroy({ where: { health_profile_id: profile.id }, transaction });
    });
  }

  static async removeMember(ownerUserId, memberUserId) {
    const owner = await this.getMemberPerson(ownerUserId);
    if (!owner?.family_id) throw new AppError('Không có nhóm gia đình.', 400);
    const family = await Family.findByPk(owner.family_id);
    if (Number(family.owner_user_id) !== Number(ownerUserId)) throw new AppError('Chỉ Chủ nhà được xóa Thành viên.', 403);
    if (Number(memberUserId) === Number(ownerUserId)) throw new AppError('Không thể tự xóa Chủ nhà.', 400);
    const managed = await Person.count({ where: { manager_user_id: memberUserId, family_id: family.id, person_type: 'dependent', status: 'active' } });
    if (managed > 0) throw new AppError('Thành viên này đang quản lý Người phụ thuộc. Hãy chuyển người quản lý trước.', 400);
    const person = await Person.findOne({ where: { user_id: memberUserId, family_id: family.id, person_type: 'member', status: 'active' } });
    if (!person) throw new AppError('Không tìm thấy Thành viên trong nhóm.', 404);
    await sequelize.transaction(async (transaction) => {
      const profile = await HealthProfile.findOne({ where: { person_id: person.id }, transaction });
      person.family_id = null; await person.save({ transaction });
      await ProfilePermission.destroy({ where: { grantee_user_id: memberUserId }, transaction });
      if (profile) await ProfilePermission.destroy({ where: { health_profile_id: profile.id }, transaction });
    });
  }

  static async createDependent(ownerUserId, data) {
    if (!data.authorizedRepresentative || !data.healthConsent) throw new AppError('Cần xác nhận quyền đại diện và consent xử lý dữ liệu sức khỏe của Người phụ thuộc.', 400);
    const owner = await this.getMemberPerson(ownerUserId);
    const family = owner?.family_id ? await Family.findByPk(owner.family_id) : null;
    if (!family || Number(family.owner_user_id) !== Number(ownerUserId)) throw new AppError('Chỉ Chủ nhà được tạo Người phụ thuộc.', 403);
    const manager = await Person.findOne({ where: { user_id: data.managerUserId, family_id: family.id, person_type: 'member', status: 'active' } });
    if (!manager) throw new AppError('Người quản lý hồ sơ phải là Thành viên đang hoạt động trong nhóm.', 400);
    return sequelize.transaction(async (transaction) => {
      const fullName = validation.text(data.fullName, { field: 'Họ tên người phụ thuộc', required: true, max: 120 });
      const dateOfBirth = data.dateOfBirth ? parseDateOnly(data.dateOfBirth, 'Ngày sinh') : null;
      if (dateOfBirth && dateOfBirth > toDateOnlyLocal()) throw new AppError('Ngày sinh không được ở tương lai.', 422);
      const gender = validation.oneOf(data.gender || 'unspecified', ['male','female','other','unspecified'], { field: 'Giới tính' });
      const relationship = validation.text(data.relationship, { field: 'Quan hệ', max: 50 });
      const person = await Person.create({
        family_id: family.id,
        user_id: null,
        person_type: 'dependent',
        full_name: fullName,
        date_of_birth: dateOfBirth,
        gender,
        relationship_to_manager: relationship,
        manager_user_id: data.managerUserId,
        status: 'active'
      }, { transaction });
      const profile = await HealthProfile.create({ person_id: person.id, blood_type: 'unknown' }, { transaction });
      await ConsentService.grant(ownerUserId, 'dependent_health_data', env.healthConsentVersion, person.id, transaction);
      await AuditService.write({ actorUserId: ownerUserId, action: 'DEPENDENT_CREATED', resourceType: 'person', resourceId: person.id, metadata: { managerUserId: Number(data.managerUserId) } }, { transaction });
      return { person, profile };
    });
  }

  static async updateDependent(ownerUserId, dependentId, data) {
    const owner = await this.getMemberPerson(ownerUserId);
    const family = owner?.family_id ? await Family.findByPk(owner.family_id) : null;
    if (!family || Number(family.owner_user_id) !== Number(ownerUserId)) throw new AppError('Chỉ Chủ nhà được quản lý Người phụ thuộc.', 403);

    return sequelize.transaction(async (transaction) => {
      const dependent = await Person.findOne({
        where: { id: dependentId, family_id: family.id, person_type: 'dependent' },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!dependent) throw new AppError('Không tìm thấy Người phụ thuộc.', 404);

      if (data.managerUserId) {
        const manager = await Person.findOne({
          where: { user_id: data.managerUserId, family_id: family.id, person_type: 'member', status: 'active' },
          transaction
        });
        if (!manager) throw new AppError('Người quản lý mới không hợp lệ.', 400);
        const oldManager = dependent.manager_user_id;
        if (Number(oldManager) !== Number(data.managerUserId)) {
          if (!data.healthConsent) throw new AppError('Khi chuyển người quản lý, cần xác nhận consent dữ liệu sức khỏe của Người phụ thuộc.', 400);
          dependent.manager_user_id = data.managerUserId;
          await ConsentService.grant(ownerUserId, 'dependent_health_data', env.healthConsentVersion, dependent.id, transaction);
          await AuditService.write({
            actorUserId: ownerUserId,
            action: 'DEPENDENT_MANAGER_TRANSFER',
            resourceType: 'person',
            resourceId: dependent.id,
            metadata: { from: oldManager, to: Number(data.managerUserId) }
          }, { transaction });
        }
      }
      if (data.fullName !== undefined) dependent.full_name = validation.text(data.fullName, { field: 'Họ tên người phụ thuộc', required: true, max: 120 });
      if (data.dateOfBirth !== undefined) { const dob=data.dateOfBirth ? parseDateOnly(data.dateOfBirth,'Ngày sinh') : null; if(dob && dob>toDateOnlyLocal()) throw new AppError('Ngày sinh không được ở tương lai.',422); dependent.date_of_birth=dob; }
      if (data.gender) dependent.gender = validation.oneOf(data.gender, ['male','female','other','unspecified'], { field: 'Giới tính' });
      if (data.relationship !== undefined) dependent.relationship_to_manager = validation.text(data.relationship, { field: 'Quan hệ', max: 50 });
      if (data.status) dependent.status = validation.oneOf(data.status, ['active', 'inactive'], { field: 'Trạng thái người phụ thuộc' });
      await dependent.save({ transaction });
      if (dependent.status === 'inactive') {
        const profile = await HealthProfile.findOne({ where: { person_id: dependent.id }, transaction });
        if (profile) await ReminderService.cancelProfilePendingTasks(profile.id, transaction);
      }
      return dependent;
    });
  }
}

module.exports = FamilyService;
