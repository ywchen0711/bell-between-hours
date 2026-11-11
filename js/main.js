// The main loop: the title, walking about, battles on the map, story scripts and the ending.
import { ctx, W, H, present, text, textW, glyphs, windowBox } from './gfx.js';
import { input, pollInput, endInput, setupTouch } from './input.js';
import { initAudio, playMusic, sfx, setMusic, music } from './audio.js';
import { L, LANG, setLang } from './i18n.js';
import { UI, uiTick, say, ask, notice, menu, wait as uiWait } from './ui.js';
import { S, reset, load, saveInfo, addItem, addMember, fullHeal, party } from './party.js';
import { ITEMS, SHOPS } from './data.js';
import { MAPS, ERA_NAME, mapName } from './maps.js';
import { F, enterMap, fieldUpdate, fieldDraw, foeContact, facing, underfoot, refreshParty, tryMove, mapLabel, visible, spawnFoes } from './field.js';
import { startBattle, battleUpdate, battleDraw, inBattle } from './battle.js';
import { SCRIPTS } from './story.js';
import { fieldMenu, shopMenu } from './menu.js';
import { MONSTERS } from './data.js';
import { T } from './gfx.js';

let mode = 'title', busy = false, fadeA = 1, fadeGoal = 0, label = null, caption = null, fleeT = 0;
const overlays = [];

// ---------- fading ----------
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
async function fadeTo(a, frames = 18) { fadeGoal = a; const step = (a - fadeA) / frames; for (let i = 0; i < frames; i++) { fadeA += step; await nextFrame(); } fadeA = a; }

// ---------- moving between maps ----------
function mapMusic() {
  const m = F.map;
  if (m.id === 'lantern' && S.flags.present_frozen && !S.flags.present_frozen_done) return 'danger';
  if (m.id === 'stillfall' && S.flags.spire_cleared) return 'home';
  return m.music;
}
async function warp(id, tx, ty, dir, keepDark = false) {
  sfx('door');
  if (fadeA < 1) await fadeTo(1, 14);
  const prev = F.map && F.map.era;
  F.beatenHere = new Set();
  enterMap(id, tx, ty, dir);
  playMusic(mapMusic());
  if (!keepDark) await fadeTo(0, 14);
  else fadeA = 1;
  if (!MAPS[id].inside || prev !== MAPS[id].era) label = mapLabel(mapName(MAPS[id]));
  if (keepDark) await fadeTo(0, 30);
}

