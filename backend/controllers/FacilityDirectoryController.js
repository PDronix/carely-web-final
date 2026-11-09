const { Facility, User } = require('../models');
const { Op } = require('sequelize');
const ProfileAccessService = require('../services/ProfileAccessService');
const AppointmentService = require('../services/AppointmentService');

exports.index = async (req, res, next) => {
  try {
    const query = String(req.query.q || '').trim().slice(0, 100);
    const rawPage = Number.parseInt(req.query.page, 10);
    const requestedPage = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
    const pageSize = 12;
    const where = { verification_status: 'approved' };
    const escapedQuery = query.replace(/[\\%_]/g, '\\$&');
    if (query) where[Op.or] = [
      { facility_name: { [Op.like]: `%${escapedQuery}%` } },
      { address: { [Op.like]: `%${escapedQuery}%` } },
      { specialty: { [Op.like]: `%${escapedQuery}%` } }
    ];
    const count = await Facility.count({ where, include: [{ model: User, as: 'user', where: { status: 'active' }, required: true }] });
    const totalPages = Math.max(1, Math.ceil(count / pageSize));
    const page = Math.min(requestedPage, totalPages);
    const facilities = await Facility.findAll({
      where,
      include: [{ model: User, as: 'user', where: { status: 'active' }, required: true }],
      order: [['facility_name', 'ASC'], ['id', 'ASC']],
      limit: pageSize, offset: (page - 1) * pageSize
    });
    const profiles = (await ProfileAccessService.listAccessibleProfiles(req.user.id)).filter((x) => x.isOwner || x.isManager);
    res.render('facilities/index', { title: 'Cơ sở y tế', facilities, profiles, query, page, totalPages, count });
  } catch (e) { next(e); }
};

exports.requestAppointment = async (req, res, next) => {
  try {
    await AppointmentService.createRequest(req.user.id, {
      profileId: req.body.profileId,
      facilityId: req.params.id,
      requestedFor: req.body.requestedFor,
      reason: req.body.reason
    });
    req.session.flash = { type: 'success', message: 'Đã gửi yêu cầu đặt lịch. Quyền hồ sơ chưa được cấp cho đến khi cơ sở xác nhận.' };
    res.redirect('/appointments');
  } catch (e) { next(e); }
};
