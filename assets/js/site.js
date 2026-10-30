// One brief in. Every layer out. A light study: one beam, one prism, six layers.
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); }, eOut = t => 1 - Math.pow(1 - clamp(t), 3);
const QS = new URLSearchParams(location.search), FILM = QS.get('film');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches && !FILM;
const SPEC = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#0A84FF', '#8E5CF7'];
if (FILM) document.documentElement.classList.add('film-mode');

const cv = $('#fx'), cx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1, T = 0;
const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
function resize() { DPR = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; cx.setTransform(DPR, 0, 0, DPR, 0, 0); }
addEventListener('resize', resize); resize();
addEventListener('pointermove', e => { mouse.x = e.clientX / W * 2 - 1; mouse.y = e.clientY / H * 2 - 1; }, { passive: true });
const phone = () => W < 760;

// ---------- drawing ----------
function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; }
function ray(x0, y0, x1, y1, col, a = 1, w = 1) {
  if (a <= .002) return;
  cx.lineCap = 'round';
  const g = (alpha) => { const gr = cx.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, hexA(col, alpha * .55)); gr.addColorStop(.25, hexA(col, alpha)); gr.addColorStop(1, hexA(col, alpha * .85)); return gr; };
  [[26 * w, .07], [11 * w, .2], [4.2 * w, .55], [1.8 * w, 1]].forEach(([lw, al]) => { cx.strokeStyle = g(al * a); cx.lineWidth = lw; cx.beginPath(); cx.moveTo(x0, y0); cx.lineTo(x1, y1); cx.stroke(); });
}
function beam(x0, y0, x1, y1, a = 1) {
  cx.lineCap = 'round';
  cx.strokeStyle = `rgba(20,20,30,${.12 * a})`; cx.lineWidth = 7; cx.beginPath(); cx.moveTo(x0, y0); cx.lineTo(x1, y1); cx.stroke();
  cx.strokeStyle = `rgba(255,255,255,${a})`; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(x0, y0); cx.lineTo(x1, y1); cx.stroke();
}
function prism(px, py, s, rot, a = 1) {
  const pts = [[-.58, .5], [0, -.5], [.58, .5]].map(([x, y]) => { const X = x * s, Y = y * s; return [px + X * Math.cos(rot) - Y * Math.sin(rot), py + X * Math.sin(rot) + Y * Math.cos(rot)]; });
  cx.save(); cx.globalAlpha = a;
  cx.shadowColor = 'rgba(20,20,40,.18)'; cx.shadowBlur = 30; cx.shadowOffsetY = 14;
  const g = cx.createLinearGradient(pts[0][0], pts[1][1], pts[2][0], pts[0][1]);
  g.addColorStop(0, 'rgba(255,255,255,.92)'); g.addColorStop(.6, 'rgba(236,236,242,.75)'); g.addColorStop(1, 'rgba(214,214,224,.7)');
  cx.fillStyle = g; cx.beginPath(); cx.moveTo(...pts[0]); cx.lineTo(...pts[1]); cx.lineTo(...pts[2]); cx.closePath(); cx.fill();
  cx.shadowColor = 'transparent'; cx.strokeStyle = 'rgba(20,20,26,.6)'; cx.lineWidth = 1.3; cx.stroke();
  cx.strokeStyle = 'rgba(255,255,255,.9)'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(lerp(pts[0][0], pts[1][0], .08), lerp(pts[0][1], pts[1][1], .08)); cx.lineTo(lerp(pts[0][0], pts[1][0], .9), lerp(pts[0][1], pts[1][1], .9)); cx.stroke();
  cx.restore(); return pts;
}

// ---------- reveals (driven by position, never by observers) ----------
const rvs = $$('.rv');
function reveals() {
  for (const e of rvs) {
    const r = e.getBoundingClientRect(); if (r.bottom < -200 || r.top > H + 200) continue;
    const p = reduce ? 1 : eOut((H * .95 - r.top) / (H * .22));
    e.style.opacity = p; e.style.transform = p < 1 ? `translateY(${(1 - p) * 30}px)` : ''; e.style.filter = p < 1 ? `blur(${(1 - p) * 8}px)` : '';
  }
}