// ---------- the script helpers ----------
const ctxS = {
  say: (n, m) => say(n, m), ask: (n, m, o) => ask(n, m, o), notice: (m) => notice(m), hint: (m) => say(null, m),
  wait: (n) => uiWait(n), set: (f, v = true) => { S.flags[f] = v; }, flag: (f) => !!S.flags[f],
  give: async (id, n = 1) => { addItem(id, n); sfx('chest'); await notice(L(`得到了「${ITEMS[id].name}」！`, `Got ${ITEMS[id].name}!`)); },
  join: (id) => { addMember(id); refreshParty(); sfx('level'); },
  fade: () => fadeTo(1), fadeIn: () => fadeTo(0),
  music: (n) => playMusic(n), sfx: (n) => sfx(n), flash: (col, a = 0.8) => { F.flash = { col, a, k: 0.02 }; }, shake: (n) => { F.shake = n; },
  camera: (tx, ty) => { F.camTarget = tx === null ? null : { x: tx * T, y: ty * T }; },
  push: (dx, dy) => { const p = F.party[0]; for (let i = 0; i < 10; i++) tryMove(p, dx / 10, dy / 10); },
  warp: (id, tx, ty, dir, dark) => warp(id, tx, ty, dir, dark),
  era: () => F.map.era,
  frozen: () => SCRIPTS.frozenPerson(ctxS),
  shop: (id) => shopMenu(SHOPS[id]),
  inn: async (price) => {
    const k = await ask('旅店老闆娘', L(`住一晚 ${price} 金幣。要住嗎？`, `A night is ${price} gold. Stay?`), [L('住', 'Stay'), L('不用', 'No thanks')]);
    if (k !== 0) return;
    if (S.gold < price) { await say('旅店老闆娘', L('錢不夠呢。', "You haven't enough.")); return; }
    S.gold -= price; await fadeTo(1); fullHeal(); sfx('save'); await uiWait(40); await fadeTo(0);
    await say('旅店老闆娘', L('睡得好嗎？', 'Sleep well?'));
  },
  caption: (lines) => new Promise((res) => { caption = { lines, t: 0, res }; }),
  fight: (group) => fight(group),
  battle: async (list, tx, ty, opts = {}) => {
    const group = { id: 'tmp' + Date.now(), x: tx - 0.5, y: ty - 0.8, list, boss: !!opts.boss, still: true };
    F.map.foes = [...(F.map.foes || []), group];
    spawnFoes();
    const r = await fight(group);
    F.map.foes = F.map.foes.filter((g) => g !== group);
    return r;
  },
  ending: () => ending(),
};
async function runScript(name, ...args) {
  const f = SCRIPTS[name];
  if (!f) return;
  busy = true;
  try { await f(ctxS, ...args); } catch (e) { console.error(e); }
  // a story flag may have brought monsters out or sent them away
  if (mode === 'game' && F.map) { const want = (F.map.foes || []).filter((g) => visible(g) && !F.beatenHere.has(g.id) && S.beaten[F.map.id + ':' + g.id] !== 'gone').map((g) => g.id).join(), have = [...new Set(F.foes.map((f) => f.group.id))].join(); if (want !== have) spawnFoes(); }
  busy = false;
}
async function fight(group) {
  const was = busy;
  busy = true;
  const { result } = await startBattle(group);
  if (result === 'win') {
    F.beatenHere.add(group.id);
    if (group.boss) S.beaten[F.map.id + ':' + group.id] = 'gone';
    for (const f of F.foes.filter((f) => f.group === group)) { const i = F.ents.indexOf(f); if (i >= 0) F.ents.splice(i, 1); }
    F.foes = F.foes.filter((f) => f.group !== group);
    playMusic(mapMusic());
  } else if (result === 'flee') { fleeT = 150; playMusic(mapMusic()); }
  else { await gameOver(); }
  if (result !== 'lose') busy = was;
  return result;
}

// ---------- the title ----------
let titleT = 0, titleSel = 0;
async function titleScreen() {
  mode = 'title'; UI.clear(); busy = false; fadeA = 0;
  F.beatenHere = new Set();
  enterMap('lantern', 20.5, 16, 'd');
  F.camTarget = { x: 20.5 * T, y: 9 * T };
  playMusic('title');
  for (;;) {
    const has = !!saveInfo();
    const opts = [L('新的故事', 'New story'), { label: L('繼續', 'Continue'), disabled: !has }, 'Language / 語言'];
    const k = await menu(opts.map((o) => (typeof o === 'string' ? { label: o } : o)), { x: W / 2 - 70, y: 200, w: 140, cancel: false, start: has ? 1 : 0 });
    initAudio();
    if (k === 2) { setLang(LANG === 'en' ? 'zh' : 'en'); continue; }
    if (k === 0) { await fadeTo(1); reset(); F.camTarget = null; mode = 'game'; F.beatenHere = new Set(); enterMap('workshop', 6.5, 6.2, 'u'); playMusic('home'); await runScript('intro'); if (fadeA > 0) await fadeTo(0); return; }
    if (k === 1 && load()) { await fadeTo(1); F.camTarget = null; mode = 'game'; F.beatenHere = new Set(); enterMap(S.map, S.x / T, S.y / T, S.dir); playMusic(mapMusic()); label = mapLabel(mapName(MAPS[S.map])); await fadeTo(0); return; }
  }
}
async function gameOver() {
  playMusic(null);
  await fadeTo(1, 40);
  mode = 'over';
  UI.clear();
  await new Promise((res) => { overOK = res; });
  overOK = null;
  titleScreen();
}
let overOK = null;

