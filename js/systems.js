// The expansion's pastimes and records: the forge, the monster book, the quest log, fishing, and the
// Gearwork Fair's strength bell, beetle race and prize booth. Each is a window on the dialogue stack.
import { ctx, W, H, text, textW, windowBox, bar } from './gfx.js';
import { input } from './input.js';
import { sfx } from './audio.js';
import { L } from './i18n.js';
import { menu, panel, notice, pressKey, pushRaw, removeRaw, descBox, wrap, fit } from './ui.js';
import { S, addItem, count } from './party.js';
import { ITEMS, MONSTERS, ELEM, HEROES } from './data.js';
import { drawMon, drawChar, monName } from './sprites.js';

// a window with its own update and draw, as a promise
function run(w) { return new Promise((res) => { w.done = (v) => { removeRaw(w); res(v); }; pushRaw(w); }); }
const goldPanel = () => panel(() => { windowBox(W - 132, H - 44, 128, 40); text(L('金幣', 'Gold'), W - 122, H - 38, '#f8e070'); text(String(S.gold), W - 16, H - 38, '#f8f8f8', { align: 'right' }); text(L('代幣', 'Tokens'), W - 122, H - 22, '#a0e0ff'); text(String(S.tokens || 0), W - 16, H - 22, '#f8f8f8', { align: 'right' }); });

// ---------- the forge ----------
export const RECIPES = [
  ['frostbrand', { brassgear: 2, frostcrystal: 3 }, 800], ['emberblade', { embercore: 3, starshard: 2 }, 1500],
  ['aurorarod', { frostcrystal: 3, starshard: 1 }, 900], ['cinderwand', { embercore: 3, shadowsilk: 2 }, 1500],
  ['frostbow', { frostcrystal: 3, springcoil: 2 }, 900], ['ivorybow', { mammothivory: 2, beasthide: 2 }, 800],
  ['frostlance', { frostcrystal: 3, mammothivory: 1 }, 900], ['griefscythe', { shadowsilk: 3, embercore: 2 }, 1500],
  ['mammothhide', { beasthide: 4, mammothivory: 1 }, 700], ['starmail', { starshard: 4, timesand: 2, hollowglass: 2 }, 3000],
  ['steadyring', { brassgear: 2, hollowglass: 2 }, 600], ['hasteband', { springcoil: 3, timesand: 1 }, 1000],
  ['regenring', { beasthide: 2, starshard: 2 }, 1000], ['counterbadge', { chitin: 3, brassgear: 2 }, 900],
  ['fireward', { chitin: 2, embercore: 2 }, 400], ['iceward', { chitin: 2, frostcrystal: 2 }, 400], ['voidward', { chitin: 2, shadowsilk: 2 }, 400],
  ['elixir', { timesand: 2, starshard: 1 }, 300], ['bigbomb', { brassgear: 1, embercore: 1 }, 200],
];
const canMake = ([, need, gold]) => S.gold >= gold && Object.entries(need).every(([k, n]) => count(k) >= n);
export async function forgeMenu() {
  const close = goldPanel();
  try {
    for (;;) {
      const k = await menu(RECIPES.map((r) => ({ label: ITEMS[r[0]].name, right: r[2], disabled: !canMake(r) })), {
        x: 20, y: 16, w: 250, maxRows: 9, title: L('鍛造（素材＋金幣）', 'Forge (materials + gold)'),
        drawExtra: (i) => {
          const [id, need] = RECIPES[i];
          windowBox(276, 16, 200, 30 + Object.keys(need).length * 15);
          text(L('需要：', 'Needs:'), 286, 22, '#f8e070');
          Object.entries(need).forEach(([m, n], j) => { const ok = count(m) >= n; text(fit(ITEMS[m].name, 172 - textW(`${count(m)}/${n}`)), 286, 38 + j * 15, ok ? '#f8f8f8' : '#ff8080'); text(`${count(m)}/${n}`, 466, 38 + j * 15, ok ? '#a0ffa0' : '#ff8080', { align: 'right' }); });
          descBox(ITEMS[id].desc || itemLine(ITEMS[id]), H - 96);
        },
      });
      if (k < 0) return;
      const [id, need, gold] = RECIPES[k];
      S.gold -= gold; for (const [m, n] of Object.entries(need)) addItem(m, -n);
      addItem(id); sfx('chime');
      await notice(L(`打好了「${ITEMS[id].name}」！`, `Forged ${ITEMS[id].name}!`));
    }
  } finally { close(); }
}
export function itemLine(it) {
  if (it.type === 'weapon') return `${L('攻擊', 'Attack')} +${it.atk * 2}` + Object.entries(it.bonus || {}).map(([k, v]) => `　${statWord(k)} +${v}`).join('');
  if (it.type === 'armor') return `${L('防禦', 'Defence')} +${it.def}` + Object.entries(it.bonus || {}).map(([k, v]) => `　${statWord(k)} +${v}`).join('');
  return it.desc || '';
}
const statWord = (k) => ({ hp: 'HP', mp: 'MP', pow: L('力量', 'Power'), mag: L('魔力', 'Magic'), def: L('防禦', 'Defence'), mdf: L('魔防', 'M.Def'), spd: L('速度', 'Speed') }[k] || k);

