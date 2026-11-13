// Battles happen where you stand. When the leader walks into a group of monsters the party spreads out
// to face them on the same map, and everyone's gauge fills by speed. When a friend's gauge is full the
// game waits while you choose. Techniques reach different shapes of ground: one foe, a line from the
// user through the target, a circle round the target or round the user, or everyone. Two or three
// friends whose gauges are all full can combine their techniques.
import { ctx, W, H, text, textW, windowBox, bar, HAND, HAND_D } from './gfx.js';
import { F, addFx, tryMove, walkable, refreshParty } from './field.js';
import { MONSTERS, MOVES, TECHS, COMBOS, ITEMS, HEROES, ELEM } from './data.js';
import { S, stats, techsOf, knows, nameOf, gain, addItem, count, party, hasFx } from './party.js';
import { input } from './input.js';
import { sfx, playMusic, currentSong } from './audio.js';
import { L } from './i18n.js';
import { UI, menu, pressKey, statusTags, drawTags, wrap } from './ui.js';
import { animFrames, hasAnim, dirOf, MON, monName } from './sprites.js';

let B = null;
export const inBattle = () => !!B;
const wait = (n) => new Promise((r) => { B.waiters.push({ n, r }); });
const rand = (a, b) => a + Math.random() * (b - a);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// ---------- effects drawn on the map ----------
function popNum(e, s, col = '#ffffff') {
  const x = e.x, y = e.y - (e.ht || 52);
  addFx((g, k) => { const yy = y - 18 * Math.min(1, k * 3) + (k > 0.3 ? 0 : 0); g.globalAlpha = k > 0.75 ? (1 - k) * 4 : 1; text(s, x, yy, col, { align: 'center', g, shadow: '#000' }); g.globalAlpha = 1; }, 55);
}
const FXCOL = { ice: ['#e8fbff', '#60b0ff'], earth: ['#f0d898', '#806030'], fire: ['#ffd060', '#ff6020'], wind: ['#d0ffd8', '#60e090'], bolt: ['#ffffa0', '#a0a0ff'], light: ['#fff8d0', '#ffd860'], dark: ['#d0a0ff', '#402060'], none: ['#ffffff', '#c0c8e0'] };
function burst(x, y, el = 'none', size = 1) {
  const [a, b] = FXCOL[el] || FXCOL.none;
  addFx((g, k) => {
    g.globalAlpha = 1 - k;
    for (let i = 0; i < 10; i++) { const an = i / 10 * Math.PI * 2 + k * 2, r = (6 + k * 26) * size; g.fillStyle = i % 2 ? a : b; g.fillRect(Math.round(x + Math.cos(an) * r) - 2, Math.round(y + Math.sin(an) * r * 0.7) - 2, 4, 4); }
    g.fillStyle = a; g.beginPath(); g.arc(x, y, Math.max(0, (10 - k * 10) * size), 0, 7); g.fill();
    g.globalAlpha = 1;
  }, 24);
}
function slashFx(x, y, dir = 1) {
  addFx((g, k) => { g.globalAlpha = 1 - k; g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 18, -1.2 * dir + k, 0.6 * dir + k * 2); g.stroke(); g.globalAlpha = 1; }, 12);
}
function ring(x, y, r, el) {
  const [a, b] = FXCOL[el] || FXCOL.none;
  addFx((g, k) => { g.globalAlpha = 1 - k; g.strokeStyle = a; g.lineWidth = 4; g.beginPath(); g.ellipse(x, y, r * (0.4 + k * 0.7), r * 0.55 * (0.4 + k * 0.7), 0, 0, 7); g.stroke(); g.strokeStyle = b; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, r * (0.2 + k), r * 0.55 * (0.2 + k), 0, 0, 7); g.stroke(); g.globalAlpha = 1; }, 30);
}
function bolt(x, y) {
  addFx((g, k) => { g.globalAlpha = 1 - k; g.strokeStyle = '#ffffc0'; g.lineWidth = 2; g.beginPath(); let px = x, py = y - 150; g.moveTo(px, py); while (py < y) { px += rand(-10, 10); py += rand(10, 22); g.lineTo(px, Math.min(py, y)); } g.stroke(); g.globalAlpha = 1; }, 14);
}
function beam(a, b, el) {
  const [c1, c2] = FXCOL[el] || FXCOL.none;
  addFx((g, k) => { g.globalAlpha = 1 - k; g.strokeStyle = c2; g.lineWidth = 9 * (1 - k); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); g.strokeStyle = c1; g.lineWidth = 3; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); g.globalAlpha = 1; }, 22);
}
function sparkle(x, y) {
  addFx((g, k) => { for (let i = 0; i < 8; i++) { const an = i * 0.8 + k * 3; g.fillStyle = i % 2 ? '#b0ffd0' : '#ffffff'; g.globalAlpha = 1 - k; g.fillRect(Math.round(x + Math.cos(an) * 12), Math.round(y - 20 - k * 30 + Math.sin(an) * 6), 3, 3); } g.globalAlpha = 1; }, 34);
}
function wave(el) {
  const [c1, c2] = FXCOL[el] || FXCOL.none, cx = F.cam.x + W / 2, cy = F.cam.y + H / 2;
  addFx((g, k) => { g.globalAlpha = (1 - k) * 0.5; g.fillStyle = c2; g.fillRect(F.cam.x, F.cam.y, W, H); g.globalAlpha = 1 - k; g.strokeStyle = c1; g.lineWidth = 5; g.beginPath(); g.ellipse(cx, cy, 40 + k * 300, 20 + k * 160, 0, 0, 7); g.stroke(); g.globalAlpha = 1; }, 36);
}
// something flying from a to b
async function shoot(a, b, kind) {
  const n = 14, col = { fire: '#ff8030', bolt: '#ffffa0', arrow: '#e8d8b0', dark: '#a070ff', light: '#fff0a0', ice: '#c0f0ff', earth: '#d0b070', wind: '#c0ffd0' }[kind] || '#fff';
  const ax = a.x, ay = a.y - 26, bx = b.x, by = b.y - 24;
  addFx((g, k) => {
    const x = ax + (bx - ax) * k, y = ay + (by - ay) * k;
    if (kind === 'arrow') { const an = Math.atan2(by - ay, bx - ax); g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.moveTo(x - Math.cos(an) * 10, y - Math.sin(an) * 10); g.lineTo(x, y); g.stroke(); }
    else { g.fillStyle = col; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); g.globalAlpha = 0.4; g.beginPath(); g.arc(x - (bx - ax) * 0.04, y - (by - ay) * 0.04, 8, 0, 7); g.fill(); g.globalAlpha = 1; }
  }, n);
  await wait(n);
}

