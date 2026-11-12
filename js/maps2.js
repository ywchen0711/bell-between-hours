// The places of the expansion: the Hour Between (outside every era), Brasshaven in AD 1820, Frostcradle in
// 30000 BC, Emberfall in AD 9000, the Heart of the Hush past the end of time, and the Unrung Bell.
// Painted with the same helpers as maps.js. Coordinates are in 32px tiles.
import { MAPS, ERA_NAME, grid, rect, path, blob, border, scatter, rows, def } from './maps.js';

Object.assign(ERA_NAME, {
  interval: ['時隙之間', 'The Hour Between'], brass: ['公元 1820 年・黃銅港', 'AD 1820 · Brasshaven'], frost: ['公元前 30000 年・霜搖籃', '30000 BC · Frostcradle'],
  ember: ['公元 9000 年・餘燼之城', 'AD 9000 · Emberfall'], heart: ['時間的盡頭・寂靜之心', 'Past the end of time · the Heart of the Hush'],
});

// ======================= THE HOUR BETWEEN =======================
def('interval', () => {
  const g = grid(32, 26, 'v');
  blob(g, 16, 13, 10, 7, 'F', 0.12, 3); blob(g, 16, 13, 11.5, 8.2, 'k', 0.18, 4); blob(g, 16, 13, 10, 7, 'F', 0.12, 3);
  path(g, [[16, 6], [16, 1]], 'F', 2); path(g, [[16, 20], [16, 24]], 'F', 2); blob(g, 16, 2, 3, 1.5, 'k', 0.1, 6); blob(g, 16, 24, 3, 1.4, 'k', 0.1, 7);
  blob(g, 11, 16, 2, 1.1, 'w', 0.15, 9);
  return {
    name: ['時隙之間', 'The Hour Between'], era: 'interval', music: 'interval', base: 'void', order: ['rock', 'floor:flag', 'water'], rows: rows(g), stars: true, tint: 'interval',
    props: [['lamppost', 11, 8], ['lamppost', 21, 8], ['lamppost', 10, 19], ['lamppost', 21, 18], ['books', 22, 12], ['pillar', 14, 0], ['pillar', 18, 0], ['vending', 9, 10], ['plant', 12, 9]],
    deco: [
      { kind: 'rift', x: 15.5, y: 13 }, { kind: 'anvil', x: 19, y: 10 },
      { kind: 'stone', x: 10, y: 13, col: '#ffd070' }, { kind: 'stone', x: 13, y: 9, col: '#90e0ff', if: 'arrived_future' }, { kind: 'stone', x: 19, y: 16, col: '#90ff90', if: 'arrived_ancient' },
      { kind: 'stone', x: 22, y: 15, col: '#e0b060', if: 'brass_open' }, { kind: 'stone', x: 13, y: 17, col: '#d0f0ff', if: 'frost_open' }, { kind: 'stone', x: 20, y: 9, col: '#ff7050', if: 'ember_open' },
      { kind: 'rift', x: 15.5, y: 1.4, red: true, if: 'heart_open' }, { kind: 'rift', x: 15.5, y: 23.6, if: 'cleared' },
    ],
    npcs: [
      { id: 'ebb', sprite: 'lamplighter', x: 16, y: 10, dir: 'd', talk: 'ebb' },
      { id: 'tock', sprite: null, x: 9, y: 10, talk: 'shopInterval' },
      { id: 'fisher', sprite: 'survivor', x: 14, y: 16, dir: 'l', talk: 'oldFisher' },
    ],
    saves: [[12, 13]],
    events: [
      { x: 15, y: 12, w: 2, h: 2, run: 'eraGate' }, { x: 18, y: 9, w: 3, h: 2, run: 'forge', touch: false }, { x: 21, y: 11, w: 3, h: 2, run: 'dexBook', touch: false },
      { x: 14, y: 0, w: 5, h: 3, run: 'heartDoor', touch: true }, { x: 14, y: 23, w: 5, h: 3, run: 'unrungDoor', touch: true },
      { x: 9, y: 15, w: 5, h: 3, run: 'fishSpot', touch: false, spot: 'interval' },
    ],
  };
});

