require('dotenv').config();
const { Op } = require('sequelize');
const { sequelize, User, Family, Person, HealthProfile, Facility, HealthMetricRecord, HealthMetricValue, CareTask, MetricType } = require('../backend/models');
const { parseDateOnly, toDateOnlyLocal, addDaysDateOnly } = require('../backend/utils/dateTime');
const EXPECTED_USERS=['member@carely.local','member2@carely.local','member3@carely.local','member4@carely.local','member5@carely.local','member6@carely.local'];
const EXPECTED_FACILITIES={
  'facility@carely.local':'approved','facility2@carely.local':'approved','facility3@carely.local':'approved',
  'facility4@carely.local':'approved','facility5@carely.local':'approved',
  'pending@carely.local':'pending','pending2@carely.local':'pending'
};
function ensure(ok,message) {if(!ok)throw new Error(message);}
async function main() {
  const arg=process.argv.find(x=>x.startsWith('--end='));
  const end=parseDateOnly(arg?arg.slice(6):toDateOnlyLocal());
  const start=addDaysDateOnly(end,-20);
  await sequelize.authenticate();
  const users=await User.findAll({where:{email:{[Op.in]:EXPECTED_USERS},account_type:'member',status:'active'}});
  ensure(users.length===6,`Chỉ có ${users.length}/6 tài khoản Member demo.`);
  const people=await Person.findAll({where:{user_id:{[Op.in]:users.map(x=>x.id)},person_type:'member',status:'active'}});
  ensure(people.length===6 && people.every(p=>String(p.family_id)===String(people[0].family_id)),'Sáu thành viên chưa cùng một gia đình.');
  const profiles=await HealthProfile.findAll({where:{person_id:{[Op.in]:people.map(p=>p.id)}}});
  ensure(profiles.length===6,'Chưa đủ 6 hồ sơ sức khỏe.');
  let approved=0,pending=0;
  for(const [email,expected] of Object.entries(EXPECTED_FACILITIES)){
    const user=await User.findOne({where:{email,account_type:'facility'}});
    const facility=user&&await Facility.findOne({where:{user_id:user.id}});
    ensure(facility?.verification_status===expected,`Facility ${email} không ở trạng thái ${expected}.`);
    if(expected==='approved')approved++;else pending++;
  }
  const metricTypes=await MetricType.findAll({attributes:['id','code']});
  ensure(metricTypes.length===3 && ['blood_pressure','heart_rate','weight'].every(code=>metricTypes.some(t=>t.code===code)), 'Catalog demo phải có đúng 3 loại chỉ số, không có Nhiệt độ cơ thể.');
  const records=await HealthMetricRecord.findAll({where:{health_profile_id:{[Op.in]:profiles.map(x=>x.id)},note:'CARELY_V4_DEMO_21D',measured_at:{[Op.between]:[new Date(`${start}T00:00:00+07:00`),new Date(`${end}T23:59:59+07:00`)]}}});
  ensure(records.length===378,`Có ${records.length} bản ghi demo, mong đợi 378.`);
  const values=await HealthMetricValue.count({where:{metric_record_id:{[Op.in]:records.map(r=>r.id)}}});
  ensure(values===504,`Có ${values}/504 giá trị thành phần demo.`);
  for(const profile of profiles){
    const subset=records.filter(r=>String(r.health_profile_id)===String(profile.id));
    ensure(subset.length===63,`Hồ sơ ${profile.id} có ${subset.length}/63 bản ghi đo.`);
    const dayCounts=new Map();
    subset.forEach(r=>{const date=toDateOnlyLocal(new Date(r.measured_at));dayCounts.set(date,(dayCounts.get(date)||0)+1);});
    ensure(dayCounts.size===21 && [...dayCounts.values()].every(n=>n===3),`Hồ sơ ${profile.id} thiếu dữ liệu đo ở một số ngày.`);
  }
  for (const profile of profiles) {
    const tasks=await CareTask.findAll({where:{health_profile_id:profile.id,task_type:'general',title:'Đo chỉ số sức khỏe định kỳ'}});
    ensure(tasks.length===21,`Hồ sơ ${profile.id} thiếu CareTask demo: ${tasks.length}/21.`);
    if(end===toDateOnlyLocal()) ensure(tasks.some(task=>task.status==='pending' && toDateOnlyLocal(new Date(task.due_at))===end),`Hồ sơ ${profile.id} thiếu công việc pending hôm nay.`);
  }
  console.log(`PASS: 6 tài khoản Member cùng gia đình; ${approved} Facility approved + ${pending} pending.`);
  console.log(`PASS: 21 ngày (${start} → ${end}); 378 bản ghi đo, 504 giá trị; 3 loại chỉ số/người/ngày.`);
  console.log('Dữ liệu thuộc bộ DEMO, không phải số đo sức khỏe thật.');
}
main().then(()=>sequelize.close()).catch(async err=>{console.error('VERIFY DEMO FAILED:',err.message);try{await sequelize.close();}catch(_){}process.exitCode=1;});
