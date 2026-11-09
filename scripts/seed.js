require('dotenv').config();
const assertDemoSafe = require('../backend/utils/demoGuard');
const env = require('../backend/config/env');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const {
  sequelize, User, UserConsent, Family, Person, HealthProfile, ProfilePermission,
  Facility, FacilityDocument, MetricType, MetricComponent, Medication, MedicationSchedule,
  MetricThreshold, HealthMetricRecord, HealthMetricValue, CareTask, PersonalAppointment,
  MedicalCondition, HealthRestriction, CareNote, Appointment, VisitResult, Invoice
} = require('../backend/models');

const { toDateOnlyLocal } = require('../backend/utils/dateTime');
const ReminderService = require('../backend/services/ReminderService');
const now = () => new Date();
const dateOnly = () => toDateOnlyLocal();

async function upsertUser(email, password, attrs) {
  let user = await User.findOne({ where: { email } });
  if (!user) user = await User.create({ email, password_hash: await bcrypt.hash(password, 12), display_name: attrs.display_name, phone: attrs.phone || null, account_type: attrs.account_type, status: attrs.status || 'active', auth_version: 1 });
  return user;
}

async function grant(userId, type, version, subjectPersonId = null) {
  const exists = await UserConsent.findOne({ where: { user_id: userId, consent_type: type, document_version: version, subject_person_id: subjectPersonId, status: 'granted' } });
  if (!exists) await UserConsent.create({ user_id: userId, subject_person_id: subjectPersonId, consent_type: type, document_version: version, status: 'granted', granted_at: now() });
}

async function ensureMember(user, familyId = null) {
  let person = await Person.findOne({ where: { user_id: user.id } });
  if (!person) person = await Person.create({ family_id: familyId, user_id: user.id, person_type: 'member', full_name: user.display_name, gender: 'unspecified', status: 'active' });
  if (familyId && !person.family_id) { person.family_id = familyId; await person.save(); }
  await grant(user.id, 'terms', '1.0'); await grant(user.id, 'privacy', '1.0'); await grant(user.id, 'health_data', '1.0', person.id);
  let profile = await HealthProfile.findOne({ where: { person_id: person.id } });
  if (!profile) profile = await HealthProfile.create({ person_id: person.id, blood_type: 'unknown' });
  return { person, profile };
}


