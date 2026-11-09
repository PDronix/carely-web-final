const { Op } = require('sequelize');
const { sequelize, Appointment, HealthProfile, Person, VisitResult, Facility, FacilityDocument } = require('../models');
const AppointmentService = require('../services/AppointmentService');
const VisitResultService = require('../services/VisitResultService');
const FileStorageService = require('../services/FileStorageService');
const AuditService = require('../services/AuditService');
const AppError = require('../utils/AppError');
const { startOfLocalDay, endOfLocalDay } = require('../utils/dateTime');
const { classifyFacilityVisit } = require('../services/CarePolicy');

exports.status = async (req, res, next) => {
  try {
    const facility = await AppointmentService.facilityForUser(req.user.id);
    const documents = await FacilityDocument.findAll({ where: { facility_id: facility.id }, order: [['uploaded_at', 'DESC']] });
    if (facility.verification_status === 'approved') return res.redirect('/facility');
    res.render('facility/status', { title: 'Trạng thái đăng ký cơ sở', facility, documents });
  } catch (e) { next(e); }
};


exports.resubmit = async (req, res, next) => {
  let storedKey = null;
  try {
    const facility = await AppointmentService.facilityForUser(req.user.id);
    if (facility.verification_status === 'approved') throw new AppError('Cơ sở đã được phê duyệt, không cần gửi lại hồ sơ.', 409);
    const licenseNumber = String(req.body.licenseNumber || '').trim();
    if (!licenseNumber) throw new AppError('Vui lòng nhập mã giấy phép/mã cơ sở.', 400);
    const duplicate = await Facility.findOne({ where: { license_number: licenseNumber, id: { [Op.ne]: facility.id } } });
    if (duplicate) throw new AppError('Mã giấy phép đã được sử dụng bởi cơ sở khác.', 409);
    const document = await FileStorageService.inspectUpload(req.file);
    storedKey = document.storageKey;
    await sequelize.transaction(async (transaction) => {
      facility.license_number = licenseNumber;
      facility.verification_status = 'pending';
      facility.reviewed_at = null;
      facility.reviewed_by_user_id = null;
      facility.rejection_reason = null;
      await facility.save({ transaction });
      const doc = await FacilityDocument.create({
        facility_id: facility.id,
        uploaded_by_user_id: req.user.id,
        document_type: 'operating_license',
        original_name: document.originalName,
        storage_key: document.storageKey,
        mime_type: document.mimeType,
        size_bytes: document.sizeBytes,
        sha256: document.sha256
      }, { transaction });
      await AuditService.write({
        actorUserId: req.user.id,
        action: 'FACILITY_DOCUMENT_UPLOADED',
        resourceType: 'facility_document',
        resourceId: doc.id,
        metadata: { facilityId: facility.id, resubmission: true }
      }, { transaction });
    });
    storedKey = null;
    req.session.flash = { type: 'success', message: 'Đã gửi lại hồ sơ xác minh. Trạng thái chuyển về chờ duyệt.' };
    res.redirect('/facility/status');
  } catch (e) {
    if (storedKey) await FileStorageService.remove(storedKey);
    next(e);
  }
};

exports.dashboard = async (req, res, next) => {
  try {
    const facility = await AppointmentService.requireApprovedFacility(req.user.id);
    const appointments = await AppointmentService.listForFacility(req.user.id);
    const counts = appointments.reduce((acc, x) => { acc[x.status] = (acc[x.status] || 0) + 1; return acc; }, {});
    const now = new Date(); const dayStart = startOfLocalDay(now); const dayEnd = endOfLocalDay(now);
    const appointmentTime = (a) => new Date(a.confirmed_for || a.proposed_for || a.requested_for);
    const todayAppointments = appointments.filter((a) => { const d=appointmentTime(a); return d>=dayStart && d<=dayEnd && ['confirmed','completed'].includes(a.status); }).sort((a,b)=>appointmentTime(a)-appointmentTime(b));
    const visitQueue = { today: [], overdue: [], upcoming: [] };
    appointments.forEach(a => { const category = classifyFacilityVisit(a, now); if (category) visitQueue[category].push(a); });
    const needsAttention = appointments.filter((a) => a.status === 'pending' || ['today', 'overdue'].includes(classifyFacilityVisit(a, now)));
    const upcoming = appointments.filter((a) => a.status === 'confirmed' && appointmentTime(a) >= now).sort((a,b)=>appointmentTime(a)-appointmentTime(b)).slice(0,5);
    res.render('facility/dashboard', { title: 'Cổng cơ sở y tế', facility, appointments: appointments.slice(0, 8), counts, todayAppointments, needsAttention, upcoming, visitQueue });
  } catch (e) { next(e); }
};