// ---------- layers stage ----------
const layers = $('#layers'), cards = $$('.lcard'), heads = $$('.lhead'), labels = $$('#slabels span'), fill = $('#sfill'), specbar = $('.specbar');
const CN = [[3, '', 'brand systems'], [340, '+', 'PRs merged into Scopterra'], [150, '+', 'tables with row-level security'], [0, '', 'values saved unreviewed'], [0, '', 'cloud keys stored'], [48, '', 'website concepts']];
const cnum = $('#cnum'), clab = $('#clab');
function stage() {
  const r = layers.getBoundingClientRect(), range = r.height - H;
  const p = clamp(-r.top / range) * 6, i = Math.min(5, Math.floor(p)), u = p - i;
  const on = r.top < H && r.bottom > 0;
  let vis = 0, cardR = null;
  cards.forEach((c, k) => {
    let v = 0, inn = 0, out = 0;
    if (k === i && r.top <= 1) { inn = reduce ? 1 : eOut(u / .2); out = k < 5 ? ease((u - .84) / .16) : 0; v = inn * (1 - out); }
    c.style.opacity = v; c.style.transform = `translateY(${(1 - inn) * 46 - out * 40}px) scale(${.95 + .05 * v})`; c.style.filter = v < .99 ? `blur(${(1 - v) * 12}px)` : '';
    c.style.pointerEvents = v > .5 ? 'auto' : 'none';
    const h = heads[k], hin = reduce ? 1 : eOut((u - .05) / .22), hv = k === i && r.top <= 1 ? hin * (1 - out) : 0;
    h.style.opacity = hv; h.style.transform = `translateY(${(1 - hin) * 30 - out * 30}px)`; h.style.filter = hv < .99 ? `blur(${(1 - hv) * 8}px)` : '';
    if (k === i) { vis = v; cardR = c.getBoundingClientRect(); }
  });
  if (on && cardR && vis > 0) {
    const col = SPEC[i], yy = cardR.top + cardR.height * .42, grow = reduce ? 1 : eOut(u / .22);
    const sx = -40, sy = yy - (phone() ? 40 : 120), ex = lerp(sx, cardR.left + 4, grow), ey = lerp(sy, yy, grow);
    SPEC.forEach((c, k) => { if (Math.abs(k - i) === 1) ray(sx, sy + (k - i) * 14, ex, ey + (k - i) * 9, c, vis * .22, .55); });
    ray(sx, sy, ex, ey, col, vis);
    // edge flare where the ray meets the glass
    const fl = cx.createRadialGradient(cardR.left, yy, 0, cardR.left, yy, 120); fl.addColorStop(0, hexA(col, .35 * vis)); fl.addColorStop(1, hexA(col, 0));
    cx.fillStyle = fl; cx.fillRect(cardR.left - 120, yy - 120, 240, 240);
  }
  // counter
  const [n, suf, lab] = CN[i]; cnum.textContent = Math.round(n * eOut(u / .4)) + (u > .3 ? suf : ''); clab.textContent = lab;
  $('.counter').style.opacity = r.top <= 1 && r.bottom > H * .5 ? 1 : 0;
  // spectrum bar
  fill.style.width = (r.top > 0 ? 0 : clamp(p / 6) * 100) + '%';
  labels.forEach((l, k) => { l.style.color = r.top <= 1 && k === i ? SPEC[k] === '#FFCC00' ? '#9A7B00' : SPEC[k] : (r.top <= 1 && k < i ? '#3C3C40' : '#7A7A80'); });
  const ans = $('#answer').getBoundingClientRect();
  specbar.style.opacity = ans.bottom < H * .6 ? clamp((ans.bottom - H * .2) / (H * .4)) : 1;
}

