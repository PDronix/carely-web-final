const { UserConsent, HealthProfile, Person, Family, sequelize } = require('../models');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const AuditService = require('./AuditService');

class ConsentService {
  static async grant(userId, consentType, version, subjectPersonId = null, transaction = null) {
    const revokeWhere = consentType === 'dependent_health_data'
      ? { subject_person_id: subjectPersonId, consent_type: consentType, status: 'granted' }
      : { user_id: userId, subject_person_id: subjectPersonId, consent_type: consentType, status: 'granted' };
    await UserConsent.update({ status: 'revoked', revoked_at: new Date() }, { where: revokeWhere, transaction });
    return UserConsent.create({
      user_id: userId,
      subject_person_id: subjectPersonId,
      consent_type: consentType,
      document_version: version,
      status: 'granted',
      granted_at: new Date(),
      revoked_at: null
    }, { transaction });
  }

  static async hasCurrent(userId, consentType, version, subjectPersonId = null) {
    const row = await UserConsent.findOne({
      where: { user_id: userId, subject_person_id: subjectPersonId, consent_type: consentType, document_version: version, status: 'granted' },
      order: [['granted_at', 'DESC']]
    });
    return Boolean(row);
  }

  static async hasActiveHealthConsentForSubject(subjectPersonId) {
    const person = await Person.findByPk(subjectPersonId);
    if (!person || person.status !== 'active') return false;
    const isDependent = person.person_type === 'dependent';
    const where = {
      subject_person_id: subjectPersonId,
      consent_type: isDependent ? 'dependent_health_data' : 'health_data',
      document_version: env.healthConsentVersion,
      status: 'granted'
    };
    // authority is checked when granting/revoking; changing Owner/manager alone
    // must not silently invalidate a previously valid consent.
    if (!isDependent) where.user_id = person.user_id;
    const row = await UserConsent.findOne({ where, order: [['granted_at', 'DESC']] });
    return Boolean(row);
  }

  static async activateOwnHealthProfile(userId) {
    return sequelize.transaction(async (transaction) => {
      const person = await Person.findOne({ where: { user_id: userId, person_type: 'member', status: 'active' }, transaction, lock: transaction.LOCK.UPDATE });
      if (!person) throw new AppError('Không tìm thấy thông tin Thành viên.', 404);
      await this.grant(userId, 'health_data', env.healthConsentVersion, person.id, transaction);
      let profile = await HealthProfile.findOne({ where: { person_id: person.id }, transaction });
      if (!profile) profile = await HealthProfile.create({ person_id: person.id, blood_type: 'unknown' }, { transaction });
      await AuditService.write({ actorUserId: userId, action: 'CONSENT_GRANTED', resourceType: 'person', resourceId: person.id, metadata: { type: 'health_data', version: env.healthConsentVersion } }, { transaction });
      return profile;
    });
  }


  static async grantDependentHealth(userId, subjectPersonId) {
    const actor = await Person.findOne({ where: { user_id:userId, person_type:'member', status:'active' } });
    const dependent = await Person.findOne({ where: { id:subjectPersonId, person_type:'dependent', status:'active' } });
    if (!actor?.family_id || !dependent?.family_id || Number(actor.family_id)!==Number(dependent.family_id)) throw new AppError('Bạn không có quyền xác nhận dữ liệu cho người phụ thuộc này.',403);
    const family=await Family.findByPk(actor.family_id);
    const authorized = Number(dependent.manager_user_id)===Number(userId) || Number(family?.owner_user_id)===Number(userId);
    if (!authorized) throw new AppError('Chỉ Chủ nhà hoặc người quản lý hồ sơ được xác nhận dữ liệu người phụ thuộc.',403);
    return sequelize.transaction(async transaction=>{
      const consent=await this.grant(userId,'dependent_health_data',env.healthConsentVersion,dependent.id,transaction);
      await AuditService.write({actorUserId:userId,action:'CONSENT_GRANTED',resourceType:'person',resourceId:dependent.id,metadata:{type:'dependent_health_data',version:env.healthConsentVersion}},{transaction});
      return consent;
    });
  }

  static async revokeHealth(userId, subjectPersonId) {
    const person=await Person.findByPk(subjectPersonId); if(!person||person.status!=='active') throw new AppError('Không tìm thấy hồ sơ đang hoạt động.',404);
    if(person.person_type==='member'){
      if(Number(person.user_id)!==Number(userId)) throw new AppError('Bạn chỉ có thể thay đổi sự đồng ý của chính mình.',403);
      const consent=await UserConsent.findOne({where:{user_id:userId,subject_person_id:subjectPersonId,status:'granted',consent_type:'health_data'},order:[['granted_at','DESC']]});
      if(!consent) throw new AppError('Không tìm thấy sự đồng ý đang hoạt động.',404);
      consent.status='revoked';consent.revoked_at=new Date();await consent.save();
      await AuditService.write({actorUserId:userId,action:'CONSENT_REVOKED',resourceType:'person',resourceId:subjectPersonId,metadata:{type:'health_data',version:consent.document_version}});return;
    }
    const actor=await Person.findOne({where:{user_id:userId,person_type:'member',status:'active'}}); if(!actor?.family_id||Number(actor.family_id)!==Number(person.family_id)) throw new AppError('Bạn không có quyền thay đổi sự đồng ý của hồ sơ này.',403);
    const family=await Family.findByPk(actor.family_id); if(Number(person.manager_user_id)!==Number(userId)&&Number(family?.owner_user_id)!==Number(userId)) throw new AppError('Chỉ Chủ nhà hoặc người quản lý hồ sơ được thay đổi sự đồng ý này.',403);
    const active=await UserConsent.findAll({where:{subject_person_id:subjectPersonId,status:'granted',consent_type:'dependent_health_data'}}); if(!active.length) throw new AppError('Không tìm thấy sự đồng ý đang hoạt động.',404);
    await UserConsent.update({status:'revoked',revoked_at:new Date()},{where:{subject_person_id:subjectPersonId,status:'granted',consent_type:'dependent_health_data'}});
    await AuditService.write({actorUserId:userId,action:'CONSENT_REVOKED',resourceType:'person',resourceId:subjectPersonId,metadata:{type:'dependent_health_data'}});
  }
}

module.exports = ConsentService;
