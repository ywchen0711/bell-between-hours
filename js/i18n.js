// Language switching. Text is written in place as L('中文', 'English'); data tables get
// getters so .name and .desc follow the current language.

function initial() {
  try { const v = localStorage.getItem('bellhours-lang'); if (v === 'zh' || v === 'en') return v; } catch (e) { /* no storage */ }
  try { return /^zh/i.test(navigator.language) ? 'zh' : 'en'; } catch (e) { return 'zh'; }
}
export let LANG = initial();
const hooks = [];
export function onLang(f) { hooks.push(f); }
export function setLang(l) {
  LANG = l;
  try { localStorage.setItem('bellhours-lang', l); } catch (e) { /* private mode */ }
  try { document.documentElement.lang = l === 'en' ? 'en' : 'zh-Hant'; } catch (e) { /* node */ }
  for (const f of hooks) f(l);
}
export const isEn = () => LANG === 'en';
export const L = (zh, en) => (LANG === 'en' ? en : zh);

// table: { id: { name, desc, ... } }; en: { id: [name, desc] } or { id: { name, desc } }
export function localize(table, en, fields = ['name', 'desc']) {
  for (const [id, tr] of Object.entries(en)) {
    const o = table[id];
    if (!o) continue;
    const vals = Array.isArray(tr) ? Object.fromEntries(fields.map((f, i) => [f, tr[i]])) : tr;
    for (const [f, v] of Object.entries(vals)) {
      if (v === undefined) continue;
      const zh = o[f];
      Object.defineProperty(o, f, { get: () => (LANG === 'en' ? v : zh), enumerable: true, configurable: true });
    }
  }
}

// speaker names in dialogue
const NAMES = {
  蓮: 'Ren', 米拉: 'Mira', 卡雅: 'Kaya', 賽勒斯: 'Silas', 奧林師傅: 'Master Orrin', 女王: 'The Queen', 鎮民: 'Townsfolk', 守衛: 'Guard', 商人: 'Merchant',
  旅店老闆娘: 'Innkeeper', 小孩: 'Child', 盜賊: 'Bandit', 灰牙: 'Greyfang', 薇絲珀: 'Vesper', 伊歐妮: 'Ione', 倖存者: 'Survivor', 族長: 'Chief Toran', 老祖母: 'Grandmother Ama',
  族人: 'Tribesman', 族裡的女人: 'Tribeswoman', 石角: 'Stonehorn', 看守者: 'The Warden', 寂靜: 'Hush', 鐘: 'The Bell', '？？？': '???',
};
export const speaker = (n) => (n && LANG === 'en' ? NAMES[n] || n : n);
