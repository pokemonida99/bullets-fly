// 畫面：關卡繪製、HUD、對話框、各場景、主迴圈
'use strict';

// ---------- 背景：五張街景接起來，接縫用木柱遮住 ----------
// 分層街景：天空（視差、白天漸變黃昏）＋沿街排列的建築立面（去背）＋連續的石板路
// 關鍵建築放在固定位置（城門、縣衙、涼粉攤、黃府），中間用騎樓補滿；建築本來就一棟一棟，不會有切開的接縫
const GROUND_Y = 142;
let facadeLayout = null;
function layoutFacades() {
  if (facadeLayout) return facadeLayout;
  const img = k => IMG.bg[k], FACADE_ANCHOR = STAGE.anchors || [], FILLERS = STAGE.fillers || [];
  if (!FACADE_ANCHOR.length || !FACADE_ANCHOR.every(([k]) => img(k)) || !FILLERS.every(img)) return null;
  const L = [], anchors = FACADE_ANCHOR.map(([k, x]) => [k, x == null ? stageLen - W + (W - img(k).width) / 2 : x]);
  let x = -8, fi = 0;
  for (const [k, ax] of anchors) {
    while (x < ax - 20) { const f = FILLERS[fi % 3], w = img(f).width; L.push({ k: f, x, flip: (fi >> 1) & 1 }); x += w - 2; fi++; }
    L.push({ k, x: ax, anchor: true }); x = ax + img(k).width - 2;
  }
  while (x < stageLen + 10) { const f = FILLERS[fi % 3]; L.push({ k: f, x, flip: (fi >> 1) & 1 }); x += img(f).width - 2; fi++; }
  // 補位的先畫、關鍵建築後畫（蓋在上面）
  L.sort((a, b) => (a.anchor ? 1 : 0) - (b.anchor ? 1 : 0));
  return (facadeLayout = L);
}
function dusk() { const [a, b] = STAGE.skyDusk || [820, 1520]; return STAGE.sky && STAGE.sky.length > 1 ? clamp((G.camX - a) / (b - a), 0, 1) : 0; }
function drawStageLayers() {
  const L = layoutFacades(); if (!L) return false;
  const cx = G.camX, k = dusk();
  const sky = STAGE.sky || ['sky_day'];
  const SKY_Y = -86;   // 天空圖 960 寬：月亮／太陽落在建築上方，整關只會出現一次
  tileMirror(IMG.bg[sky[0]], cx * 0.25, SKY_Y);
  if (k > 0 && IMG.bg[sky[1]]) { ctx.globalAlpha = k; tileMirror(IMG.bg[sky[1]], cx * 0.25, SKY_Y); ctx.globalAlpha = 1; }
  for (const f of L) {
    const im = IMG.bg[f.k], x = Math.round(f.x - cx);
    if (x > W || x + im.width < 0) continue;
    const y = GROUND_Y - im.height + 2;
    if (f.flip) { ctx.save(); ctx.translate(x + im.width, y); ctx.scale(-1, 1); ctx.drawImage(im, 0, 0); ctx.restore(); }
    else ctx.drawImage(im, x, y);
    signs2(f.k, x, y, im);
  }
  const gimg = IMG.bg[STAGE.ground || 'ground'] || IMG.bg.ground;
  if (gimg) {
    tileMirror(gimg, cx, GROUND_Y - 4);
    if (STAGE.night) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgb(90,105,170)'; ctx.fillRect(0, GROUND_Y - 4, W, H); ctx.restore(); }
  }
  // 越往前走越接近黃昏：建築與地面染上夕陽色
  if (k > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(255,${Math.round(lerp(255, 150, k))},${Math.round(lerp(255, 110, k))},1)`; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  return true;
}
// 立面上的匾額字（GPT 畫的匾額是空白的；位置是相對立面圖的比例）
const SIGN_AT = { d_irongate: ['黃府', 0.5, 0.42], f_gate: ['鵝城', 0.5, 0.56], f_yamen: ['縣衙', 0.5, 0.38], f_huang: ['黃府', 0.5, 0.55], g_hall: ['明鏡高懸', 0.5, 0.3], g_gate: ['縣衙', 0.5, 0.33] };
const SIGN_V = { f_noodle: ['涼粉', 0.86, 0.30] };
function signs2(k, x, y, im) {
  const a = SIGN_AT[k]; if (a) text(a[0], x + im.width * a[1], y + im.height * a[2] - 6, { c: k === 'f_huang' ? '#f0c040' : '#3a1a08', a: 'c' });
  const v = SIGN_V[k]; if (v) vtext(v[0], x + im.width * v[1], y + im.height * v[2], { c: '#a01810' });
}

function drawStageBg() {
  if (drawStageLayers()) return;
  if (!STAGE.bgs) { px(0, 0, W, H, STAGE.night ? '#101828' : '#6a8ab0'); px(0, GROUND_Y, W, H, '#4a4a50'); return; }
  const cx = Math.round(G.camX);
  STAGE.bgs.forEach((k, i) => {
    const x = i * W - cx;
    if (x > W || x < -W) return;
    const img = IMG.bg[k];
    if (img) ctx.drawImage(img, x, 0);
    signs(k, x);
  });
  // 接縫：木柱＋紅燈籠
  for (let i = 1; i < STAGE.bgs.length; i++) {
    const x = i * W - cx + 6;
    if (x < -20 || x > W + 20) continue;
    px(x - 3, 0, 7, 146, '#3a2412'); px(x - 3, 0, 2, 146, '#5a3a1e'); px(x + 3, 0, 1, 146, '#1a0e06');
    px(x - 6, 142, 13, 5, '#2a1a0a'); px(x - 5, 141, 11, 1, '#5a3a1e');
    const ly = 64 + Math.sin(G.t / 30 + i) * 1;
    px(x + 4, ly - 6, 1, 6, '#1a0e06');
    px(x, ly, 10, 12, '#c8202a'); px(x + 1, ly + 2, 8, 8, '#e8402a'); px(x + 2, ly - 1, 6, 2, '#f0c040'); px(x + 2, ly + 12, 6, 2, '#f0c040');
  }
}

// 背景上的匾額、招牌字（GPT 畫的招牌都是空白，字用程式寫上去）
function vtext(str, x, y, opt) { [...str].forEach((ch, i) => text(ch, x, y + i * 13, Object.assign({ a: 'c' }, opt))); }
function signs(k, x) {
  if (k === 'bg1') text('鵝城', x + 86, 43, { c: '#3a1a08', a: 'c' });
  if (k === 'bg3') { vtext('涼粉', x + 20, 62, { c: '#a01810' }); vtext('茶', x + 229, 58, { c: '#5a2a10' }); }
  if (k === 'bg5') { px(x + 184, 70, 33, 15, '#d8a830'); px(x + 185, 71, 31, 13, '#1a0a04'); text('黃府', x + 200.5, 72, { c: '#f0c040', a: 'c' }); }
}

// ---------- 世界物件 ----------
function shadow(x, z, h, w = 24) {
  const s = Math.max(0.4, 1 - h / 120);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(Math.round(x), Math.round(z), w / 2 * s, 3.5 * s, 0, 0, Math.PI * 2); ctx.fill();
}
function drawWorld() {
  const cx = G.camX;
  const list = [];
  for (const pr of props) if (!pr.dead) list.push({ z: pr.z, d: () => { const sx = pr.x - cx + (pr.shake ? rnd(-1, 1) : 0); shadow(pr.x - cx, pr.z, 0, 18); const ic = ICON[pr.k]; ctx.drawImage(ic, Math.round(sx - ic.width / 2), Math.round(pr.z - ic.height)); } });
  for (const it of items) list.push({ z: it.z - 0.5, d: () => {
    if (it.t > 720 && (G.t & 4)) return;
    const ic = ICON[it.k], y = it.z - it.h - ic.height + (it.h <= 0 ? Math.sin(G.t / 8 + it.x) : 0);
    shadow(it.x - cx, it.z, it.h, 12);
    ctx.drawImage(ic, Math.round(it.x - cx - ic.width / 2), Math.round(y));
  } });
  for (const e of foes) list.push({ z: e.z, d: () => drawFoe(e) });
  if (P && P.st !== 'dead') list.push({ z: P.z + 0.1, d: () => drawPlayer(P) });
  for (const pr of projs) list.push({ z: pr.z + 0.2, d: () => drawProj(pr) });
  for (const h of (typeof helpers !== 'undefined' ? helpers : [])) if (h.t >= 0) list.push({ z: h.z, d: () => { shadow(h.x - G.camX, h.z, 0, 26); drawSpr(h.cid, 'walk' + ((h.t / 3 | 0) % 6), h.x - G.camX, h.z, h.dir, { alpha: 0.95 }); } });
  if (G.drum && G.drum.t >= 0) list.push({ z: G.drum.z, d: drawDrum });
  if (G.wardrum) list.push({ z: G.wardrum.z, d: drawWarDrum });
  list.sort((a, b) => a.z - b.z);
  for (const o of list) o.d();
}
function drawPlayer(p) {
  const sx = p.x - G.camX;
  shadow(sx, p.z, p.h, 26);
  if (p.inv > 0 && p.inv < 140 && (G.t & 2) && p.st !== 'super') return;
  const fr = playerFrame(p);
  if (p.aura > 0 && (G.t & 4)) drawSpr(p.cid, fr, sx, p.z - p.h - 1, p.face, { sil: '#c0e0ff', alpha: 0.6 });
  if (p.st === 'guard' && (G.t & 8)) drawSpr(p.cid, fr, sx, p.z - p.h, p.face, { sil: '#80c0ff', alpha: 0.35 });
  drawSpr(p.cid, fr, sx, p.z - p.h, p.face, { flash: p.flash > 0 && (G.t & 1) });
  if (p.st === 'grab' && p.grab) { /* 被抓的人畫在後面（z 稍小） */ }
}
function drawFoe(e) {
  const sx = e.x - G.camX;
  if (sx < -60 || sx > W + 60) return;
  shadow(sx, e.z, e.h, e.type.heavy ? 40 : 26);
  if (e.st === 'dead' && (G.t & 2)) return;
  if (e.st === 'getup' && (G.t & 2)) return;
  const fr = foeFrame(e);
  const opt = { flash: e.flash > 0 && (G.t & 1) };
  let y = e.z - e.h;
  if (e.st === 'grabbed') y -= 2;
  if (e.st === 'wind' && e.t2 < 6) opt.flash = (G.t & 1);
  if (e.type.tint && !opt.flash) drawTinted(e.kind, fr, sx, y, e.face, e.type.tint, opt);
  else drawSpr(e.kind, fr, sx, y, e.face, opt);
  if (e.kind === 'wu' && e.ai.rage && e.st !== 'kneel' && (G.t & 8)) drawSpr(e.kind, fr, sx, y, e.face, { sil: '#ff2020', alpha: 0.25 });
  if (e.kind === 'huwan' && e.st === 'boss' && e.mode === 'aim' && (G.t & 4)) { px(sx + e.face * 28 - 2, e.z - 50, 4, 4, '#ff3030'); }
  if (e.st === 'daze') text(e.dazeMark || '$', sx, e.z - 84 + Math.sin(G.t / 5) * 2, { c: '#ffd040', a: 'c', o: '#000' });
  if (e.unmasked && e.kind === 'mask' && e.st !== 'dead') { /* 面具掉了：只靠粒子表現 */ }
}
function drawProj(pr) {
  const sx = pr.x - G.camX, sy = pr.z - pr.h;
  switch (pr.kind) {
    case 'bullet': {
      const d = Math.sign(pr.vx);
      if (pr.heavy) { px(sx - d * 14, sy - 1, 14, 3, 'rgba(255,220,120,.45)'); }
      px(sx - d * 8, sy, 8, 1, 'rgba(255,240,160,.6)'); px(sx - 2, sy - 1, 4, 3, '#fff3a0'); px(sx - 1, sy, 2, 1, '#ffffff');
      break;
    }
    case 'shot': { const d = Math.sign(pr.vx); px(sx - d * 8, sy, 8, 1, 'rgba(255,120,80,.7)'); px(sx - 2, sy - 1, 4, 3, '#ff6040'); break; }
    case 'knife': { ctx.save(); ctx.translate(Math.round(sx), Math.round(sy)); if (pr.vx < 0) ctx.scale(-1, 1); ctx.drawImage(ICON.knife, -6, -2); ctx.restore(); break; }
    case 'coin': { const w = Math.max(1, Math.abs(Math.cos(pr.t / 3)) * 8); shadow(sx, pr.z, pr.h, 6); ctx.drawImage(ICON.coin, Math.round(sx - w / 2), Math.round(sy - 4), Math.round(w), 8); break; }
    case 'hat': { const ic = ICON.hat; shadow(sx, pr.z, pr.h, 18); if (ic) { const w = ic.width * (0.6 + 0.4 * Math.abs(Math.cos(pr.t / 3))); ctx.drawImage(ic, Math.round(sx - w / 2), Math.round(sy - ic.height / 2), Math.round(w), ic.height); } else { px(sx - 9, sy - 2, 18, 4, '#c8a050'); px(sx - 4, sy - 5, 8, 3, '#e0c070'); } break; }
    case 'hhat': { shadow(sx, pr.z, pr.h, 14); const w = 16 * (0.5 + 0.5 * Math.abs(Math.cos(pr.t / 3))); px(sx - w / 2, sy - 2, w, 3, '#141414'); px(sx - w / 4, sy - 7, w / 2, 5, '#1e1e1e'); px(sx - w / 4, sy - 3, w / 2, 1, '#6a1a1a'); break; }
    case 'tool': {   // 夫人百寶箱裡的東西，邊飛邊轉
      const ic = ICON[pr.icon]; shadow(sx, pr.z, pr.h, 12); if (!ic) break;
      ctx.save(); ctx.translate(Math.round(sx), Math.round(sy)); if (pr.vx < 0) ctx.scale(-1, 1); ctx.rotate(pr.t * (pr.spin == null ? 0.3 : pr.spin)); ctx.drawImage(ic, -ic.width / 2, -ic.height / 2); ctx.restore();
      break;
    }
    case 'stone': shadow(sx, pr.z, pr.h, 20); ctx.drawImage(ICON.stone, Math.round(sx - 9), Math.round(sy - 15), 18, 15); break;
    case 'sound': {
      const r = 8 + pr.t * 1.3, d = Math.sign(pr.vx);
      ctx.strokeStyle = `rgba(255,240,180,${Math.max(0, 0.9 - pr.t / 40)})`; ctx.lineWidth = 2;
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(sx - d * k * 8, sy, Math.max(2, r - k * 8), d > 0 ? -0.9 : Math.PI - 0.9, d > 0 ? 0.9 : Math.PI + 0.9); ctx.stroke(); }
      break;
    }
    case 'wave': {
      for (let k = 0; k < 5; k++) { const h = 10 + ((pr.t * 3 + k * 7) % 22); px(sx - 10 + k * 5, pr.z - h, 4, h, k % 2 ? '#e8d0a0' : '#a08060'); }
      break;
    }
  }
}
// 冤鼓（劇本第 35～36 場：乾隆年間設的冤鼓被六子砍下來，滾上街）
function drawDrum() {
  const d = G.drum, sx = d.x - G.camX, im = IMG.prop.drum;
  shadow(sx, d.z, 0, 46);
  if (im) {   // GPT 畫的冤鼓（正面），滾動時旋轉
    const r = im.height / 2;
    ctx.save(); ctx.translate(Math.round(sx), Math.round(d.z - r)); ctx.rotate(d.rot); ctx.drawImage(im, -im.width / 2, -r); ctx.restore();
    return;
  }
  const cy = d.z - 24;
  ctx.save(); ctx.translate(Math.round(sx), Math.round(cy));
  ctx.fillStyle = '#5a1008'; ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#a82818'; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d8b880'; ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill();
  for (let k = 0; k < 10; k++) { const a = d.rot + k * Math.PI / 5; px(Math.cos(a) * 19.5 - 1, Math.sin(a) * 19.5 - 1, 2, 2, '#f0c040'); }
  ctx.restore();
}

// 花姐擂鼓的大鼓（架上、側面，鼓面朝花姐；GPT 原圖鼓面朝右）：有 GPT 圖用圖，沒有就程式畫
function drawWarDrum() {
  const d = G.wardrum, sx = d.x - G.camX, k = d.kick > 0 ? (d.kick & 2 ? 1 : -1) : 0, im = IMG.prop.wardrum;
  shadow(sx, d.z, 0, 40);
  if (im) {
    ctx.save(); ctx.translate(Math.round(sx), Math.round(d.z + k)); if (d.face > 0) ctx.scale(-1, 1); ctx.drawImage(im, -im.width / 2, -im.height); ctx.restore();
    return;
  }
  const x = Math.round(sx), y = d.z;
  px(x - 14, y - 22, 3, 22, '#4a2a10'); px(x + 11, y - 22, 3, 22, '#4a2a10'); px(x - 14, y - 12, 28, 3, '#5a3416');   // 木架
  px(x - 13, y - 58 + k, 26, 38, '#1a0604'); px(x - 12, y - 57 + k, 24, 36, '#a82818'); px(x - 12, y - 57 + k, 24, 4, '#c83a20');
  for (let i = 0; i < 5; i++) { px(x - 10 + i * 5, y - 54 + k, 2, 2, '#f0c040'); px(x - 10 + i * 5, y - 25 + k, 2, 2, '#f0c040'); }
  const hx = x + d.face * 13; px(hx - 2, y - 58 + k, 4, 38, '#d8b880'); px(hx - 1, y - 56 + k, 2, 34, '#f0dcb0');   // 鼓面
}

function drawMines() {   // 假麻子的地雷：圓盤＋閃紅燈
  for (const m of G.mines || []) {
    const sx = m.x - G.camX;
    px(sx - 6, m.z - 3, 12, 4, '#3a3a30'); px(sx - 5, m.z - 4, 10, 1, '#6a6a58'); px(sx - 4, m.z - 1, 8, 1, '#202018');
    if ((m.t >> (m.t > 480 ? 2 : 4)) & 1) px(sx - 1, m.z - 5, 2, 2, '#ff3030');
  }
}
function drawVolley() {
  for (const v of G.volley || []) {
    if (v.t < 0) continue;
    const sx = v.x - G.camX;
    if (v.t < 44) { if ((G.t & 2) || v.t > 30) { ctx.strokeStyle = '#ff3030'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(sx, v.z, 10, 3.5, 0, 0, Math.PI * 2); ctx.stroke(); }
      if (v.t > 34) { const k = (v.t - 34) / 10; px(sx - 1, lerp(30, v.z - 4, k), 2, 8, '#fff3a0'); } }
    else { ctx.fillStyle = `rgba(255,220,140,${1 - (v.t - 44) / 10})`; ctx.beginPath(); ctx.ellipse(sx, v.z, 12, 4, 0, 0, Math.PI * 2); ctx.fill(); }
  }
}

function drawFx() {
  for (const f of fx) {
    if (f.kind === 'hang') {   // 停在空中的子彈
      const sx = f.x - G.camX, y = f.y + Math.sin((G.t + f.d * 7) / 9) * 1.5;
      if (f.t < f.d) continue;
      px(sx - 1, y - 3, 3, 6, '#ffd040'); px(sx, y - 3, 1, 2, '#ffffff');
      if ((G.t + f.d) % 20 < 3) px(sx - 3, y, 7, 1, '#fff7c0');
    } else if (f.kind === 'cross') {   // 老四狙擊的準星
      const e = f.target; if (!e || f.t > 14) continue;
      const cx2 = e.x - G.camX, cy2 = e.z - e.h - 40, r = 14 - f.t * 0.6;
      ctx.strokeStyle = '#ff3030'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, Math.PI * 2); ctx.stroke();
      px(cx2 - r - 3, cy2, r * 2 + 6, 1, '#ff3030'); px(cx2, cy2 - r - 3, 1, r * 2 + 6, '#ff3030');
    } else if (f.kind === 'bigtext') {   // 夫人「屁！！」
      if (f.t < 0) continue;
      const s2 = f.t < 4 ? 4 : 3, sh = f.t < 20 ? rnd(-2, 2) : 0;
      if (f.t > 40 && (G.t & 2)) continue;
      text(f.str, f.x - G.camX + sh, f.y - Math.min(f.t, 10) + sh, { s: s2, c: '#ff4030', a: 'c', o: '#000', grad: ['#fff0a0', '#ff3020'] });
    } else if (f.kind === 'ring') {
      if (f.t < 0) continue;
      const r = f.t * 3; ctx.strokeStyle = `rgba(255,230,180,${1 - f.t / 30})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(f.x - G.camX, f.z, r * 1.6, r * 0.45, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }
  for (const q of parts) {
    const a = 1 - q.t / q.life;
    if (q.type === 'spark') {
      const r = q.s * (0.4 + q.t / q.life);
      ctx.strokeStyle = q.col; ctx.globalAlpha = a; ctx.lineWidth = 2;
      for (let k = 0; k < 6; k++) { const an = k * Math.PI / 3 + q.t * 0.2; ctx.beginPath(); ctx.moveTo(q.x + Math.cos(an) * r * 0.3, q.y + Math.sin(an) * r * 0.3); ctx.lineTo(q.x + Math.cos(an) * r, q.y + Math.sin(an) * r); ctx.stroke(); }
      px(q.x - 2, q.y - 2, 4, 4, '#ffffff');
      ctx.globalAlpha = 1;
    } else if (q.type === 'dust') {
      ctx.globalAlpha = a * 0.7; px(q.x - G.camX - 1, q.y - 1, 3, 2, q.col); ctx.globalAlpha = 1;
    } else if (q.type === 'icon') {
      ctx.drawImage(ICON[q.icon], Math.round(q.x - 4), Math.round(q.y - 3));
    } else { ctx.globalAlpha = a; px(q.x - 1, q.y - 1, 2, 2, q.col); ctx.globalAlpha = 1; }
  }
  for (const q of pops) {
    const y = q.y - q.t * 0.4, sx = q.x - G.camX;
    if (q.t > 50 && (G.t & 2)) continue;
    text(q.str, sx, y, { c: q.col, a: 'c', o: '#000' });
  }
}
// 世界座標的粒子（dust 用世界 x）跟畫面座標的粒子混用：dust 的 x 是世界座標，其他是畫面座標

// ---------- HUD ----------
const porSmall = {};
onCanvasLost(() => { for (const k in porSmall) delete porSmall[k]; });
function smallPor(k, s) {
  const key = k + s;
  if (porSmall[key]) return porSmall[key];
  const im = IMG.por[k]; if (!im) return null;
  const [c, g] = mkCanvas(s, s); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, s, s);
  return (porSmall[key] = c);
}
function bar(x, y, w, h, v, max, cols) {
  px(x - 1, y - 1, w + 2, h + 2, '#000');
  px(x, y, w, h, '#3a0a0a');
  const k = clamp(v / max, 0, 1);
  const col = cols ? cols : (k > 0.5 ? '#f0d020' : k > 0.25 ? '#f08020' : '#e02020');
  px(x, y, Math.round(w * k), h, col);
  px(x, y, Math.round(w * k), 1, 'rgba(255,255,255,.45)');
}
function drawHud() {
  const p = P;
  px(0, 0, W, 31, 'rgba(0,0,0,.55)');
  const por = smallPor(p.cid, 28);
  if (por) { px(3, 1, 30, 30, '#d8b040'); px(4, 2, 28, 28, '#300'); ctx.drawImage(por, 4, 2); }
  text(p.ch.name, 37, 2, { c: '#ffffff', o: '#000' });
  text('×' + p.lives, 37 + textW(p.ch.name) + 6, 2, { c: '#ffd040', o: '#000' });
  bar(37, 16, 104, 6, p.hp, p.maxhp);
  // 怒氣
  const full = p.meter >= 100;
  bar(37, 25, 104, 3, p.meter, 100, full ? ((G.t & 8) ? '#ffffff' : '#40c0ff') : '#2080e0');
  if (full) text('超必殺 OK', 146, 18, { c: (G.t & 8) ? '#ffffff' : '#40c0ff', o: '#000' });
  text(String(G.score).padStart(7, '0'), 146, 2, { c: '#ffd040', o: '#000' });
  if (!(G.foe && G.foeT > 0 && foes.includes(G.foe))) text('HI ' + String(G.hi).padStart(7, '0'), 204, 2, { c: '#a0a0a8', o: '#000' });
  // 敵人
  const e = G.foe;
  if (e && G.foeT > 0 && foes.includes(e)) {
    const boss = e.type.boss;
    if (boss) { const bp = smallPor(e.key, 28); if (bp) { px(W - 33, 1, 30, 30, '#c02020'); px(W - 32, 2, 28, 28, '#200'); ctx.drawImage(bp, W - 32, 2); } }
    const right = boss ? W - 37 : W - 4;
    text(e.type.name, right, 2, { c: boss ? '#ff8080' : '#ffffff', o: '#000', a: 'r' });
    bar(right - 104, 16, 104, 6, Math.max(0, e.hp), e.type.hp, boss ? '#e04040' : undefined);
  }
  if (G.drum && G.drum.t < 0 && (G.t & 8)) { text('冤鼓！', 8, G.drum.z - 40, { c: '#ff4040', o: '#000', s: 1 }); text('→', 12, G.drum.z - 26, { c: '#ff4040', o: '#000' }); }
  if (G.goT > 0 && (G.goT >> 4) & 1 && !G.clear) { text('GO', W - 34, 92, { s: 2, c: '#ffd040', o: '#300' }); text('→', W - 30, 112, { s: 2, c: '#ffd040', o: '#300' }); }
}
function drawTalk() {
  const T = G.talk; if (!T) return;
  const [who, str, nm] = T.lines[T.i];
  if (T.panel && IMG.bg[T.panel]) { ctx.drawImage(IMG.bg[T.panel], 0, 0); }
  const y = H - 54;
  px(6, y, W - 12, 48, '#1a0a04'); px(6, y, W - 12, 1, '#d8b040'); px(6, y + 47, W - 12, 1, '#d8b040'); px(6, y, 1, 48, '#d8b040'); px(W - 7, y, 1, 48, '#d8b040');
  let tx = 14;
  if (who && IMG.por[who]) { px(10, y + 4, 42, 42, '#d8b040'); px(11, y + 5, 40, 40, '#300'); ctx.drawImage(IMG.por[who], 11, y + 5); tx = 60; }
  if (who || nm) text(nm || NAMES[who] || who, tx, y + 5, { c: '#ffd040', o: '#000' });
  const n = Math.min(str.length, Math.floor(T.t / 2));
  text(str.slice(0, n), tx, y + (who || nm ? 22 : 16), { c: '#ffffff', o: '#000' });
  if (n >= str.length && (G.t & 16)) text('▼', W - 18, y + 34, { c: '#ffd040' });
}
function drawCutin() {
  const C = G.cutin; if (!C) return;
  const k = Math.min(1, C.t / 10), out = C.t > 46 ? (C.t - 46) / 10 : 0;
  const bh = 70 * k * (1 - out);
  px(0, 100 - bh / 2, W, bh, 'rgba(0,0,0,.85)');
  if (bh > 20) {
    px(0, 100 - bh / 2, W, 2, '#d82020'); px(0, 100 + bh / 2 - 2, W, 2, '#d82020');
    const im = IMG.porBig[C.cid];
    const x = lerp(-100, 20, Math.min(1, C.t / 8)) + out * 400;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 100 - bh / 2 + 2, W, bh - 4); ctx.clip();
    for (let i = 0; i < 8; i++) px(((G.t * 9 + i * 53) % (W + 60)) - 30, 100 - bh / 2 + 6 + i * 8, 40, 1, 'rgba(255,255,255,.18)');
    if (im) ctx.drawImage(im, Math.round(x), 100 - 48 + 8);
    ctx.restore();
    text(C.name, 140 + out * 300, 76, { s: 2, c: '#ffffff', o: '#600', grad: ['#ffffff', '#ffb020'] });
    text(C.line, 140 + out * 300, 108, { c: '#ffd040', o: '#000' });
  }
}