exports.appointments = async (req, res, next) => {
  try {
    const rawPage=Number.parseInt(req.query.page,10);
    const result=await AppointmentService.pagedForFacility(req.user.id,{
      status:String(req.query.status||'all'),
      page:Number.isSafeInteger(rawPage)&&rawPage>0?rawPage:1
    });
    res.render('facility/appointments', {
      title:'Quản lý lịch hẹn', appointments:result.rows, status:result.status,
      counts:result.counts, page:result.page, totalPages:result.totalPages, total:result.total
    });
  } catch (e) { next(e); }
};

exports.results = async (req, res, next) => {
  try {
    const all = await AppointmentService.listForFacility(req.user.id);
    const appointments = all.filter((x) => x.status === 'confirmed' && !x.access_revoked_at && !x.visitResult);
    const visitQueue = { today: [], overdue: [], upcoming: [] };
    appointments.forEach(a => { const category = classifyFacilityVisit(a); if (category) visitQueue[category].push(a); });
    const completed = all.filter((x) => x.status === 'completed' && x.visitResult);
    res.render('facility/results', { title: 'Kết quả khám', appointments, visitQueue, completed });
  } catch (e) { next(e); }
};

exports.transition = async (req, res, next) => {
  try {
    await AppointmentService.facilityTransition(req.user.id, req.params.id, req.body.action, { proposedFor: req.body.proposedFor, confirmedFor: req.body.confirmedFor, note: req.body.note });
    req.session.flash = { type: 'success', message: 'Đã cập nhật trạng thái lịch hẹn.' };
    res.redirect('/facility/appointments');
  } catch (e) { next(e); }
};

exports.resultForm = async (req, res, next) => {
  try {
    const { appointment } = await AppointmentService.assertFacilityAccess(req.user.id, req.params.id);
    if (classifyFacilityVisit(appointment) === 'upcoming') throw new AppError('Chưa đến ngày khám đã xác nhận.', 409);
    const full = await Appointment.findByPk(appointment.id, { include: [{ model: HealthProfile, as: 'profile', include: [{ model: Person, as: 'person' }] }, { model: VisitResult, as: 'visitResult' }] });
    res.render('facility/result-form', { title: 'Nhập kết quả khám', appointment: full, error: null });
  } catch (e) { next(e); }
};

exports.completeResult = async (req, res, next) => {
  try {
    const prescriptions = [];
    for (let i = 0; i < 10; i += 1) {
      const name = req.body[`medName${i}`];
      if (!name) continue;
      const rawTimes = req.body[`medTimes${i}`];
      const times = (Array.isArray(rawTimes) ? rawTimes : rawTimes ? [rawTimes] : []).map((x) => String(x).trim()).filter(Boolean);
      if (times.some((x) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(x))) throw new AppError('Giờ dùng thuốc không hợp lệ.', 422);
      prescriptions.push({ name: String(name).trim(), dosage: req.body[`medDosage${i}`], instructions: req.body[`medInstructions${i}`], startDate: req.body[`medStartDate${i}`], endDate: req.body[`medEndDate${i}`], times: [...new Set(times.map((x) => `${x}:00`))] });
    }
    await VisitResultService.completeVisit(req.user.id, req.params.id, { doctorName: req.body.doctorName, examinedAt: req.body.examinedAt, diagnosis: req.body.diagnosis, conclusion: req.body.conclusion, instructions: req.body.instructions, prescriptions, invoiceAmount: req.body.invoiceAmount, invoiceNumber: req.body.invoiceNumber, paymentStatus: req.body.paymentStatus, invoiceNote: req.body.invoiceNote });
    req.session.flash = { type: 'success', message: 'Đã hoàn tất kết quả khám. Quyền truy cập hồ sơ theo lịch hẹn đã kết thúc.' };
    res.redirect('/facility/results');
  } catch (e) { next(e); }
};


exports.updateInvoicePayment = async (req, res, next) => {
  try {
    await VisitResultService.updateInvoicePayment(req.user.id, req.params.invoiceId, req.body.paymentStatus);
    req.session.flash = { type: 'success', message: 'Đã cập nhật trạng thái thanh toán hóa đơn.' };
    res.redirect('/facility/results');
  } catch (e) { next(e); }
};