// ======================= BRASSHAVEN: AD 1820 =======================
def('brass', () => {
  const g = grid(40, 30, 'f');
  rect(g, 0, 22, 40, 3, 'w'); rect(g, 9, 22, 3, 3, 'p'); rect(g, 28, 22, 3, 3, 'p'); rect(g, 0, 25, 40, 3, 'p'); rect(g, 0, 28, 40, 2, 'w');
  rect(g, 12, 11, 16, 9, 'F'); path(g, [[20, 8], [20, 11]], 'F', 2);
  const props = [];
  props.push(['lamppost', 12, 11], ['lamppost', 27, 11], ['lamppost', 12, 19], ['lamppost', 27, 19], ['fountain', 19, 15], ['crates', 14, 25], ['bigbarrels', 33, 25], ['barrel', 6, 25], ['barrel', 7, 25],
    ['cart', 25, 8], ['stall', 13, 13], ['potsign', 30, 18], ['swordsign', 31, 18], ['innsign', 9, 18], ['sign', 37, 13], ['fence', 0, 21], ['fence', 3, 21], ['fence', 34, 21], ['fence', 37, 21],
    ['lamppost', 2, 10], ['lamppost', 37, 9], ['bigbarrels', 9, 8], ['plant', 15, 9], ['plant', 24, 9]);
  return {
    name: ['黃銅港', 'Brasshaven'], era: 'brass', music: 'harbor', base: 'floor:stone', order: ['floor:flag', 'floor:plank', 'water'], rows: rows(g), tint: 'brass', battleMusic: 'battle2',
    houses: [{ x: 3, y: 3, w: 6, to: 'hattie', tx: 7, ty: 9.2 }, { x: 30, y: 3, w: 7, style: 'stone', to: 'academy', tx: 9, ty: 12.2 }, { x: 17, y: 2, w: 7, style: 'stone', tower: true, shut: true },
      { x: 4, y: 12, w: 5 }, { x: 30, y: 12, w: 6 }],
    props,
    deco: [{ kind: 'spire', x: 20.5, y: 4 }, { kind: 'clock', x: 20.5, y: 4.5, big: true }, { kind: 'rift', x: 20, y: 18 }, { kind: 'gear', x: 20.5, y: 2.2, r: 10, slow: true }],
    npcs: [
      { id: 'b_gent', sprite: 'gent', x: 16, y: 16, dir: 'r', talk: 'brassGent', wander: 2 },
      { id: 'b_lady', sprite: 'lady', x: 24, y: 14, dir: 'l', talk: 'brassLady', wander: 2 },
      { id: 'b_sailor', sprite: 'sailor', x: 22, y: 26, dir: 'd', talk: 'brassSailor' },
      { id: 'b_cop', sprite: 'constable', x: 6, y: 20, dir: 'd', talk: 'brassCop', unless: 'beat_regulator' },
      { id: 'b_cop2', sprite: 'constable', x: 33, y: 20, dir: 'd', talk: 'brassCop' , unless: 'beat_regulator' },
      { id: 'b_inn', sprite: 'innkeep', x: 6, y: 19, dir: 'd', talk: 'brassInn' },
      { id: 'b_shop', sprite: 'merchant', x: 32, y: 19, dir: 'd', talk: 'shopBrass' },
      { id: 'b_student', sprite: 'child', x: 34, y: 10, dir: 'l', talk: 'brassStudent' },
      { id: 'b_greyfang', sprite: 'wolfman', x: 26, y: 26, dir: 'l', talk: 'brassGreyfang', if: 'greyfang_debt' },
    ],
    warps: [{ x: 39, y: 13, w: 1, h: 5, to: 'fair', tx: 1.5, ty: 11.5, dir: 'r' }, { x: 0, y: 25, w: 1, h: 3, to: 'foundry', tx: 3.5, ty: 26.5, dir: 'r', if: 'foundry_open' }],
    saves: [[16, 18]],
    chests: [{ id: 'bh1', x: 38, y: 26, item: 'boltbomb', n: 3 }, { id: 'bh2', x: 1, y: 11, gold: 600 }],
    foes: [
      { id: 'bd1', x: 34, y: 25.6, list: ['smuggler', 'smuggler'], unless: 'beat_regulator' }, { id: 'bd2', x: 18, y: 25.6, list: ['sewerrat', 'smuggler'], unless: 'beat_regulator' },
    ],
    events: [
      { x: 19, y: 17, w: 2, h: 2, run: 'riftGate' }, { x: 0, y: 0, w: 40, h: 30, run: 'arriveBrass', touch: true, unless: 'arrived_brass' },
      { x: 0, y: 25, w: 1, h: 3, run: 'foundryShut', touch: true, unless: 'foundry_open' },
    ],
  };
});

def('hattie', () => {
  const g = grid(14, 11, 'p');
  rect(g, 0, 0, 14, 2, '#'); rect(g, 0, 0, 1, 11, '#'); rect(g, 13, 0, 1, 11, '#'); rect(g, 0, 10, 14, 1, '#'); rect(g, 6, 10, 2, 1, 'p');
  return {
    name: ['哈蒂鐘錶行', "Hattie's Watch Shop"], era: 'brass', music: 'home', base: 'floor:plank', order: ['floor:plank', 'wall:brick'], rows: rows(g), inside: true,
    props: [['shelf', 1, 2], ['books', 3, 2], ['table', 5, 4], ['barrel', 12, 2], ['bed', 11, 7], ['stove', 1, 7], ['vase', 9, 2]],
    deco: [{ kind: 'clock', x: 8, y: 1 }, { kind: 'clock', x: 10, y: 1, small: true }, { kind: 'clock', x: 6, y: 1, small: true }],
    npcs: [{ id: 'hattie', sprite: 'hattie', x: 7, y: 6, dir: 'd', talk: 'hattie' }],
    warps: [{ x: 6, y: 10, w: 2, h: 1, to: 'brass', tx: 6, ty: 9.6, dir: 'd' }],
    events: [{ x: 1, y: 2, w: 4, h: 2, run: 'hattieShelf', touch: false }],
  };
});