// ---------- the ending ----------
async function ending() {
  await fadeTo(1, 40);
  playMusic('ending');
  const pages = [
    [L('寂靜消失了。', 'The Hush was gone.'), L('沒有聲音的鐘，再也沒有響過。', 'The soundless bell never tolled again.')],
    [L('公元 2400 年', 'AD 2400'), L('靜止之年起風了。石像一個接一個地眨眼、伸懶腰。', 'Wind came to Stillfall. One by one the statues blinked and stretched.'), L('賽勒斯留下來，和伊歐妮一起把城鎮重建起來。', 'Silas stayed, and with Ione began to rebuild the town.')],
    [L('公元前 3000 年', '3000 BC'), L('卡雅回到了根野。每天早上，骨笛的聲音照常叫醒太陽。', 'Kaya went home to the Rootwild. Every morning the bone flute woke the sun as always.'), L('族長托朗把火山口重新封起來，再也不挖了。', 'Chief Toran sealed the crater and never dug again.')],
    [L('公元 1250 年', 'AD 1250'), L('千鐘祭重新開始。這一次，鐘聲往外傳，傳得很遠很遠。', 'The Thousand Bells Festival began again. This time the bell rang outwards, far and far away.'), L('米拉繼續她的旅行。薇絲珀守在鐘塔裡，學著說再見。', 'Mira went on with her travels. Vesper kept watch in the tower, learning to say goodbye.')],
    [L('蓮成了燈河鎮最年輕的鐘匠。', 'Ren became the youngest clockmaker in Lanternford.'), L('他做的每一口鐘，都有三種聲音：', 'Every bell he made had three voices:'), L('開始的聲音、現在的聲音、結束的聲音。', 'the sound of beginning, the sound of now, and the sound of ending.')],
    [L('時隙鐘聲　完', 'The Bell Between Hours — The End'), '', L('原創作品・感謝遊玩', 'An original game · thank you for playing')],
    [L('素材', 'Art and music'), 'LPC Tile Atlas 1 & 2 — Lanea Zimmerman (Sharm), Daniel Armstrong, Casper Nilsson,', 'Daniel Eddeland, Jonas Klinger and others (CC-BY-SA 3.0 / GPL 3.0)', 'Universal LPC Spritesheet Generator contributors (CC-BY-SA / GPL / OGA-BY)', 'LPC monsters — Charles Gabriel (CC-BY-SA 3.0 / GPL 3.0)', 'Music — Juhani Junkala, OwlishMedia, Haeldb (CC0)', 'Font — Cubic 11 (OFL)', L('詳細名單見 CREDITS.md', 'Full list in CREDITS.md')],
  ];
  mode = 'credits';
  for (const p of pages) { await new Promise((res) => { caption = { lines: p, t: 0, res, long: true }; }); }
  S.flags.cleared = true;
  await fadeTo(1, 30);
  titleScreen();
}

