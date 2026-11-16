// The paper doll: what a hero wears shows on them. Each hero is cut into a few layer sheets (their own body,
// clothes, face and hair, split where gear goes in between), and every weapon, armour and some accessories have
// layer sheets of their own (all Universal LPC layers, made by the build script into assets/doll). When a hero's
// equipment changes, the layers are stacked by depth into one sheet in the browser, in the same layout the
// sprite code already reads, and swapped in for the hero's old sheet. Layer sheets load only when first needed.
import { IMG, CHAR_META } from './assets.js';
import { canvas } from './gfx.js';
import { ITEMS, HEROES } from './data.js';
import { forgetSheet } from './sprites.js';

let META = null;
try { META = await (await fetch('assets/doll/doll.json?v=1')).json(); } catch (e) { META = null; }
export const dollReady = () => !!META;

// which look each piece of equipment has; anything not listed gets one from its kind and strength
export const LOOK = {
  woodsword: 'sw_wood', ironsword: 'sw_iron', bellsword: 'sw_saber', starblade: 'sw_long', brasssword: 'sw_brass', frostbrand: 'sw_frost', emberblade: 'sw_ember', hourblade: 'sw_hour',
  oakstaff: 'st_oak', runestaff: 'st_rune', emberrod: 'st_ember', gearstaff: 'st_gear', aurorarod: 'st_aurora', cinderwand: 'st_cinder', sagestaff: 'st_sage',
  scrapbow: 'xb_scrap', arcbow: 'xb_arc', railbow: 'xb_rail', steambow: 'xb_steam', frostbow: 'xb_frost', plasmabow: 'xb_plasma',
  bonebow: 'bw_bone', hornbow: 'bw_horn', windbow: 'bw_wind', ivorybow: 'bw_ivory', emberbow: 'bw_ember', dawnbow: 'bw_dawn',
  flintspear: 'sp_flint', ivoryspear: 'sp_ivory', frostlance: 'sp_frost', emberlance: 'sp_ember', starlance: 'sp_star',
  duskscythe: 'sc_dusk', griefscythe: 'sc_grief', endscythe: 'sc_end',
  tunic: null, robe: null, hide: 'leather', leather: 'leather', chain: 'chain', weave: 'weave', aegis: 'aegis', furcoat: 'fur', mourncloak: 'mourn',
  brasscoat: 'brass', mammothhide: 'mammoth', emberweave: 'emberweave', starmail: 'star',
  fireward: 'ward_red', iceward: 'ward_blue', voidward: 'ward_purple', antidoteamulet: 'ward_green', amulet: 'ward_blue', lumenstar: 'ward_purple',
  hasteband: 'bracers', mammothtusk: 'bracers', critlens: 'lens',
};
// a new weapon of a kind gets a look by how strong it is
const BY_TIER = {
  sword: [[8, 'sw_wood'], [15, 'sw_iron'], [24, 'sw_steel'], [34, 'sw_saber'], [46, 'sw_ember'], [1e9, 'sw_hour']],
  staff: [[4, 'st_oak'], [8, 'st_gnarled'], [12, 'st_rune'], [15, 'st_gear'], [17, 'st_aurora'], [1e9, 'st_sage']],
  crossbow: [[12, 'xb_scrap'], [24, 'xb_arc'], [36, 'xb_steam'], [46, 'xb_frost'], [1e9, 'xb_plasma']],
  bow: [[14, 'bw_bone'], [24, 'bw_horn'], [34, 'bw_wind'], [42, 'bw_ivory'], [50, 'bw_ember'], [1e9, 'bw_dawn']],
  spear: [[24, 'sp_flint'], [34, 'sp_ivory'], [42, 'sp_frost'], [50, 'sp_ember'], [1e9, 'sp_star']],
  scythe: [[40, 'sc_dusk'], [50, 'sc_grief'], [1e9, 'sc_end']],
};
const ARMOUR_TIER = [[5, null], [10, 'leather'], [16, 'chain'], [24, 'brass'], [32, 'plate'], [1e9, 'star']];
export function lookOf(slot, id) {
  const it = ITEMS[id];
  if (!it) return null;
  if (id in LOOK) return LOOK[id];
  if (slot === 'weapon') { const t = BY_TIER[it.for]; return t ? t.find(([n]) => (it.atk || 0) < n)[1] : null; }
  if (slot === 'armor') return ARMOUR_TIER.find(([n]) => (it.def || 0) < n)[1];
  return null;
}
// what a hero would look like in this equipment
function looksFor(hid, equip) {
  const H = META && META.heroes[hid];
  if (!H) return null;
  let w = lookOf('weapon', equip.weapon), a = lookOf('armor', equip.armor), x = lookOf('acc', equip.acc);
  if (!w || !META.weapons[w]) w = BY_TIER[HEROES[hid].weapon] ? BY_TIER[HEROES[hid].weapon][0][1] : null;
  if (a && !META.armours[a]) a = null;
  if (x && !META.accs[x]) x = null;
  // the one who already wears dark glasses keeps them
  if (x === 'lens' && hid === 'silas') x = null;
  return { w, a, x, key: hid + '|' + w + '|' + a + '|' + x };
}

