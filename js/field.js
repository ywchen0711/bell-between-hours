// Walking about: building a map from its description, collision, the party following the leader,
// people, monsters you can see and walk round, doors, chests, hour-lights (save points), and drawing
// everything sorted by how far down the screen it stands.
import { ctx, W, H, T, canvas, text } from './gfx.js';
import { MAPS, LEGEND, BLOCK } from './maps.js';
import { renderGround, prop, PROPS, house } from './tiles.js';
import { drawChar, drawMon, shadow, dirOf, MON } from './sprites.js';
import { MONSTERS, HEROES } from './data.js';
import { S, party } from './party.js';
import { input } from './input.js';
import { sfx } from './audio.js';

export const F = { map: null, ents: [], foes: [], npcs: [], party: [], cam: { x: 0, y: 0 }, camTarget: null, t: 0, trail: [], battle: null, shake: 0, flash: null, fx: [], lock: false };
const flag = (f) => !f || !!S.flags[f];
export const visible = (o) => (!o.if || flag(o.if)) && (!o.unless || !S.flags[o.unless]);

// ---------- building a map ----------
const groundCache = new Map();
export function enterMap(id, tx, ty, dir) {
  const m = MAPS[id];
  F.map = m; S.map = id;
  const w = m.rows[0].length, h = m.rows.length;
  F.w = w; F.h = h;
  if (!groundCache.has(id)) groundCache.set(id, renderGround(m.rows, LEGEND, m.order, m.base));
  F.ground = groundCache.get(id);
  // collision in 8px cells
  const cw = w * 4, ch = h * 4, col = new Uint8Array(cw * ch);
  F.col = col; F.cw = cw; F.ch = ch;
  const block = (x0, y0, x1, y1) => { for (let y = Math.max(0, Math.floor(y0 / 8)); y < Math.min(ch, Math.ceil(y1 / 8)); y++) for (let x = Math.max(0, Math.floor(x0 / 8)); x < Math.min(cw, Math.ceil(x1 / 8)); x++) col[y * cw + x] = 1; };
  F.block = block;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (BLOCK.has(m.rows[y][x])) block(x * T, y * T, x * T + T, y * T + T);
  F.ents = []; F.npcs = []; F.foes = []; F.fx = [];
  for (const [name, x, y] of m.props || []) {
    const p = PROPS[name], img = prop(name), left = x * T, bottom = (y + 1) * T;
    const e = { kind: 'prop', img, x: left, y: bottom, sort: bottom - (p[5] ? p[5][1] : 0) - (p[5] ? 4 : 30) };
    if (!p[5]) e.sort = bottom - p[4] + 8; // flat things lie under people
    F.ents.push(e);
    if (p[5]) { const [fx, fy, fw, fh] = p[5]; block(left + fx, bottom - fy - fh, left + fx + fw, bottom - fy); }
  }
  F.doors = [];
  for (const hs of m.houses || []) {
    const img = house(hs.w, { style: hs.style || 'brick', windows: !hs.tower });
    const left = hs.x * T, top = hs.y * T;
    F.ents.push({ kind: 'prop', img, x: left, y: top + 6 * T, sort: top + 6 * T - 4, dark: hs.dark });
    block(left, top + 1 * T, left + hs.w * T, top + 6 * T);
    const dx = left + img.door * T;
    // the door itself can be walked into
    for (let y = Math.floor((top + 5 * T) / 8); y < (top + 6 * T) / 8; y++) for (let x = dx / 8; x < (dx + T) / 8; x++) col[y * cw + x] = 0;
    if (hs.to && !hs.shut) F.doors.push({ x: dx, y: top + 5 * T, w: T, h: T, to: hs.to, tx: hs.tx, ty: hs.ty });
    else F.doors.push({ x: dx, y: top + 5 * T, w: T, h: T, locked: true });
  }
  for (const d of m.deco || []) F.ents.push({ kind: 'deco', d, x: d.x * T, y: d.y * T, sort: d.kind === 'spire' ? d.y * T - 1 : d.kind === 'clock' && d.big ? d.y * T + 140 : d.kind === 'rift' || d.kind === 'festival' ? -1e6 + d.y : d.y * T + (d.kind === 'bell' ? 40 : 0) });
  for (const [x, y] of m.saves || []) F.ents.push({ kind: 'save', x: x * T + 16, y: y * T + 20, sort: -1e5 });
  for (const c of m.chests || []) {
    const e = { kind: 'chest', c, x: c.x * T, y: (c.y + 1) * T, sort: (c.y + 1) * T - 6 };
    F.ents.push(e); block(c.x * T + 2, c.y * T + 10, c.x * T + 30, c.y * T + 30);
  }
  for (const [sp, x, y, d] of m.statues || []) F.ents.push({ kind: 'npc', sprite: sp, x: x * T + 16, y: y * T + 24, dir: d, look: 'stone', statue: true, sort: y * T + 24 });
  for (const n of m.npcs || []) {
    const e = { kind: 'npc', ...n, home: [n.x * T + 16, n.y * T + 24], x: n.x * T + 16, y: n.y * T + 24, dir: n.dir || 'd', step: 0, wt: Math.random() * 120 };
    F.npcs.push(e); F.ents.push(e);
  }
  spawnFoes();
  // the party
  const px = tx * T, py = ty * T;
  F.party = party().map((h, i) => ({ kind: 'hero', id: h.id, h, sprite: HEROES[h.id].sprite, x: px, y: py + i * 2, dir: dir || 'd', step: 0, anim: 'walk', frame: 0 }));
  F.trail = Array.from({ length: 80 }, () => [px, py, dir || 'd']);
  for (const p of F.party) F.ents.push(p);
  S.x = px; S.y = py; S.dir = dir || 'd';
  snapCamera();
}
export function spawnFoes() {
  F.foes = F.foes.filter((f) => { const i = F.ents.indexOf(f); if (i >= 0) F.ents.splice(i, 1); return false; });
  for (const gdef of F.map.foes || []) {
    if (!visible(gdef) || S.beaten[F.map.id + ':' + gdef.id] === 'gone' || (F.beatenHere && F.beatenHere.has(gdef.id))) continue;
    const offs = [[0, 0], [1.3, 0.9], [-1.3, 0.9], [0, 1.8], [1.4, -0.9]];
    gdef.list.forEach((mid, i) => {
      const [ox, oy] = offs[i % offs.length], x = (gdef.x + ox) * T + 16, y = (gdef.y + oy) * T + 24;
      const f = { kind: 'foe', mid, m: MONSTERS[mid], group: gdef, x, y, home: [x, y], dir: 'd', step: 0, t: Math.random() * 6, wt: Math.random() * 90 };
      F.foes.push(f); F.ents.push(f);
    });
  }
}
// the party as it is now (after someone joins or the order changes)
export function refreshParty() {
  const lead = F.party[0] || { x: S.x, y: S.y, dir: S.dir };
  for (const p of F.party) { const i = F.ents.indexOf(p); if (i >= 0) F.ents.splice(i, 1); }
  F.party = party().map((h, i) => ({ kind: 'hero', id: h.id, h, sprite: HEROES[h.id].sprite, x: lead.x, y: lead.y + i, dir: lead.dir, step: 0, anim: 'walk', frame: 0 }));
  for (const p of F.party) F.ents.push(p);
  F.trail = Array.from({ length: 80 }, () => [lead.x, lead.y, lead.dir]);
}

