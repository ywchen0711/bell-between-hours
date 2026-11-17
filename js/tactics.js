// Battle orders. Each friend keeps a short list of orders, CONDITION -> ACTION, read from the top whenever
// their gauge fills: the first order whose condition holds and that can be done right now is carried out;
// with none, a plain attack. Orders only know what the player could know: a weakness once the monster book
// has it (after one has been beaten) or once a hit has shown it, HP as the target window shows it, and
// whether a steal has already worked.
import { TECHS, COMBOS, ITEMS, LEARN, HEROES } from './data.js?v=9';
import { S, stats, techsOf, knows, nameOf, member } from './party.js?v=9';
import { L } from './i18n.js?v=9';

// ---------- the save ----------
export const MODES = ['manual', 'auto', 'mix'];
export const modeName = (k) => ({ manual: L('手動', 'Manual'), auto: L('作戰', 'Orders'), mix: L('混合', 'Mixed') }[k] || '?');
export const modeDesc = (k) => ({
  manual: L('每個人都由你下指令（原本的玩法）。', 'You choose every command (the usual way).'),
  auto: L('全員照自己的作戰行動。戰鬥中按 B 就從下一位起改回手動。', 'Everyone acts by their own orders. In battle, B takes control back from the next turn.'),
  mix: L('照每個人的設定：例如隊長由你操作，其他人照作戰。', 'As set for each friend: e.g. you steer the leader, the others follow orders.'),
}[k] || '');
// more order slots open up as the story goes on
const SLOT_FLAGS = ['beat_hush', 'beat_regulator', 'beat_rimeback', 'beat_grief'];
export function maxSlots() { const f = S.flags || {}; return 6 + SLOT_FLAGS.filter((k) => f[k]).length; }
export const SLOT_STEPS = () => [[L('一開始', 'At the start'), 6], [L('打倒寂靜的影子之後', 'After the Hush shadow falls'), 7], [L('拿到第一把鑰匙', 'The first key'), 8], [L('拿到第二把鑰匙', 'The second key'), 9], [L('拿到第三把鑰匙', 'The third key'), 10]];
// the orders part of the save, made the first time it is needed; an older save starts in Manual
export function T() {
  if (!S.tactics || typeof S.tactics !== 'object') S.tactics = { mode: 'manual', fast: false, per: {}, rules: {} };
  const t = S.tactics;
  if (!MODES.includes(t.mode)) t.mode = 'manual';
  t.per = t.per || {}; t.rules = t.rules || {};
  S.members.forEach((m) => {
    if (!Array.isArray(t.rules[m.id])) t.rules[m.id] = presetRules(suggested(m.id)[0]);
    const rs = t.rules[m.id];
    for (let k = rs.length - 1; k >= 0; k--) if (!rs[k] || !COND[rs[k].c] || !actionKnown(rs[k].a)) rs.splice(k, 1);
    // the leader is steered by hand in Mixed mode unless the player says otherwise
    if (t.per[m.id] !== 'manual' && t.per[m.id] !== 'auto') t.per[m.id] = m.id === 'ren' ? 'manual' : 'auto';
  });
  return t;
}
export const rulesOf = (h) => T().rules[h.id] || [];
// does this friend act by orders in the mode now set?
export function isAuto(h) { const t = T(); return t.mode === 'auto' || (t.mode === 'mix' && t.per[h.id] === 'auto'); }
export function cycleMode() { const t = T(); t.mode = MODES[(MODES.indexOf(t.mode) + 1) % MODES.length]; return t.mode; }

// ---------- what the player can know about a monster ----------
const shifts = (f) => f.m.mech === 'shift';
export function knownWeak(f) { const seen = (f.seenWeak || []).filter((e) => f.weak.includes(e)); return !shifts(f) && S.dex[f.mid] ? f.weak.slice() : seen; }
export function knownRes(f) { return !shifts(f) && S.dex[f.mid] ? f.res.slice() : (f.seenRes || []).filter((e) => f.res.includes(e)); }
// how a known weakness or resistance changes a blow (unknown ones count as plain)
export function knownMul(f, el) { if (!el) return 1; if (knownWeak(f).includes(el)) return 1.5; if (knownRes(f).includes(el)) return 0.5; return 1; }