def('academy', () => {
  const g = grid(19, 14, 't');
  rect(g, 0, 0, 19, 2, 'W'); rect(g, 0, 0, 1, 14, 'W'); rect(g, 18, 0, 1, 14, 'W'); rect(g, 0, 13, 19, 1, 'W'); rect(g, 9, 13, 1, 1, 't');
  rect(g, 1, 6, 5, 1, 'W'); rect(g, 13, 6, 5, 1, 'W');
  return {
    name: ['黃銅港學院', 'Brasshaven Academy'], era: 'brass', music: 'archive', base: 'floor:tiles', order: ['floor:tiles', 'wall:white'], rows: rows(g), inside: true,
    props: [['books', 1, 2], ['books', 3, 2], ['shelf', 5, 2], ['books', 12, 2], ['books', 14, 2], ['shelf', 16, 2], ['table', 7, 8], ['glass', 1, 10], ['plant', 17, 12], ['plant', 1, 12], ['screen', 13, 9]],
    deco: [{ kind: 'gear', x: 9.5, y: 2.2, r: 14 }],
    npcs: [
      { id: 'a_student', sprite: 'gent', x: 4, y: 9, dir: 'r', talk: 'academyStudent' },
      { id: 'a_child', sprite: 'child', x: 15, y: 10, dir: 'l', talk: 'academyChild' },
    ],
    warps: [{ x: 9, y: 13, w: 1, h: 1, to: 'brass', tx: 33, ty: 9.6, dir: 'd' }],
    foes: [{ id: 'fenwick', x: 9, y: 4, list: ['fenwick'], boss: true, still: true, run: 'fenwickFight', if: 'mira_quest', unless: 'ep_mira' }],
    events: [{ x: 8, y: 3, w: 3, h: 2, run: 'calderDesk', touch: false }],
  };
});

def('fair', () => {
  const g = grid(36, 24, 'g');
  rect(g, 4, 6, 28, 13, 'd'); path(g, [[0, 11], [6, 11]], 'd', 2);
  rect(g, 22, 13, 9, 4, 'F');
  const props = [];
  border(props, 36, 24, ['oak', 'cherry', 'oak', 'bush'], 1, [[0, 9, 2, 5]], 121);
  props.push(['tent', 5, 9], ['tent', 13, 9], ['stall', 19, 7], ['stall', 25, 7], ['lamppost', 4, 6], ['lamppost', 31, 6], ['lamppost', 4, 18], ['lamppost', 31, 18], ['bigbarrels', 9, 17],
    ['flowers', 15, 18], ['flowers', 20, 18], ['crates', 6, 20], ['torch', 22, 12], ['torch', 30, 12], ['haycart', 26, 19]);
  return {
    name: ['齒輪市集', 'The Gearwork Fair'], era: 'brass', music: 'fair', base: 'grass', order: ['dirt', 'floor:flag'], rows: rows(g),
    props,
    deco: [{ kind: 'festival', x: 4, y: 6, w: 28 }, { kind: 'gear', x: 12, y: 4, r: 18 }, { kind: 'gear', x: 24, y: 4, r: 14, rev: true }],
    npcs: [
      { id: 'f_barker', sprite: 'barker', x: 9, y: 12, dir: 'd', talk: 'strengthBell' },
      { id: 'f_race', sprite: 'gent', x: 26, y: 12, dir: 'd', talk: 'beetleRace' },
      { id: 'f_prize', sprite: 'lady', x: 20, y: 10, dir: 'd', talk: 'prizeBooth' },
      { id: 'f_fish', sprite: 'sailor', x: 15, y: 15, dir: 'l', talk: 'fishTrader' },
      { id: 'f_kid', sprite: 'child', x: 12, y: 16, dir: 'r', talk: 'fairKid', wander: 2 },
    ],
    warps: [{ x: 0, y: 9, w: 1, h: 5, to: 'brass', tx: 38.2, ty: 15.5, dir: 'l' }],
    saves: [[17, 13]],
  };
});

