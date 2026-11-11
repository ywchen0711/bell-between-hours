// Heroes, techniques, combined techniques, items, equipment and every monster. Monster strength is fixed:
// it belongs to the place and the era, never to the party's level.
import { localize } from './i18n.js';

export const ELEM = { light: ['光', 'Light'], fire: ['火', 'Fire'], wind: ['風', 'Wind'], bolt: ['雷', 'Thunder'], dark: ['闇', 'Shadow'] };

// ---------- heroes ----------
// base = level 1, grow = added each level; atk/mag come from pow/mag plus the weapon
export const HEROES = {
  ren: { name: '蓮', sprite: 'ren', weapon: 'sword', atkAnim: 'slash', melee: true, el: 'light',
    base: { hp: 82, mp: 10, pow: 12, mag: 6, def: 9, mdf: 6, spd: 11 }, grow: { hp: 11, mp: 1.5, pow: 2.2, mag: 1.1, def: 1.6, mdf: 1.1, spd: 0.25 },
    equip: { weapon: 'woodsword', armor: 'tunic', acc: null } },
  mira: { name: '米拉', sprite: 'mira', weapon: 'staff', atkAnim: 'spellcast', melee: false, shot: 'fire', el: 'fire',
    base: { hp: 62, mp: 24, pow: 6, mag: 14, def: 6, mdf: 11, spd: 10 }, grow: { hp: 8, mp: 3, pow: 1, mag: 2.6, def: 1.1, mdf: 2, spd: 0.25 },
    equip: { weapon: 'oakstaff', armor: 'robe', acc: null } },
  silas: { name: '賽勒斯', sprite: 'silas', weapon: 'crossbow', atkAnim: 'thrust', melee: false, shot: 'bolt', el: 'bolt',
    base: { hp: 66, mp: 18, pow: 10, mag: 12, def: 8, mdf: 9, spd: 12 }, grow: { hp: 9, mp: 2.4, pow: 1.9, mag: 2.2, def: 1.5, mdf: 1.6, spd: 0.3 },
    equip: { weapon: 'scrapbow', armor: 'leather', acc: null } },
  kaya: { name: '卡雅', sprite: 'kaya', weapon: 'bow', atkAnim: 'shoot', melee: false, shot: 'arrow', el: 'wind',
    base: { hp: 72, mp: 14, pow: 13, mag: 8, def: 8, mdf: 8, spd: 14 }, grow: { hp: 10, mp: 2, pow: 2.3, mag: 1.4, def: 1.4, mdf: 1.4, spd: 0.35 },
    equip: { weapon: 'bonebow', armor: 'hide', acc: null } },
};
export const expFor = (lv) => (lv <= 1 ? 0 : Math.round(14 * Math.pow(lv - 1, 2.25)));

