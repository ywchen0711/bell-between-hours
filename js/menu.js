// The field menu: items, techniques, equipment, who fights, status, saving and language.
import { W, H, text, textW, windowBox, bar, ctx } from './gfx.js';
import { menu, panel, notice, pressKey, ask, wrap, statusTags, drawTags } from './ui.js';
import { bestiary, questLog } from './systems.js';
import { S, stats, techsOf, nameOf, addItem, count, member, save, party } from './party.js';
import { ITEMS, TECHS, HEROES, LEARN, expFor } from './data.js';
import { L, LANG, setLang } from './i18n.js';
import { sfx } from './audio.js';
import { onSave, refreshParty } from './field.js';
import { drawChar } from './sprites.js';
import { MAPS, mapName } from './maps.js';

function goldPanel() {
  return panel(() => { windowBox(W - 132, H - 60, 128, 56); text(L('金幣', 'Gold'), W - 122, H - 52, '#f8e070'); text(String(S.gold), W - 16, H - 52, '#f8f8f8', { align: 'right' }); text(mapName(MAPS[S.map]).slice(0, 12), W - 122, H - 32, '#a0a8c8'); });
}
function partyPanel() {
  return panel(() => {
    windowBox(4, 4, 300, H - 8);
    const many = S.members.length > 4;
    S.members.forEach((m, i) => {
      const s = stats(m), act = S.active.includes(m.id);
      if (!many) {
        const y = 12 + i * 74;
        ctx.fillStyle = act ? 'rgba(255,220,120,0.08)' : 'rgba(0,0,0,0.2)'; ctx.fillRect(10, y - 2, 288, 70);
        drawChar(ctx, HEROES[m.id].sprite, { x: 36, y: y + 62, dir: 'd' });
        text(nameOf(m), 66, y + 2, act ? '#ffe8a0' : '#a0a0b8');
        text(`Lv ${m.lv}`, 150, y + 2);
        text(act ? L('出戰', 'Active') : L('待命', 'Reserve'), 290, y + 2, act ? '#90e0a0' : '#8088a0', { align: 'right' });
        text(`HP ${m.hp}/${s.maxhp}`, 66, y + 20); text(`MP ${m.mp}/${s.maxmp}`, 186, y + 20, '#a8c8ff');
        bar(66, y + 38, 110, m.hp, s.maxhp, '#60e080'); bar(186, y + 38, 100, m.mp, s.maxmp, '#60a0ff');
        text(`TP ${m.tp}`, 66, y + 46, '#c0c0d8');
        if (m.hp > 0) drawTags(statusTags(m.status), 78 + textW(`TP ${m.tp}`), y + 46, 290 - 78 - textW(`TP ${m.tp}`));
        return;
      }
      // six friends: two columns of three
      const x = 10 + (i % 2) * 146, y = 10 + Math.floor(i / 2) * 102;
      ctx.fillStyle = act ? 'rgba(255,220,120,0.08)' : 'rgba(0,0,0,0.2)'; ctx.fillRect(x, y, 142, 98);
      drawChar(ctx, HEROES[m.id].sprite, { x: x + 20, y: y + 64, dir: 'd' });
      text(nameOf(m), x + 42, y + 4, act ? '#ffe8a0' : '#a0a0b8');
      text(`Lv ${m.lv}`, x + 42, y + 20);
      text(act ? L('出戰', 'Active') : L('待命', 'Reserve'), x + 138, y + 20, act ? '#90e0a0' : '#8088a0', { align: 'right' });
      text(`HP ${m.hp}`, x + 42, y + 38); bar(x + 42, y + 54, 94, m.hp, s.maxhp, '#60e080');
      text(`MP ${m.mp}`, x + 42, y + 62, '#a8c8ff'); bar(x + 42, y + 78, 94, m.mp, s.maxmp, '#60a0ff');
      text(`TP ${m.tp}`, x + 6, y + 80, '#c0c0d8');
      if (m.hp > 0) drawTags(statusTags(m.status), x + 14 + textW(`TP ${m.tp}`), y + 80, 124 - textW(`TP ${m.tp}`));
    });
  });
}
export async function fieldMenu() {
  const close = partyPanel(), closeG = goldPanel();
  try {
    for (;;) {
      const items = [L('道具', 'Items'), L('技', 'Techniques'), L('裝備', 'Equip'), L('隊伍', 'Party'), L('狀態', 'Status'), { label: L('存檔', 'Save'), disabled: !onSave() }, 'Language/語言', L('關閉', 'Close'), L('怪物圖鑑', 'Monster Book'), L('任務', 'Quests')];
      const order = [0, 1, 2, 3, 4, 8, 9, 5, 6, 7];
      const kk = await menu(order.map((i) => items[i]).map((x) => (typeof x === 'string' ? { label: x } : x)), { x: W - 132, y: 4, w: 128, maxRows: 10 });
      const k = kk < 0 ? -1 : order[kk];
      if (k < 0 || k === 7) return;
      if (k === 8) await bestiary();
      if (k === 9) await questLog();
      if (k === 0) await itemMenu();
      if (k === 1) await techMenu();
      if (k === 2) await equipMenu();
      if (k === 3) await partyMenu();
      if (k === 4) await statusMenu();
      if (k === 5) { if (save()) { sfx('save'); await notice(L('記錄好了。', 'Saved.')); } else await notice(L('無法存檔。', 'Could not save.')); }
      if (k === 6) setLang(LANG === 'en' ? 'zh' : 'en');
    }
  } finally { close(); closeG(); }
}
async function pickMember(title, list = S.members) {
  const k = await menu(list.map((m) => ({ label: nameOf(m), right: `${m.hp}/${stats(m).maxhp}` })), { x: W - 200, y: 60, w: 190, title });
  return k < 0 ? null : list[k];
}
async function itemMenu() {
  for (;;) {
    const ids = Object.keys(S.inv).filter((id) => ITEMS[id]);
    if (!ids.length) { await notice(L('什麼都沒有。', 'Nothing.')); return; }
    const k = await menu(ids.map((id) => ({ label: ITEMS[id].name, right: ITEMS[id].type === 'key' ? '' : count(id), color: ITEMS[id].type === 'key' ? '#ffe8a0' : null })), { x: 150, y: 30, w: 230, maxRows: 10, title: L('道具', 'Items'), drawExtra: (i) => desc(ITEMS[ids[i]].desc) });
    if (k < 0) return;
    const it = ITEMS[ids[k]];
    if (it.type !== 'use' || it.battle) { sfx('buzz'); continue; }
    if (it.full) { for (const m of S.members) { const s = stats(m); m.hp = s.maxhp; m.mp = s.maxmp; } addItem(ids[k], -1); sfx('heal'); continue; }
    const m = await pickMember(L('給誰用？', 'On whom?'));
    if (!m) continue;
    const s = stats(m);
    if (it.revive ? m.hp > 0 : m.hp <= 0) { sfx('buzz'); continue; }
    if (it.cure) { delete m.status.poison; delete m.status.slow; }
    if (it.revive) m.hp = Math.round(s.maxhp * it.revive);
    if (it.heal) m.hp = Math.min(s.maxhp, m.hp + it.heal);
    if (it.mp) m.mp = Math.min(s.maxmp, m.mp + it.mp);
    addItem(ids[k], -1); sfx('heal');
  }
}
function desc(s) { if (!s) return; windowBox(150, H - 40, W - 154, 36); text(s.length > 40 ? s.slice(0, 40) : s, 160, H - 31); }
async function techMenu() {
  const m = await pickMember(L('誰的技？', 'Whose techniques?'));
  if (!m) return;
  for (;;) {
    const all = LEARN[m.id], known = techsOf(m);
    const k = await menu(all.map((id) => ({ label: known.includes(id) ? TECHS[id].name : `？？？（TP ${TECHS[id].tp}）`, right: known.includes(id) ? TECHS[id].mp : '', disabled: !known.includes(id) || TECHS[id].kind !== 'heal' })), { x: 150, y: 30, w: 230, title: `${nameOf(m)}　TP ${m.tp}`, drawExtra: (i) => known.includes(all[i]) && desc(TECHS[all[i]].desc) });
    if (k < 0) return;
    const t = TECHS[all[k]];
    if (m.mp < t.mp || m.hp <= 0) { sfx('buzz'); continue; }
    const amount = Math.round(stats(m).mag * t.pow * 1.5 + 20);
    if (t.area === 'allies') { for (const q of S.members) { if (q.hp <= 0 && t.revive) q.hp = 1; if (q.hp > 0) { q.hp = Math.min(stats(q).maxhp, q.hp + amount); if (t.cure) q.status = {}; } } }
    else { const q = await pickMember(L('治療誰？', 'Heal whom?')); if (!q) continue; if (q.hp <= 0 && !t.revive) { sfx('buzz'); continue; } q.hp = q.hp <= 0 ? Math.round(stats(q).maxhp * 0.3) : Math.min(stats(q).maxhp, q.hp + amount); }
    m.mp -= t.mp; sfx('heal');
  }
}
async function equipMenu() {
  const m = await pickMember(L('誰的裝備？', 'Whose equipment?'));
  if (!m) return;
  for (;;) {
    const slots = ['weapon', 'armor', 'acc'], names = [L('武器', 'Weapon'), L('防具', 'Armour'), L('飾品', 'Accessory')];
    const s = stats(m);
    const k = await menu(slots.map((sl, i) => ({ label: names[i], right: m.equip[sl] ? ITEMS[m.equip[sl]].name : '—' })), { x: 150, y: 30, w: 300, title: `${nameOf(m)}　${L('攻', 'Atk')} ${s.atk}  ${L('防', 'Def')} ${s.def}  ${L('魔', 'Mag')} ${s.mag}` });
    if (k < 0) return;
    const sl = slots[k];
    const opts = Object.keys(S.inv).filter((id) => ITEMS[id] && ITEMS[id].type === sl && (sl !== 'weapon' || ITEMS[id].for === HEROES[m.id].weapon));
    const list = [...opts, ...(sl === 'acc' && m.equip.acc ? [null] : [])];
    if (!list.length) { sfx('buzz'); continue; }
    const j = await menu(list.map((id) => ({ label: id ? ITEMS[id].name : L('（卸下）', '(remove)'), right: id ? count(id) : '' })), { x: 170, y: 90, w: 260, maxRows: 8, drawExtra: (i) => { const id = list[i]; if (!id) return; const old = m.equip[sl]; m.equip[sl] = id; const n = stats(m); m.equip[sl] = old; desc(`${L('攻', 'Atk')} ${s.atk}→${n.atk}  ${L('防', 'Def')} ${s.def}→${n.def}  ${L('魔', 'Mag')} ${s.mag}→${n.mag}  ${L('速', 'Spd')} ${s.spd}→${n.spd}`); if (sl === 'acc' && ITEMS[id].desc) { windowBox(150, H - 76, W - 154, 34); text(ITEMS[id].desc.slice(0, 40), 160, H - 67, '#ffe8a0'); } } });
    if (j < 0) continue;
    const id = list[j];
    if (m.equip[sl]) addItem(m.equip[sl], 1);
    m.equip[sl] = id;
    if (id) addItem(id, -1);
    const n = stats(m); m.hp = Math.min(m.hp, n.maxhp); m.mp = Math.min(m.mp, n.maxmp);
    sfx('ok');
  }
}
async function partyMenu() {
  if (S.members.length < 2) { await notice(L('現在只有你一個人。', "It's just you for now.")); return; }
  for (;;) {
    const k = await menu(S.members.map((m) => ({ label: nameOf(m), right: S.active.includes(m.id) ? L('出戰', 'Active') : L('待命', 'Reserve') })), { x: W - 200, y: 60, w: 190, title: L('選人換出戰／待命', 'Toggle active / reserve') });
    if (k < 0) break;
    const id = S.members[k].id;
    if (S.active.includes(id)) { if (S.active.length > 1) S.active = S.active.filter((x) => x !== id); else sfx('buzz'); }
    else if (S.active.length < 3) S.active.push(id);
    else { sfx('buzz'); await notice(L('最多三人出戰。先讓一位待命。', 'Three at most. Put someone in reserve first.')); }
  }
  // the leader is whoever is first; keep the order the menu shows
  S.active = S.members.map((m) => m.id).filter((id) => S.active.includes(id));
  refreshParty();
}
async function statusMenu() {
  const m = await pickMember(L('看誰的狀態？', 'Whose status?'));
  if (!m) return;
  const s = stats(m);
  const close = panel(() => {
    windowBox(20, 20, W - 40, H - 40);
    drawChar(ctx, HEROES[m.id].sprite, { x: 60, y: 110, dir: 'd', scale: 1.5 });
    text(nameOf(m), 110, 34, '#ffe8a0'); text(`Lv ${m.lv}`, 200, 34);
    if (m.hp > 0) drawTags(statusTags(m.status), 212 + textW(`Lv ${m.lv}`), 34, W - 252 - textW(`Lv ${m.lv}`));
    text(`EXP ${m.exp}　${L('下一級', 'Next')} ${expFor(m.lv + 1) - m.exp}　TP ${m.tp}`, 110, 52, '#c0c8e0');
    const rows = [['HP', `${m.hp}/${s.maxhp}`], ['MP', `${m.mp}/${s.maxmp}`], [L('攻擊', 'Attack'), s.atk], [L('魔力', 'Magic'), s.mag], [L('防禦', 'Defence'), s.def], [L('魔防', 'M.Def'), s.mdf], [L('速度', 'Speed'), s.spd]];
    rows.forEach(([a, b], i) => { text(a, 110, 76 + i * 18, '#a0a8c8'); text(String(b), 260, 76 + i * 18, '#f8f8f8', { align: 'right' }); });
    ['weapon', 'armor', 'acc'].forEach((sl, i) => text(m.equip[sl] ? ITEMS[m.equip[sl]].name : '—', 290, 76 + i * 18));
    wrap(L('技：', 'Techniques: ') + techsOf(m).map((t) => TECHS[t].name).join(L('、', ', ')), W - 80).slice(0, 4).forEach((ln, i) => text(ln, 40, 210 + i * 15, '#c0e0c0'));
  });
  await pressKey();
  close();
}
// buying and selling
export async function shopMenu(list) {
  const closeG = goldPanel();
  try {
    for (;;) {
      const k = await menu([{ label: L('買', 'Buy') }, { label: L('賣', 'Sell') }, { label: L('離開', 'Leave') }], { x: W - 132, y: 60, w: 120 });
      if (k < 0 || k === 2) return;
      if (k === 0) for (;;) {
        const j = await menu(list.map((id) => ({ label: ITEMS[id].name, right: ITEMS[id].price, disabled: ITEMS[id].price > S.gold })), { x: 40, y: 20, w: 300, maxRows: 10, title: L('要買什麼？', 'What will you buy?'), drawExtra: (i) => shopDesc(list[i]) });
        if (j < 0) break;
        const id = list[j];
        S.gold -= ITEMS[id].price; addItem(id, 1); sfx('chest');
      }
      if (k === 1) for (;;) {
        const ids = Object.keys(S.inv).filter((id) => ITEMS[id] && ITEMS[id].type !== 'key' && ITEMS[id].price > 0);
        if (!ids.length) break;
        const j = await menu(ids.map((id) => ({ label: ITEMS[id].name, right: Math.floor(ITEMS[id].price / 2) })), { x: 40, y: 20, w: 300, maxRows: 10, title: L('要賣什麼？', 'What will you sell?') });
        if (j < 0) break;
        S.gold += Math.floor(ITEMS[ids[j]].price / 2); addItem(ids[j], -1); sfx('ok');
      }
    }
  } finally { closeG(); }
}
function shopDesc(id) {
  const it = ITEMS[id];
  let s = it.desc || '';
  if (it.type === 'weapon') s = `${L('攻擊', 'Attack')} +${it.atk * 2}　${L('給', 'For')} ${party().concat(S.members).filter((m, i, a) => a.indexOf(m) === i && HEROES[m.id].weapon === it.for).map(nameOf).join(L('、', ', ')) || L('（還沒有人能用）', '(no one yet)')}`;
  if (it.type === 'armor') s = `${L('防禦', 'Defence')} +${it.def}` + (it.bonus && it.bonus.mdf ? `　${L('魔防', 'M.Def')} +${it.bonus.mdf}` : '') + (it.bonus && it.bonus.hp ? `　HP +${it.bonus.hp}` : '');
  windowBox(40, H - 40, W - 44, 36); text(s, 50, H - 31);
}
export { ask, member };
