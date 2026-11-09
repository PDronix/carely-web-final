const { Op } = require('sequelize');
const { sequelize, HealthProfile, Person, ProfilePermission, User, UserConsent } = require('../models');
const AppError = require('../utils/AppError');
const env = require('../config/env');
const AuditService = require('./AuditService');
const ConsentService = require('./ConsentService');
const { isActiveFamilyManager } = require('./ProfilePolicy');

class ProfileAccessService {
  static capabilities(accessLevel, { isOwner = false, isManager = false } = {}) {
    const full = accessLevel === 'full';
    const managesProfile = Boolean(isOwner || isManager);
    return {
      canView: accessLevel !== 'none',
      canEditHealthData: full,
      canRecordMetric: full,
      canManageThreshold: full,
      canManageMedication: full,
      canCompleteCareTask: full,
      canManagePersonalAppointment: full,
      canWriteCareNote: full,
      canManagePermissions: managesProfile,
      canBookFacility: managesProfile
    };
  }

  static async profileHasActiveConsent(personId) { return ConsentService.hasActiveHealthConsentForSubject(personId); }

  static async activeMemberFor(userId) {
    return Person.findOne({ where: { user_id: userId, person_type: 'member', status: 'active' } });
  }

  static async getAccessLevel(userId, profileId) {
    const profile = await HealthProfile.findByPk(profileId, { include: [{ model: Person, as: 'person' }] });
    if (!profile?.person || profile.person.status !== 'active') return 'none';
    if (!(await this.profileHasActiveConsent(profile.person.id))) return 'none';
    const person = profile.person;
    if (Number(person.user_id) === Number(userId)) return 'full';
    if (person.person_type === 'dependent' && isActiveFamilyManager(person, await this.activeMemberFor(userId), userId)) return 'full';
    const permission = await ProfilePermission.findOne({ where: { health_profile_id: profileId, grantee_user_id: userId } });
    if (!permission) return 'none';
    const grantee = await Person.findOne({ where: { user_id: userId, person_type: 'member', status: 'active' } });
    if (!person.family_id || !grantee?.family_id || Number(person.family_id) !== Number(grantee.family_id)) return 'none';
    return permission.access_level;
  }

  static async requireAccess(userId, profileId, minimum = 'view') {
    const level = await this.getAccessLevel(userId, profileId);
    if (level === 'none' || (minimum === 'full' && level !== 'full')) throw new AppError('Bạn không có quyền phù hợp với hồ sơ sức khỏe này.', 403);
    return level;
  }

  static async canManagePermissions(userId, profileId) {
    const profile = await HealthProfile.findByPk(profileId, { include: [{ model: Person, as: 'person' }] });
    if (!profile?.person || !(await this.profileHasActiveConsent(profile.person.id))) return false;
    if (profile.person.status !== 'active') return false;
    if (Number(profile.person.user_id) === Number(userId)) return true;
    return isActiveFamilyManager(profile.person, await this.activeMemberFor(userId), userId);
  }

  static async canDelegateFacilityAccess(userId, profileId) {
    return this.canManagePermissions(userId, profileId);
  }

  static async listAccessibleProfiles(userId) {
    const directPeople = await Person.findAll({
      where: { status: 'active', [Op.or]: [{ user_id: userId }, { manager_user_id: userId }] },
      include: [{ model: HealthProfile, as: 'healthProfile' }]
    });
    const permissions = await ProfilePermission.findAll({ where: { grantee_user_id: userId } });
    const ids = permissions.map((x) => x.health_profile_id);
    const permitted = ids.length ? await HealthProfile.findAll({
      where: { id: ids },
      include: [{ model: Person, as: 'person', where: { status: 'active' }, required: true }]
    }) : [];
    const result = [];
    const activeMember = await this.activeMemberFor(userId);
    for (const person of directPeople) {
      if (!person.healthProfile || !(await this.profileHasActiveConsent(person.id))) continue;
      const isOwner = Number(person.user_id) === Number(userId);
      const isManager = isActiveFamilyManager(person, activeMember, userId);
      if (!isOwner && !isManager) continue; // Drop stale manager grants after family change.
      result.push({ profile: person.healthProfile, person, accessLevel: 'full', isManager, isOwner,
        capabilities: this.capabilities('full', { isOwner, isManager }) });
    }
    for (const profile of permitted) {
      if (!(await this.profileHasActiveConsent(profile.person.id))) continue;
      if (result.some((x) => Number(x.profile.id) === Number(profile.id))) continue;
      const permission = permissions.find((x) => Number(x.health_profile_id) === Number(profile.id));
      const effective = await this.getAccessLevel(userId, profile.id);
      if (effective === 'none') continue;
      result.push({ profile, person: profile.person, accessLevel: effective, isManager: false, isOwner: false, capabilities: this.capabilities(effective) });
    }
    return result;
  }

  static async setPermission(actorUserId, profileId, granteeUserId, accessLevel) {
    if (!(await this.canManagePermissions(actorUserId, profileId))) throw new AppError('Chỉ chủ hồ sơ hoặc người quản lý hồ sơ được quản lý quyền truy cập.', 403);
    const profile = await HealthProfile.findByPk(profileId, { include: [{ model: Person, as: 'person' }] });
    const granteePerson = await Person.findOne({ where: { user_id: granteeUserId, status: 'active' } });
    if (!profile?.person || !granteePerson || !profile.person.family_id || Number(profile.person.family_id) !== Number(granteePerson.family_id)) throw new AppError('Chỉ có thể cấp quyền cho Thành viên cùng nhóm gia đình.', 400);
    return sequelize.transaction(async transaction=>{
      if (accessLevel === 'none') {
        await ProfilePermission.destroy({ where: { health_profile_id: profileId, grantee_user_id: granteeUserId }, transaction });
        await AuditService.write({ actorUserId, action: 'PROFILE_PERMISSION_REVOKED', resourceType: 'health_profile', resourceId: profileId, metadata: { granteeUserId } },{transaction}); return;
      }
      if (!['view', 'full'].includes(accessLevel)) throw new AppError('Mức quyền không hợp lệ.', 400);
      const existing=await ProfilePermission.findOne({where:{health_profile_id:profileId,grantee_user_id:granteeUserId},transaction,lock:transaction.LOCK.UPDATE});
      if(existing){existing.access_level=accessLevel;existing.granted_by_user_id=actorUserId;await existing.save({transaction});}
      else await ProfilePermission.create({health_profile_id:profileId,grantee_user_id:granteeUserId,access_level:accessLevel,granted_by_user_id:actorUserId},{transaction});
      await AuditService.write({ actorUserId, action: 'PROFILE_PERMISSION_CHANGED', resourceType: 'health_profile', resourceId: profileId, metadata: { granteeUserId, accessLevel } },{transaction});
    });
  }

  static async familyMembersForPermission(userId, profileId) {
    if (!(await this.canManagePermissions(userId, profileId))) return [];
    const profile = await HealthProfile.findByPk(profileId, { include: [{ model: Person, as: 'person' }] });
    if (!profile?.person?.family_id) return [];
    return Person.findAll({
      where: { family_id: profile.person.family_id, person_type: 'member', status: 'active', user_id: { [Op.ne]: null } },
      include: [{ model: User, as: 'user', attributes: ['id', 'display_name', 'email'] }]
    });
  }
}

module.exports = ProfileAccessService;