// ---------- hero ----------
const hero = $('#hero');
function heroDraw() {
  const r = hero.getBoundingClientRect(); const fade = clamp(1 - (-r.top) / (H * .75)); if (fade <= 0) return;
  const s = phone() ? 84 : Math.min(230, W * .15);
  const px = phone() ? W * .62 : W * .7, py = phone() ? H * .14 : H * .46;
  const rot = -.12 + mouse.sy * .08 + Math.sin(T * .6) * .015;
  const ib = reduce ? 1 : eOut((T - .15) / .8), ir = reduce ? 1 : eOut((T - .85) / 1.3);
  const entry = [px - s * .3 + Math.cos(rot) * 0, py + s * .05];
  const bx0 = phone() ? W * .18 : W * .5, by0 = -30;
  beam(bx0, by0, lerp(bx0, entry[0], ib), lerp(by0, entry[1], ib), fade);
  const exit = [px + s * .26, py + s * .02], spread = .08 + mouse.sx * .012;
  SPEC.forEach((c, k) => {
    const ang = -.2 + rot * .4 + k * spread + Math.sin(T * .9 + k) * .004, L = Math.hypot(W, H) * 1.1 * ir;
    ray(exit[0], exit[1], exit[0] + Math.cos(ang) * L, exit[1] + Math.sin(ang) * L, c, fade * (ir > 0 ? 1 : 0), phone() ? .7 : 1);
  });
  // dispersion inside the glass
  if (ib >= 1) SPEC.forEach((c, k) => { cx.strokeStyle = hexA(c, .35 * fade); cx.lineWidth = 1.2; cx.beginPath(); cx.moveTo(...entry); cx.lineTo(exit[0], exit[1] - 6 + k * 2.4); cx.stroke(); });
  prism(px, py, s, rot, fade);
}

// ---------- rays into cards (answer, work, brief) ----------
const ansCard = $('#ansCard'), cases = $$('.case'), caseCol = [SPEC[3], SPEC[1], SPEC[4], SPEC[0]];
function fan(el, cols, vis, spreadY = 26, fromRight = false) {
  const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > H || vis <= 0) return;
  const yy = r.top + Math.min(r.height * .4, 200), right = fromRight && !phone();
  const sx = right ? W + 40 : -40, ex = right ? r.right - 2 : r.left + 2;
  cols.forEach((c, k) => { const o = (k - (cols.length - 1) / 2); const g = eOut(vis * 1.2); ray(sx, yy - 140 + o * spreadY, lerp(sx, ex, g), lerp(yy - 140 + o * spreadY, yy + o * 6, g), c, vis * (cols.length > 1 ? .8 : .9), cols.length > 1 ? .6 : .8); });
}
function cardVis(el) { const r = el.getBoundingClientRect(); return clamp((H * .9 - r.top) / (H * .3)) * clamp(r.bottom / (H * .4)); }

