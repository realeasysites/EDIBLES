const { findItem, hoursRows, schemaHours, parseDay } = require('./site');

// Changes whenever the stylesheet or script changes, so a browser can never mix new pages with an old cached stylesheet.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const ASSET_V = crypto.createHash('sha1')
  .update(fs.readFileSync(path.join(__dirname, '..', 'public', 'css', 'style.css')))
  .update(fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'main.js')))
  .digest('hex').slice(0, 10);

const e = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tel = (p) => `+1${String(p).replace(/\D/g, '')}`;

const ADDRESS = '704 University Ave, Rochester, NY 14607';
const MAP_LINK = 'https://www.google.com/maps/dir/?api=1&destination=704+University+Ave+Rochester+NY+14607';
const MAP_EMBED = 'https://www.google.com/maps?q=704+University+Ave,+Rochester,+NY+14607&output=embed';
const SOCIAL = {
  instagram: 'https://www.instagram.com/edibles_restaurant/',
  facebook: 'https://www.facebook.com/edibles-restaurant-33679547173/',
  x: 'https://twitter.com/jmh_edibles',
};

const icons = {
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14 8.5V6.8c0-.8.5-1 1-1h1.9V2.6L14.300 2.600C11.400 2.600 10 4.300 10 6.500v2H7.500V12H10v9.400h4V12h2.700l.4-3.500z"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.500 3h3.200l-7 8 8.200 10h-6.400l-5-6.100L4.800 21H1.600l7.500-8.600L1.200 3h6.600l4.500 5.600zm-1.100 16.200h1.800L6.700 4.700H4.800z"/></svg>',
};

const socials = () => `<div class="social">
  <a href="${SOCIAL.instagram}" target="_blank" rel="noopener" aria-label="Edibles on Instagram">${icons.instagram}</a>
  <a href="${SOCIAL.facebook}" target="_blank" rel="noopener" aria-label="Edibles on Facebook">${icons.facebook}</a>
  <a href="${SOCIAL.x}" target="_blank" rel="noopener" aria-label="Edibles on X">${icons.x}</a>
</div>`;

const ext = 'target="_blank" rel="noopener"';

function announcement(s) {
  if (!s.announcement) return '';
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
  if (s.announcementUntil && today > s.announcementUntil) return '';
  return `<div class="announce">${e(s.announcement)}</div>`;
}

function hoursList(s) {
  return `<dl class="hours">${hoursRows(s).map((r) => `<div><dt>${e(r.label)}</dt><dd>${e(r.value)}</dd></div>`).join('')}</dl>`;
}

function jsonLd(s) {
  return JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Restaurant',
    name: 'Edibles Restaurant & Bar', image: '/images/og-logo.jpg', url: '/',
    telephone: tel(s.phone), email: s.email, priceRange: '$$', servesCuisine: ['Contemporary American', 'American'],
    address: { '@type': 'PostalAddress', streetAddress: '704 University Ave', addressLocality: 'Rochester', addressRegion: 'NY', postalCode: '14607', addressCountry: 'US' },
    openingHoursSpecification: schemaHours(s), hasMenu: '/menu', acceptsReservations: s.reserveUrl || true,
    sameAs: [SOCIAL.instagram, SOCIAL.facebook],
  }).replace(/</g, '\\u003c');
}

function layout(c, { title, desc, page, body }) {
  const { s } = c;
  const clock = { hours: {}, kitchen: s.kitchenLastCall };
  for (let d = 0; d < 7; d++) clock.hours[d] = parseDay(s.hours[d]);
  const nav = [['/', 'Home', 'home'], ['/menu', 'Menus', 'menu'], ['/events', 'Private Events', 'events'], ['/#visit', 'Visit', 'visit']];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)}</title>
