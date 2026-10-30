// One brief in. Every layer out. Light, glass, six layers, and wheels that keep turning.
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); }, eOut = t => 1 - Math.pow(1 - clamp(t), 3);
const eB = t => { t = clamp(t); const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const P = (t, a, d) => clamp((t - a) / d);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SPEC = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#0A84FF', '#8E5CF7'];
const store = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { } } };

const cv = $('#fx'), cx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1, T = 0;
const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
const phone = () => W < 760, narrow = () => W <= 1000;
addEventListener('pointermove', e => { mouse.x = e.clientX / W * 2 - 1; mouse.y = e.clientY / H * 2 - 1; }, { passive: true });

// ---------- drawing helpers ----------
function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; }
function ray(x0, y0, x1, y1, col, a = 1, w = 1) {
  if (a <= .002) return;
  cx.lineCap = 'round';
  const g = al => { const gr = cx.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, hexA(col, al * .5)); gr.addColorStop(.25, hexA(col, al)); gr.addColorStop(1, hexA(col, al * .85)); return gr; };
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
  g.addColorStop(0, 'rgba(255,255,255,.94)'); g.addColorStop(.6, 'rgba(236,236,242,.78)'); g.addColorStop(1, 'rgba(214,214,224,.72)');
  cx.fillStyle = g; cx.beginPath(); cx.moveTo(...pts[0]); cx.lineTo(...pts[1]); cx.lineTo(...pts[2]); cx.closePath(); cx.fill();
  cx.shadowColor = 'transparent'; cx.strokeStyle = 'rgba(20,20,26,.6)'; cx.lineWidth = 1.3; cx.stroke();
  cx.strokeStyle = 'rgba(255,255,255,.9)'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(lerp(pts[0][0], pts[1][0], .08), lerp(pts[0][1], pts[1][1], .08)); cx.lineTo(lerp(pts[0][0], pts[1][0], .9), lerp(pts[0][1], pts[1][1], .9)); cx.stroke();
  cx.restore();
}
// concentric guides with a sweeping arc, the motif from the film
function ringsSVG(svg, w, h, cxp, cyp, m, rot, col = '#fff', base = .16) {
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  const r2 = m * .33, a = ((rot % 6.2832) + 6.2832) % 6.2832;
  svg.innerHTML = `<g stroke="${col}" fill="none" stroke-width="1.3" stroke-opacity="${base}">${[.2, .33, .46].map(k => `<circle cx="${cxp}" cy="${cyp}" r="${m * k}"/>`).join('')}<line x1="${cxp}" y1="0" x2="${cxp}" y2="${h}"/><line x1="0" y1="${cyp}" x2="${w}" y2="${cyp}"/><path d="M${cxp} ${cyp - r2} A${r2} ${r2} 0 ${a > Math.PI ? 1 : 0} 1 ${cxp + r2 * Math.sin(a)} ${cyp - r2 * Math.cos(a)}" stroke-opacity="${Math.min(1, base * 3.6)}" stroke-width="2.5"/></g>`;
}
// a 3D drum of words, used in four places
function drum(el, base, R, spacing = .36, dim = .4) {
  const kids = el._items || (el._items = [...el.children].filter(c => c.tagName === 'DIV')), n = kids.length;
  kids.forEach((e, i) => {
    let a = i - base; a = ((a % n) + n) % n; if (a > n / 2) a -= n;
    const ang = a * spacing, z = Math.cos(ang), act = Math.abs(a) < .5;
    e.classList.toggle('on', act);
    e.style.opacity = Math.abs(ang) > 1.45 ? 0 : clamp(z * 1.2 - .15) * (act ? 1 : dim);
    e.style.transform = `translateY(calc(-50% + ${Math.sin(ang) * R}px)) scale(${.55 + .45 * z}) rotateX(${-ang * 50}deg)`;
  });
}