def('foundry', () => {
  const g = grid(40, 30, 'S');
  rect(g, 1, 22, 12, 7, 'b'); rect(g, 13, 24, 2, 3, 'b'); rect(g, 14, 20, 13, 9, 'b'); rect(g, 19, 18, 3, 3, 'b'); rect(g, 16, 11, 11, 8, 'b');
  rect(g, 10, 13, 7, 3, 'b'); rect(g, 2, 3, 10, 12, 'b'); rect(g, 26, 13, 3, 3, 'b'); rect(g, 28, 15, 10, 11, 'b'); rect(g, 31, 11, 3, 5, 'b'); rect(g, 27, 2, 11, 10, 'b');
  rect(g, 16, 22, 9, 1, 'l'); rect(g, 30, 19, 6, 1, 'l'); rect(g, 4, 8, 2, 4, 'l'); rect(g, 29, 6, 1, 4, 'l'); rect(g, 36, 6, 1, 4, 'l');
  rect(g, 20, 22, 2, 1, 'b');
  return {
    name: ['鐘匠公會鑄造廠', 'The Bellwrights\' Foundry'], era: 'brass', music: 'foundry', base: 'floor:slab', order: ['lava', 'wall:stone'], rows: rows(g), tint: 'cave', battleMusic: 'battle2',
    props: [['bigbarrels', 2, 23], ['crates', 3, 27], ['barrel', 11, 23], ['terminal', 15, 20], ['terminal', 25, 20], ['junk', 23, 11], ['firebarrel', 17, 12], ['firebarrel', 25, 17], ['pillar', 28, 3], ['pillar', 36, 3],
      ['tire', 9, 4], ['junk', 3, 4], ['barrel', 37, 16], ['firebarrel', 29, 24]],
    deco: [{ kind: 'gear', x: 6, y: 22.2, r: 16 }, { kind: 'gear', x: 21, y: 20.2, r: 22, rev: true }, { kind: 'gear', x: 32.5, y: 2.3, r: 26, slow: true }, { kind: 'gear', x: 8, y: 3.2, r: 12 }],
    warps: [{ x: 1, y: 25, w: 1, h: 3, to: 'brass', tx: 1.6, ty: 26.5, dir: 'r' }],
    saves: [[7, 24], [22, 26]],
    chests: [{ id: 'fo1', x: 2, y: 13, item: 'gearstaff' }, { id: 'fo2', x: 36, y: 24, item: 'hiether', n: 2 }, { id: 'fo3', x: 10, y: 3, item: 'brasscoat' }, { id: 'fo4', x: 26, y: 27, item: 'springcoil', n: 3 }],
    foes: [
      { id: 'fo_a', x: 7, y: 25, list: ['automaton'] }, { id: 'fo_b', x: 18, y: 25, list: ['boilbeetle', 'cogspider'] }, { id: 'fo_c', x: 24, y: 26, list: ['gasghost', 'smokeimp'] },
      { id: 'fo_d', x: 6, y: 10, list: ['automaton', 'cogspider'] }, { id: 'fo_e', x: 32, y: 21, list: ['boilbeetle', 'boilbeetle', 'smokeimp'] }, { id: 'fo_f', x: 34, y: 17, list: ['constable', 'automaton'] },
      { id: 'calder', x: 21, y: 13, list: ['calder'], boss: true, still: true, run: 'calderFight', unless: 'beat_calder' },
      { id: 'regulator', x: 32, y: 5, list: ['regulator'], boss: true, still: true, run: 'regulatorFight', unless: 'beat_regulator' },
    ],
    events: [{ x: 7, y: 5, w: 2, h: 2, run: 'floodValve', touch: false }, { x: 31, y: 11, w: 3, h: 1, run: 'regulatorGate', touch: true, unless: 'beat_calder' }],
  };
});

// ======================= FROSTCRADLE: 30000 BC =======================
def('tundra', () => {
  const g = grid(46, 30, 'g');
  path(g, [[2, 15], [10, 15], [16, 12], [22, 12], [22, 2], [22, 0]], 'd', 2); path(g, [[22, 12], [30, 16], [38, 14], [45, 14]], 'd', 2); path(g, [[10, 15], [8, 22], [2, 25], [0, 25]], 'd', 2);
  path(g, [[30, 16], [36, 8], [38, 5]], 'd', 1);
  blob(g, 28, 23, 5, 3, 'w', 0.3, 3); blob(g, 12, 6, 4, 2.5, 'w', 0.3, 4); blob(g, 38, 5, 3.5, 2.5, 'd', 0.2, 5);
  const props = [], avoid = [[0, 12, 12, 7], [14, 9, 10, 6], [20, 0, 5, 14], [22, 11, 24, 8], [5, 13, 6, 14], [0, 22, 10, 6], [32, 2, 10, 9], [28, 6, 10, 10]];
  border(props, 46, 30, ['pine', 'pine2', 'tallpine'], 2, [[44, 12, 2, 5], [20, 0, 5, 2], [0, 23, 2, 4]], 131);
  scatter(props, g, 30, ['pine', 'pine2', 'rock', 'rock2', 'darkrock'], ['g'], avoid, 141, 3);
  return {
    name: ['霜原', 'The Frost Plain'], era: 'frost', music: 'tundra', base: 'grass', order: ['dirt', 'water'], rows: rows(g), tint: 'snow', palette: 'snow', battleMusic: 'battle2',
    props,
    deco: [{ kind: 'rift', x: 3, y: 15 }],
    npcs: [{ id: 'nilo', sprite: 'nilo', x: 12, y: 15, dir: 'r', talk: 'niloMeet', unless: 'has_nilo' }],
    warps: [{ x: 45, y: 12, w: 1, h: 5, to: 'camp', tx: 1.5, ty: 11.5, dir: 'r' }, { x: 20, y: 0, w: 5, h: 1, to: 'glacier', tx: 16.5, ty: 27.4, dir: 'u', if: 'glacier_open' },
      { x: 0, y: 23, w: 1, h: 4, to: 'wolfden', tx: 21.5, ty: 9.5, dir: 'l', if: 'calf_quest' }],
    saves: [[6, 17], [24, 14]],
    chests: [{ id: 't1', x: 4, y: 4, item: 'megatonic', n: 2 }, { id: 't2', x: 42, y: 26, item: 'iceward' }, { id: 't3', x: 33, y: 23, item: 'frostcrystal', n: 2 }],
    foes: [
      { id: 'nilo_meet', x: 15, y: 14, list: ['snowwolf', 'snowwolf'], unless: 'has_nilo', run: 'niloFight', scripted: true },
      { id: 't_a', x: 18, y: 6, list: ['snowfox', 'snowwolf'] }, { id: 't_b', x: 28, y: 15, list: ['aurochs'] }, { id: 't_c', x: 36, y: 15, list: ['icebear'] },
      { id: 't_d', x: 8, y: 22, list: ['snowwolf', 'snowwolf', 'snowfox'] }, { id: 't_e', x: 32, y: 10, list: ['aurochs', 'snowfox'] }, { id: 't_f', x: 40, y: 22, list: ['icebear', 'snowwolf'] },
      { id: 'moonelk', x: 38, y: 4, list: ['moonelk'], boss: true, still: true, run: 'moonElkFight', if: 'kaya_quest', unless: 'ep_kaya' },
    ],
    events: [{ x: 2, y: 14, w: 2, h: 2, run: 'riftGate' }, { x: 0, y: 0, w: 46, h: 30, run: 'arriveFrost', touch: true, unless: 'arrived_frost' },
      { x: 20, y: 0, w: 5, h: 2, run: 'glacierShut', touch: true, unless: 'glacier_open' }],
  };
});

