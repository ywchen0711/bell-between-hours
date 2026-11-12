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

// ======================= the expansion: three more eras =======================
// Everything below adds to the tables above. Monster strength is still fixed by place and era.
ELEM.ice = ['冰', 'Ice']; ELEM.earth = ['地', 'Earth'];

Object.assign(HEROES, {
  nilo: { name: '尼洛', sprite: 'nilo', weapon: 'spear', atkAnim: 'thrust', melee: true, el: 'ice',
    base: { hp: 80, mp: 12, pow: 13, mag: 9, def: 10, mdf: 8, spd: 12 }, grow: { hp: 11.5, mp: 1.8, pow: 2.35, mag: 1.5, def: 1.7, mdf: 1.3, spd: 0.3 },
    equip: { weapon: 'flintspear', armor: 'furcoat', acc: null } },
  vesper: { name: '薇絲珀', sprite: 'vesperh', weapon: 'scythe', atkAnim: 'slash', melee: true, el: 'dark',
    base: { hp: 74, mp: 22, pow: 12, mag: 13, def: 8, mdf: 11, spd: 13 }, grow: { hp: 10.4, mp: 2.8, pow: 2.15, mag: 2.4, def: 1.45, mdf: 1.9, spd: 0.32 },
    equip: { weapon: 'duskscythe', armor: 'mourncloak', acc: null } },
});
// kind: support (fx on friends), debuff (fx on foes, maybe with damage), steal; flag: learned in a side story instead of by TP
Object.assign(TECHS, {
  quakeblade: { name: '地裂斬', who: 'ren', tp: 240, mp: 10, area: 'line', kind: 'phys', pow: 2.3, el: 'earth', desc: '劍插進地面，裂縫一路衝向敵陣。' },
  heartbell: { name: '心之鐘', who: 'ren', tp: 0, flag: 'ep_ren', mp: 14, area: 'allies', kind: 'support', fx: { haste: 3, regen: 3 }, desc: '自己做的小鐘一響，夥伴們變快，傷也慢慢好起來。' },
  lasthour: { name: '終時一閃', who: 'ren', tp: 470, mp: 22, area: 'one', kind: 'phys', pow: 4.4, el: 'light', desc: '把最後一刻的光全部壓進一刀。' },
  warmth: { name: '暖陽', who: 'mira', tp: 230, mp: 12, area: 'allies', kind: 'heal', pow: 1.7, cure: true, desc: '溫暖的光治好所有夥伴，也治好中毒和遲緩。' },
  timeslow: { name: '遲滯之環', who: 'mira', tp: 0, flag: 'ep_mira', mp: 10, area: 'circle', r: 70, kind: 'debuff', pow: 0.8, el: 'fire', fx: { slow: 3 }, desc: '在敵人四周畫出慢時間的圈，圈裡的敵人變慢。' },
  supernova: { name: '超新星', who: 'mira', tp: 460, mp: 28, area: 'all', kind: 'mag', pow: 3.1, el: 'fire', desc: '一顆星星在敵陣中誕生又死去。' },
  pilfer: { name: '順手牽羊', who: 'silas', tp: 200, mp: 3, area: 'one', kind: 'steal', desc: '從敵人身上摸走東西。' },
  barrier: { name: '力場盾', who: 'silas', tp: 0, flag: 'ep_silas', mp: 12, area: 'allies', kind: 'support', fx: { barrier: 3 }, desc: '哈蒂改良的懷錶發出力場，三回合內受到的傷害減少。' },
  railstorm: { name: '軌道砲', who: 'silas', tp: 460, mp: 24, area: 'line', kind: 'mag', pow: 3.3, el: 'bolt', desc: '把整排敵人一口氣貫穿。' },
  snare: { name: '藤蔓陷阱', who: 'kaya', tp: 220, mp: 8, area: 'circle', r: 64, kind: 'debuff', pow: 1.2, el: 'earth', fx: { slow: 2 }, desc: '藤蔓纏住目標四周的敵人，讓他們變慢。' },
  dawnsong: { name: '晨曲', who: 'kaya', tp: 0, flag: 'ep_kaya', mp: 18, area: 'allies', kind: 'heal', pow: 1.5, revive: true, desc: '用初鳴骨哨吹出的晨曲，連倒下的夥伴也會醒來。' },
  skyfall: { name: '天墜箭雨', who: 'kaya', tp: 460, mp: 22, area: 'all', kind: 'phys', pow: 2.5, el: 'wind', desc: '射上天的箭化成雨落下。' },
  pierce: { name: '貫冰刺', who: 'nilo', tp: 0, mp: 3, area: 'line', kind: 'phys', pow: 1.3, el: 'ice', desc: '帶著寒氣的一刺，穿過一整排。' },
  frostwall: { name: '霜牆', who: 'nilo', tp: 40, mp: 6, area: 'allies', kind: 'support', fx: { barrier: 2 }, desc: '立起冰牆，兩回合內大家受到的傷害減少。' },
  mammothcall: { name: '猛獁衝鋒', who: 'nilo', tp: 100, mp: 7, area: 'line', kind: 'phys', pow: 2.0, el: 'earth', desc: '像猛獁一樣衝過去。' },
  blizzard: { name: '暴風雪', who: 'nilo', tp: 180, mp: 14, area: 'all', kind: 'mag', pow: 1.9, el: 'ice', freeze: 0.25, desc: '冰雪打中所有的敵人，可能把他們凍住。' },
  glacier: { name: '冰河之槍', who: 'nilo', tp: 280, mp: 14, area: 'one', kind: 'phys', pow: 3.3, el: 'ice', desc: '冰河一樣沉重的一槍。' },
  hearth: { name: '圍爐', who: 'nilo', tp: 0, flag: 'ep_nilo', mp: 14, area: 'allies', kind: 'heal', pow: 1.3, fx: { regen: 3 }, desc: '像圍著營火一樣，大家的傷慢慢好起來。' },
  aurora: { name: '極光', who: 'nilo', tp: 480, mp: 26, area: 'all', kind: 'mag', pow: 2.9, el: 'ice', freeze: 0.3, desc: '天空裂開，極光落在敵陣上。' },
  reap: { name: '收割', who: 'vesper', tp: 0, mp: 3, area: 'self', r: 76, kind: 'phys', pow: 1.25, el: 'dark', desc: '鐮刀轉一圈，砍中身邊所有敵人。' },
  hourglass: { name: '倒沙', who: 'vesper', tp: 40, mp: 5, area: 'one', kind: 'debuff', pow: 1.5, el: 'dark', fx: { slow: 3 }, desc: '把敵人的沙漏倒過來，讓他變慢。' },
  mourn: { name: '哀歌', who: 'vesper', tp: 100, mp: 8, area: 'circle', r: 64, kind: 'mag', pow: 1.6, el: 'dark', drain: 0.3, desc: '悲傷的歌傷害敵人，也把一點生命帶回來。' },
  stillhand: { name: '止針', who: 'vesper', tp: 180, mp: 12, area: 'circle', r: 64, kind: 'mag', pow: 1.1, el: 'dark', stun: 0.5, desc: '讓敵人的時針停一下。' },
  eclipse: { name: '日蝕', who: 'vesper', tp: 280, mp: 18, area: 'all', kind: 'mag', pow: 2.3, el: 'dark', desc: '黑色的太陽吞沒敵陣。' },
  farewell: { name: '告別', who: 'vesper', tp: 0, flag: 'ep_vesper', mp: 24, area: 'allies', kind: 'heal', pow: 2.6, revive: true, cure: true, desc: '好好說了再見的人，才能把大家拉回來。' },
  endtime: { name: '終焉', who: 'vesper', tp: 480, mp: 26, area: 'all', kind: 'phys', pow: 3.0, el: 'dark', desc: '一切都會結束——所以這一刀才有意義。' },
});
LEARN.ren.push('quakeblade', 'heartbell', 'lasthour'); LEARN.mira.push('warmth', 'timeslow', 'supernova');
LEARN.silas.push('pilfer', 'barrier', 'railstorm'); LEARN.kaya.push('snare', 'dawnsong', 'skyfall');
LEARN.nilo = ['pierce', 'frostwall', 'mammothcall', 'blizzard', 'glacier', 'hearth', 'aurora'];
LEARN.vesper = ['reap', 'hourglass', 'mourn', 'stillhand', 'eclipse', 'farewell', 'endtime'];

