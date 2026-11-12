// The main loop: the title, walking about, battles on the map, story scripts and the ending.
import { ctx, W, H, present, text, textW, glyphs, windowBox } from './gfx.js';
import { input, pollInput, endInput, setupTouch } from './input.js';
import { initAudio, playMusic, sfx, setMusic, music } from './audio.js';
import { L, LANG, setLang } from './i18n.js';
import { UI, uiTick, say, ask, notice, menu, wait as uiWait } from './ui.js';
import { S, reset, load, save, saveInfo, addItem, addMember, fullHeal, party, carryOver, markEnding, endingsSeen } from './party.js';
import { ITEMS, SHOPS } from './data.js';
import { MAPS, ERA_NAME, mapName } from './maps.js';
import { F, enterMap, fieldUpdate, fieldDraw, foeContact, facing, underfoot, refreshParty, tryMove, mapLabel, visible, spawnFoes } from './field.js';
import { startBattle, battleUpdate, battleDraw, inBattle } from './battle.js';
import { SCRIPTS } from './story.js';
import './maps2.js';
import './story2.js';
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
  map: () => F.map,
  heal: () => fullHeal(),
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
  ending: (kind) => ending(kind),
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
    const has = !!saveInfo(), carry = loadCarry();
    const opts = [L('新的故事', 'New story'), { label: L('繼續', 'Continue'), disabled: !has }, 'Language / 語言', ...(carry ? [{ label: L('二周目（繼承等級與道具）', 'New Game+ (keep levels and items)'), color: '#ffd870' }] : [])];
    const k = await menu(opts.map((o) => (typeof o === 'string' ? { label: o } : o)), { x: W / 2 - (carry ? 120 : 70), y: carry ? 186 : 200, w: carry ? 240 : 140, cancel: false, start: has ? 1 : 0 });
    initAudio();
    if (k === 2) { setLang(LANG === 'en' ? 'zh' : 'en'); continue; }
    if (k === 0 || k === 3) { await fadeTo(1); reset(k === 3 ? carry : null); F.camTarget = null; mode = 'game'; F.beatenHere = new Set(); enterMap('workshop', 6.5, 6.2, 'u'); playMusic('home'); await runScript('intro'); if (fadeA > 0) await fadeTo(0); return; }
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