// ---------- who stands where ----------
function liveFoes() { return B.foes.filter((f) => f.hp > 0); }
function liveHeroes() { return B.heroes.filter((p) => p.h.hp > 0); }
function centre(list) { const n = list.length || 1; return { x: list.reduce((a, e) => a + e.x, 0) / n, y: list.reduce((a, e) => a + e.y, 0) / n }; }
function face(e, t) { e.dir = dirOf(t.x - e.x, t.y - e.y); }
async function walkTo(e, x, y, frames = 16) {
  const sx = e.x, sy = e.y;
  face(e, { x, y });
  for (let i = 1; i <= frames; i++) {
    e.x = sx + (x - sx) * i / frames; e.y = sy + (y - sy) * i / frames;
    e.step = (e.step || 0) + 1; if (e.kind === 'hero' || e.m.sprite[0] !== 'm') e.frame = 1 + Math.floor(e.step / 2) % 8;
    await wait(1);
  }
  if (e.kind === 'hero' || e.m.sprite[0] !== 'm') e.frame = 0;
}
// play a sprite's action frames
async function act(e, anim, hitAt = 0.5, onHit) {
  const sprite = e.kind === 'hero' ? e.sprite : monName(e.m.sprite);
  if (e.kind === 'foe' && e.m.sprite[0] === 'm') {
    const seq = MON[sprite].atk;
    for (let i = 0; i < seq.length * 4; i++) { e.atkFrame = Math.floor(i / 4); if (onHit && i === Math.floor(seq.length * 4 * hitAt)) await onHit(); await wait(1); }
    e.atkFrame = undefined;
    return;
  }
  const a = hasAnim(sprite, anim) ? anim : hasAnim(sprite, 'slash') ? 'slash' : hasAnim(sprite, 'thrust') ? 'thrust' : 'spellcast';
  const n = animFrames(sprite, a), per = a === 'shoot' ? 3 : 4;
  e.anim = a;
  for (let i = 0; i < n * per; i++) { e.frame = Math.floor(i / per); if (onHit && i === Math.floor(n * per * hitAt)) await onHit(); await wait(1); }
  e.anim = 'walk'; e.frame = 0;
}

// ---------- numbers ----------
export function heroStats(p) { const s = stats(p.h); const b = p.buff || {}; return { ...s, atk: s.atk * (b.pow || 1), def: s.def * (b.def || 1) }; }
function foeStat(f, k) { return f.m[k] * ((f.buff && f.buff[k]) || 1) * (k === 'def' && f.status && f.status.brk ? 0.7 : 1); }
// how fast a gauge fills: haste and slow change it
const rate = (st) => (st.haste ? 1.5 : 1) * (st.slow ? 0.5 : 1);
// statuses that last a few turns count down at the start of their owner's turn
function tickTimed(st) { for (const k of ['haste', 'slow', 'barrier', 'regen', 'brk']) if (st[k] > 0 && --st[k] <= 0) delete st[k]; }
const STATUS_WORD = { haste: ['加速', 'Haste'], slow: ['遲緩', 'Slow'], barrier: ['護盾', 'Shield'], regen: ['再生', 'Regen'], brk: ['破防', 'Break'] };
function elemMul(target, el) {
  if (!el) return 1;
  if (target.kind === 'foe') { if ((target.weak || target.m.weak).includes(el)) return 1.5; if ((target.res || target.m.res).includes(el)) return 0.5; }
  if (target.kind === 'hero' && hasFx(target.h, 'res' + el)) return 0.5;
  return 1;
}
function heroDamage(src, tgt, t, part = 1) {
  const s = src.map((p) => heroStats(p));
  let base;
  if (t.kind === 'phys') base = s.reduce((a, x) => a + x.atk, 0) / s.length * t.pow * (src.length > 1 ? 1.15 : 1) - foeStat(tgt, 'def') * 0.6;
  else { const st = t.stat === 'pow' ? 'atk' : 'mag'; base = s.reduce((a, x) => a + (st === 'atk' ? x.atk * 0.8 : x.mag * 1.25), 0) / s.length * t.pow * (src.length > 1 ? 1.15 : 1) - foeStat(tgt, 'mdf') * 0.5; }
  let d = Math.max(1, base) * rand(0.92, 1.08) * elemMul(tgt, t.el) * part;
  // Rimeback's ice armour turns blows aside until fire melts it
  if (tgt.status && tgt.status.iced && t.kind === 'phys' && t.el !== 'fire') d *= 0.35;
  let crit = false;
  const critP = src.some((p) => hasFx(p.h, 'crit')) ? 0.2 : 0.06;
  if (t.kind === 'phys' && Math.random() < critP) { d *= 1.5; crit = true; }
  return { d: Math.max(1, Math.round(d)), crit };
}
function foeDamage(f, p, mv) {
  const hs = heroStats(p);
  let base = mv.kind === 'phys' ? foeStat(f, 'pow') * 1.6 * mv.pow - hs.def * 0.6 : foeStat(f, 'mag') * 1.6 * mv.pow - hs.mdf * 0.5;
  if (p.guard) base *= 0.6;
  if (p.h.status.barrier) base *= 0.6;
  base *= elemMul(p, mv.el);
  return Math.max(1, Math.round(Math.max(1, base) * rand(0.9, 1.1)));
}
function hurtFoe(f, d, crit, el) {
  f.hp = Math.max(0, f.hp - d); f.flash = 6;
  if (f.status.iced && el === 'fire') { delete f.status.iced; popNum({ x: f.x, y: f.y - 28, ht: f.ht }, L('冰甲融化了！', 'Ice armour melts!'), '#ffb060'); }
  if (f.charging && el === 'bolt') { f.charging = false; f.status.stun = true; popNum({ x: f.x, y: f.y - 28, ht: f.ht }, L('發條被電斷了！', 'The spring snaps!'), '#ffff80'); } sfx(crit ? 'crit' : el === 'fire' ? 'fire' : el === 'bolt' ? 'bolt' : 'hit');
  popNum(f, String(d), crit ? '#ffe060' : elemMul(f, el) > 1 ? '#ffb060' : elemMul(f, el) < 1 ? '#a0a8c0' : '#ffffff');
  if (elemMul(f, el) > 1) popNum({ x: f.x, y: f.y - 14, ht: f.ht }, L('弱點！', 'Weak!'), '#ffd060');
  shakeOne(f);
}
function hurtHero(p, d) {
  p.h.hp = Math.max(0, p.h.hp - d); sfx('hurt'); popNum(p, String(d), '#ff9090'); shakeOne(p);
  if (p.h.hp <= 0) { p.anim = 'hurt'; p.frame = 5; p.gauge = 0; p.h.status = {}; }
}
function shakeOne(e) { let k = 0; const step = () => { e.jx = k % 2 ? 3 : -3; if (++k < 8) setTimeout(step, 25); else e.jx = 0; }; step(); }
function heal(p, n) { const s = stats(p.h); const was = p.h.hp; p.h.hp = Math.min(s.maxhp, p.h.hp + n); if (was <= 0 && p.h.hp > 0) { p.anim = 'walk'; p.frame = 0; } popNum(p, String(n), '#90ffb0'); sparkle(p.x, p.y); }

// which foes a technique reaches
function reach(area, user, target, r = 64) {
  const fs = liveFoes();
  if (area === 'one') return target ? [target] : [];
  if (area === 'all') return fs;
  if (area === 'circle') return fs.filter((f) => dist(f, target) <= r);
  if (area === 'self') return fs.filter((f) => dist(f, user) <= r);
  if (area === 'line') {
    const ax = user.x, ay = user.y, dx = target.x - ax, dy = target.y - ay, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
    return fs.filter((f) => { const t = (f.x - ax) * ux + (f.y - ay) * uy, o = Math.abs((f.x - ax) * uy - (f.y - ay) * ux); return t > 0 && t < len + 56 && o < 30; });
  }
  return [];
}
// for 'self' techniques the user first steps to the target, so measure from there
function reachFrom(t, user, target) { return t.area === 'self' ? reach('circle', user, target, t.r) : reach(t.area, user, target, t.r); }