// ---------- each frame ----------
function checkTriggers() {
  if (fleeT > 0) fleeT--;
  if (input.pressed('menu')) { busy = true; fieldMenu().then(() => { busy = false; }); return; }
  if (input.pressed('a')) {
    const f = facing();
    if (f) {
      if (f.npc) { const n = f.npc; const lead = F.party[0]; if (!n.wander || true) n.dir = { u: 'd', d: 'u', l: 'r', r: 'l' }[lead.dir]; const stone = F.map.stone && S.flags[F.map.stone] && !S.flags[F.map.stone + '_done']; runScript(stone && n.id !== 'orrin' ? 'frozenPerson' : n.talk); return; }
      if (f.statue) { runScript('frozenPerson'); return; }
      if (f.chest) { openChest(f.chest); return; }
      if (f.save) { hourLight(); return; }
      if (f.event) { runScript(f.event.run); return; }
    }
  }
  const u = underfoot();
  if (u) {
    if (u.door && !u.door.locked) { busy = true; warp(u.door.to, u.door.tx, u.door.ty, 'd').then(() => { busy = false; }); return; }
    if (u.warp) { busy = true; warp(u.warp.to, u.warp.tx, u.warp.ty, u.warp.dir).then(() => { busy = false; }); return; }
    if (u.event) { runScript(u.event.run); return; }
  }
  if (fleeT <= 0) {
    const g = foeContact();
    if (g) { if (g.run) runScript(g.run, g); else fight(g); }
  }
}
async function openChest(e) {
  const key = F.map.id + ':' + e.c.id;
  if (S.opened[key]) return;
  busy = true;
  S.opened[key] = true; sfx('chest');
  if (e.c.gold) { S.gold += e.c.gold; await notice(L(`得到 ${e.c.gold} 金幣！`, `Found ${e.c.gold} gold!`)); }
  else { addItem(e.c.item, e.c.n || 1); await notice(L(`得到了「${ITEMS[e.c.item].name}」${e.c.n > 1 ? ' ×' + e.c.n : ''}！`, `Found ${ITEMS[e.c.item].name}${e.c.n > 1 ? ' ×' + e.c.n : ''}!`)); }
  busy = false;
}
async function hourLight() {
  busy = true;
  fullHeal(); sfx('save');
  const k = await ask(null, L('時之燈的光暖暖的，大家的傷都好了。要記錄冒險嗎？', "The hour-light is warm; everyone's wounds are healed. Record your journey?"), [L('記錄', 'Save'), L('不用', 'No')]);
  if (k === 0) { const { save } = await import('./party.js'); if (save()) await notice(L('記錄好了。', 'Saved.')); }
  busy = false;
}
function drawCaption() {
  if (!caption) return;
  const c = caption; c.t++;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const a = Math.min(1, c.t / 30);
  ctx.globalAlpha = a;
  const y0 = H / 2 - c.lines.length * 11;
  c.lines.forEach((l, i) => text(l, W / 2, y0 + i * 22, i === 0 ? '#ffe8a0' : '#e8e8f0', { align: 'center' }));
  ctx.globalAlpha = 1;
  if ((c.t > 60 && (input.pressed('a') || input.pressed('b'))) || c.t > (c.long ? 600 : 240)) { caption = null; c.res(); }
}
function drawTitle() {
  fieldDraw();
  ctx.fillStyle = 'rgba(8,10,30,0.45)'; ctx.fillRect(0, 0, W, H);
  titleT++;
  const t1 = L('時隙鐘聲', 'The Bell Between Hours'), g = glyphs(t1, '#ffe8a0'), gs = glyphs(t1, '#3a2006'), k = LANG === 'en' ? 2 : 4;
  ctx.imageSmoothingEnabled = false;
  const x = Math.round(W / 2 - g.width * k / 2), y = 60 + Math.round(Math.sin(titleT / 50) * 2);
  ctx.drawImage(gs, x + k, y + k, g.width * k, g.height * k); ctx.drawImage(g, x, y, g.width * k, g.height * k);
  text(LANG === 'en' ? '時隙鐘聲' : 'The Bell Between Hours', W / 2, y + g.height * k + 10, '#c8d0f0', { align: 'center' });
  text(L('一個關於三個時代、一口鐘的原創故事', 'An original tale of three eras and one bell'), W / 2, y + g.height * k + 30, '#9098c0', { align: 'center' });
}
function frame() {
  pollInput(); uiTick();
  if (mode === 'title') { fieldUpdate(false); drawTitle(); UI.draw(); if (UI.active) UI.update(); }
  else if (mode === 'game') {
    const free = !UI.active && !busy && !inBattle() && !caption && fadeA < 0.05;
    fieldUpdate(free && !inBattle());
    battleUpdate();
    if (free) checkTriggers();
    fieldDraw();
    battleDraw();
    if (label && !label.draw()) label = null;
    UI.draw();
    if (UI.active) UI.update();
  } else if (mode === 'over') {
    ctx.fillStyle = '#05060c'; ctx.fillRect(0, 0, W, H);
    text(L('時間停止了……', 'Time has stopped...'), W / 2, H / 2 - 10, '#c0a0ff', { align: 'center' });
    text(L('按 A 回到標題', 'Press A for the title'), W / 2, H / 2 + 14, '#8088a8', { align: 'center' });
    if (fadeA > 0) fadeA = Math.max(0, fadeA - 0.03);
    if (overOK && input.pressed('a')) overOK();
  } else if (mode === 'credits') { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }
  if (fadeA > 0) { ctx.fillStyle = `rgba(0,0,0,${Math.min(1, fadeA)})`; ctx.fillRect(0, 0, W, H); }
  drawCaption();
  present(false);
  endInput();
  requestAnimationFrame(frame);
}
setupTouch();
addEventListener('keydown', () => initAudio(), { once: false });
addEventListener('pointerdown', () => initAudio());
window.G = { setMode: (m) => { mode = m; UI.clear(); fadeA = 0; }, uiActive: () => UI.active || !!caption || fadeA > 0.05, fullHeal, S, F, warp, runScript, fight, MAPS, startBattle, get mode() { return mode; }, get busy() { return busy; }, MONSTERS, addMember, refreshParty, enterMap };
titleScreen();
requestAnimationFrame(frame);