// ---------- the monster book ----------
const BOOK = () => Object.keys(MONSTERS).filter((id) => id !== 'hush' || true);
export const dexCount = () => BOOK().filter((id) => S.dex[id]).length;
export async function bestiary() {
  const ids = BOOK();
  const close = panel(() => { windowBox(4, H - 24, 200, 20); text(L(`已擊敗 ${dexCount()}／${ids.length} 種`, `Defeated ${dexCount()} / ${ids.length} kinds`), 12, H - 20, '#a0e0ff'); });
  try {
    for (;;) {
      const k = await menu(ids.map((id, i) => ({ label: `${String(i + 1).padStart(2, '0')} ${S.seen[id] || S.dex[id] ? MONSTERS[id].name : '？？？'}`, right: S.dex[id] || '', color: MONSTERS[id].boss ? '#ffd870' : null })),
        { x: 4, y: 4, w: 210, maxRows: 16, rowH: 16, title: L('怪物圖鑑', 'Monster Book'), drawExtra: (i) => dexPage(ids[i]) });
      if (k < 0) return;
    }
  } finally { close(); }
}
function dexPage(id) {
  const m = MONSTERS[id], known = S.seen[id] || S.dex[id];
  windowBox(218, 4, W - 222, H - 30);
  if (!known) { text('？？？', 230, 14, '#8088a8'); return; }
  const sp = monName(m.sprite);
  ctx.save(); ctx.beginPath(); ctx.rect(222, 8, W - 230, 120); ctx.clip();
  const sc = Math.min(1.3, 1.1 / Math.max(1, (m.scale || 1) * 0.8));
  if (m.sprite[0] === 'm') drawMon(ctx, sp, { dir: 'd', frame: Date.now() / 160, x: 300, y: 118, look: m.look, scale: sc, t: Date.now() / 1000 });
  else drawChar(ctx, sp, { dir: 'd', frame: 0, x: 300, y: 118, look: m.look, scale: sc });
  ctx.restore();
  // a long name takes two lines; the numbers follow under it
  const nl = wrap(m.name, W - 372).slice(0, 2);
  nl.forEach((l, i) => text(l, 360, 14 + i * 15, m.boss ? '#ffd870' : '#ffe8a0'));
  const st = S.dex[id] ? [`HP ${m.hp}`, `${L('攻', 'Atk')} ${m.pow}  ${L('魔', 'Mag')} ${m.mag}`, `${L('防', 'Def')} ${m.def}  ${L('魔防', 'MDf')} ${m.mdf}`, `${L('速', 'Spd')} ${m.spd}`] : [L('（打倒後才知道）', '(defeat it to learn more)')];
  st.forEach((s, i) => text(s, 360, 17 + nl.length * 15 + i * 15, '#e0e0f0'));
  if (S.dex[id]) {
    const els = (a) => a.map((e) => (ELEM[e] ? L(ELEM[e][0], ELEM[e][1]) : e)).join(' ') || '—';
    text(L('弱點：', 'Weak: ') + els(m.weak), 230, 136, '#ffb060');
    text(L('抗性：', 'Resists: ') + els(m.res), 230, 152, '#a0a8c8');
    const dr = [...(m.drop ? [m.drop] : []), ...(m.drops || [])].map(([i]) => ITEMS[i].name).join(L('、', ', ')) || '—';
    // the drop list wraps inside the page instead of running off the screen
    const dl = wrap(L('掉落：', 'Drops: ') + dr, W - 250);
    dl.forEach((l, i) => text(l, 230, 168 + i * 16, '#a0ffa0'));
    text(`EXP ${m.exp}  ${L('金', 'G')} ${m.gold}  TP ${m.tp}`, 230, 168 + dl.length * 16, '#c0c8e0');
    text(L(`打倒了 ${S.dex[id]} 次`, `Defeated ${S.dex[id]} times`), 230, 184 + dl.length * 16, '#c0c8e0');
  }
}