// ---------- conditions ----------
const ratio = (q) => q.h.hp / Math.max(1, stats(q.h).maxhp);
const mpRatio = (q) => { const m = stats(q.h).maxmp; return m ? q.h.mp / m : 1; };
const fRatio = (f) => f.hp / Math.max(1, f.maxhp);
const AIL = ['poison', 'slow'];
const ailing = (q) => AIL.some((k) => q.h.status[k]);
const live = (x) => x.heroes.filter((q) => q.h.hp > 0);
const low = (arr, key) => arr.reduce((b, v) => (b === null || key(v) < key(b) ? v : b), null);
const allyIf = (x, f) => { const q = low(live(x).filter(f), ratio); return q ? { kind: 'ally', t: q } : null; };
const foeIf = (x, f, key) => { const c = x.foes.filter(f); if (!c.length) return null; return { kind: 'foe', t: key ? low(c, key) : c.includes(x.leaderTarget) ? x.leaderTarget : nearest(x, c) }; };
const nearest = (x, c) => low(c, (f) => Math.hypot(f.x - x.me.x, f.y - x.me.y));
const lacking = (x, k) => live(x).some((q) => !q.h.status[k]);
const NONE = { kind: 'none' };
// g: who it is about (colours the list); n: name; d: what it means
export const COND = {
  ally_hp70: { g: 'ally', n: ['夥伴 HP < 70%', 'Ally HP < 70%'], d: ['HP 低於七成的夥伴（最低的那位）。', 'The friend lowest on HP, if under 70%.'], test: (x) => allyIf(x, (q) => ratio(q) < 0.7) },
  ally_hp50: { g: 'ally', n: ['夥伴 HP < 50%', 'Ally HP < 50%'], d: ['HP 低於一半的夥伴。', 'A friend under half HP.'], test: (x) => allyIf(x, (q) => ratio(q) < 0.5) },
  ally_hp30: { g: 'ally', n: ['夥伴 HP < 30%', 'Ally HP < 30%'], d: ['HP 低於三成、很危險的夥伴。', 'A friend in danger, under 30% HP.'], test: (x) => allyIf(x, (q) => ratio(q) < 0.3) },
  party_hurt: { g: 'ally', n: ['兩人以上 HP < 60%', '2+ allies HP < 60%'], d: ['至少兩位夥伴的 HP 低於六成：適合全體回復。', 'At least two friends under 60% HP: time to heal everyone.'], test: (x) => (live(x).filter((q) => ratio(q) < 0.6).length >= 2 ? { kind: 'allies' } : null) },
  ally_ko: { g: 'ally', n: ['有夥伴倒下', "Ally KO'd"], d: ['倒下的夥伴。', 'A fallen friend.'], test: (x) => { const q = x.heroes.find((p) => p.h.hp <= 0); return q ? { kind: 'dead', t: q } : null; } },
  ally_poison: { g: 'ally', n: ['夥伴中毒', 'Ally poisoned'], d: ['中毒的夥伴：每次輪到他都會掉血。', 'A poisoned friend: they lose HP every turn.'], test: (x) => allyIf(x, (q) => !!q.h.status.poison) },
  ally_slow: { g: 'ally', n: ['夥伴遲緩', 'Ally slowed'], d: ['遲緩、行動條變慢的夥伴。', 'A slowed friend whose gauge fills slowly.'], test: (x) => allyIf(x, (q) => !!q.h.status.slow) },
  ally_ail: { g: 'ally', n: ['夥伴中毒或遲緩', 'Ally poisoned or slow'], d: ['中毒或遲緩的夥伴（藥和暖陽這類技能治得好的）。', 'A friend poisoned or slowed (what medicine and cures can mend).'], test: (x) => allyIf(x, ailing) },
  self_hp50: { g: 'self', n: ['自己 HP < 50%', 'Self HP < 50%'], d: ['自己的 HP 低於一半。', 'Your own HP is under half.'], test: (x) => (ratio(x.me) < 0.5 ? { kind: 'self', t: x.me } : null) },
  self_hp25: { g: 'self', n: ['自己 HP < 25%', 'Self HP < 25%'], d: ['自己的 HP 低於四分之一。', 'Your own HP is under a quarter.'], test: (x) => (ratio(x.me) < 0.25 ? { kind: 'self', t: x.me } : null) },
  self_mp30: { g: 'self', n: ['自己 MP < 30%', 'Self MP < 30%'], d: ['自己的 MP 低於三成。', 'Your own MP is under 30%.'], test: (x) => (stats(x.me.h).maxmp && mpRatio(x.me) < 0.3 ? { kind: 'self', t: x.me } : null) },
  foe_unstolen: { g: 'foe', n: ['敵人還沒被偷過', 'Enemy not stolen from'], d: ['還沒偷成功、也還不知道身上沒東西的敵人。', 'An enemy no one has stolen from yet (and not known to carry nothing).'], test: (x) => foeIf(x, (f) => !f.stolen && !f.noLoot) },
  foe_weak: { g: 'foe', n: ['敵人的弱點已知', 'Enemy weakness known'], d: ['怪物圖鑑記著弱點（打倒過一次），或這場被打出「弱點！」的敵人。', 'An enemy whose weakness is in the monster book (beaten once) or was shown by a "Weak!" hit.'], test: (x) => foeIf(x, (f) => knownWeak(f).length > 0) },
  foe_lowhp: { g: 'foe', n: ['HP 最低的敵人', 'Enemy with lowest HP'], d: ['剩下 HP 比例最低、最接近倒下的敵人。', 'The enemy with the smallest share of HP left: closest to falling.'], test: (x) => foeIf(x, () => true, fRatio) },
  foe_highhp: { g: 'foe', n: ['HP 最高的敵人', 'Enemy with highest HP'], d: ['剩下 HP 最多的敵人。', 'The enemy with the most HP left.'], test: (x) => foeIf(x, () => true, (f) => -f.hp) },
  foe_dying: { g: 'foe', n: ['敵人 HP < 25%', 'Enemy HP < 25%'], d: ['快倒下的敵人：普通攻擊就夠，別浪費 MP。', 'An enemy nearly down: a plain attack will do, save the MP.'], test: (x) => foeIf(x, (f) => fRatio(f) < 0.25, fRatio) },
  foe_boss: { g: 'foe', n: ['敵人是頭目', 'Enemy is a boss'], d: ['頭目級的敵人。', 'A boss enemy.'], test: (x) => foeIf(x, (f) => !!f.m.boss) },
  foe_windup: { g: 'foe', n: ['敵人在上發條', 'Enemy winding up'], d: ['「嘎啦嘎啦……」正在蓄力、下一招會打全體的敵人。用雷打斷，或防禦、張盾。', '"Clack clack...": an enemy winding up a blow at everyone. Thunder stops it; or guard and shield.'], test: (x) => foeIf(x, (f) => !!f.charging) },
  foe_iced: { g: 'foe', n: ['敵人有冰甲', 'Enemy has ice armour'], d: ['披著冰甲、物理攻擊打不痛的敵人。用火融化它。', 'An enemy in ice armour that turns blows aside. Fire melts it.'], test: (x) => foeIf(x, (f) => !!f.status.iced) },
  foe_noslow: { g: 'foe', n: ['敵人沒有遲緩', 'Enemy not slowed'], d: ['還沒有被變慢的敵人。', 'An enemy not slowed yet.'], test: (x) => foeIf(x, (f) => !f.status.slow) },
  foe_powered: { g: 'foe', n: ['敵人力量／防禦上升', 'Enemy powered up'], d: ['長嚎、硬化之後變強的敵人：趁早打倒。', 'An enemy that howled or hardened itself: bring it down soon.'], test: (x) => foeIf(x, (f) => Object.values(f.buff || {}).some((v) => v > 1)) },
  leader_target: { g: 'foe', n: ['隊長的目標', "Leader's target"], d: ['隊伍第一位最近一次打的敵人。', 'The enemy the party leader last struck.'], test: (x) => (x.leaderTarget && x.foes.includes(x.leaderTarget) ? { kind: 'foe', t: x.leaderTarget } : null) },
  foe_any: { g: 'foe', n: ['任何敵人', 'Any enemy'], d: ['只要還有敵人就成立；目標是隊長的目標或最近的敵人。', "Holds while any enemy stands; the target is the leader's or the nearest."], test: (x) => foeIf(x, () => true) },
  foes2: { g: 'field', n: ['敵人 2 隻以上', '2+ enemies'], d: ['場上的敵人有兩隻以上。', 'Two or more enemies stand.'], test: (x) => (x.foes.length >= 2 ? NONE : null) },
  foes3: { g: 'field', n: ['敵人 3 隻以上', '3+ enemies'], d: ['場上的敵人有三隻以上。', 'Three or more enemies stand.'], test: (x) => (x.foes.length >= 3 ? NONE : null) },
  foe_alone: { g: 'field', n: ['只剩一隻敵人', 'One enemy left'], d: ['場上只剩一隻敵人。', 'Only one enemy is left.'], test: (x) => (x.foes.length === 1 ? { kind: 'foe', t: x.foes[0] } : null) },
  first: { g: 'field', n: ['自己的第一回合', 'My first turn'], d: ['這場戰鬥裡第一次輪到自己。', 'Your first turn in this battle.'], test: (x) => (x.first ? NONE : null) },
  no_haste: { g: 'field', n: ['有夥伴沒有加速', 'Someone lacks Haste'], d: ['還有夥伴沒有「加速」。', 'A friend is without Haste.'], test: (x) => (lacking(x, 'haste') ? NONE : null) },
  no_barrier: { g: 'field', n: ['有夥伴沒有護盾', 'Someone lacks a Shield'], d: ['還有夥伴沒有「護盾」。', 'A friend is without a Shield.'], test: (x) => (lacking(x, 'barrier') ? NONE : null) },
  no_regen: { g: 'field', n: ['有夥伴沒有再生', 'Someone lacks Regen'], d: ['還有夥伴沒有「再生」。', 'A friend is without Regen.'], test: (x) => (lacking(x, 'regen') ? NONE : null) },
  always: { g: 'field', n: ['任何時候', 'Always'], d: ['一定成立。放在最後當作預設的行動。', 'Always holds. Put it last as the default.'], test: () => NONE },
};
export const condName = (id) => (COND[id] ? L(...COND[id].n) : '?');
export const condDesc = (id) => (COND[id] ? L(...COND[id].d) : '');
export const GROUPS = { ally: ['夥伴', 'Ally'], self: ['自己', 'Self'], foe: ['敵人', 'Enemy'], field: ['戰場', 'Field'] };
export const GROUP_COL = { ally: '#90e0a0', self: '#80c8ff', foe: '#ff9a9a', field: '#ffe080' };