async function ensureFacilityDocument(facility, user, fileName) {
  const existing = await FacilityDocument.findOne({ where: { facility_id: facility.id, document_type: 'operating_license' } });
  if (existing) return existing;
  const dir = path.join(process.cwd(), 'storage', 'private', 'facility-documents');
  fs.mkdirSync(dir, { recursive: true });
  const storageKey = `seed-${facility.id}-${fileName}`;
  const filePath = path.join(dir, storageKey);
  const bytes = Buffer.from('%PDF-1.4\n% Carely demo facility verification document\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
  fs.writeFileSync(filePath, bytes);
  return FacilityDocument.create({
    facility_id: facility.id,
    uploaded_by_user_id: user.id,
    document_type: 'operating_license',
    original_name: fileName,
    storage_key: storageKey,
    mime_type: 'application/pdf',
    size_bytes: bytes.length,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex')
  });
}

async function ensureMetricCatalog() {
  const defs = [
    ['blood_pressure','Huyết áp','Huyết áp tâm thu/tâm trương',[['systolic','Tâm thu','mmHg'],['diastolic','Tâm trương','mmHg']]],
    ['weight','Cân nặng','Khối lượng cơ thể',[['weight','Cân nặng','kg']]],
    ['heart_rate','Nhịp tim','Số nhịp tim mỗi phút',[['heart_rate','Nhịp tim','bpm']]]
  ];
  for (const [code,name,description,components] of defs) {
    let type = await MetricType.findOne({ where: { code } });
    if (!type) type = await MetricType.create({ code, name, description });
    for (let i=0;i<components.length;i++) {
      const [c,n,u] = components[i];
      if (!await MetricComponent.findOne({ where: { metric_type_id:type.id, code:c } })) await MetricComponent.create({ metric_type_id:type.id, code:c, name:n, unit:u, display_order:i+1 });
    }
  }
}

async function seed() {
  assertDemoSafe(env);
  await sequelize.authenticate();
  await ensureMetricCatalog();

  const admin = await upsertUser('admin@carely.local','Admin@12345',{display_name:'Carely Admin',account_type:'admin'});
  const member = await upsertUser('member@carely.local','Member@12345',{display_name:'Nguyễn Minh An',account_type:'member'});
  const member2 = await upsertUser('member2@carely.local','Member@12345',{display_name:'Trần Ngọc Mai',account_type:'member'});
  const facilityUser = await upsertUser('facility@carely.local','Facility@12345',{display_name:'Phòng khám Nhi Hòa Bình',account_type:'facility'});
  const pendingUser = await upsertUser('pending@carely.local','Facility@12345',{display_name:'Phòng khám An Khang',account_type:'facility'});
  for (const u of [admin,facilityUser,pendingUser]) { await grant(u.id,'terms','1.0'); await grant(u.id,'privacy','1.0'); }

  const m1 = await ensureMember(member);
  let family = m1.person.family_id ? await Family.findByPk(m1.person.family_id) : null;
  if (!family) { family = await Family.create({ name:'Gia đình Carely Demo', owner_user_id:member.id }); m1.person.family_id=family.id; await m1.person.save(); }
  const m2 = await ensureMember(member2,family.id);

  let dep = await Person.findOne({ where: { family_id:family.id, person_type:'dependent', full_name:'Bé An' } });
  if (!dep) dep = await Person.create({ family_id:family.id, user_id:null, person_type:'dependent', full_name:'Bé An', date_of_birth:'2018-06-15', gender:'female', relationship_to_manager:'Con', manager_user_id:member.id, status:'active' });
  await grant(member.id,'dependent_health_data','1.0',dep.id);
  let depProfile = await HealthProfile.findOne({ where:{person_id:dep.id} }); if(!depProfile) depProfile=await HealthProfile.create({person_id:dep.id,blood_type:'O+'});

  let facility = await Facility.findOne({ where:{user_id:facilityUser.id} });
  if(!facility) facility=await Facility.create({ user_id:facilityUser.id, facility_name:'Phòng khám Nhi Hòa Bình', address:'Hà Nội', phone:'024 3555 0101', description:'Cơ sở y tế mô phỏng chuyên khoa Nhi.', license_number:'GP-DEMO-001', verification_status:'approved', reviewed_at:now(), reviewed_by_user_id:admin.id });
  let pending = await Facility.findOne({ where:{user_id:pendingUser.id} });
  if(!pending) pending=await Facility.create({ user_id:pendingUser.id, facility_name:'Phòng khám An Khang', address:'Hà Nội', phone:'024 0000 0000', description:'Cơ sở đang chờ xác minh.', license_number:'GP-PENDING-001', verification_status:'pending' });
  await ensureFacilityDocument(facility, facilityUser, 'giay-phep-hoat-dong-demo.pdf');
  await ensureFacilityDocument(pending, pendingUser, 'giay-phep-an-khang-demo.pdf');

  if (!await ProfilePermission.findOne({ where:{ health_profile_id:m2.profile.id, grantee_user_id:member.id } })) await ProfilePermission.create({ health_profile_id:m2.profile.id, grantee_user_id:member.id, access_level:'view', granted_by_user_id:member2.id });
  if (!await ProfilePermission.findOne({ where:{ health_profile_id:depProfile.id, grantee_user_id:member2.id } })) await ProfilePermission.create({ health_profile_id:depProfile.id, grantee_user_id:member2.id, access_level:'view', granted_by_user_id:member.id });

  if(!await MedicalCondition.findOne({where:{health_profile_id:m1.profile.id,condition_name:'Tăng huyết áp nhẹ'}})) await MedicalCondition.create({health_profile_id:m1.profile.id,condition_name:'Tăng huyết áp nhẹ',diagnosed_on:'2025-03-15',status:'active',note:'Theo dõi định kỳ',source_type:'member',created_by_user_id:member.id});
  if(!await HealthRestriction.findOne({where:{health_profile_id:depProfile.id,name:'Dị ứng Amoxicillin'}})) await HealthRestriction.create({health_profile_id:depProfile.id,restriction_type:'allergy',name:'Dị ứng Amoxicillin',note:'Phát ban khi dùng',created_by_user_id:member.id});
  if(!await CareNote.findOne({where:{health_profile_id:depProfile.id,content:'Hôm nay hơi sốt nhẹ, cần theo dõi buổi tối.'}})) await CareNote.create({health_profile_id:depProfile.id,author_user_id:member.id,content:'Hôm nay hơi sốt nhẹ, cần theo dõi buổi tối.'});

  let med = await Medication.findOne({where:{health_profile_id:m1.profile.id,name:'Vitamin D'}});
  if(!med){med=await Medication.create({health_profile_id:m1.profile.id,created_by_user_id:member.id,name:'Vitamin D',dosage:'1 viên',instructions:'Sau ăn sáng',start_date:dateOnly(),source_type:'self_recorded',status:'active',reminder_state:'active'});await MedicationSchedule.create({medication_id:med.id,time_of_day:'08:00:00'});}

  await ReminderService.syncMedication(med.id,{days:7});
  let personalAppt=await PersonalAppointment.findOne({where:{health_profile_id:m1.profile.id,title:'Tái khám mắt'}});
  if(!personalAppt) personalAppt=await PersonalAppointment.create({health_profile_id:m1.profile.id,created_by_user_id:member.id,title:'Tái khám mắt',facility_name:'Phòng khám Mắt Demo',scheduled_at:new Date(Date.now()+4*86400000),reminder_at:new Date(Date.now()+3*86400000),status:'scheduled'});
  await ReminderService.syncPersonalAppointment(personalAppt.id);

  let appt = await Appointment.findOne({where:{health_profile_id:depProfile.id,facility_id:facility.id,status:'confirmed'}});
  if(!appt) appt=await Appointment.create({health_profile_id:depProfile.id,facility_id:facility.id,requested_by_user_id:member.id,reason:'Khám định kỳ',requested_for:new Date(Date.now()+2*86400000),confirmed_for:new Date(Date.now()+2*86400000),confirmed_at:now(),status:'confirmed'});

  console.log('Seed completed.');
  console.log('Admin    : admin@carely.local / Admin@12345');
  console.log('Member   : member@carely.local / Member@12345');
  console.log('Member 2 : member2@carely.local / Member@12345');
  console.log('Facility : facility@carely.local / Facility@12345');
  console.log('Pending  : pending@carely.local / Facility@12345');
  await sequelize.close();
}
seed().catch(async e=>{console.error(e);try{await sequelize.close();}catch(_){}process.exit(1);});