// ---------- techniques ----------
// area: one | line (from the user through the target) | circle (round the target) | self (round the user) | all | ally | allies
// kind: phys | mag | heal | revive
export const TECHS = {
  whirl: { name: '旋刃', who: 'ren', tp: 0, mp: 2, area: 'self', r: 72, kind: 'phys', pow: 1.15, desc: '原地轉身一斬，砍中身邊所有的敵人。' },
  dawn: { name: '曙光斬', who: 'ren', tp: 24, mp: 4, area: 'one', kind: 'phys', pow: 1.9, el: 'light', desc: '帶著光的一刀，怕光的東西特別痛。' },
  riftdash: { name: '時隙突進', who: 'ren', tp: 70, mp: 6, area: 'line', kind: 'phys', pow: 1.6, desc: '穿過時間的縫隙直衝過去，一路上的敵人都會被砍到。' },
  toll: { name: '鐘鳴', who: 'ren', tp: 160, mp: 12, area: 'all', kind: 'mag', stat: 'pow', pow: 2.1, el: 'light', desc: '劍敲出鐘聲，光的波紋打中所有的敵人。' },
  spark: { name: '火花', who: 'mira', tp: 0, mp: 2, area: 'one', kind: 'mag', pow: 1.45, el: 'fire', desc: '一團火打向一個敵人。' },
  mend: { name: '回春', who: 'mira', tp: 12, mp: 3, area: 'ally', kind: 'heal', pow: 2.2, desc: '治好一位夥伴的傷。' },
  flamering: { name: '熾焰圈', who: 'mira', tp: 56, mp: 6, area: 'circle', r: 60, kind: 'mag', pow: 1.4, el: 'fire', desc: '在目標四周燃起火圈，靠在一起的敵人一起燒。' },
  inferno: { name: '煉獄', who: 'mira', tp: 150, mp: 14, area: 'all', kind: 'mag', pow: 2.0, el: 'fire', desc: '火海吞沒所有的敵人。' },
  zap: { name: '電擊', who: 'silas', tp: 0, mp: 2, area: 'one', kind: 'mag', pow: 1.5, el: 'bolt', desc: '一道電打向一個敵人。' },
  patch: { name: '修補', who: 'silas', tp: 14, mp: 4, area: 'ally', kind: 'heal', pow: 1.7, revive: true, desc: '用工具和繃帶修好一位夥伴，倒下的也能拉起來。' },
  shocknet: { name: '雷網', who: 'silas', tp: 64, mp: 7, area: 'circle', r: 60, kind: 'mag', pow: 1.3, el: 'bolt', stun: 0.4, desc: '撒出帶電的網，網中的敵人可能被電麻一回合。' },
  overload: { name: '超載', who: 'silas', tp: 150, mp: 14, area: 'all', kind: 'mag', pow: 2.1, el: 'bolt', desc: '把電池全部放光，雷打中所有的敵人。' },
  twin: { name: '連射', who: 'kaya', tp: 0, mp: 2, area: 'one', kind: 'phys', pow: 0.85, hits: 2, desc: '連射兩箭。' },
  galearrow: { name: '疾風箭', who: 'kaya', tp: 22, mp: 4, area: 'line', kind: 'phys', pow: 1.45, el: 'wind', desc: '乘著風的一箭，穿過一整排的敵人。' },
  breath: { name: '森之息', who: 'kaya', tp: 64, mp: 6, area: 'allies', kind: 'heal', pow: 1.2, desc: '森林的氣息，治好所有的夥伴。' },
  cyclone: { name: '旋風', who: 'kaya', tp: 150, mp: 12, area: 'circle', r: 76, kind: 'mag', pow: 2.0, el: 'wind', stun: 0.3, desc: '捲起大旋風，可能把敵人捲得暈頭轉向。' },
};
export const LEARN = { ren: ['whirl', 'dawn', 'riftdash', 'toll'], mira: ['spark', 'mend', 'flamering', 'inferno'], silas: ['zap', 'patch', 'shocknet', 'overload'], kaya: ['twin', 'galearrow', 'breath', 'cyclone'] };

// two or three friends at once; each must already know the listed technique
export const COMBOS = {
  emberarc: { name: '炎月斬', who: ['ren', 'mira'], need: ['dawn', 'spark'], mp: [4, 3], area: 'line', kind: 'phys', pow: 2.7, el: 'fire', desc: '米拉把火纏上蓮的劍，一刀燒穿一整排。' },
  galedance: { name: '疾風亂舞', who: ['ren', 'kaya'], need: ['whirl', 'galearrow'], mp: [3, 4], area: 'circle', r: 84, kind: 'phys', pow: 2.2, el: 'wind', desc: '風和劍一起旋轉，捲進目標周圍所有的敵人。' },
  thunderblade: { name: '雷光劍', who: ['ren', 'silas'], need: ['dawn', 'zap'], mp: [4, 3], area: 'one', kind: 'phys', pow: 3.5, el: 'bolt', desc: '賽勒斯把雷導進劍裡，對一個敵人的重擊。' },
  firetwister: { name: '火龍捲', who: ['mira', 'kaya'], need: ['spark', 'galearrow'], mp: [4, 4], area: 'circle', r: 76, kind: 'mag', pow: 2.4, el: 'fire', desc: '風把火捲成龍捲。' },
  plasmanova: { name: '電漿新星', who: ['mira', 'silas'], need: ['flamering', 'zap'], mp: [6, 4], area: 'all', kind: 'mag', pow: 1.9, el: 'bolt', desc: '火與雷混成一顆小太陽，在敵陣中炸開。' },
  stormvolley: { name: '風暴連射', who: ['kaya', 'silas'], need: ['twin', 'shocknet'], mp: [3, 5], area: 'all', kind: 'phys', pow: 1.6, el: 'wind', desc: '箭和弩一起亂射，打中所有的敵人。' },
  hourchime: { name: '時鐘齊鳴', who: ['ren', '*', '*'], need: ['riftdash', 2, 2], mp: [8, 8, 8], area: 'all', kind: 'mag', stat: 'pow', pow: 3.6, el: 'light', desc: '三個人同時敲響心中的鐘。蓮和另外兩位都學會第三招以後才能用。' },
};

