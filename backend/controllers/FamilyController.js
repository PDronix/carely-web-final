const { Op } = require('sequelize');
const { Family, Person, User, FamilyInvite, FamilyJoinRequest } = require('../models');
const FamilyService = require('../services/FamilyService');
const AppError = require('../utils/AppError');

exports.index = async (req, res, next) => {
  try {
    const person = await Person.findOne({ where: { user_id: req.user.id } });
    let family = null; let members = []; let dependents = []; let invites = []; let requests = [];
    if (person?.family_id) {
      family = await Family.findByPk(person.family_id);
      members = await Person.findAll({ where: { family_id: family.id, person_type: 'member', status: 'active' }, include: [{ model: User, as: 'user' }] });
      dependents = await Person.findAll({ where: { family_id: family.id, person_type: 'dependent' }, include: [{ model: User, as: 'manager' }] });
      if (Number(family.owner_user_id) === Number(req.user.id)) {
        const now = new Date();
        const inviteCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        await FamilyInvite.update({ status: 'revoked' }, { where: { family_id: family.id, status: 'active', [Op.or]: [{ expires_at: { [Op.lte]: now } }, { created_at: { [Op.lte]: inviteCutoff } }] } });
        invites = await FamilyInvite.findAll({ where: { family_id: family.id, status: 'active', expires_at: { [Op.gt]: now }, created_at: { [Op.gt]: inviteCutoff } }, order: [['created_at', 'DESC']], limit: 1 });
        const familyInviteIds = (await FamilyInvite.findAll({ where: { family_id: family.id }, attributes: ['id'] })).map((x) => x.id);
        if (familyInviteIds.length) {
          requests = await FamilyJoinRequest.findAll({ where: { invite_id: { [Op.in]: familyInviteIds }, status: 'pending' }, order: [['requested_at', 'DESC']] });
          for (const r of requests) r.dataValues.requestUser = await User.findByPk(r.user_id);
        }
      }
    }
    const people = [...members.map((x) => ({ kind: 'member', row: x })), ...dependents.map((x) => ({ kind: 'dependent', row: x }))];
    res.render('family/index', { title: 'Gia đình', person, family, members, dependents, people, invites, requests, openDependentForm: req.query.form === 'dependent', error: null });
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try { await FamilyService.createFamily(req.user.id, req.body.name); req.session.flash = { type: 'success', message: 'Đã tạo nhóm gia đình.' }; res.redirect('/family'); } catch (e) { next(e); }
};
exports.join = async (req, res, next) => {
  try { await FamilyService.requestJoin(req.user.id, req.body.inviteCode); req.session.flash = { type: 'success', message: 'Đã gửi yêu cầu tham gia nhóm.' }; res.redirect('/family'); } catch (e) { next(e); }
};
exports.leave = async (req, res, next) => {
  try { await FamilyService.leaveFamily(req.user.id); req.session.flash = { type: 'success', message: 'Bạn đã rời nhóm gia đình.' }; res.redirect('/family'); } catch (e) { next(e); }
};
exports.createInvite = async (req, res, next) => {
  try { const invite = await FamilyService.createInvite(req.user.id); req.session.flash = { type: 'success', message: `Mã mời mới: ${invite.code}` }; res.redirect('/family'); } catch (e) { next(e); }
};
exports.reviewJoin = async (req, res, next) => {
  try {
    if (!['approve', 'reject'].includes(req.body.action)) throw new AppError('Hành động xử lý yêu cầu không hợp lệ.', 400);
    await FamilyService.approveJoin(req.user.id, req.params.id, req.body.action === 'approve');
    req.session.flash = { type: 'success', message: 'Đã xử lý yêu cầu tham gia.' };
    res.redirect('/family');
  } catch (e) { next(e); }
};
exports.transferOwner = async (req, res, next) => {
  try { await FamilyService.transferOwner(req.user.id, req.body.newOwnerUserId); req.session.flash = { type: 'success', message: 'Đã chuyển quyền Chủ nhà.' }; res.redirect('/family'); } catch (e) { next(e); }
};
exports.removeMember = async (req, res, next) => {
  try { await FamilyService.removeMember(req.user.id, req.params.userId); req.session.flash = { type: 'success', message: 'Đã xóa Thành viên khỏi nhóm.' }; res.redirect('/family'); } catch (e) { next(e); }
};
exports.createDependent = async (req, res, next) => {
  try {
    await FamilyService.createDependent(req.user.id, {
      fullName: req.body.fullName,
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      relationship: req.body.relationship,
      managerUserId: req.body.managerUserId,
      authorizedRepresentative: req.body.authorizedRepresentative === 'on',
      healthConsent: req.body.healthConsent === 'on'
    });
    req.session.flash = { type: 'success', message: 'Đã tạo người phụ thuộc và hồ sơ sức khỏe.' };
    return res.redirect('/family');
  } catch (error) {
    if (error.isOperational && !req.get('accept')?.includes('application/json') && req.get('x-requested-with') !== 'XMLHttpRequest' && req.session) {
      req.session.flash = { type: 'warning', message: error.message };
      return res.redirect(303, '/family?form=dependent');
    }
    return next(error);
  }
};
exports.updateDependent = async (req, res, next) => {
  try {
    await FamilyService.updateDependent(req.user.id, req.params.id, {
      fullName: req.body.fullName,
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      relationship: req.body.relationship,
      managerUserId: req.body.managerUserId,
      status: req.body.status,
      healthConsent: req.body.healthConsent === 'on'
    });
    req.session.flash = { type: 'success', message: 'Đã cập nhật Người phụ thuộc.' };
    res.redirect('/family');
  } catch (e) { next(e); }
};