// ---------- starting and ending ----------
export function startBattle(group, opts = {}) {
  return new Promise((resolve) => {
    const foes = F.foes.filter((f) => f.group === group);
    const prevSong = currentSong;
    B = { group, foes, heroes: F.party.slice(), waiters: [], resolve, over: false, boss: !!group.boss, target: null, cmdFor: null, prevSong, noFlee: !!group.boss || opts.noFlee, log: '' };
    F.battle = B;
    for (const f of foes) initFoe(f);
    for (const p of B.heroes) {
      Object.assign(p, { gauge: p.h.hp > 0 ? rand(20, 70) : 0, buff: {}, guard: false, ht: 56, anim: p.h.hp > 0 ? 'walk' : 'hurt', frame: p.h.hp > 0 ? 0 : 5 });
      for (const k of ['haste', 'slow', 'barrier', 'regen']) delete p.h.status[k];
      if (p.h.hp > 0 && hasFx(p.h, 'haste')) p.h.status.haste = 4;
      if (p.h.hp > 0 && hasFx(p.h, 'first')) p.gauge = 100;
    }
    // the monster book remembers every kind you have met
    for (const f of foes) S.seen[f.mid] = 1;
    const lead = foes[0] && foes[0].m;
    if (!opts.keepMusic) playMusic(group.boss ? (lead.music || (group.list[0] === 'hush' ? 'lastboss' : 'boss')) : (F.map.battleMusic || 'battle'));
    sfx('encounter');
    run();
  });
}
function initFoe(f) {
  const sp = monName(f.m.sprite), mon = f.m.sprite[0] === 'm' ? MON[sp] : null;
  const ht = mon && mon.fw ? (mon.fh - mon.pad) * 0.8 : f.m.sprite[0] === 'm' ? 46 : 58;
  Object.assign(f, { hp: f.m.hp, maxhp: f.m.hp, gauge: rand(0, 50), buff: {}, status: {}, ht: ht * (f.m.scale || 1), goal: null, weak: f.m.weak.slice(), res: f.m.res.slice(), turns: 0, charging: false });
  f.acts = f.m.acts.slice();
  if (f.m.mech === 'icearmor') f.status.iced = true;
}
// a summoner calls another monster into the fight, next to itself
function summonFoe(by, mid) {
  const a = Math.random() * Math.PI * 2;
  let x = by.x + Math.cos(a) * 60, y = by.y + Math.sin(a) * 36;
  if (!walkable(x, y)) { x = by.x + (by.x > centre(B.heroes).x ? 40 : -40); y = by.y + 30; }
  const f = { kind: 'foe', mid, m: MONSTERS[mid], group: B.group, x, y, home: [x, y], dir: by.dir, step: 0, t: 0, wt: 0, alpha: 0 };
  initFoe(f); f.gauge = 0; f.summoned = true;
  F.foes.push(f); F.ents.push(f); B.foes.push(f);
  S.seen[mid] = 1;
  return f;
}
async function placeParty() {
  const C = centre(B.foes), lead = B.heroes[0];
  let vx = lead.x - C.x, vy = lead.y - C.y, d = Math.hypot(vx, vy);
  if (d < 1) { vx = 0; vy = 1; d = 1; }
  vx /= d; vy /= d;
  const D = Math.max(96, Math.min(150, d + 24)), ux = -vy, uy = vx;
  const slots = [[0, 0], [1, 0.35], [-1, 0.35]];
  const moves = B.heroes.map((p, i) => {
    const [o, back] = slots[i] || [0, 1];
    let x = C.x + vx * (D + back * 30) + ux * o * 52, y = C.y + vy * (D + back * 30) + uy * o * 40;
    // step in until the spot is free ground
    for (let k = 0; k < 24 && !walkable(x, y); k++) { const a = k * 0.9, r = 8 + k * 3; x += Math.cos(a) * r * 0.3; y += Math.sin(a) * r * 0.3; }
    // no free ground there: stand close beside the leader instead
    if (!walkable(x, y)) {
      const offs = [[36, 0], [-36, 0], [0, 30], [36, 30], [-36, 30], [0, -30], [72, 0], [-72, 0]];
      const near = offs.map((_, k) => offs[(k + i * 2) % offs.length]).map(([a, b]) => [lead.x + a, lead.y + b]);
      const ok = near.find(([nx, ny]) => walkable(nx, ny));
      [x, y] = ok || [lead.x, lead.y];
    }
    return walkTo(p, x, y, 18);
  });
  for (const f of B.foes) face(f, lead);
  F.camTarget = null;
  await Promise.all(moves);
  for (const p of B.heroes) { p.home = [p.x, p.y]; face(p, C); }
  for (const f of B.foes) { f.home = [f.x, f.y]; face(f, centre(B.heroes)); }
  const all = [...B.heroes, ...B.foes];
  F.camTarget = centre(all);
}
async function run() {
  await placeParty();
  while (!B.over) {
    await wait(1);
    if (!liveFoes().length) { await victory(); return; }
    if (!liveHeroes().length) { await defeat(); return; }
    // gauges
    const ready = [];
    for (const p of B.heroes) {
      if (p.h.hp <= 0) { p.gauge = 0; continue; }
      if (p.gauge < 100) p.gauge = Math.min(100, p.gauge + (heroStats(p).spd + 10) * 0.045 * rate(p.h.status) * (F.speed || 1));
      else ready.push(p);
    }
    for (const f of liveFoes()) {
      if (f.alpha !== undefined && f.alpha < 1 && f.summoned) f.alpha = Math.min(1, f.alpha + 0.05);
      if (f.gauge < 100) f.gauge = Math.min(100, f.gauge + (foeStat(f, 'spd') + 10) * 0.045 * rate(f.status) * (F.speed || 1));
    }
    const foe = liveFoes().find((f) => f.gauge >= 100);
    if (foe) {
      foe.gauge = 0; tickTimed(foe.status);
      if (foe.status.stun || foe.status.freeze) { const w = foe.status.freeze ? L('凍結', 'Frozen') : L('麻痺', 'Stunned'); delete foe.status.stun; delete foe.status.freeze; popNum(foe, w, '#ffff80'); await wait(20); }
      else { await foeTurn(foe); await afterHits(); }
      continue;
    }
    if (ready.length) {
      const p = ready[0];
      tickTimed(p.h.status);
      // poison bites at the start of a turn; regeneration heals
      if (p.h.status.poison) { const d = Math.max(1, Math.round(stats(p.h).maxhp * 0.06)); hurtHero(p, d); await wait(16); if (p.h.hp <= 0) continue; }
      if (p.h.status.regen || hasFx(p.h, 'regen')) { heal(p, Math.max(1, Math.round(stats(p.h).maxhp * 0.06))); await wait(10); }
      if (p.h.status.stun || p.h.status.freeze) { const w = p.h.status.freeze ? L('凍結', 'Frozen') : L('麻痺', 'Stunned'); delete p.h.status.stun; delete p.h.status.freeze; p.gauge = 0; popNum(p, w, '#ffff80'); await wait(20); continue; }
      const done = await heroTurn(p);
      if (done === 'fled') return;
    }
  }
}