// ---------- collision ----------
export function solidAt(x, y) {
  const cx = Math.floor(x / 8), cy = Math.floor(y / 8);
  if (cx < 0 || cy < 0 || cx >= F.cw || cy >= F.ch) return true;
  return F.col[cy * F.cw + cx] === 1;
}
// a body is a small box round the feet
const boxFree = (x, y) => !solidAt(x - 7, y - 6) && !solidAt(x + 7, y - 6) && !solidAt(x - 7, y + 2) && !solidAt(x + 7, y + 2);
function npcAt(x, y, self) {
  for (const n of F.npcs) if (n !== self && visible(n) && Math.abs(n.x - x) < 16 && Math.abs(n.y - y) < 12) return n;
  return null;
}
export function tryMove(e, dx, dy) {
  let moved = false;
  if (dx && boxFree(e.x + dx, e.y) && !(e.kind === 'hero' && npcAt(e.x + dx, e.y))) { e.x += dx; moved = true; }
  if (dy && boxFree(e.x, e.y + dy) && !(e.kind === 'hero' && npcAt(e.x, e.y + dy))) { e.y += dy; moved = true; }
  return moved;
}
export const walkable = (x, y) => boxFree(x, y);

// ---------- the camera ----------
function camGoal() {
  const t = F.camTarget || F.party[0] || { x: S.x, y: S.y };
  const mw = F.w * T, mh = F.h * T;
  let x = t.x - W / 2, y = t.y - H / 2 - 16;
  x = mw <= W ? (mw - W) / 2 : Math.max(0, Math.min(mw - W, x));
  y = mh <= H ? (mh - H) / 2 : Math.max(0, Math.min(mh - H, y));
  return [x, y];
}
export function snapCamera() { const [x, y] = camGoal(); F.cam.x = x; F.cam.y = y; }
function updateCamera() { const [x, y] = camGoal(); F.cam.x += (x - F.cam.x) * 0.15; F.cam.y += (y - F.cam.y) * 0.15; }