<meta name="description" content="${e(desc)}">
<meta property="og:type" content="restaurant">
<meta property="og:title" content="${e(title)}">
<meta property="og:description" content="${e(desc)}">
<meta property="og:image" content="/images/og-logo.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#10141f">
<link rel="icon" href="/images/favicon.png">
<link rel="apple-touch-icon" href="/images/apple-touch-icon.png">
<link rel="preload" href="/fonts/bodoni-moda-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/style.css?v=${ASSET_V}">
<script type="application/ld+json">${jsonLd(s)}</script>
</head>
<body class="page-${page}">
<a class="skip" href="#main">Skip to content</a>
${announcement(s)}
<header class="site-head">
  <a class="brand" href="/" aria-label="Edibles Restaurant & Bar, home"><img src="/images/logo-coaster.png" alt="" width="52" height="52"><span>edibles</span></a>
  <button class="menu-btn" aria-expanded="false" aria-controls="nav"><span class="sr">Menu</span><i></i><i></i></button>
  <nav id="nav" aria-label="Main">
    ${nav.map(([h, l, k]) => `<a href="${h}"${k === page ? ' aria-current="page"' : ''}>${l}</a>`).join('')}
    <a class="nav-tel" href="tel:${tel(s.phone)}">${e(s.phone)}</a>
    ${socials()}
  </nav>
  <div class="head-cta">
    ${s.orderUrl ? `<a class="btn btn-ghost" href="${e(s.orderUrl)}" ${ext}>Order</a>` : ''}
    <a class="btn btn-wine" href="${e(s.reserveUrl)}" ${ext}>Reserve</a>
  </div>
</header>
<main id="main">${body}</main>
<footer class="site-foot">
  <div class="foot-grid">
    <div class="foot-brand">
      <img src="/images/logo-coaster.png" alt="Edibles Restaurant & Bar, established 1996" width="150" height="150" loading="lazy">
    </div>
    <div>
      <h2>Find us</h2>
      <p><a href="${MAP_LINK}" ${ext}>704 University Ave<br>Rochester, NY 14607</a></p>
      <p><a href="tel:${tel(s.phone)}">${e(s.phone)}</a><br><a href="mailto:${e(s.email)}">${e(s.email)}</a></p>
      ${socials()}
    </div>
    <div>
      <h2>Hours</h2>
      ${hoursList(s)}
      <p class="fine">Last orders into the kitchen at 9 pm. The Martini Bar &amp; Lounge stays open later.</p>
    </div>
    <div>
      <h2>Around here</h2>
      <p><a href="/menu">Menus</a><br><a href="/events">Private events</a>
      ${s.orderUrl ? `<br><a href="${e(s.orderUrl)}" ${ext}>Order online</a>` : ''}
      ${s.rewardsUrl ? `<br><a href="${e(s.rewardsUrl)}" ${ext}>Join our rewards</a>` : ''}
      ${s.giftCardUrl ? `<br><a href="${e(s.giftCardUrl)}" ${ext}>Gift cards</a>` : ''}
      ${s.deliveryUrl ? `<br><a href="${e(s.deliveryUrl)}" ${ext}>Delivery</a>` : ''}</p>
    </div>
  </div>
  <div class="foot-base">
    <span>© ${new Date().getFullYear()} Edibles Restaurant &amp; Bar</span>
    <a href="https://getrealeasysites.com" ${ext}>Website by Real Easy Sites</a>
  </div>
</footer>
<div class="dock" aria-label="Quick actions">
  <a href="${e(s.reserveUrl)}" ${ext}>Reserve</a>
  ${s.orderUrl ? `<a href="${e(s.orderUrl)}" ${ext}>Order</a>` : ''}
  <a href="tel:${tel(s.phone)}">Call</a>
