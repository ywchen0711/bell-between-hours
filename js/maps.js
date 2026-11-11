// Every place in the three eras. Each map is painted with a few helpers (fill a rectangle with a ground
// letter, draw a path, scatter trees), then lists what stands on it: props, houses, people, chests,
// monster groups, doors to other maps and story triggers. Coordinates are in 32px tiles.
import { L } from './i18n.js';

// ground letters
export const LEGEND = {
  g: 'grass', d: 'dirt', D: 'darkdirt', s: 'sand', w: 'water', h: 'hole', v: 'void', l: 'lava', k: 'rock', m: 'moss', u: 'murk',
  c: 'floor:cobble', f: 'floor:stone', p: 'floor:plank', t: 'floor:tiles', F: 'floor:flag', b: 'floor:slab',
  '#': 'wall:brick', S: 'wall:stone', C: 'wall:cave', W: 'wall:white', O: 'wall:wood',
};
export const BLOCK = new Set(['w', 'h', 'v', 'l', 'u', '#', 'S', 'C', 'W', 'O']);

function grid(w, h, ch) { return Array.from({ length: h }, () => Array(w).fill(ch)); }
function rect(g, x, y, w, h, ch) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j] && g[j][i] !== undefined) g[j][i] = ch; }
// a path through points, `r` tiles either side
function path(g, pts, ch, r = 1) {
  for (let k = 0; k < pts.length - 1; k++) {
    const [x0, y0] = pts[k], [x1, y1] = pts[k + 1], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let s = 0; s <= n; s++) { const x = Math.round(x0 + (x1 - x0) * s / n), y = Math.round(y0 + (y1 - y0) * s / n); rect(g, x - r + 1, y - r + 1, r * 2 - 1 + (r > 1 ? 0 : 0), r * 2 - 1, ch); }
  }
}
function blob(g, cx, cy, rx, ry, ch, rough = 0.25, seed = 1) {
  for (let j = Math.floor(cy - ry - 1); j <= cy + ry + 1; j++) for (let i = Math.floor(cx - rx - 1); i <= cx + rx + 1; i++) {
    const a = Math.atan2(j - cy, i - cx), k = 1 + Math.sin(a * 3 + seed) * rough * 0.6 + Math.sin(a * 5 + seed * 2) * rough * 0.4;
    if (((i - cx) / rx) ** 2 + ((j - cy) / ry) ** 2 <= k * k && g[j] && g[j][i] !== undefined) g[j][i] = ch;
  }
}
const rnd = (seed) => { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };
// trees all round the edge, `depth` deep, leaving gaps
function border(props, w, h, kinds, depth, gaps, seed) {
  const r = rnd(seed), open = (x, y) => gaps.some(([gx, gy, gw, gh]) => x >= gx - 1 && x < gx + gw + 1 && y >= gy - 1 && y < gy + gh + 1);
  for (let y = -1; y < h + 1; y += 2) for (let x = -1; x < w + 1; x += 2) {
    const edge = x < depth || y < depth + 1 || x >= w - depth || y >= h - depth;
    if (!edge || open(x, y)) continue;
    props.push([kinds[Math.floor(r() * kinds.length)], x + (r() < 0.5 ? 0 : 1) - 1, y + 1]);
  }
}
// trees dotted about where the ground is one of `on`, kept off paths and away from `avoid` rectangles
function scatter(props, g, n, kinds, on, avoid, seed, gap = 2) {
  const r = rnd(seed), h = g.length, w = g[0].length, taken = [];
  for (let k = 0; k < n * 8 && taken.length < n; k++) {
    const x = 1 + Math.floor(r() * (w - 3)), y = 2 + Math.floor(r() * (h - 3));
    if (!on.includes(g[y][x]) || !on.includes(g[y][x + 1] || '')) continue;
    if (avoid.some(([ax, ay, aw, ah]) => x >= ax - 1 && x < ax + aw + 1 && y >= ay - 2 && y < ay + ah + 1)) continue;
    if (taken.some(([tx, ty]) => Math.abs(tx - x) < gap && Math.abs(ty - y) < gap)) continue;
    taken.push([x, y]); props.push([kinds[Math.floor(r() * kinds.length)], x, y]);
  }
}
const rows = (g) => g.map((r) => r.join(''));

