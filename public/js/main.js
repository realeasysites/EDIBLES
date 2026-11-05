(function () {
  /* Mobile nav */
  var btn = document.querySelector('.menu-btn');
  var head = document.querySelector('.site-head');
  if (btn) btn.addEventListener('click', function () {
    var open = head.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });

  /* Open / closed line, always on Rochester time */
  var clock = window.__CLOCK || {};
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var toMin = function (t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; };
  var fmt = function (t) {
    var m = toMin(t), h = Math.floor(m / 60), mm = m % 60;
    return (h % 12 || 12) + (mm ? ':' + String(mm).padStart(2, '0') : '') + (h < 12 ? ' am' : ' pm');
  };
  function now() {
    var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    var get = function (k) { return parts.find(function (p) { return p.type === k; }).value; };
    return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')), min: (+get('hour') % 24) * 60 + +get('minute') };
  }
  function status() {
    var n = now(), today = (clock.hours && clock.hours[n.day]) || [];
    for (var i = 0; i < today.length; i++) {
      var open = toMin(today[i][0]), close = toMin(today[i][1]);
      if (n.min >= open && n.min < close) {
        var kitchen = clock.kitchen && close > toMin(clock.kitchen) ? ' Last kitchen orders at ' + fmt(clock.kitchen) + '.' : ' Serving until ' + fmt(today[i][1]) + '.';
        return 'We’re open now.' + kitchen;
      }
      if (n.min < open) return 'Open today at ' + fmt(today[i][0]) + '.';
    }
    for (var d = 1; d <= 7; d++) {
      var day = (n.day + d) % 7, h = clock.hours && clock.hours[day];
      if (h && h.length) return 'Closed now. Back ' + (d === 1 ? 'tomorrow' : DAYS[day]) + ' at ' + fmt(h[0][0]) + '.';
    }
    return '';
  }
  document.querySelectorAll('[data-status]').forEach(function (el) { var t = status(); if (t) el.textContent = t; });

  /* Reservation widget on larger screens. Phones use the Reserve button in the dock. */
  var frame = document.querySelector('[data-widget]');
  if (frame && window.innerWidth >= 640) frame.src = frame.getAttribute('data-widget');

  /* Menu tabs: opens on whichever menu is being served right now */
  var tabs = [].slice.call(document.querySelectorAll('[data-tab]'));
  if (tabs.length) {
    var show = function (id, focus) {
      tabs.forEach(function (t) {
        var on = t.dataset.tab === id;
        t.setAttribute('aria-selected', on);
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      document.querySelectorAll('[data-panel]').forEach(function (p) {
        if (p.dataset.panel === id) p.removeAttribute('data-off'); else p.setAttribute('data-off', '');
      });
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(t.dataset.tab); history.replaceState(null, '', '#' + t.dataset.tab); });
      t.addEventListener('keydown', function (ev) {
        var d = ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowLeft' ? -1 : 0;
        if (d) show(tabs[(i + d + tabs.length) % tabs.length].dataset.tab, true);
      });
    });
    var pick = function () {
      var h = location.hash.slice(1);
      if (['lunch', 'dinner', 'drinks'].indexOf(h) > -1) return h;
      var n = now();
      return n.day >= 2 && n.day <= 5 && n.min < 15 * 60 ? 'lunch' : 'dinner';
    };
    show(pick());
    var p = document.querySelector('[data-print]');
    if (p) p.addEventListener('click', function () { window.print(); });
  }

  /* Private event form */
  var form = document.getElementById('inquiry-form');
  if (form) form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var msg = form.querySelector('.form-msg'), submit = form.querySelector('[type=submit]');
    msg.className = 'form-msg';
    msg.textContent = 'Sending...';
    submit.disabled = true;
    fetch('/api/inquiry', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); }).then(function (r) {
      if (!r.ok) throw new Error(r.j.error || 'Something went wrong.');
      form.reset();
      msg.className = 'form-msg ok';
      msg.textContent = 'Got it, thank you. We’ll be in touch soon.';
    }).catch(function (err) {
      msg.className = 'form-msg bad';
      msg.textContent = err.message || 'Something went wrong. Please call us.';
    }).finally(function () { submit.disabled = false; });
  });
})();