// ---------- one frame of walking ----------
export function fieldUpdate(canAct) {
  F.t++;
  const lead = F.party[0];
  let moving = false;
  if (canAct && lead && !F.lock) {
    let dx = 0, dy = 0;
    if (input.held('left')) dx -= 1; if (input.held('right')) dx += 1; if (input.held('up')) dy -= 1; if (input.held('down')) dy += 1;
    if (dx || dy) {
      const sp = input.held('b') ? 3.1 : 2.0, k = dx && dy ? 0.7071 : 1;
      lead.dir = dx && dy ? (lead.dir === dirOf(dx, 0) || lead.dir === dirOf(0, dy) ? lead.dir : dirOf(dx, dy)) : dirOf(dx, dy);
      moving = tryMove(lead, dx * sp * k, dy * sp * k);
      if (moving) lead.step += sp / 2.2;
    }
  }
  if (lead) {
    if (moving) { F.trail.unshift([lead.x, lead.y, lead.dir]); F.trail.length = 80; }
    lead.frame = moving ? 1 + (Math.floor(lead.step / 3) % 8) : 0;
    // friends follow the leader's footsteps; in a battle they stand where the battle put them
    if (!F.battle) F.party.slice(1).forEach((p, i) => {
      const [tx, ty, td] = F.trail[Math.min(79, (i + 1) * 14)];
      const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy), mv = d > 0.5;
      if (mv) { p.dir = dirOf(dx, dy) || td; p.step += 1; }
      // never more than a quick step at a time, so after a battle they walk back into line
      const k = d > 4 ? 4 / d : 1;
      p.x += dx * k; p.y += dy * k; p.frame = mv ? 1 + (Math.floor(p.step / 3) % 8) : 0;
    });
    S.x = lead.x; S.y = lead.y; S.dir = lead.dir;
  }
  // people wander a little near home
  for (const n of F.npcs) {
    if (!n.wander || F.lock || !canAct) { n.frame = 0; continue; }
    if (n.goal) {
      const dx = n.goal[0] - n.x, dy = n.goal[1] - n.y, d = Math.hypot(dx, dy);
      if (d < 2 || !tryMove(n, dx / d * 0.8, dy / d * 0.8)) { n.goal = null; n.frame = 0; }
      else { n.dir = dirOf(dx, dy); n.step++; n.frame = 1 + Math.floor(n.step / 5) % 8; }
    } else if (--n.wt < 0) {
      n.wt = 90 + Math.random() * 160;
      const a = Math.random() * Math.PI * 2, r = Math.random() * n.wander * T;
      n.goal = [n.home[0] + Math.cos(a) * r, n.home[1] + Math.sin(a) * r];
      if (lead && Math.hypot(n.goal[0] - lead.x, n.goal[1] - lead.y) < 30) n.goal = null;
    }
  }
  // monsters drift about their spot until they see you
  if (!F.battle) for (const f of F.foes) {
    f.t += 1 / 60;
    if (f.group.still || F.lock || !canAct) continue;
    if (--f.wt < 0) { f.wt = 60 + Math.random() * 120; const a = Math.random() * Math.PI * 2; f.goal = [f.home[0] + Math.cos(a) * 28, f.home[1] + Math.sin(a) * 20]; }
    if (f.goal) {
      const dx = f.goal[0] - f.x, dy = f.goal[1] - f.y, d = Math.hypot(dx, dy);
      if (d < 2 || !tryMove(f, dx / d * 0.6, dy / d * 0.6)) f.goal = null;
      else { f.dir = dirOf(dx, dy); f.step++; }
    }
  }
  for (const fx of F.fx) fx.t++;
  F.fx = F.fx.filter((fx) => fx.t < fx.life);
  if (F.shake > 0) F.shake--;
  updateCamera();
}
// the monster group the leader has walked up to, if any
export function foeContact() {
  const lead = F.party[0];
  if (!lead) return null;
  for (const f of F.foes) {
    const r = f.group.boss ? 70 : 46;
    if (Math.hypot(f.x - lead.x, f.y - lead.y) < r) return f.group;
  }
  return null;
}
// what is in front of the leader
export function facing() {
  const lead = F.party[0];
  const v = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] }[lead.dir];
  const fx = lead.x + v[0] * 22, fy = lead.y + v[1] * 22 - 4;
  for (const n of F.npcs) if (visible(n) && Math.abs(n.x - fx) < 20 && Math.abs(n.y - fy) < 20) return { npc: n };
  for (const e of F.ents) {
    if (e.kind === 'chest' && Math.abs(e.x + 16 - fx) < 22 && Math.abs(e.y - 12 - fy) < 22) return { chest: e };
    if (e.kind === 'npc' && e.statue && Math.abs(e.x - fx) < 18 && Math.abs(e.y - fy) < 18) return { statue: e };
    if (e.kind === 'save' && Math.abs(e.x - fx) < 22 && Math.abs(e.y - fy) < 22) return { save: e };
  }
  for (const ev of F.map.events || []) if (!ev.touch && visible(ev) && fx >= ev.x * T && fx < (ev.x + ev.w) * T && fy >= ev.y * T && fy < (ev.y + ev.h) * T) return { event: ev };
  return null;
}
export function onSave() {
  const lead = F.party[0];
  return F.ents.some((e) => e.kind === 'save' && Math.hypot(e.x - lead.x, e.y - lead.y) < 18);
}
// a door, a map edge or a touched story trigger under the leader's feet
export function underfoot() {
  const lead = F.party[0];
  if (!lead) return null;
  const x = lead.x, y = lead.y - 4;
  for (const d of F.doors) if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h + 8) return { door: d };
  for (const w of F.map.warps || []) if (visible(w) && x >= w.x * T && x < (w.x + w.w) * T && y >= w.y * T - 4 && y < (w.y + w.h) * T + 4) return { warp: w };
  for (const ev of F.map.events || []) if (ev.touch && visible(ev) && x >= ev.x * T && x < (ev.x + ev.w) * T && y >= ev.y * T && y < (ev.y + ev.h) * T) return { event: ev };
  return null;
}

