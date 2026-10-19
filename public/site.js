// Mobile menu toggle. Without JS the nav is shown inline (see .no-js in site.css).
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });
})();

// Before and after sliders: the range input sets how much of the before photo shows.
(function () {
  var figs = document.querySelectorAll('[data-ba]');
  for (var i = 0; i < figs.length; i++) {
    (function (fig) {
      var frame = fig.querySelector('.ba-frame');
      var range = fig.querySelector('.ba-range');
      if (!frame || !range) return;
      var set = function () { frame.style.setProperty('--pos', range.value + '%'); };
      range.addEventListener('input', set);
      set();
    })(figs[i]);
  }
})();