Object.assign(COMBOS, {
  glacierblade: { name: '冰晶斬', who: ['ren', 'nilo'], need: ['dawn', 'pierce'], mp: [4, 4], area: 'line', kind: 'phys', pow: 2.9, el: 'ice', desc: '尼洛的寒氣凍住劍刃，一刀劈開一整排。' },
  twilight: { name: '黃昏之刃', who: ['ren', 'vesper'], need: ['dawn', 'reap'], mp: [5, 5], area: 'one', kind: 'phys', pow: 3.9, el: 'dark', desc: '光與影交叉的兩刀，對一個敵人的重擊。' },
  steamburst: { name: '蒸氣爆', who: ['mira', 'nilo'], need: ['spark', 'pierce'], mp: [4, 4], area: 'circle', r: 80, kind: 'mag', pow: 2.5, el: 'fire', desc: '冰碰上火，炸成滾燙的蒸氣。' },
  blackflame: { name: '黑焰', who: ['mira', 'vesper'], need: ['flamering', 'hourglass'], mp: [6, 5], area: 'all', kind: 'mag', pow: 2.1, el: 'dark', desc: '燒不完的黑色火焰。' },
  supercool: { name: '超導冰網', who: ['silas', 'nilo'], need: ['zap', 'frostwall'], mp: [4, 6], area: 'circle', r: 76, kind: 'mag', pow: 2.3, el: 'bolt', stun: 0.4, desc: '冰冷的電網，可能把敵人電麻。' },
  stopcircuit: { name: '停擺電路', who: ['silas', 'vesper'], need: ['shocknet', 'stillhand'], mp: [6, 8], area: 'all', kind: 'mag', pow: 1.8, el: 'bolt', stun: 0.35, desc: '電流讓所有敵人的時針一起停擺。' },
  huntsong: { name: '獵人之歌', who: ['kaya', 'nilo'], need: ['galearrow', 'pierce'], mp: [4, 4], area: 'line', kind: 'phys', pow: 3.0, el: 'wind', desc: '兩個時代的獵人，一箭一槍同時出手。' },
  moonarrow: { name: '朔月之箭', who: ['kaya', 'vesper'], need: ['twin', 'hourglass'], mp: [3, 5], area: 'one', kind: 'phys', pow: 3.7, el: 'dark', desc: '沒有月亮的夜裡射出的一箭。' },
  coldelegy: { name: '永凍哀歌', who: ['nilo', 'vesper'], need: ['blizzard', 'mourn'], mp: [10, 8], area: 'all', kind: 'mag', pow: 2.5, el: 'ice', drain: 0.2, desc: '冰雪和哀歌一起落下，也帶回一點生命。' },
  sunrisebell: { name: '旭日鐘', who: ['ren', 'mira'], need: ['toll', 'inferno'], mp: [10, 12], area: 'all', kind: 'mag', stat: 'pow', pow: 3.1, el: 'fire', desc: '鐘聲和朝陽一起升起。' },
  railblade: { name: '超導劍閃', who: ['ren', 'silas'], need: ['riftdash', 'overload'], mp: [6, 12], area: 'line', kind: 'phys', pow: 3.3, el: 'bolt', desc: '帶著滿滿電力穿過時隙。' },
  windchime: { name: '風鈴', who: ['ren', 'kaya'], need: ['toll', 'cyclone'], mp: [10, 10], area: 'all', kind: 'phys', pow: 2.7, el: 'wind', desc: '旋風帶著鐘聲吹過整個戰場。' },
  lifebloom: { name: '生命之花', who: ['mira', 'kaya'], need: ['mend', 'breath'], mp: [4, 6], area: 'allies', kind: 'heal', pow: 2.6, revive: true, desc: '花一朵朵開，倒下的夥伴也站起來。' },
  trinity: { name: '三時之音', who: ['ren', 'mira', 'silas'], need: ['dawn', 'spark', 'zap'], mp: [6, 6, 6], area: 'all', kind: 'mag', stat: 'pow', pow: 3.3, el: 'light', desc: '開始、現在、結束——三個時代的聲音合在一起。' },
  frontier: { name: '曠野三重奏', who: ['ren', 'kaya', 'nilo'], need: ['whirl', 'galearrow', 'pierce'], mp: [5, 5, 5], area: 'all', kind: 'phys', pow: 3.1, el: 'wind', desc: '劍、弓、槍在曠野上合奏。' },
  requiem: { name: '暮光安魂曲', who: ['mira', 'silas', 'vesper'], need: ['inferno', 'overload', 'eclipse'], mp: [10, 10, 10], area: 'all', kind: 'mag', pow: 3.7, el: 'dark', desc: '火、雷、影一起為敵人送行。' },
  auroraveil: { name: '極光幕', who: ['nilo', 'kaya', 'mira'], need: ['frostwall', 'breath', 'mend'], mp: [6, 6, 4], area: 'allies', kind: 'heal', pow: 2.4, revive: true, fx: { barrier: 3 }, desc: '極光像布幕一樣蓋住大家，治傷又擋傷。' },
  dawnbreak: { name: '破曉', who: ['ren', 'vesper', 'kaya'], need: ['riftdash', 'reap', 'cyclone'], mp: [8, 8, 8], area: 'all', kind: 'phys', pow: 3.5, el: 'light', desc: '長夜之後的第一道光。' },
  worldsend: { name: '萬物終曲', who: ['vesper', 'nilo', 'silas'], need: ['eclipse', 'glacier', 'overload'], mp: [12, 12, 12], area: 'all', kind: 'phys', pow: 3.9, desc: '凍結、雷霆與黑暗，一首結束一切的曲子。' },
});