// ---------- the quest log ----------
const Q = (id, zh, en, start, done, hint) => ({ id, name: [zh, en], start, done, hint });
export const QUESTS = [
  Q('main1', '被偷走的音叉', 'The Stolen Fork', 'met_orrin', 'fork_back'),
  Q('main2', '靜止之年', 'The Stillness', 'bell_rung', 'beat_warden'),
  Q('main3', '墜星火山口', 'The Fallen-Star Crater', 'beat_warden', 'beat_stonehorn'),
  Q('main4', '三時之舌', 'The Three-Hour Clapper', 'beat_stonehorn', 'beat_vesper'),
  Q('main5', '寂靜之塔', 'The Silent Spire', 'spire_open', 'beat_hush'),
  Q('main6', '黃銅之鑰', 'The Brass Key', 'interval_open', 'beat_regulator', ['到時隙之間選「黃銅港」。', 'Choose Brasshaven at the Hour Between.']),
  Q('main7', '霜晶之鑰', 'The Frost Key', 'frost_open', 'beat_rimeback', ['去霜搖籃找母星冰川。', 'Find the Motherstone Glacier in Frostcradle.']),
  Q('main8', '餘燼之鑰', 'The Ember Key', 'ember_open', 'beat_grief', ['去餘燼之城登上悲鳴機關。', 'Climb the Grief Engine in Emberfall.']),
  Q('main9', '寂靜之心', 'The Heart of the Hush', 'heart_open', 'beat_unborn', ['時隙之間北邊的紅色裂縫。', 'The red rift north of the Hour Between.']),
  Q('ep_ren', '蓮：第一口鐘', 'Ren: The First Bell', 'ren_quest', 'ep_ren', ['奧林師傅要黃銅齒輪、霜晶、餘燼核心各一。', 'Master Orrin needs a Brass Gear, a Frost Crystal and an Ember Core.']),
  Q('ep_mira', '米拉：學院的秘密', "Mira: The Academy's Secret", 'mira_quest', 'ep_mira', ['黃銅港學院，卡爾德的書桌。', "Calder's desk in Brasshaven Academy."]),
  Q('ep_silas', '賽勒斯：奶奶的懷錶', "Silas: Grandmother's Watch", 'silas_quest', 'ep_silas', ['哈蒂鐘錶行。', "Hattie's Watch Shop."]),
  Q('ep_kaya', '卡雅：第一支骨笛', 'Kaya: The First Flute', 'kaya_quest', 'ep_kaya', ['霜原東北的山脊上有月鹿。', 'The Moon Elk is on the ridge north-east of the Frost Plain.']),
  Q('ep_nilo', '尼洛：小猛獁', 'Nilo: The Mammoth Calf', 'calf_quest', 'calf_saved', ['霜原西南的狼之谷。', 'Wolf Hollow, south-west of the Frost Plain.']),
  Q('ep_vesper', '薇絲珀：告別', 'Vesper: Farewell', 'has_vesper', 'ep_vesper', ['把她帶到餘燼之城。', 'Take her to Emberfall.']),
  Q('p_acorn', '時光：會記得的樹', 'Paradox: The Tree That Remembers', 'got_acorn', 'acorn_planted', ['把古橡實種在根野的時隙旁。', 'Plant the Ancient Acorn by the rift in the Rootwild.']),
  Q('p_valve', '時光：水閘', 'Paradox: The Floodgate', 'valve_known', 'valve_open', ['鑄造廠西邊的水閘。', 'The floodgate in the west of the foundry.']),
  Q('p_greyfang', '時光：灰牙的債', "Paradox: Greyfang's Debt", 'beat_greyfang', 'greyfang_debt', ['去燈河之森的營地看看灰牙。', 'Visit Greyfang at the camp in Lantern Woods.']),
  Q('fish', '釣魚大師', 'Master Angler', 'got_rod', 'fish_master', ['釣到十種……不，五種不同的魚。', 'Catch five different kinds of fish.']),
  Q('post', '未鳴之鐘', 'The Unrung Bell', 'cleared', 'beat_eternal', ['時隙之間南邊的門。', 'The door south of the Hour Between.']),
];
export async function questLog() {
  const list = QUESTS.filter((q) => S.flags[q.start]);
  if (!list.length) { await notice(L('還沒有任務。', 'No quests yet.')); return; }
  await menu(list.map((q) => ({ label: L(q.name[0], q.name[1]), right: S.flags[q.done] ? L('完成', 'Done') : '…', color: S.flags[q.done] ? '#90e0a0' : q.id.startsWith('main') ? '#ffe8a0' : '#f8f8f8' })),
    { x: 30, y: 10, w: 330, maxRows: 12, title: L('任務', 'Quests'), drawExtra: (i) => { const q = list[i]; if (q.hint && !S.flags[q.done]) descBox(L(q.hint[0], q.hint[1])); } });
}
export const paradoxCount = () => ['acorn_planted', 'valve_open', 'calf_saved', 'greyfang_debt'].filter((f) => S.flags[f]).length;