// ---------- what techniques do ----------
const TK = (id) => TECHS[id];
const isDmg = (t) => (t.kind === 'phys' || t.kind === 'mag' || (t.kind === 'debuff' && t.pow)) && t.area !== 'ally' && t.area !== 'allies';
const isHealOne = (t) => t.kind === 'heal' && t.area === 'ally';
const isHealAll = (t) => t.kind === 'heal' && t.area === 'allies';
const isRevive = (t) => t.kind === 'heal' && !!t.revive;
const isCure = (t) => !!t.cure;
const fxOfT = (t) => Object.keys(t.fx || {});
const isBuff = (t) => (t.kind === 'support' || t.kind === 'heal') && fxOfT(t).some((k) => k === 'haste' || k === 'barrier' || k === 'regen');
const isSlow = (t) => !!(t.fx && t.fx.slow) && t.area !== 'allies';
// the techniques this friend knows and has the MP for
const own = (x, pred) => x.techs.filter((id) => pred(TK(id)) && x.me.h.mp >= x.mp(x.me, TK(id).mp));
// a plain attack, as the battle counts it
const ATTACK = (x) => x.attack;
// where to aim a technique that reaches more than one: wherever it catches the most (the condition's foe first)
function aim(t, r, x, ok = () => true) {
  const fs = x.foes.filter(ok);
  if (r && r.kind === 'foe') return ok(r.t) ? r.t : null;
  if (!fs.length) return null;
  if (t.area === 'one' || !t.area) return fs.includes(x.leaderTarget) ? x.leaderTarget : nearest(x, fs);
  if (t.area === 'all') return fs.includes(x.leaderTarget) ? x.leaderTarget : fs[0];
  let best = null, bn = -1;
  for (const f of fs) { const n = x.reach(t, x.me, f).length; if (n > bn) { bn = n; best = f; } }
  return best;
}
// expected damage of a technique fired at f, over everything it reaches
const total = (x, t, f, who = [x.me]) => (t.area === 'all' ? x.foes : x.reach(t, who.length > 1 ? x.centre(who) : x.me, f)).reduce((a, g) => a + x.est(who, g, t) * (t.hits || 1), 0);
const hurt = (x, cut = 0.9) => live(x).filter((q) => ratio(q) < cut);
// the friend a healing or helping move goes to
function allyFor(r, x, f = () => true) {
  if (r && (r.kind === 'ally' || r.kind === 'self')) return r.t.h.hp > 0 && f(r.t) ? r.t : null;
  if (r && r.kind === 'dead') return null;
  return low(live(x).filter(f), ratio);
}
// can a technique be used sensibly now, and at whom? (null: not now)
function techTarget(id, r, x) {
  const t = TK(id);
  if (t.kind === 'steal') return aim(t, r, x, (f) => !f.stolen && !f.noLoot);
  if (t.kind === 'heal') {
    if (t.area === 'ally') {
      if (t.revive && (r && r.kind === 'dead' ? true : !r || r.kind === 'none' || r.kind === 'allies')) { const d = r && r.kind === 'dead' ? r.t : x.heroes.find((q) => q.h.hp <= 0); if (d) return d; if (r && r.kind === 'dead') return null; }
      return allyFor(r, x, (q) => ratio(q) < 0.9);
    }
    const need = hurt(x, 0.8).length >= (r && r.kind === 'allies' ? 1 : 2) || (r && (r.kind === 'ally' || r.kind === 'self') && ratio(r.t) < 0.8) || (t.revive && x.heroes.some((q) => q.h.hp <= 0)) || (t.cure && live(x).some(ailing)) || (t.fx && fxOfT(t).some((k) => lacking(x, k)) && hurt(x, 0.95).length);
    return need ? live(x)[0] : null;
  }
  if (t.kind === 'support') return fxOfT(t).some((k) => lacking(x, k)) ? live(x)[0] : null;
  if (isSlow(t) && !t.pow) return aim(t, r, x, (f) => !f.status.slow);
  return aim(t, r, x);
}
// the best of some damaging techniques against what the condition points at
function bestHit(ids, r, x, need = 0) {
  let best = null, bv = need;
  for (const id of ids) {
    const t = TK(id), f = aim(t, r, x); if (!f) continue;
    const v = total(x, t, f);
    if (v > bv) { bv = v; best = { type: 'tech', id, target: f }; }
  }
  return best;
}
const healAmt = (x, t) => x.healAmt([x.me], t);
// items that can be used in battle (fish and the rare full restores are left alone)
const bag = (pred) => Object.keys(S.inv).filter((k) => ITEMS[k] && ITEMS[k].type === 'use' && (S.inv[k] || 0) > 0 && !ITEMS[k].fish && !ITEMS[k].full && !ITEMS[k].smoke && pred(ITEMS[k]));

