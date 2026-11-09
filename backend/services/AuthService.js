const bcrypt = require('bcryptjs');
const { sequelize, User, Person, Facility, FacilityDocument, PasswordResetToken } = require('../models');
const ConsentService = require('./ConsentService');
const AuditService = require('./AuditService');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { parseDateOnly, toDateOnlyLocal } = require('../utils/dateTime');
const validation = require('../utils/validation');

function normalizedEmail(value) { return validation.email(value); }

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8 || !/[A-Za-zÀ-ỹ]/.test(password) || !/\d/.test(password)) {
    throw new AppError('Mật khẩu cần tối thiểu 8 ký tự và có cả chữ lẫn số.', 400);
  }
}

class AuthService {
  static async registerMember({ email, password, displayName, phone, dateOfBirth, gender, acceptedTerms, acceptedPrivacy }) {
    validatePassword(password);
    if (!acceptedTerms || !acceptedPrivacy) throw new AppError('Bạn cần đồng ý Điều khoản sử dụng và Thông báo bảo vệ dữ liệu cá nhân.', 400);
    const cleanEmail = normalizedEmail(email);
    const cleanName = validation.text(displayName, { field: 'Họ tên', required: true, max: 120 });
    const cleanPhone = validation.text(phone, { field: 'Số điện thoại', max: 20 });
    const cleanGender = validation.oneOf(gender || 'unspecified', ['male','female','other','unspecified'], { field: 'Giới tính' });
    const cleanDateOfBirth = dateOfBirth ? parseDateOnly(dateOfBirth, 'Ngày sinh') : null;
    if (cleanDateOfBirth && cleanDateOfBirth > toDateOnlyLocal()) throw new AppError('Ngày sinh không được ở tương lai.', 422);

    return sequelize.transaction(async (transaction) => {
      const exists = await User.findOne({ where: { email: cleanEmail }, transaction });
      if (exists) throw new AppError('Email đã được sử dụng.', 409);
      const user = await User.create({
        email: cleanEmail,
        password_hash: await bcrypt.hash(password, 12),
        display_name: cleanName,
        phone: cleanPhone,
        account_type: 'member',
        status: 'active',
        auth_version: 1
      }, { transaction });
      const person = await Person.create({
        family_id: null,
        user_id: user.id,
        person_type: 'member',
        full_name: cleanName,
        date_of_birth: cleanDateOfBirth,
        gender: cleanGender,
        relationship_to_manager: null,
        manager_user_id: null,
        status: 'active'
      }, { transaction });
      await ConsentService.grant(user.id, 'terms', env.termsVersion, null, transaction);
      await ConsentService.grant(user.id, 'privacy', env.privacyVersion, null, transaction);
      await AuditService.write({ actorUserId: user.id, action: 'CONSENT_GRANTED', resourceType: 'user', resourceId: user.id, metadata: { types: ['terms', 'privacy'] } }, { transaction });
      return { user, person };
    });
  }