</div>
<script>window.__CLOCK=${JSON.stringify(clock).replace(/</g, '\\u003c')}</script>
<script src="/js/main.js?v=${ASSET_V}" defer></script>
</body>
</html>`.replace(/src="(\/images\/[^"]+)"/g, `src="$1?v=${ASSET_V}"`);
}

function plate(c, img, alt, menu, name, cls, opts = {}) {
  const it = findItem(c.menus, menu, name);
  if (!it) return '';
  return `<figure class="plate ${cls}">
    <img src="/images/${img}" alt="${e(alt)}" loading="lazy">
    ${opts.badge ? `<span class="badge">${e(opts.badge)}</span>` : ''}
    <figcaption><strong>${e(it.name)}</strong><span>${e(it.price)}</span><em>${e(it.descr)}</em>${opts.note ? `<small>${e(opts.note)}</small>` : ''}</figcaption>
  </figure>`;
}

// Sides are priced on their section title, e.g. "Sides — $10".
function sidePrice(menus, menu) {
  const sec = (menus[menu] || []).find((x) => /^sides/i.test(x.section));
  const m = sec && sec.section.match(/\$[\d.]+/);
  return m ? m[0] : '';
}

function brusselsCard(c) {
  const salmon = findItem(c.menus, 'dinner', 'Faroe Island Salmon');
  return `<article class="plate p-b type-card">
    <p class="kicker">Order the side</p>
    <h3>Caramelized Brussels</h3>
    <p>The one to add to the table, whatever else you're having. ${e(sidePrice(c.menus, 'dinner'))} as a side${salmon ? `, or get them with the Faroe Island Salmon and its maple-bourbon glaze (${e(salmon.price)})` : ''}.</p>
  </article>`;
}

function reserveBand(s) {
  return `<section class="reserve" id="reserve" aria-label="Reserve a table">
    <div class="reserve-copy">
      <p class="kicker">Today at Edibles</p>
      <p class="status" data-status>${e(s.phone)}</p>
      <div class="reserve-alt">
        ${s.orderUrl ? `<a href="${e(s.orderUrl)}" ${ext}>Order pickup</a>` : ''}
        <a href="tel:${tel(s.phone)}">Call ${e(s.phone)}</a>
      </div>
    </div>
    <div class="reserve-widget">
      ${s.reserveWidget
    ? `<iframe title="Reserve a table at Edibles" data-widget="${e(s.reserveWidget)}" loading="lazy"></iframe>`
    : ''}
      <noscript><a class="btn btn-wine" href="${e(s.reserveUrl)}">Reserve a table</a></noscript>
      ${s.reserveWidget ? '' : `<a class="btn btn-wine" href="${e(s.reserveUrl)}" ${ext}>Reserve a table</a>`}
    </div>
  </section>`;
}

function home(c) {
  const { s, menus, features } = c;
  const cocktails = ['Espresso Martini', 'Gummy Bear Martini', 'Burnt Orange Margarita', 'Jalapeño Peach Margarita', 'Passion Fruit Aperol Spritz', 'Dark and Stormy']
    .map((n) => findItem(menus, 'drinks', n)).filter(Boolean);
  const body = `
<section class="hero">
  <img class="hero-bg" src="/images/bar.jpg" alt="The Edibles bar: white counter, wood stools, exposed brick and blue light along the shelves" fetchpriority="high">
  <div class="hero-in">
    <img class="coaster" src="/images/logo-coaster.png" alt="Edibles Restaurant & Bar, established 1996" width="420" height="420">
    <div class="hero-txt">
      <p class="kicker">Neighborhood of the Arts · Rochester, NY</p>
      <h1>The corner table on University&nbsp;Ave <em>since 1996.</em></h1>
      <p class="lede">Chicken French, caramelized Brussels and a drink list worth the trip, all inside the 1850s Flatiron building.</p>
      <div class="hero-cta">
        <a class="btn btn-wine btn-lg" href="${e(s.reserveUrl)}" ${ext}>Reserve a table</a>
        <a class="btn btn-light btn-lg" href="/menu">See tonight's menu</a>
      </div>
    </div>
  </div>
</section>

${reserveBand(s)}

<section class="story" id="story">
  <div class="story-pic">
    <img src="/images/flatiron.jpg" alt="The brick Flatiron building at 704 University Ave in full autumn color" loading="lazy">
  </div>
  <div class="story-txt">
    <img class="stain" src="/images/ring.svg" alt="" aria-hidden="true">
    <p class="kicker">The building</p>
    <h2>Original floors. Tin ceiling. Thirty years of regulars.</h2>
    <p>Edibles sits in the historic Flatiron building, right in Rochester's arts district. The wood floors and tin ceiling are the real thing, and the exposed brick has seen a lot of good nights.</p>
    <p>The kitchen keeps it simple: American food with a creative twist, plus Italian and Eastern European dishes that have earned their spot on the menu. Vegetarian and gluten-free options are always available.</p>
    <blockquote>“Rustic, but urban style.”<cite>585 Magazine</cite></blockquote>
  </div>
</section>