// ---------- intro: Hello. I'm Temi. ----------
const intro = $('#intro');
let introOn = !reduce && !store.get('temi-intro') && !location.hash, introT0 = 0, heroStart = 0, skipAt = null;
const iw = [$('#iw1'), $('#iw2')];
iw.forEach(e => { const dot = e.querySelector('.odot'); const txt = e.firstChild.textContent; e.innerHTML = [...txt].map(c => `<span class="l">${c === ' ' ? '&nbsp;' : c}</span>`).join(''); e.appendChild(dot); });
if (introOn) {
  store.set('temi-intro', '1'); document.documentElement.style.overflow = 'hidden'; heroStart = 2.2;
  const skip = () => { if (skipAt === null && T - introT0 < 2.05) skipAt = T; };
  ['click', 'keydown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, skip, { passive: true, once: true }));
} else { intro.classList.add('gone'); }
function introDraw() {
  if (!introOn) return;
  let t = T - introT0; if (skipAt !== null) t = Math.max(t, 2.05 + (T - skipAt));
  if (skipAt !== null) heroStart = Math.min(heroStart, skipAt + .15);
  const [a, b] = iw, la = $$('.l', a), lb = $$('.l', b);
  const outA = eOut(P(t, 1.0, .4));
  la.forEach((l, i) => { const p = eB(P(t, .1 + i * .05, .45)); l.style.transform = `translateY(${(1 - p) * 110 - outA * 130}%)`; l.style.opacity = clamp(p * 2) * (1 - outA); });
  a.querySelector('.odot').style.transform = `scale(${eB(P(t, .45, .35)) * (1 - outA)})`;
  lb.forEach((l, i) => { const p = eB(P(t, 1.12 + i * .045, .45)); l.style.transform = `translateY(${(1 - p) * 110}%)`; l.style.opacity = clamp(p * 2); });
  b.querySelector('.odot').style.transform = `scale(${eB(P(t, 1.6, .35))})`;
  const svg = intro.querySelector('svg'), m = Math.min(W, H) * (.9 + eOut(P(t, 0, 1.6)) * .5);
  ringsSVG(svg, W, H, W / 2, H / 2, m, t * 2.2, '#fff', .18 * eOut(P(t, 0, .5)));
  const wipe = ease(P(t, 2.05, .6));
  intro.style.clipPath = `inset(0 0 ${wipe * 100}% 0)`;
  if (t > 2.7) { introOn = false; intro.classList.add('gone'); document.documentElement.style.overflow = ''; }
}

// ---------- reveals ----------
const rvs = $$('.rv');
function reveals() {
  for (const e of rvs) {
    const r = e.getBoundingClientRect(); if (r.bottom < -200 || r.top > H + 200) continue;
    const p = reduce ? 1 : eOut((H * .95 - r.top) / (H * .22));
    e.style.opacity = p; e.style.transform = p < 1 ? `translateY(${(1 - p) * 30}px)` : ''; e.style.filter = p < 1 ? `blur(${(1 - p) * 8}px)` : '';
  }
}
const seen = new Map();
function visT(el) { const r = el.getBoundingClientRect(), on = r.top < H * .88 && r.bottom > 0; if (on && !seen.has(el)) seen.set(el, T); return seen.has(el) ? T - seen.get(el) : -1; }

// ---------- hero ----------
const hero = $('#hero'), words = $$('#h1 .w>span'), hx = $$('.hero .hx'), drumEl = $('#drum'), drumKids = [...drumEl.children];
function heroDraw() {
  const h = reduce ? 99 : T - heroStart;
  words.forEach((w, k) => { const p = eOut(P(h, .05 + k * .08, .75)); w.style.transform = `translateY(${(1 - p) * 108}%)`; });
  hx.forEach((e, k) => { const p = eOut(P(h, .55 + k * .1, .6)); e.style.opacity = p; e.style.transform = p < 1 ? `translateY(${(1 - p) * 18}px)` : ''; });
  // the role drum: one face turns up, the next turns in
  const per = 2.2, hh = Math.max(0, h - 1.2), k = Math.floor(hh / per), u = hh / per - k, n = drumKids.length, turn = reduce ? 0 : ease(P(u, .82, .18));
  drumKids.forEach((e, i) => {
    const cur = k % n, nxt = (k + 1) % n;
    if (i === cur) { e.style.opacity = 1 - turn * .9; e.style.transform = `rotateX(${turn * 90}deg)`; }
    else if (i === nxt && turn > 0) { e.style.opacity = turn; e.style.transform = `rotateX(${-90 + turn * 90}deg)`; }
    else { e.style.opacity = 0; }
  });
  // light: beam in, prism lands, the spectrum bursts out
  const r = hero.getBoundingClientRect(); const fade = clamp(1 - (-r.top) / (H * .8)); if (fade <= 0 || h < 0) return;
  const s = phone() ? 78 : Math.min(220, W * .14);
  const px = phone() ? W * .66 : W * .72, py = phone() ? H * .17 : H * .48;
  const land = eB(P(h, .15, .8)), rot = lerp(-.9, -.12, land) + mouse.sy * .08 + Math.sin(T * .6) * .015;
  // guide rings around the prism
  const ringA = eOut(P(h, .3, 1.2)) * fade, R0 = s * 1.15;
  if (ringA > 0) {
    cx.save(); cx.translate(px, py);
    [1, 1.65, 2.35].forEach((k, i) => { cx.strokeStyle = `rgba(17,17,19,${.07 * ringA})`; cx.lineWidth = 1.2; cx.beginPath(); cx.arc(0, 0, R0 * k, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * eOut(P(h, .3 + i * .15, 1.1))); cx.stroke(); });
    const ar = T * .8; cx.strokeStyle = `rgba(17,17,19,${.32 * ringA})`; cx.lineWidth = 2.2; cx.beginPath(); cx.arc(0, 0, R0 * 1.65, ar, ar + 1.4); cx.stroke();
    cx.fillStyle = `rgba(255,122,47,${ringA})`; cx.beginPath(); cx.arc(Math.cos(ar + 1.4) * R0 * 1.65, Math.sin(ar + 1.4) * R0 * 1.65, 4, 0, 7); cx.fill();
    cx.restore();
  }
  const ib = reduce ? 1 : eOut(P(h, .25, .55)), ir = reduce ? 1 : eOut(P(h, .85, 1.1));
  const entry = [px - s * .3, py + s * .05], bx0 = phone() ? W * .2 : W * .5, by0 = -30;
  beam(bx0, by0, lerp(bx0, entry[0], ib), lerp(by0, entry[1], ib), fade);
  const exit = [px + s * .26, py + s * .02], spread = (.08 + mouse.sx * .012) * lerp(.15, 1, ir);
  SPEC.forEach((c, k) => {
    const ang = -.2 + rot * .4 + k * spread + Math.sin(T * .9 + k) * .004, L = Math.hypot(W, H) * 1.1 * ir;
    ray(exit[0], exit[1], exit[0] + Math.cos(ang) * L, exit[1] + Math.sin(ang) * L, c, fade * (ir > 0 ? 1 : 0), phone() ? .7 : 1);
  });
  const fl = Math.sin(Math.PI * P(h, .85, .7)) * fade;
  if (fl > 0) { const g = cx.createRadialGradient(exit[0], exit[1], 0, exit[0], exit[1], s * 2.4); g.addColorStop(0, `rgba(255,255,255,${.9 * fl})`); g.addColorStop(.4, `rgba(255,240,220,${.35 * fl})`); g.addColorStop(1, 'rgba(255,255,255,0)'); cx.fillStyle = g; cx.fillRect(exit[0] - s * 2.4, exit[1] - s * 2.4, s * 4.8, s * 4.8); }
  if (ib >= 1) SPEC.forEach((c, k) => { cx.strokeStyle = hexA(c, .35 * fade); cx.lineWidth = 1.2; cx.beginPath(); cx.moveTo(...entry); cx.lineTo(exit[0], exit[1] - 6 + k * 2.4); cx.stroke(); });
  prism(px, py, s * (.6 + .4 * land), rot, fade * clamp(land * 3));
}

// ---------- header ----------
const hdr = $('#hdr'), blues = $$('.blue');
function headerDraw() {
  const dark = blues.some(b => { const r = b.getBoundingClientRect(); return r.top < 40 && r.bottom > 40; });
  hdr.classList.toggle('dark', dark); hdr.classList.toggle('solid', !dark && scrollY > 60);
}

// ---------- layers: one card at a time, each with a live infographic ----------
const layers = $('#layers'), cards = $$('.lcard'), heads = $$('.lhead'), labels = $$('#slabels span'), sfill = $('#sfill'), cnum = $('#cnum'), cardsBox = $('#cards'), slot = $('#cardslot');
const anims = cards.map(c => $$('[data-a]', c).map(el => {
  const [t, d, kind] = el.dataset.a.split(','); const o = { el, t: +t, d: +d, kind };
  if (kind === 'type') el.dataset.full = el.textContent;
  if (kind === 'pop' && el instanceof SVGElement) { el.style.transformBox = 'fill-box'; el.style.transformOrigin = 'center'; }
  if (kind === 'flip') el.dataset.wait = el.textContent;
  return o;
}));
const since = cards.map(() => null);
function runCard(k, lt) {
  for (const { el, t, d, kind } of anims[k]) {
    const p = reduce ? 1 : P(lt, t, d);
    if (kind === 'in') { const e = eOut(p); el.style.opacity = e; el.style.transform = e < 1 ? `translateY(${(1 - e) * 10}px)` : ''; }
    else if (kind === 'pop') { el.style.opacity = clamp(p * 3); el.style.transform = `scale(${eB(p)})`; }
    else if (kind === 'draw') { el.style.strokeDashoffset = 1 - ease(p); }
    else if (kind === 'fill') { el.firstElementChild.style.transform = `scaleX(${eOut(p)})`; el.classList.toggle('done', p > .5); }
    else if (kind === 'bar') { el.style.transform = `scaleX(${eOut(p)})`; }
    else if (kind === 'type') { const f = el.dataset.full, n = Math.round(f.length * p); if (el.textContent.length !== n) el.textContent = f.slice(0, n); }
    else if (kind === 'count') { el.textContent = Math.round(+el.dataset.n * eOut(p)) + (p >= 1 ? el.dataset.s || '' : ''); }
    else if (kind === 'flip') { const done = p >= 1, c = el.dataset.c; el.className = done ? 'ok' + (c ? ' ' + c : '') : 'ok wait'; el.textContent = done ? (c ? 'pass' : 'merged') : el.dataset.wait; }
  }
  const card = cards[k];
  // packets travel along drawn paths
  const paths = $$('path[data-a]', card);
  $$('.pulse', card).forEach((c, j) => {
    const pth = paths[+c.dataset.p]; if (!pth) return; const L = pth.getTotalLength(), q = ((lt * .42 + j * .27) % 1);
    const on = lt > 2.2 && !reduce; c.style.opacity = on ? Math.sin(q * Math.PI) : 0;
    if (on) { const pt = pth.getPointAtLength(q * L); c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y); }
  });
  if (k === 3) {
    $('#scan').style.transform = `translateY(${reduce ? 70 : (lt * .7 % 1) * 170 - 30}px)`;
    const ok = lt > 2.7 || reduce; const b = $('#aiBtn');
    b.textContent = ok ? 'Confirmed ✓' : 'Confirm values'; b.style.transform = !ok && lt > 2.3 ? `scale(${1 + Math.sin((lt - 2.3) * 12) * .04})` : '';
    $('#aiSt').textContent = ok ? 'Saved only after a person confirmed.' : 'Nothing is saved until a person confirms.';
  }
  if (k === 5) { const n = reduce ? 7 : Math.floor(clamp((lt - 2.5) / .2, 0, 7)); $$('#goals i').forEach((g, i) => g.classList.toggle('on', i < n)); }
}
function fitCards() {
  if (!cards.length) return;
  cardsBox.style.width = Math.min(W > 1300 ? 590 : 540, slot.clientWidth) + 'px';
  cards.forEach(c => { c.style.width = '100%'; c.style.top = '0px'; });
  const mh = Math.max(...cards.map(c => c.offsetHeight)); slot.style.height = mh + 'px';
  cards.forEach(c => c.style.top = Math.round((mh - c.offsetHeight) / 2) + 'px');
}
function stage() {
  const r = layers.getBoundingClientRect(), range = r.height - H;
  const p = clamp(-r.top / range) * 6, i = Math.min(5, Math.floor(p)), u = p - i;
  const tx = reduce ? 0 : ease((u - .8) / .2);
  const on = r.top < H && r.bottom > 0;
  cards.forEach((c, k) => {
    let v = 0, y = 0;
    if (k === i) { v = i < 5 ? 1 - ease((u - .78) / .13) : 1; y = -50 * (1 - v); }
    else if (k === i + 1) { v = ease((u - .86) / .14); y = 50 * (1 - v); }
    if (reduce) v = k === (tx > .5 && i < 5 ? i + 1 : i) ? 1 : 0;
    v = on ? v : 0;
    c.style.opacity = v; c.style.transform = `translateY(${y}px) scale(${.96 + .04 * v})`; c.style.filter = v < .99 && v > 0 ? `blur(${(1 - v) * 10}px)` : '';
    c.style.pointerEvents = v > .5 ? 'auto' : 'none';
    const hd = heads[k]; hd.style.opacity = v; hd.style.transform = `translateY(${y * .8}px)`; hd.style.filter = v < .99 && v > 0 ? `blur(${(1 - v) * 8}px)` : '';
    if (v > 0) { if (since[k] === null) since[k] = T; runCard(k, T - since[k]); } else since[k] = null;
    if (v > 0.01 && on) {
      const cr = c.getBoundingClientRect(), col = SPEC[k], yy = cr.top + cr.height * .4, grow = reduce ? 1 : eOut((T - since[k]) / .5);
      const sx = -40, sy = yy - (phone() ? 40 : 110), ex = lerp(sx, cr.left + 4, grow), ey = lerp(sy, yy, grow);
      ray(sx, sy, ex, ey, col, v);
      const fl = cx.createRadialGradient(cr.left, yy, 0, cr.left, yy, 120); fl.addColorStop(0, hexA(col, .35 * v)); fl.addColorStop(1, hexA(col, 0));
      cx.fillStyle = fl; cx.fillRect(cr.left - 120, yy - 120, 240, 240);
    }
  });
  const act = tx > .5 && i < 5 ? i + 1 : i;
  cnum.textContent = '0' + (act + 1);
  sfill.style.width = (r.top > 0 ? 0 : clamp(p / 6) * 100) + '%';
  labels.forEach((l, k) => { l.style.color = k === act ? (k === 2 ? '#9A7B00' : SPEC[k]) : (k < act ? '#3C3C40' : '#76767C'); });
}