def('camp', () => {
  const g = grid(32, 24, 'g');
  blob(g, 16, 12, 9, 6, 'd', 0.2, 2); rect(g, 0, 10, 8, 3, 'd'); blob(g, 26, 19, 3.5, 2.2, 'w', 0.2, 4);
  const props = [];
  border(props, 32, 24, ['pine', 'pine2', 'pine'], 1, [[0, 9, 2, 5]], 151);
  props.push(['tent', 4, 8], ['tent', 21, 8], ['tent', 6, 20], ['tent', 13, 6], ['torch', 13, 13], ['torch', 19, 13], ['firebarrel', 16, 14], ['bigrock', 26, 13], ['rock', 9, 16], ['haycart', 18, 19]);
  return {
    name: ['猛獁獵人的營地', "The Mammoth Hunters' Camp"], era: 'frost', music: 'camp', base: 'grass', order: ['dirt', 'water'], rows: rows(g), tint: 'snow', palette: 'snow',
    props,
    deco: [{ kind: 'icehole', x: 25, y: 18.4 }],
    npcs: [
      { id: 'yuka', sprite: 'yuka', x: 16, y: 11, dir: 'd', talk: 'yuka' },
      { id: 'c_hunter', sprite: 'hunterm', x: 10, y: 13, dir: 'r', talk: 'campHunter', wander: 2 },
      { id: 'c_trader', sprite: 'hunterf', x: 22, y: 12, dir: 'l', talk: 'shopCamp' },
      { id: 'c_child', sprite: 'child', x: 14, y: 17, dir: 'u', talk: 'campChild', wander: 1 },
      { id: 'c_calf', mon: 'bull', look: 'hue:30', scale: 0.55, x: 7, y: 14, dir: 'r', talk: 'calfNpc', if: 'calf_saved' },
    ],
    warps: [{ x: 0, y: 9, w: 1, h: 5, to: 'tundra', tx: 44.3, ty: 14.5, dir: 'l' }],
    saves: [[12, 16]],
    events: [{ x: 23, y: 17, w: 6, h: 4, run: 'fishSpot', touch: false, spot: 'ice' }],
  };
});