// ---------- brief: one prompt, six layers ----------
const BRIEFS = [
  { q: 'Build a carbon reporting platform UK suppliers can prove in a tender.', rows: ['Name, mark and voice: “checked”, never “verified”', 'Evidence ledger, plan writer, PDF and Word statements', 'Row-level security per company; a second person checks', 'Vertex AI reads bills; a person confirms every value', 'London region, nightly backups, Sentry on every job', 'Fast static pages, an estimator, structured data'], built: ['Built: Scopterra', 'https://scopterra.com'] },
  { q: 'One system to run a professional-services firm, from contract to books.', rows: ['Omnistead: “where 1 > many”, a brief and trademark checks', 'Contracts, invoicing, projects, bids, procurement, payroll', '150+ tables, row-level security per firm, double-entry ledger', 'AI contract review against the firm’s own risk rules', 'AWS in London as code: ECS, RDS, KMS, SES; WorkOS SSO', 'Early access for UK firms; accountants invited'], built: ['Building: Omnistead', 'https://omnistead.io'] },
  { q: 'A trusted marketplace for event venues and vendors in Nigeria.', rows: ['Pin-and-chain mark, the Verified stamp, a launch film', 'Directory, shortlists, editors, a tested booking flow', 'Staff roles enforced in the database; NDPA 2023 terms', 'Outreach pipelines in Apps Script; branded emails', 'Edge functions, backups before every live change', 'Structured data on every listing, sitemap, 7 goals'], built: ['Built: Venuralink', 'https://venuralink.com'] },
  { q: 'A booking site for a makeup artist, enquiries straight to her inbox.', rows: ['Plum, rose and gold, real client photography only', 'Next.js 16 site, portfolio filters, Cal.com booking', 'Enquiries and bookings locked down with row-level security', 'Signed webhooks send confirmations with calendar invites', 'Vercel, logged failures, deliverability fixed', 'Fast on mobile, Open Graph image, sitemap'], built: ['Built: Fabhands', 'https://www.fabhands.co.uk'] },
];
const NAMES = ['Brand', 'Product', 'Data', 'AI', 'Cloud', 'Growth'];
const srows = $('#srows'), prompt = $('#prompt'), built = $('#built'), opts = $$('.opts button'), split = $('#split');
let brief = { i: 0, t0: -99, user: false, started: false };
function selectBrief(i, t, user) {
  brief = { i, t0: t, user: user || brief.user, started: true };
  opts.forEach((b, k) => b.setAttribute('aria-pressed', k === i));
  const B = BRIEFS[i];
  srows.innerHTML = B.rows.map((r, k) => `<div class="srow" style="--c:${SPEC[k]}"><b><i></i>${NAMES[k]}</b><span>${r}</span></div>`).join('');
  built.innerHTML = `<span>${B.built[0]}</span><a href="${B.built[1]}" target="_blank" rel="noopener">${B.built[1].replace('https://', '').replace('www.', '')} ↗</a>`;
}
opts.forEach((b, k) => b.addEventListener('click', () => selectBrief(k, T, true)));
selectBrief(0, -99, false); brief.started = false;
function briefDraw() {
  const r = split.getBoundingClientRect(), v = cardVis(split);
  if (!brief.started && v > .6 && !FILM) selectBrief(0, T, false);
  const B = BRIEFS[brief.i], dt = T - brief.t0, typeDur = B.q.length / 46;
  const n = reduce ? B.q.length : Math.floor(clamp(dt * 46, 0, B.q.length));
  prompt.innerHTML = B.q.slice(0, n).replace(/&/g, '&amp;').replace(/</g, '&lt;') + (n < B.q.length || Math.floor(T * 2) % 2 ? '<span class="cur"></span>' : '');
  const rows = $$('.srow', srows); let lit = 0;
  rows.forEach((e, k) => { const p = reduce ? 1 : eOut((dt - typeDur - .15 - k * .26) / .4); e.style.opacity = p; e.style.transform = `translateX(${(1 - p) * -18}px)`; if (p > .05) lit = k + 1; });
  const bp = reduce ? 1 : eOut((dt - typeDur - 1.9) / .5); built.style.opacity = bp;
  // the brief splits: rays for each lit layer
  if (v > 0 && r.bottom > 0 && r.top < H) {
    const yy = r.top + 70, sx = phone() ? -30 : W + 30, ex = phone() ? r.left + 2 : r.right - 2;
    beam(sx, yy - 120, ex, yy, v);
    SPEC.slice(0, lit).forEach((c, k) => { const ry = r.top + 130 + k * 34; ray(phone() ? -30 : W + 30, ry - 90, ex, ry, c, v * .7, .5); });
  }
  // auto-advance until the visitor picks one
  if (!brief.user && !FILM && brief.started && dt > typeDur + 5.5 && v > .3) selectBrief((brief.i + 1) % BRIEFS.length, T, false);
}

