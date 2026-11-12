// The ground and everything standing on it, cut from the LPC tile atlases (32px tiles).
// Ground terrains use the LPC terrain block: 3 tiles wide and 6 tall, its outside see-through, so each
// terrain is laid over the ones below it and its soft edge shows them through. Each tile is drawn as four
// 16px quarters chosen from the block by that quarter's two side neighbours and its corner neighbour.
import { atlas } from './assets.js';
import { canvas, T } from './gfx.js';

// where each terrain block starts in terrain.png, in tiles
export const TERRAIN = {
  dirt: [15, 0], darkdirt: [18, 0], grass: [21, 0], hole: [24, 0], void: [27, 0], murk: [12, 0],
  lava: [15, 6], rock: [18, 6], moss: [21, 6], sand: [0, 9], water: [9, 9],
};
// plain floors that tile without edges: [atlas, column, row, columns, rows] of repeatable tiles
const FLOOR = {
  stone: ['terrain', 16, 26, 3, 3], flag: ['terrain', 24, 11, 3, 1], plank: ['terrain', 13, 19, 1, 1], tiles: ['terrain', 27, 10, 1, 2], slate: ['terrain', 30, 13, 2, 2],
  cobble: ['terrain', 30, 16, 2, 4], slab: ['terrain', 16, 29, 3, 3],
};

function blit(g, img, sx, sy, dx, dy, w = T, h = T) { g.drawImage(img, sx, sy, w, h, dx, dy, w, h); }
const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// one terrain over a mask (a function telling whether the terrain covers tile x, y)
function layTerrain(g, name, w, h, has) {
  const img = atlas('terrain'), [ox, oy] = TERRAIN[name], H = T / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!has(x, y)) continue;
    const n = (dx, dy) => { const X = x + dx, Y = y + dy; return X < 0 || Y < 0 || X >= w || Y >= h ? true : has(X, Y); };
    const full = n(-1, 0) && n(1, 0) && n(0, -1) && n(0, 1) && n(-1, -1) && n(1, -1) && n(-1, 1) && n(1, 1);
    if (full) {
      // the plain middle, now and then one of the varied fills from the bottom row
      const r = hash(x, y), c = r < 0.7 || name === 'water' ? [ox + 1, oy + 3] : [ox + Math.floor((r - 0.7) / 0.1), oy + 5];
      blit(g, img, c[0] * T, c[1] * T, x * T, y * T);
      continue;
    }
    for (const [qx, qy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const sx = qx ? 1 : -1, sy = qy ? 1 : -1, v = n(0, sy), hz = n(sx, 0), d = n(sx, sy);
      let tc, tr;
      if (v && hz && d) { tc = ox + 1; tr = oy + 3; }
      else if (v && hz) { tc = ox + 1 + (qx ? 0 : 1); tr = oy + (qy ? 0 : 1); }
      else if (!v && hz) { tc = ox + 1; tr = oy + (qy ? 4 : 2); }
      else if (v && !hz) { tc = ox + (qx ? 2 : 0); tr = oy + 3; }
      else { tc = ox + (qx ? 2 : 0); tr = oy + (qy ? 4 : 2); }
      blit(g, img, tc * T + qx * H, tr * T + qy * H, x * T + qx * H, y * T + qy * H, H, H);
    }
  }
}
function layFloor(g, name, w, h, has) {
  const [at, c0, r0, cw, ch] = FLOOR[name], img = atlas(at);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (has(x, y)) blit(g, img, (c0 + (x % cw)) * T, (r0 + (y % ch)) * T, x * T, y * T);
}
// walls: dark tops, and a brick face where a wall meets the floor below it
const WALLS = {
  brick: { face: ['base', 4, 14], top: '#1e1a24', edge: '#4a4258' },
  stone: { face: ['terrain', 17, 27], top: '#16161c', edge: '#5a5a66' },
  cave: { face: ['terrain', 17, 24], top: '#120c0a', edge: '#4a3020' },
  white: { face: ['misc', 24, 1], top: '#202430', edge: '#a0a4b0' },
  wood: { face: ['base', 1, 17], top: '#1c120c', edge: '#5a3a24' },
};
function layWalls(g, kind, w, h, has) {
  const k = WALLS[kind], img = atlas(k.face[0]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!has(x, y)) continue;
    const below = y + 1 < h && !has(x, y + 1);
    if (below) blit(g, img, k.face[1] * T, k.face[2] * T, x * T, y * T);
    else {
      g.fillStyle = k.top; g.fillRect(x * T, y * T, T, T);
      g.fillStyle = k.edge;
      if (y + 1 < h && !has(x, y + 1)) g.fillRect(x * T, y * T + T - 2, T, 2);
      if (x > 0 && !has(x - 1, y)) g.fillRect(x * T, y * T, 2, T);
      if (x + 1 < w && !has(x + 1, y)) g.fillRect(x * T + T - 2, y * T, 2, T);
      if (y > 0 && !has(x, y - 1)) g.fillRect(x * T, y * T, T, 2);
    }
  }
}