<section class="plates">
  <header class="sec-head">
    <p class="kicker">From the kitchen</p>
    <h2>Start with the Chicken French</h2>
    <p>Rochester's own dish, done the way it should be. Then let the rest of the table fight over everything else.</p>
  </header>
  <div class="plate-grid">
    ${plate(c, 'french.jpg', 'Egg-battered French-style dish with lemon and shaved cheese over linguini', 'dinner', 'Chicken French', 'p-a', { badge: 'A Rochester original', note: 'Pictured: our Lobster French feature' })}
    ${brusselsCard(c)}
    ${plate(c, 'burrata.jpg', 'Burrata with tomato jam and pesto beside toasted crostini', 'lunch', 'Burrata', 'p-c')}
    ${plate(c, 'medici.jpg', 'Golden chicken cutlet under arugula, tomato and shaved cheese', 'dinner', 'Chicken De Medici', 'p-d')}
    ${plate(c, 'panko.jpg', 'Sliced panko chicken over greens, asparagus, feta and tomato', 'lunch', 'Asparagus Panko Chicken', 'p-d')}
  </div>
  <div class="plates-cta">
    <a class="btn btn-wine btn-lg" href="/menu">See the full menu</a>
    ${s.orderUrl ? `<a class="btn btn-ghost-ink btn-lg" href="${e(s.orderUrl)}" ${ext}>Order for pickup</a>` : ''}
  </div>
</section>

<section class="martini">
  <div class="martini-txt">
    <p class="kicker">Martini Bar &amp; Lounge</p>
    <h2>The drinks are half the reason to come.</h2>
    <p>Craft cocktails, a big martini list, and happy hour specials at the bar on weekdays. Last orders hit the kitchen at 9, but the lounge keeps going later.</p>
    <ul class="pours">
      ${cocktails.map((i) => `<li><span>${e(i.name)}</span><b>${e(i.price)}</b><small>${e(i.descr)}</small></li>`).join('')}
    </ul>
    <a class="btn btn-wine" href="/menu#drinks">See the full drink list</a>
  </div>
  <img src="/images/shelf.jpg" alt="Bottles and glassware on backlit shelves against a brick wall" loading="lazy">
</section>

${features.length ? `<section class="features">
  <header class="sec-head">
    <p class="kicker">Off the menu lately</p>
    <h2>The kitchen doesn't sit still</h2>
    <p>Features change all the time. Ask your server what's on tonight, or follow along on Instagram.</p>
  </header>
  <div class="feat-grid">
    ${features.slice(0, 3).map((f) => {
    const inner = `${f.image ? `<img src="/images/${e(f.image)}" alt="${e(f.title)}" loading="lazy">` : ''}<h3>${e(f.title)}</h3><p>${e(f.descr)}</p>`;
    return `<article class="feat">${f.link ? `<a href="${e(f.link)}" ${ext}>${inner}</a>` : inner}</article>`;
  }).join('')}
  </div>
</section>` : ''}

<section class="parties">
  <div class="parties-pics">
    <img src="/images/longtable.jpg" alt="A long table set with wine glasses for a private party" loading="lazy">
    <img src="/images/cake.jpg" alt="A naked wedding cake with greenery on a table by the window" loading="lazy">
  </div>
  <div class="parties-txt">
    <p class="kicker">Private events</p>
    <h2>Take over the whole place.</h2>
    <p>Rehearsal dinners, milestone birthdays, showers, company nights. We host private parties on Sundays and at Saturday lunch, and we'll talk through closing for your event.</p>
    <a class="btn btn-wine btn-lg" href="/events">Plan your event</a>
  </div>
</section>

<section class="patio">
  <img src="/images/patio.jpg" alt="Sidewalk patio tables under the trees outside Edibles on a sunny afternoon" loading="lazy">
  <div class="patio-card">
    <p class="kicker">Follow along</p>
    <p class="stat">${e(s.instagramFollowers)}</p>
    <p>people watching the features drop on Instagram.</p>
    <a class="btn btn-ink" href="${SOCIAL.instagram}" ${ext}>@edibles_restaurant</a>
    ${socials()}
  </div>
</section>