// ---------- a friend's turn ----------
function combosFor(p) {
  const out = [];
  const ready = B.heroes.filter((q) => q.h.hp > 0 && q.gauge >= 100);
  for (const [id, c] of Object.entries(COMBOS)) {
    if (id === 'hourchime') {
      if (p.id !== 'ren' && !ready.find((q) => q.id === 'ren')) continue;
      if (B.heroes.length < 3) continue;
      const ok = B.heroes.every((q) => q.h.hp > 0 && knows(q.h, q.id === 'ren' ? 'riftdash' : TECHS_BY_INDEX(q.id, 2)));
      const allReady = B.heroes.every((q) => q.gauge >= 100);
      const mpOk = B.heroes.every((q) => q.h.mp >= 8);
      if (ok) out.push({ id, c, who: B.heroes, ok: allReady && mpOk });
      continue;
    }
    if (!c.who.includes(p.id)) continue;
    const who = c.who.map((w) => B.heroes.find((q) => q.id === w));
    if (who.some((q) => !q || q.h.hp <= 0)) continue;
    if (!who.every((q, i) => knows(q.h, c.need[i]))) continue;
    out.push({ id, c, who, ok: who.every((q) => q.gauge >= 100) && who.every((q, i) => q.h.mp >= mpCost(q, c.mp[i])) });
  }
  return out;
}
import { LEARN } from './data.js';
const TECHS_BY_INDEX = (id, i) => LEARN[id][i];
const mpCost = (p, n) => (hasFx(p.h, 'halfmp') ? Math.ceil(n / 2) : n);

