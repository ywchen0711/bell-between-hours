// People and creatures. Every person is one LPC sheet: rows of 64px frames (bigger frames for long
// weapons), four directions per animation in the order up, left, down, right.
import { IMG, CHAR_META, MON2_META } from './assets.js';
import { canvas } from './gfx.js';

export const DIRS = { u: 0, l: 1, d: 2, r: 3 };
export const dirOf = (dx, dy) => (Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'l' : 'r') : dy < 0 ? 'u' : 'd');

// recoloured copies of a sheet: 'stone' is the grey of people caught in the stillness, 'hue:N' turns the colours round
const tinted = new Map();
function sheet(key, look) {
  const src = IMG[key];
  if (!look || !src) return src;
  const id = key + '|' + look;
  let c = tinted.get(id);
  if (c) return c;
  c = canvas(src.width, src.height);
  c.x.drawImage(src, 0, 0);
  const d = c.x.getImageData(0, 0, c.width, c.height), p = d.data;
  const [kind, arg] = look.split(':'), rot = (+arg || 0) * Math.PI / 180, cs = Math.cos(rot), sn = Math.sin(rot);
  for (let i = 0; i < p.length; i += 4) {
    if (!p[i + 3]) continue;
    const r = p[i], g = p[i + 1], b = p[i + 2];
    if (kind === 'stone') {
      const l = r * 0.3 + g * 0.55 + b * 0.15;
      p[i] = l * 0.82 + 18; p[i + 1] = l * 0.86 + 20; p[i + 2] = l * 0.95 + 28;
    } else if (kind === 'hue') {
      // rotate the colour round the grey axis (YIQ)
      const y = 0.299 * r + 0.587 * g + 0.114 * b, I = 0.596 * r - 0.274 * g - 0.322 * b, Q = 0.211 * r - 0.523 * g + 0.312 * b;
      const i2 = I * cs - Q * sn, q2 = I * sn + Q * cs;
      p[i] = y + 0.956 * i2 + 0.621 * q2; p[i + 1] = y - 0.272 * i2 - 0.647 * q2; p[i + 2] = y - 1.106 * i2 + 1.703 * q2;
    } else if (kind === 'dark') {
      p[i] = r * 0.45 + 30; p[i + 1] = g * 0.3 + 10; p[i + 2] = b * 0.5 + 50;
    } else if (kind === 'frost') {
      const l = r * 0.3 + g * 0.55 + b * 0.15;
      p[i] = l * 0.75 + 60; p[i + 1] = l * 0.85 + 70; p[i + 2] = l * 0.7 + 105;
    } else if (kind === 'void') {
      const l = r * 0.3 + g * 0.55 + b * 0.15;
      p[i] = l * 0.35 + 24; p[i + 1] = l * 0.2 + 8; p[i + 2] = l * 0.55 + 46;
      if (l > 170) { p[i] = 230; p[i + 1] = 200; p[i + 2] = 255; }
    } else if (kind === 'ember') {
      const l = r * 0.3 + g * 0.55 + b * 0.15;
      p[i] = l * 0.9 + 40; p[i + 1] = l * 0.45 + 10; p[i + 2] = l * 0.25;
    } else if (kind === 'brass') {
      const l = r * 0.3 + g * 0.55 + b * 0.15;
      p[i] = l * 0.95 + 30; p[i + 1] = l * 0.75 + 16; p[i + 2] = l * 0.35;
    } else if (kind === 'gold') {
      const l = r * 0.3 + g * 0.55 + b * 0.15;
      p[i] = l * 0.8 + 70; p[i + 1] = l * 0.7 + 50; p[i + 2] = l * 0.3 + 10;
    }
  }
  c.x.putImageData(d, 0, 0);
  tinted.set(id, c);
  return c;
}

export function shadow(g, x, y, w = 14) {
  g.fillStyle = 'rgba(0,0,0,0.28)';
  g.beginPath(); g.ellipse(Math.round(x), Math.round(y), w, w * 0.38, 0, 0, Math.PI * 2); g.fill();
}