// a map's ground, from its rows of letters and its legend: { letter: terrain | 'floor:stone' | 'wall:brick' }
// layers go in the order given; 'base' fills everything first
export function renderGround(rows, legend, order, base) {
  const h = rows.length, w = rows[0].length, c = canvas(w * T, h * T), g = c.x;
  const code = (x, y) => rows[y][x];
  if (base) {
    if (base.startsWith('floor:')) layFloor(g, base.slice(6), w, h, () => true);
    else layTerrain(g, base, w, h, () => true);
  }
  for (const name of order) {
    const letters = Object.keys(legend).filter((k) => legend[k] === name);
    // a terrain also lies under every terrain laid after it, so their edges blend over it
    const later = order.slice(order.indexOf(name) + 1).filter((n) => !n.startsWith('wall:'));
    const under = Object.keys(legend).filter((k) => later.includes(legend[k]) && !legend[k].startsWith('floor:'));
    const has = (x, y) => letters.includes(code(x, y)) || (!name.startsWith('wall:') && !name.startsWith('floor:') && under.includes(code(x, y)) && TERRAIN[name] && name !== 'water' && name !== 'lava' && name !== 'hole' && name !== 'void' && name !== 'murk');
    // a floor also runs under the edge of a pond or pit laid after it, so the soft edge shows the floor round it
    const own = (x, y) => y >= 0 && y < h && x >= 0 && x < w && letters.includes(code(x, y));
    const floorHas = (x, y) => own(x, y) || (under.includes(code(x, y)) && [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]].some(([dx, dy]) => own(x + dx, y + dy)));
    if (name.startsWith('floor:')) layFloor(g, name.slice(6), w, h, floorHas);
    else if (name.startsWith('wall:')) layWalls(g, name.slice(5), w, h, has);
    else layTerrain(g, name, w, h, has);
  }
  return c;
}

