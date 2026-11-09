const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;
if (env.mailMode === 'smtp') {
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined
  });
}

class MailService {
  static async sendPasswordReset(email, resetUrl) {
    if (env.mailMode !== 'smtp') {
      // Never log a credential-reset URL in production: logs may be widely accessible.
      if (env.nodeEnv === 'production') {
        const AppError = require('../utils/AppError');
        throw new AppError('Tính năng khôi phục mật khẩu chưa được cấu hình email.', 503);
      }
      console.log(`[Carely][DEV MAIL] Reset password for ${email}: ${resetUrl}`);
      return;
    }
    await transporter.sendMail({
      from: env.smtp.from,
      to: email,
      subject: 'Đặt lại mật khẩu Carely',
      text: `Bạn đã yêu cầu đặt lại mật khẩu Carely. Link có hiệu lực trong ${env.passwordResetMinutes} phút: ${resetUrl}`,
      html: `<p>Bạn đã yêu cầu đặt lại mật khẩu Carely.</p><p><a href="${resetUrl}">Đặt lại mật khẩu</a></p><p>Link có hiệu lực trong ${env.passwordResetMinutes} phút.</p>`
    });
  }
}

module.exports = MailService;
