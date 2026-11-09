(() => {
'use strict';
const header=document.querySelector('.public-header'); if(header){const onScroll=()=>header.classList.toggle('is-scrolled',window.scrollY>24);onScroll();window.addEventListener('scroll',onScroll,{passive:true});}
const reveal=document.querySelectorAll('[data-reveal]'); if('IntersectionObserver'in window){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('reveal-in');io.unobserve(e.target);}}),{threshold:.12});reveal.forEach(el=>io.observe(el));}else reveal.forEach(el=>el.classList.add('reveal-in'));
const carousel = document.querySelector('[data-hero-carousel]');
if (carousel) {
  const scenes = [...carousel.querySelectorAll('[data-hero-scene]')];
  const dots = [...carousel.querySelectorAll('[data-hero-dot]')];
  const pauseButton = carousel.querySelector('[data-carousel-pause]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let timer = null;
  let paused = reduced.matches;
  const stop = () => { if (timer) clearInterval(timer); timer = null; };
  const activate = (i) => {
    if (!scenes.length) return;
    index = (i + scenes.length) % scenes.length;
    scenes.forEach((scene, n) => {
      scene.classList.toggle('is-active', n === index);
      scene.setAttribute('aria-hidden', String(n !== index));
    });
    dots.forEach((dot, n) => {
      dot.classList.toggle('is-active', n === index);
      dot.setAttribute('aria-pressed', String(n === index));
    });
  };
  const start = () => {
    stop();
    if (paused || reduced.matches || document.hidden || carousel.matches(':hover') || (carousel.contains(document.activeElement) && document.activeElement !== pauseButton)) return;
    timer = setInterval(() => activate(index + 1), 5000);
  };
  dots.forEach((dot, i) => dot.addEventListener('click', () => { activate(i); start(); }));
  if (pauseButton) pauseButton.addEventListener('click', () => {
    paused = !paused;
    pauseButton.textContent = paused ? '▶' : 'Ⅱ';
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.setAttribute('aria-label', paused ? 'Tiếp tục chuyển cảnh' : 'Tạm dừng chuyển cảnh');
    if (paused) stop(); else start();
  });
  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', start);
  carousel.addEventListener('focusin', stop);
  carousel.addEventListener('focusout', () => setTimeout(start, 0));
  document.addEventListener('visibilitychange', start);
  reduced.addEventListener?.('change', start);
  activate(0);
  start();
}
const openNav=document.getElementById('openNav'),sidebar=document.getElementById('sidebar'),scrim=document.getElementById('navScrim');
const compactNav=window.matchMedia('(max-width: 980px)');
const syncNavAccessibility=()=>{
  if(!sidebar)return;
  const hidden=compactNav.matches&&!sidebar.classList.contains('is-open');
  sidebar.inert=hidden;
  sidebar.setAttribute('aria-hidden',String(hidden));
};
const closeNav=()=>{sidebar?.classList.remove('is-open');scrim?.classList.remove('is-open');openNav?.setAttribute('aria-expanded','false');syncNavAccessibility();};
openNav?.addEventListener('click',()=>{
  const shouldOpen=!sidebar?.classList.contains('is-open');
  sidebar?.classList.toggle('is-open',shouldOpen);
  scrim?.classList.toggle('is-open',shouldOpen);
  openNav.setAttribute('aria-expanded',String(shouldOpen));
  syncNavAccessibility();
  if(shouldOpen)sidebar?.querySelector('a.nav-item')?.focus();
  else openNav.focus();
});
scrim?.addEventListener('click',()=>{closeNav();openNav?.focus();});
sidebar?.querySelectorAll('a.nav-item').forEach(a=>a.addEventListener('click',()=>{if(compactNav.matches)closeNav();}));
compactNav.addEventListener?.('change',closeNav);
document.addEventListener('keydown',event=>{
  if(!sidebar?.classList.contains('is-open')||!compactNav.matches)return;
  if(event.key==='Escape'){closeNav();openNav?.focus();return;}
  if(event.key!=='Tab')return;
  const candidates=[...sidebar.querySelectorAll('a[href], button:not([disabled]), summary, input:not([disabled])')].filter(e=>e.getClientRects().length);
  if(!candidates.length)return;
  const first=candidates[0],last=candidates.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});
syncNavAccessibility();
document.querySelectorAll('[data-auth-type]').forEach(button=>button.addEventListener('click',()=>{const type=button.dataset.authType;document.querySelectorAll('[data-auth-type]').forEach(b=>b.classList.toggle('is-active',b===button));document.querySelectorAll('[data-facility-field]').forEach(el=>{el.hidden=type!=='facility';});document.querySelectorAll('[data-member-field]').forEach(el=>{el.hidden=type!=='member';});const input=document.querySelector('input[name="accountType"]');if(input)input.value=type;const license=document.querySelector('input[name="licenseFile"]');if(license)license.required=type==='facility';}));
const metricTypeSelect=document.getElementById('metricTypeSelect');if(metricTypeSelect)metricTypeSelect.addEventListener('change',()=>{document.querySelectorAll('[data-metric-components]').forEach(el=>{el.hidden=el.dataset.metricComponents!==metricTypeSelect.value;});});
document.querySelectorAll('[data-toggle-target]').forEach(button=>{
  const target=document.getElementById(button.dataset.toggleTarget);
  if(target){button.setAttribute('aria-controls',target.id);button.setAttribute('aria-expanded',String(!target.hidden));}
  button.addEventListener('click',()=>{if(!target)return;target.hidden=!target.hidden;button.setAttribute('aria-expanded',String(!target.hidden));});
});
function initTimeList(block){if(!block||block.dataset.timeReady)return;block.dataset.timeReady='1';const rows=block.querySelector('[data-time-rows]');const add=block.querySelector('[data-add-time]');const base=rows?.querySelector('input[type="time"]');const inputName=base?.name||base?.dataset.timeName||'times';const addRow=()=>{const row=document.createElement('div');row.className='time-row';const input=document.createElement('input');input.type='time';input.name=inputName;const remove=document.createElement('button');remove.type='button';remove.className='icon-btn time-remove';remove.dataset.removeTime='';remove.setAttribute('aria-label','Xóa giờ');remove.textContent='×';row.append(input,remove);rows.appendChild(row);};add?.addEventListener('click',addRow);block.addEventListener('click',e=>{const btn=e.target.closest('[data-remove-time]');if(!btn)return;const all=rows.querySelectorAll('.time-row');if(all.length===1){all[0].querySelector('input').value='';return;}btn.closest('.time-row').remove();});}
document.querySelectorAll('[data-time-list]').forEach(initTimeList);
const notificationBtn=document.getElementById('notificationBtn'),notificationPanel=document.getElementById('notificationPanel');
if(notificationBtn&&notificationPanel){
  const setNotificationsOpen=open=>{notificationPanel.classList.toggle('is-open',open);notificationBtn.setAttribute('aria-expanded',String(open));};
  notificationBtn.addEventListener('click',e=>{e.stopPropagation();setNotificationsOpen(!notificationPanel.classList.contains('is-open'));});
  notificationPanel.addEventListener('click',e=>e.stopPropagation());
  document.addEventListener('click',()=>setNotificationsOpen(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&notificationPanel.classList.contains('is-open')){setNotificationsOpen(false);notificationBtn.focus();}});
}
const prescriptionList=document.querySelector('[data-prescription-list]'),prescriptionTemplate=document.getElementById('prescriptionTemplate'),addPrescription=document.querySelector('[data-add-prescription]');let prescriptionIndex=0;function appendPrescription(){if(!prescriptionList||!prescriptionTemplate||prescriptionIndex>=10)return;const frag=prescriptionTemplate.content.cloneNode(true);const row=frag.querySelector('[data-prescription-row]');const idx=prescriptionIndex++;row.querySelector('[data-prescription-number]').textContent=idx+1;row.querySelectorAll('[data-field]').forEach(input=>input.name=input.dataset.field+idx);const timeInput=row.querySelector('[data-time-input]');timeInput.name='medTimes'+idx;row.querySelector('[data-time-list]').querySelector('input[type="time"]').name='medTimes'+idx;row.querySelector('[data-remove-prescription]').addEventListener('click',()=>row.remove());prescriptionList.appendChild(frag);initTimeList(row.querySelector('[data-time-list]'));}addPrescription?.addEventListener('click',appendPrescription);if(addPrescription)appendPrescription();
function escapeAttribute(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => {
    if (ch === '&') return '&amp;';
    if (ch === '<') return '&lt;';
    if (ch === '>') return '&gt;';
    if (ch === '"') return '&quot;';
    return '&#39;';
  });
}
function renderMultiChart(svg){let data;try{data=JSON.parse(svg.dataset.chart||'{}');}catch{return;}const rows=data.rows||[],series=data.series||[];if(rows.length<2||!series.length)return;const W=760,H=320,p={l:54,r:22,t:24,b:44};const palette=['#2d7567','#f07f65','#46709a','#6d5594'];let enabled=new Set(series.map(s=>String(s.id)));let thresholdSeries=String(series[0].id);const legend=svg.closest('.metric-chart-card')?.querySelector('[data-chart-legend]');const select=svg.closest('.metric-chart-card')?.querySelector('[data-threshold-series]');const tooltip=svg.parentElement.querySelector('[data-chart-tooltip]');
const draw=()=>{const active=series.filter(s=>enabled.has(String(s.id)));let vals=active.flatMap(s=>s.values.filter(v=>Number.isFinite(v)));const th=data.thresholds?.[thresholdSeries];if(th?.enabled){if(Number.isFinite(th.min))vals.push(th.min);if(Number.isFinite(th.max))vals.push(th.max);}if(!vals.length)return;let min=Math.min(...vals),max=Math.max(...vals);const extra=Math.max((max-min)*.15,Math.max(Math.abs(max),1)*.05,1);min-=extra;max+=extra;const x=i=>p.l+i*((W-p.l-p.r)/(rows.length-1));const y=v=>H-p.b-((v-min)/(max-min||1))*(H-p.t-p.b);let html='';for(let i=0;i<5;i++){const value=max-i*((max-min)/4),gy=y(value);html+=`<line class="chart-grid-v3" x1="${p.l}" y1="${gy}" x2="${W-p.r}" y2="${gy}"/><text class="chart-label" x="${p.l-10}" y="${gy+4}" text-anchor="end">${Math.round(value*10)/10}</text>`;}rows.forEach((row,i)=>{const label=new Date(row.measuredAt).toLocaleDateString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit'});if(i===0||i===rows.length-1||i%Math.max(1,Math.floor(rows.length/5))===0)html+=`<text class="chart-label" x="${x(i)}" y="${H-15}" text-anchor="middle">${label}</text>`;});if(th?.enabled){[['min','Tối thiểu'],['max','Tối đa']].forEach(([k,label])=>{if(Number.isFinite(th[k]))html+=`<line class="threshold-line" x1="${p.l}" y1="${y(th[k])}" x2="${W-p.r}" y2="${y(th[k])}"/><text class="chart-label" x="${W-p.r}" y="${y(th[k])-6}" text-anchor="end">${label} ${th[k]}</text>`;});}active.forEach((s,si)=>{const color=palette[series.indexOf(s)%palette.length];const valid=s.values.map((v,i)=>({v,i})).filter(o=>Number.isFinite(o.v));const points=valid.map(o=>`${x(o.i)},${y(o.v)}`).join(' ');html+=`<polyline class="chart-series-line" points="${points}" stroke="${color}"/>`;valid.forEach(o=>{const dt=new Date(rows[o.i].measuredAt).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'});html+=`<circle class="chart-point-v3" cx="${x(o.i)}" cy="${y(o.v)}" r="4" stroke="${color}" data-tip="${escapeAttribute(s.name)}: ${o.v} ${escapeAttribute(s.unit||'')} · ${escapeAttribute(dt)}"/>`;});});svg.innerHTML=html;svg.querySelectorAll('[data-tip]').forEach(point=>{
  point.setAttribute('tabindex','0');point.setAttribute('role','img');point.setAttribute('aria-label',point.dataset.tip);
  const show=()=>{if(!tooltip)return;tooltip.hidden=false;tooltip.textContent=point.dataset.tip;
    const sr=svg.getBoundingClientRect(),pr=point.getBoundingClientRect();tooltip.style.left=`${pr.left-sr.left+pr.width/2}px`;tooltip.style.top=`${pr.top-sr.top}px`;};
  const hide=()=>{if(tooltip)tooltip.hidden=true;};
  point.addEventListener('pointerenter',show);point.addEventListener('pointerleave',hide);
  point.addEventListener('focus',show);point.addEventListener('blur',hide);
});};
if(legend){legend.innerHTML='';series.forEach((s,i)=>{const b=document.createElement('button');b.type='button';b.style.color=palette[i%palette.length];b.innerHTML='<span class="legend-dot"></span>';b.append(document.createTextNode(String(s.name || '')));b.addEventListener('click',()=>{const id=String(s.id);if(enabled.has(id)&&enabled.size>1)enabled.delete(id);else enabled.add(id);b.classList.toggle('is-off',!enabled.has(id));draw();});legend.appendChild(b);});}select?.addEventListener('change',()=>{thresholdSeries=select.value;draw();});draw();}
document.querySelectorAll('[data-multi-chart]').forEach(renderMultiChart);