// ---------- 場景 ----------
const SCENES = {};
SCENES.boot = {
  update() { if (Input.anyPressed || G.st > 600) { Audio2.unlock(); go('title'); } },
  draw() {
    px(0, 0, W, H, '#000');
    text('讓子彈飛', W / 2, 70, { s: 3, c: '#fff', a: 'c', grad: ['#fff2c0', '#e04020'], o: '#200' });
    if ((G.t >> 5) & 1) text('點一下畫面或按任意鍵', W / 2, 140, { c: '#c8c8d0', a: 'c' });
    text('（瀏覽器規定：要先點一下才能出聲音）', W / 2, 160, { c: '#707078', a: 'c' });
  },
};
SCENES.title = {
  enter() { Audio2.play('title'); G.paused = false; },
  update() {
    const I = Input.pressed;
    if (G.st < 20) return;
    if (I.start || I.p) { Audio2.sfx('decide'); go('select'); }
    else if (I.up) { Audio2.sfx('blip'); go('changes'); }
    else if (G.st > 60 * 30) { G.attract = true; go('intro'); }
  },
  draw() {
    if (IMG.bg.title) ctx.drawImage(IMG.bg.title, 0, 0);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, W, H);
    const k = Math.min(1, G.st / 30);
    const y = lerp(-40, 22, 1 - Math.pow(1 - k, 3));
    text('讓子彈飛', W / 2, y, { s: 4, c: '#fff', a: 'c', grad: ['#fff2c0', '#e04020'], o: '#200' });
    text('LET THE BULLETS FLY', W / 2, y + 54, { c: '#ffd040', a: 'c', o: '#000' });
    text('鵝城快打　試玩版', W / 2, y + 70, { s: 1, c: '#ffffff', a: 'c', o: '#000' });
    if ((G.t >> 5) & 1) text(isTouch ? '點畫面開始' : 'PRESS START（Enter／J）', W / 2, 160, { c: '#ffffff', a: 'c', o: '#000' });
    text(VERSION, 4, H - 14, { c: '#c8c8d0', o: '#000' });
    text('↑ 更新紀錄', W - 4, H - 14, { c: '#c8c8d0', o: '#000', a: 'r' });
    text('同人非官方作品', W / 2, H - 14, { c: '#a0a0a8', o: '#000', a: 'c' });
  },
};
SCENES.changes = {
  enter() {
    this.lines = []; this.off = 0;
    for (const [v, ...its] of CHANGELOG) {
      its.forEach((it, k) => {
        let rest = '・' + it, first = true;
        while (rest.length) { this.lines.push([k === 0 && first ? v : '', rest.slice(0, 25)]); rest = rest.slice(25); first = false; if (rest) rest = '　' + rest; }
      });
      this.lines.push(['', '']);
    }
  },
  update() {
    const I = Input.pressed, max = Math.max(0, this.lines.length - 12);
    if (I.down) this.off = Math.min(max, this.off + 3);
    if (I.up) this.off = Math.max(0, this.off - 3);
    if (G.st > 10 && (I.start || I.p || I.k || I.pause)) { Audio2.sfx('blip'); go('title'); }
  },
  draw() {
    px(0, 0, W, H, '#140804');
    text('更新紀錄', W / 2, 6, { s: 2, c: '#fff', a: 'c', o: '#300', grad: ['#ffffff', '#ffb020'] });
    this.lines.slice(this.off, this.off + 12).forEach(([v, t], k) => {
      if (v) text(v, 8, 38 + k * 13, { c: '#ff6060', o: '#000' });
      text(t, 44, 38 + k * 13, { c: '#e0e0e8', o: '#000' });
    });
    text('↑↓ 捲動　攻擊鍵返回', W / 2, H - 14, { c: '#9ad8ff', a: 'c', o: '#000' });
  },
};
SCENES.select = {
  enter() { Audio2.play('select'); this.cur = CHARS.indexOf(PLAYABLE[G.chIdx]); this.done = 0; markMat(this.cur); },
  update() {
    const I = Input.pressed;
    if (this.done) { if (++this.done > 100) { G.chIdx = PLAYABLE.indexOf(CHARS[this.cur]); G.score = 0; G.flags = {}; G.attract = false; go('chapter'); } return; }
    let c = this.cur;
    const N = CHARS.length, rows = Math.ceil(N / 4);
    if (I.left) c = (c + N - 1) % N; if (I.right) c = (c + 1) % N;
    if (I.up || I.down) { const col = c % 4; let r = Math.floor(c / 4); do { r = (r + (I.down ? 1 : rows - 1)) % rows; } while (r * 4 + col >= N); c = r * 4 + col; }
    if (c !== this.cur) { this.cur = c; Audio2.sfx('cursor'); markMat(c); }
    if ((I.p || I.start) && G.st > 10) {
      const ch = CHARS[this.cur];
      if (ch.locked) { Audio2.sfx('locked'); this.shake = 10; return; }
      this.done = 1; Audio2.sfx('decide'); Audio2.sfx('ch_' + ch.id);
    }
    if (I.pause || I.k) { go('title'); }
    if (this.shake > 0) this.shake--;
  },
  draw() {
    px(0, 0, W, H, '#160806');
    for (let y = 0; y < H; y += 8) px(0, y + ((G.t >> 2) % 8), W, 1, '#22100a');
    text('選擇角色', W / 2, 4, { s: 2, c: '#fff', a: 'c', o: '#300', grad: ['#ffffff', '#ffb020'] });
    const ch = CHARS[this.cur];
    // 左：大頭像與資料
    px(8, 30, 100, 100, '#d8b040'); px(10, 32, 96, 96, '#2a0c06');
    if (ch.locked) { text('?', 58, 60, { s: 3, c: '#604030', a: 'c' }); }
    else if (IMG.porBig[ch.id]) ctx.drawImage(IMG.porBig[ch.id], 10, 32);
    text(ch.name, 116, 32, { s: 2, c: '#ffffff', o: '#000' });
    text(ch.title, 116, 60, { c: '#ff9070', o: '#000' });
    if (ch.locked) {
      text('正式版登場', 116, 80, { c: '#ffd040', o: '#000' });
    } else {
      ['速度', '力量', '耐打'].forEach((n, i) => {
        text(n, 116, 78 + i * 13, { c: '#c8c8d0', o: '#000' });
        for (let k = 0; k < 5; k++) px(144 + k * 9, 81 + i * 13, 7, 6, k < ch.stat[i] ? '#ffd040' : '#3a2010');
      });
      if (!this.done) {
        text('招式一　' + ch.s1n, 12, 138, { c: '#9ad8ff', o: '#000' });
        text('招式二　' + ch.s2n, 12, 152, { c: '#9ad8ff', o: '#000' });
        text('超必殺　' + ch.supn, 12, 166, { c: '#ffd040', o: '#000' });
      }
      // 預覽動作
      const fr = this.done ? 'c7' : ['idle0', 'idle1'][(G.t >> 5) & 1];
      drawSpr(ch.id, fr, 206, 200, 1);
      if (this.done) {   // 選角台詞（太長就換行）
        const q = '「' + ch.pick + '」', n = 15, lines = [];
        for (let i = 0; i < q.length; i += n) lines.push(q.slice(i, i + n));
        px(6, 178 - (lines.length - 1) * 14, 186, 14 * lines.length + 6, 'rgba(0,0,0,.7)');
        lines.forEach((l, i) => text(l, 10, 181 - (lines.length - 1 - i) * 14, { c: '#ffffff', o: '#000' }));
      }
    }
    // 右：選角格（四欄）
    CHARS.forEach((c, i) => {
      const x = 236 + (i % 4) * 36 + (i === this.cur && this.shake ? rnd(-2, 2) : 0), y = 40 + Math.floor(i / 4) * 44;
      const on = i === this.cur;
      px(x - 2, y - 2, 34, 34, on ? ((G.t & 8) || this.done ? '#ffffff' : '#ffd040') : '#5a3a20');
      px(x, y, 30, 30, '#2a0c06');
      const sp = !c.locked && smallPor(c.id, 30);
      if (sp) ctx.drawImage(sp, x, y);
      else text('?', x + 15, y + 8, { c: '#604030', a: 'c', s: 1 });
      text(c.name, x + 15, y + 32, { c: on ? '#ffd040' : '#a08060', a: 'c', o: '#000' });
    });
    text('方向鍵選擇　攻擊鍵決定', 300, H - 14, { c: '#a0a0a8', a: 'c', o: '#000' });
  },
};
// 過場（開場、結局）：一頁一頁的背景＋台詞
// 劇情分支：玩家自己的角色不會死（六子、老二、老湯、夫人）；flag:question＝鐵門打出問號
const playerId = () => PLAYABLE[G.chIdx] && PLAYABLE[G.chIdx].id;
const liuziAlive = () => playerId() === 'liuzi';
function condOk(c) {
  if (!c) return true;
  if (c === 'dead') c = 'dead:liuzi'; if (c === 'alive') c = 'alive:liuzi';
  const [k, v] = c.split(':');
  if (k === 'flag') return !!(G.flags && G.flags[v]);
  return (k === 'alive') === (playerId() === v);
}
function mournText() {   // 第 181 場「老二，老六，師爺，夫人」：玩家自己扮演的人不在名單裡
  return [['erge', '老二'], ['liuzi', '老六'], ['tang', '師爺'], ['wife', '夫人']].filter(([id]) => playerId() !== id).map(([, n]) => n).join('，');
}
function storyPages(pages) {
  return pages.filter(pg => condOk(pg.cond)).map(pg => Object.assign({}, pg, { lines: wrapLines(pg.lines.filter(l => condOk(l[3])).map(l => l[1].includes('%MOURN%') ? [l[0], l[1].replace('%MOURN%', mournText()), l[2]] : l)) })).filter(pg => pg.lines.length);
}
function storyScene(pagesFn, onEnd, music) {
  return {
    enter() { this.pages = storyPages(pagesFn()); this.pi = 0; this.li = 0; this.t = 0; if (music) Audio2.play(music); },
    update() {
      const pg = this.pages[this.pi]; if (!pg) return;
      this.t++;
      const line = pg.lines[this.li], len = line[1].length;
      if (this.t % 3 === 0 && this.t / 2 < len && line[0]) Audio2.sfx('talk');
      if (Input.pressed.start && G.st > 20) { onEnd(); return; }
      const adv = Input.pressed.p || Input.pressed.k || this.t > len * 2 + 110;
      if (adv && this.t > 8) {
        if (this.t / 2 < len) { this.t = len * 2; return; }
        this.li++; this.t = 0;
        if (this.li >= pg.lines.length) { this.li = 0; this.pi++; if (this.pi >= this.pages.length) onEnd(); }
      }
    },
    draw() {
      const pg = this.pages[Math.min(this.pi, this.pages.length - 1)];
      px(0, 0, W, H, '#000');
      if (IMG.bg[pg.bg]) ctx.drawImage(IMG.bg[pg.bg], 0, 0);
      px(0, H - 62, W, 62, 'rgba(0,0,0,.78)'); px(0, H - 62, W, 1, '#d8b040');
      const [who, str, nm] = pg.lines[this.li];
      let tx = 14;
      if (who && IMG.por[who]) { px(8, H - 56, 42, 42, '#d8b040'); ctx.drawImage(IMG.por[who], 9, H - 55); tx = 58; }
      if (who || nm) text(nm || NAMES[who], tx, H - 56, { c: '#ffd040', o: '#000' });
      const n = Math.min(str.length, Math.floor(this.t / 2));
      text(str.slice(0, n), tx, H - (who || nm ? 38 : 44), { c: who || nm ? '#ffffff' : '#e8d8b0', o: '#000' });
      if (n >= str.length && (G.t & 16)) text('▼', W - 14, H - 26, { c: '#ffd040' });
      text('攻擊鍵：下一句　START：跳過', W - 4, H - 13, { c: '#808088', a: 'r' });
    },
  };
}
// ---------- 選擇章節 ----------
const chapterCleared = () => new Set(Store.get('cleared', []));
const chapterOpen = i => !CHAPTER_LOCK || i === 0 || chapterCleared().has(i - 1) || chapterCleared().has(i);
function markChapter(scene) {   // 走到下一章的開頭＝上一章打過了；看到結局＝最後一章打過了
  if (G.attract) return;
  if (G.fromMenu) { G.fromMenu = false; return; }   // 從選單直接跳進來的不算打過上一章
  const k = scene === 'ending' ? CHAPTERS.length : CHAPTERS.findIndex(c => c.start === scene);
  if (k > 0) { const c = chapterCleared(); c.add(k - 1); Store.set('cleared', [...c]); }
}
SCENES.chapter = {
  enter() { this.cur = 0; this.shake = 0; Audio2.play('select'); },
  update() {
    const I = Input.pressed, n = CHAPTERS.length;
    if (I.up) { this.cur = (this.cur + n - 1) % n; Audio2.sfx('cursor'); }
    if (I.down) { this.cur = (this.cur + 1) % n; Audio2.sfx('cursor'); }
    if ((I.p || I.start) && G.st > 10) {
      if (!chapterOpen(this.cur)) { Audio2.sfx('locked'); this.shake = 10; return; }
      Audio2.sfx('decide'); G.score = 0; G.flags = {}; P = null; G.chapter = this.cur;
      G.fromMenu = true; go(CHAPTERS[this.cur].start);
    }
    if (I.k || I.pause) go('select');
    if (this.shake > 0) this.shake--;
  },
  draw() {
    px(0, 0, W, H, '#160806');
    for (let y = 0; y < H; y += 8) px(0, y + ((G.t >> 2) % 8), W, 1, '#22100a');
    text('選擇章節', W / 2, 4, { s: 2, c: '#fff', a: 'c', o: '#300', grad: ['#ffffff', '#ffb020'] });
    const cleared = chapterCleared();
    CHAPTERS.forEach((c, i) => {
      const y = 34 + i * 23, on = i === this.cur, open = chapterOpen(i);
      const x = 8 + (on && this.shake ? rnd(-2, 2) : 0);
      px(x, y, 196, 21, on ? '#5a2a10' : '#2a1208'); if (on) { px(x, y, 196, 1, '#ffd040'); px(x, y + 20, 196, 1, '#ffd040'); }
      text(open ? c.name : '？？？', x + 6, y + 4, { c: !open ? '#604030' : on ? '#ffd040' : '#e0d0c0', o: '#000' });
      if (cleared.has(i)) text('✓', x + 188, y + 4, { c: '#80ff80', o: '#000', a: 'r' });
    });
    const c = CHAPTERS[this.cur], open = chapterOpen(this.cur), im = IMG.bg[c.thumb];
    px(212, 34, 166, 96, '#d8b040');
    if (im && open) ctx.drawImage(im, 0, 0, W, H, 214, 36, 162, 92); else { px(214, 36, 162, 92, '#200a04'); text('？', 295, 70, { s: 2, c: '#604030', a: 'c' }); }
    text(open ? c.sub : '打過前一章才能選', 295, 136, { c: '#ffffff', o: '#000', a: 'c' });
    const ch = PLAYABLE[G.chIdx]; if (ch && IMG.por[ch.id]) { px(272, 156, 44, 44, '#d8b040'); ctx.drawImage(IMG.por[ch.id], 274, 158); text(ch.name, 322, 172, { c: '#ffd040', o: '#000' }); }
    if (!CHAPTER_LOCK) text('試玩版：全部開放', W - 6, 12, { c: '#a0a0a8', o: '#000', a: 'r' });
    text('↑↓ 選擇　攻擊鍵開始　跳：換角色', W - 4, H - 14, { c: '#a0a0a8', o: '#000', a: 'r' });
  },
};

