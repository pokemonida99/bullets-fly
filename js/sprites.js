// 圖片：角色動作格（tools/slice.py → SPRITE_DATA）、背景與頭像（tools/stage_art.py → BG_ART / PORTRAITS）
'use strict';
const SPR = {};          // SPR[cid][frame] = { im: 動作表原圖, sx, sy, w, h, ax }
// 直接從動作表原圖畫，不預先切成小畫布：手機記憶體吃緊時瀏覽器會清掉暫存畫布的內容（角色變透明、只剩影子），
// <img> 的內容瀏覽器自己會重新解碼，不會不見
const loadImg = src => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });

let SCR_W = 8, SCR_H = 8;
const SPRITES_READY = Promise.all(Object.entries(window.SPRITE_DATA || {}).map(([cid, d]) => loadImg(d.img).then(im => {
  SPR[cid] = {};
  if (!im) return;
  for (const [n, [fx, fy, fw, fh, ax]] of Object.entries(d.frames)) {
    SPR[cid][n] = { im, sx: fx, sy: fy, w: fw, h: fh, ax };
    SCR_W = Math.max(SCR_W, fw); SCR_H = Math.max(SCR_H, fh);
  }
})));
// 閃白／剪影／換色：每次畫都在同一張草稿畫布上現做，不留快取（快取被清掉就會整批隱形）
let scratch = null;
function scratchOf(f, col, mode, a = 1) {
  if (!scratch || scratch[0].width < SCR_W || scratch[0].height < SCR_H) scratch = mkCanvas(SCR_W, SCR_H);
  const [c, g] = scratch;
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  g.clearRect(0, 0, f.w + 1, f.h + 1);
  g.drawImage(f.im, f.sx, f.sy, f.w, f.h, 0, 0, f.w, f.h);
  g.globalCompositeOperation = mode; g.globalAlpha = a; g.fillStyle = col; g.fillRect(0, 0, f.w, f.h);
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  return c;
}

const IMG = { bg: {}, por: {}, porBig: {}, prop: {} };
const ART_READY = Promise.all([
  ...Object.entries(window.PROP_ART || {}).map(([k, u]) => loadImg(u).then(im => { IMG.prop[k] = im; if (im && k !== 'drum' && k !== 'wardrum') ICON[k] = im; })),
  ...Object.entries(window.BG_ART || {}).map(([k, u]) => loadImg(u).then(im => { IMG.bg[k] = im; })),
  ...Object.entries(window.PORTRAITS || {}).map(([k, u]) => loadImg(u).then(im => { IMG.por[k] = im; })),
  ...Object.entries(window.PORTRAITS_BIG || {}).map(([k, u]) => loadImg(u).then(im => { IMG.porBig[k] = im; })),
]);

function frameOf(cid, name) {
  const s = SPR[cid];
  if (!s) return null;
  return s[name] || s.idle0 || null;
}
function blit(f, x, y, face, opt, col, mode, a) {
  ctx.save();
  if (opt.alpha != null) ctx.globalAlpha = opt.alpha;
  ctx.translate(Math.round(x), Math.round(y));
  if (face < 0) ctx.scale(-1, 1);
  if (opt.rot) { ctx.translate(0, -f.h / 2); ctx.rotate(opt.rot); ctx.translate(0, f.h / 2); }
  if (col) ctx.drawImage(scratchOf(f, col, mode, a), 0, 0, f.w, f.h, -f.ax, -f.h, f.w, f.h);
  else ctx.drawImage(f.im, f.sx, f.sy, f.w, f.h, -f.ax, -f.h, f.w, f.h);
  ctx.restore();
}
// 在 (x, 腳底 y) 畫一格；face = 1 面右、-1 面左。opt: flash 閃白, alpha, sil 剪影色, rot 旋轉（倒地飛出用）
function drawSpr(cid, name, x, y, face, opt = {}) {
  const f = frameOf(cid, name);
  if (!f) return;
  if (opt.flash) blit(f, x, y, face, opt, '#ffffff', 'source-in');
  else if (opt.sil) blit(f, x, y, face, opt, opt.sil, 'source-in');
  else blit(f, x, y, face, opt);
}
// 色調版本（換色雜兵）：把灰頭巾一帶的顏色換掉太難，改成整體疊一層色
function drawTinted(cid, name, x, y, face, col, opt = {}) {
  if (!col || opt.flash) return drawSpr(cid, name, x, y, face, opt);
  const f = frameOf(cid, name); if (!f) return;
  blit(f, x, y, face, opt, col, 'source-atop', 0.16);
}

// ---------- 程式畫的小道具（酒罈、木箱、烤鵝、涼粉、銀元、子彈、飛刀……） ----------
function px(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
const ICON = {};
const PIX_DEFS = {};
function pixIcon(name, rows, pal) {
  PIX_DEFS[name] = [rows, pal];
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
// 夫人百寶箱（劇本第 33 場：刨子、鉗子、皮鞭、磚頭、蠟燭、刷子）
pixIcon('brick', [
  'kkkkkkkkkkkk',
  'krrrrrlrrrrk',
  'krrrrrkrrrdk',
  'kkkkkkkkkkkk',
  'krrlrrrrrrdk',
  'krrkrrrrrddk',
  'kkkkkkkkkkkk',
], { k: '#3a1008', r: '#b8482a', l: '#e07850', d: '#7a2a14' });
pixIcon('plane', [
  '...kk.......',
  '..kbbk......',
  '..kbbk......',
  'kkkkkkkkkkkk',
  'kwwwwwwwwwwk',
  'kwddddddddwk',
  'kkkkkkkkkkkk',
  '.....ss.....',
], { k: '#2a1408', b: '#8a5228', w: '#d8a868', d: '#a87840', s: '#d0d8e0' });
pixIcon('pliers', [
  'kk.......kk.',
  'kssk...kssk.',
  '.kssk.kssk..',
  '..kssksssk..',
  '...kssssk...',
  '..krrkkrrk..',
  '.krrk..krrk.',
  'krrk....krrk',
  'kkk......kkk',
], { k: '#202028', s: '#b0b8c8', r: '#c82020' });
pixIcon('candle', [
  '...y...',
  '..yoy..',
  '..yoy..',
  '...k...',
  '.kkkkk.',
  '.kwwwlk',
  '.kwwwlk',
  '.kwwwlk',
  '.kwwwlk',
  '.kwwwlk',
  'kkkkkkk',
], { k: '#3a2010', y: '#ffd040', o: '#ff6020', w: '#f8f0e0', l: '#c8b8a0' });
pixIcon('brush', [
  'kkkkkkk.....',
  'kbbbbbkkkkkk',
  'kbbbbbkhhhhk',
  'kbbbbbkkkkkk',
  'kkkkkkk.....',
], { k: '#2a1408', b: '#e8d0a0', h: '#8a4a22' });
pixIcon('whip', [
  'kk..........',
  'khk...kkk...',
  'khk..k...k..',
  '.khk.k....k.',
  '..kkk.....k.',
  '..........k.',
], { k: '#2a1408', h: '#8a4a22' });
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

// 暫存畫布被瀏覽器清掉時（見 core.js checkCanvases）重畫程式小道具；已換成美術圖的不動
onCanvasLost(() => { for (const [k, [rows, pal]] of Object.entries(PIX_DEFS)) if (!(ICON[k] instanceof HTMLImageElement)) pixIcon(k, rows, pal); });