// ---------- things that stand on the map ----------
// [atlas, x, y, w, h] in pixels, and the footprint that blocks walking, in pixels from the bottom-left [x, y-from-bottom, w, h]
export const PROPS = {
  pine: ['terrain', 960, 0, 64, 160, [16, 4, 32, 20]],
  pine2: ['terrain', 960, 0, 64, 160, [16, 4, 32, 20]],
  oak: ['terrain', 928, 896, 96, 128, [30, 4, 36, 22]],
  sapling: ['terrain', 864, 928, 64, 96, [18, 4, 28, 18]],
  tallpine: ['terrain', 960, 0, 64, 160, [16, 4, 32, 20]],
  bush: ['terrain', 768, 384, 96, 96, [8, 6, 80, 50]],
  bush2: ['terrain', 864, 384, 96, 96, [8, 6, 80, 50]],
  rock: ['terrain', 832, 672, 64, 64, [6, 6, 52, 30]],
  rock2: ['terrain', 896, 672, 64, 64, [6, 6, 52, 30]],
  darkrock: ['terrain', 864, 736, 64, 64, [4, 8, 56, 32]],
  darkrock2: ['terrain', 864, 832, 64, 64, [4, 8, 56, 32]],
  spire: ['terrain', 992, 672, 32, 64, [4, 2, 24, 16]],
  stump: ['terrain', 736, 576, 32, 32, [4, 2, 24, 14]],
  shroom: ['terrain', 832, 992, 32, 32, null],
  shrooms: ['terrain', 864, 896, 32, 32, null],
  reeds: ['terrain', 832, 928, 32, 64, null],
  flowers: ['terrain', 672, 352, 96, 32, null, { keyGrass: true }],
  moai: ['terrain', 480, 384, 64, 96, [8, 4, 48, 30]],
  pillar: ['terrain', 448, 384, 32, 96, [2, 4, 28, 20]],
  vinepillar: ['terrain', 640, 384, 32, 96, [2, 4, 28, 20]],
  birdbath: ['terrain', 544, 384, 32, 64, [4, 4, 24, 20]],
  bigrock: ['terrain', 576, 384, 64, 64, [4, 4, 56, 30]],
  waterfall: ['terrain', 672, 384, 96, 128, [0, 0, 96, 128]],
  bridge: ['terrain', 512, 512, 96, 64, null],
  ruinwall: ['terrain', 608, 736, 96, 96, [0, 2, 96, 26]],
  ruinwall2: ['terrain', 704, 736, 64, 96, [0, 2, 64, 26]],
  ruincol: ['terrain', 768, 736, 32, 96, [2, 2, 28, 22]],
  ruincol2: ['terrain', 800, 736, 32, 96, [2, 2, 28, 22]],
  // 21,18 is the shut chest; 19,18 the one with its lid thrown back
  chest: ['terrain', 672, 576, 32, 32, [2, 2, 28, 20]],
  chestopen: ['terrain', 608, 576, 32, 32, [2, 2, 28, 20]],
  // a wooden post with an arrow board nailed across it
  sign: ['build', 960, 512, 32, 64, [6, 2, 20, 14], { parts: [['build', 960, 512, 32, 64, 0, 0], ['build', 768, 544, 32, 32, -6, -6]] }],
  cherry: ['misc', 224, 224, 128, 128, [44, 6, 40, 22]],
  deadtree: ['misc', 512, 0, 96, 96, [30, 4, 36, 20]],
  shelf: ['misc', 448, 128, 64, 96, [0, 0, 64, 40]],
  books: ['misc', 416, 352, 64, 96, [0, 0, 64, 40]],
  bed: ['misc', 0, 928, 64, 96, [4, 4, 56, 80]],
  bed2: ['misc', 320, 928, 64, 96, [4, 4, 56, 80]],
  // the stovepipe column and the pans and oven beside it (not the boat's water above them)
  stove: ['misc', 192, 896, 64, 128, [0, 0, 64, 40], { parts: [['misc', 192, 896, 32, 128, 0, 0], ['misc', 224, 928, 32, 96, 32, 32]] }],
  table: ['misc', 288, 352, 128, 96, [0, 8, 128, 70]],
  stool: ['misc', 128, 928, 32, 64, null],
  barrel: ['misc', 736, 512, 32, 64, [2, 2, 28, 18]],
  firebarrel: ['misc', 640, 576, 32, 64, [2, 2, 28, 20]],
  vending: ['misc', 640, 448, 64, 64, [0, 2, 64, 30]],
  vending2: ['misc', 704, 448, 64, 64, [0, 2, 64, 30]],
  terminal: ['misc', 672, 576, 32, 64, [0, 2, 32, 26]],
  screen: ['misc', 736, 160, 96, 96, [0, 2, 96, 36]],
  glass: ['misc', 640, 256, 128, 96, [0, 2, 128, 30]],
  lamp: ['misc', 736, 672, 32, 96, [6, 2, 20, 14]],
  graffiti: ['misc', 640, 672, 96, 32, null],
  graffiti2: ['misc', 640, 704, 96, 32, null],
  junk: ['misc', 704, 576, 64, 96, [0, 2, 64, 30]],
  tire: ['misc', 736, 640, 32, 32, [2, 2, 28, 18]],
  grave: ['misc', 704, 800, 32, 32, [2, 2, 28, 22]],
  grave2: ['misc', 736, 800, 32, 32, [2, 2, 28, 22]],
  tomb: ['misc', 640, 800, 64, 96, [0, 2, 64, 60]],
  vase: ['misc', 672, 960, 32, 64, [2, 2, 28, 20]],
  plant: ['misc', 608, 960, 32, 64, [2, 2, 28, 20]],
  // the whole stall with its striped roof (the left roof cell is drawn level with the others)
  stall: ['misc', 160, 448, 96, 160, [0, 0, 96, 40], { parts: [['misc', 160, 448, 96, 160, 0, 0], ['misc', 192, 448, 32, 64, 0, 0]] }],
  crates: ['misc', 256, 640, 224, 64, [0, 0, 224, 40]],
  tent: ['build', 416, 512, 128, 160, [8, 2, 112, 60]],
  torii: ['build', 768, 128, 224, 128, null, { clear: [[0, 0, 32, 64]] }],
  lantern: ['build', 800, 0, 32, 64, [4, 2, 24, 18]],
  komainu: ['build', 864, 256, 64, 96, [4, 2, 56, 34]],
  fence: ['build', 800, 352, 96, 32, [0, 4, 96, 20]],
  fence2: ['build', 896, 352, 96, 32, [0, 4, 96, 20]],
  // two barrels from the build sheet and a tall one from the base sheet (the sheet's own third barrel is cut by its edge)
  bigbarrels: ['build', 928, 256, 96, 96, [4, 2, 88, 40], { parts: [['build', 928, 256, 64, 64, 0, 32], ['base', 576, 448, 32, 64, 64, 32]] }],
  innsign: ['build', 672, 608, 32, 32, null],
  swordsign: ['build', 544, 640, 32, 32, null],
  potsign: ['build', 576, 640, 32, 32, null],
  cart: ['build', 704, 608, 64, 64, [4, 2, 56, 30]],
  haycart: ['build', 672, 672, 96, 64, [4, 2, 88, 30]],
  torch: ['build', 928, 704, 32, 64, null],
  lamppost: ['misc', 736, 672, 32, 96, [6, 2, 20, 14]],
  well: ['base', 544, 384, 32, 64, [4, 4, 24, 20]],
  fountain: ['terrain', 544, 384, 32, 64, [4, 4, 24, 20]],
  spirecone: ['base', 512, 672, 96, 224, null],
};
// a whole picture recoloured for a place: snow-covered ground, an ember-lit city, glacier ice, the void
const paintCache = new Map();
export function repaint(src, kind, key) {
  if (!kind) return src;
  const id = key && key + '|' + kind;
  if (id && paintCache.has(id)) return paintCache.get(id);
  const c = canvas(src.width, src.height);
  c.x.drawImage(src, 0, 0);
  const d = c.x.getImageData(0, 0, c.width, c.height), p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    if (p[i + 3] < 160) continue;
    const r = p[i], g = p[i + 1], b = p[i + 2], l = r * 0.3 + g * 0.55 + b * 0.15;
    if (kind === 'snow') { const w = g > r && g > b ? 1 : 0.55; p[i] = r + (l * 0.45 + 140 - r) * w; p[i + 1] = g + (l * 0.45 + 146 - g) * w; p[i + 2] = b + (l * 0.4 + 165 - b) * w; }
    else if (kind === 'ice') { p[i] = l * 0.62; p[i + 1] = l * 0.88; p[i + 2] = Math.min(255, l * 1.2 + 12); }
    else if (kind === 'ember') { p[i] = Math.min(255, l * 1.3 + 6); p[i + 1] = l * 0.58; p[i + 2] = l * 0.36; }
    else if (kind === 'void') { p[i] = l * 0.62; p[i + 1] = l * 0.45; p[i + 2] = Math.min(255, l * 0.95 + 10); }
    else if (kind === 'brass') { p[i] = r * 0.85 + l * 0.15 + 12; p[i + 1] = g * 0.8 + l * 0.12 + 4; p[i + 2] = b * 0.6 + l * 0.1; }
  }
  c.x.putImageData(d, 0, 0);
  if (id) paintCache.set(id, c);
  return c;
}
const propCache = new Map();
export function prop(name) {
  let c = propCache.get(name);
  if (c) return c;
  const [at, x, y, w, h, , opt = {}] = PROPS[name];
  c = canvas(w, h);
  if (opt.parts) for (const [pa, px, py, pw, ph, dx, dy] of opt.parts) c.x.drawImage(atlas(pa), px, py, pw, ph, dx, dy, pw, ph);
  else c.x.drawImage(atlas(at), x, y, w, h, 0, 0, w, h);
  for (const [cx, cy, cw, chh] of opt.clear || []) c.x.clearRect(cx, cy, cw, chh);
  // flower cells come painted on a grass tile: take out the plain grass so they sit on any ground
  if (opt.keyGrass) {
    const [gx, gy] = TERRAIN.grass, gr = canvas(T, T); gr.x.drawImage(atlas('terrain'), (gx + 1) * T, (gy + 3) * T, T, T, 0, 0, T, T);
    const gp = gr.x.getImageData(0, 0, T, T).data, pal = new Set();
    for (let i = 0; i < gp.length; i += 4) pal.add((gp[i] << 16) | (gp[i + 1] << 8) | gp[i + 2]);
    const d = c.x.getImageData(0, 0, w, h), p = d.data;
    for (let i = 0; i < p.length; i += 4) if (pal.has((p[i] << 16) | (p[i + 1] << 8) | p[i + 2])) p[i + 3] = 0;
    c.x.putImageData(d, 0, 0);
  }
  propCache.set(name, c);
  return c;
}

