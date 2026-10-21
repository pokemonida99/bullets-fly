// 圖片：角色動作格（tools/slice.py → SPRITE_DATA）、背景與頭像（tools/stage_art.py → BG_ART / PORTRAITS）
'use strict';
const SPR = {};          // SPR[cid][frame] = { c: canvas, w, h, ax, white: 閃白剪影（用到才做） }
const loadImg = src => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });

const SPRITES_READY = Promise.all(Object.entries(window.SPRITE_DATA || {}).map(([cid, d]) => loadImg(d.img).then(im => {
  SPR[cid] = {};
  if (!im) return;
  for (const [n, [fx, fy, fw, fh, ax]] of Object.entries(d.frames)) {
    const [c, g] = mkCanvas(fw, fh);
    g.drawImage(im, fx, fy, fw, fh, 0, 0, fw, fh);
    SPR[cid][n] = { c, w: fw, h: fh, ax };
  }
})));

const IMG = { bg: {}, por: {}, porBig: {}, prop: {} };
const ART_READY = Promise.all([
  ...Object.entries(window.PROP_ART || {}).map(([k, u]) => loadImg(u).then(im => { IMG.prop[k] = im; if (im && k !== 'drum') ICON[k] = im; })),
  ...Object.entries(window.BG_ART || {}).map(([k, u]) => loadImg(u).then(im => { IMG.bg[k] = im; })),
  ...Object.entries(window.PORTRAITS || {}).map(([k, u]) => loadImg(u).then(im => { IMG.por[k] = im; })),
  ...Object.entries(window.PORTRAITS_BIG || {}).map(([k, u]) => loadImg(u).then(im => { IMG.porBig[k] = im; })),
]);

function frameOf(cid, name) {
  const s = SPR[cid];
  if (!s) return null;
  return s[name] || s.idle0 || null;
}
// 在 (x, 腳底 y) 畫一格；face = 1 面右、-1 面左。opt: flash 閃白, alpha, sil 剪影色, rot 旋轉（倒地飛出用）
function drawSpr(cid, name, x, y, face, opt = {}) {
  const f = frameOf(cid, name);
  if (!f) return;
  let img = f.c;
  if (opt.flash) img = f.white || (f.white = silhouette(f.c, '#ffffff'));
  else if (opt.sil) { f.sils = f.sils || {}; img = f.sils[opt.sil] || (f.sils[opt.sil] = silhouette(f.c, opt.sil)); }
  ctx.save();
  if (opt.alpha != null) ctx.globalAlpha = opt.alpha;
  ctx.translate(Math.round(x), Math.round(y));
  if (face < 0) ctx.scale(-1, 1);
  if (opt.rot) { ctx.translate(0, -f.h / 2); ctx.rotate(opt.rot); ctx.translate(0, f.h / 2); }
  ctx.drawImage(img, -f.ax, -f.h);
  ctx.restore();
}
// 色調版本（換色雜兵）：把灰頭巾一帶的顏色換掉太難，改成整體疊一層色
const tintCache = {};
function tinted(cid, name, col) {
  const k = cid + name + col;
  if (tintCache[k]) return tintCache[k];
  const f = frameOf(cid, name); if (!f) return null;
  const [c, g] = mkCanvas(f.w, f.h);
  g.drawImage(f.c, 0, 0);
  g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 0.16; g.fillStyle = col; g.fillRect(0, 0, f.w, f.h);
  return (tintCache[k] = { c, w: f.w, h: f.h, ax: f.ax });
}
function drawTinted(cid, name, x, y, face, col, opt = {}) {
  if (!col || opt.flash) return drawSpr(cid, name, x, y, face, opt);
  const f = tinted(cid, name, col); if (!f) return;
  ctx.save();
  if (opt.alpha != null) ctx.globalAlpha = opt.alpha;
  ctx.translate(Math.round(x), Math.round(y)); if (face < 0) ctx.scale(-1, 1);
  if (opt.rot) { ctx.translate(0, -f.h / 2); ctx.rotate(opt.rot); ctx.translate(0, f.h / 2); }
  ctx.drawImage(f.c, -f.ax, -f.h);
  ctx.restore();
}