<section class="visit" id="visit">
  <div class="visit-txt">
    <p class="kicker">Visit</p>
    <h2>704 University Ave</h2>
    <p>Just down the street from the Memorial Art Gallery. Headed to a show? Join us for dinner and drinks first. Reservations and walk-ins are both welcome.</p>
    ${hoursList(s)}
    <p class="fine">Last orders into the kitchen at 9 pm. The Martini Bar &amp; Lounge stays open later. Hours can change for holidays and private events, so call if you're cutting it close.</p>
    <div class="visit-cta">
      <a class="btn btn-ink" href="${MAP_LINK}" ${ext}>Get directions</a>
      <a class="btn btn-ghost-ink" href="tel:${tel(s.phone)}">${e(s.phone)}</a>
    </div>
  </div>
  <iframe class="map" title="Map to Edibles at ${ADDRESS}" src="${MAP_EMBED}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
</section>`;
  return layout(c, {
    page: 'home',
    title: 'Edibles Restaurant & Bar | Rochester, NY | Since 1996',
    desc: 'Lunch, dinner and martinis in the historic Flatiron building at 704 University Ave, Rochester, NY. Reserve a table, order online or plan a private event.',
    body,
  });
}

const HOUSE_TAGS = { 'chicken french': 'A Rochester original' };
const FAVORITES = ['caramelized brussels'];

function menuPanel(id, sections, active) {
  const list = (sec) => sec.items.every((i) => !i.price && !i.descr);
  return `<section class="sheet" id="panel-${id}" role="tabpanel" aria-labelledby="tab-${id}" data-panel="${id}"${active ? '' : ' data-off'}>
    ${sections.map((sec) => `<div class="sheet-sec${list(sec) ? ' is-list' : ''}">
      <h3>${e(sec.section)}</h3>
      ${list(sec)
    ? `<p class="plainlist">${sec.items.map((i) => (FAVORITES.includes(i.name.toLowerCase()) ? `<strong>${e(i.name)}</strong> <small class="fav">House favorite</small>` : e(i.name))).join(' <i>·</i> ')}</p>`
    : sec.items.map((i) => `<div class="dish">
        <p class="dish-line"><span>${e(i.name)}</span><b>${e(i.price)}</b></p>
        ${HOUSE_TAGS[i.name.toLowerCase()] ? `<p class="dish-tag">${e(HOUSE_TAGS[i.name.toLowerCase()])}</p>` : ''}
        ${i.descr ? `<p class="dish-desc">${e(i.descr)}</p>` : ''}
        ${i.note ? `<p class="dish-note">${e(i.note)}</p>` : ''}
      </div>`).join('')}
    </div>`).join('')}
  </section>`;
}

function menu(c) {
  const { s, menus } = c;
  const tabs = [['lunch', 'Lunch', 'Tue – Fri, 12 – 3 pm'], ['dinner', 'Dinner', 'Tue – Sat evenings'], ['drinks', 'Drinks', 'Until late']];
  const body = `
<section class="menu-head">
  <p class="kicker">Menus</p>
  <h1>What's cooking at 704</h1>
  <div class="menu-actions">
    ${s.orderUrl ? `<a class="btn btn-wine" href="${e(s.orderUrl)}" ${ext}>Order for pickup</a>` : ''}
    <a class="btn btn-ghost-ink" href="${e(s.reserveUrl)}" ${ext}>Reserve a table</a>
    <button class="btn btn-ghost-ink" data-print type="button">Print this menu</button>
  </div>
</section>
<div class="tabs" role="tablist" aria-label="Choose a menu">
  ${tabs.map(([id, l, sub], i) => `<button role="tab" id="tab-${id}" aria-controls="panel-${id}" aria-selected="${i === 1}" data-tab="${id}"><span>${l}</span><small>${sub}</small></button>`).join('')}
</div>
<div class="paper">
  <img class="stain stain-menu" src="/images/ring.svg" alt="" aria-hidden="true">
  <img class="print-logo" src="/images/logo-coaster.png" alt="" width="110" height="110">
  ${tabs.map(([id], i) => menuPanel(id, menus[id] || [], i === 1)).join('')}
  <div class="menu-notes">
    <p>Vegetarian &amp; gluten-free options available. Ask about our Soup of the Day.</p>
    <p>A 20% gratuity is added to tables of 8 or more. Please let your server know if you have any food allergies.</p>
  </div>