// ---------- items and equipment ----------
export const ITEMS = {
  tonic: { name: '藥草', type: 'use', heal: 60, price: 20, desc: '回復 60 HP。' },
  hitonic: { name: '上等藥草', type: 'use', heal: 180, price: 70, desc: '回復 180 HP。' },
  ether: { name: '時之露', type: 'use', mp: 20, price: 90, desc: '回復 20 MP。' },
  feather: { name: '鳳尾羽', type: 'use', revive: 0.5, price: 150, desc: '讓倒下的夥伴以一半的 HP 站起來。' },
  elixir: { name: '星之泉', type: 'use', full: true, price: 0, desc: '全體 HP 和 MP 完全回復。' },
  woodsword: { name: '練習用木劍', type: 'weapon', for: 'sword', atk: 4, price: 0 },
  ironsword: { name: '鐵劍', type: 'weapon', for: 'sword', atk: 11, price: 140 },
  bellsword: { name: '鐘鳴劍', type: 'weapon', for: 'sword', atk: 20, price: 520 },
  starblade: { name: '星鐵劍', type: 'weapon', for: 'sword', atk: 32, price: 0, desc: '用鐘心剩下的星鐵打成的劍。' },
  oakstaff: { name: '橡木杖', type: 'weapon', for: 'staff', atk: 3, bonus: { mag: 2 }, price: 0 },
  runestaff: { name: '符文杖', type: 'weapon', for: 'staff', atk: 6, bonus: { mag: 7 }, price: 260 },
  emberrod: { name: '燼火杖', type: 'weapon', for: 'staff', atk: 10, bonus: { mag: 14 }, price: 640 },
  scrapbow: { name: '廢鐵弩', type: 'weapon', for: 'crossbow', atk: 9, price: 0 },
  arcbow: { name: '電弧弩', type: 'weapon', for: 'crossbow', atk: 17, bonus: { mag: 3 }, price: 380 },
  railbow: { name: '軌道弩', type: 'weapon', for: 'crossbow', atk: 28, bonus: { mag: 5 }, price: 0 },
  bonebow: { name: '骨弓', type: 'weapon', for: 'bow', atk: 12, price: 0 },
  hornbow: { name: '角弓', type: 'weapon', for: 'bow', atk: 19, price: 420 },
  windbow: { name: '風之弓', type: 'weapon', for: 'bow', atk: 30, bonus: { spd: 2 }, price: 0 },
  tunic: { name: '布衣', type: 'armor', def: 3, price: 0 },
  robe: { name: '學者長袍', type: 'armor', def: 2, bonus: { mdf: 3 }, price: 0 },
  hide: { name: '獸皮衣', type: 'armor', def: 6, price: 0 },
  leather: { name: '皮甲', type: 'armor', def: 7, price: 90 },
  chain: { name: '鎖子甲', type: 'armor', def: 13, price: 300 },
  weave: { name: '光纖織衣', type: 'armor', def: 17, bonus: { mdf: 6 }, price: 560 },
  aegis: { name: '時隙之鎧', type: 'armor', def: 26, bonus: { mdf: 10 }, price: 0 },
  charm: { name: '幸運懷錶鍊', type: 'acc', bonus: { spd: 2 }, price: 120, desc: '速度 +2' },
  ring: { name: '力量戒指', type: 'acc', bonus: { pow: 5 }, price: 200, desc: '力量 +5' },
  amulet: { name: '智慧護符', type: 'acc', bonus: { mag: 5 }, price: 200, desc: '魔力 +5' },
  timepiece: { name: '心之懷錶', type: 'acc', bonus: { hp: 60, spd: 1 }, price: 0, desc: 'HP +60，速度 +1' },
  // things the story hands you
  fork: { name: '音叉', type: 'key', desc: '奧林師傅調鐘用的音叉。' },
  flute: { name: '骨笛', type: 'key', desc: '根野族世代相傳的笛子。' },
  clapper: { name: '三時之舌', type: 'key', desc: '用三個時代的聲音做成的鐘舌。' },
};
export const SHOPS = {
  lantern: ['tonic', 'ether', 'feather', 'ironsword', 'runestaff', 'leather', 'charm'],
  stillfall: ['tonic', 'hitonic', 'ether', 'feather', 'arcbow', 'runestaff', 'chain', 'weave', 'amulet'],
  village: ['hitonic', 'ether', 'feather', 'hornbow', 'bellsword', 'chain', 'ring'],
  lantern2: ['hitonic', 'ether', 'feather', 'bellsword', 'emberrod', 'hornbow', 'arcbow', 'weave', 'ring', 'amulet'],
};