// ---------- drawing ----------
const stars = Array.from({ length: 90 }, (_, i) => [((i * 97) % 480), ((i * 53) % 320), (i % 3) + 1]);
function drawDeco(g, e) {
  const { d } = e, x = e.x, y = e.y, t = F.t;
  if (d.if && !flag(d.if)) return; if (d.unless && S.flags[d.unless]) return;
  if (d.kind === 'spire') { const img = prop('spirecone'); g.globalAlpha = d.dark ? 0.75 : 1; g.drawImage(img, Math.round(x - 48), Math.round(y - 224)); g.globalAlpha = 1; }
  else if (d.kind === 'clock') {
    const r = d.big ? 15 : d.small ? 7 : 10;
    g.fillStyle = '#3a2810'; g.beginPath(); g.arc(x, y, r + 2, 0, 7); g.fill();
    g.fillStyle = d.stopped ? '#9aa0a8' : '#f4ead0'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.fillStyle = '#3a2810'; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.fillRect(Math.round(x + Math.cos(a) * (r - 3)), Math.round(y + Math.sin(a) * (r - 3)), 1, 1); }
    const now = d.stopped ? 0.21 : (Date.now() / 1000) / 60, hm = now / 12, a1 = hm * Math.PI * 2 - Math.PI / 2, a2 = now * Math.PI * 2 - Math.PI / 2;
    g.strokeStyle = '#2a1a08'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a1) * r * 0.5, y + Math.sin(a1) * r * 0.5); g.stroke();
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a2) * r * 0.8, y + Math.sin(a2) * r * 0.8); g.stroke();
  } else if (d.kind === 'rift') {
    const cx = x + 16, cy = y + 16;
    for (let k = 5; k >= 0; k--) {
      const rr = 6 + k * 4 + Math.sin(t / 10 + k) * 1.5;
      g.strokeStyle = d.red ? `rgba(${200 + k * 8},${60 + k * 10},${120 + k * 12},${0.25 + (5 - k) * 0.1})` : `rgba(${120 + k * 16},${90 + k * 20},255,${0.25 + (5 - k) * 0.1})`;
      g.lineWidth = 2; g.beginPath(); g.ellipse(cx, cy, rr, rr * 0.55, (t / 40) * (k % 2 ? 1 : -1), 0, Math.PI * 1.6); g.stroke();
    }
    g.fillStyle = d.red ? 'rgba(255,200,220,0.8)' : 'rgba(230,220,255,0.85)'; g.beginPath(); g.ellipse(cx, cy, 4, 2.4, 0, 0, 7); g.fill();
  } else if (d.kind === 'bell') {
    const sw = S.flags.bell_rung && !S.flags.beat_vesper ? 0 : Math.sin(t / 40) * 0.04;
    g.save(); g.translate(x, y - 40); g.rotate(sw);
    g.fillStyle = '#4a3410'; g.fillRect(-3, -28, 6, 12);
    const grd = g.createLinearGradient(-30, 0, 30, 0); grd.addColorStop(0, '#6a4a14'); grd.addColorStop(0.35, '#f0c860'); grd.addColorStop(0.6, '#c89030'); grd.addColorStop(1, '#5a3a0c');
    g.fillStyle = grd; g.beginPath(); g.moveTo(-12, -18); g.quadraticCurveTo(-14, 10, -30, 26); g.lineTo(30, 26); g.quadraticCurveTo(14, 10, 12, -18); g.quadraticCurveTo(0, -24, -12, -18); g.fill();
    g.fillStyle = '#3a2808'; g.fillRect(-30, 24, 60, 3);
    g.fillStyle = S.flags.bell_rung && !S.flags.beat_vesper ? '#8040c0' : '#ffe8a0'; g.beginPath(); g.arc(0, 4, 4, 0, 7); g.fill();
    g.restore();
  } else if (d.kind === 'machine') {
    g.strokeStyle = '#a0b8d0'; g.lineWidth = 3; g.beginPath(); g.ellipse(x + 16, y + 20, 26, 16, 0, 0, 7); g.stroke();
    g.strokeStyle = '#506070'; g.lineWidth = 1; g.beginPath(); g.ellipse(x + 16, y + 20, 30, 19, 0, 0, 7); g.stroke();
  } else if (d.kind === 'star') {
    const p = 0.6 + Math.sin(t / 12) * 0.3;
    g.fillStyle = `rgba(160,120,255,${0.25 * p})`; g.beginPath(); g.arc(x + 16, y + 10, 26, 0, 7); g.fill();
    g.fillStyle = '#2a2040'; g.beginPath(); g.moveTo(x + 4, y + 18); g.lineTo(x + 10, y + 2); g.lineTo(x + 24, y); g.lineTo(x + 30, y + 16); g.closePath(); g.fill();
    g.fillStyle = `rgba(200,170,255,${p})`; g.fillRect(x + 14, y + 6, 3, 3); g.fillRect(x + 20, y + 10, 2, 2);
  } else if (d.kind === 'festival') {
    const cols = ['#e04848', '#f0c040', '#4890e0', '#60c060'];
    for (const row of [0, 1]) {
      const yy = y + (row ? 10 * T : 0) + 2;
      g.strokeStyle = '#3a2a1a'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, yy); g.quadraticCurveTo(x + d.w * T / 2, yy + 14, x + d.w * T, yy); g.stroke();
      for (let k = 0; k < d.w * 2; k++) {
        const fx = x + k * 16 + 8, f = (fx - x) / (d.w * T), fy = yy + 4 * 14 * f * (1 - f) * 1.0 * 1;
        g.fillStyle = cols[k % 4]; g.beginPath(); g.moveTo(fx - 4, fy); g.lineTo(fx + 4, fy); g.lineTo(fx, fy + 7); g.fill();
      }
    }
  }
}
function drawEnt(g, e) {
  if (e.kind === 'prop') { if (e.dark) g.globalAlpha = 0.85; g.drawImage(e.img, Math.round(e.x), Math.round(e.y - e.img.height)); g.globalAlpha = 1; return; }
  if (e.kind === 'deco') return drawDeco(g, e);
  if (e.kind === 'save') {
    const t = F.t / 20;
    g.fillStyle = 'rgba(255,230,140,0.25)'; g.beginPath(); g.ellipse(e.x, e.y, 14, 6, 0, 0, 7); g.fill();
    for (let k = 0; k < 4; k++) { const a = t + k * Math.PI / 2; g.fillStyle = k % 2 ? '#fff4c0' : '#ffd060'; g.fillRect(Math.round(e.x + Math.cos(a) * 9) - 1, Math.round(e.y - 14 + Math.sin(a * 1.3) * 6) - 1, 3, 3); }
    g.fillStyle = '#fff8e0'; g.fillRect(Math.round(e.x) - 1, Math.round(e.y - 16 + Math.sin(t) * 3), 3, 3);
    return;
  }
  if (e.kind === 'chest') { g.drawImage(prop(S.opened[F.map.id + ':' + e.c.id] ? 'chestopen' : 'chest'), e.x, e.y - 32); if (S.opened[F.map.id + ':' + e.c.id]) { g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(e.x + 6, e.y - 26, 20, 6); } return; }
  if (e.kind === 'npc') {
    if (!visible(e) || !e.sprite) return;
    const stone = e.statue || (F.map.stone && S.flags[F.map.stone] && !S.flags[F.map.stone + '_done']);
    shadow(g, e.x, e.y);
    drawChar(g, e.sprite, { dir: e.dir, frame: stone ? 0 : e.frame || 0, x: e.x, y: e.y, look: stone ? 'stone' : e.look });
    return;
  }
  if (e.kind === 'hero') {
    if (e.hidden) return;
    shadow(g, e.x, e.y);
    drawChar(g, e.sprite, { anim: e.anim || 'walk', dir: e.dir, frame: e.frame || 0, x: e.x + (e.jx || 0), y: e.y + (e.jy || 0), alpha: e.alpha ?? 1, look: e.look });
    return;
  }
  if (e.kind === 'foe') {
    if (e.gone) return;
    const m = e.m, sc = m.scale || 1, a = e.alpha ?? 1, look = e.flash > 0 ? null : m.look;
    if (m.sprite.startsWith('m:')) {
      shadow(g, e.x, e.y, 12 * sc);
      drawMon(g, m.sprite.slice(2), { dir: e.dir, frame: e.atkFrame ?? e.t * 7, attacking: e.atkFrame !== undefined, x: e.x + (e.jx || 0), y: e.y + (e.jy || 0), look, scale: sc, alpha: a, t: e.t });
    } else {
      shadow(g, e.x, e.y, 14 * sc);
      const moving = e.goal && !F.battle;
      drawChar(g, m.sprite.slice(2), { anim: e.anim || 'walk', dir: e.dir, frame: e.frame ?? (moving ? 1 + Math.floor(e.step / 5) % 8 : 0), x: e.x + (e.jx || 0), y: e.y + (e.jy || 0), look, scale: sc, alpha: a });
    }
    if (e.flash > 0) { e.flash--; }
  }
}
export function fieldDraw(g = ctx) {
  const sx = Math.round(F.cam.x + (F.shake ? (Math.random() - 0.5) * 6 : 0)), sy = Math.round(F.cam.y + (F.shake ? (Math.random() - 0.5) * 6 : 0));
  g.fillStyle = '#05060c'; g.fillRect(0, 0, W, H);
  if (F.map.stars) for (const [x, y, s] of stars) { g.fillStyle = s === 3 ? '#c8c0ff' : '#6a6890'; g.fillRect((x - sx * 0.2 + 960) % 480, (y - sy * 0.2 + 640) % 320, s > 2 ? 2 : 1, s > 2 ? 2 : 1); }
  g.drawImage(F.ground, sx, sy, Math.min(W, F.ground.width - sx), Math.min(H, F.ground.height - sy), 0, 0, Math.min(W, F.ground.width - sx), Math.min(H, F.ground.height - sy));
  g.save(); g.translate(-sx, -sy);
  const list = F.ents.filter((e) => e.x > sx - 260 && e.x < sx + W + 260 && e.y > sy - 40 && e.y < sy + H + 300);
  for (const e of list) if (e.kind !== 'prop' && e.kind !== 'deco' && e.kind !== 'save') e.sort = e.y;
  list.sort((a, b) => a.sort - b.sort);
  for (const e of list) drawEnt(g, e);
  for (const fx of F.fx) fx.draw(g, fx.t / fx.life, fx);
  g.restore();
  if (F.map.tint === 'still' && !S.flags.spire_cleared) { g.fillStyle = 'rgba(70,90,140,0.22)'; g.fillRect(0, 0, W, H); }
  if (F.map.stone && S.flags[F.map.stone] && !S.flags[F.map.stone + '_done']) { g.fillStyle = 'rgba(80,90,130,0.25)'; g.fillRect(0, 0, W, H); }
  if (F.map.tint === 'cave') { const gr = g.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 300); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(20,0,0,0.55)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  if (F.flash) { g.fillStyle = F.flash.col; g.globalAlpha = Math.max(0, F.flash.a); g.fillRect(0, 0, W, H); g.globalAlpha = 1; F.flash.a -= F.flash.k; if (F.flash.a <= 0) F.flash = null; }
}
// a burst of something at a spot, drawn in map space
export function addFx(draw, life, extra = {}) { F.fx.push({ draw, life, t: 0, ...extra }); }
export function mapLabel(s) {
  const w = Math.min(W - 40, 30 + s.length * 12);
  return { t: 0, draw() { this.t++; const a = this.t < 20 ? this.t / 20 : this.t > 130 ? Math.max(0, (160 - this.t) / 30) : 1; ctx.globalAlpha = a; ctx.fillStyle = 'rgba(10,12,30,0.75)'; ctx.fillRect(W / 2 - w / 2, 20, w, 22); text(s, W / 2, 25, '#f8e8b0', { align: 'center' }); ctx.globalAlpha = 1; return this.t < 160; } };
}
export { MON, canvas };