async function heroTurn(p) {
  B.cmdFor = p;
  for (;;) {
    const cmds = [L('攻擊', 'Attack'), L('技', 'Tech'), L('道具', 'Item')];
    if (!B.noFlee) cmds.push(L('逃跑', 'Run'));
    const c = await menu(cmds.map((s) => ({ label: s })), { x: W - 120, y: H - 76 - cmds.length * 16, w: 100, cancel: false, title: nameOf(p.h) });
    if (c === 0) {
      const t = await pickFoe(p, { area: 'one' });
      if (!t) continue;
      B.cmdFor = null; p.gauge = 0; await heroAttack(p, t); return;
    }
    if (c === 1) {
      const list = techsOf(p.h).map((id) => ({ id, t: TECHS[id] }));
      const combos = combosFor(p);
      const items = [...list.map(({ id, t }) => ({ label: t.name, right: mpCost(p, t.mp), disabled: p.h.mp < mpCost(p, t.mp) })), ...combos.map((k) => ({ label: '★' + k.c.name, right: k.who.map((q) => nameOf(q.h)[0]).join(''), disabled: !k.ok, color: '#ffd870' }))];
      const desc = (i) => (i < list.length ? list[i].t.desc + areaWord(list[i].t) : combos[i - list.length].c.desc + areaWord(combos[i - list.length].c));
      const k = await menu(items, { x: W - 250, y: 60, w: 230, maxRows: 8, title: L('技', 'Techniques'), drawExtra: (i) => descLine(desc(i)) });
      if (k < 0) continue;
      if (k < list.length) {
        const { id, t } = list[k];
        const tgt = await pickTarget(p, t);
        if (!tgt) continue;
        B.cmdFor = null; p.gauge = 0; p.h.mp -= mpCost(p, t.mp); await doTech(p, id, t, tgt); return;
      }
      const cb = combos[k - list.length];
      const tgt = await pickTarget(p, cb.c, cb.who);
      if (!tgt) continue;
      B.cmdFor = null;
      cb.who.forEach((q, i) => { q.gauge = 0; q.h.mp -= mpCost(q, cb.c.mp[i]); });
      await doCombo(cb.who, cb.c, tgt); return;
    }
    if (c === 2) {
      const ids = Object.keys(S.inv).filter((id) => ITEMS[id] && ITEMS[id].type === 'use');
      if (!ids.length) { sfx('buzz'); continue; }
      const k = await menu(ids.map((id) => ({ label: ITEMS[id].name, right: count(id) })), { x: W - 230, y: 60, w: 210, maxRows: 8, title: L('道具', 'Items'), drawExtra: (i) => descLine(ITEMS[ids[i]].desc) });
      if (k < 0) continue;
      const it = ITEMS[ids[k]];
      if (it.smoke && B.noFlee) { sfx('buzz'); continue; }
      const tgt = it.full || it.smoke ? B.heroes[0] : it.bomb ? (it.bomb.area === 'all' ? await pickFrom(liveFoes(), p, { area: 'all' }, null, true) : await pickFrom(liveFoes(), p, { area: 'circle', r: 64 })) : await pickAlly(p, !!it.revive);
      if (!tgt) continue;
      if (it.smoke) { B.cmdFor = null; p.gauge = 0; addItem(ids[k], -1); await flee(); return 'fled'; }
      B.cmdFor = null; p.gauge = 0; addItem(ids[k], -1);
      await useItem(p, it, tgt); await afterHits(); return;
    }
    if (c === 3) {
      B.cmdFor = null; p.gauge = 0;
      if (Math.random() < 0.75) { await flee(); return 'fled'; }
      sfx('buzz'); B.log = L('逃不掉！', "Couldn't get away!"); await wait(40); B.log = ''; return;
    }
  }
}
const areaWord = (t) => ({ one: L('（單體）', ' (one foe)'), all: L('（全體）', ' (all foes)'), line: L('（直線）', ' (a line)'), circle: L('（範圍）', ' (an area)'), self: L('（身邊）', ' (around self)'), ally: L('（一位夥伴）', ' (one friend)'), allies: L('（全體夥伴）', ' (all friends)') }[t.area] || '');
function descLine(s) { if (!s) return; const lines = wrapShort(s, W - 40); windowBox(4, 4, W - 8, lines.length * 15 + 10); lines.forEach((l, i) => text(l, 14, 9 + i * 15)); }
function wrapShort(s, w) { const out = []; let line = ''; for (const ch of s.match(/[A-Za-z0-9'".,!?:;()\-]+ ?|./gu) || []) { if (textW(line + ch) > w && line) { out.push(line); line = ch.trimStart(); } else line += ch; } out.push(line); return out.slice(0, 3); }

// choosing a target with the arrows; the ground the technique would reach is marked as you move
function pickFoe(p, t, who) { return pickFrom(liveFoes(), p, t, who); }
function pickAlly(p, dead) { return pickFrom(B.heroes.filter((q) => (dead ? true : q.h.hp > 0)), p, { area: 'ally' }); }
function pickTarget(p, t, who) {
  if (t.area === 'all') return pickFrom(liveFoes(), p, t, who, true);
  if (t.area === 'allies') return pickFrom(B.heroes.filter((q) => q.h.hp > 0), p, t, who, true);
  if (t.area === 'ally') return pickAlly(p, !!t.revive);
  return pickFrom(liveFoes(), p, t, who);
}
function pickFrom(list, p, t, who, all = false) {
  // sorted left to right so the arrows move naturally
  list = list.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  if (!list.length) return Promise.resolve(null);
  return new Promise((res) => {
    let i = 0;
    const user = who ? centre(who) : p;
    const w = {
      update() {
        if (input.repeat('right') || input.repeat('down')) { i = (i + 1) % list.length; sfx('cursor'); }
        if (input.repeat('left') || input.repeat('up')) { i = (i + list.length - 1) % list.length; sfx('cursor'); }
        if (input.pressed('a')) { sfx('ok'); B.target = null; this.done(list[i]); return; }
        if (input.pressed('b')) { sfx('cancel'); B.target = null; this.done(null); return; }
        B.target = { list: all ? list : t.area === 'one' || t.area === 'ally' ? [list[i]] : reachFrom(t, user, list[i]), main: all ? null : list[i], area: t.area, r: t.r, user, at: list[i] };
      },
      draw() {},
    };
    UI_PUSH(w).then(res);
  });
}
function UI_PUSH(w) { return new Promise((res) => { w.done = (v) => { UI_STACK_REMOVE(w); res(v); }; UI_STACK_ADD(w); }); }
// the dialogue stack lives in ui.js; this little hook puts a target picker on it
import { pushRaw, removeRaw } from './ui.js';
const UI_STACK_ADD = (w) => pushRaw(w), UI_STACK_REMOVE = (w) => removeRaw(w);

// ---------- doing things ----------
async function approach(p, t, gap = 30) {
  const dx = p.x - t.x, side = dx >= 0 ? 1 : -1;
  let x = t.x + side * gap, y = t.y + 2;
  if (!walkable(x, y)) x = t.x - side * gap;
  await walkTo(p, x, y, 12);
  face(p, t);
}
async function goHome(e) { await walkTo(e, e.home[0], e.home[1], 12); const others = e.kind === 'hero' ? liveFoes() : liveHeroes(); if (others.length) face(e, centre(others)); }
async function heroAttack(p, t) {
  const H = HEROES[p.id];
  if (H.melee) {
    await approach(p, t);
    await act(p, H.atkAnim, 0.5, async () => { slashFx(t.x, t.y - 24, p.x < t.x ? 1 : -1); const { d, crit } = heroDamage([p], t, { kind: 'phys', pow: 1 }); hurtFoe(t, d, crit); });
    await goHome(p);
  } else {
    face(p, t);
    await act(p, H.atkAnim, 0.6, async () => { await shoot(p, t, H.shot); const k = H.shot === 'fire' ? { kind: 'mag', pow: 0.9, el: 'fire' } : { kind: 'phys', pow: 1 }; const { d, crit } = heroDamage([p], t, k); hurtFoe(t, d, crit, k.el); });
  }
  await afterHits();
}
async function doTech(p, id, t, tgt) {
  B.log = t.name;
  const H = HEROES[p.id];
  if (t.kind === 'heal' || t.kind === 'support') {
    face(p, tgt);
    await act(p, 'spellcast', 0.6, async () => { helpFriends([p], t, tgt); });
    B.log = ''; return;
  }
  if (t.kind === 'steal') {
    await approach(p, tgt, 24);
    await act(p, H.atkAnim, 0.5, async () => {
      const got = stealFrom(tgt);
      if (got) { sfx('chest'); popNum(tgt, L('偷到', 'Got ') + ITEMS[got].name, '#a0ffa0'); }
      else { sfx('miss'); popNum(tgt, L('沒偷到', 'Nothing'), '#c0c0d0'); }
    });
    await goHome(p); B.log = ''; return;
  }
  const hits = t.hits || 1;
  if (t.area === 'self' || (t.area === 'one' && t.kind === 'phys' && H.melee) || (t.area === 'line' && H.melee)) {
    // Ren goes in with the sword
    if (t.area === 'line') {
      const dx = tgt.x - p.x, dy = tgt.y - p.y, len = Math.hypot(dx, dy) || 1;
      const targets = reach('line', p, tgt);
      let ex = tgt.x + dx / len * 50, ey = tgt.y + dy / len * 50;
      if (!walkable(ex, ey)) { ex = tgt.x + dx / len * 20; ey = tgt.y + dy / len * 20; }
      p.alpha = 0.6; sfx('slash');
      await walkTo(p, ex, ey, 10);
      p.alpha = 1;
      for (const f of targets) { slashFx(f.x, f.y - 24); const { d, crit } = heroDamage([p], f, t); hurtFoe(f, d, crit, t.el); drainTo([p], d, t); afterHit(f, t); }
      await wait(10);
      await goHome(p);
    } else if (t.area === 'self') {
      await approach(p, tgt, 20);
      const spot = { x: p.x, y: p.y };
      for (const dir of ['d', 'l', 'u', 'r']) { p.dir = dir; p.anim = 'slash'; p.frame = 3; await wait(3); }
      sfx('slash'); ring(spot.x, spot.y - 10, t.r, t.el);
      for (const f of reach('self', spot, spot, t.r)) { const { d, crit } = heroDamage([p], f, t); hurtFoe(f, d, crit, t.el); drainTo([p], d, t); afterHit(f, t); }
      p.anim = 'walk'; p.frame = 0;
      await wait(10);
      await goHome(p);
    } else {
      await approach(p, tgt);
      await act(p, HEROES[p.id].atkAnim, 0.5, async () => { burst(tgt.x, tgt.y - 24, t.el || 'light'); const { d, crit } = heroDamage([p], tgt, t); hurtFoe(tgt, d, crit, t.el); drainTo([p], d, t); afterHit(tgt, t); });
      await goHome(p);
    }
  } else {
    face(p, tgt);
    const anim = t.kind === 'phys' ? H.atkAnim : 'spellcast';
    await act(p, anim, 0.6, async () => {
      const targets = reachFrom(t, p, tgt);
      if (t.area === 'line') { beam(p, { x: tgt.x + (tgt.x - p.x) * 0.3, y: tgt.y - 20 + (tgt.y - p.y) * 0.3 }, t.el || 'wind'); sfx(t.el === 'wind' ? 'slide' : 'slash'); }
      else if (t.area === 'all') { wave(t.el); sfx(t.el === 'bolt' ? 'bolt' : t.el === 'fire' ? 'fire' : 'holy'); }
      else if (t.area === 'circle') { ring(tgt.x, tgt.y - 10, t.r, t.el); }
      else if (t.kind === 'phys') await shoot(p, tgt, H.shot);
      else if (t.el === 'bolt') bolt(tgt.x, tgt.y - 10);
      else await shoot(p, tgt, t.el);
      for (let k = 0; k < hits; k++) {
        for (const f of targets) { if (f.hp <= 0) continue; if (t.el === 'bolt') bolt(f.x, f.y - 10); else burst(f.x, f.y - 24, t.el); if (t.kind === 'debuff' && !t.pow) { afterHit(f, t); continue; } const { d, crit } = heroDamage([p], f, t.kind === 'debuff' ? { ...t, kind: 'mag' } : t); hurtFoe(f, d, crit, t.el); drainTo([p], d, t); afterHit(f, t); }
        if (k < hits - 1) { await wait(10); if (t.kind === 'phys') await shoot(p, tgt, H.shot); }
      }
    });
  }
  B.log = '';
  await afterHits();
}
// healing and helping: used by techniques, combined techniques and the field menu's rules
function helpFriends(src, t, tgt) {
  sfx(t.kind === 'heal' ? 'heal' : 'buff');
  const mag = src.reduce((a, q) => a + heroStats(q).mag, 0) / src.length * (src.length > 1 ? 1.15 : 1);
  const amount = Math.round(mag * (t.pow || 0) * 1.5 + 20);
  const list = t.area === 'allies' ? B.heroes.filter((q) => q.h.hp > 0 || t.revive) : [tgt];
  for (const q of list) {
    if (q.h.hp <= 0 && !t.revive) continue;
    if (t.kind === 'heal') heal(q, q.h.hp > 0 ? amount : Math.round(stats(q.h).maxhp * (t.area === 'allies' ? 0.5 : 0.3)));
    if (t.cure) { delete q.h.status.poison; delete q.h.status.slow; }
    for (const [k, n] of Object.entries(t.fx || {})) { q.h.status[k] = n + 1; popNum({ x: q.x, y: q.y - 14, ht: q.ht }, L(STATUS_WORD[k][0], STATUS_WORD[k][1]), '#a0e0ff'); }
    if (t.kind !== 'heal') sparkle(q.x, q.y);
  }
}
function stealFrom(f) {
  if (f.stolen) return null;
  const pool = [...(f.m.drops || []), ...(f.m.drop ? [f.m.drop] : [])];
  if (!pool.length || Math.random() < (f.m.boss ? 0.5 : 0.25)) return null;
  f.stolen = true;
  const id = pool[Math.floor(Math.random() * pool.length)][0];
  addItem(id); return id;
}
// what a hit does besides damage: stun, freeze, slow, break
function afterHit(f, t) {
  if (f.hp <= 0) return;
  if (t.stun && Math.random() < t.stun && !f.m.boss) f.status.stun = true;
  if (t.freeze && Math.random() < t.freeze && !f.m.boss) { f.status.freeze = true; popNum({ x: f.x, y: f.y - 14, ht: f.ht }, L('凍結', 'Frozen'), '#c0f0ff'); }
  for (const [k, n] of Object.entries(t.fx || {})) { if (k === 'slow' || k === 'brk') { f.status[k] = n + 1; popNum({ x: f.x, y: f.y - 14, ht: f.ht }, L(STATUS_WORD[k][0], STATUS_WORD[k][1]), '#c0a0ff'); } }
}
function drainTo(src, d, t) { if (!t.drain) return; const k = Math.round(d * t.drain / src.length); for (const q of src) if (q.h.hp > 0) heal(q, k); }
async function doCombo(who, c, tgt) {
  B.log = '★ ' + c.name; sfx('special');
  if (c.kind === 'heal' || c.kind === 'support') {
    await Promise.all(who.map((q) => { face(q, tgt); return act(q, 'spellcast', 0.9); }));
    helpFriends(who, c, tgt); wave('wind'); await wait(20); B.log = ''; return;
  }
  const user = centre(who);
  const targets = c.area === 'all' ? liveFoes() : reachFrom(c, user, tgt);
  // everyone strikes a pose together
  await Promise.all(who.map((q) => { face(q, tgt); return act(q, HEROES[q.id].melee ? 'spellcast' : HEROES[q.id].atkAnim, 0.9); }));
  const ren = who.find((q) => HEROES[q.id].melee);
  if (ren && c.area !== 'all') {
    if (c.area === 'line') {
      const dx = tgt.x - ren.x, dy = tgt.y - ren.y, len = Math.hypot(dx, dy) || 1;
      let ex = tgt.x + dx / len * 50, ey = tgt.y + dy / len * 50; if (!walkable(ex, ey)) { ex = tgt.x; ey = tgt.y + 20; }
      beam(ren, { x: ex, y: ey - 20 }, c.el); ren.alpha = 0.6; await walkTo(ren, ex, ey, 10); ren.alpha = 1;
    } else { await approach(ren, tgt, 22); await act(ren, 'slash', 0.5); }
  }
  if (c.area === 'all') wave(c.el); else if (c.area === 'circle') { ring(tgt.x, tgt.y - 10, c.r, c.el); ring(tgt.x, tgt.y - 10, c.r * 0.6, c.el); }
  sfx(c.el === 'fire' ? 'fire' : c.el === 'bolt' ? 'bolt' : 'crit');
  for (const f of targets) { if (c.el === 'bolt') bolt(f.x, f.y - 10); burst(f.x, f.y - 24, c.el, 1.4); const { d, crit } = heroDamage(who, f, c); hurtFoe(f, d, crit, c.el); drainTo(who, d, c); afterHit(f, c); }
  await wait(16);
  if (ren) await goHome(ren);
  B.log = '';
  await afterHits();
}
async function useItem(p, it, tgt) {
  face(p, tgt);
  await act(p, 'spellcast', 0.6, async () => {
    sfx('heal');
    if (it.full) for (const q of B.heroes) { const s = stats(q.h); q.h.hp = s.maxhp; q.h.mp = s.maxmp; q.anim = 'walk'; q.frame = 0; sparkle(q.x, q.y); }
    else if (it.revive) { if (tgt.h.hp <= 0) heal(tgt, Math.round(stats(tgt.h).maxhp * it.revive)); }
    else if (it.bomb) {
      const targets = it.bomb.area === 'all' ? liveFoes() : reach('circle', p, tgt, 64);
      if (it.bomb.area === 'all') wave(it.bomb.el); else ring(tgt.x, tgt.y - 10, 64, it.bomb.el);
      sfx('boom');
      for (const f of targets) { burst(f.x, f.y - 24, it.bomb.el, 1.2); hurtFoe(f, Math.round(it.bomb.pow * rand(0.9, 1.1) * elemMul(f, it.bomb.el)), false, it.bomb.el); }
    }
    else if (it.haste && tgt.h.hp > 0) { tgt.h.status.haste = it.haste + 1; popNum(tgt, L('加速', 'Haste'), '#a0e0ff'); sparkle(tgt.x, tgt.y); }
    else if (it.cure && tgt.h.hp > 0) { delete tgt.h.status.poison; delete tgt.h.status.slow; if (it.heal) heal(tgt, it.heal); else sparkle(tgt.x, tgt.y); }
    else if (it.heal && tgt.h.hp > 0) heal(tgt, it.heal);
    else if (it.mp && tgt.h.hp > 0) { tgt.h.mp = Math.min(stats(tgt.h).maxmp, tgt.h.mp + it.mp); popNum(tgt, '+' + it.mp + ' MP', '#a0c8ff'); sparkle(tgt.x, tgt.y); }
  });
}
// the fallen fade away
async function afterHits() {
  await wait(8);
  const dead = B.foes.filter((f) => f.hp <= 0 && !f.gone);
  if (!dead.length) return;
  sfx('die');
  for (let k = 0; k <= 20; k++) { for (const f of dead) f.alpha = 1 - k / 20; await wait(1); }
  for (const f of dead) f.gone = true;
}

// ---------- a monster's turn ----------
const SHIFT = ['fire', 'ice', 'bolt', 'wind', 'light', 'earth'];
async function foeTurn(f) {
  f.turns++;
  let id = f.acts[Math.floor(Math.random() * f.acts.length)];
  // the very last ones get faster when hurt
  if (f.m.final && f.hp < f.maxhp * 0.5 && !f.enraged) { f.enraged = true; f.buff.spd = 1.35; B.log = f.mid === 'hush' ? L('寂靜睜大了眼睛……', 'Hush opens its eye wide...') : L(`${f.m.name}發出無聲的尖叫……`, `${f.m.name} lets out a soundless scream...`); await wait(50); }
  if (f.m.boss && !f.m.final && f.hp < f.maxhp * 0.35 && !f.enraged && f.m.hp >= 12000) { f.enraged = true; f.buff.spd = 1.2; popNum(f, L('狂暴', 'Enraged'), '#ff8060'); await wait(30); }
  // a wound-up machine lets everything go at once
  if (f.charging) { f.charging = false; id = 'overclock'; }
  // the Grief Engine (and the last foes) keep changing what hurts them
  if (f.m.mech === 'shift' && f.turns % 2 === 1) {
    const el = SHIFT[(SHIFT.indexOf(f.weak[0]) + 1 + Math.floor(Math.random() * (SHIFT.length - 1))) % SHIFT.length];
    f.res = f.m.res.filter((e) => e !== el); f.weak = [el];
    popNum({ x: f.x, y: f.y - 30, ht: f.ht }, L(`弱點變成「${ELEM[el][0]}」`, `Now weak to ${ELEM[el][1]}`), '#ffd060'); await wait(30);
  }
  if (id === 'icearmor' && f.status.iced) id = 'maul';
  if (id === 'summon' && (liveFoes().length >= (f.m.maxFoes || 3) || !f.m.summon)) id = f.acts.find((a) => MOVES[a].kind !== 'summon' && MOVES[a].kind !== 'buff') || 'hit';
  if (id === 'windup' && f.turns < 2) id = 'hit';
  if ((id === 'mendfoe' || id === 'mendself') && !liveFoes().some((o) => o.hp < o.maxhp * 0.7)) id = 'shade' in MOVES && f.acts.includes('shade') ? 'shade' : 'hit';
  if ((id === 'howl' || id === 'roar') && f.buff.pow) id = 'frenzy';
  if (id === 'harden' && f.buff.def) id = 'hit';
  const mv = MOVES[id], heroes = liveHeroes();
  if (!heroes.length) return;
  B.log = id === 'hit' ? '' : mv.name;
  let tgt = heroes[Math.floor(Math.random() * heroes.length)];
  if (mv.kind === 'buff') {
    sfx('buff'); await act(f, 'spellcast', 0.5);
    f.buff[mv.buff] = 1.35; popNum(f, mv.buff === 'pow' ? L('力量上升', 'Power up') : L('防禦上升', 'Defence up'), '#ffd080');
    await wait(20); B.log = ''; return;
  }
  if (mv.kind === 'charge') {
    sfx('switch'); await act(f, 'spellcast', 0.5); f.charging = true;
    popNum(f, L('嘎啦嘎啦……（用雷打斷它！）', 'Clack clack... (thunder stops it!)'), '#ffe080'); await wait(40); B.log = ''; return;
  }
  if (mv.kind === 'armor') {
    sfx('ice'); await act(f, 'spellcast', 0.5); f.status.iced = true;
    popNum(f, L('冰甲（怕火）', 'Ice armour (fire melts it)'), '#c0f0ff'); await wait(30); B.log = ''; return;
  }
  if (mv.kind === 'summon') {
    sfx('rift'); await act(f, 'spellcast', 0.5);
    const mid = f.m.summon[Math.floor(Math.random() * f.m.summon.length)], n = Math.min(2, (f.m.maxFoes || 3) - liveFoes().length);
    for (let k = 0; k < n; k++) { const o = summonFoe(f, mid); face(o, centre(B.heroes)); o.home = [o.x, o.y]; }
    await wait(30); B.log = ''; return;
  }
  if (mv.kind === 'healfoe') {
    sfx('heal'); await act(f, 'spellcast', 0.5);
    const list = id === 'mendself' ? [f] : liveFoes();
    for (const o of list) { const n = Math.round(o.maxhp * mv.pow * (o.m.boss ? 0.25 : 1)); o.hp = Math.min(o.maxhp, o.hp + n); popNum(o, '+' + n, '#90ffb0'); sparkle(o.x, o.y); }
    await wait(20); B.log = ''; return;
  }
  const targets = mv.area === 'all' ? heroes : mv.area === 'line' ? heroesInLine(f, tgt) : [tgt];
  if (mv.melee && mv.area !== 'line') {
    await approach(f, tgt, 30);
    for (let k = 0; k < (mv.hits || 1); k++) {
      await act(f, hasAnim(monName(f.m.sprite), 'slash') ? 'slash' : 'thrust', 0.5, async () => { slashFx(tgt.x, tgt.y - 24); if (tgt.h.hp > 0) hitHero(f, tgt, mv); });
    }
    await goHome(f);
  } else if (mv.melee && mv.area === 'line') {
    const dx = tgt.x - f.x, dy = tgt.y - f.y, len = Math.hypot(dx, dy) || 1;
    let ex = tgt.x + dx / len * 40, ey = tgt.y + dy / len * 40; if (!walkable(ex, ey)) { ex = tgt.x; ey = tgt.y; }
    sfx('quake'); await walkTo(f, ex, ey, 10);
    for (const p of targets) hitHero(f, p, mv);
    await wait(14); await goHome(f);
  } else {
    face(f, tgt);
    await act(f, 'spellcast', 0.6, async () => {
      if (mv.area === 'all') { wave(mv.el || (mv.kind === 'phys' ? 'none' : 'dark')); sfx(mv.kind === 'phys' ? 'quake' : 'abyss'); if (mv.kind === 'phys') F.shake = 20; }
      else if (mv.area === 'line') { beam(f, { x: tgt.x + (tgt.x - f.x) * 0.4, y: tgt.y - 20 + (tgt.y - f.y) * 0.4 }, mv.el); sfx('bolt'); }
      else if (mv.el === 'bolt') { bolt(tgt.x, tgt.y - 10); sfx('bolt'); }
      else await shoot(f, tgt, mv.el || 'dark');
      for (const p of targets) hitHero(f, p, mv);
    });
  }
  await wait(10);
  B.log = '';
}
function heroesInLine(f, tgt) {
  const ax = f.x, ay = f.y, dx = tgt.x - ax, dy = tgt.y - ay, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
  return liveHeroes().filter((p) => { const t = (p.x - ax) * ux + (p.y - ay) * uy, o = Math.abs((p.x - ax) * uy - (p.y - ay) * ux); return t > 0 && t < len + 50 && o < 30; });
}
function hitHero(f, p, mv) {
  if (p.h.hp <= 0) return;
  const d = foeDamage(f, p, mv);
  hurtHero(p, d);
  if (mv.drain) { const k = mv.area === 'all' ? Math.round(d * 0.5) : d; f.hp = Math.min(f.maxhp, f.hp + k); popNum(f, '+' + k, '#90ffb0'); }
  const tag = (w, col) => popNum({ x: p.x, y: p.y - 14, ht: 56 }, w, col);
  if (mv.poison && Math.random() < mv.poison && p.h.hp > 0 && !hasFx(p.h, 'nopoison')) { p.h.status.poison = true; tag(L('中毒', 'Poison'), '#c080ff'); }
  if (mv.stun && Math.random() < mv.stun && p.h.hp > 0 && !hasFx(p.h, 'nostun')) { p.h.status.stun = true; }
  if (mv.freeze && Math.random() < mv.freeze && p.h.hp > 0 && !hasFx(p.h, 'nostun')) { p.h.status.freeze = true; tag(L('凍結', 'Frozen'), '#c0f0ff'); }
  if (mv.slow && Math.random() < mv.slow && p.h.hp > 0) { p.h.status.slow = 3; tag(L('遲緩', 'Slow'), '#c0a0ff'); }
  if (mv.erase && p.h.hp > 0) { for (const k of ['haste', 'barrier', 'regen']) delete p.h.status[k]; p.buff = {}; }
  // a counter badge strikes straight back at whoever hit
  if (mv.melee && p.h.hp > 0 && f.hp > 0 && hasFx(p.h, 'counter') && Math.random() < 0.35) {
    const { d: cd } = heroDamage([p], f, { kind: 'phys', pow: 0.9 }); slashFx(f.x, f.y - 24); hurtFoe(f, cd, false); popNum({ x: f.x, y: f.y - 28, ht: f.ht }, L('反擊', 'Counter'), '#ffe080');
  }
  if (mv.eatGauge) { p.gauge = 0; popNum({ x: p.x, y: p.y - 14, ht: 56 }, L('時間被吃掉了', 'Time eaten'), '#c080ff'); }
}

// ---------- the end ----------
function finish(result) {
  B.over = true;
  for (const p of B.heroes) { p.anim = 'walk'; p.frame = 0; p.alpha = 1; p.jx = 0; }
  F.camTarget = null; F.battle = null;
  const r = B.resolve; const song = B.prevSong; B = null;
  r({ result, song });
}
async function victory() {
  await wait(20);
  const live = party();
  const expK = live.some((m) => hasFx(m, 'exp15')) ? 1.5 : 1, goldK = live.some((m) => hasFx(m, 'gold2')) ? 2 : 1;
  const exp = Math.round(B.foes.reduce((a, f) => a + f.m.exp, 0) * expK), gold = Math.round(B.foes.reduce((a, f) => a + f.m.gold, 0) * goldK), tp = B.foes.reduce((a, f) => a + f.m.tp, 0);
  const drops = [];
  for (const f of B.foes) {
    S.dex[f.mid] = (S.dex[f.mid] || 0) + 1;
    for (const [id, ch] of [...(f.m.drop ? [f.m.drop] : []), ...(f.m.drops || [])]) if (Math.random() < ch) { addItem(id); drops.push(ITEMS[id].name); }
  }
  S.gold += gold;
  const lines = [];
  for (const m of S.members) {
    const inParty = S.active.includes(m.id);
    // friends waiting outside the fight learn a little too
    lines.push(...gain(m, inParty ? exp : Math.round(exp * 0.5), inParty ? tp : Math.round(tp * 0.5)));
  }
  if (!B.boss) playMusic(null);
  sfx('level');
  B.victory = { exp, gold, tp, drops, lines, t: 0 };
  for (let i = 0; i < 30; i++) { await wait(1); B.victory.t++; }
  // the key is read by a window on the dialogue stack, which sees input inside the frame
  await pressKey();
  for (const p of B.heroes) if (p.h.hp <= 0) { p.h.hp = 1; }
  B.victory = null;
  finish('win');
}
async function defeat() {
  await wait(40);
  finish('lose');
}
async function flee() {
  sfx('run');
  const C = centre(liveFoes());
  await Promise.all(B.heroes.map((p) => { const dx = p.x - C.x, dy = p.y - C.y, d = Math.hypot(dx, dy) || 1; let x = p.x + dx / d * 50, y = p.y + dy / d * 50; if (!walkable(x, y)) { x = p.x; y = p.y; } return walkTo(p, x, y, 14); }));
  for (const f of B.foes) { f.gauge = 0; }
  finish('flee');
}

// ---------- one frame ----------
export function battleUpdate() {
  if (!B) return;
  const ws = B.waiters; B.waiters = [];
  for (const w of ws) { if (--w.n <= 0) w.r(); else B.waiters.push(w); }
}
export function battleDraw() {
  if (!B) return;
  const g = ctx;
  // marks under whoever a technique would reach
  if (B.target) {
    g.save(); g.translate(-Math.round(F.cam.x), -Math.round(F.cam.y));
    const tg = B.target;
    if (tg.area === 'circle' && tg.at) { g.strokeStyle = 'rgba(255,220,120,0.7)'; g.lineWidth = 2; g.beginPath(); g.ellipse(tg.at.x, tg.at.y - 4, tg.r, tg.r * 0.6, 0, 0, 7); g.stroke(); }
    if (tg.area === 'self' && tg.at) { g.strokeStyle = 'rgba(255,220,120,0.7)'; g.lineWidth = 2; g.beginPath(); g.ellipse(tg.at.x, tg.at.y - 4, tg.r, tg.r * 0.6, 0, 0, 7); g.stroke(); }
    if (tg.area === 'line' && tg.at) { const u = tg.user, dx = tg.at.x - u.x, dy = tg.at.y - u.y, len = Math.hypot(dx, dy) || 1; g.strokeStyle = 'rgba(255,220,120,0.5)'; g.lineWidth = 40; g.beginPath(); g.moveTo(u.x, u.y - 8); g.lineTo(tg.at.x + dx / len * 56, tg.at.y - 8 + dy / len * 56); g.stroke(); }
    for (const e of tg.list) { const bob = Math.sin(F.t / 5) * 2; g.drawImage(HAND_D, Math.round(e.x - 5), Math.round(e.y - (e.ht || 56) - 14 + bob)); }
    g.restore();
    // the name of what is pointed at
    const m = tg.main;
    if (m) {
      const s = m.kind === 'foe' ? `${m.m.name}　HP ${m.hp}` : nameOf(m.h);
      // the target's statuses ride along in the name box
      const tags = m.kind === 'foe' ? statusTags(m.status, m.buff) : m.h.hp > 0 ? statusTags(m.h.status, m.buff) : [];
      const tw = tags.length ? Math.min(W - 60 - textW(s), tags.reduce((a, t) => a + textW(t.s) + 4, 4)) : 0, bw = textW(s) + tw;
      windowBox(W / 2 - bw / 2 - 12, 4, bw + 24, 22); text(s, W / 2 - bw / 2, 9, '#f8f8f8');
      if (tw) drawTags(tags, W / 2 - bw / 2 + textW(s) + 8, 9, tw - 4);
    }
  }
  if (B.log) { const w = textW(B.log) + 28; windowBox(W / 2 - w / 2, 4, w, 22); text(B.log, W / 2, 9, '#ffe8a0', { align: 'center' }); }
  // the party's panel
  const n = B.heroes.length, pw = Math.min(150, Math.floor((W - 8) / 3));
  windowBox(4, H - 62, W - 8, 58);
  B.heroes.forEach((p, i) => {
    const x = 14 + i * pw, s = stats(p.h), dead = p.h.hp <= 0;
    text(nameOf(p.h), x, H - 56, dead ? '#a06060' : B.cmdFor === p ? '#ffe070' : '#f8f8f8');
    // every status under the name, in the free space left of MP (pages take turns if they do not fit)
    if (!dead) drawTags(statusTags(p.h.status, p.buff), x, H - 41, pw - 76);
    text(`${p.h.hp}`, x + pw - 24, H - 56, dead ? '#ff6060' : p.h.hp < s.maxhp / 4 ? '#ffd060' : '#f8f8f8', { align: 'right' });
    text(`${p.h.mp}`, x + pw - 24, H - 41, '#a8c8ff', { align: 'right' });
    text('HP', x + pw - 70, H - 56, '#8890b0'); text('MP', x + pw - 70, H - 41, '#8890b0');
    bar(x, H - 22, pw - 30, p.gauge, 100, p.gauge >= 100 ? '#ffe060' : '#60a0ff');
  });
  void n;
  if (B.victory) {
    const v = B.victory, lines = [L(`勝利！　經驗 ${v.exp}　技點 ${v.tp}　${v.gold} 金`, `Victory!  EXP ${v.exp}  TP ${v.tp}  ${v.gold} gold`), ...(v.drops.length ? [L('得到：', 'Found: ') + v.drops.join(L('、', ', '))] : []), ...v.lines].flatMap((l) => wrap(l, W - 68)).slice(0, 7);
    windowBox(20, 30, W - 40, lines.length * 16 + 14);
    lines.forEach((l, i) => text(l, 34, 37 + i * 16, i === 0 ? '#ffe8a0' : '#f8f8f8'));
  }
}
export { refreshParty };