// ---------- contact: the beam meets a person ----------
const sil = $('#sil');
function contactDraw() {
  const r = sil.getBoundingClientRect(); if (r.bottom < 0 || r.top > H) return;
  const v = reduce ? 1 : eOut((H * .95 - r.top) / (H * .55));
  const s = Math.min(r.width * .42, r.height * .42, 220), px = r.left + r.width * .5, py = r.top + r.height * .5;
  const rot = -.1 + mouse.sy * .06 + Math.sin(T * .6) * .015;
  const entry = [px - s * .3, py + s * .05], exit = [px + s * .26, py + s * .02];
  beam(phone() ? W * .1 : -30, phone() ? r.top - 40 : py + s * 1.4, lerp(phone() ? W * .1 : -30, entry[0], eOut(v * 1.4)), lerp(phone() ? r.top - 40 : py + s * 1.4, entry[1], eOut(v * 1.4)), v);
  const ir = eOut((v - .45) / .55);
  SPEC.forEach((c, k) => { const ang = -.2 + rot * .4 + k * .08; ray(exit[0], exit[1], exit[0] + Math.cos(ang) * W * 1.2 * ir, exit[1] + Math.sin(ang) * W * 1.2 * ir, c, ir * (phone() ? .7 : .38), .8); });
  prism(px, py, s, rot, clamp(v * 2));
}


// ---------- hero: a role that keeps changing ----------
const ROLES = ['Brand Architect', 'Full-stack Engineer', 'AI Automation Lead', 'Cloud Builder', 'Product Partner'];
const roleW = $('#roleW');
function roleDraw() {
  if (!roleW) return; const per = 2, k = Math.floor(T / per), u = T / per - k;
  const w = ROLES[k % ROLES.length]; if (roleW.textContent !== w) roleW.textContent = w;
  const inn = reduce ? 1 : eOut(u / .18), out = reduce ? 0 : ease((u - .88) / .12);
  roleW.style.transform = `translateY(${(1 - inn) * 110 - out * 110}%)`;
}

// ---------- staggered children, counters and tilting cards ----------
const staggers = $$('.stagger'), tkIn = $$('.tk.stagger-in');
function stag(el, p) { [...el.children].forEach((c, i) => { const q = reduce ? 1 : eOut(p * 1.8 - i * .12); c.style.opacity = q; c.style.transform = q < 1 ? `translateY(${(1 - q) * 18}px) scale(${.94 + .06 * q})` : ''; }); }
const seen = new Map();
function visT(el) { const r = el.getBoundingClientRect(), on = r.top < H * .88 && r.bottom > 0; if (on && !seen.has(el)) seen.set(el, T); return seen.has(el) ? T - seen.get(el) : -1; }
function stagDraw() {
  for (const el of staggers) { const d = visT(el); stag(el, d < 0 ? 0 : d / .9); }
  for (const el of tkIn) { const d = visT(el); [...el.children].forEach((c, i) => { const q = d < 0 ? 0 : reduce ? 1 : eOut((d - i * .045) / .35); const k = d < 0 ? 0 : Math.max(0, Math.min(1, (d - i * .045) / .35)); c.style.opacity = q; c.style.transform = q < 1 ? `scale(${.6 + .4 * (k < 1 ? 1 - Math.pow(1 - k, 3) * (1 - k * .3) : 1)})` : ''; }); }
  $$('.count').forEach(el => { const d = visT(el), n = +el.dataset.n; el.textContent = (d < 0 ? 0 : Math.round(n * eOut(d / 1.4))) + (d > 1 ? (el.dataset.s || '') : ''); });
  $$('.nums b').forEach(el => { if (!el.dataset.n) { const m = el.textContent.match(/^(\d+)(.*)$/); if (!m) return; el.dataset.n = m[1]; el.dataset.s = m[2]; } const d = visT(el), n = +el.dataset.n; el.textContent = (d < 0 ? 0 : Math.round(n * eOut(d / 1.2))) + (d > .9 ? el.dataset.s : ''); });
}
const ccs = $$('.cc');
function tiltDraw() {
  for (const c of ccs) { const r = c.getBoundingClientRect(); if (r.bottom < 0 || r.top > H) continue;
    const cy = (r.top + r.height / 2) / H - .5; const img = c.querySelector('img'); if (img) img.style.transform = `scale(1.08) translateY(${cy * -18}px)`;
    const hover = c.matches(':hover'); const mx = (mouse.x * W / 2 + W / 2 - (r.left + r.width / 2)) / r.width, my = (mouse.y * H / 2 + H / 2 - (r.top + r.height / 2)) / r.height;
    c.style.transform = hover && !reduce ? `perspective(900px) rotateY(${mx * 8}deg) rotateX(${-my * 8}deg) translateY(-4px)` : ''; }
}

