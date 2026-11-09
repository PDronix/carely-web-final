const AuthService = require('../services/AuthService');
const { Facility } = require('../models');
const AuditService = require('../services/AuditService');
const validation = require('../utils/validation');

exports.show = async (req, res, next) => {
  try {
    const facility = req.user.account_type === 'facility' ? await Facility.findOne({ where: { user_id: req.user.id } }) : null;
    res.render('member/account', { title: 'Thông tin tài khoản', facility, error: null });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    await AuthService.updateAccount(req.user.id, { displayName: req.body.displayName, phone: req.body.phone });
    if (req.user.account_type === 'facility') {
      const facility = await Facility.findOne({ where: { user_id: req.user.id } });
      if (facility) {
        const nextName = req.body.facilityName?.trim() || facility.facility_name;
        const nextAddress = req.body.address?.trim() || null;
        const nextSpecialty = validation.text(req.body.specialty, { field: 'Chuyên khoa', max: 180 });
        const identityChanged = nextName !== facility.facility_name || nextAddress !== facility.address || nextSpecialty !== facility.specialty;
        facility.facility_name = nextName; facility.address = nextAddress; facility.specialty = nextSpecialty; facility.description = req.body.description?.trim() || null;
        if (identityChanged && facility.verification_status === 'approved') {
          facility.verification_status = 'pending'; facility.reviewed_at = null; facility.reviewed_by_user_id = null; facility.rejection_reason = null;
          await AuditService.write({ actorUserId:req.user.id, action:'FACILITY_IDENTITY_CHANGED', resourceType:'facility', resourceId:facility.id });
        }
        await facility.save();
      }
    }
    req.session.flash = { type: 'success', message: 'Đã cập nhật thông tin tài khoản.' };
    res.redirect('/account');
  } catch (e) { next(e); }
};

exports.changePassword = async (req, res, next) => {
  try {
    if (req.body.newPassword !== req.body.confirmPassword) throw Object.assign(new Error('Mật khẩu xác nhận không khớp.'), { isOperational: true, statusCode: 400 });
    const user = await AuthService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    req.session.authVersion = user.auth_version;
    req.session.flash = { type: 'success', message: 'Đã đổi mật khẩu và vô hiệu hóa các phiên cũ.' };
    res.redirect('/account');
  } catch (e) { next(e); }
};
