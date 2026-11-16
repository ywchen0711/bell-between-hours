// The battle orders menu: the mode, double speed, and each friend's list of orders (pick a condition and an
// action, switch an order off, move it, delete it, use a ready-made set, copy a friend's). Reached from the
// field menu and from the Orders command in battle.
import { ctx, W, H, text, textW, windowBox } from './gfx.js?v=8';
import { menu, notice, wrap, fit, pushRaw, removeRaw } from './ui.js?v=8';
import { input } from './input.js?v=8';
import { sfx } from './audio.js?v=8';
import { L } from './i18n.js?v=8';
import { S, nameOf, techsOf } from './party.js?v=8';
import { TECHS, COMBOS } from './data.js?v=8';
import { T, rulesOf, maxSlots, SLOT_STEPS, MODES, modeName, modeDesc, COND, ACT, ACT_ORDER, GROUPS, GROUP_COL, PRESETS, presetRules, suggested, condName, condDesc, actName, actDesc, kindReady, techChoices, comboChoices } from './tactics.js?v=8';

const onOff = (v) => (v ? L('開', 'On') : L('關', 'Off'));
const GREY = '#8088a8';
// a window of explanation along the bottom (or anywhere): paragraphs as [text, colour]
function infoBox(paras, x = 4, y = 212, w = W - 8, h = H - 216) {
  windowBox(x, y, w, h);
  let yy = y + 6;
  for (const [s, col] of paras) {
    for (const ln of wrap(s, w - 20)) { if (yy > y + h - 18) return; text(ln, x + 10, yy, col || '#f8f8f8'); yy += 15; }
    yy += 3;
  }
}
const ruleLines = (h, max = 99) => {
  const rs = rulesOf(h).slice(0, max);
  if (!rs.length) return [[L('（沒有作戰：只會普通攻擊）', '(no orders: plain attacks only)'), GREY]];
  return rs.map((r, i) => [`${i + 1}${r.on ? '' : L('（關）', ' (off)')} ${condName(r.c)} → ${actName(r.a)}`, !r.on ? GREY : kindReady(h, r.a) ? '#f8f8f8' : '#c8a080']);
};

// ---------- the front page ----------
export async function tacticsMenu() {
  let at = 0;
  for (;;) {
    const t = T(), n = maxSlots();
    const rows = [{ label: L('戰鬥模式', 'Battle mode'), right: modeName(t.mode), rcolor: t.mode === 'manual' ? null : '#ffe8a0' }, { label: L('兩倍速', 'Double speed'), right: onOff(t.fast) },
      ...S.members.map((m) => ({ label: nameOf(m), right: `${t.per[m.id] === 'auto' ? L('作戰', 'Auto') : L('手動', 'Hand')} ${rulesOf(m).length}/${n}` })),
      { label: L('說明', 'How it works'), color: '#a0e0ff' }];
    const k = await menu(rows, { x: 4, y: 4, w: 222, start: at, maxRows: 12, title: L('作戰', 'Tactics'), drawExtra: (i) => frontInfo(i, rows.length) });
    if (k < 0) return;
    at = k;
    if (k === 0) { t.mode = MODES[(MODES.indexOf(t.mode) + 1) % MODES.length]; sfx('ok'); continue; }
    if (k === 1) { t.fast = !t.fast; sfx('ok'); continue; }
    if (k === rows.length - 1) { await helpPages(); continue; }
    await heroTactics(S.members[k - 2]);
  }
}
function frontInfo(i, nRows) {
  const t = T(), x = 230, w = W - 234;
  if (i === 0) return infoBox([[L('戰鬥模式', 'Battle mode'), '#f8e070'], ...MODES.flatMap((md) => [[`${md === t.mode ? '▶ ' : '　'}${modeName(md)}`, md === t.mode ? '#ffe8a0' : '#c0c8e0'], [modeDesc(md), '#d0d4e8']]), [L('戰鬥中按 T（手把 X、觸控的「作戰」鈕）隨時切換。', 'In battle press T (pad X, or the touch button) to switch any time.'), '#a0e0ff']], x, 4, w, H - 8);
  if (i === 1) return infoBox([[L('兩倍速', 'Double speed'), '#f8e070'], [L('戰鬥的動作再快一倍，手動模式也有效。選指令的時候戰鬥會等你。', 'Battles play twice as fast again, in any mode. The battle still waits while you choose.')], [L('戰鬥中按 F（手把 Select）也能切換。', 'Press F (pad Select) in battle to switch it too.'), '#a0e0ff']], x, 4, w, H - 8);
  if (i === nRows - 1) return infoBox([[L('說明', 'How it works'), '#f8e070'], [L('作戰是一串「條件 → 行動」。行動條滿的時候從第一條往下看，第一條條件成立、又做得到的就做；都不合就普通攻擊。', 'Orders are a list of CONDITION → ACTION. When the gauge fills, the list is read from the top: the first order that holds and can be done is done; if none, a plain attack.')], [L('按 A 看完整的說明。', 'Press A for the full guide.'), '#a0e0ff']], x, 4, w, H - 8);
  const m = S.members[i - 2]; if (!m) return;
  infoBox([[nameOf(m), '#f8e070'], [L('混合模式時：', 'In Mixed mode: ') + (T().per[m.id] === 'auto' ? L('照作戰', 'by orders') : L('由你操作', 'by hand')), '#c0c8e0'], ...ruleLines(m, maxSlots())], x, 4, w, H - 8);
}