// ---------- fishing ----------
const FISH = {
  interval: [['minnow', 40, 1], ['trout', 30, 2], ['icefish', 15, 2], ['goldcarp', 10, 3], ['timefish', 5, 4]],
  ice: [['icefish', 40, 2], ['trout', 30, 2], ['minnow', 18, 1], ['goldcarp', 12, 3]],
  lake: [['minnow', 45, 1], ['trout', 35, 2], ['goldcarp', 20, 3]],
};
function pickFish(spot) { const t = FISH[spot] || FISH.lake, sum = t.reduce((a, f) => a + f[1], 0); let r = Math.random() * sum; for (const f of t) { r -= f[1]; if (r < 0) return f; } return t[0]; }
export async function fishing(spot) {
  if (!count('rod')) { await notice(L('這裡好像有魚。要是有釣竿就好了。', 'There are fish here. If only you had a rod.')); return; }
  for (;;) {
    const [id, , diff] = pickFish(spot);
    const got = await run(fishWindow(diff));
    if (got) { addItem(id); S.fish[id] = (S.fish[id] || 0) + 1; sfx('chest'); await notice(L(`釣到了「${ITEMS[id].name}」！`, `Caught a ${ITEMS[id].name}!`)); if (Object.keys(S.fish).length >= 5) S.flags.fish_master = true; }
    else { sfx('miss'); await notice(L('魚跑掉了……', 'It got away...')); }
    const k = await menu([{ label: L('再釣一次', 'Fish again') }, { label: L('收竿', 'Stop') }], { x: W - 150, y: 150, w: 130, cancel: true });
    if (k !== 0) return;
  }
}
// wait for a bite, hook it with A, then keep the fish inside your green bar until it is landed
function fishWindow(diff) {
  let phase = 'wait', t = 0, waitFor = 70 + Math.random() * 160, fish = 0.5, fv = 0, zone = 0.5, zv = 0, prog = 0.3;
  return {
    update() {
      t++;
      window.__fishing = { phase, fish, zone, prog };
      if (phase === 'wait') { if (t > 10 && input.pressed('b')) { sfx('cancel'); this.done(false); return; } if (t > waitFor) { phase = 'bite'; t = 0; sfx('switch'); } return; }
      if (phase === 'bite') { if (input.pressed('a')) { phase = 'reel'; t = 0; sfx('ok'); } else if (t > 34) this.done(false); return; }
      // the fish darts about; holding A lifts your bar, letting go lets it sink
      if (Math.random() < 0.03 * diff) fv = (Math.random() - 0.5) * 0.02 * (1 + diff * 0.6);
      fish = Math.max(0.05, Math.min(0.95, fish + fv)); if (fish <= 0.05 || fish >= 0.95) fv = -fv;
      zv += input.held('a') ? 0.0016 : -0.0014; zv *= 0.94; zone = Math.max(0.1, Math.min(0.9, zone + zv));
      const inside = Math.abs(fish - zone) < 0.13 - diff * 0.012;
      prog += inside ? 0.006 : -0.004 - diff * 0.0008;
      if (prog >= 1) this.done(true); else if (prog <= 0) this.done(false);
    },
    draw() {
      windowBox(W / 2 - 110, 60, 220, 170);
      ctx.fillStyle = '#123a5a'; ctx.fillRect(W / 2 - 100, 80, 120, 140);
      if (phase === 'wait') { text(L('等魚上鉤……', 'Waiting for a bite...'), W / 2, 66, '#c0d8f0', { align: 'center' }); const by = 150 + Math.sin(t / 15) * 2; ctx.fillStyle = '#ff4040'; ctx.fillRect(W / 2 - 42, by, 6, 6); }
      else if (phase === 'bite') { text(L('上鉤了！按 A！', 'A bite! Press A!'), W / 2, 66, '#ffe060', { align: 'center' }); ctx.fillStyle = '#ff4040'; ctx.fillRect(W / 2 - 42, 156 + (t % 4), 6, 6); text('!', W / 2 - 40, 130, '#ffe060'); }
      else {
        text(L('按住 A 把綠條抬高', 'Hold A to lift the green bar'), W / 2, 66, '#c0d8f0', { align: 'center' });
        const top = 84, hgt = 132, zy = top + (1 - zone) * hgt, fy = top + (1 - fish) * hgt, zh = (0.26 - diff * 0.024) * hgt;
        ctx.fillStyle = 'rgba(90,230,120,0.55)'; ctx.fillRect(W / 2 - 70, zy - zh / 2, 60, zh);
        ctx.fillStyle = '#ffd060'; ctx.fillRect(W / 2 - 50, fy - 4, 20, 8); ctx.fillStyle = '#202020'; ctx.fillRect(W / 2 - 34, fy - 2, 2, 2);
        bar(W / 2 + 30, 214, 60, prog * 100, 100, '#60e080');
        text(L('收線', 'Reel'), W / 2 + 30, 196, '#f8f8f8');
      }
    },
  };
}

