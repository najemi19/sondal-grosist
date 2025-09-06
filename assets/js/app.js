// E-Smart Market Pro AI — App JS
// Handles: language toggle (AR/EN), form validation + WhatsApp handoff, UX niceties (smooth scroll)

(() => {
  'use strict';

  // ====== Config (edit these to your business details) ======
  const CONFIG = {
    whatsappNumber: '212600000000', // digits only, e.g., 2126XXXXXXXX
    autoOpenWhatsApp: false,        // set to true to open WhatsApp after submit
    responseHoursMin: 24,
    responseHoursMax: 48
  };

  // ====== Helpers ======
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // Toggle AR/EN by showing/hiding elements that end with _ar/_en
  const setLang = (lang) => {
    const isAR = lang === 'ar';
    document.documentElement.lang = isAR ? 'ar' : 'en';
    document.documentElement.dir = isAR ? 'rtl' : 'ltr';

    // Show/hide language-specific nodes
    $$('[id$="_ar"], [id$="_en"]').forEach((el) => {
      const isEnNode = el.id.endsWith('_en');
      el.classList.toggle('hide', isAR ? isEnNode : !isEnNode);
    });

    // Form direction tweak for EN readability
    const form = $('#orderForm');
    if (form) form.classList.toggle('ltr', !isAR);

    // Persist preference
    try { localStorage.setItem('lang_pref', lang); } catch {}

    // Update dynamic hints that depend on config time window
    const statusHintAR = `سنعاود الاتصال خلال ${CONFIG.responseHoursMin}–${CONFIG.responseHoursMax} ساعة.`;
    const statusHintEN = `We’ll respond within ${CONFIG.responseHoursMin}–${CONFIG.responseHoursMax} hours.`;
    const hintAR = $('#form_hint_ar');
    const hintEN = $('#form_hint_en');
    if (hintAR) hintAR.textContent = statusHintAR;
    if (hintEN) hintEN.textContent = statusHintEN;
  };

  const getLang = () => {
    let pref = 'ar';
    try {
      pref = localStorage.getItem('lang_pref') || pref;
    } catch {}
    if (!pref) {
      pref = (navigator.language || 'ar').toLowerCase().startsWith('ar') ? 'ar' : 'en';
    }
    return pref;
  };

  // Smooth scroll for same-page anchors
  const enableSmoothScroll = () => {
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (href === '#' || href.length < 2) return;
        const target = $(href);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', href);
      });
    });
  };

  // Build WhatsApp message from form data
  const buildWhatsAppMessage = (data, isAR) => {
    const header = isAR ? 'طلب عرض سعر' : 'Quote request';
    const labels = isAR
      ? { company: 'شركة', person: 'مسؤول', phone: 'هاتف', type: 'نوع', qty: 'كمية', city: 'مدينة', specs: 'المقاسات/الألوان', notes: 'ملاحظات' }
      : { company: 'Company', person: 'Contact', phone: 'Phone', type: 'Type', qty: 'Qty', city: 'City', specs: 'Sizes/Colors', notes: 'Notes' };

    return encodeURIComponent(
      `${header}\n` +
      `${labels.company}: ${data.company}\n` +
      `${labels.person}: ${data.person}\n` +
      `${labels.phone}: ${data.phone}\n` +
      `${labels.type}: ${data.type}\n` +
      `${labels.qty}: ${data.quantity}\n` +
      `${labels.city}: ${data.city || '-'}\n` +
      `${labels.specs}: ${data.specs || '-'}\n` +
      `${labels.notes}: ${data.notes || '-'}`
    );
  };

  // Basic required-field validation
  const validate = (data) => {
    const required = ['company', 'person', 'phone', 'type', 'quantity'];
    const missing = required.filter((k) => !String(data[k] || '').trim());
    return missing;
  };

  // ====== Init on DOM ready ======
  document.addEventListener('DOMContentLoaded', () => {
    // Language init
    setLang(getLang());

    // Buttons to toggle language
    const btnAR = $('#btn_ar');
    const btnEN = $('#btn_en');
    if (btnAR) btnAR.addEventListener('click', () => setLang('ar'));
    if (btnEN) btnEN.addEventListener('click', () => setLang('en'));

    // Smooth scroll
    enableSmoothScroll();

    // Form handling
    const form = $('#orderForm');
    const statusEl = $('#form_status');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const isAR = document.documentElement.lang === 'ar';
        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());

        // Normalize some inputs
        if (data.quantity) data.quantity = Number(data.quantity);

        // Validate
        const missing = validate(data);
        if (missing.length) {
          if (statusEl) {
            statusEl.style.display = 'block';
            statusEl.style.borderColor = 'var(--danger)';
            statusEl.style.color = '#fecaca';
            statusEl.textContent = isAR
              ? 'يرجى تعبئة الحقول الإلزامية.'
              : 'Please fill in the required fields.';
          }
          return;
        }

        // Success UI
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.style.borderColor = 'var(--brand)';
          statusEl.style.color = '#bbf7d0';
          statusEl.textContent = isAR
            ? `تم استلام طلبك بنجاح. سنتواصل معك خلال ${CONFIG.responseHoursMin}–${CONFIG.responseHoursMax} ساعة.`
            : `Your request was received. We will contact you within ${CONFIG.responseHoursMin}–${CONFIG.responseHoursMax} hours.`;
        }

        // Optional: open WhatsApp with prefilled message
        const msg = buildWhatsAppMessage(data, isAR);
        const waUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${msg}`;
        if (CONFIG.autoOpenWhatsApp) window.open(waUrl, '_blank');

        // Reset form
        form.reset();
      });
    }
  });
})();