def('glacier', () => {
  const g = grid(34, 30, 'k');
  rect(g, 0, 0, 34, 2, 'C'); rect(g, 0, 0, 2, 30, 'C'); rect(g, 32, 0, 2, 30, 'C');
  blob(g, 9, 21, 4, 2.5, 'h', 0.3, 1); blob(g, 25, 17, 5, 3, 'w', 0.3, 2); blob(g, 10, 9, 3, 2, 'w', 0.3, 3); blob(g, 27, 7, 2.5, 2, 'h', 0.3, 4); blob(g, 5, 14, 2, 3, 'C', 0.3, 5);
  path(g, [[16, 29], [16, 23], [20, 20], [17, 13], [12, 13], [16, 7], [16, 3]], 'D', 2);
  blob(g, 16, 4, 4, 2, 'D', 0.1, 5);
  return {
    name: ['母星冰川', 'The Motherstone Glacier'], era: 'frost', music: 'glacier', base: 'rock', order: ['darkdirt', 'hole', 'water', 'wall:cave'], rows: rows(g), tint: 'ice', palette: 'ice', battleMusic: 'battle2',
    props: [['darkrock', 4, 24], ['darkrock2', 26, 25], ['spire', 21, 10], ['spire', 7, 26], ['darkrock', 22, 4], ['spire', 3, 6], ['darkrock2', 28, 12], ['spire', 13, 17], ['darkrock', 6, 4]],
    deco: [{ kind: 'motherstone', x: 16, y: 3.2 }],
    warps: [{ x: 15, y: 29, w: 3, h: 1, to: 'tundra', tx: 22.5, ty: 1.6, dir: 'd' }],
    saves: [[19, 26], [12, 11]],
    chests: [{ id: 'g1', x: 3, y: 20, item: 'frostlance' }, { id: 'g2', x: 29, y: 21, item: 'frostcrystal', n: 3 }, { id: 'g3', x: 4, y: 3, item: 'phoenix2' }, { id: 'g4', x: 29, y: 3, item: 'steadyring' }],
    foes: [
      { id: 'g_a', x: 16, y: 23, list: ['raider', 'raider'] }, { id: 'g_b', x: 20, y: 19, list: ['icebeetle', 'cavespider'] }, { id: 'g_c', x: 14, y: 13, list: ['icewing', 'raider'] },
      { id: 'g_d', x: 7, y: 17, list: ['cavespider', 'cavespider', 'icewing'] }, { id: 'g_e', x: 26, y: 10, list: ['icebeetle', 'icebear'] },
      { id: 'rimeback', x: 16, y: 7, list: ['rimeback'], boss: true, still: true, run: 'rimebackFight', unless: 'beat_rimeback' },
    ],
    events: [{ x: 14, y: 2, w: 5, h: 3, run: 'motherstone', touch: false }],
  };
});

def('wolfden', () => {
  const g = grid(24, 18, 'g');
  blob(g, 12, 9, 8, 5, 'd', 0.25, 2); path(g, [[12, 9], [23, 9]], 'd', 1);
  const props = [];
  border(props, 24, 18, ['pine', 'pine2', 'tallpine'], 1, [[22, 7, 2, 5]], 161);
  props.push(['rock', 5, 5], ['darkrock', 17, 13], ['rock2', 6, 13]);
  return {
    name: ['狼之谷', 'Wolf Hollow'], era: 'frost', music: 'glacier', base: 'grass', order: ['dirt'], rows: rows(g), tint: 'snow', palette: 'snow',
    props,
    npcs: [{ id: 'calf', mon: 'bull', look: 'hue:30', scale: 0.55, x: 6, y: 9, dir: 'r', talk: 'calfNpc', unless: 'calf_saved' }],
    warps: [{ x: 23, y: 7, w: 1, h: 5, to: 'tundra', tx: 1.5, ty: 24.5, dir: 'r' }],
    foes: [{ id: 'packmother', x: 10, y: 8, list: ['packmother', 'snowwolf'], boss: true, still: true, run: 'packMotherFight', unless: 'calf_saved' }],
  };
});

// ======================= EMBERFALL: AD 9000 =======================
def('ember', () => {
  const g = grid(40, 30, 'D');
  rect(g, 12, 11, 16, 10, 'F'); path(g, [[0, 15], [12, 15]], 'd', 2); path(g, [[28, 15], [39, 15]], 'd', 2); path(g, [[20, 8], [20, 11]], 'F', 2); path(g, [[8, 8], [8, 14]], 'd', 1);
  blob(g, 33, 25, 4, 2, 'l', 0.3, 3); blob(g, 5, 25, 3, 2, 'l', 0.3, 5); blob(g, 36, 6, 2.5, 1.6, 'l', 0.3, 6);
  const props = [], avoid = [[3, 3, 7, 7], [16, 0, 8, 10], [11, 10, 18, 12], [0, 13, 40, 5], [30, 11, 7, 9]];
  border(props, 40, 30, ['deadtree', 'darkrock', 'deadtree', 'darkrock2'], 1, [], 171);
  scatter(props, g, 14, ['deadtree', 'junk', 'darkrock', 'ruincol', 'firebarrel'], ['D'], avoid, 181, 3);
  props.push(['tomb', 6, 6], ['grave', 4, 7], ['grave2', 9, 7], ['ruinwall', 24, 24], ['ruinwall2', 13, 24], ['lamp', 12, 11], ['lamp', 27, 11], ['lamp', 12, 20], ['lamp', 27, 20], ['vending', 14, 12], ['terminal', 25, 19], ['firebarrel', 16, 20]);
  return {
    name: ['餘燼之城', 'Emberfall'], era: 'ember', music: 'ember', base: 'darkdirt', order: ['dirt', 'lava', 'floor:flag'], rows: rows(g), tint: 'ember', palette: 'ember', battleMusic: 'battle2',
    houses: [{ x: 17, y: 2, w: 7, style: 'stone', to: 'engine', tx: 11.5, ty: 37.2, tower: true, dark: true }, { x: 30, y: 12, w: 6, style: 'stone', dark: true, shut: true }],
    props,
    deco: [{ kind: 'sun', x: 20.5, y: 1 }, { kind: 'spire', x: 20.5, y: 4, dark: true }, { kind: 'rift', x: 20, y: 18 }],
    statues: [['emberfolk', 15, 17, 'd'], ['lumen', 7, 9, 'd']],
    npcs: [
      { id: 'e_folk', sprite: 'emberfolk', x: 24, y: 16, dir: 'l', talk: 'emberFolk' },
      { id: 'e_folk2', sprite: 'emberfolk', x: 33, y: 20, dir: 'd', talk: 'emberInn' },
      { id: 'e_vend', sprite: null, x: 14, y: 12, talk: 'shopEmber' },
    ],
    warps: [],
    saves: [[16, 18]],
    chests: [{ id: 'e1', x: 2, y: 3, item: 'embercore', n: 2 }, { id: 'e2', x: 37, y: 27, item: 'phoenix2' }, { id: 'e3', x: 37, y: 3, gold: 3000 }],
    foes: [
      { id: 'e_a', x: 6, y: 15, list: ['emberimp', 'ashwraith'] }, { id: 'e_b', x: 32, y: 16, list: ['ashlion'] }, { id: 'e_c', x: 30, y: 24, list: ['lavabeetle', 'emberimp'] },
      { id: 'e_d', x: 10, y: 24, list: ['lavapede'] }, { id: 'e_e', x: 26, y: 6, list: ['ashlion', 'ashwraith'] },
    ],
    events: [{ x: 19, y: 17, w: 2, h: 2, run: 'riftGate' }, { x: 0, y: 0, w: 40, h: 30, run: 'arriveEmber', touch: true, unless: 'arrived_ember' }, { x: 5, y: 6, w: 4, h: 2, run: 'lumenGrave', touch: false }],
  };
});