// ---------- the Gearwork Fair ----------
export async function strengthBell() {
  const close = goldPanel();
  try {
    for (;;) {
      const k = await menu([{ label: L('敲一次（50 金幣）', 'Swing once (50 gold)'), disabled: S.gold < 50 }, { label: L('不玩了', 'Not now') }], { x: W - 210, y: 120, w: 200 });
      if (k !== 0) return;
      S.gold -= 50;
      const v = await run(powerWindow());
      const tk = v >= 96 ? 12 : v >= 85 ? 6 : v >= 60 ? 3 : v >= 30 ? 1 : 0;
      if (v >= 96) { sfx('toll'); } else sfx(tk ? 'ok' : 'buzz');
      S.tokens = (S.tokens || 0) + tk;
      await notice(v >= 96 ? L(`噹——！鐘響了！得到 ${tk} 枚代幣！`, `DONG! The bell rings! ${tk} tokens!`) : L(`力量 ${v}。得到 ${tk} 枚代幣。`, `Power ${v}. ${tk} tokens.`));
    }
  } finally { close(); }
}
function powerWindow() {
  let t = 0, v = 0, dir = 1, stopped = -1, puck = 0;
  return {
    update() {
      t++;
      if (stopped < 0) { v += dir * 2.6; if (v >= 100) { v = 100; dir = -1; } if (v <= 0) { v = 0; dir = 1; } if (t > 10 && input.pressed('a')) { stopped = Math.round(v); sfx('hit'); } return; }
      puck = Math.min(stopped, puck + 3); if (puck >= stopped && ++t > 40 + stopped) this.done(stopped);
    },
    draw() {
      windowBox(W / 2 - 120, 50, 240, 200);
      text(L('看準時機按 A！', 'Press A at the right moment!'), W / 2, 56, '#ffe8a0', { align: 'center' });
      // the tower with the bell on top and the puck climbing it
      ctx.fillStyle = '#5a3a20'; ctx.fillRect(W / 2 + 40, 90, 14, 140); ctx.fillStyle = '#f0c860'; ctx.beginPath(); ctx.arc(W / 2 + 47, 86, 10, Math.PI, 0); ctx.fill();
      const py = 226 - (stopped < 0 ? 0 : puck) * 1.36; ctx.fillStyle = '#e04040'; ctx.fillRect(W / 2 + 41, py, 12, 6);
      ctx.fillStyle = '#20202c'; ctx.fillRect(W / 2 - 90, 220, 110, 10);
      const gr = ctx.createLinearGradient(W / 2 - 90, 0, W / 2 + 20, 0); gr.addColorStop(0, '#40c060'); gr.addColorStop(0.8, '#f0d040'); gr.addColorStop(1, '#ff4040');
      ctx.fillStyle = gr; ctx.fillRect(W / 2 - 90, 220, 110 * (stopped < 0 ? v : stopped) / 100, 10);
      text(String(stopped < 0 ? Math.round(v) : stopped), W / 2 - 35, 196, '#f8f8f8', { align: 'center' });
    },
  };
}
const RACERS = [['beetle_fire', ['火花號', 'Sparky'], 2], ['beetle_ice', ['冰晶號', 'Frosty'], 3], ['beetle_poison', ['毒蕈號', 'Mossy'], 4], ['beetle_black', ['黑鐵號', 'Ironback'], 6]];
export async function beetleRace() {
  const close = goldPanel();
  try {
    for (;;) {
      const k = await menu([...RACERS.map((r) => ({ label: L(r[1][0], r[1][1]), right: `×${r[2]}` })), { label: L('不玩了', 'Not now') }], { x: W - 220, y: 60, w: 200, title: L('押哪一隻？（倍率）', 'Bet on which? (odds)') });
      if (k < 0 || k >= RACERS.length) return;
      const b = await menu([5, 10, 20].map((n) => ({ label: L(`${n} 枚代幣`, `${n} tokens`), disabled: (S.tokens || 0) < n })), { x: W - 200, y: 140, w: 170, title: L('押多少？', 'How much?') });
      if (b < 0) continue;
      const bet = [5, 10, 20][b];
      S.tokens -= bet;
      const win = await run(raceWindow(k));
      if (win === k) { const n = bet * RACERS[k][2]; S.tokens += n; sfx('level'); await notice(L(`贏了！得到 ${n} 枚代幣！`, `You win! ${n} tokens!`)); }
      else { sfx('buzz'); await notice(L(`「${RACERS[win][1][0]}」贏了……`, `${RACERS[win][1][1]} won...`)); }
    }
  } finally { close(); }
}
function raceWindow(mine) {
  const pos = RACERS.map(() => 0), go = RACERS.map((r) => 1 / Math.sqrt(r[2])); let t = 0, winner = -1;
  return {
    update() {
      t++;
      if (t < 60) return;
      if (winner < 0) {
        RACERS.forEach((r, i) => { pos[i] += Math.max(0, (Math.random() * 0.9 + go[i] * 0.55) * 1.25 + (Math.random() < 0.02 ? 6 : 0)); if (pos[i] >= 300 && winner < 0) winner = i; });
        if (winner >= 0) { t = 0; sfx('chime'); }
      } else if (t > 70) this.done(winner);
    },
    draw() {
      windowBox(20, 40, W - 40, 200);
      text(t < 60 && winner < 0 ? L('預備……', 'Ready...') : winner >= 0 ? L(`「${RACERS[winner][1][0]}」第一！`, `${RACERS[winner][1][1]} wins!`) : L('跑啊！', 'Go!'), W / 2, 46, '#ffe8a0', { align: 'center' });
      ctx.fillStyle = '#c0a060'; ctx.fillRect(40, 70, 400, 160); ctx.fillStyle = '#f8f8f8'; ctx.fillRect(400, 70, 4, 160);
      RACERS.forEach((r, i) => {
        const y = 100 + i * 38; ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(40, y + 6, 400, 2);
        drawMon(ctx, r[0], { dir: 'r', frame: t / 5 + i, x: 70 + pos[i], y: y + 12, scale: 1, t: t / 60 });
        text(L(r[1][0], r[1][1]), 46, y - 10, i === mine ? '#ffe060' : '#3a2810');
      });
    },
  };
}
export const PRIZES = [['hiether', 20], ['megatonic', 15], ['phoenix2', 50], ['critlens', 120], ['luckycoin', 200], ['scholarpin', 260], ['bigbomb', 40]];
export async function prizeBooth() {
  const close = goldPanel();
  try {
    for (;;) {
      const k = await menu(PRIZES.map(([id, n]) => ({ label: ITEMS[id].name, right: n, disabled: (S.tokens || 0) < n })), { x: 40, y: 20, w: 300, title: L('用代幣換獎品', 'Trade tokens for prizes'), drawExtra: (i) => descBox(ITEMS[PRIZES[i][0]].desc || itemLine(ITEMS[PRIZES[i][0]])) });
      if (k < 0) return;
      S.tokens -= PRIZES[k][1]; addItem(PRIZES[k][0]); sfx('chest');
    }
  } finally { close(); }
}
const FISH_TOKENS = { minnow: 1, trout: 3, icefish: 4, goldcarp: 12, timefish: 40 };
export async function fishTrade() {
  const close = goldPanel();
  try {
    for (;;) {
      const ids = Object.keys(FISH_TOKENS).filter((id) => count(id));
      if (!ids.length) { await notice(L('沒有魚可以換。', 'No fish to trade.')); return; }
      const k = await menu(ids.map((id) => ({ label: `${ITEMS[id].name} ×${count(id)}`, right: L(`${FISH_TOKENS[id]} 枚`, `${FISH_TOKENS[id]} tk`) })), { x: 40, y: 40, w: 300, title: L('一條魚換代幣', 'One fish for tokens') });
      if (k < 0) return;
      addItem(ids[k], -1); S.tokens = (S.tokens || 0) + FISH_TOKENS[ids[k]]; sfx('ok');
    }
  } finally { close(); }
}
export { HEROES };
