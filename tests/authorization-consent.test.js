'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadWithMocks(file, mocks, log = () => {}) {
  const source = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
  const module = { exports: {} };
  const sandbox = { module, exports: module.exports, console: {log}, require: name => {
    if (!(name in mocks)) throw new Error(`No mocked module: ${name}`);
    return mocks[name];
  } };
  vm.runInNewContext(source, sandbox, { filename: file });
  return module.exports;
}

class AppError extends Error { constructor(message, statusCode) { super(message); this.statusCode=statusCode; } }

function appointmentMocks(consented) {
  const audits=[];
  const facility={ id: 7, verification_status:'approved', user:{status:'active'} };
  const appt={id:42,health_profile_id:91,facility_id:7,status:'confirmed',access_revoked_at:null};
  const mocks={
    sequelize:{Op:{}},
    '../models':{
      sequelize:{},
      Facility:{ findOne:async()=>facility },
      Appointment:{ findByPk:async()=>appt },
      HealthProfile:{ findByPk:async()=>({person_id:88}) },
      User:{},Person:{},VisitResult:{},Invoice:{},Medication:{},MedicationSchedule:{}
    },
    './ProfileAccessService':{ profileHasActiveConsent: async id => { assert.equal(id,88);return consented; } },
    './AuditService':{ write:async args=>audits.push(args) },
    '../utils/AppError':AppError,
    '../utils/dateTime':{parseLocalDateTime:()=>new Date()},
    '../utils/validation':{text:x=>x}
  };
  return {mocks,audits};
}

test('Facility cannot open a confirmed visit after the health consent is revoked', async () => {
  const {mocks,audits}=appointmentMocks(false);
  const Service=loadWithMocks('backend/services/AppointmentService.js',mocks);
  await assert.rejects(Service.assertFacilityAccess(3,42),error=>error.statusCode===403 && /consent/.test(error.message));
  assert.equal(audits.length,0,'Denied reads must not be logged as successful accesses');
});

test('Facility may open a confirmed visit while health consent and appointment access are valid', async () => {
  const {mocks,audits}=appointmentMocks(true);
  const Service=loadWithMocks('backend/services/AppointmentService.js',mocks);
  const result=await Service.assertFacilityAccess(3,42);
  assert.equal(result.appointment.id,42);
  assert.equal(audits.length,1);
});

test('Production MAIL_MODE=console refuses password-reset delivery without printing the token', async () => {
  const logs=[];
  const Service=loadWithMocks('backend/services/MailService.js',{
    nodemailer:{createTransport:()=>({sendMail:async()=>{}})},
    '../config/env':{nodeEnv:'production',mailMode:'console',passwordResetMinutes:30},
    '../utils/AppError':AppError
  },line=>logs.push(line));
  await assert.rejects(Service.sendPasswordReset('user@example.test','https://carely.test/reset?token=SECRET'),err=>err.statusCode===503);
  assert.equal(logs.length,0);
});

test('Profile permission roster is queried only for the authorized data custodian', () => {
  const code=fs.readFileSync(path.resolve(__dirname,'../backend/controllers/ProfileController.js'),'utf8');
  const template=fs.readFileSync(path.resolve(__dirname,'../frontend/views/profiles/show.ejs'),'utf8');
  assert.match(code,/canManagePermissions\s*\?\s*ProfilePermission\.findAll/);
  assert.match(template,/if \(canManagePermissions\) \{ permissions\.forEach/);
});

function luminance(hex){
  const c=hex.match(/[a-f0-9]{2}/gi).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
  return .2126*c[0]+.7152*c[1]+.0722*c[2];
}
function contrast(a,b){const [hi,lo]=[luminance(a),luminance(b)].sort((x,y)=>y-x);return (hi+.05)/(lo+.05);}
test('Landing body copy has WCAG AA normal-text contrast on light surfaces', () => {
  assert.ok(contrast('#536b63','#f7f8f4')>=4.5);
  assert.ok(contrast('#526961','#ffffff')>=4.5);
  assert.ok(contrast('#166c59','#eaf4ee')>=4.5);
  const css=fs.readFileSync(path.resolve(__dirname,'../frontend/public/css/carely.css'),'utf8');
  assert.match(css,/\.public-body \.story-band\s*\{/);
});

test('Demo credentials must never be seeded into production, remote or unrelated databases', () => {
  const guard=require('../backend/utils/demoGuard');
  const config=(nodeEnv,host,name)=>({nodeEnv,db:{host,name}});
  assert.throws(()=>guard(config('production','127.0.0.1','carely')),/Từ chối/);
  assert.throws(()=>guard(config('development','192.0.2.1','carely')),/Từ chối/);
  assert.throws(()=>guard(config('development','127.0.0.1','sensitive_db')),/DEMO/);
  assert.doesNotThrow(()=>guard(config('development','127.0.0.1','carely')));
  assert.doesNotThrow(()=>guard(config('test','127.0.0.1','carely_test')));
});