// ---------- actions ----------
// each: name, what it does, and run(condition result, context) -> a battle command, or null when it cannot be done now
export const ACT = {
  attack: { n: ['攻擊', 'Attack'], d: ['普通攻擊。條件指定敵人就打那個，否則打隊長的目標或最近的敵人。', "A plain attack: the condition's enemy, else the leader's target or the nearest."], run: (r, x) => { const f = r && r.kind === 'foe' ? r.t : aim({ area: 'one' }, null, x); return f ? { type: 'attack', target: f } : null; } },
  guard: { n: ['防禦', 'Guard'], d: ['擺好架勢，到下次輪到自己之前受到的傷害減半。', 'Brace: half damage until your next turn.'], run: () => ({ type: 'guard' }) },
  steal: { n: ['偷竊', 'Steal'], d: ['用偷竊類的技（順手牽羊），對還沒偷過的敵人下手。', 'A stealing technique (Pilfer) on an enemy not yet stolen from.'], run: (r, x) => { for (const id of own(x, (t) => t.kind === 'steal')) { const f = techTarget(id, r, x); if (f) return { type: 'tech', id, target: f }; } return null; } },
  strong: { n: ['最強的一擊', 'Strongest hit'], d: ['對目標最痛的技（算進已知的弱點和抗性）；比普通攻擊強不到哪裡就普通攻擊。', 'The technique that hurts the target most (known weaknesses count); a plain attack if no technique beats it by much.'], run: (r, x) => {
    const f = r && r.kind === 'foe' ? r.t : aim({ area: 'one' }, null, x); if (!f) return null;
    const base = x.est([x.me], f, ATTACK(x)) * 1.2;
    let best = null, bv = base;
    for (const id of own(x, isDmg)) { const t = TK(id); const v = x.est([x.me], f, t) * (t.hits || 1); if (v > bv) { bv = v; best = { type: 'tech', id, target: f }; } }
    return best || { type: 'attack', target: f }; } },
  area: { n: ['打一群', 'Hit many'], d: ['用能打中兩隻以上敵人的技（全體、直線、範圍），挑總傷害最高的。', 'A technique that catches two or more enemies (all, line, area): the one doing most in total.'], run: (r, x) => {
    let best = null, bv = 0;
    for (const id of own(x, (t) => isDmg(t) && t.area !== 'one')) { const t = TK(id), f = aim(t, r && r.kind === 'foe' ? null : r, x); if (!f) continue; const n = t.area === 'all' ? x.foes.length : x.reach(t, x.me, f).length; if (n < 2) continue; const v = total(x, t, f); if (v > bv) { bv = v; best = { type: 'tech', id, target: f }; } }
    return best; } },
  exploit: { n: ['打弱點', 'Hit a weakness'], d: ['對弱點已知的敵人，用那個屬性最痛的技；米拉的火杖打怕火的敵人時就普通攻擊。', "On an enemy with a known weakness, the strongest technique of that element; Mira's staff attack when it is fire it fears."], run: (r, x) => {
    const weak = (f) => knownWeak(f).length > 0;
    const f = r && r.kind === 'foe' ? (weak(r.t) ? r.t : null) : x.foes.find((g) => g === x.leaderTarget && weak(g)) || x.foes.find(weak);
    if (!f) return null;
    const ids = own(x, (t) => isDmg(t) && knownWeak(f).includes(t.el));
    const hit = bestHit(ids, { kind: 'foe', t: f }, x);
    if (hit) return hit;
    return ATTACK(x).el && knownWeak(f).includes(ATTACK(x).el) ? { type: 'attack', target: f } : null; } },
  breaktrick: { n: ['破解機關', 'Break the trick'], d: ['冰甲就用火融掉，上發條就用雷打斷。沒有對的屬性就跳過。', 'Fire on ice armour, thunder on a wind-up. Skipped without the right element.'], run: (r, x) => {
    const pick = (f) => (f.status.iced ? 'fire' : f.charging ? 'bolt' : null);
    const f = r && r.kind === 'foe' && pick(r.t) ? r.t : x.foes.find((g) => pick(g)); if (!f) return null;
    const el = pick(f), hit = bestHit(own(x, (t) => isDmg(t) && t.el === el), { kind: 'foe', t: f }, x);
    if (hit) return hit;
    if (ATTACK(x).el === el) return { type: 'attack', target: f };
    const bomb = bag((it) => it.bomb && it.bomb.el === el)[0];
    return bomb ? { type: 'item', id: bomb, target: f } : null; } },
  debuff: { n: ['讓敵人變慢', 'Slow an enemy'], d: ['用遲滯之環、藤蔓陷阱、倒沙這類的技，對還沒變慢的敵人。', 'A slowing technique (Time Slow, Snare, Hourglass) on an enemy not slowed yet.'], run: (r, x) => {
    const ok = (f) => !f.status.slow;
    let best = null, bv = 0;
    for (const id of own(x, isSlow)) { const t = TK(id), f = aim(t, r, x, ok); if (!f) continue; const n = t.area === 'all' ? x.foes.filter(ok).length : x.reach(t, x.me, f).filter(ok).length + (f.m.boss ? 2 : 0); if (n > bv) { bv = n; best = { type: 'tech', id, target: f }; } }
    return best; } },
  heal: { n: ['回復一人', 'Heal one'], d: ['用治一個人的技：剛好補滿的最小那招，不夠就用最強的。', 'A one-friend heal: the smallest that covers the wound, else the strongest.'], run: (r, x) => {
    const q = allyFor(r, x, (p) => ratio(p) < 0.9); if (!q) return null;
    const miss = stats(q.h).maxhp - q.h.hp, ids = own(x, isHealOne).sort((a, b) => healAmt(x, TK(a)) - healAmt(x, TK(b)));
    if (!ids.length) return null;
    return { type: 'tech', id: ids.find((k) => healAmt(x, TK(k)) >= miss) || ids[ids.length - 1], target: q }; } },
  healall: { n: ['回復全體', 'Heal everyone'], d: ['用治所有夥伴的技（兩人以上受傷時），MP 少的先。', 'A heal for every friend (when two or more are hurt), cheapest first.'], run: (r, x) => {
    if (hurt(x, 0.8).length < (r && r.kind === 'allies' ? 1 : 2)) return null;
    const ids = own(x, isHealAll).sort((a, b) => (TK(a).revive ? 1 : 0) - (TK(b).revive ? 1 : 0) || TK(a).mp - TK(b).mp);
    return ids.length ? { type: 'tech', id: ids[0], target: live(x)[0] } : null; } },
  revive: { n: ['復活', 'Revive'], d: ['用能讓倒下的夥伴站起來的技（修補、晨曲、告別）。', 'A technique that gets a fallen friend up (Patch Up, Dawnsong, Farewell).'], run: (r, x) => {
    const d = r && r.kind === 'dead' ? r.t : x.heroes.find((q) => q.h.hp <= 0); if (!d) return null;
    const ids = own(x, isRevive).sort((a, b) => TK(a).mp - TK(b).mp);
    if (!ids.length) return null;
    return { type: 'tech', id: ids[0], target: TK(ids[0]).area === 'ally' ? d : live(x)[0] }; } },
  cure: { n: ['治好異常', 'Cure'], d: ['用治好中毒和遲緩的技（暖陽、告別）。', 'A technique that mends poison and slow (Warmth, Farewell).'], run: (r, x) => {
    if (!(r && (r.kind === 'ally' || r.kind === 'self') ? ailing(r.t) : live(x).some(ailing))) return null;
    const ids = own(x, isCure).sort((a, b) => TK(a).mp - TK(b).mp);
    return ids.length ? { type: 'tech', id: ids[0], target: live(x)[0] } : null; } },
  buff: { n: ['強化隊伍', 'Boost the party'], d: ['用加速、護盾、再生這類的技，給還沒有那個效果的夥伴。', 'Haste, Shield or Regen, for friends who lack it.'], run: (r, x) => {
    for (const id of own(x, isBuff)) if (fxOfT(TK(id)).some((k) => lacking(x, k))) return { type: 'tech', id, target: live(x)[0] };
    return null; } },
  barrier: { n: ['張護盾', 'Raise a shield'], d: ['用力場盾、霜牆這類護盾技（有人沒有護盾時）。', 'A shield technique (Barrier, Frost Wall) when someone lacks a Shield.'], run: (r, x) => {
    if (!lacking(x, 'barrier')) return null;
    const ids = own(x, (t) => t.kind === 'support' && t.fx && t.fx.barrier).sort((a, b) => TK(a).mp - TK(b).mp);
    return ids.length ? { type: 'tech', id: ids[0], target: live(x)[0] } : null; } },
  combo: { n: ['合體技', 'Combo technique'], d: ['和夥伴一起出最強的合體技。夥伴也照作戰行動時，會等他們的行動條一下下。', 'The strongest combo with friends. If they follow orders too, waits a moment for their gauges.'], run: (r, x) => runCombo(x.combos.filter((k) => k.c.kind !== 'heal' && k.c.kind !== 'support'), r, x) },
  item_heal: { n: ['回復藥', 'Healing herb'], d: ['用回復 HP 的藥：剛好夠的最小那個（魚不會被拿去用）。', 'An HP medicine: the smallest that is enough (fish are left alone).'], run: (r, x) => {
    const q = allyFor(r, x, (p) => ratio(p) < (r && r.kind !== 'none' ? 0.95 : 0.5)); if (!q) return null;
    const miss = stats(q.h).maxhp - q.h.hp, ids = bag((it) => it.heal && !it.revive).sort((a, b) => ITEMS[a].heal - ITEMS[b].heal);
    if (!ids.length) return null;
    return { type: 'item', id: ids.find((k) => ITEMS[k].heal >= miss) || ids[ids.length - 1], target: q }; } },
  item_mp: { n: ['回復 MP 的藥', 'MP medicine'], d: ['用時之露這類的藥，給 MP 最少（低於三成）的人；條件是自己時給自己。', 'Hour Dew and the like, for whoever is lowest on MP (under 30%); yourself when the condition is about you.'], run: (r, x) => {
    const ids = bag((it) => it.mp).sort((a, b) => ITEMS[a].mp - ITEMS[b].mp); if (!ids.length) return null;
    const q = r && (r.kind === 'self' || r.kind === 'ally') ? r.t : low(live(x).filter((p) => stats(p.h).maxmp > 0 && mpRatio(p) < 0.3), mpRatio);
    if (!q || q.h.hp <= 0 || mpRatio(q) >= 0.9) return null;
    const miss = stats(q.h).maxmp - q.h.mp; return { type: 'item', id: ids.find((k) => ITEMS[k].mp >= miss) || ids[ids.length - 1], target: q }; } },
  item_revive: { n: ['鳳尾羽', 'Phoenix Plume'], d: ['用復活的羽毛讓倒下的夥伴站起來（便宜的先）。', 'A reviving feather for a fallen friend (the cheaper first).'], run: (r, x) => {
    const d = r && r.kind === 'dead' ? r.t : x.heroes.find((q) => q.h.hp <= 0); if (!d) return null;
    const ids = bag((it) => it.revive).sort((a, b) => ITEMS[a].revive - ITEMS[b].revive);
    return ids.length ? { type: 'item', id: ids[0], target: d } : null; } },
  item_cure: { n: ['解毒的藥', 'Antidote'], d: ['用解毒草或鐘油治好中毒和遲緩；受了傷就先用鐘油。', 'An Antidote or Clock Oil for poison and slow; Clock Oil first if they are hurt too.'], run: (r, x) => {
    const q = allyFor(r, x, ailing); if (!q) return null;
    const ids = bag((it) => it.cure).sort((a, b) => (ratio(q) < 0.7 ? -1 : 1) * ((ITEMS[a].heal || 0) - (ITEMS[b].heal || 0)));
    return ids.length ? { type: 'item', id: ids[0], target: q } : null; } },
  item_haste: { n: ['疾走藥', 'Haste tonic'], d: ['給還沒加速的人（條件是夥伴就給他，否則給自己）。', 'For someone without Haste (the condition\'s friend, else yourself).'], run: (r, x) => {
    const ids = bag((it) => it.haste); if (!ids.length) return null;
    const q = r && (r.kind === 'ally' || r.kind === 'self') ? r.t : x.me.h.status.haste ? low(live(x).filter((p) => !p.h.status.haste), ratio) : x.me;
    return q && q.h.hp > 0 && !q.h.status.haste ? { type: 'item', id: ids[0], target: q } : null; } },
  item_bomb: { n: ['炸彈', 'Bomb'], d: ['丟炸彈：先挑敵人怕的屬性，避開已知被抵抗的，丟在敵人最多的地方。', 'Throw a bomb: an element the enemy fears first, never one it is known to resist, where most enemies stand.'], run: (r, x) => {
    const f0 = r && r.kind === 'foe' ? r.t : null;
    const fs = f0 ? [f0] : x.foes; if (!fs.length) return null;
    const ids = bag((it) => it.bomb && !fs.every((f) => knownRes(f).includes(it.bomb.el))).sort((a, b) => fs.filter((f) => knownWeak(f).includes(ITEMS[b].bomb.el)).length - fs.filter((f) => knownWeak(f).includes(ITEMS[a].bomb.el)).length || ITEMS[a].price - ITEMS[b].price);
    if (!ids.length) return null;
    const it = ITEMS[ids[0]], t = { area: it.bomb.area === 'all' ? 'all' : 'circle', r: 64 };
    return { type: 'item', id: ids[0], target: f0 || aim(t, null, x) }; } },
};
export const ACT_ORDER = Object.keys(ACT);
// a combo: fire it if everyone is ready, or (with partners on orders) hold for them a moment
function runCombo(list, r, x) {
  let best = null, bv = 0, wait = null;
  for (const k of list) {
    if (k.c.kind === 'heal' || k.c.kind === 'support') { if (!comboHelps(k.c, x)) continue; }
    const f = k.c.kind === 'heal' || k.c.kind === 'support' ? live(x)[0] : aim(k.c, r, x); if (!f) continue;
    if (k.ok) { const v = k.c.kind === 'heal' || k.c.kind === 'support' ? 1 : total(x, k.c, f, k.who); if (v > bv) { bv = v; best = { type: 'combo', id: k.id, target: f }; } continue; }
    if (!x.noHold && k.mpOk && k.who.every((q) => q === x.me || (q.h.hp > 0 && x.isAuto(q.h))) && (!wait || k.c.pow > COMBOS[wait.id].pow)) wait = { type: 'hold', id: k.id };
  }
  return best || wait;
}
const comboHelps = (c, x) => hurt(x, 0.8).length >= 1 || (c.revive && x.heroes.some((q) => q.h.hp <= 0)) || (c.fx && fxOfT(c).some((k) => lacking(x, k)));
// an action is one of the kinds above, a technique ("tech:<id>") or a combo ("combo:<id>")
function actionKnown(a) { return !!ACT[a] || (typeof a === 'string' && ((a.startsWith('tech:') && !!TECHS[a.slice(5)]) || (a.startsWith('combo:') && !!COMBOS[a.slice(6)]))); }
export function actName(a) {
  if (ACT[a]) return L(...ACT[a].n);
  if (a && a.startsWith('tech:') && TECHS[a.slice(5)]) return TECHS[a.slice(5)].name;
  if (a && a.startsWith('combo:') && COMBOS[a.slice(6)]) return '★' + COMBOS[a.slice(6)].name;
  return '?';
}
export function actDesc(a) {
  if (ACT[a]) return L(...ACT[a].d);
  if (a.startsWith('tech:')) { const t = TECHS[a.slice(5)]; return t ? `${t.desc}　MP ${t.mp}` : ''; }
  const c = COMBOS[a.slice(6)];
  return c ? c.desc + L('（夥伴也照作戰行動時會等他們一下下）', ' (waits a moment for partners who follow orders too)') : '';
}
function runAction(a, r, x) {
  if (ACT[a]) return ACT[a].run(r, x);
  if (a.startsWith('tech:')) {
    const id = a.slice(5);
    if (!x.techs.includes(id) || x.me.h.mp < x.mp(x.me, TK(id).mp)) return null;
    const f = techTarget(id, r, x); return f ? { type: 'tech', id, target: f } : null;
  }
  if (a.startsWith('combo:')) return runCombo(x.combos.filter((k) => k.id === a.slice(6)), r, x);
  return null;
}