// a person standing with their feet at (x, y)
export function drawChar(g, name, { anim = 'walk', dir = 'd', frame = 0, x, y, look, alpha = 1, scale = 1 } = {}) {
  const m = CHAR_META[name];
  if (!m) return;
  const a = m[anim] || m.walk, img = sheet('c:' + name, look);
  if (!img) return;
  const fs = a.fs, row = a.rows === 1 ? 0 : DIRS[dir] ?? 2, f = Math.max(0, Math.min(a.n - 1, Math.floor(frame)));
  const s = fs * scale;
  g.globalAlpha = alpha;
  g.drawImage(img, f * fs, a.y + row * fs, fs, fs, Math.round(x - s / 2), Math.round(y - s / 2 - 28 * scale), s, s);
  g.globalAlpha = 1;
}
export const animFrames = (name, anim) => (CHAR_META[name] && CHAR_META[name][anim] ? CHAR_META[name][anim].n : 0);
export const hasAnim = (name, anim) => !!(CHAR_META[name] && CHAR_META[name][anim]);

// creatures: frame size, frames in a row, which frames are the idle loop and which the attack;
// foot is how far below the cell's middle the lowest pixel is, so it lands on the shadow;
// clip cuts off a shadow painted into the sheet (fliers get the game's own shadow on the ground)
export const MON = {
  bat: { fs: 64, idle: [0, 1, 2, 3, 4, 5, 6], atk: [0, 1, 2, 3], foot: 16, fly: 10 },
  bee: { fs: 32, idle: [0, 1, 2, 3, 4, 5], atk: [0, 1, 2, 3], foot: 9, clip: 26, fly: 12, scale: 1.4 },
  big_worm: { fs: 64, idle: [0, 1, 2, 3], atk: [4, 5, 4], foot: 25 },
  eyeball: { fs: 64, idle: [0, 1, 2, 3], atk: [4, 5, 6], foot: 12, clip: 44, fly: 4 },
  ghost: { fs: 64, idle: [0, 1, 2], atk: [3, 4, 5], foot: 15, clip: 46, fly: 6 },
  man_eater_flower: { fs: 128, idle: [0, 1, 2, 3], atk: [4, 5, 4], foot: 38 },
  pumpking: { fs: 64, idle: [0, 1, 2, 3], atk: [4, 5, 4], foot: 26 },
  slime: { fs: 64, idle: [0, 1, 2, 3], atk: [4, 5, 4], foot: 15 },
  small_worm: { fs: 64, idle: [0, 1, 2], atk: [3, 4, 3], foot: 16 },
  snake: { fs: 64, idle: [0, 1, 2, 3], atk: [4, 5, 6], foot: 16 },
};
// the second set of creatures (OpenGameArt LPC sheets, normalised): fw x fh cells, feet `pad` above the bottom
for (const [n, m] of Object.entries(MON2_META)) MON[n] = { ...m, src: 'm2:' + n, foot: 0, fly: m.fly };
export const monName = (sprite) => sprite.slice(sprite.indexOf(':') + 1);
export const isMon = (sprite) => sprite[0] === 'm';
// the man-eater's first row is the bud asleep; it wakes facing down
export function drawMon(g, name, { dir = 'd', frame = 0, attacking = false, x, y, look, alpha = 1, scale = 1, t = 0 } = {}) {
  const m = MON[name], img = m && sheet(m.src || 'm:' + name, look);
  if (!m || !img) return;
  if (m.fw) {
    const seq = attacking ? m.atk : m.idle, f = seq[Math.floor(frame) % seq.length], row = DIRS[dir] ?? 2;
    const lift = m.fly ? m.fly + Math.sin(t * 4) * 2 : 0, w = m.fw * scale, h = m.fh * scale;
    g.globalAlpha = alpha;
    g.drawImage(img, f * m.fw, row * m.fh, m.fw, m.fh, Math.round(x - w / 2), Math.round(y - (m.fh - m.pad) * scale - lift), w, h);
    g.globalAlpha = 1;
    return;
  }
  const seq = attacking ? m.atk : m.idle, f = seq[Math.floor(frame) % seq.length];
  let row = DIRS[dir] ?? 2;
  if (name === 'man_eater_flower') row = row === 0 ? 1 : row;
  const sc = scale * (m.scale || 1), s = m.fs * sc, lift = m.fly ? m.fly + Math.sin(t * 4) * 2 : 0;
  g.globalAlpha = alpha;
  const ch = m.clip && !attacking ? m.clip : m.fs;
  g.drawImage(img, f * m.fs, row * m.fs, m.fs, ch, Math.round(x - s / 2), Math.round(y - m.foot * sc - s / 2 - lift), s, ch * sc);
  g.globalAlpha = 1;
}
