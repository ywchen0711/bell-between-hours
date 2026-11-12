// Every picture is loaded before anything else runs, so tiles and sprites can be cut out synchronously.
// Map tiles: the LPC Tile Atlas 1 and 2 (CC-BY-SA 3.0 / GPL 3.0). People: built from the Universal LPC
// Spritesheet layers. Creatures: the LPC monsters by Charles Gabriel and friends. See CREDITS.md.
export const ATLASES = ['terrain', 'base', 'build', 'misc'];
export const MONS = ['bat', 'bee', 'big_worm', 'eyeball', 'ghost', 'man_eater_flower', 'pumpking', 'slime', 'small_worm', 'snake'];

// a picture that fails to arrive (a dropped connection) is asked for again twice before it is given up as missing
const load = (src, tries = 3) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => { if (tries > 1) setTimeout(() => load(src, tries - 1).then(res), 300); else { console.warn('missing picture', src); res(null); } }; im.src = src; });
export const CHAR_META = await (await fetch('assets/chars/meta.json')).json();
// more LPC creatures (wolves, bears, spiders, imps and others), normalised to one layout by the build script
export const MON2_META = await (await fetch('assets/mon2/meta.json')).json();
const pairs = [
  ...ATLASES.map((n) => ['t:' + n, 'assets/tiles/' + n + '.png']),
  ...Object.keys(CHAR_META).map((n) => ['c:' + n, 'assets/chars/' + n + '.png']),
  ...MONS.map((n) => ['m:' + n, 'assets/mon/' + n + '.png']),
  ...Object.keys(MON2_META).map((n) => ['m2:' + n, 'assets/mon2/' + n + '.png']),
];
const got = await Promise.all(pairs.map(([, src]) => load(src)));
export const IMG = Object.fromEntries(pairs.map(([k], i) => [k, got[i]]));
export const atlas = (n) => IMG['t:' + n];