export const MAPS = {};
const def = (id, f) => { MAPS[id] = { id, ...f() }; };

// ======================= THE PRESENT: AD 1250 =======================
def('workshop', () => {
  const g = grid(14, 11, 'p');
  rect(g, 0, 0, 14, 2, '#'); rect(g, 0, 0, 1, 11, '#'); rect(g, 13, 0, 1, 11, '#'); rect(g, 0, 10, 14, 1, '#'); rect(g, 6, 10, 2, 1, 'p');
  return {
    name: ['奧林鐘錶工坊', "Orrin's Clockworks"], era: 'present', music: 'home', base: 'floor:plank', order: ['floor:plank', 'wall:brick'], rows: rows(g), inside: true,
    props: [['books', 1, 2], ['shelf', 3, 2], ['table', 5, 4], ['barrel', 11, 2], ['barrel', 12, 2], ['bed', 11, 8], ['stove', 1, 8], ['vase', 9, 2], ['plant', 12, 4]],
    deco: [{ kind: 'clock', x: 8, y: 1 }, { kind: 'clock', x: 10, y: 1, small: true }],
    npcs: [{ id: 'orrin', sprite: 'orrin', x: 7, y: 5, dir: 'd', talk: 'orrin', unless: 'present_frozen_done' }],
    warps: [{ x: 6, y: 10, w: 2, h: 1, to: 'lantern', tx: 7.5, ty: 10.6, dir: 'd' }],
    events: [{ x: 1, y: 2, w: 4, h: 2, run: 'readShelf', touch: false }],
  };
});