// ---------- answer ----------
const ansCard = $('#ansCard'), ansBars = $$('#ansBars i');
function answerDraw() {
  const r = ansCard.getBoundingClientRect(); if (r.bottom < 0 || r.top > H) return;
  const vis = clamp((H * .9 - r.top) / (H * .3)) * clamp(r.bottom / (H * .4));
  const yy = r.top + Math.min(r.height * .4, 200), right = !phone(), sx = right ? W + 40 : -40, ex = right ? r.right - 2 : r.left + 2;
  SPEC.forEach((c, k) => { const o = k - 2.5, g = eOut(vis * 1.2); ray(sx, yy - 140 + o * 30, lerp(sx, ex, g), lerp(yy - 140 + o * 30, yy + o * 6, g), c, vis * .8, .6); });
  const d = visT(ansCard); ansBars.forEach((b, k) => b.style.transform = `scaleX(${d < 0 ? 0 : eOut((d - .6 - k * .08) / .4)})`);
}

// ---------- work: a horizontal track pinned to the scroll ----------
const work = $('#work'), track = $('#track'), wcases = $$('.case', track), wring = $('#wring'), wnum = $('#wnum');
let maxX = 0;
function fitWork() {
  if (narrow()) { work.style.height = ''; maxX = 0; track.style.transform = ''; return; }
  maxX = Math.max(0, track.scrollWidth - W); work.style.height = (H + maxX) + 'px';
}
function workDraw() {
  const r = work.getBoundingClientRect(); if (r.bottom < 0 || r.top > H) return;
  if (narrow()) { wcases.forEach(c => { const p = reduce ? 1 : eOut((H * .95 - c.getBoundingClientRect().top) / (H * .25)); c.style.opacity = p; c.style.transform = p < 1 ? `translateY(${(1 - p) * 30}px)` : ''; }); return; }
  const pr = clamp(-r.top / Math.max(1, maxX)); track.style.transform = `translateX(${-pr * maxX}px)`;
  wring.style.strokeDashoffset = 1 - pr; wnum.textContent = `0${Math.min(4, Math.round(pr * 3) + 1)} / 04`;
  wcases.forEach(c => {
    const cr = c.getBoundingClientRect(), d = (cr.left + cr.width / 2 - W / 2) / W;
    const s = 1 - Math.min(.07, Math.abs(d) * .09); c.style.transform = `scale(${s}) rotateY(${clamp(d, -1, 1) * -6}deg)`; c.style.opacity = clamp(1.25 - Math.abs(d) * .8, .4, 1);
    const img = c.querySelector('.im img'); img.style.transform = `scale(1.12) translateX(${d * -30}px)`;
  });
  // a ray into the card that is centred
  const mid = wcases.reduce((b, c) => { const cr = c.getBoundingClientRect(); const dd = Math.abs(cr.left + cr.width / 2 - W / 2); return dd < b.d ? { d: dd, c } : b; }, { d: 1e9 }).c;
  if (mid) { const cr = mid.getBoundingClientRect(), col = getComputedStyle(mid).getPropertyValue('--c').trim(), cc = { 'var(--g)': SPEC[3], 'var(--o)': SPEC[1], 'var(--b)': SPEC[4], 'var(--r)': SPEC[0] }[col] || SPEC[3]; const a = clamp(1 - Math.abs(cr.left + cr.width / 2 - W / 2) / (W * .35)) * clamp((H * .4 - r.top) / (H * .4)) * clamp(r.bottom / H); ray(-40, cr.top - 60, cr.left + 4, cr.top + cr.height * .35, cc, a * .9, .8); }
}

