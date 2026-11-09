const ConsentService = require('../services/ConsentService');
const { UserConsent, Person, Family, HealthProfile } = require('../models');
const env = require('../config/env');
const ReminderService = require('../services/ReminderService');

exports.activateHealth = async (req, res, next) => {
  try {
    if (req.body.acceptHealth !== 'on') throw Object.assign(new Error('Bạn cần đồng ý việc xử lý dữ liệu sức khỏe để kích hoạt hồ sơ.'), { isOperational: true, statusCode: 400 });
    const profile = await ConsentService.activateOwnHealthProfile(req.user.id);
    await ReminderService.syncProfile(profile.id);
    req.session.flash = { type: 'success', message: 'Đã kích hoạt hồ sơ sức khỏe cá nhân.' };
    res.redirect('/app');
  } catch (e) { next(e); }
};

exports.list = async (req, res, next) => {
  try {
    const consents = await UserConsent.findAll({ where: { user_id: req.user.id }, order: [['created_at', 'DESC']] });
    const personIds = [...new Set(consents.map((c) => Number(c.subject_person_id)).filter(Boolean))];
    const people = personIds.length ? await Person.findAll({ where: { id: personIds } }) : [];
    const personNames = Object.fromEntries(people.map((p) => [String(p.id), p.full_name]));
    const actor = await Person.findOne({ where: { user_id: req.user.id, person_type: 'member', status: 'active' } });
    const dependentConsentCandidates = [];
    const managedDependentActive = [];
    if (actor?.family_id) {
      const family = await Family.findByPk(actor.family_id);
      const deps = await Person.findAll({ where: { family_id: actor.family_id, person_type: 'dependent', status: 'active' } });
      for (const dep of deps) {
        const canManage = Number(dep.manager_user_id) === Number(req.user.id) || Number(family?.owner_user_id) === Number(req.user.id);
        if (!canManage) continue;
        const active = await UserConsent.findOne({
          where: { subject_person_id: dep.id, consent_type: 'dependent_health_data', document_version: env.healthConsentVersion, status: 'granted' },
          order: [['granted_at', 'DESC']]
        });
        if (active) managedDependentActive.push({ person: dep, consent: active });
        else dependentConsentCandidates.push(dep);
      }
    }
    res.render('member/privacy', { title: 'Quyền riêng tư & dữ liệu', consents, personNames, dependentConsentCandidates, managedDependentActive });
  } catch (e) { next(e); }
};

exports.revokeHealth = async (req, res, next) => {
  try {
    const subjectPersonId = req.body.subjectPersonId;
    await ConsentService.revokeHealth(req.user.id, subjectPersonId);
    const profile = await HealthProfile.findOne({ where: { person_id: subjectPersonId } });
    if (profile) await ReminderService.cancelProfilePendingTasks(profile.id);
    req.session.flash = { type: 'success', message: 'Đã ghi nhận việc rút lại sự đồng ý xử lý dữ liệu sức khỏe. Dữ liệu lịch sử không bị xóa tự động.' };
    res.redirect('/account/privacy');
  } catch (e) { next(e); }
};

exports.grantDependentHealth = async (req,res,next)=>{try{const subjectPersonId=req.body.subjectPersonId;await ConsentService.grantDependentHealth(req.user.id,subjectPersonId);const profile=await HealthProfile.findOne({where:{person_id:subjectPersonId}});if(profile)await ReminderService.syncProfile(profile.id);req.session.flash={type:'success',message:'Đã kích hoạt lại xử lý dữ liệu sức khỏe của người phụ thuộc.'};res.redirect('/account/privacy');}catch(e){next(e);}};
