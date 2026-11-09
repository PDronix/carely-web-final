const AuthService = require('../services/AuthService');
const PasswordResetService = require('../services/PasswordResetService');
const FileStorageService = require('../services/FileStorageService');
const AuditService = require('../services/AuditService');
const env = require('../config/env');

function renderAuth(res, options = {}) {
  return res.render('auth/index', {
    title: options.title || 'Đăng nhập / Đăng ký',
    mode: options.mode || 'login',
    accountType: options.accountType || 'member',
    error: options.error || null,
    form: options.form || {}
  });
}

function establishSession(req, user, rememberMe, next, callback) {
  req.session.regenerate((error) => {
    if (error) return next(error);
    req.session.userId = user.id;
    req.session.authVersion = user.auth_version || 1;
    if (rememberMe) {
      req.session.cookie.maxAge = env.rememberMeDays * 24 * 60 * 60 * 1000;
    } else {
      // Session cookie: removed when the browser session ends.
      req.session.cookie.maxAge = null;
      req.session.cookie.expires = null;
    }
    callback();
  });
}

exports.showAuth = (req, res) => renderAuth(res, {
  mode: req.query.mode === 'register' ? 'register' : 'login',
  accountType: req.query.type === 'facility' ? 'facility' : 'member'
});

exports.login = async (req, res, next) => {
  try {
    const user = await AuthService.authenticate(req.body.email, req.body.password);
    await AuditService.write({ actorUserId: user.id, action: 'AUTH_LOGIN_SUCCESS', resourceType: 'user', resourceId: user.id });
    const returnTo = req.session.returnTo;
    establishSession(req, user, req.body.rememberMe === 'on', next, () => {
      req.session.flash = { type: 'success', message: `Chào mừng ${user.display_name} quay lại Carely.` };
      const destination = returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')
        ? returnTo
        : user.account_type === 'member' ? '/app'
          : user.account_type === 'facility' ? '/facility/status' : '/admin';
      // Persist the regenerated login session before returning the redirect to the client.
      req.session.save((saveError) => {
        if (saveError) return next(saveError);
        return res.redirect(destination);
      });
    });
  } catch (error) {
    if (error.isOperational) {
      await AuditService.write({ action: 'AUTH_LOGIN_FAILURE', resourceType: 'auth', outcome: 'denied' });
      return renderAuth(res.status(error.statusCode), { mode: 'login', error: error.message, form: { email: req.body.email } });
    }
    next(error);
  }
};

exports.register = async (req, res, next) => {
  const accountType = req.body.accountType === 'facility' ? 'facility' : 'member';
  let storedKey = null;
  try {
    if (req.body.password !== req.body.confirmPassword) throw Object.assign(new Error('Mật khẩu xác nhận không khớp.'), { isOperational: true, statusCode: 400 });
    if (accountType === 'facility') {
      const document = await FileStorageService.inspectUpload(req.file);
      storedKey = document.storageKey;
      const { user } = await AuthService.registerFacility({
        email: req.body.email,
        password: req.body.password,
        displayName: req.body.displayName,
        facilityName: req.body.facilityName,
        phone: req.body.phone,
        address: req.body.address,
        specialty: req.body.specialty,
        description: req.body.description,
        licenseNumber: req.body.licenseNumber,
        document,
        acceptedTerms: req.body.acceptTerms === 'on',
        acceptedPrivacy: req.body.acceptPrivacy === 'on'
      });
      establishSession(req, user, false, next, () => res.redirect('/facility/status'));
      return;
    }
    if (req.file) await FileStorageService.remove(req.file.filename);
    const { user } = await AuthService.registerMember({
      email: req.body.email,
      password: req.body.password,
      displayName: req.body.displayName,
      phone: req.body.phone,
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      acceptedTerms: req.body.acceptTerms === 'on',
      acceptedPrivacy: req.body.acceptPrivacy === 'on'
    });
    establishSession(req, user, false, next, () => {
      req.session.flash = { type: 'success', message: 'Tạo tài khoản thành công. Hãy hoàn tất bước consent dữ liệu sức khỏe để sử dụng đầy đủ Carely.' };
      res.redirect('/app');
    });
  } catch (error) {
    if (storedKey) await FileStorageService.remove(storedKey);
    else if (req.file?.filename) await FileStorageService.remove(req.file.filename);
    if (error.isOperational) return renderAuth(res.status(error.statusCode || 400), { mode: 'register', accountType, error: error.message, form: req.body });
    next(error);
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie(env.sessionCookieName);
    res.redirect('/');
  });
};

exports.showForgot = (req, res) => res.render('auth/forgot-password', { title: 'Quên mật khẩu', message: null, error: null });
exports.requestReset = async (req, res, next) => {
  try {
    await PasswordResetService.request(req.body.email);
    res.render('auth/forgot-password', { title: 'Quên mật khẩu', error: null, message: 'Nếu email tồn tại và hợp lệ, Carely đã gửi hướng dẫn đặt lại mật khẩu.' });
  } catch (e) { next(e); }
};
exports.showReset = (req, res) => res.render('auth/reset-password', { title: 'Đặt lại mật khẩu', token: req.query.token || '', error: null });
exports.resetPassword = async (req, res, next) => {
  try {
    if (req.body.password !== req.body.confirmPassword) throw Object.assign(new Error('Mật khẩu xác nhận không khớp.'), { isOperational: true, statusCode: 400 });
    await PasswordResetService.reset(req.body.token, req.body.password);
    req.session.flash = { type: 'success', message: 'Mật khẩu đã được đặt lại. Bạn có thể đăng nhập.' };
    res.redirect('/auth?mode=login');
  } catch (e) {
    if (e.isOperational) return res.status(e.statusCode).render('auth/reset-password', { title: 'Đặt lại mật khẩu', token: req.body.token, error: e.message });
    next(e);
  }
};
