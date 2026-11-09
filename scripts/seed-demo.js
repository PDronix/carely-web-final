/**
 * Carely V4: non-destructive, idempotent DEMO-ONLY fixture.
 * Prerequisite: schema.sql + migration v3.2 + npm run seed (V3.2 base).
 * Usage: npm run seed:demo -- --end=2026-10-31
 * This script never deletes or overwrites existing clinical measurements.
 */
require('dotenv').config();
const assertDemoSafe = require('../backend/utils/demoGuard');
const env = require('../backend/config/env');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const {
  sequelize, User, UserConsent, Family, Person, HealthProfile,
  Facility, FacilityDocument, MetricType, MetricComponent,
  MetricThreshold, HealthMetricRecord, HealthMetricValue,
  ProfilePermission, CareTask, Medication, MedicationSchedule
} = require('../backend/models');
const { parseDateOnly, toDateOnlyLocal, addDaysDateOnly, combineDateAndTime } = require('../backend/utils/dateTime');
const ReminderService = require('../backend/services/ReminderService');

const MARKER = 'CARELY_V4_DEMO_21D';
const DEMO_PASSWORD = 'Demo@12345';
const names = [
  ['member@carely.local', 'Nguyễn Minh An'],
  ['member2@carely.local', 'Trần Ngọc Mai'],
  ['member3@carely.local', 'Nguyễn Đức Long'],
  ['member4@carely.local', 'Nguyễn Thu Hà'],
  ['member5@carely.local', 'Nguyễn Hoàng Nam'],
  ['member6@carely.local', 'Nguyễn Minh Phương']
];
const facilityDefs = [
  ['facility@carely.local','Phòng khám Nhi Hòa Bình','GP-DEMO-001','approved'],
  ['facility2@carely.local','Phòng khám Gia Đình Sông Hồng','GP-DEMO-002','approved'],
  ['facility3@carely.local','Phòng khám Đa khoa Bình An','GP-DEMO-003','approved'],
  ['facility4@carely.local','Trung tâm Chăm sóc Sức khỏe Minh Tâm','GP-DEMO-004','approved'],
  ['facility5@carely.local','Phòng khám Nội khoa Ánh Dương','GP-DEMO-005','approved'],
  ['pending@carely.local','Phòng khám An Khang','GP-PENDING-001','pending'],
  ['pending2@carely.local','Phòng khám Phú Thịnh','GP-PENDING-002','pending']
];

