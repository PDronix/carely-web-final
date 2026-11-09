const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, PasswordResetToken, sequelize } = require('../models');
const env = require('../config/env');
const MailService = require('./MailService');
const AuditService = require('./AuditService');
const AppError = require('../utils/AppError');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

class PasswordResetService {
  static async request(email) {
    // Fail before invalidating existing tokens when production mail delivery is unavailable.
    if (env.nodeEnv === 'production' && env.mailMode !== 'smtp') {
      throw new AppError('Tính năng khôi phục mật khẩu chưa được cấu hình email.', 503);
    }
    const normalized = String(email || '').trim().toLowerCase();
    const user = await User.findOne({ where: { email: normalized } });
    if (!user || user.status === 'locked') return;
    await PasswordResetToken.update({ used_at: new Date() }, { where: { user_id: user.id, used_at: null } });
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + env.passwordResetMinutes * 60 * 1000);
    await PasswordResetToken.create({ user_id: user.id, token_hash: tokenHash, expires_at: expiresAt });
    const resetUrl = `${env.appUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;
    await MailService.sendPasswordReset(user.email, resetUrl);
    await AuditService.write({ actorUserId: user.id, action: 'AUTH_PASSWORD_RESET_REQUEST', resourceType: 'user', resourceId: user.id });
  }

  static async reset(token, newPassword) {
    if (!token || typeof newPassword !== 'string' || newPassword.length < 8 || !/[A-Za-zÀ-ỹ]/.test(newPassword) || !/\d/.test(newPassword)) {
      throw new AppError('Mật khẩu mới cần tối thiểu 8 ký tự và có cả chữ lẫn số.', 400);
    }
    const tokenHash = hashToken(token);
    return sequelize.transaction(async (transaction) => {
      const row = await PasswordResetToken.findOne({
        where: { token_hash: tokenHash, used_at: null, expires_at: { [Op.gt]: new Date() } },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!row) throw new AppError('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.', 400);
      const user = await User.findByPk(row.user_id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!user || user.status === 'locked') throw new AppError('Không thể đặt lại mật khẩu cho tài khoản này.', 403);
      user.password_hash = await bcrypt.hash(newPassword, 12);
      user.auth_version = Number(user.auth_version || 1) + 1;
      await user.save({ transaction });
      const usedAt = new Date();
      await PasswordResetToken.update({ used_at: usedAt }, { where: { user_id: user.id, used_at: null }, transaction });
      await AuditService.write({ actorUserId: user.id, action: 'AUTH_PASSWORD_RESET_COMPLETE', resourceType: 'user', resourceId: user.id }, { transaction });
      return user;
    });
  }
}

module.exports = PasswordResetService;
