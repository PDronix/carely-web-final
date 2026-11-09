const { User, Person, Family, Facility, UserConsent } = require('../models');
const env = require('../config/env');

async function attachCurrentUser(req, res, next) {
  try {
    res.locals.currentUser = null;
    res.locals.currentPerson = null;
    res.locals.currentFamily = null;
    res.locals.currentFacility = null;
    res.locals.isOwner = false;
    res.locals.flash = req.session.flash || null;
    delete req.session.flash;

    if (!req.session.userId) return next();

    const user = await User.findByPk(req.session.userId);
    if (!user || user.status === 'locked' || Number(req.session.authVersion || 0) !== Number(user.auth_version || 1)) {
      req.session.destroy(() => {});
      return next();
    }

    req.user = user;
    res.locals.currentUser = user;

    if (user.account_type === 'member') {
      const person = await Person.findOne({ where: { user_id: user.id } });
      req.person = person;
      res.locals.currentPerson = person;
      if (person?.family_id) {
        const family = await Family.findByPk(person.family_id);
        req.family = family;
        res.locals.currentFamily = family;
        res.locals.isOwner = Boolean(family && Number(family.owner_user_id) === Number(user.id));
      }
      if (person) {
        const healthConsent = await UserConsent.findOne({
          where: { user_id: user.id, subject_person_id: person.id, consent_type: 'health_data', status: 'granted', document_version: env.healthConsentVersion }
        });
        res.locals.hasHealthConsent = Boolean(healthConsent);
      } else res.locals.hasHealthConsent = false;
    }

    if (user.account_type === 'facility') {
      const facility = await Facility.findOne({ where: { user_id: user.id } });
      req.facility = facility;
      res.locals.currentFacility = facility;
    }

    next();
  } catch (error) { next(error); }
}

function requireAuth(req, res, next) {
  if (!req.user) {
    req.session.returnTo = req.method === 'GET' && req.originalUrl.startsWith('/') && !req.originalUrl.startsWith('//') ? req.originalUrl : '/app';
    req.session.flash = { type: 'warning', message: 'Vui lòng đăng nhập để tiếp tục.' };
    return res.redirect('/auth?mode=login');
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return requireAuth(req, res, next);
    if (!roles.includes(req.user.account_type)) return res.status(403).render('errors/403', { title: 'Không có quyền truy cập' });
    next();
  };
}

function requireOwner(req, res, next) {
  if (!req.user) return requireAuth(req, res, next);
  if (req.user.account_type !== 'member' || !req.family || Number(req.family.owner_user_id) !== Number(req.user.id)) {
    return res.status(403).render('errors/403', { title: 'Chỉ Chủ nhà được thực hiện thao tác này' });
  }
  next();
}

function requireApprovedFacility(req, res, next) {
  if (!req.user) return requireAuth(req, res, next);
  if (req.user.account_type !== 'facility') return res.status(403).render('errors/403', { title: 'Không có quyền truy cập' });
  if (!req.facility || req.facility.verification_status !== 'approved') return res.redirect('/facility/status');
  next();
}

module.exports = { attachCurrentUser, requireAuth, requireRole, requireOwner, requireApprovedFacility };