// ---------- monsters ----------
// sprite: an LPC person ('c:') or creature ('m:'); look: a recolouring; acts: what it does on its turn
// weak/res: elements; drop: [item, chance]
const M = (o) => ({ def: 6, mdf: 6, spd: 8, mag: 0, acts: ['hit'], weak: [], res: [], scale: 1, ...o });
export const MONSTERS = {
  slime: M({ name: '果凍史萊姆', sprite: 'm:slime', hp: 34, pow: 8, def: 4, spd: 6, exp: 6, gold: 4, tp: 1, weak: ['fire'], drop: ['tonic', 0.2] }),
  bee: M({ name: '針蜂', sprite: 'm:bee', hp: 24, pow: 9, spd: 13, exp: 6, gold: 3, tp: 1, weak: ['wind'], acts: ['hit', 'hit', 'sting'] }),
  snake: M({ name: '草蛇', sprite: 'm:snake', hp: 38, pow: 10, spd: 9, exp: 8, gold: 5, tp: 1, acts: ['hit', 'venom'] }),
  bandit: M({ name: '林中盜賊', sprite: 'c:bandit', hp: 48, pow: 11, def: 6, spd: 10, exp: 10, gold: 14, tp: 1, drop: ['tonic', 0.3] }),
  goblin: M({ name: '哥布林', sprite: 'c:goblin', hp: 62, pow: 13, def: 8, spd: 8, exp: 14, gold: 10, tp: 2, weak: ['light'] }),
  greyfang: M({ name: '灰牙', sprite: 'c:wolfman', hp: 460, pow: 17, def: 9, mdf: 8, spd: 12, exp: 140, gold: 180, tp: 10, scale: 1.3, boss: true, acts: ['hit', 'hit', 'howl', 'frenzy'] }),
  // Stillfall
  skeleton: M({ name: '時骸', sprite: 'c:skeleton', hp: 110, pow: 21, def: 12, mdf: 8, spd: 10, exp: 32, gold: 20, tp: 3, weak: ['light'], res: ['dark'] }),
  zombie: M({ name: '凝滯者', sprite: 'c:zombie', hp: 150, pow: 19, def: 9, spd: 5, exp: 30, gold: 18, tp: 3, weak: ['fire', 'light'], acts: ['hit', 'venom'] }),
  ghost: M({ name: '空鐘幽影', sprite: 'm:ghost', hp: 84, pow: 10, mag: 20, def: 30, mdf: 8, spd: 11, exp: 34, gold: 22, tp: 3, weak: ['light', 'fire'], acts: ['shade', 'shade', 'hit'] }),
  bat: M({ name: '灰翼蝠', sprite: 'm:bat', hp: 70, pow: 17, spd: 16, exp: 26, gold: 14, tp: 2, weak: ['wind'], acts: ['hit', 'hit', 'drain'] }),
  hollow: M({ name: '空洞人', sprite: 'c:alien', hp: 130, pow: 16, mag: 22, def: 12, mdf: 14, spd: 9, exp: 40, gold: 26, tp: 3, weak: ['wind'], res: ['bolt'], acts: ['zap', 'hit'], drop: ['ether', 0.15] }),
  warden: M({ name: '看守者', sprite: 'c:golem', hp: 2400, pow: 40, def: 20, mdf: 14, spd: 10, exp: 520, gold: 400, tp: 20, scale: 1.45, boss: true, weak: ['bolt'], acts: ['hit', 'hit', 'quake', 'harden'] }),
  // Rootwild
  boarman: M({ name: '野豬戰士', sprite: 'c:boarman', hp: 300, pow: 30, def: 16, mdf: 10, spd: 10, exp: 62, gold: 30, tp: 4, weak: ['fire'], drop: ['hitonic', 0.15] }),
  lizard: M({ name: '蜥蜴獵人', sprite: 'c:lizard', hp: 270, pow: 28, def: 14, mdf: 12, spd: 13, exp: 60, gold: 30, tp: 4, weak: ['bolt'], res: ['fire'] }),
  bigworm: M({ name: '岩蟲', sprite: 'm:big_worm', hp: 340, pow: 31, def: 22, mdf: 8, spd: 7, exp: 66, gold: 28, tp: 4, weak: ['fire'], acts: ['hit', 'acid'] }),
  smallworm: M({ name: '鑽地蟲', sprite: 'm:small_worm', hp: 190, pow: 25, def: 14, spd: 12, exp: 42, gold: 20, tp: 3, weak: ['wind'] }),
  flower: M({ name: '食人花', sprite: 'm:man_eater_flower', hp: 380, pow: 22, mag: 28, def: 12, mdf: 12, spd: 8, exp: 74, gold: 34, tp: 5, weak: ['fire'], acts: ['hit', 'spores'] }),
  eyeball: M({ name: '凝視之眼', sprite: 'm:eyeball', hp: 240, pow: 18, mag: 32, def: 12, mdf: 18, spd: 12, exp: 68, gold: 32, tp: 4, weak: ['light'], acts: ['laser', 'hit'] }),
  orc: M({ name: '火山獸人', sprite: 'c:orc', hp: 440, pow: 37, def: 18, mdf: 10, spd: 9, exp: 92, gold: 46, tp: 5, res: ['fire'], weak: ['wind'], drop: ['ether', 0.15] }),
  stonehorn: M({ name: '石角', sprite: 'c:minotaur', hp: 3400, pow: 46, def: 24, mdf: 18, spd: 11, exp: 1500, gold: 900, tp: 40, scale: 1.45, boss: true, res: ['fire'], acts: ['hit', 'hit', 'charge', 'quake'] }),
  // the present, overrun
  troll: M({ name: '霜巨魔', sprite: 'c:troll', hp: 620, pow: 45, def: 24, mdf: 14, spd: 8, exp: 140, gold: 60, tp: 6, weak: ['fire'], drop: ['hitonic', 0.2] }),
  bone2: M({ name: '鐘塔時骸', sprite: 'c:skeleton', look: 'hue:200', hp: 430, pow: 42, def: 22, mdf: 14, spd: 12, exp: 120, gold: 50, tp: 5, weak: ['light'], res: ['dark'] }),
  shade2: M({ name: '寂靜幽影', sprite: 'm:ghost', look: 'hue:120', hp: 320, pow: 20, mag: 44, def: 40, mdf: 16, spd: 13, exp: 130, gold: 54, tp: 5, weak: ['light', 'fire'], acts: ['shade', 'shade', 'hit'] }),
  vesper: M({ name: '薇絲珀', sprite: 'c:vesper', hp: 7200, pow: 48, mag: 50, def: 24, mdf: 24, spd: 15, exp: 2800, gold: 1500, tp: 60, scale: 1.25, boss: true, weak: ['light'], res: ['dark'], acts: ['hit', 'hushwave', 'stopwatch', 'hit'] }),
  // the Silent Spire
  hollow2: M({ name: '永夜空洞人', sprite: 'c:alien', look: 'hue:150', hp: 700, pow: 40, mag: 54, def: 26, mdf: 26, spd: 12, exp: 260, gold: 80, tp: 8, weak: ['wind'], res: ['bolt'], acts: ['zap', 'hit'] }),
  eye2: M({ name: '永夜之眼', sprite: 'm:eyeball', look: 'hue:250', hp: 640, pow: 30, mag: 58, def: 24, mdf: 30, spd: 14, exp: 250, gold: 76, tp: 8, weak: ['light'], acts: ['laser', 'hit'] }),
  lantern: M({ name: '提燈王', sprite: 'm:pumpking', hp: 820, pow: 48, mag: 50, def: 28, mdf: 22, spd: 11, exp: 280, gold: 90, tp: 8, res: ['fire'], weak: ['wind'], acts: ['flame', 'hit'] }),
  sentinel: M({ name: '寂靜哨兵', sprite: 'c:golem', look: 'hue:280', hp: 1200, pow: 56, def: 34, mdf: 20, spd: 9, exp: 320, gold: 100, tp: 9, weak: ['bolt'], acts: ['hit', 'quake'] }),
  hush: M({ name: '寂靜', sprite: 'm:eyeball', look: 'dark', hp: 11000, pow: 44, mag: 45, def: 30, mdf: 30, spd: 14, exp: 0, gold: 0, tp: 0, scale: 3, boss: true, final: true, res: ['dark'], weak: ['light'], acts: ['stillness', 'gaze', 'devour', 'gaze', 'silencebell'] }),
};
// what each monster move does: area, kind, power, element, extra; anim: the sprite's attack, or a spell
export const MOVES = {
  hit: { name: '攻擊', area: 'one', kind: 'phys', pow: 1, melee: true },
  sting: { name: '毒針', area: 'one', kind: 'phys', pow: 1.1, melee: true, poison: 0.4 },
  venom: { name: '毒牙', area: 'one', kind: 'phys', pow: 1.0, melee: true, poison: 0.6 },
  howl: { name: '長嚎', area: 'self', kind: 'buff', buff: 'pow' },
  frenzy: { name: '狂爪', area: 'one', kind: 'phys', pow: 0.85, hits: 3, melee: true },
  shade: { name: '冷影', area: 'one', kind: 'mag', pow: 1.3, el: 'dark' },
  drain: { name: '吸血', area: 'one', kind: 'phys', pow: 1.0, melee: true, drain: true },
  zap: { name: '空洞雷', area: 'one', kind: 'mag', pow: 1.35, el: 'bolt' },
  quake: { name: '地震', area: 'all', kind: 'phys', pow: 0.85 },
  harden: { name: '硬化', area: 'self', kind: 'buff', buff: 'def' },
  acid: { name: '酸液', area: 'one', kind: 'mag', pow: 1.2, poison: 0.5 },
  spores: { name: '毒孢子', area: 'all', kind: 'mag', pow: 0.7, poison: 0.35 },
  laser: { name: '凝視光線', area: 'line', kind: 'mag', pow: 1.3, el: 'light' },
  charge: { name: '衝撞', area: 'line', kind: 'phys', pow: 1.4, melee: true },
  hushwave: { name: '寂靜之波', area: 'all', kind: 'mag', pow: 1.1, el: 'dark' },
  stopwatch: { name: '停針', area: 'one', kind: 'mag', pow: 0.6, el: 'dark', stun: 1 },
  flame: { name: '提燈火', area: 'all', kind: 'mag', pow: 0.95, el: 'fire' },
  stillness: { name: '萬物靜止', area: 'all', kind: 'mag', pow: 1.15, el: 'dark' },
  gaze: { name: '虛無凝視', area: 'line', kind: 'mag', pow: 1.6, el: 'dark' },
  devour: { name: '吞噬時間', area: 'one', kind: 'mag', pow: 1.0, el: 'dark', eatGauge: true },
  silencebell: { name: '無聲之鐘', area: 'all', kind: 'mag', pow: 0.7, el: 'dark', stun: 0.3 },
};