def('lantern', () => {
  const g = grid(40, 30, 'g');
  rect(g, 12, 11, 16, 10, 'f'); path(g, [[0, 15], [12, 15]], 'd', 2); path(g, [[28, 15], [39, 15]], 'd', 2);
  path(g, [[20, 8], [20, 11]], 'f', 2); path(g, [[7, 10], [7, 14]], 'd', 1); path(g, [[33, 10], [33, 14]], 'd', 1); path(g, [[7, 18], [7, 24]], 'd', 1); path(g, [[32, 18], [32, 25]], 'd', 1);
  blob(g, 33, 26, 3, 1.6, 'w', 0.2, 3); blob(g, 4, 3, 2, 1.2, 'w', 0.2, 5);
  const props = [], avoid = [[3, 4, 6, 6], [30, 4, 6, 6], [4, 19, 5, 6], [29, 20, 5, 6], [16, 0, 8, 10], [11, 10, 18, 12], [0, 13, 40, 5]];
  border(props, 40, 30, ['pine', 'oak', 'pine2', 'sapling'], 1, [[38, 13, 2, 5]], 11);
  scatter(props, g, 16, ['oak', 'cherry', 'sapling', 'bush'], ['g'], avoid, 21, 3);
  props.push(['stall', 13, 13], ['stall', 25, 13], ['crates', 14, 20], ['fountain', 19, 16], ['lamppost', 12, 11], ['lamppost', 27, 11], ['lamppost', 12, 20], ['lamppost', 27, 20],
    ['bigbarrels', 9, 7], ['cart', 27, 8], ['innsign', 35, 8], ['potsign', 12, 12], ['flowers', 21, 9], ['flowers', 15, 9], ['sign', 37, 13], ['well', 10, 24], ['reeds', 30, 27], ['reeds', 36, 26]);
  return {
    name: ['燈河鎮', 'Lanternford'], era: 'present', music: 'town', base: 'grass', order: ['dirt', 'water', 'floor:stone'], rows: rows(g),
    houses: [{ x: 3, y: 4, w: 6, to: 'workshop', tx: 6.5, ty: 9.2 }, { x: 30, y: 4, w: 6 }, { x: 4, y: 19, w: 5 }, { x: 29, y: 20, w: 6 }, { x: 17, y: 3, w: 7, style: 'stone', to: 'tower', tx: 7.5, ty: 10.2, tower: true }],
    props,
    deco: [{ kind: 'spire', x: 20.5, y: 5 }, { kind: 'clock', x: 20.5, y: 5.5, big: true }, { kind: 'rift', x: 20, y: 18, if: 'rift_lantern', unless: 'freeTravelNo' }, { kind: 'festival', x: 12, y: 11, w: 16, unless: 'bell_rung' }],
    npcs: [
      { id: 'mira', sprite: 'mira', x: 18, y: 14, dir: 'u', talk: 'miraPlaza', if: 'met_orrin', unless: 'has_mira' },
      { id: 'queen', sprite: 'queen', x: 20, y: 12, dir: 'd', talk: 'queen', if: 'fork_back', unless: 'bell_rung' },
      { id: 'guard1', sprite: 'guard', x: 19, y: 10, dir: 'd', talk: 'guardTower', unless: 'bell_rung' },
      { id: 'merchant', sprite: 'merchant', x: 14, y: 15, dir: 'd', talk: 'shopLantern' },
      { id: 'innkeep', sprite: 'innkeep', x: 33, y: 11, dir: 'd', talk: 'inn' },
      { id: 'kid', sprite: 'child', x: 24, y: 17, dir: 'l', talk: 'kid', wander: 2 },
      { id: 'man', sprite: 'townman', x: 9, y: 16, dir: 'r', talk: 'townman', wander: 2 },
      { id: 'woman', sprite: 'townwoman', x: 26, y: 18, dir: 'l', talk: 'townwoman', wander: 2 },
      { id: 'guard2', sprite: 'guard', x: 37, y: 17, dir: 'l', talk: 'guardGate', unless: 'bell_rung' },
    ],
    stone: 'present_frozen', // while this flag is set and not yet undone, the town is stilled
    warps: [{ x: 39, y: 13, w: 1, h: 5, to: 'woods', tx: 1.5, ty: 13.5, dir: 'r' }],
    saves: [[16, 18]],
    foes: [
      { id: 'lf1', x: 25, y: 24, list: ['troll'], if: 'present_frozen', unless: 'present_frozen_done' },
      { id: 'lf2', x: 9, y: 13, list: ['bone2', 'shade2'], if: 'present_frozen', unless: 'present_frozen_done' },
      { id: 'lf3', x: 31, y: 15, list: ['shade2', 'shade2'], if: 'present_frozen', unless: 'present_frozen_done' },
      { id: 'lf4', x: 20, y: 10, list: ['bone2', 'troll'], if: 'present_frozen', unless: 'present_frozen_done' },
    ],
    events: [{ x: 19, y: 18, w: 2, h: 2, run: 'riftGate', if: 'rift_lantern' }],
  };
});

