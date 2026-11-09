const path = require('path');
const { sequelize, User, Facility, FacilityDocument } = require('../models');
const FileStorageService = require('../services/FileStorageService');
const AuditService = require('../services/AuditService');
const AppError = require('../utils/AppError');

exports.dashboard = async (req, res, next) => {
  try {
    const [pending, approved, rejected, locked] = await Promise.all([
      Facility.count({ where: { verification_status: 'pending' } }),
      Facility.count({ where: { verification_status: 'approved' } }),
      Facility.count({ where: { verification_status: 'rejected' } }),
      User.count({ where: { account_type: 'facility', status: 'locked' } })
    ]);
    res.render('admin/dashboard', { title: 'Tổng quan quản trị', counts: { pending, approved, rejected, locked } });
  } catch (e) { next(e); }
};

exports.facilities = async (req, res, next) => {
  try {
    const facilities = await Facility.findAll({
      include: [{ model: User, as: 'user' }, { model: FacilityDocument, as: 'documents' }],
      order: [['created_at', 'DESC']]
    });
    res.render('admin/facilities', { title: 'Quản lý tài khoản cơ sở y tế', facilities });
  } catch (e) { next(e); }
};

exports.facilityAction = async (req, res, next) => {
  try {
    await sequelize.transaction(async transaction=>{
      const facility = await Facility.findByPk(req.params.id, { include: [{ model: User, as: 'user' }], transaction, lock: transaction.LOCK.UPDATE });
      if (!facility?.user) throw new AppError('Không tìm thấy cơ sở y tế.',404);
      const action = req.body.action;
      if (action === 'approve') {
        if (facility.verification_status !== 'pending') throw new AppError('Chỉ hồ sơ đang chờ duyệt mới có thể phê duyệt.',409);
        facility.verification_status='approved'; facility.reviewed_at=new Date(); facility.reviewed_by_user_id=req.user.id; facility.rejection_reason=null;
        await facility.save({transaction}); await AuditService.write({actorUserId:req.user.id,action:'FACILITY_APPROVED',resourceType:'facility',resourceId:facility.id},{transaction});
      } else if (action === 'reject') {
        if (facility.verification_status !== 'pending') throw new AppError('Chỉ hồ sơ đang chờ duyệt mới có thể từ chối.',409);
        facility.verification_status='rejected'; facility.reviewed_at=new Date(); facility.reviewed_by_user_id=req.user.id; facility.rejection_reason=req.body.reason?.trim()||'Hồ sơ chưa đáp ứng yêu cầu xác minh.';
        await facility.save({transaction}); await AuditService.write({actorUserId:req.user.id,action:'FACILITY_REJECTED',resourceType:'facility',resourceId:facility.id,metadata:{reason:facility.rejection_reason}},{transaction});
      } else if (action === 'lock') {
        if (facility.user.status === 'locked') throw new AppError('Tài khoản cơ sở đã bị khóa.',409);
        facility.user.status='locked'; facility.user.auth_version=Number(facility.user.auth_version||1)+1; await facility.user.save({transaction});
        await AuditService.write({actorUserId:req.user.id,action:'FACILITY_ACCOUNT_LOCKED',resourceType:'facility',resourceId:facility.id},{transaction});
      } else if (action === 'unlock') {
        if (facility.user.status !== 'locked') throw new AppError('Tài khoản cơ sở hiện không bị khóa.',409);
        facility.user.status='active'; await facility.user.save({transaction}); await AuditService.write({actorUserId:req.user.id,action:'FACILITY_ACCOUNT_UNLOCKED',resourceType:'facility',resourceId:facility.id},{transaction});
      } else throw new AppError('Hành động quản trị không hợp lệ.',400);
    });
    req.session.flash={type:'success',message:'Đã cập nhật trạng thái cơ sở y tế.'}; res.redirect('/admin/facilities');
  } catch(e){next(e);}
};

exports.downloadDocument = async (req, res, next) => {
  try {
    const doc = await FacilityDocument.findOne({ where: { id: req.params.documentId, facility_id: req.params.id } });
    if (!doc) return res.status(404).render('errors/404', { title: 'Không tìm thấy tài liệu' });
    const absolute = FileStorageService.resolve(doc.storage_key);
    await AuditService.write({
      actorUserId: req.user.id,
      action: 'FACILITY_DOCUMENT_VIEWED',
      resourceType: 'facility_document',
      resourceId: doc.id,
      metadata: { facilityId: doc.facility_id }
    });
    res.download(absolute, path.basename(doc.original_name));
  } catch (e) { next(e); }
};
