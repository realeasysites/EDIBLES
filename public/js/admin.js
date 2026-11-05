(function () {
  var view = document.getElementById('view');
  var e = function (v) { var d = document.createElement('div'); d.textContent = v == null ? '' : v; return d.innerHTML.replace(/"/g, '&quot;'); };
  var toast = function (m) { var t = document.getElementById('toast'); t.textContent = m; t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, 1800); };
  var api = async function (path, method, body) {
    var r = await fetch('/admin/api' + path, { method: method || 'GET', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 401) { location.reload(); throw new Error('Signed out'); }
    var j = await r.json();
    if (!r.ok) { toast(j.error || 'Could not save'); throw new Error(j.error); }
    return j;
  };

  async function inquiries() {
    var rows = await api('/inquiries');
    view.innerHTML = '<h2>Private event inquiries</h2><p class="hint">Everything from the Private Events form lands here. Delete spam or test entries anytime.</p>' + (rows.length ? rows.map(function (q) {
      return '<div class="card" data-id="' + q.id + '"><div class="top"><div><b>' + e(q.name) + '</b><div class="meta">' + e(q.created_at) + ' UTC</div></div>' +
        '<select class="status" aria-label="Status">' + ['new', 'contacted', 'booked', 'declined'].map(function (s) { return '<option' + (q.status === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></div>' +
        '<p>' + [q.phone && '<a href="tel:' + e(q.phone) + '">' + e(q.phone) + '</a>', q.email && '<a href="mailto:' + e(q.email) + '">' + e(q.email) + '</a>'].filter(Boolean).join(' · ') + '</p>' +
        '<p class="meta">' + [q.event_date, q.guests && q.guests + ' guests', q.occasion].filter(Boolean).map(e).join(' · ') + '</p><p>' + e(q.message) + '</p>' +
        '<div class="acts"><button class="btn del" data-del>Delete</button></div></div>';
    }).join('') : '<p class="empty">No inquiries yet.</p>');
    view.querySelectorAll('.card').forEach(function (c) {
      var id = c.dataset.id;
      c.querySelector('.status').onchange = async function () { await api('/inquiries/' + id, 'PATCH', { status: this.value }); toast('Updated'); };
      c.querySelector('[data-del]').onclick = async function () { if (confirm('Delete this inquiry for good?')) { await api('/inquiries/' + id, 'DELETE'); inquiries(); } };
    });
  }

  var menuTab = 'dinner';
  async function menus() {
    var rows = (await api('/menu')).filter(function (r) { return r.menu === menuTab; });
    var secs = [];
    rows.forEach(function (r) { if (secs.indexOf(r.section) < 0) secs.push(r.section); });
    view.innerHTML = '<h2>Menus</h2><p class="hint">Change a price or dish here and the website updates right away.</p>' +
      '<div class="acts">' + ['lunch', 'dinner', 'drinks'].map(function (m) { return '<button class="btn ' + (m === menuTab ? '' : 'alt') + '" data-m="' + m + '">' + m[0].toUpperCase() + m.slice(1) + '</button>'; }).join('') + '</div>' +
      secs.map(function (s) {
        return '<h3>' + e(s) + '</h3>' + rows.filter(function (r) { return r.section === s; }).map(item).join('') + '<button class="btn alt" data-add="' + e(s) + '">Add to ' + e(s) + '</button>';
      }).join('');
    view.querySelectorAll('[data-m]').forEach(function (b) { b.onclick = function () { menuTab = b.dataset.m; menus(); }; });
    view.querySelectorAll('[data-add]').forEach(function (b) {
      b.onclick = async function () {
        var name = prompt('Name of the new item?');
        if (name) { await api('/menu', 'POST', { menu: menuTab, section: b.dataset.add, name: name }); menus(); }
      };
    });
    view.querySelectorAll('.card').forEach(function (c) {
      var id = c.dataset.id, v = function (n) { return c.querySelector('[name=' + n + ']').value; };
      c.querySelector('[data-save]').onclick = async function () { await api('/menu/' + id, 'PUT', { name: v('name'), price: v('price'), descr: v('descr'), note: v('note') }); toast('Saved'); };
      c.querySelector('[data-del]').onclick = async function () { if (confirm('Remove this item from the menu?')) { await api('/menu/' + id, 'DELETE'); menus(); } };
    });
  }
  function item(r) {
    return '<div class="card" data-id="' + r.id + '"><div class="row"><label>Name<input name="name" value="' + e(r.name) + '"></label><label>Price<input name="price" value="' + e(r.price) + '"></label></div>' +
      '<label>Description<input name="descr" value="' + e(r.descr) + '"></label><label>Add-on line<input name="note" value="' + e(r.note) + '"></label>' +
      '<div class="acts"><button class="btn" data-save>Save</button><button class="btn del" data-del>Remove</button></div></div>';
  }

  async function features() {
    var rows = await api('/features');
    view.innerHTML = '<h2>Features</h2><p class="hint">Post the night\'s feature here. The newest three show on the home page.</p>' +
      '<div class="card"><label>New feature<input id="nt" placeholder="Lobster mac and cheese"></label><label>Description<input id="nd"></label><button class="btn" id="add">Add feature</button></div>' +
      rows.map(function (f) {
        return '<div class="card" data-id="' + f.id + '"><label>Title<input name="title" value="' + e(f.title) + '"></label><label>Description<input name="descr" value="' + e(f.descr) + '"></label>' +
          '<label>Link (optional)<input name="link" value="' + e(f.link) + '"></label><label class="check"><input type="checkbox" name="active"' + (f.active ? ' checked' : '') + '> Show on site</label>' +
          '<div class="acts"><button class="btn" data-save>Save</button><button class="btn del" data-del>Delete</button></div></div>';
      }).join('');
    document.getElementById('add').onclick = async function () {
      var t = document.getElementById('nt').value;
      if (t) { await api('/features', 'POST', { title: t, descr: document.getElementById('nd').value }); features(); }
    };
    view.querySelectorAll('.card[data-id]').forEach(function (c) {
      var id = c.dataset.id, q = function (n) { return c.querySelector('[name=' + n + ']'); };
      c.querySelector('[data-save]').onclick = async function () { await api('/features/' + id, 'PUT', { title: q('title').value, descr: q('descr').value, link: q('link').value, active: q('active').checked }); toast('Saved'); };
      c.querySelector('[data-del]').onclick = async function () { if (confirm('Delete this feature?')) { await api('/features/' + id, 'DELETE'); features(); } };
    });
  }

  var LINKS = [
    ['reserveUrl', 'Reservation link', 'Every Reserve button goes here. Works with Yelp, OpenTable, Resy, Tock or any booking page.'],
    ['reserveWidget', 'Reservation widget (optional)', 'The embedded booking box. Leave empty to show a plain button.'],
    ['orderUrl', 'Online ordering link', 'Every Order button goes here. Toast today, any ordering system tomorrow.'],
    ['rewardsUrl', 'Rewards signup link', ''],
    ['giftCardUrl', 'Gift card link', 'Leave empty to hide gift cards.'],
    ['deliveryUrl', 'Delivery link', 'Grubhub, DoorDash or similar. Leave empty to hide it.'],
  ];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  async function settings() {
    var s = await api('/settings');
    view.innerHTML = '<h2>Links &amp; hours</h2><p class="hint">Switch ordering or reservation systems here and every button on the site follows.</p>' +
      '<div class="card"><h3 style="margin-top:0">Announcement bar</h3><label>Message<input id="announcement" value="' + e(s.announcement) + '"></label><label>Show until (optional)<input type="date" id="announcementUntil" value="' + e(s.announcementUntil) + '"></label></div>' +
      '<div class="card"><h3 style="margin-top:0">Connected tools</h3>' + LINKS.map(function (l) { return '<label>' + l[1] + '<input id="' + l[0] + '" value="' + e(s[l[0]]) + '"><span class="meta" style="font-weight:400">' + l[2] + '</span></label>'; }).join('') + '</div>' +
      '<div class="card"><h3 style="margin-top:0">Hours</h3><p class="hint">24-hour time. Two shifts look like 12:00-15:00,16:00-22:00. Leave empty when closed.</p><div class="grid">' +
      DAYS.map(function (d, i) { return '<span>' + d + '</span><input data-day="' + i + '" value="' + e(s.hours[i]) + '" aria-label="' + d + ' hours">'; }).join('') + '</div>' +
      '<label style="margin-top:12px">Last kitchen orders<input id="kitchenLastCall" value="' + e(s.kitchenLastCall) + '"></label></div>' +
      '<div class="card"><h3 style="margin-top:0">Contact</h3><label>Phone<input id="phone" value="' + e(s.phone) + '"></label><label>Email<input id="email" value="' + e(s.email) + '"></label><label>Instagram followers<input id="instagramFollowers" value="' + e(s.instagramFollowers) + '"></label></div>' +
      '<button class="btn" id="save">Save everything</button>';
    document.getElementById('save').onclick = async function () {
      var out = { hours: {} };
      view.querySelectorAll('input[id]').forEach(function (i) { out[i.id] = i.value.trim(); });
      view.querySelectorAll('[data-day]').forEach(function (i) { out.hours[i.dataset.day] = i.value.trim(); });
      await api('/settings', 'PUT', out);
      toast('Saved');
    };
  }

  var pages = { inq: inquiries, menu: menus, feat: features, set: settings };
  document.querySelectorAll('#tabs button').forEach(function (b) {
    b.onclick = function () {
      document.querySelectorAll('#tabs button').forEach(function (x) { x.classList.toggle('on', x === b); });
      pages[b.dataset.t]();
    };
  });
  document.getElementById('out').onclick = async function () { await fetch('/admin/logout', { method: 'POST' }); location.reload(); };
  inquiries();
})();