def('woods', () => {
  const g = grid(46, 28, 'g');
  path(g, [[0, 13], [8, 13], [12, 9], [20, 9], [24, 15], [31, 17], [36, 12], [38, 8]], 'd', 2);
  blob(g, 18, 19, 4.5, 3, 'w', 0.3, 2); blob(g, 39, 8, 5, 4, 'd', 0.2, 4); blob(g, 7, 22, 3, 2, 'D', 0.3, 6);
  const props = [], avoid = [[0, 11, 9, 5], [8, 7, 14, 5], [19, 8, 7, 9], [24, 14, 9, 6], [30, 10, 8, 9], [33, 3, 12, 10], [13, 15, 11, 9]];
  border(props, 46, 28, ['pine', 'pine2', 'oak', 'pine'], 2, [[0, 11, 2, 5]], 31);
  scatter(props, g, 34, ['pine', 'oak', 'pine2', 'sapling', 'bush', 'bush2'], ['g'], avoid, 41, 3);
  props.push(['stump', 10, 16], ['rock', 27, 11], ['reeds', 14, 18], ['reeds', 22, 21], ['shrooms', 5, 20], ['haycart', 41, 5], ['bigbarrels', 35, 5], ['tent', 42, 11], ['rock2', 30, 21]);
  return {
    name: ['燈河之森', 'Lantern Woods'], era: 'present', music: 'field', base: 'grass', order: ['darkdirt', 'dirt', 'water'], rows: rows(g),
    props,
    warps: [{ x: 0, y: 11, w: 1, h: 5, to: 'lantern', tx: 38.2, ty: 15.5, dir: 'l' }],
    saves: [[30, 14]],
    chests: [{ id: 'w1', x: 6, y: 21, item: 'tonic', n: 2 }, { id: 'w2', x: 44, y: 3, item: 'charm' }, { id: 'w3', x: 22, y: 23, gold: 60 }],
    foes: [
      { id: 'w_a', x: 9, y: 13, list: ['slime', 'slime'] }, { id: 'w_b', x: 16, y: 9, list: ['bee', 'bandit'] }, { id: 'w_c', x: 24, y: 16, list: ['snake', 'slime', 'bee'] },
      { id: 'w_d', x: 31, y: 18, list: ['bandit', 'bandit'] }, { id: 'w_e', x: 9, y: 22, list: ['goblin'] }, { id: 'w_f', x: 36, y: 13, list: ['goblin', 'snake'] },
      { id: 'w_boss', x: 40, y: 8, list: ['greyfang', 'bandit', 'bandit'], boss: true, unless: 'beat_greyfang', run: 'greyfangIntro' },
    ],
    npcs: [{ id: 'hurtguard', sprite: 'guard', x: 4, y: 12, dir: 'r', talk: 'woodsGuard', unless: 'bell_rung' }],
  };
});

def('tower', () => {
  const g = grid(15, 13, 'f');
  rect(g, 0, 0, 15, 3, 'S'); rect(g, 0, 0, 1, 13, 'S'); rect(g, 14, 0, 1, 13, 'S'); rect(g, 0, 12, 15, 1, 'S'); rect(g, 7, 12, 1, 1, 'f');
  return {
    name: ['鐘塔頂', 'The Bell Loft'], era: 'present', music: 'clock', base: 'floor:stone', order: ['floor:stone', 'wall:stone'], rows: rows(g), inside: true,
    props: [['pillar', 2, 4], ['pillar', 12, 4], ['pillar', 2, 9], ['pillar', 12, 9], ['torch', 4, 2], ['torch', 10, 2]],
    deco: [{ kind: 'bell', x: 7.5, y: 5.2 }],
    warps: [{ x: 7, y: 12, w: 1, h: 1, to: 'lantern', tx: 20.5, ty: 9.6, dir: 'd' }],
    events: [{ x: 6, y: 6, w: 3, h: 2, run: 'bellTouch', touch: false }, { x: 5, y: 7, w: 5, h: 3, run: 'vesperTower', touch: true, if: 'clapper_made', unless: 'beat_vesper' }],
  };
});