def('engine', () => {
  const g = grid(22, 40, 'v');
  path(g, [[11, 38], [11, 32], [5, 28], [5, 22], [15, 18], [16, 12], [11, 8], [11, 4]], 'F', 2);
  blob(g, 11, 5, 4, 3, 'F', 0.1, 1); blob(g, 11, 37, 3, 2, 'F', 0.1, 2); blob(g, 5, 25, 3, 3, 'k', 0.2, 3); blob(g, 15, 15, 3, 3, 'k', 0.2, 4); blob(g, 11, 20, 3, 2, 'F', 0.1, 5); blob(g, 13.5, 10, 3, 2.2, 'F', 0.1, 6); blob(g, 8, 10, 2.5, 1.8, 'F', 0.1, 7);
  return {
    name: ['悲鳴機關', 'The Grief Engine'], era: 'ember', music: 'engine', base: 'void', order: ['rock', 'floor:flag'], rows: rows(g), stars: true, tint: 'ember', palette: 'ember', battleMusic: 'battle2',
    props: [['pillar', 8, 3], ['pillar', 14, 3], ['terminal', 6, 21], ['terminal', 16, 14], ['vinepillar', 9, 34], ['vinepillar', 13, 34]],
    deco: [{ kind: 'gear', x: 11.5, y: 2, r: 30, slow: true, col: '#6a3a30' }, { kind: 'gear', x: 4, y: 22, r: 16, col: '#6a3a30' }, { kind: 'gear', x: 17, y: 12, r: 14, rev: true, col: '#6a3a30' }],
    warps: [{ x: 10, y: 38, w: 3, h: 2, to: 'ember', tx: 20.5, ty: 8.6, dir: 'd' }],
    saves: [[13, 36], [9, 9]],
    chests: [{ id: 'en1', x: 3, y: 24, item: 'emberweave' }, { id: 'en2', x: 18, y: 16, item: 'spiritcharm' }, { id: 'en3', x: 7, y: 9, item: 'hiether', n: 2 }],
    foes: [
      { id: 'en_a', x: 9, y: 32, list: ['husk', 'emberimp'] }, { id: 'en_b', x: 5, y: 25, list: ['acolyte', 'ashwraith', 'acolyte'] }, { id: 'en_c', x: 14, y: 16, list: ['lavapede', 'acolyte'] },
      { id: 'en_d', x: 9, y: 11, list: ['husk', 'ashlion'] },
      { id: 'lumenshade', x: 11, y: 20, list: ['lumenshade'], boss: true, still: true, run: 'lumenFight', unless: 'beat_lumen' },
      { id: 'griefengine', x: 11, y: 5, list: ['griefengine'], boss: true, still: true, run: 'griefFight', unless: 'beat_grief' },
    ],
  };
});