function showToast(message,type='success'){let toast=document.getElementById('clientToast');if(!toast){toast=document.createElement('div');toast.id='clientToast';toast.className='toast client-toast';document.body.appendChild(toast);}toast.textContent=message;toast.dataset.type=type;toast.classList.add('is-open');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove('is-open'),2600);}
document.querySelectorAll('[data-copy-text]').forEach(btn=>btn.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(btn.dataset.copyText||'');showToast('Đã sao chép mã mời.');}catch{showToast('Không thể sao chép tự động.','error');}}));
function refreshCareTaskEligibility() {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit' })
    .formatToParts(new Date());
  const parts = Object.fromEntries(today.map(x => [x.type, x.value]));
  const startOfToday = Date.parse(`${parts.year}-${parts.month}-${parts.day}T00:00:00+07:00`);
  const now = Date.now();
  document.querySelectorAll('.js-complete-task[data-care-due]').forEach(form => {
    if (form.dataset.completed === '1') return;
    const button = form.querySelector('button.check-btn');
    const due = Number(form.dataset.careDue);
    if (!button || !Number.isFinite(due) || button.classList.contains('is-loading')) return;
    const eligible = due >= startOfToday && due <= now;
    const expired = due < startOfToday;
    button.disabled = !eligible;
    button.classList.toggle('care-waiting', !eligible && !expired);
    button.textContent = eligible ? '✓' : expired ? '–' : '◷';
    button.title = expired ? 'Đã bỏ lỡ: không thể xác nhận lại' : eligible ? 'Xác nhận đã thực hiện việc chăm sóc' : 'Chưa đến thời gian thực hiện';
    button.setAttribute('aria-label', button.title);
    const badge = form.closest('[data-care-task]')?.querySelector('[data-task-status]');
    if (badge) badge.textContent = expired ? 'Đã bỏ lỡ' : eligible ? 'Chờ thực hiện' : 'Sắp tới';
  });
}
refreshCareTaskEligibility();
if (document.querySelector('.js-complete-task[data-care-due]')) setInterval(refreshCareTaskEligibility, 10000);
const careCompletionDialog = document.getElementById('careCompletionDialog');
const careCompletionForm = document.getElementById('careCompletionForm');
let pendingCareCompletion = null;
careCompletionForm?.addEventListener('submit', event => {
  event.preventDefault();
  const target = pendingCareCompletion;
  if (!target) return;
  let field = target.querySelector('input[name="completionNote"]');
  if (!field) { field = document.createElement('input'); field.type = 'hidden'; field.name = 'completionNote'; target.appendChild(field); }
  field.value = document.getElementById('careCompletionNote')?.value || '';
  target.dataset.completionConfirmed = '1';
  careCompletionDialog.close();
  target.requestSubmit();
  delete target.dataset.completionConfirmed;
  pendingCareCompletion = null;
});
document.getElementById('careCompletionCancel')?.addEventListener('click', () => careCompletionDialog.close());
careCompletionDialog?.addEventListener('close', () => { pendingCareCompletion = null; });
document.querySelectorAll('.js-complete-task').forEach(form=>form.addEventListener('submit',async e=>{
  if (careCompletionDialog?.showModal && form.dataset.completionConfirmed !== '1') {
    e.preventDefault();
    pendingCareCompletion = form;
    const noteField = document.getElementById('careCompletionNote');
    if (noteField) noteField.value = '';
    careCompletionDialog.showModal();
    noteField?.focus();
    return;
  }
  e.preventDefault();const row=form.closest('[data-care-task]'),button=form.querySelector('button');if(!row||!button||button.disabled)return;button.disabled=true;button.classList.add('is-loading');try{const response=await fetch(form.action,{method:'POST',body:new URLSearchParams(new FormData(form)),headers:{'Accept':'application/json','Content-Type':'application/x-www-form-urlencoded;charset=UTF-8','X-Requested-With':'XMLHttpRequest'},credentials:'same-origin'});let data={};try{data=await response.json();}catch{}if(!response.ok||!data.ok)throw new Error(data.message||'Không thể cập nhật việc chăm sóc.');row.classList.add('is-done');button.classList.add('checked');button.textContent='✓';button.setAttribute('aria-label','Đã hoàn thành');form.replaceWith(button);const pill=row.querySelector('[data-task-status]');if(pill){pill.textContent='Hoàn thành';pill.className='pill tone-mint';}
    if (data.task?.completionNote) {
      const line = document.createElement('p');
      line.className = 'ui-forms-completion-saved';
      line.textContent = 'Ghi chú hoàn thành: ' + data.task.completionNote;
      row.querySelector('.sched-body')?.appendChild(line);
    }
    showToast('Đã đánh dấu hoàn thành.');}catch(err){button.classList.remove('is-loading');refreshCareTaskEligibility();showToast(err.message||'Không thể cập nhật.','error');}}));

document.querySelectorAll('[data-confirm]').forEach(form=>form.addEventListener('submit',e=>{if(!window.confirm(form.dataset.confirm))e.preventDefault();}));
document.addEventListener('click',e=>{document.querySelectorAll('.action-menu[open]').forEach(d=>{if(!d.contains(e.target))d.removeAttribute('open');});});
})();

(() => {
  const button = document.querySelector('[data-care-load-more]');
  if (!button) return;
  button.addEventListener('click', () => {
    const pending = [...document.querySelectorAll('.ui-care-care-extra[hidden]')];
    pending.slice(0, 6).forEach(row => { row.hidden = false; row.classList.add('ui-care-reveal-task'); });
    const remaining = document.querySelectorAll('.ui-care-care-extra[hidden]').length;
    button.textContent = remaining ? `Xem thêm ${remaining} việc` : 'Đã hiển thị tất cả';
    button.setAttribute('aria-expanded', String(remaining === 0));
    if (!remaining) button.disabled = true;
  });
})();