// ======================= STILLFALL: AD 2400 =======================
def('stillfall', () => {
  const g = grid(40, 30, 'D');
  blob(g, 12, 8, 7, 5, 'm', 0.3, 2); blob(g, 30, 23, 8, 5, 'm', 0.3, 5); blob(g, 8, 24, 5, 4, 'g', 0.3, 7);
  rect(g, 12, 11, 16, 10, 'F'); path(g, [[0, 15], [12, 15]], 'd', 2); path(g, [[28, 15], [33, 15], [33, 10]], 'd', 2); path(g, [[20, 8], [20, 11]], 'F', 2);
  blob(g, 4, 4, 2.4, 1.6, 'h', 0.2, 5); blob(g, 35, 26, 2.6, 1.4, 'h', 0.2, 4);
  const props = [], avoid = [[3, 4, 6, 6], [30, 4, 6, 6], [16, 0, 8, 10], [11, 10, 18, 12], [0, 13, 40, 5], [31, 8, 5, 5]];
  border(props, 40, 30, ['deadtree', 'deadtree', 'darkrock', 'tallpine'], 1, [], 51);
  scatter(props, g, 14, ['deadtree', 'junk', 'darkrock', 'tire', 'firebarrel', 'ruincol'], ['D', 'm', 'g'], avoid, 61, 3);
  props.push(['ruinwall', 4, 8], ['ruinwall2', 7, 7], ['ruincol', 3, 6], ['ruinwall', 4, 23], ['ruincol2', 8, 22], ['ruinwall2', 30, 24], ['lamp', 12, 11], ['lamp', 27, 11], ['lamp', 12, 20], ['lamp', 27, 20],
    ['vending', 14, 12], ['vending2', 24, 12], ['graffiti', 5, 9], ['junk', 25, 20], ['firebarrel', 16, 20], ['terminal', 23, 19], ['tire', 18, 12], ['graffiti2', 29, 25]);
  return {
    name: ['靜止之年・燈河鎮遺址', 'Stillfall, the ruins of Lanternford'], era: 'future', music: 'ruins', base: 'darkdirt', order: ['moss', 'grass', 'dirt', 'hole', 'floor:flag'], rows: rows(g), tint: 'still',
    houses: [{ x: 30, y: 4, w: 6, style: 'stone', to: 'archive', tx: 9, ty: 11.2, dark: true }, { x: 17, y: 3, w: 7, style: 'stone', tower: true, dark: true, shut: true }],
    props,
    deco: [{ kind: 'spire', x: 20.5, y: 5, dark: true }, { kind: 'clock', x: 20.5, y: 5.5, big: true, stopped: true }, { kind: 'rift', x: 20, y: 17, if: 'arrived_future' }, { kind: 'rift', x: 20, y: 25, if: 'spire_open', red: true }],
    statues: [['townman', 9, 16, 'r'], ['townwoman', 26, 18, 'l'], ['child', 24, 16, 'l'], ['merchant', 14, 15, 'd'], ['guard', 19, 10, 'd'], ['queen', 21, 13, 'd'], ['innkeep', 33, 11, 'd']],
    npcs: [
      { id: 'silas', sprite: 'silas', x: 22, y: 16, dir: 'l', talk: 'silasMeet', unless: 'has_silas' },
      { id: 'survivor', sprite: 'survivor', x: 10, y: 19, dir: 'r', talk: 'survivor' },
      { id: 'vend', sprite: null, x: 14, y: 12, talk: 'shopStillfall' },
    ],
    warps: [],
    saves: [[16, 17]],
    chests: [{ id: 's1', x: 3, y: 26, item: 'hitonic', n: 2 }, { id: 's2', x: 37, y: 3, item: 'ether' }, { id: 's3', x: 6, y: 8, gold: 200 }],
    foes: [
      { id: 'sf1', x: 8, y: 13, list: ['skeleton', 'zombie'] }, { id: 'sf2', x: 27, y: 15, list: ['ghost', 'bat'], if: 'has_silas' }, { id: 'sf3', x: 30, y: 23, list: ['zombie', 'zombie', 'bat'] },
      { id: 'sf4', x: 12, y: 24, list: ['hollow', 'skeleton'] }, { id: 'sf5', x: 33, y: 13, list: ['hollow', 'ghost'], if: 'has_silas' }, { id: 'sf6', x: 14, y: 7, list: ['bat', 'bat', 'skeleton'] },
      { id: 'sf_meet', x: 25, y: 16, list: ['ghost', 'ghost'], unless: 'has_silas', run: 'silasFight', scripted: true },
    ],
    events: [{ x: 19, y: 16, w: 2, h: 2, run: 'riftGate', if: 'arrived_future' }, { x: 19, y: 24, w: 2, h: 2, run: 'spireGate', if: 'spire_open' }, { x: 0, y: 0, w: 40, h: 30, run: 'arriveFuture', touch: true, unless: 'arrived_future_talk' }],
  };
});

