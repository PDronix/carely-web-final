const { Op } = require('sequelize');
const { CareNote, HealthProfile, Person, User } = require('../models');
const ProfileAccessService = require('../services/ProfileAccessService');
const validation = require('../utils/validation');
const CareNoteService = require('../services/CareNoteService');

exports.index = async (req, res, next) => {
  try {
    const profiles = await ProfileAccessService.listAccessibleProfiles(req.user.id);
    const profileId = Number(req.query.profileId || profiles[0]?.profile?.id || 0) || null;
    const selected = profileId ? profiles.find((x) => Number(x.profile.id) === Number(profileId)) : null;
    if (profileId) await ProfileAccessService.requireAccess(req.user.id, profileId, 'view');

    const notes = profileId ? await CareNote.findAll({ where: { health_profile_id: profileId }, order: [['created_at', 'DESC']], limit: 100 }) : [];
    const userIds = [...new Set(notes.map((n) => Number(n.author_user_id)))];
    const users = userIds.length ? await User.findAll({ where: { id: { [Op.in]: userIds } } }) : [];
    const enriched = notes.map((n) => ({
      note: n,
      author: users.find((u) => Number(u.id) === Number(n.author_user_id))
    }));
    res.render('notes/index', {
      title: 'Nhật ký chăm sóc', profiles, profileId, selected,
      writable: Boolean(selected?.capabilities?.canWriteCareNote), notes: enriched
    });
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    await ProfileAccessService.requireAccess(req.user.id, req.body.profileId, 'full');
    const content = validation.text(req.body.content, { field: 'Ghi chú chăm sóc', required: true, max: 1200 });
    await CareNote.create({ health_profile_id: req.body.profileId, author_user_id: req.user.id, content });
    req.session.flash = { type: 'success', message: 'Đã thêm ghi chú vào nhật ký chăm sóc.' };
    res.redirect(`/notes?profileId=${req.body.profileId}`);
  } catch (e) { next(e); }
};


exports.update = async (req, res, next) => {
  try {
    const { profileId } = await CareNoteService.change(req.user.id, req.params.id, 'update', req.body);
    req.session.flash = { type: 'success', message: 'Đã cập nhật ghi chú.' };
    res.redirect(`/notes?profileId=${profileId}`);
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const { profileId } = await CareNoteService.change(req.user.id, req.params.id, 'delete');
    req.session.flash = { type: 'success', message: 'Đã xóa ghi chú.' };
    res.redirect(`/notes?profileId=${profileId}`);
  } catch (e) { next(e); }
};
