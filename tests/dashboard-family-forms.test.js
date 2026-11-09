const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const css=fs.readFileSync(path.join(root,'frontend/public/css/carely.css'),'utf8');
const view=fs.readFileSync(path.join(root,'frontend/views/family/index.ejs'),'utf8');
const ctl=fs.readFileSync(path.join(root,'backend/controllers/FamilyController.js'),'utf8');
test('accent KPI numbers stay white after generic stat typography',()=>{
  const generic=css.lastIndexOf('.stat-card .v');
  const accent=css.lastIndexOf('.stat-card.accent .v');
  assert.ok(accent>generic);
  assert.match(css.slice(accent,accent+80),/color:\s*#ffffff/);
});
test('dependent form renders immediately beneath list heading, not after member rows',()=>{
  assert.ok(view.indexOf('id="dependent-create"')>view.indexOf('class="family-directory"'));
  assert.ok(view.indexOf('id="dependent-create"')<view.indexOf('class="family-list-head"'));
  assert.match(view,/data-toggle-target="dependent-create"/);
  assert.match(view,/openDependentForm/);
});
test('validation failures on dependent form preserve a visible form and flash; test JSON errors remain statusful',()=>{
  assert.match(ctl,/form=dependent/);
  assert.match(ctl,/error\.isOperational/);
  assert.match(ctl,/application\/json/);
});