// a brick house with a slate roof: w tiles wide; returns the picture and where the door is
const houseCache = new Map();
export function house(w, { door = Math.floor(w / 2), windows = true, style = 'brick' } = {}) {
  const key = w + '|' + door + '|' + windows + '|' + style;
  let c = houseCache.get(key);
  if (c) return c;
  const A = atlas('base');
  c = canvas(w * T, 6 * T);
  const g = c.x, cc = (x) => (x === 0 ? 0 : x === w - 1 ? 2 : 1), put = (col, row, x, y) => g.drawImage(A, col * T, row * T, T, T, x * T, y * T, T, T);
  if (style === 'brick') {
    for (let j = 0; j < 3; j++) for (let x = 0; x < w; x++) put(cc(x), 9 + j, x, 3 + j);
  } else {
    // a grey stone hall
    for (let j = 0; j < 3; j++) for (let x = 0; x < w; x++) put(3 + (x === 0 ? 0 : x === w - 1 ? 3 : 1 + (x % 2)), 13 + Math.min(j, 2), x, 3 + j);
  }
  for (let i = 0; i < 4; i++) for (let x = 0; x < w; x++) {
    const col = cc(x); let row = 12 + i;
    if (row === 13 && col === 1 && x !== Math.floor(w / 2)) row = 14;
    if (row === 15 && col === 1) continue;
    put(col, row, x, i);
  }
  put(3, 9, door, 4); put(3, 10, door, 5);
  if (windows) for (let x = 1; x < w - 1; x++) if (Math.abs(x - door) > 0 && (x - door) % 2 === 0 || (w <= 5 && x !== door)) put(7, 9, x, 4);
  c.door = door;
  houseCache.set(key, c);
  return c;
}