def('archive', () => {
  const g = grid(19, 14, 't');
  rect(g, 0, 0, 19, 2, 'W'); rect(g, 0, 0, 1, 14, 'W'); rect(g, 18, 0, 1, 14, 'W'); rect(g, 0, 13, 19, 1, 'W'); rect(g, 9, 13, 1, 1, 't');
  rect(g, 1, 6, 6, 1, 'W'); rect(g, 12, 6, 6, 1, 'W');
  return {
    name: ['時之檔案館', 'The Hour Archive'], era: 'future', music: 'archive', base: 'floor:tiles', order: ['floor:tiles', 'wall:white'], rows: rows(g), inside: true,
    props: [['terminal', 2, 2], ['terminal', 4, 2], ['glass', 1, 5], ['vending', 14, 2], ['vending2', 16, 2], ['terminal', 2, 9], ['terminal', 4, 9], ['glass', 13, 10], ['plant', 1, 12], ['plant', 17, 12], ['books', 11, 2]],
    deco: [{ kind: 'rift', x: 9, y: 3, if: 'beat_warden' }, { kind: 'machine', x: 9, y: 2.6 }],
    npcs: [{ id: 'ione', sprite: 'archivist', x: 6, y: 9, dir: 'r', talk: 'ione' }],
    warps: [{ x: 9, y: 13, w: 1, h: 1, to: 'stillfall', tx: 33.5, ty: 10.6, dir: 'd' }],
    saves: [[15, 9]],
    foes: [{ id: 'warden', x: 9, y: 5, list: ['warden'], boss: true, unless: 'beat_warden', run: 'wardenIntro', still: true, if: 'met_ione' }],
    events: [{ x: 8, y: 3, w: 3, h: 2, run: 'riftGate', if: 'beat_warden' }, { x: 7, y: 6, w: 5, h: 1, run: 'wardenBlock', touch: true, unless: 'met_ione' }],
  };
});

def('spire', () => {
  const g = grid(22, 44, 'v');
  path(g, [[11, 42], [11, 36], [5, 32], [5, 26], [15, 22], [16, 16], [8, 12], [11, 8], [11, 4]], 'F', 2);
  blob(g, 11, 5, 4, 3, 'F', 0.1, 1); blob(g, 11, 41, 3, 2, 'F', 0.1, 2); blob(g, 5, 29, 3, 3, 'k', 0.2, 3); blob(g, 15, 19, 3, 3, 'k', 0.2, 4); blob(g, 9, 11, 3, 2, 'k', 0.2, 5);
  return {
    name: ['寂靜之塔', 'The Silent Spire'], era: 'future', music: 'spire', base: 'void', order: ['rock', 'floor:flag'], rows: rows(g), stars: true,
    props: [['spire', 4, 28], ['spire', 7, 30], ['spire', 14, 18], ['vinepillar', 9, 37], ['vinepillar', 13, 37], ['pillar', 8, 3], ['pillar', 14, 3], ['tomb', 10, 2]],
    deco: [{ kind: 'rift', x: 11, y: 42, red: true }],
    saves: [[13, 40], [9, 9]],
    chests: [{ id: 'p1', x: 3, y: 27, item: 'elixir' }, { id: 'p2', x: 17, y: 20, item: 'railbow' }, { id: 'p3', x: 7, y: 12, item: 'windbow' }],
    foes: [
      { id: 'p_a', x: 9, y: 35, list: ['hollow2', 'eye2'] }, { id: 'p_b', x: 5, y: 27, list: ['lantern', 'eye2'] }, { id: 'p_c', x: 12, y: 23, list: ['sentinel'] },
      { id: 'p_d', x: 15, y: 16, list: ['hollow2', 'hollow2', 'eye2'] }, { id: 'p_e', x: 9, y: 11, list: ['lantern', 'sentinel'] },
      { id: 'hush', x: 11, y: 6, list: ['hush'], boss: true, run: 'hushIntro', still: true, unless: 'beat_hush' },
    ],
    events: [{ x: 10, y: 41, w: 3, h: 2, run: 'spireBack' }],
  };
});