// ---------- brands: logos that animate on a loop while in view ----------
const BT = [0, 1, 2, 3].map(i => $('#bt' + i));
const eB = t => { t = clamp(t); const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const P = (t, a, d) => clamp((t - a) / d);
function brandsDraw() {
  BT.forEach((el, k) => {
    if (!el) return; const d = visT(el); if (d < 0) return;
    const per = 5.2, lt = reduce ? 3 : ((d - k * .3) % per + per) % per, out = reduce ? 0 : ease((lt - (per - .45)) / .4), live = d - k * .3 > 0;
    const q = (sel) => el.querySelector(sel), o = v => String(clamp(v) * (1 - out));
    if (!live) { el.querySelectorAll('img,svg,div,.b-lab').forEach(x => x.style.opacity = 0); return; }
    if (k === 0) {
      const pop = eB(P(lt, 0, .45)), fl = P(lt, 1.3, .25), fl2 = P(lt, 1.55, .25), land = eB(P(lt, 1.8, .4)), ring = P(lt, 1.8, .6), wm = eOut(P(lt, 2.1, .45));
      const s = q('.b-seer'); s.style.opacity = o(lt < 1.55 ? pop : 0); s.style.transform = `scale(${pop}) scaleX(${1 - ease(fl)}) rotate(${lt * 30}deg)`;
      const e = q('.b-emb'); e.style.opacity = o(lt >= 1.55 ? 1 : 0); e.style.transform = `scaleX(${ease(fl2)}) scale(${.7 + .3 * land})`;
      const r = q('.b-ring'); r.style.opacity = ring > 0 && ring < 1 ? 1 - ring : 0; r.style.transform = `scale(${1 + ring * 2.2})`; r.style.borderWidth = (5 * (1 - ring) + .5) + 'px';
      const w = q('.b-wm'); w.style.opacity = o(wm); w.style.clipPath = `inset(0 ${100 - wm * 100}% 0 0)`;
      q('.b-lab').style.opacity = o(eOut(P(lt, 2.5, .4))); q('.b-lab').textContent = 'formerly seer.';
    } else if (k === 1) {
      const dr = ease(P(lt, .1, .6)), fill = eOut(P(lt, .6, .25)), one = eB(P(lt, .75, .4)), roof = q('.roof'), on = q('.one');
      q('.b-omni').style.opacity = o(1); roof.style.strokeDashoffset = 1 - dr; roof.style.fillOpacity = fill;
      on.style.transform = `translateY(${(1 - one) * -12}px)`; on.style.opacity = clamp(one * 3);
      const wd = q('.b-word'); if (!wd.dataset.split) { wd.innerHTML = [...wd.textContent].map(c => `<span>${c}</span>`).join(''); wd.dataset.split = 1; }
      wd.style.opacity = o(1); [...wd.children].forEach((c, i) => { const p = eB(P(lt, 1.05 + i * .06, .35)); c.style.opacity = clamp(p); c.style.transform = `translateY(${(1 - p) * 30}px)`; });
      q('.b-lab').style.opacity = o(eOut(P(lt, 1.8, .4)));
    } else if (k === 2) {
      const fall = P(lt, 0, .4), b = lt > .4 ? Math.sin(P(lt, .4, .32) * Math.PI) * -22 * (1 - P(lt, .4, .32)) : 0, sq = lt > .4 && lt < .58 ? 1 - .14 * Math.sin(P(lt, .4, .18) * Math.PI) : 1, sw = eOut(P(lt, 1.5, .5));
      const pin = q('.b-pin'); pin.style.opacity = o(1 - sw); pin.style.transform = `translateY(${lt < .4 ? (1 - eOut(fall)) * -320 : b}px) scale(${1 / sq},${sq})`;
      q('.b-shadow').style.opacity = o(eOut(fall) * (1 - sw)); q('.b-shadow').style.transform = `scale(${eOut(fall)})`;
      const vl = q('.b-vl'); vl.style.opacity = o(sw > 0 ? 1 : 0); vl.style.clipPath = `inset(0 ${100 - sw * 100}% 0 0)`;
    } else {
      const wp = ease(P(lt, .1, .9)), wm = eOut(P(lt, 1.15, .45));
      const fh = q('.b-fh'); fh.style.opacity = o(1); fh.style.clipPath = `inset(0 ${100 - wp * 100}% 0 0)`; fh.style.transform = `rotate(${(1 - wp) * -5}deg)`;
      const fw = q('.b-fw'); fw.style.opacity = o(wm); fw.style.transform = `scaleX(${1.35 - .35 * wm})`; fw.style.filter = `blur(${(1 - wm) * 5}px)`;
    }
  });
}

// ---------- disciplines wheel on blue ----------
const DISC = ['Brand Identity', 'Design Systems', 'Next.js and React', 'TypeScript', 'PostgreSQL', 'Row-level Security', 'AI Automation', 'Vertex AI', 'AWS and CDK', 'Google Cloud', 'SEO and Search', 'Motion and 3D'];
const wheel = $('#wheel'), rings = $('#disc .rings'), disc = $('#disc');
if (wheel) wheel.innerHTML = DISC.map(w => `<div>${w}</div>`).join('');
function discDraw() {
  if (!disc) return; const r = disc.getBoundingClientRect(); if (r.bottom < 0 || r.top > H) return;
  const sc = (H - r.top) / (H + r.height); const st = T * 1.3 + sc * 6, base = Math.floor(st) + (reduce ? 0 : ease((st % 1) / .35));
  const R = wheel.offsetHeight * .42;
  [...wheel.children].forEach((e, i) => { let a = i - base; a = ((a % 12) + 12) % 12; if (a > 6) a -= 12; const ang = a * .36, z = Math.cos(ang), act = Math.abs(a) < .5;
    e.className = act ? 'on' : ''; e.style.opacity = Math.abs(ang) > 1.5 ? 0 : clamp(z * 1.2 - .15) * (act ? 1 : .4);
    e.style.transform = `translateY(calc(-50% + ${Math.sin(ang) * R}px)) scale(${.55 + .45 * z}) rotateX(${-ang * 50}deg)`; });
  const w = r.width, h = r.height, cx0 = w * (phone() ? .5 : .62), cy0 = h / 2, m = Math.min(w, h), rot = T * .9;
  rings.setAttribute('viewBox', `0 0 ${w} ${h}`);
  rings.innerHTML = `<g stroke="#fff" fill="none" stroke-width="1.3" stroke-opacity=".16">${[.2, .33, .46].map(k => `<circle cx="${cx0}" cy="${cy0}" r="${m * k}"/>`).join('')}<line x1="${cx0}" y1="0" x2="${cx0}" y2="${h}"/><line x1="0" y1="${cy0}" x2="${w}" y2="${cy0}"/><path d="M${cx0} ${cy0 - m * .33} A${m * .33} ${m * .33} 0 ${(rot % 6.283) > 3.1416 ? 1 : 0} 1 ${cx0 + m * .33 * Math.sin(rot % 6.283)} ${cy0 - m * .33 * Math.cos(rot % 6.283)}" stroke-opacity=".55" stroke-width="2.5"/></g>`;
}
// ---------- the frame ----------
function frame() {
  mouse.sx = lerp(mouse.sx, mouse.x, .06); mouse.sy = lerp(mouse.sy, mouse.y, .06);
  cx.clearRect(0, 0, W, H);
  reveals(); heroDraw(); stage();
  const av = cardVis(ansCard); fan(ansCard, SPEC, av, 30, true);
  cases.forEach((c, k) => fan(c, [caseCol[k]], cardVis(c) * .9));
  briefDraw(); contactDraw();
  roleDraw(); stagDraw(); tiltDraw(); brandsDraw(); discDraw();
}

if (!FILM) {
  const t0 = performance.now();
  const loop = now => { T = (now - t0) / 1000; frame(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
} else {
  // film: time drives scroll, scroll drives the page
  const cap = $('#cap');
  const CAPS = [[.4, 3.6, 'POV: one person built<br>every layer']];
  const top = id => $(id).offsetTop;
  const lay = p => top('#layers') + clamp(p / 6) * ($('#layers').offsetHeight - H) + 2;
  const mid = id => { const e = $(id); return e.offsetTop + e.offsetHeight / 2 - H / 2; };
  const caseY = k => { const e = cases[k]; return top('#work') + e.offsetTop + e.offsetHeight / 2 - H / 2; };
  let K = null;
  function keys() {
    const k = [[0, 0], [3.8, 0], [4.6, lay(0)]];
    for (let i = 0; i < 6; i++) { const a = 4.6 + i * 2.9; k.push([a + .2, lay(i + .08)], [a + 2.2, lay(i + .78)], [a + 2.9, lay(i + 1)]); }
    const t1 = 4.6 + 6 * 2.9;
    k.push([t1 + .9, mid('#answer')], [t1 + 3, mid('#answer')]);
    for (let i = 0; i < 4; i++) { const a = t1 + 3.9 + i * 1.9; k.push([a, caseY(i)], [a + 1.1, caseY(i)]); }
    const t2 = t1 + 3.9 + 4 * 1.9; // brief
    k.push([t2 + .8, mid('#brief')], [t2 + 5.2, mid('#brief')]);
    k.push([t2 + 6.4, mid('#concepts') - H * .2], [t2 + 7.4, mid('#concepts') + H * .1]);
    k.push([t2 + 8.6, top('#contact')], [t2 + 13, top('#contact')]);
    window.__dur = t2 + 13; window.__briefT = t2 + .9; return k;
  }
  window.__seek = t => {
    if (!K) K = keys();
    let i = 0; while (i < K.length - 1 && K[i + 1][0] <= t) i++;
    const [ta, ya] = K[i], [tb, yb] = K[Math.min(i + 1, K.length - 1)];
    const y = tb > ta ? lerp(ya, yb, ease((t - ta) / (tb - ta))) : ya;
    document.scrollingElement.scrollTop = y; T = t;
    if (t >= window.__briefT && brief.t0 !== window.__briefT) selectBrief(1, window.__briefT, true);
    if (t < window.__briefT) { brief.t0 = -99; }
    const c = CAPS.find(([a, b]) => t >= a && t <= b);
    cap.style.display = c ? 'block' : 'none';
    if (c) { cap.innerHTML = c[2]; const p = eOut((t - c[0]) / .35) * (1 - ease((t - c[1] + .3) / .3)); cap.style.opacity = p; cap.style.transform = `translateY(calc(-50% + ${(1 - p) * 20}px)) scale(${.94 + .06 * p})`; }
    mouse.x = Math.sin(t * .4) * .5; mouse.y = Math.cos(t * .3) * .3;
    frame();
  };
  document.fonts.ready.then(() => Promise.all($$('img').map(i => { i.loading = 'eager'; return i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; }); }))).then(() => { window.__seek(0); window.__ready = true; });
}