// ---------- items ----------
// use: heal / mp / revive / full / cure / bomb {pow, el, area} / haste / smoke (sure escape); battle: only in battles
// fx on accessories: nopoison nostun haste regen halfmp gold2 exp15 counter first resfire resice resdark crit
Object.assign(ITEMS, {
  megatonic: { name: '大藥草', type: 'use', heal: 480, price: 220, desc: '回復 480 HP。' },
  godtonic: { name: '神仙草', type: 'use', heal: 9999, price: 700, desc: 'HP 完全回復。' },
  hiether: { name: '時之泉', type: 'use', mp: 60, price: 320, desc: '回復 60 MP。' },
  antidote: { name: '解毒草', type: 'use', cure: true, price: 15, desc: '治好中毒和遲緩。' },
  clockoil: { name: '鐘油', type: 'use', cure: true, heal: 120, price: 60, desc: '治好中毒、遲緩，再回復 120 HP。' },
  phoenix2: { name: '不死鳥之羽', type: 'use', revive: 1, price: 650, desc: '讓倒下的夥伴以全部 HP 站起來。' },
  hastetonic: { name: '疾走藥', type: 'use', haste: 3, battle: true, price: 120, desc: '戰鬥中使用：三回合內行動變快。' },
  firebomb: { name: '火焰彈', type: 'use', bomb: { pow: 260, el: 'fire', area: 'circle' }, battle: true, price: 110, desc: '戰鬥中使用：炸傷目標周圍的敵人（火）。' },
  icebomb: { name: '冰霜彈', type: 'use', bomb: { pow: 260, el: 'ice', area: 'circle' }, battle: true, price: 110, desc: '戰鬥中使用：凍傷目標周圍的敵人（冰）。' },
  boltbomb: { name: '雷擊彈', type: 'use', bomb: { pow: 260, el: 'bolt', area: 'circle' }, battle: true, price: 110, desc: '戰鬥中使用：電擊目標周圍的敵人（雷）。' },
  bigbomb: { name: '大鐘彈', type: 'use', bomb: { pow: 900, el: 'light', area: 'all' }, battle: true, price: 600, desc: '戰鬥中使用：一聲巨響打中所有的敵人（光）。' },
  smokeball: { name: '煙霧球', type: 'use', smoke: true, battle: true, price: 50, desc: '戰鬥中使用：一定能逃走（頭目戰除外）。' },
  // fish
  minnow: { name: '小魚', type: 'use', heal: 40, price: 10, fish: true, desc: '回復 40 HP。烤一烤就能吃。' },
  trout: { name: '鱒魚', type: 'use', heal: 150, price: 40, fish: true, desc: '回復 150 HP。' },
  icefish: { name: '冰魚', type: 'use', mp: 30, price: 90, fish: true, desc: '回復 30 MP。冰冰涼涼。' },
  goldcarp: { name: '金鯉', type: 'mat', price: 400, fish: true, desc: '閃閃發亮的鯉魚。可以賣個好價錢。' },
  timefish: { name: '時之魚', type: 'use', full: true, price: 1500, fish: true, desc: '在時間的河裡游的魚。全體 HP、MP 完全回復。' },
  // materials for the forge
  starshard: { name: '星屑', type: 'mat', price: 120, desc: '星鐵的碎片。鍛造用的素材。' },
  brassgear: { name: '黃銅齒輪', type: 'mat', price: 60, desc: '黃銅港的齒輪。鍛造用的素材。' },
  springcoil: { name: '發條', type: 'mat', price: 70, desc: '捲得很緊的發條。鍛造用的素材。' },
  mammothivory: { name: '猛獁象牙', type: 'mat', price: 150, desc: '冰河時代的象牙。鍛造用的素材。' },
  frostcrystal: { name: '霜晶', type: 'mat', price: 90, desc: '永遠不會融化的冰。鍛造用的素材。' },
  embercore: { name: '餘燼核心', type: 'mat', price: 160, desc: '還在發熱的灰燼。鍛造用的素材。' },
  shadowsilk: { name: '影絲', type: 'mat', price: 140, desc: '用影子紡成的絲。鍛造用的素材。' },
  beasthide: { name: '獸皮', type: 'mat', price: 50, desc: '又厚又暖的獸皮。鍛造用的素材。' },
  chitin: { name: '甲殼', type: 'mat', price: 60, desc: '甲蟲硬硬的殼。鍛造用的素材。' },
  hollowglass: { name: '空洞玻璃', type: 'mat', price: 110, desc: '裡面什麼都沒有的玻璃。鍛造用的素材。' },
  timesand: { name: '時之砂', type: 'mat', price: 200, desc: '從沙漏裡漏出來的時間。鍛造用的素材。' },
  // weapons
  brasssword: { name: '黃銅劍', type: 'weapon', for: 'sword', atk: 26, price: 980 },
  frostbrand: { name: '霜之劍', type: 'weapon', for: 'sword', atk: 36, bonus: { mag: 4 }, price: 2400, desc: '冰河的寒氣凝成的劍。' },
  emberblade: { name: '燼刃', type: 'weapon', for: 'sword', atk: 44, price: 3600, desc: '還在燃燒的劍。' },
  hourblade: { name: '時隙之刃', type: 'weapon', for: 'sword', atk: 56, bonus: { spd: 2 }, price: 0, desc: '切開時間縫隙的劍。' },
  gearstaff: { name: '齒輪杖', type: 'weapon', for: 'staff', atk: 12, bonus: { mag: 20 }, price: 1100 },
  aurorarod: { name: '極光杖', type: 'weapon', for: 'staff', atk: 14, bonus: { mag: 28 }, price: 2400 },
  cinderwand: { name: '灰燼之杖', type: 'weapon', for: 'staff', atk: 16, bonus: { mag: 37 }, price: 3600 },
  sagestaff: { name: '賢者權杖', type: 'weapon', for: 'staff', atk: 18, bonus: { mag: 48, mdf: 6 }, price: 0 },
  steambow: { name: '蒸汽弩', type: 'weapon', for: 'crossbow', atk: 34, bonus: { mag: 8 }, price: 1300 },
  frostbow: { name: '冰晶弩', type: 'weapon', for: 'crossbow', atk: 41, bonus: { mag: 10 }, price: 2400 },
  plasmabow: { name: '電漿弩', type: 'weapon', for: 'crossbow', atk: 52, bonus: { mag: 14 }, price: 0 },
  ivorybow: { name: '象牙弓', type: 'weapon', for: 'bow', atk: 37, price: 2200 },
  emberbow: { name: '餘燼弓', type: 'weapon', for: 'bow', atk: 45, bonus: { spd: 2 }, price: 3400 },
  dawnbow: { name: '破曉弓', type: 'weapon', for: 'bow', atk: 55, bonus: { spd: 3 }, price: 0 },
  flintspear: { name: '燧石矛', type: 'weapon', for: 'spear', atk: 20, price: 0 },
  ivoryspear: { name: '象牙矛', type: 'weapon', for: 'spear', atk: 28, price: 1400 },
  frostlance: { name: '霜槍', type: 'weapon', for: 'spear', atk: 40, price: 2400 },
  emberlance: { name: '燼火長槍', type: 'weapon', for: 'spear', atk: 46, price: 3500 },
  starlance: { name: '星槍', type: 'weapon', for: 'spear', atk: 56, price: 0 },
  duskscythe: { name: '暮鐮', type: 'weapon', for: 'scythe', atk: 34, bonus: { mag: 6 }, price: 0 },
  griefscythe: { name: '悲鳴鐮', type: 'weapon', for: 'scythe', atk: 44, bonus: { mag: 10 }, price: 3600 },
  endscythe: { name: '終焉之鐮', type: 'weapon', for: 'scythe', atk: 55, bonus: { mag: 14 }, price: 0 },
  // armour
  furcoat: { name: '毛皮大衣', type: 'armor', def: 12, price: 0 },
  mourncloak: { name: '喪服斗篷', type: 'armor', def: 16, bonus: { mdf: 8 }, price: 0 },
  brasscoat: { name: '黃銅鎧甲', type: 'armor', def: 22, price: 1200 },
  mammothhide: { name: '猛獁皮甲', type: 'armor', def: 27, bonus: { hp: 80 }, price: 2200, desc: '又重又暖。HP +80' },
  emberweave: { name: '餘燼織衣', type: 'armor', def: 30, bonus: { mdf: 14 }, price: 3200 },
  starmail: { name: '星之鎧', type: 'armor', def: 38, bonus: { mdf: 18 }, price: 6000, desc: '用星屑和時之砂打成的鎧甲。' },
  // accessories with effects
  antidoteamulet: { name: '解毒護符', type: 'acc', fx: ['nopoison'], price: 300, desc: '不會中毒。' },
  steadyring: { name: '不動之戒', type: 'acc', fx: ['nostun'], price: 1200, desc: '不會被麻痺或凍住。' },
  hasteband: { name: '疾風腕輪', type: 'acc', fx: ['haste'], price: 1600, desc: '戰鬥一開始就變快。' },
  regenring: { name: '再生之戒', type: 'acc', fx: ['regen'], price: 1600, desc: '每回合回復一點 HP。' },
  spiritcharm: { name: '魔力循環', type: 'acc', fx: ['halfmp'], price: 0, desc: '技消耗的 MP 減半。' },
  luckycoin: { name: '招財金幣', type: 'acc', fx: ['gold2'], price: 0, desc: '戰鬥得到的金幣變兩倍。' },
  scholarpin: { name: '學者徽章', type: 'acc', fx: ['exp15'], price: 0, desc: '戰鬥得到的經驗多一半。' },
  counterbadge: { name: '反擊徽章', type: 'acc', fx: ['counter'], price: 1400, desc: '被打的時候有機會反擊。' },
  firstbell: { name: '先鳴之鈴', type: 'acc', fx: ['first'], price: 0, desc: '戰鬥一開始氣槽就是滿的。' },
  fireward: { name: '防火護符', type: 'acc', fx: ['resfire'], price: 800, desc: '火的傷害減半。' },
  iceward: { name: '防寒護符', type: 'acc', fx: ['resice'], price: 800, desc: '冰的傷害減半。' },
  voidward: { name: '闇之護符', type: 'acc', fx: ['resdark'], price: 900, desc: '闇的傷害減半。' },
  critlens: { name: '鷹眼鏡片', type: 'acc', fx: ['crit'], bonus: { spd: 1 }, price: 0, desc: '更容易打出會心一擊。速度 +1' },
  renbell: { name: '蓮的小鐘', type: 'acc', fx: ['regen'], bonus: { hp: 120, pow: 4 }, price: 0, desc: '蓮第一次自己做的鐘。HP +120、力量 +4、每回合回復。' },
  hattiewatch: { name: '哈蒂的懷錶', type: 'acc', fx: ['haste'], bonus: { spd: 3, mag: 4 }, price: 0, desc: '賽勒斯奶奶的奶奶的奶奶做的懷錶。速度 +3、魔力 +4、一開始就變快。' },
  songbone: { name: '初鳴骨哨', type: 'acc', fx: ['first'], bonus: { mag: 8, pow: 4 }, price: 0, desc: '世界上第一支骨笛。魔力 +8、力量 +4、氣槽一開始就滿。' },
  lumenstar: { name: '露明的星墜', type: 'acc', fx: ['resdark'], bonus: { mdf: 12, mag: 6 }, price: 0, desc: '妹妹留下的星墜。魔防 +12、魔力 +6、闇傷害減半。' },
  miraquill: { name: '米拉的羽毛筆', type: 'acc', fx: ['halfmp'], bonus: { mag: 10 }, price: 0, desc: '寫滿時間理論的羽毛筆。魔力 +10、MP 消耗減半。' },
  mammothtusk: { name: '猛獁牙飾', type: 'acc', fx: ['counter'], bonus: { pow: 10, def: 6 }, price: 0, desc: '尼洛和小猛獁的友情。力量 +10、防禦 +6、會反擊。' },
  // keys
  hourkey1: { name: '黃銅之鑰', type: 'key', desc: '時之鑰之一。從調節機的心臟取出。' },
  hourkey2: { name: '霜晶之鑰', type: 'key', desc: '時之鑰之一。母星石睡著時落下的淚。' },
  hourkey3: { name: '餘燼之鑰', type: 'key', desc: '時之鑰之一。悲鳴機關最後的一塊齒輪。' },
  acorn: { name: '古橡實', type: 'key', desc: '老祖母給的橡實。說是能長成會記得時間的樹。' },
  valvekey: { name: '閘門扳手', type: 'key', desc: '鑄造廠水閘的扳手。' },
  rod: { name: '釣竿', type: 'key', desc: '可以在有魚的冰洞和湖邊釣魚。' },
  notes: { name: '米拉的筆記', type: 'key', desc: '米拉年輕時寫的時間理論。' },
  antler: { name: '月鹿之角', type: 'key', desc: '在月光下會發亮的鹿角。' },
  photo: { name: '褪色的畫像', type: 'key', desc: '兩個女孩站在紅色的太陽下。' },
  unrungkey: { name: '未鳴之鑰', type: 'key', desc: '打開時隙之間最深處那扇門的鑰匙。' },
});
SHOPS.brass = ['hitonic', 'megatonic', 'ether', 'hiether', 'feather', 'antidote', 'clockoil', 'firebomb', 'icebomb', 'boltbomb', 'smokeball', 'brasssword', 'gearstaff', 'steambow', 'ivoryspear', 'brasscoat', 'antidoteamulet'];
SHOPS.camp = ['hitonic', 'megatonic', 'ether', 'feather', 'antidote', 'hastetonic', 'firebomb', 'smokeball', 'ivoryspear', 'ivorybow', 'brasscoat', 'iceward', 'fireward'];
SHOPS.ember = ['megatonic', 'godtonic', 'hiether', 'phoenix2', 'clockoil', 'hastetonic', 'bigbomb', 'boltbomb', 'emberlance', 'emberbow', 'griefscythe', 'emberblade', 'cinderwand', 'emberweave', 'voidward', 'steadyring'];
SHOPS.interval = ['megatonic', 'godtonic', 'hiether', 'phoenix2', 'clockoil', 'hastetonic', 'smokeball', 'bigbomb', 'counterbadge', 'regenring', 'hasteband'];
SHOPS.dryad = ['hitonic', 'megatonic', 'antidote', 'ether', 'feather', 'regenring'];

