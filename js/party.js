// The party, the inventory, gold, story flags and saving.
import { HEROES, LEARN, TECHS, ITEMS, expFor } from './data.js';
import { L } from './i18n.js';

export const S = {
  members: [], active: [], inv: {}, gold: 0, flags: {}, map: 'workshop', x: 0, y: 0, dir: 'd', time: 0, beaten: {}, opened: {},
  dex: {}, seen: {}, tokens: 0, fish: {}, carry: null,
};
export function makeHero(id, lv = 1) {
  const h = { id, lv, exp: expFor(lv), tp: 0, equip: { ...HEROES[id].equip }, status: {} };
  const st = stats(h); h.hp = st.maxhp; h.mp = st.maxmp;
  return h;
}
const base = (h, k) => Math.floor(HEROES[h.id].base[k] + HEROES[h.id].grow[k] * (h.lv - 1));
export function stats(h) {
  const s = { maxhp: base(h, 'hp'), maxmp: base(h, 'mp'), pow: base(h, 'pow'), mag: base(h, 'mag'), def: base(h, 'def'), mdf: base(h, 'mdf'), spd: base(h, 'spd') };
  let watk = 0, adef = 0;
  for (const slot of ['weapon', 'armor', 'acc']) {
    const it = ITEMS[h.equip[slot]];
    if (!it) continue;
    watk += it.atk || 0; adef += it.def || 0;
    for (const [k, v] of Object.entries(it.bonus || {})) { if (k === 'hp') s.maxhp += v; else s[k] += v; }
  }
  s.atk = s.pow + watk * 2;
  s.def += adef;
  return s;
}
export const nameOf = (h) => HEROES[h.id].name;
// a technique is known once enough TP is earned, or (for side-story techniques) once its story flag is set
export const techsOf = (h) => LEARN[h.id].filter((t) => (TECHS[t].flag ? !!S.flags[TECHS[t].flag] : h.tp >= TECHS[t].tp));
// what an accessory does besides its numbers
export const fxOf = (h) => { const it = ITEMS[h.equip.acc]; return new Set((it && it.fx) || []); };
export const hasFx = (h, k) => fxOf(h).has(k);
export const knows = (h, t) => !!h && techsOf(h).includes(t);
export const member = (id) => S.members.find((m) => m.id === id);
export const party = () => S.active.map(member).filter(Boolean);
export const alive = () => party().filter((m) => m.hp > 0);

export function addMember(id, lv) {
  if (member(id)) return member(id);
  const avg = S.members.length ? Math.round(S.members.reduce((a, m) => a + m.lv, 0) / S.members.length) : 1;
  const h = makeHero(id, lv || avg);
  // a newcomer has picked up as much technique as the others
  h.tp = S.members.length ? Math.round(S.members.reduce((a, m) => a + m.tp, 0) / S.members.length) : 0;
  // New Game+: a friend comes back as strong as they were
  const c = S.carry && S.carry.members && S.carry.members[id];
  if (c) { Object.assign(h, { lv: Math.max(h.lv, c.lv), exp: Math.max(h.exp, c.exp), tp: Math.max(h.tp, c.tp) }); if (c.equip) h.equip = { ...c.equip }; const st = stats(h); h.hp = st.maxhp; h.mp = st.maxmp; }
  S.members.push(h);
  if (S.active.length < 3) S.active.push(id);
  S.flags['has_' + id] = true;
  return h;
}
// lines telling what was gained
export function gain(h, exp, tp) {
  const out = [];
  if (h.hp <= 0) return out;
  const had = techsOf(h);
  h.tp += tp;
  h.exp += exp;
  while (h.exp >= expFor(h.lv + 1) && h.lv < 60) {
    const b = stats(h); h.lv++; const a = stats(h);
    h.hp += a.maxhp - b.maxhp; h.mp += a.maxmp - b.maxmp;
    out.push(L(`${nameOf(h)}升到 ${h.lv} 級！`, `${nameOf(h)} reached level ${h.lv}!`));
  }
  for (const t of techsOf(h)) if (!had.includes(t)) out.push(L(`${nameOf(h)}學會了「${TECHS[t].name}」！`, `${nameOf(h)} learned ${TECHS[t].name}!`));
  return out;
}
export function addItem(id, n = 1) { S.inv[id] = (S.inv[id] || 0) + n; if (S.inv[id] <= 0) delete S.inv[id]; }
export const count = (id) => S.inv[id] || 0;
export function fullHeal() { for (const m of S.members) { const s = stats(m); m.hp = s.maxhp; m.mp = s.maxmp; m.status = {}; } }

const KEY = 'bellhours-save';
export function save(slot = 0) { try { localStorage.setItem(KEY + slot, JSON.stringify({ ...S, savedAt: Date.now() })); return true; } catch (e) { return false; } }
export function saveInfo(slot = 0) { try { return JSON.parse(localStorage.getItem(KEY + slot)); } catch (e) { return null; } }
export function load(slot = 0) {
  const d = saveInfo(slot);
  if (!d) return false;
  Object.assign(S, { members: [], active: [], inv: {}, flags: {}, beaten: {}, opened: {}, dex: {}, seen: {}, tokens: 0, fish: {}, carry: null }, d);
  return true;
}
export function reset(carry = null) {
  Object.assign(S, { members: [], active: [], inv: { tonic: 3 }, gold: 60, flags: {}, map: 'workshop', x: 5 * 32 + 16, y: 5 * 32 + 16, dir: 'd', time: 0, beaten: {}, opened: {}, dex: {}, seen: {}, tokens: 0, fish: {}, carry });
  if (carry) {
    // New Game+: keep the gold, the bag (but not the story's keys) and the monster book
    S.gold = carry.gold; S.inv = { ...carry.inv }; S.dex = { ...(carry.dex || {}) }; S.seen = { ...(carry.seen || {}) }; S.flags.ngplus = (carry.round || 1);
    for (const k of Object.keys(S.inv)) if (!ITEMS[k] || ITEMS[k].type === 'key') delete S.inv[k];
  }
  addMember('ren', 1);
}
// what New Game+ carries over from a finished game
export function carryOver() {
  const members = {};
  for (const m of S.members) members[m.id] = { lv: m.lv, exp: m.exp, tp: m.tp, equip: { ...m.equip } };
  const inv = { ...S.inv };
  for (const m of S.members) for (const sl of ['weapon', 'armor', 'acc']) if (m.equip[sl] && m.id !== 'ren') { /* worn things travel with their owner */ }
  return { members, inv, gold: S.gold, dex: S.dex, seen: S.seen, round: (S.flags.ngplus || 0) + 1 };
}
// the endings seen on this device, kept apart from the saves
const EKEY = 'bellhours-endings';
export function endingsSeen() { try { return JSON.parse(localStorage.getItem(EKEY)) || {}; } catch (e) { return {}; } }
export function markEnding(id) { const e = endingsSeen(); e[id] = (e[id] || 0) + 1; try { localStorage.setItem(EKEY, JSON.stringify(e)); } catch (x) { /* private mode */ } }