  static async registerFacility({ email, password, displayName, facilityName, phone, address, specialty, description, licenseNumber, document, acceptedTerms, acceptedPrivacy }) {
    validatePassword(password);
    if (!acceptedTerms || !acceptedPrivacy) throw new AppError('Bạn cần đồng ý Điều khoản sử dụng và Thông báo bảo vệ dữ liệu cá nhân.', 400);
    const cleanEmail = normalizedEmail(email);
    const cleanFacilityName = validation.text(facilityName, { field: 'Tên cơ sở', required: true, max: 180 });
    const cleanDisplayName = validation.text(displayName || cleanFacilityName, { field: 'Tên hiển thị', required: true, max: 120 });
    const cleanPhone = validation.text(phone, { field: 'Số điện thoại', max: 20 });
    const cleanAddress = validation.text(address, { field: 'Địa chỉ', max: 255 });
    const cleanLicense = validation.text(licenseNumber, { field: 'Mã giấy phép', required: true, max: 100 });
    if (!document) throw new AppError('Vui lòng đính kèm giấy phép hoạt động.', 400);

    return sequelize.transaction(async (transaction) => {
      const exists = await User.findOne({ where: { email: cleanEmail }, transaction });
      if (exists) throw new AppError('Email đã được sử dụng.', 409);
      const licenseExists = await Facility.findOne({ where: { license_number: cleanLicense }, transaction });
      if (licenseExists) throw new AppError('Mã giấy phép đã được đăng ký.', 409);
      const user = await User.create({
        email: cleanEmail,
        password_hash: await bcrypt.hash(password, 12),
        display_name: cleanDisplayName,
        phone: cleanPhone,
        account_type: 'facility',
        status: 'active',
        auth_version: 1
      }, { transaction });
      const facility = await Facility.create({
        user_id: user.id,
        facility_name: cleanFacilityName,
        address: cleanAddress,
        specialty: validation.text(specialty, { field: 'Chuyên khoa', max: 180 }),
        phone: cleanPhone,
        description: validation.text(description, { field: 'Mô tả cơ sở' }),
        license_number: cleanLicense,
        verification_status: 'pending'
      }, { transaction });
      await FacilityDocument.create({
        facility_id: facility.id,
        uploaded_by_user_id: user.id,
        document_type: 'operating_license',
        original_name: document.originalName,
        storage_key: document.storageKey,
        mime_type: document.mimeType,
        size_bytes: document.sizeBytes,
        sha256: document.sha256
      }, { transaction });
      await ConsentService.grant(user.id, 'terms', env.termsVersion, null, transaction);
      await ConsentService.grant(user.id, 'privacy', env.privacyVersion, null, transaction);
      await AuditService.write({ actorUserId: user.id, action: 'FACILITY_DOCUMENT_UPLOADED', resourceType: 'facility', resourceId: facility.id, metadata: { documentType: 'operating_license', sha256: document.sha256 } }, { transaction });
      return { user, facility };
    });
  }

  static async authenticate(email, password) {
    const loginEmail = String(email || '').trim().toLowerCase();
    if (!loginEmail || loginEmail.length > 254) throw new AppError('Email hoặc mật khẩu không chính xác.', 401);
    const user = await User.findOne({ where: { email: loginEmail } });
    if (!user) throw new AppError('Email hoặc mật khẩu không chính xác.', 401);
    const ok = await bcrypt.compare(password || '', user.password_hash);
    if (!ok) throw new AppError('Email hoặc mật khẩu không chính xác.', 401);
    if (user.status === 'locked') throw new AppError('Tài khoản đang bị khóa.', 403);
    user.last_login_at = new Date();
    await user.save();
    return user;
  }

  static async updateAccount(userId, { displayName, phone }) {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('Không tìm thấy tài khoản.', 404);
    user.display_name = validation.text(displayName, { field: 'Tên hiển thị', required: true, max: 120 });
    user.phone = validation.text(phone, { field: 'Số điện thoại', max: 20 });
    await user.save();
    if (user.account_type === 'member') {
      const person = await Person.findOne({ where: { user_id: user.id } });
      if (person) { person.full_name = user.display_name; await person.save(); }
    }
    if (user.account_type === 'facility') {
      const facility = await Facility.findOne({ where: { user_id: user.id } });
      if (facility) { facility.phone = user.phone; await facility.save(); }
    }
    return user;
  }

  static async changePassword(userId, currentPassword, newPassword) {
    validatePassword(newPassword);
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('Không tìm thấy tài khoản.', 404);
    const ok = await bcrypt.compare(currentPassword || '', user.password_hash);
    if (!ok) throw new AppError('Mật khẩu hiện tại không chính xác.', 400);
    user.password_hash = await bcrypt.hash(newPassword, 12);
    user.auth_version = Number(user.auth_version || 1) + 1;
    await user.save();
    await PasswordResetToken.update({ used_at:new Date() },{where:{user_id:user.id,used_at:null}});
    await AuditService.write({ actorUserId: user.id, action: 'AUTH_PASSWORD_CHANGED', resourceType: 'user', resourceId: user.id });
    return user;
  }
}

module.exports = AuthService;