// ---------- monsters of the new eras ----------
// drops: [[item, chance], ...]; mech: special boss rules (see battle.js); summon: who a summoner calls
const ME = (o) => M({ drops: [], ...o });
Object.assign(MONSTERS, {
  // early places, a few more kinds
  woodspider: ME({ name: '林蛛', sprite: 'm2:spider', hp: 44, pow: 10, spd: 9, exp: 9, gold: 6, tp: 1, weak: ['fire'], acts: ['hit', 'web'], drops: [['beasthide', 0.1]] }),
  ruinrat: ME({ name: '廢墟鼠', sprite: 'm2:rat', hp: 120, pow: 19, spd: 14, exp: 30, gold: 16, tp: 3, weak: ['ice'], acts: ['hit', 'venom'], scale: 0.8 }),
  mushman: ME({ name: '毒蕈人', sprite: 'm2:mushroom', hp: 260, pow: 24, mag: 26, def: 14, mdf: 12, spd: 9, exp: 58, gold: 26, tp: 4, weak: ['fire'], acts: ['hit', 'spores'], scale: 1.3 }),
  poisonbeetle: ME({ name: '毒甲蟲', sprite: 'm2:beetle_poison', hp: 300, pow: 28, def: 26, spd: 10, exp: 60, gold: 28, tp: 4, weak: ['fire'], acts: ['hit', 'venom'], scale: 1.2, drops: [['chitin', 0.25]] }),
  plainlion: ME({ name: '草原母獅', sprite: 'm2:lioness', hp: 360, pow: 33, def: 14, spd: 15, exp: 70, gold: 30, tp: 4, weak: ['ice'], acts: ['hit', 'pounce'], drops: [['beasthide', 0.3]] }),
  // AD 1820 Brasshaven
  constable: ME({ name: '鐵腕巡警', sprite: 'c:constable', hp: 820, pow: 47, def: 28, mdf: 18, spd: 12, exp: 300, gold: 110, tp: 9, weak: ['bolt'], acts: ['hit', 'bash', 'hit'], drops: [['clockoil', 0.2]] }),
  automaton: ME({ name: '黃銅人偶', sprite: 'c:automaton', hp: 1250, pow: 50, def: 40, mdf: 16, spd: 9, exp: 360, gold: 120, tp: 10, weak: ['bolt', 'ice'], res: ['fire'], acts: ['hit', 'hit', 'gearstorm'], drops: [['brassgear', 0.45], ['springcoil', 0.2]] }),
  smuggler: ME({ name: '碼頭走私客', sprite: 'c:smuggler', hp: 760, pow: 48, def: 24, mdf: 20, spd: 16, exp: 300, gold: 160, tp: 9, weak: ['wind'], acts: ['hit', 'frenzy'], drops: [['smokeball', 0.3]] }),
  sewerrat: ME({ name: '下水道巨鼠', sprite: 'm2:rat', hp: 700, pow: 46, def: 22, spd: 15, exp: 280, gold: 90, tp: 9, weak: ['fire'], acts: ['hit', 'venom'], drops: [['beasthide', 0.3]] }),
  boilbeetle: ME({ name: '鍋爐甲蟲', sprite: 'm2:beetle_black', hp: 900, pow: 47, mag: 47, def: 44, mdf: 20, spd: 10, exp: 320, gold: 100, tp: 9, weak: ['ice'], res: ['fire'], acts: ['hit', 'steam'], scale: 1.3, drops: [['chitin', 0.35]] }),
  cogspider: ME({ name: '齒輪蛛', sprite: 'm2:spider2', hp: 780, pow: 47, mag: 45, def: 30, mdf: 20, spd: 14, exp: 310, gold: 100, tp: 9, weak: ['bolt'], acts: ['hit', 'web', 'venom'], drops: [['springcoil', 0.3]] }),
  smokeimp: ME({ name: '煤煙小鬼', sprite: 'm2:imp_green', hp: 640, pow: 40, mag: 50, def: 22, mdf: 30, spd: 15, exp: 300, gold: 100, tp: 9, weak: ['wind', 'light'], acts: ['flame', 'hit', 'shade'], drops: [['ether', 0.2]] }),
  gasghost: ME({ name: '煤氣幽靈', sprite: 'm2:ecto', hp: 600, pow: 30, mag: 51, def: 56, mdf: 22, spd: 13, exp: 320, gold: 100, tp: 9, weak: ['light', 'fire'], acts: ['shade', 'gas', 'shade'], drops: [['hollowglass', 0.25]] }),
  calder: ME({ name: '卡爾德教授', sprite: 'c:calder', hp: 7000, pow: 48, mag: 53, def: 30, mdf: 34, spd: 15, exp: 3600, gold: 2000, tp: 60, scale: 1.2, boss: true, music: 'boss2', weak: ['wind'], acts: ['zap', 'gearstorm', 'summon', 'zap', 'hit'], summon: ['automaton'], maxFoes: 2 }),
  regulator: ME({ name: '鑄鐵調節機', sprite: 'm2:golem', look: 'brass', hp: 9000, pow: 50, mag: 50, def: 34, mdf: 26, spd: 11, exp: 6000, gold: 3000, tp: 90, scale: 1.7, boss: true, mech: 'windup', weak: ['bolt'], res: ['fire'], acts: ['hit', 'gearstorm', 'windup', 'hit', 'quake'], drops: [['brassgear', 1]] }),
  ironchief: ME({ name: '鐵面隊長', sprite: 'c:constable', look: 'hue:160', hp: 7000, pow: 52, def: 34, mdf: 22, spd: 14, exp: 2800, gold: 1500, tp: 50, scale: 1.3, boss: true, music: 'boss2', weak: ['bolt'], acts: ['hit', 'bash', 'summon', 'frenzy'], summon: ['constable'], maxFoes: 3 }),
  fenwick: ME({ name: '芬維克七號', sprite: 'c:automaton', look: 'hue:250', hp: 7500, pow: 51, mag: 51, def: 46, mdf: 30, spd: 12, exp: 3000, gold: 1500, tp: 50, scale: 1.4, boss: true, music: 'boss2', mech: 'windup', weak: ['ice'], res: ['bolt'], acts: ['hit', 'laser', 'windup', 'gearstorm'] }),
  // 30000 BC Frostcradle
  snowwolf: ME({ name: '霜原狼', sprite: 'm2:wolf2', look: 'frost', hp: 1400, pow: 54, def: 28, mdf: 22, spd: 19, exp: 460, gold: 120, tp: 11, weak: ['fire'], res: ['ice'], acts: ['hit', 'frenzy', 'icebite'], drops: [['beasthide', 0.4]] }),
  snowfox: ME({ name: '雪狐', sprite: 'm2:fox', hp: 1150, pow: 51, mag: 52, def: 26, mdf: 30, spd: 22, exp: 440, gold: 110, tp: 11, weak: ['fire'], res: ['ice'], acts: ['icebite', 'hit', 'frostbreath'], drops: [['frostcrystal', 0.25]] }),
  icebear: ME({ name: '冰原熊', sprite: 'm2:bear_polar', hp: 2800, pow: 60, def: 34, mdf: 22, spd: 10, exp: 620, gold: 150, tp: 12, weak: ['fire'], res: ['ice'], acts: ['hit', 'maul', 'roar'], drops: [['beasthide', 0.5], ['mammothivory', 0.1]] }),
  raider: ME({ name: '霜牙掠奪者', sprite: 'c:raider', hp: 1900, pow: 57, def: 32, mdf: 24, spd: 14, exp: 540, gold: 180, tp: 11, weak: ['fire'], acts: ['hit', 'cleave', 'roar'], drops: [['hitonic', 0.2], ['mammothivory', 0.12]] }),
  icebeetle: ME({ name: '冰甲蟲', sprite: 'm2:beetle_ice', hp: 1700, pow: 53, mag: 53, def: 62, mdf: 24, spd: 11, exp: 500, gold: 130, tp: 11, weak: ['fire'], res: ['ice'], acts: ['hit', 'frostbreath'], scale: 1.3, drops: [['frostcrystal', 0.4], ['chitin', 0.3]] }),
  aurochs: ME({ name: '冰原野牛', sprite: 'm2:bull', look: 'hue:30', hp: 3000, pow: 58, def: 36, mdf: 18, spd: 11, exp: 640, gold: 140, tp: 12, weak: ['bolt'], acts: ['hit', 'charge', 'charge'], scale: 0.8, drops: [['beasthide', 0.5]] }),
  cavespider: ME({ name: '雪洞蜘蛛', sprite: 'm2:spider3', look: 'frost', hp: 1500, pow: 53, mag: 51, def: 34, mdf: 30, spd: 16, exp: 500, gold: 120, tp: 11, weak: ['fire'], acts: ['hit', 'web', 'venom'], drops: [['shadowsilk', 0.2]] }),
  icewing: ME({ name: '冰窟飛魔', sprite: 'm2:flier', look: 'frost', hp: 1400, pow: 47, mag: 56, def: 30, mdf: 40, spd: 17, exp: 520, gold: 130, tp: 11, weak: ['fire', 'light'], res: ['ice'], acts: ['frostbreath', 'drain', 'hit'], drops: [['frostcrystal', 0.3]] }),
  moonelk: ME({ name: '月鹿', sprite: 'm2:deer', look: 'frost', hp: 12000, pow: 55, mag: 57, def: 34, mdf: 44, spd: 18, exp: 3000, gold: 800, tp: 50, scale: 1.4, boss: true, music: 'boss2', weak: ['dark'], res: ['ice', 'light'], acts: ['charge', 'lumenlight', 'hit', 'mendself'] }),
  packmother: ME({ name: '雪鬃狼后', sprite: 'm2:wolf', look: 'frost', hp: 8000, pow: 58, def: 34, mdf: 28, spd: 20, exp: 3200, gold: 900, tp: 55, scale: 1.8, boss: true, music: 'boss2', weak: ['fire'], res: ['ice'], acts: ['frenzy', 'icebite', 'summon', 'roar', 'hit'], summon: ['snowwolf'], maxFoes: 3 }),
  rimeback: ME({ name: '霜脊巨熊', sprite: 'm2:bear_polar', look: 'frost', hp: 12000, pow: 63, mag: 57, def: 40, mdf: 30, spd: 12, exp: 9000, gold: 4000, tp: 110, scale: 2.0, boss: true, mech: 'icearmor', weak: ['fire'], res: ['ice'], acts: ['maul', 'frostbreath', 'icearmor', 'hit', 'quake', 'summon'], summon: ['snowwolf'], maxFoes: 2, drops: [['frostcrystal', 1], ['mammothivory', 1]] }),
  // AD 9000 Emberfall
  emberimp: ME({ name: '餘燼惡魔', sprite: 'm2:imp_red', hp: 2200, pow: 57, mag: 64, def: 34, mdf: 40, spd: 18, exp: 760, gold: 170, tp: 13, weak: ['ice'], res: ['fire'], acts: ['flame', 'hit', 'ember'], drops: [['embercore', 0.25]] }),
  acolyte: ME({ name: '寂靜信徒', sprite: 'c:acolyte', hp: 2000, pow: 50, mag: 65, def: 30, mdf: 46, spd: 15, exp: 760, gold: 200, tp: 13, weak: ['light'], res: ['dark'], acts: ['hushwave', 'mendfoe', 'shade'], drops: [['shadowsilk', 0.3], ['hiether', 0.08]] }),
  ashlion: ME({ name: '灰燼獅', sprite: 'm2:lion', look: 'ember', hp: 3100, pow: 64, def: 36, mdf: 26, spd: 17, exp: 820, gold: 180, tp: 13, weak: ['ice'], res: ['fire'], acts: ['hit', 'pounce', 'roar'], drops: [['beasthide', 0.4]] }),
  lavabeetle: ME({ name: '熔岩甲蟲', sprite: 'm2:beetle_fire', hp: 2600, pow: 61, mag: 61, def: 70, mdf: 28, spd: 12, exp: 800, gold: 170, tp: 13, weak: ['ice'], res: ['fire'], acts: ['hit', 'steam', 'ember'], scale: 1.4, drops: [['embercore', 0.3], ['chitin', 0.4]] }),
  lavapede: ME({ name: '熔岩蜈蚣', sprite: 'm2:centipede', hp: 3400, pow: 63, def: 42, mdf: 30, spd: 14, exp: 860, gold: 190, tp: 13, weak: ['ice'], res: ['fire'], acts: ['hit', 'venom', 'charge'], scale: 0.8, drops: [['embercore', 0.25]] }),
  ashwraith: ME({ name: '灰翼惡靈', sprite: 'm2:batdemon', look: 'ember', hp: 2300, pow: 58, mag: 62, def: 32, mdf: 40, spd: 19, exp: 780, gold: 170, tp: 13, weak: ['light'], res: ['dark'], acts: ['drain', 'hit', 'shade'], drops: [['shadowsilk', 0.25]] }),
  husk: ME({ name: '熄滅巨像', sprite: 'm2:golem', look: 'dark', hp: 4400, pow: 66, def: 62, mdf: 26, spd: 9, exp: 960, gold: 220, tp: 14, weak: ['bolt'], acts: ['hit', 'quake'], scale: 1.1, drops: [['starshard', 0.3]] }),
  lumenshade: ME({ name: '露明之影', sprite: 'c:lumen', look: 'dark', hp: 13500, pow: 55, mag: 66, def: 36, mdf: 46, spd: 17, exp: 8000, gold: 3000, tp: 100, scale: 1.25, boss: true, music: 'dread', weak: ['light'], res: ['dark'], acts: ['drainall', 'lumenlight', 'curse', 'stopwatch', 'drainall'] }),
  griefengine: ME({ name: '悲鳴機關', sprite: 'c:automaton', look: 'void', hp: 14000, pow: 65, mag: 65, def: 44, mdf: 40, spd: 14, exp: 14000, gold: 6000, tp: 140, scale: 1.9, boss: true, mech: 'shift', weak: ['fire'], res: [], acts: ['gearstorm', 'hushwave', 'hit', 'ember', 'frostbreath', 'stopall'], drops: [['embercore', 1], ['timesand', 1]] }),
  // the Heart of the Hush, past the end of time
  deathknight: ME({ name: '終末騎士', sprite: 'c:deathknight', hp: 5200, pow: 71, def: 50, mdf: 34, spd: 15, exp: 1300, gold: 260, tp: 16, weak: ['light', 'fire'], res: ['dark'], acts: ['hit', 'cleave', 'hit'], drops: [['starshard', 0.3], ['phoenix2', 0.05]] }),
  timebound: ME({ name: '時縛者', sprite: 'c:mummy', hp: 4800, pow: 67, mag: 62, def: 40, mdf: 40, spd: 11, exp: 1200, gold: 240, tp: 16, weak: ['fire'], acts: ['hit', 'curse', 'venom'], drops: [['timesand', 0.25]] }),
  weaver: ME({ name: '時織蛛后', sprite: 'm2:arachne', hp: 4600, pow: 65, mag: 68, def: 40, mdf: 44, spd: 17, exp: 1300, gold: 250, tp: 16, weak: ['fire'], acts: ['web', 'venom', 'shade', 'hit'], scale: 1.1, drops: [['shadowsilk', 0.5]] }),
  voidspider: ME({ name: '虛空蛛', sprite: 'm2:spider', look: 'void', hp: 3800, pow: 66, def: 40, mdf: 38, spd: 18, exp: 1150, gold: 220, tp: 15, weak: ['light'], res: ['dark'], acts: ['hit', 'web', 'venom'], drops: [['hollowglass', 0.3]] }),
  echoshade: ME({ name: '寂靜殘響', sprite: 'm2:ecto', look: 'void', hp: 3600, pow: 52, mag: 70, def: 70, mdf: 36, spd: 16, exp: 1200, gold: 230, tp: 15, weak: ['light'], res: ['dark'], acts: ['shade', 'hushwave', 'stopwatch'], drops: [['hollowglass', 0.35]] }),
  voidwing: ME({ name: '虛無飛影', sprite: 'm2:flier', look: 'void', hp: 4000, pow: 64, mag: 67, def: 38, mdf: 46, spd: 19, exp: 1250, gold: 240, tp: 15, weak: ['light'], acts: ['drain', 'gaze', 'hit'], drops: [['timesand', 0.2]] }),
  echobear: ME({ name: '回聲巨熊', sprite: 'm2:bear_grizzly', look: 'void', hp: 6000, pow: 72, def: 46, mdf: 30, spd: 12, exp: 1400, gold: 260, tp: 16, weak: ['light'], acts: ['maul', 'hit', 'roar'], drops: [['beasthide', 0.5]] }),
  echowarden: ME({ name: '看守者的回聲', sprite: 'c:golem', look: 'void', hp: 21000, pow: 70, def: 52, mdf: 36, spd: 12, exp: 9000, gold: 3000, tp: 100, scale: 1.5, boss: true, music: 'boss2', weak: ['bolt', 'light'], acts: ['hit', 'quake', 'harden', 'hit'] }),
  echohorn: ME({ name: '石角的回聲', sprite: 'c:minotaur', look: 'void', hp: 18000, pow: 73, def: 48, mdf: 36, spd: 13, exp: 9000, gold: 3000, tp: 100, scale: 1.5, boss: true, music: 'boss2', weak: ['ice', 'light'], acts: ['hit', 'charge', 'quake', 'roar'] }),
  choir: ME({ name: '空洞合唱', sprite: 'm:ghost', look: 'void', hp: 12000, pow: 57, mag: 64, def: 60, mdf: 50, spd: 15, exp: 11000, gold: 4000, tp: 120, scale: 2.4, boss: true, music: 'boss2', weak: ['light'], res: ['dark'], acts: ['hushwave', 'silencebell', 'summon', 'shade', 'erase'], summon: ['echoshade'], maxFoes: 2 }),
  colossus: ME({ name: '寂靜巨像', sprite: 'm2:golem', look: 'void', hp: 18000, pow: 76, mag: 70, def: 54, mdf: 44, spd: 13, exp: 0, gold: 0, tp: 0, scale: 2.4, boss: true, music: 'finalboss', mech: 'windup', weak: ['light'], res: ['dark'], acts: ['hit', 'quake', 'windup', 'stopall', 'gearstorm'] }),
  unborn: ME({ name: '未生的寂靜', sprite: 'm:eyeball', look: 'void', hp: 18000, pow: 66, mag: 66, def: 50, mdf: 50, spd: 16, exp: 0, gold: 0, tp: 0, scale: 3.6, boss: true, final: true, music: 'finalboss', mech: 'shift', weak: ['light'], res: ['dark'], acts: ['stillness', 'gaze', 'devour', 'erase', 'stopall', 'silencebell'] }),
  // after the end
  eternal: ME({ name: '永恆的蓮', sprite: 'c:ren', look: 'void', hp: 42000, pow: 78, mag: 74, def: 64, mdf: 60, spd: 20, exp: 50000, gold: 30000, tp: 300, scale: 1.4, boss: true, music: 'superboss', mech: 'shift', weak: ['light'], res: ['dark'], acts: ['frenzy', 'eternity', 'stopall', 'erase', 'gaze', 'summon', 'hit'], summon: ['echoshade', 'deathknight'], maxFoes: 2 }),
});
Object.assign(MOVES, {
  web: { name: '蛛網', area: 'one', kind: 'mag', pow: 0.6, slow: 0.7 },
  bash: { name: '警棍', area: 'one', kind: 'phys', pow: 1.15, melee: true, stun: 0.25 },
  steam: { name: '蒸氣', area: 'all', kind: 'mag', pow: 0.8, el: 'fire' },
  gas: { name: '煤氣', area: 'all', kind: 'mag', pow: 0.6, poison: 0.45 },
  gearstorm: { name: '齒輪風暴', area: 'all', kind: 'phys', pow: 0.95 },
  icebite: { name: '冰牙', area: 'one', kind: 'phys', pow: 1.1, melee: true, el: 'ice', freeze: 0.3 },
  frostbreath: { name: '寒冰吐息', area: 'all', kind: 'mag', pow: 0.95, el: 'ice', freeze: 0.12 },
  maul: { name: '重爪', area: 'one', kind: 'phys', pow: 1.55, melee: true },
  roar: { name: '咆哮', area: 'self', kind: 'buff', buff: 'pow' },
  cleave: { name: '劈砍', area: 'line', kind: 'phys', pow: 1.2, melee: true },
  pounce: { name: '飛撲', area: 'one', kind: 'phys', pow: 1.35, melee: true },
  ember: { name: '餘燼雨', area: 'all', kind: 'mag', pow: 1.0, el: 'fire' },
  mendfoe: { name: '黑色祈禱', area: 'self', kind: 'healfoe', pow: 0.18 },
  mendself: { name: '月光', area: 'self', kind: 'healfoe', pow: 0.08 },
  curse: { name: '時縛', area: 'one', kind: 'mag', pow: 1.0, el: 'dark', slow: 0.8 },
  drainall: { name: '吸取回憶', area: 'all', kind: 'mag', pow: 0.85, el: 'dark', drain: true },
  lumenlight: { name: '殘光', area: 'all', kind: 'mag', pow: 1.15, el: 'light' },
  erase: { name: '抹消', area: 'all', kind: 'mag', pow: 0.8, el: 'dark', erase: true },
  stopall: { name: '萬物停擺', area: 'all', kind: 'mag', pow: 0.6, el: 'dark', stun: 0.35 },
  eternity: { name: '永恆正午', area: 'all', kind: 'mag', pow: 1.5, el: 'light' },
  windup: { name: '上緊發條', area: 'self', kind: 'charge' },
  overclock: { name: '全力運轉', area: 'all', kind: 'phys', pow: 1.7 },
  icearmor: { name: '冰甲', area: 'self', kind: 'armor' },
  summon: { name: '呼喚', area: 'self', kind: 'summon' },
});

