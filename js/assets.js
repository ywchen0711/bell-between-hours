// Every picture is loaded before anything else runs, so tiles and sprites can be cut out synchronously.
// Map tiles: the LPC Tile Atlas 1 and 2 (CC-BY-SA 3.0 / GPL 3.0). People: built from the Universal LPC
// Spritesheet layers. Creatures: the LPC monsters by Charles Gabriel and friends. See CREDITS.md.
export const ATLASES = ['terrain', 'base', 'build', 'misc'];
export const MONS = ['bat', 'bee', 'big_worm', 'eyeball', 'ghost', 'man_eater_flower', 'pumpking', 'slime', 'small_worm', 'snake'];

const load = (src) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => { console.warn('missing picture', src); res(null); }; im.src = src; });
export const CHAR_META = await (await fetch('assets/chars/meta.json')).json();
const pairs = [
  ...ATLASES.map((n) => ['t:' + n, 'assets/tiles/' + n + '.png']),
  ...Object.keys(CHAR_META).map((n) => ['c:' + n, 'assets/chars/' + n + '.png']),
  ...MONS.map((n) => ['m:' + n, 'assets/mon/' + n + '.png']),
];
const got = await Promise.all(pairs.map(([, src]) => load(src)));
export const IMG = Object.fromEntries(pairs.map(([k], i) => [k, got[i]]));
export const atlas = (n) => IMG['t:' + n];