// ---------- the endings ----------
const CARRY = 'bellhours-carry';
function loadCarry() { try { return JSON.parse(localStorage.getItem(CARRY)); } catch (e) { return null; } }
const CREDITS = () => [
  [L('素材（一）', 'Art and music (1)'), 'LPC Tile Atlas 1 & 2 — Lanea Zimmerman (Sharm), Daniel Armstrong, Casper Nilsson,', 'Daniel Eddeland, Jonas Klinger and others (CC-BY-SA 3.0 / GPL 3.0)', 'Universal LPC Spritesheet Generator contributors (CC-BY-SA / GPL / OGA-BY)', 'LPC monsters — Charles Gabriel (CC-BY-SA 3.0 / GPL 3.0)', 'Font — Cubic 11 (OFL)'],
  [L('素材（二）', 'Art and music (2)'), 'LPC Golem, Wolf, Spiders, Imps, Beetle, 1-Hour Enemy — Stephen "Redshrike" Challener,', 'commissioned by William.Thompsonj (CC-BY / OGA-BY / GPL)', 'LPC animals 2022 — tapatilorenzo, Sevarihk (CC-BY 4.0)', 'Centipede — FiveBrosStopMosYT (CC-BY-SA)  ·  Arachne — AntumDeluge (CC-BY 3.0)', 'Bull — Evert, Daniel Eddeland, Nila122 (CC-BY-SA)  ·  Ectoplasm — Reemax (CC0)', 'Bat demon — theidiotmachine (CC0)'],
  [L('音樂', 'Music'), 'Juhani Junkala — JRPG Packs #1–#5 (CC0), GT RPG soundtrack (CC-BY 4.0)', 'OwlishMedia, Haeldb, Hydrogene (CC0)', '', L('詳細名單見 CREDITS.md', 'Full list in CREDITS.md')],
];
async function ending(kind = 'normal') {
  await fadeTo(1, 40);
  const vesper = !!S.members.find((m) => m.id === 'vesper');
  let pages;
  if (kind === 'bad') {
    playMusic('sad');
    pages = [
      [L('結局・永恆的正午', 'Ending · Eternal Noon')],
      [L('蓮點了點頭。', 'Ren nodded.'), L('鐘聲停在正午，再也沒有落下。', 'The bell stopped at noon, and the noon never ended.')],
      [L('師傅永遠不會老，朋友永遠不會離開。', 'Master never grew old. Friends never left.'), L('……也永遠不會再有明天。', '...And there was never another tomorrow.')],
      [L('在時隙之間最深的地方，一口沒有響過的鐘，靜靜地掛著。', 'In the deepest place of the Hour Between, a bell that never rang hung silently.'), '', L('（其他的結局還在等你）', '(Other endings are waiting for you)')],
    ];
  } else {
    playMusic(kind === 'good' ? 'hymn' : 'ending');
    pages = [
      [kind === 'good' ? L('結局・鐘聲遠揚', 'Ending · The Bell Rings Far') : L('結局・寂靜的餘韻', 'Ending · Echo of the Hush')],
      [L('寂靜的心變成了一顆種子。', "The Hush's heart became a seed."), L('從此，時間又開始流動。', 'And time began to flow again.')],
      [L('公元前 30000 年', '30000 BC'), L('尼洛長成了最好的獵人。', 'Nilo grew into the finest hunter.'), S.flags.calf_saved ? L('他的猛獁「圓圓」一直活到很老很老。', 'His mammoth Roundy lived to a great, great age.') : L('尤卡的骨笛，一代一代傳了下去。', "Yuka's bone flute was handed down, generation after generation.")],
      [L('公元前 3000 年', '3000 BC'), L('卡雅回到了根野。每天早上，骨笛的聲音照常叫醒太陽。', 'Kaya went home to the Rootwild. Every morning the bone flute woke the sun as always.'), S.flags.acorn_planted ? L('時隙旁的小橡樹，長得一年比一年高。', 'The little oak by the rift grew taller every year.') : L('族長托朗把火山口重新封起來，再也不挖了。', 'Chief Toran sealed the crater and never dug again.')],
      [L('公元 1250 年', 'AD 1250'), L('千鐘祭重新開始。這一次，鐘聲往外傳，傳得很遠很遠。', 'The Thousand Bells Festival began again. This time the bell rang outwards, far and far away.'), S.flags.greyfang_debt ? L('灰牙當上了商隊的護衛，再也沒有偷過東西。', 'Greyfang became a caravan guard and never stole again.') : ''],
      [L('公元 1820 年', 'AD 1820'), L('黃銅港的鐘，每一個都走在自己的秒數上。', 'Every clock in Brasshaven kept its own seconds.'), L('卡爾德教授開始在哈蒂的店裡學修錶。米拉偶爾會回去上課。', "Professor Calder began learning watch repair in Hattie's shop. Mira went back to class now and then.")],
      [L('公元 2400 年', 'AD 2400'), L('靜止之年起風了。石像一個接一個地眨眼、伸懶腰。', 'Wind came to Stillfall. One by one the statues blinked and stretched.'), S.flags.valve_open ? L('乾掉的河道裡流著水，賽勒斯和伊歐妮在河邊種下了第一片田。', 'Water ran in the old riverbed, and Silas and Ione planted the first field beside it.') : L('賽勒斯留下來，和伊歐妮一起把城鎮重建起來。', 'Silas stayed, and with Ione began to rebuild the town.')],
      kind === 'good'
        ? [L('公元 9000 年', 'AD 9000'), L('薇絲珀回到餘燼之城，把那顆種子種在露明的墓旁。', "Vesper went home to Emberfall and planted the seed by Lumen's grave."), L('隔年春天，紅色的太陽下開滿了花。大家摘下了面具。', 'The next spring, flowers covered the ground under the red sun. Everyone took off their masks.')]
        : [L('公元 9000 年', 'AD 9000'), vesper ? L('薇絲珀回到了餘燼之城，學著和大家一起看最後的日落。', 'Vesper went home to Emberfall, learning to watch the last sunsets with everyone.') : L('薇絲珀守在燈河鎮的鐘塔裡，仍然學著說再見。', 'Vesper kept watch in the Lanternford tower, still learning to say goodbye.'), L('餘燼之城的人，還戴著面具。', 'In Emberfall, people still wore their masks.')],
      [L('蓮成了燈河鎮最年輕的鐘匠。', 'Ren became the youngest clockmaker in Lanternford.'), L('他做的每一口鐘，都有三種聲音：', 'Every bell he made had three voices:'), L('開始的聲音、現在的聲音、結束的聲音。', 'the sound of beginning, the sound of now, and the sound of ending.')],
      [L('時隙鐘聲　完', 'The Bell Between Hours — The End'), '', L('原創作品・感謝遊玩', 'An original game · thank you for playing'), kind === 'good' ? '' : L('（改變更多過去的命運，結局也許會不一樣）', '(Change more of the past, and the ending may change too)')],
      ...CREDITS(),
      [L('通關存檔已記錄在「繼續」。', 'Your cleared game is saved under Continue.'), L('時隙之間的南邊，有一扇新的門打開了。', 'A new door has opened south of the Hour Between.'), L('標題畫面可以開始「二周目」。', 'New Game+ is now on the title screen.')],
    ];
  }
  mode = 'credits';
  for (const p of pages) { await new Promise((res) => { caption = { lines: p, t: 0, res, long: true }; }); }
  markEnding(kind);
  if (kind !== 'bad') {
    // the cleared game waits at the Hour Between, with the door to the Unrung Bell open
    S.flags.cleared = true; S.flags['end_' + kind] = true;
    fullHeal(); S.map = 'interval'; S.x = 16.5 * T; S.y = 14.6 * T; S.dir = 'd';
    save();
  }
  try { localStorage.setItem(CARRY, JSON.stringify(carryOver())); } catch (e) { /* private mode */ }
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
  text(L('一個關於七個時代、一口鐘的原創故事', 'An original tale of seven ages and one bell'), W / 2, y + g.height * k + 30, '#9098c0', { align: 'center' });
  const seen = endingsSeen(), ne = ['normal', 'good', 'bad'].filter((e) => seen[e]).length;
  if (ne) text(L(`看過的結局 ${ne}／3`, `Endings seen ${ne}/3`), W - 10, H - 16, '#c0a060', { align: 'right' });
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
window.G = { addItem, save, endingsSeen, setMode: (m) => { mode = m; UI.clear(); fadeA = 0; }, uiActive: () => UI.active || !!caption || fadeA > 0.05, fullHeal, S, F, warp, runScript, fight, MAPS, startBattle, get mode() { return mode; }, get busy() { return busy; }, MONSTERS, addMember, refreshParty, enterMap };
titleScreen();
requestAnimationFrame(frame);
