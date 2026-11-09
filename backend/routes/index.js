const express = require('express');
const router = express.Router();
const { requireAuth, requireRole, requireOwner, requireApprovedFacility } = require('../middlewares/auth');
const { authLimiter, passwordResetLimiter } = require('../middlewares/rateLimits');
const { facilityDocumentUpload } = require('../middlewares/upload');
const csrfProtection = require('../middlewares/csrf');

const AuthController = require('../controllers/AuthController');
const ConsentController = require('../controllers/ConsentController');
const AccountController = require('../controllers/AccountController');
const MemberController = require('../controllers/MemberController');
const FamilyController = require('../controllers/FamilyController');
const ProfileController = require('../controllers/ProfileController');
const MedicationController = require('../controllers/MedicationController');
const CareController = require('../controllers/CareController');
const MetricController = require('../controllers/MetricController');
const FacilityDirectoryController = require('../controllers/FacilityDirectoryController');
const AppointmentController = require('../controllers/AppointmentController');
const FacilityPortalController = require('../controllers/FacilityPortalController');
const NotesController = require('../controllers/NotesController');
const AdminController = require('../controllers/AdminController');

router.get('/', (req, res) => res.render('landing', { title: 'Carely — Chủ động chăm sóc, y tế kịp thời' }));
router.get('/about', (req, res) => res.render('about', { title: 'Về Carely' }));
router.get('/terms', (req, res) => res.render('terms', { title: 'Điều khoản sử dụng' }));
router.get('/privacy', (req, res) => res.render('privacy', { title: 'Thông báo bảo vệ dữ liệu cá nhân' }));

router.get('/auth', AuthController.showAuth);
router.post('/auth/login', authLimiter, AuthController.login);
router.post('/auth/register', authLimiter, facilityDocumentUpload.single('licenseFile'), csrfProtection, AuthController.register);
router.post('/auth/logout', requireAuth, AuthController.logout);
router.get('/auth/forgot-password', AuthController.showForgot);
router.post('/auth/forgot-password', passwordResetLimiter, AuthController.requestReset);
router.get('/auth/reset-password', AuthController.showReset);
router.post('/auth/reset-password', passwordResetLimiter, AuthController.resetPassword);

router.get('/account', requireAuth, AccountController.show);
router.post('/account', requireAuth, AccountController.update);
router.post('/account/password', requireAuth, AccountController.changePassword);
router.get('/account/privacy', requireAuth, ConsentController.list);
router.post('/account/privacy/revoke-health', requireRole('member'), ConsentController.revokeHealth);
router.post('/account/privacy/grant-dependent-health', requireRole('member'), ConsentController.grantDependentHealth);
router.post('/app/health-consent', requireRole('member'), ConsentController.activateHealth);

router.get('/app', requireRole('member'), MemberController.dashboard);
router.get('/family', requireRole('member'), FamilyController.index);
router.post('/family/create', requireRole('member'), FamilyController.create);
router.post('/family/join', requireRole('member'), FamilyController.join);
router.post('/family/leave', requireRole('member'), FamilyController.leave);
router.post('/family/invites', requireOwner, FamilyController.createInvite);
router.post('/family/join-requests/:id', requireOwner, FamilyController.reviewJoin);
router.post('/family/transfer-owner', requireOwner, FamilyController.transferOwner);
router.post('/family/members/:userId/remove', requireOwner, FamilyController.removeMember);
router.post('/family/dependents', requireOwner, FamilyController.createDependent);
router.post('/family/dependents/:id', requireOwner, FamilyController.updateDependent);

router.get('/profiles', requireRole('member'), ProfileController.index);
router.get('/profiles/:id', requireRole('member'), ProfileController.show);
router.post('/profiles/:id', requireRole('member'), ProfileController.update);
router.post('/profiles/:id/conditions', requireRole('member'), ProfileController.addCondition);
router.post('/profiles/:id/restrictions', requireRole('member'), ProfileController.addRestriction);
router.post('/profiles/:id/notes', requireRole('member'), ProfileController.addNote);
router.post('/profiles/:id/permissions', requireRole('member'), ProfileController.setPermission);

router.get('/medications', requireRole('member'), MedicationController.index);
router.post('/medications', requireRole('member'), MedicationController.create);
router.post('/medications/:id/update', requireRole('member'), MedicationController.update);
router.post('/medications/:id/confirm-reminder', requireRole('member'), MedicationController.confirmReminder);
router.post('/medications/:id/stop', requireRole('member'), MedicationController.stop);
router.post('/medications/:id/reminder', requireRole('member'), MedicationController.setReminder);
router.get('/care', requireRole('member'), CareController.index);
router.post('/care/tasks/:id/complete', requireRole('member'), CareController.completeTask);
router.post('/care/tasks/:id/update', requireRole('member'), CareController.updateGeneralTask);
router.post('/care/tasks/:id/cancel', requireRole('member'), CareController.cancelGeneralTask);
router.post('/care/tasks', requireRole('member'), CareController.createGeneralTask);
router.post('/care/personal-appointments', requireRole('member'), CareController.createPersonalAppointment);
router.post('/care/personal-appointments/:id/update', requireRole('member'), CareController.updatePersonalAppointment);
router.post('/care/personal-appointments/:id/cancel', requireRole('member'), CareController.cancelPersonalAppointment);
router.post('/care/personal-appointments/:id/complete', requireRole('member'), CareController.completePersonalAppointment);
router.get('/notes', requireRole('member'), NotesController.index);
router.post('/notes', requireRole('member'), NotesController.create);
router.post('/notes/:id/update', requireRole('member'), NotesController.update);
router.post('/notes/:id/delete', requireRole('member'), NotesController.remove);

router.get('/metrics', requireRole('member'), MetricController.index);
router.post('/metrics', requireRole('member'), MetricController.record);
router.post('/metrics/thresholds', requireRole('member'), MetricController.saveThreshold);

router.get('/facilities', requireRole('member'), FacilityDirectoryController.index);
router.post('/facilities/:id/appointments', requireRole('member'), FacilityDirectoryController.requestAppointment);
router.get('/appointments', requireRole('member'), AppointmentController.memberIndex);
router.post('/appointments/:id', requireRole('member'), AppointmentController.memberAction);

router.get('/facility/status', requireRole('facility'), FacilityPortalController.status);
router.post('/facility/status/resubmit', requireRole('facility'), facilityDocumentUpload.single('licenseFile'), csrfProtection, FacilityPortalController.resubmit);
router.get('/facility', requireApprovedFacility, FacilityPortalController.dashboard);
router.get('/facility/appointments', requireApprovedFacility, FacilityPortalController.appointments);
router.get('/facility/results', requireApprovedFacility, FacilityPortalController.results);
router.post('/facility/appointments/:id', requireApprovedFacility, FacilityPortalController.transition);
router.get('/facility/appointments/:id/result', requireApprovedFacility, FacilityPortalController.resultForm);
router.post('/facility/appointments/:id/result', requireApprovedFacility, FacilityPortalController.completeResult);
router.post('/facility/invoices/:invoiceId/payment', requireApprovedFacility, FacilityPortalController.updateInvoicePayment);

router.get('/admin', requireRole('admin'), AdminController.dashboard);
router.get('/admin/facilities', requireRole('admin'), AdminController.facilities);
router.post('/admin/facilities/:id', requireRole('admin'), AdminController.facilityAction);
router.get('/admin/facilities/:id/documents/:documentId', requireRole('admin'), AdminController.downloadDocument);

module.exports = router;