</div>`;
  return layout(c, {
    page: 'menu',
    title: 'Menus | Edibles Restaurant & Bar, Rochester, NY',
    desc: 'Lunch, dinner, cocktail and wine menus at Edibles, 704 University Ave, Rochester, NY. Chicken French, lobster ravioli, burgers, vegan pasta and a big martini list.',
    body,
  });
}

function events(c) {
  const { s } = c;
  const body = `
<section class="ev-hero">
  <div class="ev-hero-txt">
    <p class="kicker">Private events</p>
    <h1>Your people. Our whole restaurant.</h1>
    <p class="lede">Edibles is the perfect place for your private party. Tell us what you're planning and we'll talk through closing the restaurant or opening on a Sunday just for you.</p>
    <a class="btn btn-wine btn-lg" href="#inquire">Start your inquiry</a>
  </div>
  <img src="/images/longtable.jpg" alt="A long private party table set with wine glasses" fetchpriority="high">
</section>

<section class="ev-ways">
  <article><h2>Sundays</h2><p>We're closed to the public, which makes it a great day for showers, brunches and family milestones.</p></article>
  <article><h2>Saturday lunch</h2><p>The dining room is free before evening service opens at 4:30.</p></article>
  <article><h2>Any other night</h2><p>Want a weeknight or a full buyout? Ask us about closing the restaurant for your event.</p></article>
</section>

<section class="ev-gallery" aria-label="Photos from past events">
  <img src="/images/cake.jpg" alt="Naked wedding cake with fresh greenery" loading="lazy">
  <img src="/images/desserts.jpg" alt="Plated desserts lined up in the kitchen" loading="lazy">
  <img src="/images/dj.jpg" alt="A DJ set up in a draped, candlelit corner of the room" loading="lazy">
  <img src="/images/plating.jpg" alt="A chef plating a course for a private party" loading="lazy">
</section>

<section class="inquire" id="inquire">
  <div class="inquire-txt">
    <img class="stain" src="/images/ring.svg" alt="" aria-hidden="true">
    <h2>Tell us about your event</h2>
    <p>Share what you can and we'll get back to you. Prefer to talk it through? Call <a href="tel:${tel(s.phone)}">${e(s.phone)}</a> or email <a href="mailto:${e(s.email)}">${e(s.email)}</a>.</p>
  </div>
  <form id="inquiry-form" novalidate>
    <label>Your name <input name="name" required autocomplete="name"></label>
    <div class="row">
      <label>Phone <input name="phone" type="tel" autocomplete="tel"></label>
      <label>Email <input name="email" type="email" autocomplete="email"></label>
    </div>
    <div class="row">
      <label>Date <input name="event_date" type="date"></label>
      <label>Guests <input name="guests" inputmode="numeric" placeholder="About how many?"></label>
    </div>
    <label>Occasion
      <select name="occasion">
        <option value="">Choose one</option>
        <option>Wedding or rehearsal dinner</option><option>Birthday or anniversary</option>
        <option>Shower</option><option>Company event</option><option>Holiday party</option><option>Something else</option>
      </select>
    </label>
    <label>Anything else? <textarea name="message" rows="4"></textarea></label>
    <label class="hp" aria-hidden="true">Website <input name="website" tabindex="-1" autocomplete="off"></label>
    <button class="btn btn-wine btn-lg" type="submit">Send inquiry</button>
    <p class="form-msg" role="status" aria-live="polite"></p>
  </form>
</section>`;
  return layout(c, {
    page: 'events',
    title: 'Private Events & Parties | Edibles Restaurant & Bar, Rochester, NY',
    desc: 'Host your rehearsal dinner, shower, birthday or company party at Edibles in Rochester. Sundays, Saturday lunches and full restaurant buyouts by arrangement.',
    body,
  });
}

function notFound(c) {
  return layout(c, {
    page: '404', title: 'Page not found | Edibles Restaurant & Bar', desc: 'That page is not here.',
    body: `<section class="lost"><img class="stain" src="/images/ring.svg" alt="" aria-hidden="true"><h1>That table's not here.</h1><p><a class="btn btn-ink" href="/">Back to the front door</a></p></section>`,
  });
}

module.exports = { home, menu, events, notFound };