// layer sheets, loaded once and kept while there are not too many
const imgs = new Map();
function sheetImg(file) {
  let p = imgs.get(file);
  if (!p) {
    p = new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = 'assets/doll/' + file + '?v=1'; });
    imgs.set(file, p);
    if (imgs.size > 40) imgs.delete(imgs.keys().next().value);
  }
  return p;
}
// stack the layers into one sheet
const built = new Map();
function build(hid, L) {
  let p = built.get(L.key);
  if (p) return p;
  const H = META.heroes[hid], body = H.body;
  const packs = [{ pk: H.pack, own: true }];
  if (L.w) packs.push({ pk: META.weapons[L.w] });
  if (L.a) packs.push({ pk: META.armours[L.a][body] });
  if (L.x) packs.push({ pk: META.accs[L.x][body] });
  const hide = new Set([...(L.a ? META.armours[L.a].hide : []), ...(L.x ? META.accs[L.x].hide : [])]);
  p = Promise.all(packs.map((q) => sheetImg(q.pk.file))).then((ims) => {
    if (ims.some((im) => !im)) return null;
    const parts = [];
    packs.forEach((q, i) => { for (const pt of q.pk.parts) if (!(q.own && pt.tag && hide.has(pt.tag))) parts.push({ ...pt, img: ims[i], own: q.own }); });
    // deeper layers first; at the same depth the hero's own layers go under the gear
    parts.sort((a, b) => a.z - b.z || (b.own ? 1 : 0) - (a.own ? 1 : 0));
    const meta = {}; let y = 0, w = 0;
    for (const a of H.anims) { const [fs, n, rows] = H.layout[a]; meta[a] = { y, fs, n, rows }; y += fs * rows; w = Math.max(w, fs * n); }
    const c = canvas(w, y), g = c.x;
    for (const a of H.anims) {
      const { y: Y, fs, n } = meta[a];
      for (const pt of parts) {
        const s = pt.a[a];
        if (!s) continue;
        const [sy, lf, ln, lr] = s, off = (fs - lf) / 2;
        if (lf === fs) { g.drawImage(pt.img, 0, sy, lf * ln, lf * lr, 0, Y, lf * ln, lf * lr); continue; }
        for (let r = 0; r < lr; r++) for (let k = 0; k < Math.min(n, ln); k++) g.drawImage(pt.img, k * lf, sy + r * lf, lf, lf, k * fs + off, Y + r * fs + off, lf, lf);
      }
    }
    return { img: c, meta };
  });
  built.set(L.key, p);
  return p;
}
// keep the stacked sheets of the last few looks: the ones worn, and what the equip screen showed lately
function remember(key, r) {
  if (!r) { delete ready[key]; built.delete(key); return; }
  ready[key] = r;
  const keys = Object.keys(ready).filter((k) => ready[k] && !worn.has(k) && !Object.values(wearing).includes(k));
  while (keys.length > 10) { const k = keys.shift(); delete ready[k]; built.delete(k); }
}
function start(hid, L) { if (ready[L.key] === undefined) { ready[L.key] = null; build(hid, L).then((r) => remember(L.key, r)); } }
const worn = new Map(); // key -> sprite name it is worn under
const wearing = {};     // sprite -> key
const ready = {};       // key -> { img, meta } once built
function install(sprite, r) {
  IMG['c:' + sprite] = r.img; CHAR_META[sprite] = r.meta; forgetSheet('c:' + sprite);
}
// put on each member what they have equipped (cheap to call every frame: only a change starts any work)
export function dress(members) {
  if (!META) return;
  for (const m of members) {
    const sprite = HEROES[m.id] && HEROES[m.id].sprite, L = looksFor(m.id, m.equip || {});
    if (!sprite || !L || wearing[sprite] === L.key) continue;
    if (ready[L.key]) { install(sprite, ready[L.key]); wearing[sprite] = L.key; worn.set(L.key, sprite); continue; }
    start(m.id, L);
  }
  // forget looks nobody wears any more
  for (const [k, sp] of worn) if (wearing[sp] !== k) { worn.delete(k); }
}
// the equip screen: a sprite name showing this hero in this equipment (or null while it is being put together)
export function preview(hid, equip) {
  if (!META) return null;
  const L = looksFor(hid, equip);
  if (!L) return null;
  if (ready[L.key]) { const sp = 'pv_' + hid; if (wearing[sp] !== L.key) { install(sp, ready[L.key]); wearing[sp] = L.key; } return sp; }
  start(hid, L);
  return null;
}
// wait until everyone shown is dressed (used when a game starts or loads, so nobody pops into new clothes)
export async function dressed(members) {
  dress(members);
  for (let i = 0; i < 100; i++) {
    if (members.every((m) => { const L = looksFor(m.id, m.equip || {}); return !L || ready[L.key] === undefined || ready[L.key]; })) break;
    await new Promise((r) => setTimeout(r, 20));
  }
  dress(members);
}