SCENES.intro = storyScene(() => INTRO, () => { if (G.attract) { G.attract = false; go('title'); } else go('ridein'); }, 'title');
SCENES.midro = storyScene(() => MIDRO, () => { G.stageIdx = 0; go('stagein'); }, 'title');
SCENES.stagein = {
  enter() { setupStage(); Audio2.play('stage1'); },
  update() { if (G.st > 100 || (G.st > 20 && (Input.pressed.p || Input.pressed.start))) go('play'); },
  draw() {
    drawStageBg(); ctx.fillStyle = `rgba(0,0,0,${Math.max(0, 1 - G.st / 40) * 0.8 + 0.2})`; ctx.fillRect(0, 0, W, H);
    text(STAGE.name, W / 2, 80, { s: 2, c: '#fff', a: 'c', o: '#300', grad: ['#ffffff', '#ffb020'] });
    text(STAGE.sub || '', W / 2, 112, { c: '#e8d8b0', a: 'c', o: '#000' });
  },
};
SCENES.play = {
  update() {
    if (G.paused) return pauseUpdate();
    if (Input.pressed.pause && !G.talk && !G.cutin && !G.clear) { G.paused = true; G.pauseSel = 0; G.showMoves = false; Audio2.sfx('pause'); return; }
    updatePlay();
  },
  draw() {
    ctx.save();
    if (G.shake) ctx.translate(Math.round(rnd(-G.shake, G.shake) / 2), Math.round(rnd(-G.shake, G.shake) / 2));
    drawStageBg();
    drawVolley();
    drawMines();
    drawWorld();
    ctx.save(); ctx.translate(-G.camX, 0);
    // dust 用世界座標
    ctx.restore();
    drawFx();
    ctx.restore();
    if (G.flash) { ctx.fillStyle = `rgba(255,255,255,${G.flash / 10})`; ctx.fillRect(0, 0, W, H); }
    drawHud();
    drawCutin();
    drawTalk();
    if (G.clear) {
      const k = Math.min(1, G.clearT / 30);
      text('STAGE CLEAR', W / 2, 70 - (1 - k) * 30, { s: 2, c: '#fff', a: 'c', o: '#300', grad: ['#ffffff', '#ffb020'] });
    }
    if (G.paused) pauseDraw();
  },
};
const PAUSE_ITEMS = ['繼續', '出招表', '重新開始', '回到標題', '聲音'];
function pauseUpdate() {
  const I = Input.pressed;
  if (G.showMoves) { if (I.p || I.k || I.pause || I.start) G.showMoves = false; return; }
  if (I.up) { G.pauseSel = (G.pauseSel + 4) % 5; Audio2.sfx('cursor'); }
  if (I.down) { G.pauseSel = (G.pauseSel + 1) % 5; Audio2.sfx('cursor'); }
  if (I.pause || I.k) { G.paused = false; return; }
  if (I.p || I.start) {
    const it = PAUSE_ITEMS[G.pauseSel];
    if (it === '繼續') G.paused = false;
    else if (it === '出招表') G.showMoves = true;
    else if (it === '重新開始') { G.paused = false; G.score = 0; go(G.scene === 'ride' ? 'ridein' : G.scene === 'bonus' ? 'bonusin' : 'stagein'); }
    else if (it === '回到標題') { G.paused = false; go('title'); }
    else if (it === '聲音') Audio2.toggleMute();
  }
}
function moveLines(ch) {
  const s2 = ch.moves.s2;
  return [[ch.ranged ? '攻擊（遠）' : '連按攻擊', ch.ranged ? '開槍點射→雙手重射（貼身改槍托、踢）' : '四段連打'], ['跳＋攻擊', '跳躍攻擊'], ['→→＋攻擊', '衝刺攻擊'], ['走到敵人身上', '抓住（攻擊＝膝撞，←＋攻擊＝往後摔）'],
    ['招式一', ch.s1n], ['招式二', ch.counter ? '按住擺「被動」架勢：擋正面攻擊、自動反擊' : ch.s2n + (s2.cost ? '（打中扣自己一點血）' : '')], ['超必殺', ch.supn + '（怒氣滿）']]
    .concat(ch.armor ? [['特性', '霸體：出招時被打不會中斷']] : [])
    .concat(ch.toolbox ? [['特性', '百寶箱每次掏出的東西不同：磚頭、刨子、鉗子……']] : [])
    .concat(ch.id === 'huajie' ? [['特性', '他跑我就追：追到最近的敵人身邊揭面具，對方愣住']] : []);
}
function pauseDraw() {
  ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(0, 0, W, H);
  if (G.showMoves) {
    const ch = P.ch;
    text('出招表　' + ch.name, W / 2, 26, { s: 1, c: '#ffd040', a: 'c', o: '#000' });
    moveLines(ch).forEach(([a, b], i) => { text(a, 24, 46 + i * 16, { c: '#9ad8ff', o: '#000' }); text(b, 112, 46 + i * 16, { c: '#ffffff', o: '#000' }); });
    text(isTouch ? '招一／招二／超 按鍵直接放' : 'L 招式一　I 招式二　空白鍵 超必殺　K 跳', W / 2, H - 28, { c: '#c0c0c8', a: 'c', o: '#000' });
    return;
  }
  text('暫停', W / 2, 40, { s: 2, c: '#fff', a: 'c', o: '#300' });
  PAUSE_ITEMS.forEach((it, i) => {
    const label = it === '聲音' ? '聲音：' + (Audio2.muted ? '關' : '開') : it;
    text((i === G.pauseSel ? '▶ ' : '　') + label, W / 2 - 40, 80 + i * 18, { c: i === G.pauseSel ? '#ffd040' : '#ffffff', o: '#000' });
  });
}
SCENES.continue = {
  enter() { this.n = 9; this.t = 0; Audio2.play('gameover'); },
  update() {
    if (++this.t % 60 === 0) { this.n--; Audio2.sfx('tick'); if (this.n < 0) { Store.set('hi', G.hi); go('title'); return; } }
    if ((Input.pressed.p || Input.pressed.start) && this.t > 20) {
      P.lives = 2; P.hp = P.maxhp; P.meter = 100; G.score = 0; if (G.resume !== 'ride') dropIn(P); else { P.st = 'idle'; P.inv = 150; }
      Audio2.sfx('decide'); if (G.resume === 'ride') Audio2.play('stage1'); else Audio2.play(STAGE.waves[Math.min(G.wave, STAGE.waves.length - 1)] && STAGE.waves[Math.min(G.wave, STAGE.waves.length - 1)].music || 'stage1');
      G.scene = G.resume || 'play'; G.st = 0; G.resume = null;
    }
    if (Input.pressed.k) { this.t = Math.ceil(this.t / 60) * 60 - 1; }
  },
  draw() {
    SCENES.play.draw();
    ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(0, 0, W, H);
    text('CONTINUE?', W / 2, 60, { s: 2, c: '#fff', a: 'c', o: '#300' });
    text(String(Math.max(0, this.n)), W / 2, 96, { s: 3, c: '#ffd040', a: 'c', o: '#300' });
    text('攻擊鍵：接關（分數歸零）', W / 2, 160, { c: '#ffffff', a: 'c', o: '#000' });
  },
};
SCENES.story2 = storyScene(() => OUTRO, () => { G.stageIdx = 1; go('stagein'); }, 'title');
SCENES.outro = SCENES.story2;
SCENES.story3 = storyScene(() => STORY3, () => go('bonusin'), 'title');
SCENES.story4 = storyScene(() => STORY4, () => { G.stageIdx = 2; go('stagein'); }, 'title');
SCENES.story5 = storyScene(() => STORY5, () => go('gatein'), 'title');
SCENES.story6 = storyScene(() => STORY6, () => { G.stageIdx = 3; go('stagein'); }, 'title');
SCENES.storyEnd = storyScene(() => STORYEND, () => go('ending'), 'ending');
SCENES.ending = {
  enter() {
    Store.set('hi', G.hi);
    const id = playerId(), got = ['normal'];
    if (id === 'liuzi') got.push('ryuyou');
    if (id === 'tang') got.push('kangcheng');
    if (G.flags && G.flags.question) got.push('yanpin');
    this.got = got;
    const all = new Set(Store.get('endings', [])); got.forEach(g => all.add(g)); Store.set('endings', [...all]);
    this.all = all;
  },
  update() { if (G.st > 90 && (Input.pressed.p || Input.pressed.start)) go('title'); },
  draw() {
    if (IMG.bg.ending) ctx.drawImage(IMG.bg.ending, 0, 0);
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = Math.min(1, G.st / 40);
    text('全劇終', W / 2, 16, { s: 2, c: '#fff', a: 'c', o: '#300', grad: ['#ffffff', '#ffb020'] });
    text('SCORE  ' + String(G.score).padStart(7, '0') + '　　HI  ' + String(G.hi).padStart(7, '0'), W / 2, 50, { c: '#ffd040', a: 'c', o: '#000' });
    text('這次達成', W / 2, 72, { c: '#ff8070', a: 'c', o: '#000' });
    this.got.forEach((k, i) => text(ENDINGS[k][0] + '「' + ENDINGS[k][1].split('（')[0] + '」', W / 2, 88 + i * 14, { c: '#ffffff', a: 'c', o: '#000' }));
    const y0 = 104 + this.got.length * 14;
    text('結局收集　' + this.all.size + '／' + Object.keys(ENDINGS).length, W / 2, y0, { c: '#ff8070', a: 'c', o: '#000' });
    Object.keys(ENDINGS).forEach((k, i) => text(this.all.has(k) ? ENDINGS[k][1] : '？？？', 60 + (i % 2) * 150, y0 + 16 + (i >> 1) * 14, { c: this.all.has(k) ? '#e8d8b0' : '#808088', o: '#000' }));
    ctx.globalAlpha = 1;
    if (G.st > 90 && (G.t >> 5) & 1) text('THANK YOU FOR PLAYING', W / 2, H - 30, { c: '#ffd040', a: 'c', o: '#000' });
    text('同人非官方作品　改編自電影《讓子彈飛》', W / 2, H - 14, { c: '#a0a0a8', a: 'c', o: '#000' });
  },
};