localize(HEROES, { nilo: ['Nilo'], vesper: ['Vesper'] });
localize(TECHS, {
  quakeblade: ['Quake Blade', 'The sword splits the ground; the crack races into the foes.'], heartbell: ['Heart Bell', 'The little bell Ren made himself: friends speed up and slowly heal.'],
  lasthour: ['Last Hour', "All of the last moment's light pressed into one cut."], warmth: ['Warm Sun', 'Warm light heals every friend and cures poison and slowness.'],
  timeslow: ['Slow Ring', 'Draws a ring of slow time round the target; foes inside slow down.'], supernova: ['Supernova', 'A star is born and dies among the foes.'],
  pilfer: ['Pilfer', 'Lifts something off a foe.'], barrier: ['Force Field', "Hattie's watch throws a field: less damage for three turns."],
  railstorm: ['Rail Storm', 'Runs a whole line of foes through at once.'], snare: ['Vine Snare', 'Vines bind the foes round the target and slow them.'],
  dawnsong: ['Dawn Song', 'The dawn song on the First Bone Whistle wakes even fallen friends.'], skyfall: ['Skyfall', 'Arrows shot into the sky fall as rain.'],
  pierce: ['Frost Pierce', 'A cold thrust through a whole line.'], frostwall: ['Frost Wall', 'A wall of ice: less damage for everyone for two turns.'],
  mammothcall: ['Mammoth Charge', 'Charges through like a mammoth.'], blizzard: ['Blizzard', 'Snow and ice strike every foe and may freeze them.'],
  glacier: ['Glacier Lance', 'A thrust as heavy as a glacier.'], hearth: ['Hearth', 'Like sitting round a campfire: everyone heals over time.'],
  aurora: ['Aurora', 'The sky opens and the northern lights fall on the foes.'], reap: ['Reap', 'The scythe turns once round, cutting every foe nearby.'],
  hourglass: ['Turned Glass', "Turns a foe's hourglass over and slows it."], mourn: ['Lament', 'A sad song hurts foes and brings a little life back.'],
  stillhand: ['Still Hand', "Stops the foes' clock hands for a moment."], eclipse: ['Eclipse', 'A black sun swallows the foes.'],
  farewell: ['Farewell', 'Only one who has said goodbye can bring everyone back.'], endtime: ['End of Days', 'Everything ends; that is why this cut means something.'],
});
localize(COMBOS, {
  glacierblade: ['Glacier Blade', "Nilo's cold freezes the blade; one cut splits a whole line."], twilight: ['Twilight Edge', 'Light and shadow cross: a huge blow on one foe.'],
  steamburst: ['Steam Burst', 'Ice meets fire and bursts into scalding steam.'], blackflame: ['Black Flame', 'Black fire that never burns out.'],
  supercool: ['Supercooled Net', 'A freezing net of lightning that may stun.'], stopcircuit: ['Stopped Circuit', "Lightning stops every foe's clock hands at once."],
  huntsong: ["Hunters' Song", 'Hunters from two ages strike with arrow and spear together.'], moonarrow: ['New Moon Arrow', 'An arrow loosed on a moonless night.'],
  coldelegy: ['Frozen Elegy', 'Snow and a lament fall together and bring back a little life.'], sunrisebell: ['Sunrise Bell', 'The bell rings as the sun comes up.'],
  railblade: ['Rail Blade', 'Through the rift with a full charge of lightning.'], windchime: ['Wind Chime', 'A whirlwind carries the bell across the field.'],
  lifebloom: ['Life Bloom', 'Flowers open one by one; even the fallen stand up.'], trinity: ['Three Hours', 'Beginning, now and ending: the sounds of three ages together.'],
  frontier: ['Frontier Trio', 'Sword, bow and spear play together on the open plain.'], requiem: ['Twilight Requiem', 'Fire, lightning and shadow see the foes off.'],
  auroraveil: ['Aurora Veil', 'The northern lights cover everyone, healing and shielding.'], dawnbreak: ['Daybreak', 'The first light after the long night.'],
  worldsend: ["World's End", 'Frost, thunder and dark: a song that ends everything.'],
});
localize(ITEMS, {
  megatonic: ['Mega Tonic', 'Restores 480 HP.'], godtonic: ['Sage Herb', 'Fully restores HP.'], hiether: ['Hour Spring', 'Restores 60 MP.'], antidote: ['Antidote', 'Cures poison and slowness.'],
  clockoil: ['Clock Oil', 'Cures poison and slowness, then restores 120 HP.'], phoenix2: ['Undying Plume', 'A fallen friend gets up with all their HP.'],
  hastetonic: ['Haste Draught', 'In battle: faster for three turns.'], firebomb: ['Fire Bomb', 'In battle: burns the foes round the target (fire).'],
  icebomb: ['Frost Bomb', 'In battle: freezes the foes round the target (ice).'], boltbomb: ['Thunder Bomb', 'In battle: shocks the foes round the target (thunder).'],
  bigbomb: ['Great Bell Bomb', 'In battle: one huge peal strikes every foe (light).'], smokeball: ['Smoke Ball', 'In battle: a sure escape (not from bosses).'],
  minnow: ['Minnow', 'Restores 40 HP. Grill it and eat.'], trout: ['Trout', 'Restores 150 HP.'], icefish: ['Icefish', 'Restores 30 MP. Nice and cold.'],
  goldcarp: ['Golden Carp', 'A shining carp. Sells for a good price.'], timefish: ['Timefish', 'A fish from the river of time. Fully restores HP and MP for everyone.'],
  starshard: ['Star Shard', 'A chip of star-iron. Forging material.'], brassgear: ['Brass Gear', 'A Brasshaven cog. Forging material.'], springcoil: ['Spring Coil', 'A tightly wound spring. Forging material.'],
  mammothivory: ['Mammoth Ivory', 'Ivory from the age of ice. Forging material.'], frostcrystal: ['Frost Crystal', 'Ice that never melts. Forging material.'],
  embercore: ['Ember Core', 'Ash that is still warm. Forging material.'], shadowsilk: ['Shadow Silk', 'Silk spun from shadows. Forging material.'], beasthide: ['Beast Hide', 'Thick, warm hide. Forging material.'],
  chitin: ['Chitin', 'A beetle\'s hard shell. Forging material.'], hollowglass: ['Hollow Glass', 'Glass with nothing at all inside. Forging material.'], timesand: ['Time Sand', 'Time that trickled out of an hourglass. Forging material.'],
  brasssword: ['Brass Sword'], frostbrand: ['Frostbrand', 'A sword of glacier cold.'], emberblade: ['Ember Blade', 'A sword that is still burning.'], hourblade: ['Hour Blade', 'A sword that cuts the cracks in time.'],
  gearstaff: ['Gear Staff'], aurorarod: ['Aurora Rod'], cinderwand: ['Cinder Wand'], sagestaff: ["Sage's Sceptre"], steambow: ['Steam Crossbow'], frostbow: ['Frost Crossbow'], plasmabow: ['Plasma Crossbow'],
  ivorybow: ['Ivory Bow'], emberbow: ['Ember Bow'], dawnbow: ['Daybreak Bow'], flintspear: ['Flint Spear'], ivoryspear: ['Ivory Spear'], frostlance: ['Frost Lance'], emberlance: ['Ember Lance'], starlance: ['Star Lance'],
  duskscythe: ['Dusk Scythe'], griefscythe: ['Grief Scythe'], endscythe: ['Scythe of Endings'], furcoat: ['Fur Coat'], mourncloak: ['Mourning Cloak'], brasscoat: ['Brass Plate'],
  mammothhide: ['Mammoth Hide', 'Heavy and warm. HP +80'], emberweave: ['Emberweave'], starmail: ['Star Mail', 'Armour beaten from star shards and time sand.'],
  antidoteamulet: ['Antidote Charm', 'Never poisoned.'], steadyring: ['Steady Ring', 'Never stunned or frozen.'], hasteband: ['Gale Bracelet', 'Fast from the start of each battle.'],
  regenring: ['Regen Ring', 'Restores a little HP every turn.'], spiritcharm: ['Spirit Loop', 'Techniques cost half the MP.'], luckycoin: ['Lucky Coin', 'Twice the gold from battles.'],
  scholarpin: ["Scholar's Pin", 'Half again as much EXP from battles.'], counterbadge: ['Counter Badge', 'Sometimes strikes back when hit.'], firstbell: ['First Bell', 'The gauge starts full in every battle.'],
  fireward: ['Fire Ward', 'Half damage from fire.'], iceward: ['Frost Ward', 'Half damage from ice.'], voidward: ['Shadow Ward', 'Half damage from shadow.'], critlens: ["Hawk's Lens", 'Critical hits come more often. Speed +1'],
  renbell: ["Ren's Little Bell", 'The first bell Ren made himself. HP +120, Power +4, heals every turn.'],
  hattiewatch: ["Hattie's Watch", "Made by Silas's great-great-great-grandmother. Speed +3, Magic +4, fast from the start."],
  songbone: ['First Bone Whistle', 'The very first bone flute. Magic +8, Power +4, the gauge starts full.'],
  lumenstar: ["Lumen's Star", 'A pendant left by a little sister. M.Def +12, Magic +6, half shadow damage.'],
  miraquill: ["Mira's Quill", 'A quill that wrote pages of time theory. Magic +10, half MP costs.'],
  mammothtusk: ['Mammoth Tusk Charm', 'Friendship between Nilo and a mammoth calf. Power +10, Defence +6, strikes back.'],
  hourkey1: ['Brass Key', 'One of the Hour-Keys, taken from the heart of the Regulator.'], hourkey2: ['Frost Key', 'One of the Hour-Keys: a tear shed as the mother-stone fell asleep.'],
  hourkey3: ['Ember Key', 'One of the Hour-Keys: the last cog of the Grief Engine.'], acorn: ['Ancient Acorn', 'From Grandmother Ama. She says it grows into a tree that remembers time.'],
  valvekey: ['Sluice Wrench', "The wrench for the foundry's floodgate."], rod: ['Fishing Rod', 'Fish at ice holes and lakesides where fish swim.'],
  notes: ["Mira's Notes", 'Time theory Mira wrote when she was young.'], antler: ['Moon Elk Antler', 'An antler that glows in moonlight.'],
  photo: ['Faded Portrait', 'Two girls under a red sun.'], unrungkey: ['Unrung Key', 'The key to the deepest door of the Hour Between.'],
});
localize(MONSTERS, {
  woodspider: ['Wood Spider'], ruinrat: ['Ruin Rat'], mushman: ['Toadstool Man'], poisonbeetle: ['Venom Beetle'], plainlion: ['Plains Lioness'],
  constable: ['Iron Constable'], automaton: ['Brass Automaton'], smuggler: ['Dock Smuggler'], sewerrat: ['Sewer Rat'], boilbeetle: ['Boiler Beetle'], cogspider: ['Cog Spider'],
  smokeimp: ['Soot Imp'], gasghost: ['Gaslight Ghost'], calder: ['Professor Calder'], regulator: ['The Iron Regulator'], ironchief: ['Captain Ironface'], fenwick: ['Fenwick Seven'],
  snowwolf: ['Tundra Wolf'], snowfox: ['Snow Fox'], icebear: ['Ice Bear'], raider: ['Frostfang Raider'], icebeetle: ['Ice Beetle'], aurochs: ['Tundra Aurochs'], cavespider: ['Snowcave Spider'],
  icewing: ['Icecave Flier'], moonelk: ['Moon Elk'], packmother: ['Snowmane Matriarch'], rimeback: ['Rimeback'],
  emberimp: ['Ember Fiend'], acolyte: ['Hush Acolyte'], ashlion: ['Ash Lion'], lavabeetle: ['Lava Beetle'], lavapede: ['Lava Centipede'], ashwraith: ['Ashwing Wraith'], husk: ['Burnt-out Colossus'],
  lumenshade: ["Lumen's Shade"], griefengine: ['The Grief Engine'], deathknight: ['Last Knight'], timebound: ['Timebound'], weaver: ['Time Weaver'], voidspider: ['Void Spider'],
  echoshade: ['Echo of the Hush'], voidwing: ['Void Wing'], echobear: ['Echo Bear'], echowarden: ['Echo of the Warden'], echohorn: ['Echo of Stonehorn'], choir: ['The Hollow Choir'],
  colossus: ['The Silent Colossus'], unborn: ['Hush, Unborn'], eternal: ['Ren Eternal'],
}, ['name']);
localize(MOVES, {
  web: ['Web'], bash: ['Truncheon'], steam: ['Steam'], gas: ['Gas Leak'], gearstorm: ['Gear Storm'], icebite: ['Ice Fang'], frostbreath: ['Frost Breath'], maul: ['Maul'], roar: ['Roar'],
  cleave: ['Cleave'], pounce: ['Pounce'], ember: ['Ember Rain'], mendfoe: ['Black Prayer'], mendself: ['Moonlight'], curse: ['Time Bind'], drainall: ['Drink Memories'], lumenlight: ['Afterglow'],
  erase: ['Erase'], stopall: ['All Clocks Stop'], eternity: ['Eternal Noon'], windup: ['Wind Up'], overclock: ['Full Power'], icearmor: ['Ice Armour'], summon: ['Call'],
}, ['name']);
