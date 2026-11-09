const AppointmentService = require('../services/AppointmentService');
const ProfileAccessService = require('../services/ProfileAccessService');

exports.memberIndex = async (req, res, next) => {
  try {
    const [appointments, profiles] = await Promise.all([AppointmentService.listForMember(req.user.id), ProfileAccessService.listAccessibleProfiles(req.user.id)]);
    const capabilityByProfile = new Map(profiles.map((x) => [Number(x.profile.id), x.capabilities]));
    const rows = appointments.map((a) => ({ appointment: a, canManage: Boolean(capabilityByProfile.get(Number(a.health_profile_id))?.canBookFacility) }));
    res.render('appointments/index', { title: 'Lịch hẹn với cơ sở y tế', rows });
  } catch (e) { next(e); }
};

exports.memberAction = async (req, res, next) => {
  try { await AppointmentService.memberAction(req.user.id, req.params.id, req.body.action); req.session.flash = { type: 'success', message: 'Đã cập nhật lịch hẹn.' }; res.redirect('/appointments'); } catch (e) { next(e); }
};