// ---------- brief ----------
const BRIEFS = [
  { q: 'Build a carbon reporting platform UK suppliers can prove in a tender.', rows: ['Name, mark and voice: “checked”, never “verified”', 'Evidence ledger, plan writer, PDF and Word statements', 'Row-level security per company; a second person checks', 'Vertex AI reads bills; a person confirms every value', 'London region, nightly backups, Sentry on every job', 'Fast static pages, an estimator, structured data'], built: ['Built: Scopterra', 'https://scopterra.com'] },
  { q: 'One system to run a professional-services firm, from contract to books.', rows: ['Omnistead: “where 1 > many”, a brief and trademark checks', 'Contracts, invoicing, projects, bids, procurement, payroll', '150+ tables, row-level security per firm, double-entry ledger', 'AI contract review against the firm’s own risk rules', 'AWS in London as code: ECS, RDS, KMS, SES; WorkOS SSO', 'Early access for UK firms; accountants invited'], built: ['Building: Omnistead', 'https://omnistead.io'] },
  { q: 'A trusted marketplace for event venues and vendors in Nigeria.', rows: ['Pin-and-chain mark, the Verified stamp, a launch film', 'Directory, shortlists, editors, a tested booking flow', 'Staff roles enforced in the database; NDPA 2023 terms', 'Outreach pipelines in Apps Script; branded emails', 'Edge functions, backups before every live change', 'Structured data on every listing, sitemap, 7 goals'], built: ['Built: Venuralink', 'https://venuralink.com'] },
  { q: 'A booking site for a makeup artist, enquiries straight to her inbox.', rows: ['Plum, rose and gold, real client photography only', 'Next.js 16 site, portfolio filters, Cal.com booking', 'Enquiries and bookings locked down with row-level security', 'Signed webhooks send confirmations with calendar invites', 'Vercel, logged failures, deliverability fixed', 'Fast on mobile, Open Graph image, sitemap'], built: ['Built: Fabhands', 'https://www.fabhands.co.uk'] },
];
const NAMES = ['Brand', 'Product', 'Data', 'AI', 'Cloud', 'Growth'];
const srows = $('#srows'), promptEl = $('#prompt'), built = $('#built'), opts = $$('.opts button'), split = $('#split');
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
  const r = split.getBoundingClientRect(); if (r.bottom < -100 || r.top > H + 100) return;
  const v = clamp((H * .9 - r.top) / (H * .3)) * clamp(r.bottom / (H * .4));
  if (!brief.started && v > .6) selectBrief(0, T, false);
  const B = BRIEFS[brief.i], dt = T - brief.t0, typeDur = B.q.length / 46;
  const n = reduce ? B.q.length : Math.floor(clamp(dt * 46, 0, B.q.length));
  promptEl.innerHTML = B.q.slice(0, n).replace(/&/g, '&amp;').replace(/</g, '&lt;') + (n < B.q.length || Math.floor(T * 2) % 2 ? '<span class="cur"></span>' : '');
  const rows = $$('.srow', srows); let lit = 0;
  rows.forEach((e, k) => { const p = reduce ? 1 : eOut((dt - typeDur - .15 - k * .26) / .4); e.style.opacity = p; e.style.transform = `translateX(${(1 - p) * -18}px)`; if (p > .05) lit = k + 1; });
  built.style.opacity = reduce ? 1 : eOut((dt - typeDur - 1.9) / .5);
  if (v > 0) {
    const yy = r.top + 70, ex = phone() ? r.left + 2 : r.right - 2, sx = phone() ? -30 : W + 30;
    beam(sx, yy - 120, ex, yy, v);
    SPEC.slice(0, lit).forEach((c, k) => { const ry = r.top + 130 + k * 34; ray(sx, ry - 90, ex, ry, c, v * .7, .5); });
  }
  if (!brief.user && brief.started && dt > typeDur + 5.5 && v > .3) selectBrief((brief.i + 1) % BRIEFS.length, T, false);
}