// ---------- deciding ----------
// x: { me, heroes, foes, leaderTarget, first, noHold, techs, mp(q, n), combos, est(who, f, t), healAmt(who, t), reach(t, user, f), centre(list), attack, isAuto }
export function decide(x) {
  const rules = rulesOf(x.me.h);
  for (let i = 0; i < rules.length && i < maxSlots(); i++) {
    const rule = rules[i];
    if (!rule.on || !COND[rule.c]) continue;
    const r = COND[rule.c].test(x);
    if (!r) continue;
    const c = runAction(rule.a, r, x);
    if (c) return { cmd: c, rule: i };
  }
  return { cmd: ACT.attack.run(null, x), rule: -1 };
}

// ---------- ready-made sets ----------
const R = (c, a) => ({ c, a, on: true });
export const PRESETS = {
  attacker: { n: ['攻擊手：全力輸出', 'Attacker: all-out'], d: ['快倒下時吃藥，破解機關，敵人多時打一群，知道弱點就打弱點，其餘用最強的一擊。', 'A herb when nearly down, break tricks, hit many when there are several, exploit weaknesses, else the strongest hit.'],
    rules: [R('self_hp25', 'item_heal'), R('foe_iced', 'breaktrick'), R('foes3', 'area'), R('foe_weak', 'exploit'), R('foe_dying', 'attack'), R('foe_lowhp', 'strong')] },
  healer: { n: ['治療師：保住大家', 'Healer: keep everyone up'], d: ['先讓倒下的人站起來，兩人受傷就全體回復，危險的人單獨治，治好中毒，沒事就攻擊。', 'Get the fallen up, heal everyone when two are hurt, the one in danger alone, mend poison, otherwise attack.'],
    rules: [R('ally_ko', 'revive'), R('ally_ko', 'item_revive'), R('party_hurt', 'healall'), R('ally_hp50', 'heal'), R('ally_ail', 'cure'), R('foe_any', 'attack')] },
  thief: { n: ['盜賊：先偷再打', 'Thief: steal first'], d: ['每隻敵人都先偷一次，有人倒下或危險就用道具，其餘時間攻擊。', 'Steal from every enemy first, use items on anyone fallen or in danger, otherwise attack.'],
    rules: [R('foe_unstolen', 'steal'), R('ally_ko', 'item_revive'), R('ally_hp30', 'item_heal'), R('foe_lowhp', 'attack')] },
  elemental: { n: ['屬性：打弱點', 'Elemental: weaknesses'], d: ['先破解機關，再用弱點屬性打，敵人多時打一群，MP 不夠就喝時之露。', 'Break tricks first, then strike weaknesses, hit many when there are several, an Hour Dew when low on MP.'],
    rules: [R('foe_windup', 'breaktrick'), R('foe_iced', 'breaktrick'), R('foe_weak', 'exploit'), R('foes2', 'area'), R('self_mp30', 'item_mp'), R('foe_any', 'strong')] },
  support: { n: ['輔助：強化與減速', 'Support: boost and slow'], d: ['第一回合強化隊伍，讓頭目變慢，張護盾，治好異常，其餘時間攻擊。', 'Boost the party on the first turn, slow bosses, raise shields, mend ailments, otherwise attack.'],
    rules: [R('first', 'buff'), R('foe_boss', 'debuff'), R('no_barrier', 'barrier'), R('ally_ail', 'item_cure'), R('foes2', 'debuff'), R('foe_any', 'attack')] },
  combo: { n: ['合體：一起出招', 'Combo: strike together'], d: ['能出合體技就出（會等照作戰行動的夥伴一下），敵人多時打一群，其餘最強的一擊。', 'Combo whenever possible (waiting a moment for friends on orders), hit many when there are several, else the strongest hit.'],
    rules: [R('self_hp25', 'item_heal'), R('foe_any', 'combo'), R('foes3', 'area'), R('foe_any', 'strong')] },
  safe: { n: ['穩健：頭目戰', 'Safe: boss fights'], d: ['敵人上發條時張盾或防禦，自己危險就吃藥，有人倒下就救，有冰甲就融，其餘攻擊。', 'Shield or guard when an enemy winds up, a herb when in danger, revive the fallen, melt ice armour, otherwise attack.'],
    rules: [R('foe_windup', 'barrier'), R('foe_windup', 'guard'), R('self_hp50', 'item_heal'), R('ally_ko', 'item_revive'), R('foe_iced', 'breaktrick'), R('foe_any', 'attack')] },
};
export const presetRules = (k) => (PRESETS[k] || PRESETS.attacker).rules.map((r) => ({ ...r }));
const HERO_PRESET = { ren: ['attacker', 'combo'], mira: ['elemental', 'healer'], silas: ['thief', 'support'], kaya: ['healer', 'attacker'], nilo: ['safe', 'elemental'], vesper: ['support', 'attacker'] };
export const suggested = (id) => HERO_PRESET[id] || ['attacker'];
export const ruleText = (r) => `${condName(r.c)} → ${actName(r.a)}`;