async function ensureUser(email, displayName, role) {
  let user = await User.findOne({ where: { email } });
  if (!user) user = await User.create({
    email, display_name: displayName, password_hash: await bcrypt.hash(DEMO_PASSWORD, 12),
    account_type: role, status: 'active', auth_version: 1
  });
  if (user.account_type !== role) throw new Error(`Email ${email} đã thuộc loại tài khoản khác.`);
  return user;
}
async function ensureConsent(userId, type, personId = null) {
  const where = {user_id:userId, consent_type:type, document_version:'1.0', subject_person_id:personId, status:'granted'};
  if (!await UserConsent.findOne({where})) await UserConsent.create({...where, granted_at:new Date()});
}
async function ensureDemoDocument(facility,user) {
  const already=await FacilityDocument.findOne({where:{facility_id:facility.id,document_type:'operating_license'}});
  if (already) return;
  const dir=path.join(__dirname,'..','storage','private','facility-documents');
  fs.mkdirSync(dir,{recursive:true});
  // Never use this material to imply a real medical facility was verified.
  const data=fs.readFileSync(path.join(__dirname,'assets','demo-facility-document.pdf'));
  const storageKey=`carely-v4-demo-${facility.id}.pdf`;
  const filepath=path.join(dir,storageKey);
  if (!fs.existsSync(filepath)) fs.writeFileSync(filepath,data,{flag:'wx'});
  await FacilityDocument.create({
    facility_id:facility.id,uploaded_by_user_id:user.id,document_type:'operating_license',
    original_name:'GIAY-PHEP-MO-PHONG-KHONG-CO-GIA-TRI.pdf',
    storage_key:storageKey,mime_type:'application/pdf',size_bytes:data.length,
    sha256:crypto.createHash('sha256').update(data).digest('hex')
  });
}
function valueFor(code,personIndex,dayIndex) {
  // Deterministic, plausible-looking but NOT medically authoritative demo data.
  const wobble = ((personIndex*7+dayIndex*11)%9)-4;
  switch(code) {
    case 'systolic': return 111+personIndex*3+wobble*2 + (dayIndex===13?19:0);
    case 'diastolic': return 71+personIndex+wobble + (dayIndex===13?11:0);
    case 'heart_rate': return 68+personIndex*2+wobble*2 +(dayIndex===9?26:0);
    case 'weight': return Number((56+personIndex*4.1 + (dayIndex-10)*.025 + wobble*.055).toFixed(1));
    default: throw new Error(`Component ${code} chưa được hỗ trợ trong demo.`);
  }
}
function bounds(code,personIndex) {
  return {
    systolic:[96,145],diastolic:[60,95],heart_rate:[55,106],
    weight:[49+personIndex*4,65+personIndex*4]
  }[code];
}
async function main() {
  assertDemoSafe(env);
  const arg=process.argv.find(v=>v.startsWith('--end='));
  const endDate=parseDateOnly(arg?arg.slice(6):toDateOnlyLocal(), 'Ngày kết thúc bộ dữ liệu');
  if (endDate>toDateOnlyLocal()) throw new Error('Không tạo dữ liệu demo trong tương lai.');
  const days=Array.from({length:21},(_,i)=>addDaysDateOnly(endDate,i-20));
  await sequelize.authenticate();
  const admin=await User.findOne({where:{email:'admin@carely.local',account_type:'admin'}});
  const anchor=await User.findOne({where:{email:'member@carely.local',account_type:'member'}});
  if (!admin || !anchor) throw new Error('Chưa có seed cơ sở. Hãy chạy npm run seed trước khi chạy seed:demo.');
  const anchorPerson=await Person.findOne({where:{user_id:anchor.id,person_type:'member',status:'active'}});
  const family=anchorPerson?.family_id?await Family.findByPk(anchorPerson.family_id):null;
  if (!family) throw new Error('Tài khoản Member gốc chưa có nhóm gia đình. Hãy chạy npm run seed trước.');
  const catalog=await MetricType.findAll({include:[{model:MetricComponent,as:'components'}]});
  const expectedCodes=['blood_pressure','heart_rate','weight'];
  const catalogMap=new Map(catalog.map(type=>[type.code,type]));
  for(const code of expectedCodes) if(!catalogMap.get(code)?.components?.length) throw new Error(`Thiếu cấu hình metric ${code}. Chạy npm run seed.`);

  let createdMembers=0,createdFacilities=0,createdRecords=0,createdValues=0;
  for(let personIndex=0;personIndex<names.length;personIndex++) {
    const [email,fullName]=names[personIndex];
    const oldUser=await User.findOne({where:{email}});
    const user=await ensureUser(email,fullName,'member');
    if (!oldUser) createdMembers++;
    let person=await Person.findOne({where:{user_id:user.id}});
    if (person?.family_id && Number(person.family_id)!==Number(family.id)) throw new Error(`Tài khoản ${email} thuộc một gia đình khác. Không chuyển nhóm tự động.`);
    if (!person) person=await Person.create({family_id:family.id,user_id:user.id,person_type:'member',full_name:fullName,gender:'unspecified',status:'active'});
    else if(!person.family_id){person.family_id=family.id;await person.save();}
    if(person.status !== 'active') throw new Error(`Hồ sơ demo ${email} không hoạt động. Không tự mở khóa.`);
    await ensureConsent(user.id,'terms');await ensureConsent(user.id,'privacy');await ensureConsent(user.id,'health_data',person.id);
    let profile=await HealthProfile.findOne({where:{person_id:person.id}});
    if(!profile) profile=await HealthProfile.create({person_id:person.id,blood_type:'unknown'});

    const preexisting=await MetricThreshold.findAll({where:{health_profile_id:profile.id}});
    const existingThresholds=new Map(preexisting.map(t=>[Number(t.component_id),t]));
    for(const typeCode of expectedCodes) {
      const type=catalogMap.get(typeCode);
      for(const component of type.components) {
        if(!expectedCodes.includes(typeCode)) continue;
        if(!bounds(component.code,personIndex)) throw new Error(`Unknown metric component ${component.code}`);
        if(!existingThresholds.has(Number(component.id))) {
          const [min,max]=bounds(component.code,personIndex);
          const threshold=await MetricThreshold.create({health_profile_id:profile.id,component_id:component.id,min_value:min,max_value:max,enabled:true,set_by_user_id:user.id});
          existingThresholds.set(Number(component.id),threshold);
        }
      }
    }
    const existingRows=await HealthMetricRecord.findAll({where:{health_profile_id:profile.id,note:MARKER}});
    const existingKeys=new Set(existingRows.map(row=>`${row.metric_type_id}|${new Date(row.measured_at).getTime()}`));
    for(let dayIndex=0;dayIndex<21;dayIndex++) {
      const time=new Date(`${days[dayIndex]}T09:00:00+07:00`);
      for(const code of expectedCodes) {
        const type=catalogMap.get(code);
        const key=`${type.id}|${time.getTime()}`;
        if(existingKeys.has(key)) continue;
        const values=type.components.map(component=>{
          const val=valueFor(component.code,personIndex,dayIndex);
          const threshold=existingThresholds.get(Number(component.id));
          const minimum=threshold?.min_value==null?null:Number(threshold.min_value);
          const maximum=threshold?.max_value==null?null:Number(threshold.max_value);
          const isAlert=Boolean(threshold?.enabled && ((minimum!==null&&val<minimum)||(maximum!==null&&val>maximum)));
          return {component_id:component.id,numeric_value:val,isAlert};
        });
        await sequelize.transaction(async transaction=>{
          const record=await HealthMetricRecord.create({health_profile_id:profile.id,metric_type_id:type.id,measured_at:time,note:MARKER,created_by_user_id:user.id,is_alert:values.some(v=>v.isAlert)}, {transaction});
          await HealthMetricValue.bulkCreate(values.map(v=>({metric_record_id:record.id,component_id:v.component_id,numeric_value:v.numeric_value})),{transaction});
        });
        existingKeys.add(key);createdRecords++;createdValues+=values.length;
      }
    }
    if (personIndex > 0 && !await ProfilePermission.findOne({where:{health_profile_id:profile.id,grantee_user_id:anchor.id}})) {
      await ProfilePermission.create({ health_profile_id:profile.id,grantee_user_id:anchor.id,access_level:'view',granted_by_user_id:user.id });
    }
    const title = 'Đo chỉ số sức khỏe định kỳ';
    const existingDemoTasks = await CareTask.findAll({where:{health_profile_id:profile.id,task_type:'general',title}});
    const existingTaskDates = new Set(existingDemoTasks.map(t=>toDateOnlyLocal(new Date(t.due_at))));
    for (let dayIndex=0;dayIndex<21;dayIndex++) {
      const day=days[dayIndex];
      if(existingTaskDates.has(day)) continue;
      const due=combineDateAndTime(day, dayIndex===20?'20:30:00':'08:00:00');
      const isToday=day===toDateOnlyLocal();
      const completed=!isToday && ((dayIndex+personIndex)%5!==0);
      await CareTask.create({
        health_profile_id:profile.id,task_type:'general',title,
        description:'Dữ liệu minh họa để kiểm thử lịch chăm sóc và tỷ lệ tuân thủ.',
        due_at:due,status:isToday?'pending':completed?'completed':'missed',
        completed_at:completed?new Date(due.getTime()+15*60000):null,
        completed_by_user_id:completed?user.id:null
      });
    }
    if (personIndex > 0) {
      const medicineName = ['Vitamin D', 'Vitamin B1', 'Canxi', 'Omega-3', 'Vitamin C', 'Sắt'][personIndex];
      let medication = await Medication.findOne({where:{health_profile_id:profile.id,name:medicineName,source_type:'self_recorded'}});
      if (!medication) medication = await Medication.create({health_profile_id:profile.id,created_by_user_id:user.id,name:medicineName,dosage:'1 viên',instructions:'Dữ liệu thuốc mô phỏng, không phải chỉ định y tế.',start_date:days[0],end_date:null,source_type:'self_recorded',status:'active',reminder_state:'active'});
      if (!await MedicationSchedule.count({where:{medication_id:medication.id}})) {
        await MedicationSchedule.create({medication_id:medication.id,time_of_day:'20:30:00',is_active:true});
      }
      await ReminderService.syncMedication(medication.id, {days:7});
    }
    console.log(`OK ${email}: 21 ngày, 3 loại chỉ số + lịch chăm sóc demo`);
  }

  for(const [email,name,license,status] of facilityDefs) {
    const oldUser=await User.findOne({where:{email}});
    const user=await ensureUser(email,name,'facility');
    if(!oldUser) createdFacilities++;
    await ensureConsent(user.id,'terms');await ensureConsent(user.id,'privacy');
    let facility=await Facility.findOne({where:{user_id:user.id}});
    if (!facility) facility=await Facility.create({
      user_id:user.id,facility_name:name,address:'Hà Nội (dữ liệu mô phỏng)',
      phone:'024 0000 0000',description:'Cơ sở y tế mô phỏng phục vụ kiểm thử Carely V4.',
      license_number:license,verification_status:status,
      ...(status==='approved'?{reviewed_at:new Date(),reviewed_by_user_id:admin.id}:{})
    });
    else if(facility.verification_status!==status) throw new Error(`Facility demo ${email} đang ở trạng thái ${facility.verification_status}, yêu cầu ${status}. Không tự thay đổi trạng thái Admin đã duyệt.`);
    await ensureDemoDocument(facility,user);
  }
  console.log(`Bộ demo V4 (${days[0]} — ${endDate}) đã xử lý: ${createdMembers} thành viên mới, ${createdFacilities} tài khoản Facility mới, ${createdRecords} bản ghi đo và ${createdValues} giá trị mới.`);
  console.log('Tài khoản mới: member3..6@carely.local / Demo@12345; facility2..5@carely.local và pending2@carely.local / Demo@12345');
  console.log('Script có thể chạy lại để bổ sung dữ liệu demo; V4.1 reset riêng mới xóa database cũ.');
}
main().then(()=>sequelize.close()).catch(async error=>{console.error('SEED V4 FAILED:',error.message);try{await sequelize.close();}catch(_){}process.exitCode=1;});
