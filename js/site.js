(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- menu ---------- */
  const menu = $('#menu'), amp = $('#menu-btn');
  function openMenu() {
    menu.classList.add('open'); menu.setAttribute('aria-hidden', 'false');
    amp.setAttribute('aria-expanded', 'true'); amp.setAttribute('aria-label', 'Close menu');
    document.body.style.overflow = 'hidden'; document.body.classList.add('menu-open');
    $$('#main, footer, .draftbar').forEach(el => { el.inert = true; });
    setTimeout(() => $('a', menu).focus(), 50);
  }
  function closeMenu(returnFocus) {
    if (!menu.classList.contains('open')) return;
    menu.classList.remove('open'); menu.setAttribute('aria-hidden', 'true');
    amp.setAttribute('aria-expanded', 'false'); amp.setAttribute('aria-label', 'Open menu');
    document.body.style.overflow = ''; document.body.classList.remove('menu-open');
    $$('#main, footer, .draftbar').forEach(el => { el.inert = false; });
    if (returnFocus) amp.focus();
  }
  amp.addEventListener('click', () => (menu.classList.contains('open') ? closeMenu(true) : openMenu()));
  /* portfolio dropdown inside the menu */
  const gbtn = $('#group-btn');
  const setGroup = open => { gbtn.setAttribute('aria-expanded', String(open)); $('#group-list').inert = !open; };
  gbtn.addEventListener('click', () => setGroup(gbtn.getAttribute('aria-expanded') !== 'true'));
  $('#group-list').inert = true;
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(true); });

  /* ---------- notes ---------- */
  const tn = $('#toggle-notes'); /* the draft bar is stripped from the live build */
  if (tn) tn.addEventListener('click', e => {
    const clean = document.body.classList.toggle('clean');
    e.currentTarget.textContent = clean ? 'Show notes' : 'Hide notes';
    e.currentTarget.setAttribute('aria-pressed', String(clean));
  });

  /* ---------- before / after ---------- */
  $$('.ba').forEach(ba => {
    const r = $('.ba-range', ba);
    const set = () => ba.style.setProperty('--pos', r.value + '%');
    r.addEventListener('input', set); set();
  });

  /* ---------- about ---------- */
  const rb = $('#resume-btn');
  /* the claude.ai preview frame blocks downloads, so there the button explains instead of failing silently */
  if (rb) rb.addEventListener('click', e => { if (/claudeusercontent\.com$/.test(location.hostname)) { e.preventDefault(); $('#resume-msg').hidden = false; } });

  /* ---------- contact ---------- */
  /* #contact/family opens the form with Family already chosen */
  let pickWho = () => {};
  const form = $('#inquiry');
  if (form) {
    const radios = $$('[data-who]', form);
    const setWho = who => {
      radios.forEach(b => { const on = b.dataset.who === who; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
      $$('[data-for]', form).forEach(l => { l.hidden = !l.dataset.for.split(' ').includes(who); });
      $('#msg-label').textContent = who === 'employer' ? 'Tell me about the role or project' : "Tell me what you're picturing";
    };
    radios.forEach(b => b.addEventListener('click', () => setWho(b.dataset.who)));
    $('.who', form).addEventListener('keydown', e => {
      const i = radios.findIndex(b => b.getAttribute('aria-checked') === 'true');
      const map = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      let n = null;
      if (e.key in map) n = radios[(i + map[e.key] + radios.length) % radios.length];
      if (e.key === 'Home') n = radios[0];
      if (e.key === 'End') n = radios[radios.length - 1];
      if (n) { setWho(n.dataset.who); n.focus(); e.preventDefault(); }
    });
    setWho('senior');
    pickWho = who => { if (radios.some(b => b.dataset.who === who)) setWho(who); };
    const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
    /* messages go to Kaysen's Gmail through FormSubmit (the first one ever sent asks her to confirm the address) */
    const INBOX = 'https://formsubmit.co/ajax/kaysenlomaxphotography@gmail.com';
    const sendBtn = $('button[type="submit"]', form), sendErr = $('#send-err');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const name = $('#f-name'), email = $('#f-email');
      const checks = [[name, !name.value.trim()], [email, !emailOk(email.value)]];
      checks.forEach(([el, bad]) => { $('.err', el.closest('label')).hidden = !bad; el.setAttribute('aria-invalid', String(bad)); });
      const first = checks.find(([, bad]) => bad);
      $('#sent').hidden = true; sendErr.hidden = true;
      if (first) { first[0].focus(); return; }
      const who = radios.find(b => b.getAttribute('aria-checked') === 'true');
      const val = n => (form.elements[n] ? form.elements[n].value.trim() : '');
      const data = { name: val('name'), email: val('email'), who: who ? who.textContent.trim() : '', date: val('date'), location: val('location'), org: val('org'), role: val('role'), message: val('message'),
        _subject: `New inquiry from ${val('name')}`, _replyto: val('email'), _template: 'table', _honey: val('_honey') };
      sendBtn.disabled = true; sendBtn.textContent = 'Sending…';
      try {
        const r = await fetch(INBOX, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
        if (!r.ok) throw new Error(String(r.status));
        $('#sent').hidden = false; form.reset();
        $('#sent').scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
      } catch (err) {
        sendErr.hidden = false;
      } finally {
        sendBtn.disabled = false; sendBtn.textContent = 'Send it to Kaysen';
      }
    });
  }
  const cb = $('#copy-email');
  if (cb) cb.addEventListener('click', () => {
    const el = $('#email');
    const fallback = () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); cb.textContent = 'Selected'; setTimeout(() => (cb.textContent = 'Copy'), 1600); };
    try { navigator.clipboard.writeText(el.textContent).then(() => { cb.textContent = 'Copied'; setTimeout(() => (cb.textContent = 'Copy'), 1600); }, fallback); } catch (err) { fallback(); }
  });

  /* ---------- video ---------- */
  const players = $$('.player');
  /* the claude.ai draft host blocks every third-party iframe, so there we play the compact MP4 copy instead of the YouTube embed */
  const noEmbeds = () => /claudeusercontent\.com$/.test(location.hostname) || document.documentElement.dataset.embeds === 'off';
  function stopPlayer(p) {
    const m = $('iframe,video', p); if (!m) return;
    m.remove(); $('.play', p).hidden = false; p.classList.remove('playing');
  }
  function startPlayer(p) {
    players.forEach(o => { if (o !== p) stopPlayer(o); });
    const btn = $('.play', p); btn.hidden = true; p.classList.add('playing');
    let m;
    if (p.dataset.yt && !(p.dataset.src && noEmbeds())) {
      m = document.createElement('iframe');
      m.src = `https://www.youtube-nocookie.com/embed/${p.dataset.yt}?autoplay=1&rel=0&playsinline=1`;
      m.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
      m.allowFullscreen = true; m.referrerPolicy = 'strict-origin-when-cross-origin';
    } else {
      m = document.createElement('video');
      m.src = p.dataset.src; m.controls = true; m.autoplay = true; m.playsInline = true; m.poster = $('img', btn).src;
    }
    m.title = p.dataset.title || 'Video';
    m.tabIndex = -1;
    p.appendChild(m);
    m.focus({ preventScroll: true });
    if (m.play) m.play().catch(() => {}); /* a browser that refuses autoplay just shows the controls */
  }
  players.forEach(p => $('.play', p).addEventListener('click', () => startPlayer(p)));
  $$('.pset').forEach(set => {
    const p = document.getElementById(set.dataset.for); if (!p) return;
    $$('button', set).forEach(b => b.addEventListener('click', () => {
      $$('button', set).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      const was = p.classList.contains('playing'); stopPlayer(p);
      p.dataset.yt = b.dataset.yt; p.dataset.title = b.dataset.title;
      if (b.dataset.src) p.dataset.src = b.dataset.src; else delete p.dataset.src;
      const btn = $('.play', p), img = $('img', btn);
      img.src = b.dataset.poster; img.alt = `${b.dataset.title} title card`; btn.setAttribute('aria-label', `Play ${b.dataset.title}`);
      /* the chosen film's own notes show beside the player */
      $$('.film-note', p.closest('.page')).forEach(n => { n.hidden = n.dataset.film !== b.dataset.key; });
      if (was) startPlayer(p);
    }));
  });
  /* #case-impact/sisterhood opens the Chi Omega page on that film */
  function pickFilm(page, key) {
    const set = $('.pset', page); if (!set) return;
    const b = (key && $(`button[data-key="${key}"]`, set)) || $('button', set);
    if (b && b.getAttribute('aria-pressed') !== 'true') b.click();
  }

  /* ---------- router ---------- */
  let firstRoute = true;
  function route() {
    const [h, sub] = (location.hash || '#home').slice(1).split('/');
    const page = $$('.page').find(p => p.dataset.page === h) || $('.page[data-page="home"]');
    $$('.page').forEach(p => p.classList.toggle('on', p === page));
    const key = page.dataset.parent || page.dataset.page;
    $$('[data-nav]').forEach(a => (a.dataset.nav === key ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    const inGroup = gbtn.dataset.navGroup.split(' ').includes(key);
    if (inGroup) gbtn.setAttribute('aria-current', 'true'); else gbtn.removeAttribute('aria-current');
    setGroup(inGroup);
    closeMenu(false);
    players.forEach(stopPlayer);
    pickFilm(page, sub);
    if (page.dataset.page === 'contact') pickWho(sub || 'senior');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const h1 = $('h1', page);
    document.title = key === 'home' ? 'Kaysen Lomax · Northeast Arkansas Photographer & Multimedia Creator' : `${page.dataset.title || (h1 ? h1.textContent.trim() : '')} · Kaysen Lomax`;
    /* keyboard and screen-reader users land on the new page's heading instead of back at the top of the document */
    if (!firstRoute && h1) { h1.tabIndex = -1; h1.focus({ preventScroll: true }); }
    firstRoute = false;
  }
  addEventListener('hashchange', route);
  /* clicking a link to the page you're already on still closes the menu and returns to the top */
  document.addEventListener('click', e => { const a = e.target.closest('a[href^="#"]'); if (a && a.getAttribute('href') === location.hash) route(); });
  route();
})();