// ---------- for the menus ----------
// techniques and combos a friend could be given orders for
export function techChoices(h) { return LEARN[h.id].filter((id) => TECHS[id]); }
export function comboChoices(h) { return Object.keys(COMBOS).filter((id) => COMBOS[id].who.includes(h.id) || (id === 'hourchime')); }
// can this friend do the action at all right now (the technique learned, the item in the bag)?
export function kindReady(h, a) {
  const ts = techsOf(h).map(TK);
  if (a.startsWith('tech:')) return techsOf(h).includes(a.slice(5));
  if (a.startsWith('combo:')) {
    const c = COMBOS[a.slice(6)]; if (!c) return false;
    if (a === 'combo:hourchime') return S.members.length >= 3 && (h.id === 'ren' ? knows(h, 'riftdash') : knows(h, LEARN[h.id][2]));
    return c.who.every((w, i) => { const m = member(w); return m && knows(m, c.need[i]); });
  }
  const inv = (f) => bag(f).length > 0;
  return ({
    steal: () => ts.some((t) => t.kind === 'steal'), strong: () => true, area: () => ts.some((t) => isDmg(t) && t.area !== 'one'),
    exploit: () => ts.some(isDmg) || !!HEROES[h.id].shot, breaktrick: () => ts.some((t) => t.el === 'fire' || t.el === 'bolt') || HEROES[h.id].shot === 'fire' || inv((it) => it.bomb && (it.bomb.el === 'fire' || it.bomb.el === 'bolt')),
    debuff: () => ts.some(isSlow), heal: () => ts.some(isHealOne), healall: () => ts.some(isHealAll), revive: () => ts.some(isRevive), cure: () => ts.some(isCure), buff: () => ts.some(isBuff),
    barrier: () => ts.some((t) => t.kind === 'support' && t.fx && t.fx.barrier), combo: () => comboChoices(h).some((id) => kindReady(h, 'combo:' + id)),
    item_heal: () => inv((it) => it.heal && !it.revive), item_mp: () => inv((it) => it.mp), item_revive: () => inv((it) => it.revive), item_cure: () => inv((it) => it.cure), item_haste: () => inv((it) => it.haste), item_bomb: () => inv((it) => it.bomb),
  }[a] || (() => true))();
}
void nameOf;