// ======================= ROOTWILD: 3000 BC =======================
def('rootwild', () => {
  const g = grid(46, 30, 'g');
  path(g, [[2, 15], [10, 16], [16, 13], [24, 14], [28, 20], [36, 14], [45, 14]], 'D', 2);
  blob(g, 24, 23, 5, 3, 'w', 0.3, 7); blob(g, 38, 6, 4, 2.5, 'w', 0.3, 8);
  const props = [], avoid = [[0, 12, 12, 7], [9, 11, 17, 6], [22, 12, 8, 11], [27, 11, 19, 6], [1, 13, 4, 4]];
  border(props, 46, 30, ['oak', 'oak', 'bush', 'sapling', 'bush2'], 2, [[44, 12, 2, 5]], 71);
  scatter(props, g, 34, ['oak', 'bush', 'bush2', 'sapling', 'reeds', 'oak'], ['g', 'm'], avoid, 81, 3);
  props.push(['moai', 7, 11], ['moai', 18, 11], ['moai', 30, 12], ['bigrock', 20, 18], ['flowers', 12, 18], ['flowers', 31, 17], ['reeds', 20, 22], ['reeds', 29, 24], ['vinepillar', 26, 11]);
  return {
    name: ['根野', 'The Rootwild'], era: 'ancient', music: 'jungle', base: 'grass', order: ['darkdirt', 'water'], rows: rows(g),
    props,
    deco: [{ kind: 'rift', x: 3, y: 15 }],
    warps: [{ x: 45, y: 12, w: 1, h: 5, to: 'village', tx: 1.5, ty: 11.5, dir: 'r' }],
    saves: [[6, 17]],
    chests: [{ id: 'r1', x: 4, y: 26, item: 'hitonic', n: 2 }, { id: 'r2', x: 40, y: 3, item: 'feather' }, { id: 'r3', x: 30, y: 27, item: 'amulet' }],
    foes: [
      { id: 'r_a', x: 12, y: 15, list: ['boarman'] }, { id: 'r_b', x: 22, y: 14, list: ['lizard', 'smallworm'] }, { id: 'r_c', x: 28, y: 19, list: ['flower'] },
      { id: 'r_d', x: 34, y: 15, list: ['boarman', 'lizard'] }, { id: 'r_e', x: 14, y: 24, list: ['bigworm', 'smallworm'] }, { id: 'r_f', x: 40, y: 22, list: ['flower', 'lizard'] },
    ],
    events: [{ x: 2, y: 14, w: 2, h: 2, run: 'riftGate' }, { x: 0, y: 0, w: 46, h: 30, run: 'arriveAncient', touch: true, unless: 'arrived_ancient' }],
  };
});

def('village', () => {
  const g = grid(32, 24, 'd');
  blob(g, 16, 12, 9, 6, 'D', 0.2, 2); rect(g, 0, 10, 8, 3, 'D'); path(g, [[16, 6], [16, 0]], 'D', 2);
  for (const [x, y] of [[3, 3], [26, 4], [2, 18], [27, 17]]) blob(g, x, y, 3, 2, 'g', 0.3, x + y);
  const props = [];
  border(props, 32, 24, ['oak', 'bush', 'oak', 'bush2'], 1, [[0, 9, 2, 5], [14, 0, 5, 2]], 91);
  props.push(['tent', 4, 8], ['tent', 21, 8], ['tent', 6, 20], ['tent', 21, 20], ['moai', 15, 9], ['torch', 13, 13], ['torch', 19, 13], ['firebarrel', 16, 14], ['bigrock', 26, 13], ['reeds', 11, 4], ['bigbarrels', 25, 15], ['flowers', 8, 14]);
  return {
    name: ['根野族的村子', 'Rootwild Village'], era: 'ancient', music: 'village', base: 'dirt', order: ['grass', 'darkdirt'], rows: rows(g),
    props,
    npcs: [
      { id: 'chief', sprite: 'chief', x: 16, y: 11, dir: 'd', talk: 'chief' },
      { id: 'grandma', sprite: 'grandma', x: 8, y: 21, dir: 'd', talk: 'grandma' },
      { id: 'kaya', sprite: 'kaya', x: 18, y: 15, dir: 'l', talk: 'kayaMeet', unless: 'has_kaya' },
      { id: 'tribem', sprite: 'tribem', x: 9, y: 13, dir: 'r', talk: 'tribem', wander: 2 },
      { id: 'tribef', sprite: 'tribef', x: 24, y: 12, dir: 'l', talk: 'shopVillage' },
      { id: 'tribem2', sprite: 'tribem', x: 16, y: 3, dir: 'd', talk: 'craterGuard', unless: 'has_kaya' },
    ],
    warps: [{ x: 0, y: 9, w: 1, h: 5, to: 'rootwild', tx: 44.3, ty: 14.5, dir: 'l' }, { x: 14, y: 0, w: 5, h: 1, to: 'crater', tx: 16.5, ty: 26.4, dir: 'u', if: 'has_kaya' }],
    saves: [[12, 16]],
    events: [{ x: 14, y: 0, w: 5, h: 2, run: 'craterBlocked', touch: true, unless: 'has_kaya' }],
  };
});

