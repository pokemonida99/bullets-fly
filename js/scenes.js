// 畫面：關卡繪製、HUD、對話框、各場景、主迴圈
'use strict';

// ---------- 背景：五張街景接起來，接縫用木柱遮住 ----------
// 分層街景：天空（視差、白天漸變黃昏）＋沿街排列的建築立面（去背）＋連續的石板路
// 關鍵建築放在固定位置（城門、縣衙、涼粉攤、黃府），中間用騎樓補滿；建築本來就一棟一棟，不會有切開的接縫
const GROUND_Y = 142;
const FACADE_ANCHOR = [['f_gate', 0], ['f_yamen', 470], ['f_noodle', 850], ['f_wall', 1330], ['f_huang', null]];
const FILLERS = ['f_shop1', 'f_shop2', 'f_shop3'];
let facadeLayout = null;
function layoutFacades() {
  if (facadeLayout) return facadeLayout;
  const img = k => IMG.bg[k];
  if (!FACADE_ANCHOR.every(([k]) => img(k)) || !FILLERS.every(img)) return null;
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
function dusk() { return clamp((G.camX - 820) / 700, 0, 1); }
function drawStageLayers() {
  const L = layoutFacades(); if (!L) return false;
  const cx = G.camX, k = dusk();
  tileMirror(IMG.bg.sky_day, cx * 0.25, 0);
  if (k > 0 && IMG.bg.sky_dusk) { ctx.globalAlpha = k; tileMirror(IMG.bg.sky_dusk, cx * 0.25, 0); ctx.globalAlpha = 1; }
  for (const f of L) {
    const im = IMG.bg[f.k], x = Math.round(f.x - cx);
    if (x > W || x + im.width < 0) continue;
    const y = GROUND_Y - im.height + 2;
    if (f.flip) { ctx.save(); ctx.translate(x + im.width, y); ctx.scale(-1, 1); ctx.drawImage(im, 0, 0); ctx.restore(); }
    else ctx.drawImage(im, x, y);
    signs2(f.k, x, y, im);
  }
  if (IMG.bg.ground) tileMirror(IMG.bg.ground, cx, GROUND_Y - 4);
  // 越往前走越接近黃昏：建築與地面染上夕陽色
  if (k > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(255,${Math.round(lerp(255, 150, k))},${Math.round(lerp(255, 110, k))},1)`; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  return true;
}
// 立面上的匾額字（GPT 畫的匾額是空白的；位置是相對立面圖的比例）
const SIGN_AT = { f_gate: ['鵝城', 0.5, 0.56], f_yamen: ['縣衙', 0.5, 0.38], f_huang: ['黃府', 0.5, 0.55] };
const SIGN_V = { f_noodle: ['涼粉', 0.86, 0.30] };
function signs2(k, x, y, im) {
  const a = SIGN_AT[k]; if (a) text(a[0], x + im.width * a[1], y + im.height * a[2] - 6, { c: k === 'f_huang' ? '#f0c040' : '#3a1a08', a: 'c' });
  const v = SIGN_V[k]; if (v) vtext(v[0], x + im.width * v[1], y + im.height * v[2], { c: '#a01810' });
}

function drawStageBg() {
  if (drawStageLayers()) return;
  const cx = Math.round(G.camX);
  STAGE.segs.forEach((k, i) => {
    const x = i * W - cx;
    if (x > W || x < -W) return;
    const img = IMG.bg[k];
    if (img) ctx.drawImage(img, x, 0);
    signs(k, x);
  });
  // 接縫：木柱＋紅燈籠
  for (let i = 1; i < STAGE.segs.length; i++) {
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
  if (G.drum && G.drum.t >= 0) list.push({ z: G.drum.z, d: drawDrum });
  list.sort((a, b) => a.z - b.z);
  for (const o of list) o.d();
}
function drawPlayer(p) {
  const sx = p.x - G.camX;
  shadow(sx, p.z, p.h, 26);
  if (p.inv > 0 && p.inv < 140 && (G.t & 2) && p.st !== 'super') return;
  const fr = playerFrame(p);
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
  if (e.st === 'daze') text('$', sx, e.z - 84 + Math.sin(G.t / 5) * 2, { c: '#ffd040', a: 'c', o: '#000' });
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

function drawFx() {
  for (const f of fx) {
    if (f.kind === 'hang') {   // 停在空中的子彈
      const sx = f.x - G.camX, y = f.y + Math.sin((G.t + f.d * 7) / 9) * 1.5;
      if (f.t < f.d) continue;
      px(sx - 1, y - 3, 3, 6, '#ffd040'); px(sx, y - 3, 1, 2, '#ffffff');
      if ((G.t + f.d) % 20 < 3) px(sx - 3, y, 7, 1, '#fff7c0');
    } else if (f.kind === 'ring') {
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
    if (this.done) { if (++this.done > 60) { G.chIdx = PLAYABLE.indexOf(CHARS[this.cur]); G.score = 0; G.attract = false; go('intro'); } return; }
    let c = this.cur;
    if (I.left) c = (c + 7) % 8; if (I.right) c = (c + 1) % 8;
    if (I.up || I.down) c = (c + 4) % 8;
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
      text('招式一　' + ch.s1n, 12, 138, { c: '#9ad8ff', o: '#000' });
      text('招式二　' + ch.s2n, 12, 152, { c: '#9ad8ff', o: '#000' });
      text('超必殺　' + ch.supn, 12, 166, { c: '#ffd040', o: '#000' });
      // 預覽動作
      const fr = this.done ? 'c7' : ['idle0', 'idle1'][(G.t >> 5) & 1];
      drawSpr(ch.id, fr, 196, 196, 1);
      if (this.done) text('「' + ch.pick + '」', 12, 186, { c: '#ffffff', o: '#000' });
    }
    // 右：八格
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
function storyScene(pagesFn, onEnd, music) {
  return {
    enter() { this.pages = pagesFn(); this.pi = 0; this.li = 0; this.t = 0; if (music) Audio2.play(music); },
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
SCENES.intro = storyScene(() => INTRO, () => { if (G.attract) { G.attract = false; go('title'); } else go('ridein'); }, 'title');
SCENES.midro = storyScene(() => MIDRO, () => go('stagein'), 'title');
SCENES.stagein = {
  enter() { setupStage(); Audio2.play('stage1'); },
  update() { if (G.st > 100 || (G.st > 20 && (Input.pressed.p || Input.pressed.start))) go('play'); },
  draw() {
    drawStageBg(); ctx.fillStyle = `rgba(0,0,0,${Math.max(0, 1 - G.st / 40) * 0.8 + 0.2})`; ctx.fillRect(0, 0, W, H);
    text(STAGE.name, W / 2, 80, { s: 2, c: '#fff', a: 'c', o: '#300', grad: ['#ffffff', '#ffb020'] });
    text('—— 北洋年間　南部中國 ——', W / 2, 112, { c: '#e8d8b0', a: 'c', o: '#000' });
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
    else if (it === '重新開始') { G.paused = false; G.score = 0; go(G.scene === 'ride' ? 'ridein' : 'stagein'); }
    else if (it === '回到標題') { G.paused = false; go('title'); }
    else if (it === '聲音') Audio2.toggleMute();
  }
}
function moveLines(ch) {
  return [['連按攻擊', '四段連打'], ['跳＋攻擊', '跳躍攻擊'], ['→→＋攻擊', '衝刺攻擊'], ['走到敵人身上', '抓住（攻擊＝膝撞，←＋攻擊＝往後摔）'],
    ['招式一', ch.s1n], ['招式二', ch.s2n + '（打中扣自己一點血）'], ['超必殺', ch.supn + '（怒氣滿）']];
}
function pauseDraw() {
  ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(0, 0, W, H);
  if (G.showMoves) {
    const ch = P.ch;
    text('出招表　' + ch.name, W / 2, 26, { s: 1, c: '#ffd040', a: 'c', o: '#000' });
    moveLines(ch).forEach(([a, b], i) => { text(a, 60, 50 + i * 17, { c: '#9ad8ff', o: '#000' }); text(b, 150, 50 + i * 17, { c: '#ffffff', o: '#000' }); });
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
      P.lives = 2; P.hp = P.maxhp; P.st = 'idle'; P.inv = 150; P.meter = 100; G.score = 0;
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
SCENES.outro = storyScene(() => OUTRO, () => go('ending'), 'ending');
SCENES.ending = {
  enter() { Store.set('hi', G.hi); },
  update() { if (G.st > 90 && (Input.pressed.p || Input.pressed.start)) go('title'); },
  draw() {
    if (IMG.bg.ending) ctx.drawImage(IMG.bg.ending, 0, 0);
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, W, H);
    const k = Math.min(1, G.st / 40);
    ctx.globalAlpha = k;
    text('試玩版到此結束', W / 2, 24, { s: 2, c: '#fff', a: 'c', o: '#300', grad: ['#ffffff', '#ffb020'] });
    text('SCORE  ' + String(G.score).padStart(7, '0'), W / 2, 64, { c: '#ffd040', a: 'c', o: '#000' });
    text('HI  ' + String(G.hi).padStart(7, '0'), W / 2, 80, { c: '#c8c8d0', a: 'c', o: '#000' });
    text('正式版預告', W / 2, 110, { c: '#ff8070', a: 'c', o: '#000' });
    text('黃府鴻門宴・出城剿匪・碉樓決戰黃四郎', W / 2, 126, { c: '#ffffff', a: 'c', o: '#000' });
    text('四哥、五哥、七弟登場', W / 2, 142, { c: '#ffffff', a: 'c', o: '#000' });
    ctx.globalAlpha = 1;
    if (G.st > 90 && (G.t >> 5) & 1) text('THANK YOU FOR PLAYING', W / 2, 176, { c: '#ffd040', a: 'c', o: '#000' });
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
  let h = `<div class="mat-head">出招表 COMMAND LIST<span><button id="matLog">${VERSION} 更新紀錄</button> <button id="matToggle">收起</button></span></div><div class="mat-body">`;
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
function frame(now) {
  acc += Math.min(100, now - last); last = now;
  while (acc >= 1000 / 60) { tick(); acc -= 1000 / 60; }
  render();
  requestAnimationFrame(frame);
}
// 開發測試用：手動推進（預覽分頁被隱藏時 requestAnimationFrame 不會跑）
window.step = (n = 1) => { for (let i = 0; i < n; i++) tick(); render(); };
const fontReady = document.fonts ? Promise.race([document.fonts.load(FONT), new Promise(r => setTimeout(r, 2500))]) : Promise.resolve();
Promise.all([fontReady, SPRITES_READY, ART_READY]).then(() => { textCache.clear(); go('boot'); requestAnimationFrame(frame); });
