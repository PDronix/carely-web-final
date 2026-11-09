/**
 * Run against a disposable database with `CARELY_TEST_DB=1 DB_NAME=carely_test ... npm run test:integration`.
 * NEVER reuse the production database. The test harness does not create or reset schema.
 * Optional TEST_MEMBER_EMAIL/PASSWORD, TEST_FACILITY_EMAIL/PASSWORD,
 * TEST_ADMIN_EMAIL/PASSWORD must refer to existing accounts in the test database.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const crypto = require('node:crypto');

if (process.env.CARELY_TEST_DB !== '1') {
  test('HTTP + MySQL integration tests (set CARELY_TEST_DB=1 and a dedicated test database)', { skip: true }, () => {});
} else {
  if (!/_test$/.test(process.env.DB_NAME || '')) throw new Error('Refusing integration run: DB_NAME must end in _test');
  process.env.NODE_ENV = 'test';
  const { app, sequelize, models } = (() => {
    const app = require('../../backend/app');
    const models = require('../../backend/models');
    return { app, sequelize: models.sequelize, models };
  })();
  let server, url;
  test.before(async () => {
    await sequelize.authenticate();
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    url = `http://127.0.0.1:${server.address().port}`;
  });
  test.after(async () => {
    if (server) await new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
    if (typeof app.locals.sessionStore?.close === 'function') await app.locals.sessionStore.close();
    await sequelize.close();
  });
  const csrf = html => html.match(/name="_csrf" value="([^"]+)"/)?.[1];
  // Node's Headers can expose multiple Set-Cookie values; select only our session cookie.
  const cookie = response => {
    const name = process.env.SESSION_COOKIE_NAME || 'carely.sid';
    const headers = response.headers.getSetCookie?.() || [response.headers.get('set-cookie')].filter(Boolean);
    const sessionHeader = headers.find(value => value.startsWith(`${name}=`));
    return sessionHeader?.split(';')[0] || '';
  };
  const responseInfo = response => `HTTP ${response.status}; Location: ${response.headers.get('location') || '(none)'}`;
  // Read-only diagnostics: never display the session cookie, session ID, secret or password.
  // The diagnostic is executed only when the newly created login session fails verification.
  async function loginSessionDiagnostics(sessionCookie, email, loginResponse) {
    const info = {
      loginRedirect: loginResponse.headers.get('location') || null,
      cookiePresent: Boolean(sessionCookie),
      cookieSignatureValid: false,
      sessionFound: false,
      sessionUserMatchesAccount: false,
      sessionAuthVersion: null,
      databaseAuthVersion: null,
      databaseAccountStatus: null,
      databaseAccountType: null
    };
    try {
      const user = await models.User.findOne({ where: { email }, attributes: ['id', 'auth_version', 'status', 'account_type'] });
      if (user) {
        info.databaseAuthVersion = Number(user.auth_version ?? 1);
        info.databaseAccountStatus = user.status;
        info.databaseAccountType = user.account_type;
      }
      const encoded = sessionCookie.slice(sessionCookie.indexOf('=') + 1);
      const decoded = decodeURIComponent(encoded);
      if (!decoded.startsWith('s:')) {
        info.problem = 'Session cookie is not signed (unexpected format)';
        return info;
      }
      const separator = decoded.lastIndexOf('.');
      if (separator < 3) {
        info.problem = 'Session cookie signature missing';
        return info;
      }
      const sid = decoded.slice(2, separator);
      const signature = decoded.slice(separator + 1);
      const secret = require('../../backend/config/env').sessionSecret;
      const expected = crypto.createHmac('sha256', secret).update(sid).digest('base64').replace(/=+$/, '');
      const expectedBytes = Buffer.from(expected);
      const signatureBytes = Buffer.from(signature);
      info.cookieSignatureValid = expectedBytes.length === signatureBytes.length &&
        crypto.timingSafeEqual(expectedBytes, signatureBytes);
      if (!info.cookieSignatureValid) return info;
      const stored = await new Promise((resolve, reject) => {
        app.locals.sessionStore.get(sid, (error, session) => error ? reject(error) : resolve(session));
      });
      info.sessionFound = Boolean(stored);
      info.sessionUserMatchesAccount = Boolean(stored?.userId && user && String(stored.userId) === String(user.id));
      info.sessionAuthVersion = stored?.authVersion == null ? null : Number(stored.authVersion);
      info.sessionHasCsrfToken = Boolean(stored?.csrfToken);
      return info;
    } catch (error) {
      info.diagnosticError = error.message;
      return info;
    }
  }
  async function request(path, { method='GET', body=null, cookieValue='', accept='text/html' }={}) {
    return fetch(url + path, { method, redirect:'manual', headers:{'Accept':accept,...(cookieValue?{Cookie:cookieValue}:{}),...(body?{'Content-Type':'application/x-www-form-urlencoded'}:{})},body:body?new URLSearchParams(body):undefined });
  }
  async function login(email, password) {
    const page=await request('/auth?mode=login');
    assert.equal(page.status, 200);
    const csrfToken=csrf(await page.text()); assert.ok(csrfToken);
    const response=await request('/auth/login',{method:'POST',cookieValue:cookie(page),body:{_csrf:csrfToken,email,password}});
    assert.equal(response.status,302,`fixture credentials must be valid; ${responseInfo(response)}`);
    const sessionCookie=cookie(response);
    assert.ok(sessionCookie,`login response missing session Set-Cookie; ${responseInfo(response)}`);
    // An authentication redirect alone is not proof that the newly issued session is usable.
    const account = await request('/account',{cookieValue:sessionCookie});
    if (account.status !== 200) {
      const detail = await loginSessionDiagnostics(sessionCookie, email, response);
      assert.equal(account.status, 200,
        `Session was not recognized after login for ${email}; ${responseInfo(account)}; ` +
        `diagnostic=${JSON.stringify(detail)}. No session ID, cookie or password is logged.`);
    }
    return sessionCookie;
  }
  test('anonymous GET is redirected; mutating request without CSRF is rejected', async () => {
    const response=await request('/care');
    assert.equal(response.status,302);
    assert.match(response.headers.get('location')||'', /auth/);
    const rejected=await request('/care/tasks',{method:'POST',body:{profileId:'1',title:'forbidden'}});
    assert.equal(rejected.status,403);
  });
  const memberPresent=Boolean(process.env.TEST_MEMBER_EMAIL && process.env.TEST_MEMBER_PASSWORD);
  test('member: login -> authorized care view -> create -> forbid early completion -> cancel', {skip:!memberPresent}, async () => {
    const memberCookie=await login(process.env.TEST_MEMBER_EMAIL,process.env.TEST_MEMBER_PASSWORD);
    const response=await request('/care',{cookieValue:memberCookie});
    assert.equal(response.status,200);
    const markup=await response.text(); const token=csrf(markup); assert.ok(token);
    assert.match(markup, /care-planner/);
    const forbidden=await request('/admin',{cookieValue:memberCookie});
    assert.equal(forbidden.status,403);
    const user=await models.User.findOne({where:{email:process.env.TEST_MEMBER_EMAIL}});
    const profiles=await require('../../backend/services/ProfileAccessService').listAccessibleProfiles(user.id);
    const profile=profiles.find(p=>p.capabilities?.canCompleteCareTask);
    assert.ok(profile,'fixture member must have a writable profile + consent');
    const date=new Date(Date.now()+48*3600*1000);
    const vals=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).map(p=>[p.type,p.value]));
    const dueAt=`${vals.year}-${vals.month}-${vals.day}T${vals.hour}:${vals.minute}`;
    const title='IT CareTask '+Date.now();let task;
    try {
      const created=await request('/care/tasks',{method:'POST',cookieValue:memberCookie,body:{_csrf:token,profileId:String(profile.profile.id),title,dueAt}});
      assert.equal(created.status,302);
      task=await models.CareTask.findOne({where:{title}});assert.ok(task);
      const early=await request(`/care/tasks/${task.id}/complete`,{method:'POST',cookieValue:memberCookie,body:{_csrf:token},accept:'application/json'});
      assert.equal(early.status,409);
      const cancel=await request(`/care/tasks/${task.id}/cancel`,{method:'POST',cookieValue:memberCookie,body:{_csrf:token}});
      assert.equal(cancel.status,302);
      await task.reload();assert.equal(task.status,'cancelled');
    } finally { if(task) await task.destroy(); }

    // Personal appointment: HTTP -> auth/CSRF -> controller -> transaction/DB -> cancel.
    const appointmentTitle='IT Personal Appointment '+Date.now();let appointment;
    try {
      const created=await request('/care/personal-appointments',{method:'POST',cookieValue:memberCookie,
        body:{_csrf:token,profileId:String(profile.profile.id),title:appointmentTitle,scheduledAt:dueAt,facilityName:'IT test only'}});
      assert.equal(created.status,302);
      appointment=await models.PersonalAppointment.findOne({where:{title:appointmentTitle}});assert.ok(appointment);
      assert.equal(appointment.status,'scheduled');
      const later = new Date(Date.now() + 72*3600*1000);
      const partsLater = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(later).map(p=>[p.type,p.value]));
      const scheduledLater = `${partsLater.year}-${partsLater.month}-${partsLater.day}T${partsLater.hour}:${partsLater.minute}`;
      const oldReminder = await models.CareTask.findOne({where:{personal_appointment_id:appointment.id,status:'pending'}});
      const edited=await request(`/care/personal-appointments/${appointment.id}/update`,
        {method:'POST',cookieValue:memberCookie,body:{_csrf:token,title:appointmentTitle+' revised',scheduledAt:scheduledLater,facilityName:'IT edited clinic',doctorName:'Dr. Test',note:'Test appointment edit'}});
      assert.equal(edited.status,302,`Update appointment: ${responseInfo(edited)}`);
      await appointment.reload();assert.equal(appointment.doctor_name,'Dr. Test');
      assert.equal(appointment.title,appointmentTitle+' revised');
      if (oldReminder) { await oldReminder.reload(); assert.equal(oldReminder.status,'cancelled'); }
      assert.ok(await models.CareTask.findOne({where:{personal_appointment_id:appointment.id,status:'pending'}}),'updated reminder missing');
      const cancel=await request(`/care/personal-appointments/${appointment.id}/cancel`,
        {method:'POST',cookieValue:memberCookie,body:{_csrf:token}});
      assert.equal(cancel.status,302);
      await appointment.reload();assert.equal(appointment.status,'cancelled');
    } finally {
      if(appointment){
        await models.CareTask.destroy({where:{personal_appointment_id:appointment.id}});
        await appointment.destroy();
      }
    }
  });
  test('notes: author can edit/delete; full-access another person cannot edit author note', {skip:!memberPresent}, async () => {
    const memberCookie=await login(process.env.TEST_MEMBER_EMAIL,process.env.TEST_MEMBER_PASSWORD);
    const user=await models.User.findOne({where:{email:process.env.TEST_MEMBER_EMAIL}});
    const access=await require('../../backend/services/ProfileAccessService').listAccessibleProfiles(user.id);
    const profile=access.find(p=>p.capabilities?.canWriteCareNote);
    assert.ok(profile,'fixture must have a writable profile');
    const page=await request(`/notes?profileId=${profile.profile.id}`,{cookieValue:memberCookie});
    assert.equal(page.status,200);const token=csrf(await page.text());assert.ok(token);
    const content=`IT note ${Date.now()}`;let note;
    try {
      const created=await request('/notes',{method:'POST',cookieValue:memberCookie,
        body:{_csrf:token,profileId:String(profile.profile.id),content}});
      assert.equal(created.status,302);
      note=await models.CareNote.findOne({where:{content,author_user_id:user.id}});
      assert.ok(note);
      const edited=await request(`/notes/${note.id}/update`,{method:'POST',cookieValue:memberCookie,
        body:{_csrf:token,content:content+' edited'}});
      assert.equal(edited.status,302);await note.reload();assert.equal(note.content,content+' edited');
      const invalid=await request(`/notes/${note.id}/update`,{method:'POST',cookieValue:memberCookie,
        accept:'application/json',body:{_csrf:token,content:''}});
      assert.equal(invalid.status,422);
      const other=await models.User.findOne({where:{email:process.env.TEST_VIEWER_EMAIL || 'member2@carely.local'}});
      if (other) {
        await assert.rejects(require('../../backend/services/CareNoteService').change(other.id,note.id,'delete'),
          error => error.statusCode===403);
      }
      const removed=await request(`/notes/${note.id}/delete`,{method:'POST',cookieValue:memberCookie,body:{_csrf:token}});
      assert.equal(removed.status,302);
      assert.equal(await models.CareNote.count({where:{id:note.id}}),0);
    } finally { if(note) await models.CareNote.destroy({where:{id:note.id}}); }
  });
  test('care completion: note is persisted only for a due task', {skip:!memberPresent}, async () => {
    const memberCookie=await login(process.env.TEST_MEMBER_EMAIL,process.env.TEST_MEMBER_PASSWORD);
    const user=await models.User.findOne({where:{email:process.env.TEST_MEMBER_EMAIL}});
    const profiles=await require('../../backend/services/ProfileAccessService').listAccessibleProfiles(user.id);
    const profile=profiles.find(p=>p.capabilities?.canCompleteCareTask);assert.ok(profile);
    const markup=await (await request('/care',{cookieValue:memberCookie})).text();const token=csrf(markup);assert.ok(token);
    const task=await models.CareTask.create({health_profile_id:profile.profile.id,task_type:'general',
      title:'IT completion note '+Date.now(),due_at:require('../../backend/utils/dateTime').startOfLocalDay(),status:'pending'});
    try {
      const done=await request(`/care/tasks/${task.id}/complete`,{method:'POST',cookieValue:memberCookie,
        accept:'application/json',body:{_csrf:token,completionNote:'Đã hoàn tất đúng kế hoạch'}});
      assert.equal(done.status,200,`Complete task: ${responseInfo(done)}`);
      await task.reload();assert.equal(task.status,'completed');
      assert.equal(task.completion_note,'Đã hoàn tất đúng kế hoạch');
      const repeated=await request(`/care/tasks/${task.id}/complete`,{method:'POST',cookieValue:memberCookie,
        accept:'application/json',body:{_csrf:token,completionNote:'Lặp lại'}});
      assert.equal(repeated.status,409);
    } finally {await task.destroy();}
  });
  test('booking: identical active request is blocked without facility capacity assumptions', {skip:!memberPresent}, async t => {
    const memberCookie=await login(process.env.TEST_MEMBER_EMAIL,process.env.TEST_MEMBER_PASSWORD);
    const user=await models.User.findOne({where:{email:process.env.TEST_MEMBER_EMAIL}});
    const profiles=await require('../../backend/services/ProfileAccessService').listAccessibleProfiles(user.id);
    const profile=profiles.find(p=>p.capabilities?.canBookFacility);
    if (!profile) return t.skip('No manageable profile for this fixture');
    const facility=await models.Facility.findOne({where:{verification_status:'approved'},
      include:[{model:models.User,as:'user',where:{status:'active'}}]});
    if (!facility) return t.skip('No approved facility in test fixture');
    const markup=await (await request('/facilities',{cookieValue:memberCookie})).text();const token=csrf(markup);assert.ok(token);
    const when='2030-07-15T13:27'; let appt;
    try {
      const first=await request(`/facilities/${facility.id}/appointments`,{method:'POST',cookieValue:memberCookie,
        body:{_csrf:token,profileId:String(profile.profile.id),requestedFor:when,reason:'Integration test'}});
      assert.equal(first.status,302,`First request: ${responseInfo(first)}`);
      appt=await models.Appointment.findOne({where:{health_profile_id:profile.profile.id,facility_id:facility.id,
        requested_for:new Date('2030-07-15T13:27:00+07:00'),status:'pending'}});
      assert.ok(appt,'created request missing');
      const blocked=await request(`/facilities/${facility.id}/appointments`,{method:'POST',cookieValue:memberCookie,
        accept:'application/json',body:{_csrf:token,profileId:String(profile.profile.id),requestedFor:when}});
      assert.equal(blocked.status,409);

      await appt.update({status:'confirmed',confirmed_for:appt.requested_for,confirmed_at:new Date()});
      const blockedBrowser=await request(`/facilities/${facility.id}/appointments`,{
        method:'POST',cookieValue:memberCookie,body:{_csrf:token,profileId:String(profile.profile.id),requestedFor:when}});
      assert.equal(blockedBrowser.status,303,`HTML booking conflict: ${responseInfo(blockedBrowser)}`);
      assert.equal(blockedBrowser.headers.get('location'),'/facilities',
        'Booking conflicts must not redirect an authenticated member to the public landing page');
      const returned=await request('/facilities',{cookieValue:memberCookie});
      assert.equal(returned.status,200,'The Facility directory must remain accessible after a booking conflict');
      const returnedHtml = await returned.text();
      assert.ok(returnedHtml.includes('đã có yêu cầu tại cơ sở và thời gian đã chọn'),
        'Booking conflict redirect must display the flash warning (HTML intentionally omitted from test logs)');
      const stillAuthenticated=await request('/account',{cookieValue:memberCookie});
      assert.equal(stillAuthenticated.status,200,'The booking conflict must preserve the session');
    } finally {if(appt) await appt.destroy();}
  });

  test('facility confirmation: another confirmed appointment for same profile and instant is rejected',
    {skip:!(process.env.TEST_FACILITY_EMAIL && process.env.TEST_FACILITY_PASSWORD)}, async t => {
      const facilityUser=await models.User.findOne({where:{email:process.env.TEST_FACILITY_EMAIL}});
      const facility=await models.Facility.findOne({where:{user_id:facilityUser.id,verification_status:'approved'}});
      if (!facility) return t.skip('Fixture must have an approved Facility');
      const owner=await models.User.findOne({where:{email:process.env.TEST_MEMBER_EMAIL}});
      const profiles=await require('../../backend/services/ProfileAccessService').listAccessibleProfiles(owner.id);
      const writable=profiles.find(p=>p.capabilities?.canBookFacility);
      if (!writable) return t.skip('Fixture must have a manageable profile');
      const due=new Date(Date.now()+9*24*3600000); due.setSeconds(0,0);
      const seed={health_profile_id:writable.profile.id,facility_id:facility.id,
        requested_by_user_id:owner.id,requested_for:due};
      let confirmed, pending;
      try {
        confirmed=await models.Appointment.create({...seed,status:'confirmed',confirmed_for:due,confirmed_at:new Date()});
        pending=await models.Appointment.create({...seed,status:'pending'});
        await assert.rejects(require('../../backend/services/AppointmentService')
          .facilityTransition(facilityUser.id,pending.id,'confirm'),
          error=>error.statusCode===409 && /cùng thời điểm/.test(error.message));
        await pending.reload();assert.equal(pending.status,'pending');
      } finally {
        if(pending) await pending.destroy();
        if(confirmed) await confirmed.destroy();
      }
    });
  test('facility directory: specialty search renders current approved facility',
    {skip:!memberPresent}, async t => {
      const cookieValue=await login(process.env.TEST_MEMBER_EMAIL,process.env.TEST_MEMBER_PASSWORD);
      const facility=await models.Facility.findOne({where:{verification_status:'approved'},
        include:[{model:models.User,as:'user',where:{status:'active'}}]});
      if(!facility) return t.skip('No approved facility in fixture');
      const original=facility.specialty;
      const marker='SpecialtyIT'+Date.now();
      try {
        await facility.update({specialty:marker});
        const response=await request('/facilities?q='+encodeURIComponent(marker),{cookieValue});
        assert.equal(response.status,200);
        const html=await response.text();
        assert.ok(html.includes(facility.facility_name));
        assert.ok(html.includes(marker));
      } finally {await facility.update({specialty:original});}
    });

  function localInput(date) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(date).map(part => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  }
  async function uc13Fixture(t) {
    const member = await models.User.findOne({ where: { email: process.env.TEST_MEMBER_EMAIL } });
    const facilityUser = await models.User.findOne({ where: { email: process.env.TEST_FACILITY_EMAIL } });
    if (!member || !facilityUser) return t.skip('UC13 requires member and Facility fixtures');
    const facility = await models.Facility.findOne({
      where: { user_id: facilityUser.id, verification_status: 'approved' }
    });
    if (!facility) return t.skip('UC13 requires an approved Facility');
    const profiles = await require('../../backend/services/ProfileAccessService').listAccessibleProfiles(member.id);
    const writable = profiles.find(p => p.capabilities?.canBookFacility);
    if (!writable) return t.skip('UC13 requires a member-managed profile');
    return { member, facilityUser, facility, profile: writable.profile };
  }
  test('UC13: Facility proposal -> member acceptance -> future cancellation',
    { skip: !(memberPresent && process.env.TEST_FACILITY_EMAIL) }, async t => {
      const f = await uc13Fixture(t);
      if (!f) return;
      const service = require('../../backend/services/AppointmentService');
      const requested = new Date(Date.now() + 12 * 86400000); requested.setSeconds(0, 0);
      const proposed = new Date(requested.getTime() + 3600000);
      const appt = await models.Appointment.create({
        health_profile_id: f.profile.id, facility_id: f.facility.id,
        requested_by_user_id: f.member.id, requested_for: requested, status: 'pending'
      });
      try {
        await service.facilityTransition(f.facilityUser.id, appt.id, 'propose', {
          proposedFor: localInput(proposed), note: 'Xin đổi sang giờ này để phù hợp lịch khám.'
        });
        await appt.reload();
        assert.equal(appt.status, 'proposed_time');
        assert.equal(new Date(appt.proposed_for).getTime(), proposed.getTime());
        assert.match(appt.facility_response_note, /Xin đổi sang giờ/);
        await service.memberAction(f.member.id, appt.id, 'accept-proposal');
        await appt.reload();
        assert.equal(appt.status, 'confirmed');
        assert.equal(new Date(appt.confirmed_for).getTime(), proposed.getTime());
        await service.memberAction(f.member.id, appt.id, 'cancel');
        await appt.reload();
        assert.equal(appt.status, 'cancelled');
        assert.equal(String(appt.cancelled_by_user_id), String(f.member.id));
      } finally { await appt.destroy(); }
    });

  test('UC13: Facility cancellation requires a reason; past confirmed visits cannot be cancelled',
    { skip: !(memberPresent && process.env.TEST_FACILITY_EMAIL) }, async t => {
      const f = await uc13Fixture(t);
      if (!f) return;
      const service = require('../../backend/services/AppointmentService');
      const future = new Date(Date.now() + 16 * 86400000);
      const past = new Date(Date.now() - 3600000);
      let futureAppt, pastAppt;
      try {
        futureAppt = await models.Appointment.create({
          health_profile_id: f.profile.id, facility_id: f.facility.id,
          requested_by_user_id: f.member.id, requested_for: future,
          confirmed_for: future, confirmed_at: new Date(), status: 'confirmed'
        });
        await assert.rejects(service.facilityTransition(f.facilityUser.id, futureAppt.id, 'cancel', { note: 'Ngắn' }),
          error => error.statusCode === 422);
        await futureAppt.reload(); assert.equal(futureAppt.status, 'confirmed');
        const explanation = 'Cơ sở cần thay đổi lịch tiếp nhận bệnh nhân.';
        await service.facilityTransition(f.facilityUser.id, futureAppt.id, 'cancel', { note: explanation });
        await futureAppt.reload();
        assert.equal(futureAppt.status, 'cancelled');
        assert.equal(futureAppt.facility_response_note, explanation);
        pastAppt = await models.Appointment.create({
          health_profile_id: f.profile.id, facility_id: f.facility.id,
          requested_by_user_id: f.member.id, requested_for: past,
          confirmed_for: past, confirmed_at: past, status: 'confirmed'
        });
        await assert.rejects(service.memberAction(f.member.id, pastAppt.id, 'cancel'),
          error => error.statusCode === 409);
        await assert.rejects(service.facilityTransition(f.facilityUser.id, pastAppt.id, 'cancel', { note: explanation }),
          error => error.statusCode === 409);
        await pastAppt.reload(); assert.equal(pastAppt.status, 'confirmed');
      } finally {
        if (pastAppt) await pastAppt.destroy();
        if (futureAppt) await futureAppt.destroy();
      }
    });

  test('UC13: member cannot accept a proposed time already confirmed elsewhere',
    { skip: !(memberPresent && process.env.TEST_FACILITY_EMAIL) }, async t => {
      const f = await uc13Fixture(t);
      if (!f) return;
      const service = require('../../backend/services/AppointmentService');
      const time = new Date(Date.now() + 20 * 86400000); time.setSeconds(0, 0);
      const alternate = new Date(time.getTime() + 3600000);
      let confirmed, proposed;
      try {
        confirmed = await models.Appointment.create({
          health_profile_id: f.profile.id, facility_id: f.facility.id,
          requested_by_user_id: f.member.id, requested_for: time,
          confirmed_for: time, confirmed_at: new Date(), status: 'confirmed'
        });
        proposed = await models.Appointment.create({
          health_profile_id: f.profile.id, facility_id: f.facility.id,
          requested_by_user_id: f.member.id, requested_for: alternate,
          proposed_for: time, status: 'proposed_time'
        });
        await assert.rejects(service.memberAction(f.member.id, proposed.id, 'accept-proposal'),
          error => error.statusCode === 409 && /cùng thời điểm/.test(error.message));
        await proposed.reload();
        assert.equal(proposed.status, 'proposed_time', 'rejected acceptance must not persist a partial transition');
      } finally {
        if (proposed) await proposed.destroy();
        if (confirmed) await confirmed.destroy();
      }
    });

  test('family owner: create dependent via HTTP, persist profile and consent, forbid unauthorized create',
    { skip: !memberPresent }, async (t) => {
      const user=await models.User.findOne({where:{email:process.env.TEST_MEMBER_EMAIL}});
      const family=await models.Family.findOne({where:{owner_user_id:user.id}});
      if (!family) return t.skip('TEST_MEMBER_EMAIL must be the family owner for this scenario');
      const ownerCookie=await login(process.env.TEST_MEMBER_EMAIL,process.env.TEST_MEMBER_PASSWORD);
      const familyPage=await request('/family',{cookieValue:ownerCookie});
      assert.equal(familyPage.status,200);
      const markup=await familyPage.text();
      assert.match(markup,/id="dependent-create"/);
      const token=csrf(markup);assert.ok(token);
      const personName=`IT Dependent ${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      let dependent;
      try {
        const rejected=await request('/family/dependents',{method:'POST',cookieValue:ownerCookie,
          accept:'application/json',body:{_csrf:token,fullName:personName,managerUserId:String(user.id),authorizedRepresentative:'on'}});
        assert.equal(rejected.status,400);
        assert.equal(await models.Person.count({where:{full_name:personName}}),0);
        const created=await request('/family/dependents',{method:'POST',cookieValue:ownerCookie,
          body:{_csrf:token,fullName:personName,dateOfBirth:'2019-05-15',relationship:'Con',managerUserId:String(user.id),authorizedRepresentative:'on',healthConsent:'on'}});
        assert.equal(created.status,302,`Create dependent: ${responseInfo(created)}`);
        assert.equal(created.headers.get('location'),'/family');
        dependent=await models.Person.findOne({where:{full_name:personName,person_type:'dependent'}});
        assert.ok(dependent,'POST must persist a dependent person');
        assert.equal(String(dependent.family_id),String(family.id));
        assert.equal(String(dependent.manager_user_id),String(user.id));
        assert.ok(await models.HealthProfile.findOne({where:{person_id:dependent.id}}),'dependent health profile missing');
        assert.ok(await models.UserConsent.findOne({where:{subject_person_id:dependent.id,consent_type:'dependent_health_data',status:'granted'}}),'active health consent missing');
        const visible=await request('/family',{cookieValue:ownerCookie});
        assert.equal(visible.status,200);
        assert.ok((await visible.text()).includes(personName),'created dependent not visible in family listing');
        if (process.env.TEST_VIEWER_EMAIL && process.env.TEST_VIEWER_PASSWORD) {
          const viewerCookie=await login(process.env.TEST_VIEWER_EMAIL,process.env.TEST_VIEWER_PASSWORD);
          const viewerPage=await request('/family',{cookieValue:viewerCookie});
          const viewerToken=csrf(await viewerPage.text());assert.ok(viewerToken);
          const blocked=await request('/family/dependents',{method:'POST',cookieValue:viewerCookie,
            accept:'application/json',body:{_csrf:viewerToken,fullName:'Unauthorized Dependent',managerUserId:String(user.id),authorizedRepresentative:'on',healthConsent:'on'}});
          assert.equal(blocked.status,403,'Non-owner must not create dependents');
        }
      } finally {
        if (dependent) {
          await models.UserConsent.destroy({where:{subject_person_id:dependent.id}});
          await models.HealthProfile.destroy({where:{person_id:dependent.id}});
          await models.AuditLog.destroy({where:{resource_type:'person',resource_id:dependent.id,action_code:'DEPENDENT_CREATED'}});
          await dependent.destroy();
        }
      }
    });
  const viewerPresent=Boolean(process.env.TEST_VIEWER_EMAIL && process.env.TEST_VIEWER_PASSWORD);
  test('viewer: read-only permission allows viewing but blocks IDOR writes and permission changes', {skip:!viewerPresent}, async () => {
    const viewerCookie = await login(process.env.TEST_VIEWER_EMAIL, process.env.TEST_VIEWER_PASSWORD);
    const viewer = await models.User.findOne({where:{email:process.env.TEST_VIEWER_EMAIL}});
    const permission = await models.ProfilePermission.findOne({where:{grantee_user_id:viewer.id,access_level:'view'}});
    assert.ok(permission, 'fixture must include a view-only permission');
    const profileId=permission.health_profile_id;
    const shown=await request(`/profiles/${profileId}`,{cookieValue:viewerCookie});
    assert.equal(shown.status,200);
    const page=await request('/care',{cookieValue:viewerCookie});
    const token=csrf(await page.text());assert.ok(token);
    const title=`IDOR blocked ${Date.now()}`;
    const blocked=await request('/care/tasks',{method:'POST',cookieValue:viewerCookie,
      accept:'application/json',body:{_csrf:token,profileId:String(profileId),title,dueAt:'2030-01-01T09:00'}});
    assert.equal(blocked.status,403);
    assert.equal(await models.CareTask.count({where:{title}}),0);
    const writeProfile=await request(`/profiles/${profileId}`,{method:'POST',cookieValue:viewerCookie,
      accept:'application/json',body:{_csrf:token,bloodType:'AB+',generalNote:'forbidden'}});
    assert.equal(writeProfile.status,403);
    const changePermission=await request(`/profiles/${profileId}/permissions`,{method:'POST',cookieValue:viewerCookie,
      accept:'application/json',body:{_csrf:token,granteeUserId:String(viewer.id),accessLevel:'full'}});
    assert.equal(changePermission.status,403);
  });

  test('facility: confirmed appointment cannot bypass subsequently withdrawn health consent',
    {skip:!(process.env.TEST_FACILITY_EMAIL && process.env.TEST_FACILITY_PASSWORD)}, async () => {
      const user=await models.User.findOne({where:{email:process.env.TEST_FACILITY_EMAIL}});
      const facility=await models.Facility.findOne({where:{user_id:user.id}});
      assert.ok(facility,'approved facility fixture is required');
      const appointment=await models.Appointment.findOne({where:{facility_id:facility.id,status:'confirmed',access_revoked_at:null}});
      assert.ok(appointment,'confirmed appointment fixture is required');
      const profile=await models.HealthProfile.findByPk(appointment.health_profile_id);
      const person=await models.Person.findByPk(profile.person_id);
      const consentType=person.person_type==='dependent'?'dependent_health_data':'health_data';
      const { healthConsentVersion }=require('../../backend/config/env');
      const consent=await models.UserConsent.findOne({where:{subject_person_id:person.id,
        consent_type:consentType,document_version:healthConsentVersion,status:'granted'}});
      assert.ok(consent,'active health consent fixture is required');
      const appointmentService=require('../../backend/services/AppointmentService');
      await appointmentService.assertFacilityAccess(user.id,appointment.id);
      const facilityCookie=await login(process.env.TEST_FACILITY_EMAIL,process.env.TEST_FACILITY_PASSWORD);
      try {
        await consent.update({status:'revoked',revoked_at:new Date()});
        await assert.rejects(appointmentService.assertFacilityAccess(user.id,appointment.id),
          error => error.statusCode===403);
        const denied=await request(`/facility/appointments/${appointment.id}/result`,{cookieValue:facilityCookie});
        assert.equal(denied.status,403);
      } finally {
        await consent.update({status:'granted',revoked_at:null});
      }
      await appointmentService.assertFacilityAccess(user.id,appointment.id);
    });
  const facilityPresent=Boolean(process.env.TEST_FACILITY_EMAIL && process.env.TEST_FACILITY_PASSWORD);
  test('facility access is role restricted; approved facilities are redirected to portal', {skip:!facilityPresent}, async () => {
    const c=await login(process.env.TEST_FACILITY_EMAIL,process.env.TEST_FACILITY_PASSWORD);
    const forbiddenCare=await request('/care',{cookieValue:c});
    assert.equal(forbiddenCare.status,403,`Facility must not access member care; ${responseInfo(forbiddenCare)}`);

    const user=await models.User.findOne({where:{email:process.env.TEST_FACILITY_EMAIL}});
    const facility=await models.Facility.findOne({where:{user_id:user.id}});
    assert.ok(facility,'fixture facility record is required');
    const status=await request('/facility/status',{cookieValue:c});
    if(facility.verification_status==='approved') {
      assert.equal(status.status,302,`Approved facility status should redirect; ${responseInfo(status)}`);
      assert.equal(status.headers.get('location'),'/facility');
      const portal=await request('/facility',{cookieValue:c});
      assert.equal(portal.status,200,`Approved facility dashboard should load; ${responseInfo(portal)}`);
    } else {
      assert.equal(status.status,200,`Pending/rejected facility status page should load; ${responseInfo(status)}`);
    }
    const forbiddenAdmin=await request('/admin',{cookieValue:c});
    assert.equal(forbiddenAdmin.status,403,`Facility must not access admin; ${responseInfo(forbiddenAdmin)}`);
  });
  const adminPresent=Boolean(process.env.TEST_ADMIN_EMAIL && process.env.TEST_ADMIN_PASSWORD);
  test('admin dashboard access is role restricted', {skip:!adminPresent}, async () => {
    const c=await login(process.env.TEST_ADMIN_EMAIL,process.env.TEST_ADMIN_PASSWORD);
    const dashboard=await request('/admin',{cookieValue:c});
    assert.equal(dashboard.status,200,`Admin dashboard must load; ${responseInfo(dashboard)}`);
    const forbidden=await request('/care',{cookieValue:c});
    assert.equal(forbidden.status,403,`Admin must not access member care; ${responseInfo(forbidden)}`);
  });
}
