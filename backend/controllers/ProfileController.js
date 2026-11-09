const {
  HealthProfile,
  Person,
  MedicalCondition,
  HealthRestriction,
  CareNote,
  ProfilePermission,
  User
} = require('../models');
const ProfileAccessService = require('../services/ProfileAccessService');
const AppError = require('../utils/AppError');
const { parseDateOnly, toDateOnlyLocal } = require('../utils/dateTime');
const validation = require('../utils/validation');

exports.index = async (req, res, next) => {
  try {
    const profiles = await ProfileAccessService.listAccessibleProfiles(req.user.id);
    res.render('profiles/index', { title: 'Hồ sơ sức khỏe', profiles });
  } catch (e) { next(e); }
};

exports.show = async (req, res, next) => {
  try {
    const profileId = req.params.id;
    const accessLevel = await ProfileAccessService.requireAccess(req.user.id, profileId, 'view');
    const profile = await HealthProfile.findByPk(profileId, { include: [{ model: Person, as: 'person' }] });
    const canManagePermissions = await ProfileAccessService.canManagePermissions(req.user.id, profileId);
    const [conditions, restrictions, notes, permissions, familyMembers] = await Promise.all([
      MedicalCondition.findAll({ where: { health_profile_id: profileId }, order: [['created_at', 'DESC']] }),
      HealthRestriction.findAll({ where: { health_profile_id: profileId }, order: [['created_at', 'DESC']] }),
      CareNote.findAll({ where: { health_profile_id: profileId }, order: [['created_at', 'DESC']] }),
      canManagePermissions
        ? ProfilePermission.findAll({ where: { health_profile_id: profileId }, include: [{ model: User, as: 'grantee', attributes: ['id', 'display_name'] }] })
        : Promise.resolve([]),
      ProfileAccessService.familyMembersForPermission(req.user.id, profileId)
    ]);
    const capabilities = ProfileAccessService.capabilities(accessLevel, { isOwner: Number(profile.person.user_id) === Number(req.user.id), isManager: Number(profile.person.manager_user_id) === Number(req.user.id) });
    res.render('profiles/show', {
      title: `Hồ sơ - ${profile.person.full_name}`,
      profile,
      accessLevel,
      conditions,
      restrictions,
      notes,
      permissions,
      familyMembers,
      canManagePermissions,
      capabilities
    });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    await ProfileAccessService.requireAccess(req.user.id, req.params.id, 'full');
    const profile = await HealthProfile.findByPk(req.params.id);
    profile.blood_type = validation.oneOf(req.body.bloodType || 'unknown', ['A+','A-','B+','B-','AB+','AB-','O+','O-','unknown'], { field: 'Nhóm máu' });
    profile.general_note = validation.text(req.body.generalNote, { field: 'Ghi chú chung' });
    await profile.save();
    req.session.flash = { type: 'success', message: 'Đã cập nhật hồ sơ sức khỏe.' };
    res.redirect(`/profiles/${profile.id}`);
  } catch (e) { next(e); }
};

exports.addCondition = async (req, res, next) => {
  try {
    await ProfileAccessService.requireAccess(req.user.id, req.params.id, 'full');
    const conditionName = validation.text(req.body.conditionName, { field: 'Tên bệnh/tình trạng', required: true, max: 180 });
    const diagnosedOn = req.body.diagnosedOn ? parseDateOnly(req.body.diagnosedOn, 'Ngày chẩn đoán') : null;
    if (diagnosedOn && diagnosedOn > toDateOnlyLocal()) throw new AppError('Ngày chẩn đoán không được ở tương lai.', 422);
    const status = validation.oneOf(req.body.status || 'active', ['active','resolved'], { field: 'Trạng thái bệnh án' });
    await MedicalCondition.create({
      health_profile_id: req.params.id,
      condition_name: conditionName,
      diagnosed_on: diagnosedOn,
      status,
      note: validation.text(req.body.note, { field: 'Ghi chú' }),
      source_type: 'member',
      visit_result_id: null,
      created_by_user_id: req.user.id
    });
    res.redirect(`/profiles/${req.params.id}`);
  } catch (e) { next(e); }
};

exports.addRestriction = async (req, res, next) => {
  try {
    await ProfileAccessService.requireAccess(req.user.id, req.params.id, 'full');
    const restrictionType = validation.oneOf(req.body.restrictionType, ['allergy','dietary','other'], { field: 'Loại hạn chế' });
    const name = validation.text(req.body.name, { field: 'Tên dị ứng/kiêng khem', required: true, max: 180 });
    await HealthRestriction.create({
      health_profile_id: req.params.id,
      restriction_type: restrictionType,
      name,
      note: validation.text(req.body.note, { field: 'Ghi chú' }),
      created_by_user_id: req.user.id
    });
    res.redirect(`/profiles/${req.params.id}`);
  } catch (e) { next(e); }
};

exports.addNote = async (req, res, next) => {
  try {
    await ProfileAccessService.requireAccess(req.user.id, req.params.id, 'full');
    const content = validation.text(req.body.content, { field: 'Ghi chú chăm sóc', max: 1200 });
    if (!content) return res.redirect(`/profiles/${req.params.id}`);
    await CareNote.create({ health_profile_id: req.params.id, author_user_id: req.user.id, content });
    res.redirect(`/profiles/${req.params.id}`);
  } catch (e) { next(e); }
};

exports.setPermission = async (req, res, next) => {
  try {
    await ProfileAccessService.setPermission(req.user.id, req.params.id, req.body.granteeUserId, req.body.accessLevel);
    req.session.flash = { type: 'success', message: 'Đã cập nhật quyền truy cập hồ sơ.' };
    res.redirect(`/profiles/${req.params.id}`);
  } catch (e) { next(e); }
};