// ---------- 桌墊：出招表 ----------
function buildMat() {
  const mat = document.getElementById('mat');
  if (!mat) return;
  const basic = isTouch
    ? ['左搖桿：移動（上下＝往裡往外）', '攻：連打　跳：跳躍', '招一・招二：專屬招式', '超：怒氣滿放超必殺', 'START：暫停']
    : ['方向鍵／WASD：移動', 'J 攻擊　K 跳　→→ 跑', 'L 招式一　I 招式二', '空白鍵：超必殺（怒氣滿）', 'Esc：暫停　M：靜音'];
  let h = `<div class="mat-head">出招表 COMMAND LIST<span><button id="matIcon">圖示</button> <button id="matLog">${VERSION} 更新紀錄</button> <button id="matToggle">收起</button></span></div><div class="mat-body">`;
  h += `<div class="card basic"><div class="nm">基本操作</div><ul>${basic.map(b => `<li>${b}</li>`).join('')}</ul></div>`;
  CHARS.forEach((ch, i) => {
    if (ch.locked) { h += `<div class="card locked" data-i="${i}"><div class="top"><div class="ph">?</div><div class="nm">${ch.name}<small>${ch.title}</small></div></div><ul><li>正式版登場</li></ul></div>`; return; }
    h += `<div class="card" data-i="${i}"><div class="top"><img src="${(window.PORTRAITS || {})[ch.id] || ''}" alt="" draggable="false"><div class="nm">${ch.name}<small>${ch.title}</small></div></div><ul>` +
      [['招式一', ch.s1n], ['招式二', ch.s2n], ['超必殺', ch.supn]].map(([c, n]) => `<li><b>${c}</b>${n}</li>`).join('') + `</ul></div>`;
  });
  mat.innerHTML = h + '</div>';
  document.getElementById('matLog').addEventListener('click', () => {
    const d = document.getElementById('logDlg');
    d.querySelector('div').innerHTML = CHANGELOG.map(([v, ...it]) => `<h4>${v}</h4><ul>${it.map(x => `<li>${x}</li>`).join('')}</ul>`).join('');
    d.showModal();
  });
  document.getElementById('matIcon').addEventListener('click', () => HomeIcon.open());
  document.getElementById('matToggle').addEventListener('click', () => {
    document.body.classList.toggle('mat-off'); fit();
    document.getElementById('matToggle').textContent = document.body.classList.contains('mat-off') ? '展開' : '收起';
  });
  fit();
}
function markMat(i) {
  document.querySelectorAll('#mat .card[data-i]').forEach(el => el.classList.toggle('on', +el.dataset.i === i));
  const el = document.querySelector(`#mat .card[data-i="${i}"]`);
  if (el && el.parentElement.scrollTo) el.parentElement.scrollTo({ left: el.offsetLeft - el.parentElement.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' });
}
buildMat();
addEventListener('keydown', e => { if (e.code === 'KeyM') Audio2.toggleMute(); });

// ---------- 主迴圈（固定 60fps 邏輯） ----------
function tick() { Input.update(); SCENES[G.scene].update(); G.t++; G.st++; }
function render() { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; SCENES[G.scene].draw(); }
let last = performance.now(), acc = 0;
let lostT = 0;
function frame(now) {
  if (++lostT >= 30) { lostT = 0; checkCanvases(); }
  acc += Math.min(100, now - last); last = now;
  while (acc >= 1000 / 60) { tick(); acc -= 1000 / 60; }
  render();
  requestAnimationFrame(frame);
}
// 開發測試用：手動推進（預覽分頁被隱藏時 requestAnimationFrame 不會跑）
window.step = (n = 1) => { for (let i = 0; i < n; i++) tick(); render(); };
const fontReady = document.fonts ? Promise.race([document.fonts.load(FONT), new Promise(r => setTimeout(r, 2500))]) : Promise.resolve();
Promise.all([fontReady, SPRITES_READY, ART_READY]).then(() => { textCache.clear(); go('boot'); requestAnimationFrame(frame); });