def('crater', () => {
  const g = grid(34, 28, 'k');
  rect(g, 0, 0, 34, 2, 'C'); rect(g, 0, 0, 2, 28, 'C'); rect(g, 32, 0, 2, 28, 'C');
  blob(g, 9, 20, 4, 2.5, 'l', 0.3, 1); blob(g, 25, 16, 5, 3, 'l', 0.3, 2); blob(g, 10, 8, 3, 2, 'l', 0.3, 3); blob(g, 28, 6, 2.5, 2, 'l', 0.3, 4);
  path(g, [[16, 27], [16, 22], [20, 19], [17, 12], [12, 12], [16, 6], [16, 3]], 'D', 2);
  blob(g, 16, 4, 4, 2, 'D', 0.1, 5);
  const props = [];
  props.push(['darkrock', 4, 13], ['darkrock2', 26, 24], ['spire', 21, 10], ['spire', 7, 25], ['darkrock', 22, 4], ['spire', 3, 6], ['darkrock2', 28, 11], ['spire', 13, 17], ['darkrock', 5, 4]);
  return {
    name: ['墜星火山口', 'The Fallen-Star Crater'], era: 'ancient', music: 'cave', base: 'rock', order: ['darkdirt', 'lava', 'wall:cave'], rows: rows(g), tint: 'cave',
    props,
    deco: [{ kind: 'star', x: 16, y: 3.4, unless: 'beat_stonehorn' }, { kind: 'rift', x: 16, y: 4, if: 'beat_stonehorn' }],
    warps: [{ x: 15, y: 27, w: 3, h: 1, to: 'village', tx: 16.5, ty: 1.6, dir: 'd' }],
    saves: [[19, 24]],
    chests: [{ id: 'c1', x: 3, y: 20, item: 'hitonic', n: 3 }, { id: 'c2', x: 29, y: 20, item: 'ring' }, { id: 'c3', x: 4, y: 9, item: 'ether', n: 2 }],
    foes: [
      { id: 'c_a', x: 16, y: 22, list: ['orc'] }, { id: 'c_b', x: 20, y: 18, list: ['eyeball', 'bigworm'] }, { id: 'c_c', x: 14, y: 13, list: ['orc', 'eyeball'] },
      { id: 'c_d', x: 6, y: 16, list: ['smallworm', 'smallworm', 'eyeball'] }, { id: 'c_e', x: 26, y: 9, list: ['orc', 'bigworm'] },
      { id: 'stonehorn', x: 16, y: 6, list: ['stonehorn'], boss: true, run: 'stonehornIntro', still: true, unless: 'beat_stonehorn' },
    ],
    events: [{ x: 15, y: 3, w: 3, h: 2, run: 'riftGate', if: 'beat_stonehorn' }],
  };
});

export const ERA_NAME = { present: ['公元 1250 年・燈河鎮', 'AD 1250 · Lanternford'], future: ['公元 2400 年・靜止之年', 'AD 2400 · Stillfall'], ancient: ['公元前 3000 年・根野', '3000 BC · the Rootwild'] };
export const mapName = (m) => L(m.name[0], m.name[1]);