// ======================= PAST THE END OF TIME =======================
def('heart1', () => {
  const g = grid(24, 44, 'v');
  path(g, [[12, 42], [12, 36], [6, 32], [6, 26], [17, 22], [18, 16], [9, 12], [12, 8], [12, 2]], 'F', 2);
  blob(g, 12, 41, 3, 2, 'F', 0.1, 2); blob(g, 6, 29, 3, 3, 'k', 0.2, 3); blob(g, 17, 19, 3, 3, 'k', 0.2, 4); blob(g, 10, 12, 3, 2, 'k', 0.2, 5); blob(g, 12, 3, 3, 2, 'F', 0.1, 6);
  return {
    name: ['寂靜之心・回聲之路', 'The Heart of the Hush · the Road of Echoes'], era: 'heart', music: 'heart', base: 'void', order: ['rock', 'floor:flag'], rows: rows(g), stars: true, tint: 'void', palette: 'void', battleMusic: 'battle2',
    props: [['spire', 4, 28], ['spire', 8, 30], ['spire', 15, 18], ['vinepillar', 10, 38], ['vinepillar', 14, 38], ['tomb', 19, 20], ['grave', 4, 26], ['grave2', 8, 25]],
    deco: [{ kind: 'rift', x: 12, y: 42.4, red: true }, { kind: 'rift', x: 11.5, y: 1.6, red: true }],
    saves: [[14, 40], [10, 10]],
    chests: [{ id: 'h1', x: 3, y: 30, item: 'hourblade' }, { id: 'h2', x: 20, y: 18, item: 'sagestaff' }, { id: 'h3', x: 7, y: 11, item: 'plasmabow' }, { id: 'h4', x: 10, y: 41, item: 'godtonic', n: 3 }],
    foes: [
      { id: 'h_a', x: 10, y: 35, list: ['deathknight', 'voidwing'] }, { id: 'h_b', x: 6, y: 27, list: ['weaver', 'voidspider'] }, { id: 'h_c', x: 12, y: 24, list: ['timebound', 'echoshade'] },
      { id: 'h_d', x: 18, y: 15, list: ['echobear', 'voidwing'] }, { id: 'h_e', x: 9, y: 14, list: ['deathknight', 'weaver', 'echoshade'] },
      { id: 'echowarden', x: 6, y: 31, list: ['echowarden'], boss: true, still: true, run: 'echoFight', unless: 'beat_echowarden' },
      { id: 'echohorn', x: 17, y: 20, list: ['echohorn'], boss: true, still: true, run: 'echoFight', unless: 'beat_echohorn' },
      { id: 'choir', x: 12, y: 6, list: ['choir'], boss: true, still: true, run: 'choirFight', unless: 'beat_choir' },
    ],
    events: [{ x: 11, y: 41, w: 3, h: 2, run: 'heartBack' }, { x: 10, y: 1, w: 4, h: 2, run: 'heartOn', touch: true, if: 'beat_choir' }],
  };
});

def('heart2', () => {
  const g = grid(30, 30, 'v');
  blob(g, 15, 14, 9, 8, 'k', 0.2, 2); blob(g, 15, 14, 7.5, 6.5, 'F', 0.12, 3); path(g, [[15, 20], [15, 28]], 'F', 2); blob(g, 15, 27, 2.5, 1.4, 'k', 0.1, 4);
  return {
    name: ['寂靜之心・未生之室', 'The Heart of the Hush · the Unborn Chamber'], era: 'heart', music: 'heart', base: 'void', order: ['rock', 'floor:flag'], rows: rows(g), stars: true, tint: 'void', palette: 'void',
    props: [['pillar', 9, 9], ['pillar', 20, 9], ['pillar', 9, 17], ['pillar', 20, 17]],
    deco: [{ kind: 'star', x: 14.5, y: 9.5 }, { kind: 'rift', x: 14.5, y: 27.4, red: true }],
    saves: [[17, 25]],
    foes: [{ id: 'colossus', x: 15, y: 12, list: ['colossus'], boss: true, still: true, run: 'finalFight', unless: 'beat_unborn' }],
    events: [{ x: 13, y: 27, w: 4, h: 2, run: 'heartBack2' }],
  };
});

def('unrung', () => {
  const g = grid(17, 15, 'b');
  rect(g, 0, 0, 17, 3, 'S'); rect(g, 0, 0, 1, 15, 'S'); rect(g, 16, 0, 1, 15, 'S'); rect(g, 0, 14, 17, 1, 'S'); rect(g, 8, 14, 1, 1, 'b');
  return {
    name: ['未鳴之鐘', 'The Unrung Bell'], era: 'interval', music: 'clock', base: 'floor:slab', order: ['floor:slab', 'wall:stone'], rows: rows(g), inside: true, tint: 'void',
    props: [['pillar', 2, 4], ['pillar', 14, 4], ['pillar', 2, 11], ['pillar', 14, 11]],
    deco: [{ kind: 'bell', x: 8.5, y: 5.2 }],
    npcs: [],
    warps: [{ x: 8, y: 14, w: 1, h: 1, to: 'interval', tx: 16.5, ty: 22.4, dir: 'u' }],
    saves: [[3, 12]],
    foes: [{ id: 'eternal', x: 8, y: 8, list: ['eternal'], boss: true, still: true, run: 'eternalFight', unless: 'beat_eternal' }],
  };
});

export { MAPS };