localize(HEROES, { ren: ['Ren'], mira: ['Mira'], silas: ['Silas'], kaya: ['Kaya'] });
localize(TECHS, {
  whirl: ['Whirl Edge', 'Spins on the spot and cuts every foe close around.'], dawn: ['Dawnslash', 'A cut full of light; things that fear light feel it most.'],
  riftdash: ['Rift Dash', 'Darts through a crack in time, cutting every foe along the way.'], toll: ['Bell Toll', 'The sword rings like a bell; rings of light strike every foe.'],
  spark: ['Spark', 'A ball of fire at one foe.'], mend: ['Mend', "Heals one friend's wounds."], flamering: ['Flame Ring', 'A ring of fire round the target burns foes standing close together.'],
  inferno: ['Inferno', 'A sea of fire over every foe.'], zap: ['Zap', 'A bolt of lightning at one foe.'], patch: ['Patch Up', 'Tools and bandages for one friend; can get a fallen friend up too.'],
  shocknet: ['Shock Net', 'A charged net; foes inside may be stunned for a turn.'], overload: ['Overload', 'Empties every battery: lightning strikes every foe.'],
  twin: ['Twin Shot', 'Two arrows, one after the other.'], galearrow: ['Gale Arrow', 'An arrow riding the wind, through a whole line of foes.'],
  breath: ['Forest Breath', 'The breath of the forest heals every friend.'], cyclone: ['Cyclone', 'A great whirlwind that may leave foes too dizzy to act.'],
});
localize(COMBOS, {
  emberarc: ['Ember Arc', "Mira wraps Ren's blade in fire; one cut burns through a whole line."], galedance: ['Gale Dance', 'Wind and sword spin together through every foe round the target.'],
  thunderblade: ['Thunder Blade', 'Silas sends lightning down the sword: one huge blow.'], firetwister: ['Fire Twister', 'The wind twists the fire into a tornado.'],
  plasmanova: ['Plasma Nova', 'Fire and lightning make a little sun that bursts among the foes.'], stormvolley: ['Storm Volley', 'Arrows and bolts rain on every foe.'],
  hourchime: ['Hour Chime', 'Three hearts ring their bells at once. Needs Ren and two friends who each know their third technique.'],
});
localize(ITEMS, {
  tonic: ['Tonic', 'Restores 60 HP.'], hitonic: ['Hi-Tonic', 'Restores 180 HP.'], ether: ['Hour Dew', 'Restores 20 MP.'], feather: ['Phoenix Plume', 'A fallen friend gets up with half their HP.'],
  elixir: ['Starspring', 'Fully restores HP and MP for everyone.'], woodsword: ['Practice Sword'], ironsword: ['Iron Sword'], bellsword: ['Bellsteel Sword'], starblade: ['Starsteel Blade', 'Forged from what was left of the starmetal bell core.'],
  oakstaff: ['Oak Staff'], runestaff: ['Rune Staff'], emberrod: ['Ember Rod'], scrapbow: ['Scrap Crossbow'], arcbow: ['Arc Crossbow'], railbow: ['Rail Crossbow'],
  bonebow: ['Bone Bow'], hornbow: ['Horn Bow'], windbow: ['Wind Bow'], tunic: ['Cloth Tunic'], robe: ["Scholar's Robe"], hide: ['Hide Wrap'], leather: ['Leather Armour'],
  chain: ['Chain Mail'], weave: ['Lightweave Coat'], aegis: ['Rift Aegis'], charm: ['Lucky Watch Chain', 'Speed +2'], ring: ['Power Ring', 'Power +5'], amulet: ['Wisdom Charm', 'Magic +5'],
  timepiece: ['Heart Pocketwatch', 'HP +60, Speed +1'], fork: ['Tuning Fork', "Master Orrin's fork for tuning bells."], flute: ['Bone Flute', 'Handed down in the Rootwild tribe for generations.'],
  clapper: ['Three-Hour Clapper', 'A bell clapper made from the sounds of three eras.'],
});
localize(MONSTERS, {
  slime: ['Jelly Slime'], bee: ['Needle Bee'], snake: ['Grass Snake'], bandit: ['Woods Bandit'], goblin: ['Goblin'], greyfang: ['Greyfang'], skeleton: ['Time-Husk'], zombie: ['Stilled One'],
  ghost: ['Hollow Shade'], bat: ['Ashwing Bat'], hollow: ['Hollowborn'], warden: ['The Warden'], boarman: ['Boar Warrior'], lizard: ['Lizard Hunter'], bigworm: ['Rock Worm'],
  smallworm: ['Burrower'], flower: ['Man-eater'], eyeball: ['Watching Eye'], orc: ['Crater Orc'], stonehorn: ['Stonehorn'], troll: ['Frost Troll'], bone2: ['Tower Husk'],
  shade2: ['Silent Shade'], vesper: ['Vesper'], hollow2: ['Nightless Hollow'], eye2: ['Nightless Eye'], lantern: ['Lantern King'], sentinel: ['Silent Sentinel'], hush: ['Hush'],
}, ['name']);
localize(MOVES, {
  hit: ['Attack'], sting: ['Venom Sting'], venom: ['Poison Fang'], howl: ['Howl'], frenzy: ['Frenzy'], shade: ['Cold Shade'], drain: ['Bloodsip'], zap: ['Hollow Bolt'], quake: ['Quake'],
  harden: ['Harden'], acid: ['Acid'], spores: ['Poison Spores'], laser: ['Staring Beam'], charge: ['Charge'], hushwave: ['Wave of Hush'], stopwatch: ['Stopped Hand'],
  flame: ['Lantern Fire'], stillness: ['All Things Still'], gaze: ['Empty Gaze'], devour: ['Eat Time'], silencebell: ['Soundless Bell'],
}, ['name']);