// ---------- one friend's orders ----------
export async function heroTactics(h, inBattle = false) {
  let at = 1;
  for (;;) {
    const t = T(), rules = rulesOf(h), n = maxSlots();
    const rows = [{ label: L('混合模式時', 'In Mixed mode'), right: t.per[h.id] === 'auto' ? L('照作戰', 'By orders') : L('由你操作', 'By hand') }];
    for (let i = 0; i < n; i++) {
      const r = rules[i];
      if (r) rows.push({ label: `${i + 1} ${r.on ? '●' : '○'} ${condName(r.c)}`, right: '→ ' + actName(r.a), color: r.on ? null : GREY, rcolor: !r.on ? GREY : kindReady(h, r.a) ? '#ffe8a0' : '#c8a080' });
      else if (i === rules.length) rows.push({ label: `${i + 1}   ＋ ${L('新增作戰', 'Add an order')}`, color: '#a0e0ff' });
      else rows.push({ label: `${i + 1}   －`, disabled: true });
    }
    rows.push({ label: L('套用預設作戰…', 'Use a preset…'), right: '▶' }, { label: L('從夥伴複製…', 'Copy from a friend…'), right: '▶' });
    const k = await menu(rows, { x: 4, y: 4, w: W - 8, start: Math.min(at, rows.length - 1), maxRows: 11, title: `${L(`${nameOf(h)}的作戰`, `${nameOf(h)}'s orders`)}　${rules.length}/${n}${inBattle ? L('　（戰鬥暫停中）', '  (battle paused)') : ''}`, drawExtra: (i) => heroInfo(h, i, n) });
    if (k < 0) return;
    at = k;
    if (k === 0) { t.per[h.id] = t.per[h.id] === 'auto' ? 'manual' : 'auto'; sfx('ok'); continue; }
    if (k === n + 1) { await presetMenu(h); continue; }
    if (k === n + 2) { await copyMenu(h); continue; }
    const i = k - 1;
    if (!rules[i]) { const c = await pickCond(h, null); if (!c) continue; const a = await pickAction(h, null); if (!a) continue; rules.push({ c, a, on: true }); sfx('ok'); at = rules.length; continue; }
    at = 1 + await ruleMenu(h, i);
  }
}
function heroInfo(h, i, n) {
  const rules = rulesOf(h);
  if (i === 0) return infoBox([[L('混合模式時', 'In Mixed mode'), '#f8e070'], [L('戰鬥模式是「混合」時，這位夥伴由你下指令，還是照作戰行動。', 'When the battle mode is Mixed, whether you choose for this friend or they follow their orders.')], [modeDesc('mix'), '#c0c8e0']]);
  if (i === n + 1) return infoBox([[L('預設作戰', 'Presets'), '#f8e070'], [L('一次換成一套現成的作戰，之後還能再改。★ 是適合這位夥伴的。', 'Swap in a ready-made set in one press, then change it as you like. ★ suits this friend.')]]);
  if (i === n + 2) return infoBox([[L('從夥伴複製', 'Copy from a friend'), '#f8e070'], [L('把另一位夥伴的整套作戰複製過來。', "Copy another friend's whole list of orders.")]]);
  const r = rules[i - 1];
  if (r) return infoBox(ruleParas(h, r));
  const steps = SLOT_STEPS().map(([s, v]) => `${s} ${v}`).join(L('、', ', '));
  infoBox([[L('新增作戰', 'Add an order'), '#f8e070'], [L('先選「條件」再選「行動」。條件決定目標：「夥伴 HP < 50%」配「回復一人」，就是治那位夥伴。', 'Pick a condition, then an action. The condition picks the target: "Ally HP < 50%" with "Heal one" heals that friend.')], [L(`作戰欄現在 ${n} 格：`, `${n} slots now: `) + steps, '#c0c8e0']]);
}
function ruleParas(h, r) {
  const ready = kindReady(h, r.a);
  return [[`${condName(r.c)} → ${actName(r.a)}`, '#f8e070'], [`${L('條件', 'If')}（${L(...GROUPS[COND[r.c].g])}）${condDesc(r.c)}`, GROUP_COL[COND[r.c].g]], [`${L('行動', 'Do')}：${actDesc(r.a)}`, '#ffe8a0'],
    [!r.on ? L('關著：戰鬥中會跳過。', 'Off: skipped in battle.') : ready ? L('現在做得到（MP、道具不夠時會跳到下一條）。', 'Possible now (skipped for the next one when MP or items run short).') : L('現在還做不到（還沒學會、或沒有那種道具）：會跳過這一條。', 'Not possible yet (not learned, or none in the bag): this order is skipped.'), !r.on ? GREY : ready ? '#90e0a0' : '#c8a080']];
}
// one order: change its condition or action, switch it off, move it, delete it; returns where it ended up
async function ruleMenu(h, i) {
  let at = 0;
  for (;;) {
    const rules = rulesOf(h), r = rules[i];
    if (!r) return Math.max(0, Math.min(i, rules.length - 1));
    const opts = [{ label: L('條件', 'Condition'), right: '▶' }, { label: L('行動', 'Action'), right: '▶' }, { label: L('開／關', 'On / off'), right: onOff(r.on) },
      { label: L('往上移', 'Move up'), disabled: i === 0 }, { label: L('往下移', 'Move down'), disabled: i >= rules.length - 1 }, { label: L('刪除', 'Delete'), color: '#ff9a9a' }];
    const k = await menu(opts, { x: W - 190, y: 40, w: 170, start: at, title: L(`作戰 ${i + 1}`, `Order ${i + 1}`), drawExtra: () => infoBox(ruleParas(h, r)) });
    if (k < 0) return i;
    at = k;
    if (k === 0) { const c = await pickCond(h, r.c); if (c) { r.c = c; sfx('ok'); } }
    if (k === 1) { const a = await pickAction(h, r.a); if (a) { r.a = a; sfx('ok'); } }
    if (k === 2) { r.on = !r.on; }
    if (k === 3 && i > 0) { [rules[i - 1], rules[i]] = [rules[i], rules[i - 1]]; i--; at = 3; }
    if (k === 4 && i < rules.length - 1) { [rules[i + 1], rules[i]] = [rules[i], rules[i + 1]]; i++; at = 4; }
    if (k === 5) { rules.splice(i, 1); sfx('cancel'); return Math.max(0, Math.min(i, rules.length - 1)); }
  }
}
const TARGET_NOTE = () => ({ ally: L('目標是那位夥伴：回復、治異常、復活會用在他身上。', 'The target is that friend: heals, cures and revives go to them.'), self: L('目標是自己。攻擊類的行動打隊長的目標或最近的敵人。', "The target is you. Attacks go to the leader's target or the nearest enemy."), foe: L('目標是那個敵人：攻擊、偷竊會對著牠。', 'The target is that enemy: attacks and steals go at it.'), field: L('不指定目標：行動自己挑合適的對象。', 'No target: the action picks a fitting one itself.') });
async function pickCond(h, cur) {
  const ids = Object.keys(COND);
  const k = await menu(ids.map((id) => ({ label: condName(id), right: L(...GROUPS[COND[id].g]) + (id === cur ? ' ✔' : ''), rcolor: GROUP_COL[COND[id].g] })), { x: 4, y: 4, w: 300, start: Math.max(0, ids.indexOf(cur)), maxRows: 11, title: L('條件', 'Condition'),
    drawExtra: (i) => infoBox([[condName(ids[i]), '#f8e070'], [condDesc(ids[i])], [TARGET_NOTE()[COND[ids[i]].g], GROUP_COL[COND[ids[i]].g]]]) });
  return k < 0 ? null : ids[k];
}
async function pickAction(h, cur) {
  const known = techsOf(h);
  const ids = [...ACT_ORDER, ...techChoices(h).map((id) => 'tech:' + id), ...comboChoices(h).map((id) => 'combo:' + id)];
  const right = (a) => {
    if (a === cur) return '✔';
    if (a.startsWith('tech:')) { const t = TECHS[a.slice(5)]; return known.includes(a.slice(5)) ? `MP ${t.mp}` : L('未學', 'not yet'); }
    if (a.startsWith('combo:')) return COMBOS[a.slice(6)].who.map((w) => (w === '*' ? '＊' : nameOf({ id: w })[0])).join('');
    return '';
  };
  const k = await menu(ids.map((a) => ({ label: actName(a), right: right(a), color: kindReady(h, a) ? (a.startsWith('combo:') ? '#ffd870' : a.startsWith('tech:') ? '#c0e0ff' : null) : GREY })), { x: 4, y: 4, w: 300, start: Math.max(0, ids.indexOf(cur)), maxRows: 11, title: L('行動', 'Action'),
    drawExtra: (i) => infoBox([[actName(ids[i]), '#f8e070'], [actDesc(ids[i])], kindReady(h, ids[i]) ? [L('現在做得到。', 'Possible now.'), '#90e0a0'] : [L('現在還做不到（沒學會或沒有道具）：放著也沒關係，做得到時才會用。', 'Not possible yet (not learned, or none in the bag): it can stay; it is used once it can be done.'), '#c8a080']]) });
  return k < 0 ? null : ids[k];
}
async function presetMenu(h) {
  const ks = Object.keys(PRESETS), good = new Set(suggested(h.id));
  const k = await menu(ks.map((p) => ({ label: L(...PRESETS[p].n) + (good.has(p) ? ' ★' : ''), color: good.has(p) ? '#ffe8a0' : null })), { x: 4, y: 4, w: 222, start: Math.max(0, ks.indexOf(suggested(h.id)[0])), title: L('預設作戰', 'Presets'),
    drawExtra: (i) => infoBox([[L(...PRESETS[ks[i]].n), '#f8e070'], [L(...PRESETS[ks[i]].d), '#d0d4e8'], ...PRESETS[ks[i]].rules.map((r, j) => [`${j + 1} ${condName(r.c)} → ${actName(r.a)}`, kindReady(h, r.a) ? '#f8f8f8' : '#c8a080']), [L('會取代目前的作戰。', 'Replaces the current orders.'), GREY]], 230, 4, W - 234, H - 8) });
  if (k < 0) return;
  T().rules[h.id] = presetRules(ks[k]).slice(0, maxSlots()); sfx('ok');
  await notice(`${nameOf(h)}${L('：', ': ')}${L(...PRESETS[ks[k]].n)}`, 50);
}
async function copyMenu(h) {
  const others = S.members.filter((o) => o !== h);
  if (!others.length) { sfx('buzz'); await notice(L('現在只有你一個人。', "It's just you for now."), 50); return; }
  const k = await menu(others.map((o) => ({ label: nameOf(o), right: `${rulesOf(o).length}` })), { x: 4, y: 4, w: 222, title: L('從誰複製？', 'Copy from whom?'),
    drawExtra: (i) => infoBox([[nameOf(others[i]), '#f8e070'], ...ruleLines(others[i]), [L(`會取代${nameOf(h)}目前的作戰。`, `Replaces ${nameOf(h)}'s current orders.`), GREY]], 230, 4, W - 234, H - 8) });
  if (k < 0) return;
  T().rules[h.id] = rulesOf(others[k]).slice(0, maxSlots()).map((r) => ({ ...r })); sfx('ok');
  await notice(L(`複製了${nameOf(others[k])}的作戰。`, `Copied ${nameOf(others[k])}'s orders.`), 50);
}

// ---------- the guide: a few pages, left and right to turn ----------
function guide() {
  const acts = ACT_ORDER.map((a) => `・${L(...ACT[a].n)}：${L(...ACT[a].d)}`);
  const conds = Object.keys(COND).map((c) => `・${condName(c)}`);
  return [
    [L('作戰是什麼', 'What orders are'), L('每位夥伴都有一串「條件 → 行動」的作戰。行動條滿了的時候，從第一條往下看：第一條條件成立、而且現在做得到（技學會了、MP 夠、袋子裡有那個道具）的就做。一條都不合就普通攻擊。', 'Each friend has a list of orders, CONDITION → ACTION. When their gauge fills, the list is read from the top: the first order whose condition holds and that can be done now (technique learned, MP enough, the item in the bag) is carried out. If none fits, a plain attack.'),
      L('條件也決定目標：「夥伴 HP < 50%」→「回復一人」會治那位夥伴；「敵人有冰甲」→「破解機關」會用火打那隻敵人。', 'The condition also picks the target: "Ally HP < 50%" → "Heal one" heals that friend; "Enemy has ice armour" → "Break the trick" hits that enemy with fire.')],
    [L('三種模式', 'Three modes'), `${modeName('manual')}：${modeDesc('manual')}`, `${modeName('auto')}：${modeDesc('auto')}`, `${modeName('mix')}：${modeDesc('mix')}`,
      L('戰鬥中：T 鍵（手把 X）切換模式，F 鍵（手把 Select）兩倍速，B 收回操作。指令選單裡也有「作戰」。觸控時左上角有按鈕。', 'In battle: T (pad X) switches the mode, F (pad Select) double speed, B takes control back. The command menu has Orders too. On touch screens there are buttons at the top left.')],
    [L('合體技', 'Combo techniques'), L('「合體技」或指定的★合體技，要所有參加的夥伴行動條都滿才放得出來。參加的夥伴也照作戰行動時，先滿的人會等一下下（頭上顯示「等夥伴」），其他人也跟著等；等太久就放棄，改照下一條作戰。', 'A combo needs every partner\'s gauge full. If the partners follow orders too, whoever is ready first waits a little ("Waiting" shows over them) and the partners wait with them; if it takes too long they give up and use their next order.'),
      L('由你操作的夥伴不會被拉去合體：想合體時從他的「技」選單出招就好。', 'A friend you steer by hand is never pulled into a combo: start it from their Tech menu instead.')],
    [L('知道的事', 'What orders know'), L('作戰只用你也看得到的事：弱點要怪物圖鑑裡有（打倒過一次），或是這場打出了「弱點！」；HP 就是選目標時看到的數字；偷竊成功一次、或發現身上沒東西，那隻就不算「還沒被偷過」。', 'Orders only use what you could see: a weakness once the monster book has it (beaten once) or a hit showed "Weak!"; HP as the target window shows it; once a steal works, or an enemy turns out to carry nothing, it no longer counts as "not stolen from".'),
      L('作戰欄一開始 6 格，打倒寂靜的影子、拿到每一把鑰匙時各多 1 格（最多 10 格）。', 'You start with 6 slots; one more after the Hush shadow falls and with each key (up to 10).')],
    [L('條件一覽', 'Conditions'), conds.join('　')],
    [L('行動一覽', 'Actions'), ...acts, L('另外也能指定任何一招學會的技或★合體技。', 'Any learned technique or ★combo can be named too.')],
  ];
}
function helpPages() {
  return new Promise((res) => {
    const pages = guide().map(([title, ...ps]) => {
      const lines = [];
      for (const p of ps) { lines.push(...wrap(p, W - 48)); lines.push(''); }
      // a long page continues on the next one
      const per = 16, out = [];
      for (let i = 0; i < lines.length; i += per) out.push({ title, lines: lines.slice(i, i + per) });
      return out;
    }).flat();
    let pg = 0;
    const w = {
      update() {
        if (input.repeat('right') || input.repeat('down') || input.pressed('a')) { if (pg < pages.length - 1) { pg++; sfx('cursor'); } else if (input.pressed('a')) { sfx('ok'); done(); } }
        else if (input.repeat('left') || input.repeat('up')) { if (pg > 0) { pg--; sfx('cursor'); } }
        else if (input.pressed('b')) { sfx('cancel'); done(); }
      },
      draw() {
        const p = pages[pg];
        windowBox(4, 4, W - 8, H - 8);
        text(p.title, 16, 12, '#f8e070');
        text(`${pg + 1}/${pages.length}`, W - 16, 12, '#a0a8c8', { align: 'right' });
        p.lines.forEach((l, i) => text(l, 16, 32 + i * 16, l.startsWith('・') ? '#d0d4e8' : '#f8f8f8'));
        text(L('← → 翻頁　B 關閉', '← → turn the page   B close'), W / 2, H - 22, '#a0a8c8', { align: 'center' });
      },
    };
    const done = () => { removeRaw(w); res(); };
    pushRaw(w);
  });
}
void ctx; void textW; void fit;