// ---------- 程式畫的小道具（酒罈、木箱、烤鵝、涼粉、銀元、子彈、飛刀……） ----------
function px(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
const ICON = {};
function pixIcon(name, rows, pal) {
  const h = rows.length, w = rows[0].length;
  const [c, g] = mkCanvas(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = rows[y][x];
    if (ch !== '.' && pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); }
  }
  ICON[name] = c;
}
pixIcon('jar', [
  '....kkkkkk....',
  '...kbbbbbbk...',
  '....kddddk....',
  '...kbbbbbbk...',
  '..kbbbbbbbbk..',
  '.kbbbbrrbbbbk.',
  '.kbbbrrrrbbbk.',
  'kbbbbryyrbbbbk',
  'kbbbbryyrbbbbk',
  'kbbbbrrrrbbbbk',
  'kbbbbbrrbbbbbk',
  'kbbbbbbbbbbbdk',
  '.kbbbbbbbbbdk.',
  '.kbbbbbbbbddk.',
  '..kbbbbbbddk..',
  '...kddddddk...',
  '....kkkkkk....',
], { k: '#2a1408', b: '#8a4a22', d: '#5a2c12', r: '#c8202a', y: '#f0c040' });
pixIcon('crate', [
  'kkkkkkkkkkkkkkkk',
  'kwwwwwwwwwwwwwwk',
  'kwddddddddddddwk',
  'kwdwwddddddwwdwk',
  'kwddwwddddwwddwk',
  'kwddddwwwwddddwk',
  'kwwwwwwwwwwwwwwk',
  'kwddddwwwwddddwk',
  'kwddwwddddwwddwk',
  'kwdwwddddddwwdwk',
  'kwddddddddddddwk',
  'kwwwwwwwwwwwwwwk',
  'kkkkkkkkkkkkkkkk',
], { k: '#2a1a0a', w: '#c08a48', d: '#8a5a28' });
pixIcon('goose', [
  '.......kk.....',
  '......kbbk....',
  '..kkkkbbbk....',
  '.kbbbbbbbbkk..',
  'kbllbbbbbbbbk.',
  'kbbbbbbbbbbbbk',
  'kbbbbbbbbbbbdk',
  '.kbbbbbbbbbdk.',
  '..kddddddddk..',
  '.kwwwwwwwwwwk.',
  'kwwwwwwwwwwwwk',
  '.kkkkkkkkkkkk.',
], { k: '#2a1006', b: '#c8641e', l: '#f8b860', d: '#8a3a10', w: '#e8e8f0' });
pixIcon('jelly', [
  '...kkkkkk...',
  '..kgggggggk.',
  '.kglgggggggk',
  '.kgggggggggk',
  'kwwwwwwwwwwk',
  'kwbbbbbbbbwk',
  '.kwwwwwwwwk.',
  '..kkkkkkkk..',
], { k: '#1a2a1a', g: '#a8d8a0', l: '#e8fff0', w: '#f0f0f0', b: '#3a6ac8' });
pixIcon('coin', [
  '..kkkk..',
  '.kyyyyk.',
  'kyywwyyk',
  'kywyykyk',
  'kyykyyyk',
  'kyyyykyk',
  '.kyyyyk.',
  '..kkkk..',
], { k: '#6a4a00', y: '#d8d8e0', w: '#ffffff' });
pixIcon('pouch', [
  '...kk...',
  '..kbbk..',
  '.kbbbbk.',
  'kbrbbgbk',
  'kbbbbbbk',
  'kbgbbrbk',
  '.kkkkkk.',
], { k: '#3a2410', b: '#c8a070', g: '#1a5a50', r: '#c82020' });
pixIcon('gold', [
  '..kkkkkkkk..',
  '.kyywyyyyyk.',
  'kyyyyyyyyydk',
  'kddddddddddk',
  '.kkkkkkkkkk.',
], { k: '#5a3a00', y: '#f8d040', w: '#fff8c0', d: '#c89010' });
pixIcon('knife', [
  'kk.........',
  'kbkkkkkkk..',
  'kbwwwwwwwkk',
  'kbkkkkkkk..',
  'kk.........',
], { k: '#202028', b: '#c82020', w: '#e8e8f0' });
pixIcon('stone', [
  '...kkkkkk...',
  '..k......k..',
  '..k......k..',
  'kkkkkkkkkkkk',
  'kggggggggggk',
  'kglggggggggk',
  'kggggggggggk',
  'kggggggggddk',
  'kgggggggdddk',
  'kkkkkkkkkkkk',
], { k: '#202020', g: '#a0a0a8', l: '#e0e0e8', d: '#686870' });
pixIcon('mask', [   // 九筒紙袋面具
  '.kkkkkkkkk.',
  'kbbbbbbbbbk',
  'kbgbbgbbgbk',
  'kbbbbbbbbbk',
  'kbrbbrbbrbk',
  'kbbbbbbbbbk',
  'kbgbbgbbgbk',
  'kbbbbbbbbbk',
  '.kkkkkkkkk.',
], { k: '#3a2410', b: '#c8a070', g: '#1a5a50', r: '#c82020' });