// ---------- brands ----------
const BT = [0, 1, 2, 3].map(i => $('#bt' + i));
function brandsDraw() {
  BT.forEach((el, k) => {
    const d = visT(el); if (d < 0) return;
    const per = 5.2, lt = reduce ? 3 : ((d - k * .3) % per + per) % per, out = reduce ? 0 : ease((lt - (per - .45)) / .4), live = d - k * .3 > 0;
    const q = sel => el.querySelector(sel), o = v => String(clamp(v) * (1 - out));
    if (!live) { el.querySelectorAll('img,svg,div,.b-lab').forEach(x => x.style.opacity = 0); return; }
    if (k === 0) {
      const pop = eB(P(lt, 0, .45)), fl = P(lt, 1.3, .25), fl2 = P(lt, 1.55, .25), land = eB(P(lt, 1.8, .4)), ring = P(lt, 1.8, .6), wm = eOut(P(lt, 2.1, .45));
      const s = q('.b-seer'); s.style.opacity = o(lt < 1.55 ? pop : 0); s.style.transform = `scale(${pop}) scaleX(${1 - ease(fl)}) rotate(${lt * 30}deg)`;
      const e = q('.b-emb'); e.style.opacity = o(lt >= 1.55 ? 1 : 0); e.style.transform = `scaleX(${ease(fl2)}) scale(${.7 + .3 * land})`;
      const rg = q('.b-ring'); rg.style.opacity = ring > 0 && ring < 1 ? 1 - ring : 0; rg.style.transform = `scale(${1 + ring * 2.2})`; rg.style.borderWidth = (5 * (1 - ring) + .5) + 'px';
      const w = q('.b-wm'); w.style.opacity = o(wm); w.style.clipPath = `inset(0 ${100 - wm * 100}% 0 0)`;
      q('.b-lab').style.opacity = o(eOut(P(lt, 2.5, .4)));
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

// ---------- the wheels ----------
const DISC = ['Brand Identity', 'Design Systems', 'Next.js and React', 'TypeScript', 'PostgreSQL', 'Row-level Security', 'AI Automation', 'Vertex AI', 'AWS and CDK', 'Google Cloud', 'SEO and Search', 'Motion and 3D'];
const OPEN = ['AI automation', 'Solutions architecture', 'Full-stack engineering', 'AI product', 'Cloud and platform', 'Digital transformation'];
const wheel = $('#wheel'), disc = $('#disc'), discRings = $('#disc .rings');
wheel.innerHTML = DISC.map(w => `<div>${w}</div>`).join('');
const openW = $('#openwheel'); openW.insertAdjacentHTML('beforeend', OPEN.map(w => `<div>${w}</div>`).join(''));
const stepBase = (st, hold = .35) => Math.floor(st) + (reduce ? 0 : ease((st % 1) / hold));
function discDraw() {
  const r = disc.getBoundingClientRect(); if (r.bottom < 0 || r.top > H) return;
  const sc = (H - r.top) / (H + r.height);
  drum(wheel, stepBase(T * 1.3 + sc * 6), wheel.offsetHeight * .42);
  ringsSVG(discRings, r.width, r.height, r.width * (narrow() ? .5 : .62), r.height / 2, Math.min(r.width, r.height), T * .9);
}
const contact = $('#contact'), cRings = $('#contact .rings'), lets = $('#lets');
{ const dot = lets.querySelector('.odot'); lets.innerHTML = [...lets.firstChild.textContent].map(c => `<span class="l">${c === ' ' ? '&nbsp;' : c}</span>`).join(''); lets.appendChild(dot); }
function contactDraw() {
  const r = contact.getBoundingClientRect(); if (r.bottom < 0 || r.top > H) return;
  drum(openW, stepBase(T * .7), openW.offsetHeight * .4, .42);
  ringsSVG(cRings, r.width, r.height, r.width * (narrow() ? .5 : .72), r.height * (narrow() ? .78 : .5), Math.min(r.width, r.height) * 1.05, -T * .7);
  const d = visT(lets);
  $$('.l', lets).forEach((l, i) => { const p = d < 0 ? 0 : reduce ? 1 : eB(P(d, i * .05, .5)); l.style.transform = `translateY(${(1 - p) * 60}%) rotate(${(1 - p) * 8}deg)`; l.style.opacity = clamp(p * 2); });
  lets.querySelector('.odot').style.transform = `scale(${d < 0 ? 0 : reduce ? 1 : eB(P(d, .6, .4)) * (1 + .12 * Math.sin(T * 3))})`;
}

// ---------- skills: the wheel turns with the scroll, the evidence follows ----------
const skills = $('#skills'), skW = $('#skwheel'), skCards = $$('.skill'), skDots = $$('#skdots i');
const SK = skCards.map(c => c.querySelector('.no span').textContent);
skW.innerHTML = SK.map((s, i) => `<div><b>0${i + 1}</b>${s}</div>`).join('');
const skOp = skCards.map(() => 0);
function skillsDraw() {
  const r = skills.getBoundingClientRect(); if (r.bottom < 0 || r.top > H) return;
  const p = clamp(-r.top / (r.height - H)) * 8 - .5, act = clamp(Math.round(p), 0, 7);
  drum(skW, clamp(p, 0, 7), skW.offsetHeight * .42, .42, .32);
  skCards.forEach((c, k) => { skOp[k] = lerp(skOp[k], k === act ? 1 : 0, reduce ? 1 : .14); c.style.opacity = skOp[k]; c.style.transform = `translateY(${(1 - skOp[k]) * (k < act ? -24 : 24)}px)`; c.style.pointerEvents = k === act ? 'auto' : 'none'; c.style.filter = skOp[k] < .98 ? `blur(${(1 - skOp[k]) * 6}px)` : ''; });
  skDots.forEach((d, k) => d.classList.toggle('on', k === act));
}

// ---------- concepts: two rows that keep moving ----------
const mqs = [$('#mq1'), $('#mq2')];
mqs.forEach(m => { [...m.children].forEach(c => { const k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); m.appendChild(k); }); if (m.children.length < 12) [...m.children].forEach(c => { const k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); m.appendChild(k); }); m._x = 0; m._v = 1; m.addEventListener('pointerenter', () => m._hover = true); m.addEventListener('pointerleave', () => m._hover = false); });
let lastY = scrollY, lastT = 0;
function marqueeDraw(dt) {
  const vel = (scrollY - lastY); lastY = scrollY;
  mqs.forEach((m, k) => {
    const r = m.getBoundingClientRect(); if (r.bottom < -50 || r.top > H + 50) return;
    m._v = lerp(m._v, m._hover ? 0 : 1, .08);
    const half = m.scrollWidth / 2; m._x += (reduce ? 0 : (40 + Math.abs(vel) * 6) * dt * m._v) * (k ? -1 : 1);
    m._x = ((m._x % half) + half) % half;
    m.style.transform = `translateX(${-m._x}px)`;
  });
}

// ---------- toolkit orbit ----------
const ORB = [
  [['PostgreSQL', 1], ['Next.js', 1], ['React 19', 1], ['SQL', 0], ['Node.js', 0]],
  [['AWS CDK', 1], ['ECS Fargate', 1], ['RDS', 0], ['KMS', 0], ['Vertex AI', 1], ['Google Cloud', 0], ['Supabase', 1], ['WorkOS', 0]],
  [['Sentry', 1], ['GitHub Actions', 1], ['pgTAP', 1], ['Vitest', 0], ['Playwright', 0], ['Temporal', 0], ['OpenTelemetry', 0], ['Docker', 0], ['Resend', 0], ['Python', 0]],
];
const orbit = $('#orbit'), orbSvg = orbit.querySelector('svg');
const chips = ORB.flatMap((ring, j) => ring.map(([n, k], i) => { const e = document.createElement('span'); e.className = 'chip' + (k ? ' k' : ''); e.textContent = n; orbit.appendChild(e); return { e, j, i, n: ring.length }; }));
function orbitDraw() {
  const r = orbit.getBoundingClientRect(); if (r.bottom < 0 || r.top > H) return;
  const w = r.width, h = r.height, m = Math.min(w, h), c0 = [w / 2, h / 2], d = visT(orbit), sc = (H - r.top) / (H + h);
  ringsSVG(orbSvg, w, h, c0[0], c0[1], m, T * .6 + sc * 3, '#111113', .1);
  const RR = [.2, .33, .46].map(k => k * m * (phone() ? .84 : 1)), sp = [.16, -.11, .07];
  chips.forEach(({ e, j, i, n }) => {
    const a = i / n * Math.PI * 2 + (reduce ? 0 : T * sp[j] + sc * (j % 2 ? -1 : 1) * 1.2) + j * .4;
    const appear = d < 0 ? 0 : reduce ? 1 : eB(P(d, .1 + j * .25 + i * .04, .5));
    const R = RR[j] * (.6 + .4 * eOut(P(d, j * .2, .9))), z = (Math.sin(a) + 1) / 2;
    e.style.transform = `translate(${c0[0] + Math.cos(a) * R}px,${c0[1] + Math.sin(a) * R}px) translate(-50%,-50%) scale(${appear * (.88 + .14 * z)})`;
    e.style.opacity = clamp(appear * 2); e.style.zIndex = Math.round(z * 10);
  });
}

// ---------- staggered children, counters, method line ----------
const staggers = $$('.stagger'), counts = $$('.count'), numsB = $$('.nums b'), loopLis = $$('#loop li');
function stagDraw() {
  for (const el of staggers) { const d = visT(el); [...el.children].forEach((c, i) => { const q = d < 0 ? 0 : reduce ? 1 : eOut(d * 1.8 / .9 - i * .14); c.style.opacity = q; c.style.transform = q < 1 ? `translateY(${(1 - q) * 18}px) scale(${.95 + .05 * q})` : ''; }); }
  counts.forEach(el => { const d = visT(el), n = +el.dataset.n; el.textContent = (d < 0 ? 0 : Math.round(n * eOut(d / 1.4))) + (d > 1.2 ? (el.dataset.s || '') : ''); });
  numsB.forEach(el => { if (!el.dataset.n) { const mm = el.textContent.match(/^(\d+)(.*)$/); if (!mm) return; el.dataset.n = mm[1]; el.dataset.s = mm[2]; } const d = visT(el), n = +el.dataset.n; el.textContent = (d < 0 ? 0 : Math.round(n * eOut(d / 1.2))) + (d > .9 ? el.dataset.s : ''); });
  const d = loopLis.length ? visT(loopLis[0]) : -1;
  loopLis.forEach((li, i) => { const p = d < 0 ? 0 : reduce ? 1 : eOut(P(d, i * .22, .5)); li.style.setProperty('--p', p); li.style.opacity = .25 + .75 * p; });
}

// ---------- sizes ----------
function resize() {
  DPR = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
  cv.width = W * DPR; cv.height = H * DPR; cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  fitCards(); fitWork();
}
addEventListener('resize', resize); resize();
document.fonts && document.fonts.ready.then(resize);
addEventListener('load', resize);

// ---------- the frame ----------
function frame(dt) {
  mouse.sx = lerp(mouse.sx, mouse.x, .06); mouse.sy = lerp(mouse.sy, mouse.y, .06);
  cx.clearRect(0, 0, W, H);
  introDraw(); headerDraw(); reveals();
  heroDraw(); stage(); answerDraw(); workDraw(); briefDraw();
  brandsDraw(); discDraw(); skillsDraw(); marqueeDraw(dt); orbitDraw(); stagDraw(); contactDraw();
}
const t0 = performance.now();
const loop = now => { const t = (now - t0) / 1000, dt = Math.min(.05, t - lastT); lastT = t; T = t; frame(dt); requestAnimationFrame(loop); };
requestAnimationFrame(loop);
