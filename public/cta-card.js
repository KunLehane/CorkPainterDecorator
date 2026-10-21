// Slide-in call / quick-action card (desktop and tablet only; mobile already has the call bar).
(function () {
  var C = {
    key: 'cpdCtaCard',
    skip: ['/quote/', '/thank-you/', '/contact/'],
    eyebrow: 'Thinking of painting?',
    title: 'Get a Written Price',
    body: 'Send a few photos of the job and get a written price before any work starts.',
    callLabel: 'Call Us',
    tel: '+353894704697',
    ctaLabel: 'Get a Quote',
    ctaHref: '/quote/',
    phone: '089 470 4697',
    note: 'Cork city and county',
    css: '--cc-accent:#153a6b;--cc-accent-ink:#ffffff;--cc-dark:#2B2F33;--cc-text:#3A3F44;--cc-muted:#6B7177;--cc-bg:#ffffff;--cc-line:#E3E5E8;--cc-head:Chivo,Arial,sans-serif;--cc-body:"Atkinson Hyperlegible",Arial,sans-serif;--cc-radius:4px;--cc-title-size:26px;--cc-title-tt:none;--cc-title-w:700;--cc-eyebrow:#153a6b;'
  };
  var path = location.pathname;
  if (C.skip.indexOf(path) !== -1 || !window.matchMedia('(min-width: 768px)').matches) return;
  var store = function (fn) { try { return fn(); } catch (e) { return null; } };
  var closed = store(function () { return Number(localStorage.getItem(C.key) || 0); });
  if (closed && Date.now() - closed < 7 * 864e5) return;
  if (store(function () { return sessionStorage.getItem(C.key + 'Seen'); })) return;

  var style = document.createElement('style');
  style.textContent = '.cc-card{' + C.css + 'position:fixed;right:24px;bottom:112px;z-index:99990;width:380px;max-width:calc(100vw - 48px);background:var(--cc-bg);border-top:4px solid var(--cc-accent);border-radius:var(--cc-radius);box-shadow:0 18px 50px rgba(20,24,28,.22);padding:30px 30px 24px;font-family:var(--cc-body);color:var(--cc-text);transform:translateY(24px);opacity:0;visibility:hidden;transition:transform .35s ease,opacity .35s ease,visibility .35s}' +
    '.cc-card.cc-open{transform:none;opacity:1;visibility:visible}' +
    '.cc-card *{box-sizing:border-box}' +
    '.cc-card .cc-x{position:absolute;top:10px;right:10px;width:34px;height:34px;min-height:0;margin:0;padding:0;border:0!important;background:transparent!important;box-shadow:none!important;color:var(--cc-dark)!important;font:400 24px/34px Arial,sans-serif!important;text-align:center;cursor:pointer;border-radius:50%!important}.cc-card .cc-x:hover{background:rgba(0,0,0,.06)!important}' +
    '.cc-card .cc-eyebrow{padding-right:30px;margin:0 0 10px;line-height:1.5!important;font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--cc-eyebrow)}' +
    '.cc-card .cc-title{margin:0 0 12px!important;padding:0 24px 0 0!important;font-family:var(--cc-head)!important;font-size:var(--cc-title-size)!important;line-height:1.2!important;font-weight:var(--cc-title-w)!important;letter-spacing:0!important;text-transform:var(--cc-title-tt)!important;color:var(--cc-dark)!important}' +
    '.cc-card .cc-body{margin:0 0 20px;font-size:15px;line-height:1.6}' +
    '.cc-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:52px;margin:0 0 12px;padding:12px 18px;border-radius:var(--cc-radius);font-family:var(--cc-body);font-size:14px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;transition:background .2s,color .2s,border-color .2s}' +
    '.cc-card .cc-call,.cc-card .cc-call:visited{border:1px solid var(--cc-line);background:var(--cc-bg);color:var(--cc-dark)!important}.cc-call:hover{border-color:var(--cc-dark)}' +
    '.cc-card .cc-go,.cc-card .cc-go:hover,.cc-card .cc-go:visited{border:1px solid var(--cc-accent);background:var(--cc-accent);color:var(--cc-accent-ink)!important}.cc-go:hover{filter:brightness(1.08)}' +
    '.cc-btn svg{width:18px;height:18px;flex:0 0 auto}' +
    '.cc-phone{margin:8px 0 2px;text-align:center;font-family:var(--cc-body);font-size:24px;font-weight:700}.cc-phone a{color:var(--cc-dark);text-decoration:none}' +
    '.cc-note{margin:0;text-align:center;font-size:13px;color:var(--cc-muted)}' +
    '@media (prefers-reduced-motion:reduce){.cc-card{transition:none}}';
  document.head.appendChild(style);

  var phoneSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.8 2z"/></svg>';
  var arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var card = document.createElement('aside');
  card.className = 'cc-card';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-label', C.title);
  card.innerHTML = '<button type="button" class="cc-x" aria-label="Close">&times;</button>' +
    '<p class="cc-eyebrow">' + C.eyebrow + '</p><h2 class="cc-title">' + C.title + '</h2><p class="cc-body">' + C.body + '</p>' +
    '<a class="cc-btn cc-call" data-cc="call" href="tel:' + C.tel + '">' + phoneSvg + C.callLabel + '</a>' +
    '<a class="cc-btn cc-go" data-cc="cta" href="' + C.ctaHref + '">' + C.ctaLabel + arrow + '</a>' +
    '<p class="cc-phone"><a data-cc="call" href="tel:' + C.tel + '">' + C.phone + '</a></p><p class="cc-note">' + C.note + '</p>';

  var shown = false;
  function show() {
    if (shown) return; shown = true;
    document.body.appendChild(card);
    requestAnimationFrame(function () { requestAnimationFrame(function () { card.classList.add('cc-open'); }); });
    store(function () { sessionStorage.setItem(C.key + 'Seen', '1'); });
    push('cta_card_shown');
    window.removeEventListener('scroll', onScroll);
  }
  function hide() {
    card.classList.remove('cc-open');
    store(function () { localStorage.setItem(C.key, String(Date.now())); });
    push('cta_card_closed');
  }
  function push(event, extra) { window.dataLayer = window.dataLayer || []; var o = { event: event, cta_card: C.key }; if (extra) o.cta_action = extra; window.dataLayer.push(o); }
  function onScroll() { var h = document.documentElement; var available = h.scrollHeight - innerHeight; if (available > 0 && h.scrollTop / available >= 0.6) show(); }
  card.addEventListener('click', function (e) {
    if (e.target.closest('.cc-x')) return hide();
    var a = e.target.closest('[data-cc]'); if (a) { push('cta_card_click', a.getAttribute('data-cc')); store(function () { localStorage.setItem(C.key, String(Date.now())); }); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && card.classList.contains('cc-open')) hide(); });
  window.addEventListener('scroll', onScroll, { passive: true });
  // Reveal only on a real scroll reaching 60%; no timed popup.
})();
