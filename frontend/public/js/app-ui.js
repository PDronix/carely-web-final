(() => {
  'use strict';
  const dialog = document.querySelector('#bookingDialog');
  if (dialog) {
    const form = document.querySelector('#v4BookingForm');
    const label = document.querySelector('#bookingFacilityName');
    document.querySelectorAll('.js-open-booking').forEach(button => {
      button.addEventListener('click', () => {
        if (!form || !dialog.showModal) return;
        const id = button.dataset.facilityId;
        if (!/^\d+$/.test(id || '')) return;
        form.action = `/facilities/${id}/appointments`;
        label.textContent = button.dataset.facilityName || 'Cơ sở y tế';
        dialog.showModal();
        const dateField = form.querySelector('[name="requestedFor"]');
        if (dateField) {
          const date = new Date(Date.now() + 60 * 1000);
          const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Ho_Chi_Minh', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23'}).formatToParts(date);
          const val = Object.fromEntries(parts.map(p=>[p.type,p.value]));
          dateField.min = `${val.year}-${val.month}-${val.day}T${val.hour}:${val.minute}`;
        }
      });
    });
    dialog.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  }
  document.querySelectorAll('.ui-core-task-edit[hidden]').forEach(panel => panel.setAttribute('aria-label', 'Chỉnh sửa nhắc chăm sóc'));
  document.querySelectorAll('form:not(.js-complete-task)').forEach(form => form.addEventListener('submit', event => {
    if (event.defaultPrevented || !form.checkValidity()) return;
    if (form.dataset.confirm && !window.confirm) return;
    const submit = event.submitter;
    if (submit && submit.tagName === 'BUTTON') {
      queueMicrotask(() => { if (!event.defaultPrevented) submit.disabled = true; });
    }
  }));
})();
