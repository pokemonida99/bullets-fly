// 序章「青石嶺 劫火車」：騎白馬追著脫鉤後倒退的兩節黑車（劇本第 9～19 場）
// 車窗裡的鐵血十八星陸軍開槍 → 打倒 12 個 → 甩板斧卡進鐵軌 → 火車騰空翻進河裡
'use strict';
const RIDE = {
  goal: 20, zmin: 172, zmax: 210, xmin: 26, xmax: 330,
  roadV: 3.4,            // 地面捲動速度
};
let R = null;
const NEAR_DY = 36;
// 打倒 20 個陸軍才能甩板斧；後半段有些要打兩下   // 近景（鐵軌＋路）往下移，火車才不會被上方資訊列擋住
const rideMeta = () => { const m = Object.assign({ railY: 114, trainH: 84, windows: null }, window.RIDE_META || {}); m.railY += NEAR_DY; return m; };

function setupRide() {
  foes = []; projs = []; items = []; parts = []; pops = []; fx = [];
  G.cutin = null; G.talk = null; G.hitstop = 0; G.shake = 0; G.flash = 0; G.camX = 0; G.foe = null;
  P = newPlayer(PLAYABLE[G.chIdx]);
  P.x = 120; P.z = 192; P.rt = 0; P.rst = 'ride'; P.atkN = 0;
  const m = rideMeta();
  R = { thrown: false, t: 0, farX: 0, nearX: 0, trainX: 8, kills: 0, gunners: [], shots: [], obs: [], phase: 'fight', axes: [], flip: null, nextGun: 60, nextObs: 200, railY: m.railY, trainH: m.trainH };
  // 車窗位置（相對火車圖）：有 RIDE_META.windows 就用，沒有就平均分配
  const tw = trainImg() ? trainImg().width : 360;
  R.trainW = tw;
  R.windows = (m.windows || [...Array(16)].map((_, i) => { const car = i >> 3, k = i & 7; return [tw * (car * 0.5 + 0.06 + k * 0.055), 0.42]; }))
    .map(([x, fy]) => ({ x, y: fy, g: null }));
}
const trainImg = () => IMG.bg.r_train;

function rideHurt(dmg) {
  const p = P;
  if (p.inv > 0 || R.phase !== 'fight' && R.phase !== 'axe') return false;
  p.hp = Math.max(0, p.hp - dmg); p.meter = Math.min(100, p.meter + dmg); p.flash = 8; p.rst = 'hurt'; p.rt = 18; p.inv = 40;
  sfx('hit'); sfx('hurt'); G.shake = 4; buzz(40);
  if (p.hp <= 0) {
    if (p.lives > 0) { p.lives--; p.hp = p.maxhp; p.inv = 150; p.meter = 50; sfx('superStart'); G.flash = 8; R.shots = []; }
    else { G.resume = 'ride'; go('continue'); }
  }
  return true;
}

function windowWorld(w) { return { x: R.trainX + w.x, y: R.railY - R.trainH + w.y * R.trainH }; }

function updateRide() {
  if (G.cutin) { if (++G.cutin.t > 56) G.cutin = null; return; }
  if (G.hitstop > 0) { G.hitstop--; return; }
  const I = Input.held, Pr = Input.pressed, p = P;
  R.t++;
  if (G.shake > 0) G.shake--;
  if (G.flash > 0) G.flash--;
  if (p.inv > 0) p.inv--;
  if (p.flash > 0) p.flash--;
  R.farX += 0.5; R.nearX += RIDE.roadV; G.camX = R.nearX;   // 灰塵、字用世界座標
  if (R.t % 14 === 0) sfx('hoof');
  if (R.phase === 'fight' || R.phase === 'axe') R.trainX = 8 + Math.sin(R.t / 150) * 40 - Math.max(0, Math.sin(R.t / 400)) * 30;

  // 玩家
  const dx = (I.right ? 1 : 0) - (I.left ? 1 : 0), dz = (I.down ? 1 : 0) - (I.up ? 1 : 0);
  if (R.phase !== 'flip') {
    p.x = clamp(p.x + dx * 2.2, RIDE.xmin, RIDE.xmax); p.z = clamp(p.z + dz * 1.4, RIDE.zmin, RIDE.zmax);
  }
  if (p.h > 0 || p.vh > 0) { p.h += p.vh; p.vh -= 0.26; if (p.h <= 0) { p.h = 0; p.vh = 0; sfx('land'); dust(p.x + R.nearX, p.z, 4); } }
  if (p.rt > 0 && --p.rt === 0) p.rst = 'ride';
  if (Pr.k && p.h === 0 && R.phase !== 'flip') { p.vh = 4.6; sfx('jump'); }
  if (R.phase === 'fight') {
    if (Pr.sup && p.meter >= 100) rideSuper();
    else if ((Pr.p || Pr.s1 || Pr.s2) && p.rst !== 'atk' && p.rst !== 'hurt') rideAttack(Pr.s1 || Pr.s2);
  } else if (R.phase === 'axe') {
    if ((Pr.p || Pr.s1 || Pr.s2 || Pr.sup) && p.rst !== 'hurt' && !R.thrown) throwAxes();
  }

  // 車窗槍手
  if (R.phase === 'fight' && --R.nextGun <= 0) {
    R.nextGun = rndi(60, 110);
    const act = R.windows.filter(w => w.g).length;
    const free = R.windows.filter(w => !w.g && (() => { const x = windowWorld(w).x; return x > 30 && x < W - 30; })());
    if (act < 3 && free.length) { const w = pick(free); w.g = { st: 'rise', t: 0, hp: R.kills > 4 && Math.random() < 0.4 ? 2 : 1 }; }
  }
  for (const w of R.windows) {
    const g = w.g; if (!g) continue;
    g.t++;
    if (g.st === 'rise' && g.t > 14) { g.st = 'aim'; g.t = 0; }
    else if (g.st === 'aim' && g.t > 44) {
      g.st = 'fire'; g.t = 0; sfx('gunFar');
      const ww = windowWorld(w);
      R.shots.push({ x0: ww.x, y0: ww.y, x1: p.x + rnd(-6, 6), z1: p.z, t: 0, T: rndi(26, 34) });
    } else if (g.st === 'fire' && g.t > 30) { g.st = Math.random() < 0.5 ? 'aim' : 'hide'; g.t = 0; }
    else if (g.st === 'hide' && g.t > 14) w.g = null;
    else if (g.st === 'dead' && g.t > 30) w.g = null;
  }
  // 子彈落點
  for (const s of R.shots) {
    s.t++;
    if (s.t === s.T) {
      if (Math.abs(p.x - s.x1) < 14 && Math.abs(p.z - s.z1) < 10 && p.h < 24) rideHurt(8);
      else { dust(s.x1 + R.nearX, s.z1, 3); }
    }
  }
  R.shots = R.shots.filter(s => s.t < s.T + 4);
  // 玩家的子彈（往車窗飛）
  for (const b of projs) {
    b.t++; b.x += b.vx; b.y += b.vy;
    if (b.y <= b.ty) {
      b.dead = true;
      for (const w of R.windows) {
        if (!w.g || w.g.st === 'dead' || w.g.st === 'rise' && w.g.t < 6) continue;
        const ww = windowWorld(w);
        if (Math.abs(ww.x - b.x) < 12) { if (--w.g.hp > 0) { spark(ww.x, ww.y, false); sfx('hit'); w.g.flash = 6; } else killGunner(w); break; }
      }
    }
  }
  projs = projs.filter(b => !b.dead);
  // 石頭、倒木
  if (R.phase === 'fight' && --R.nextObs <= 0) {
    R.nextObs = rndi(110, 200);
    R.obs.push({ k: Math.random() < 0.5 ? 'boulder' : 'log', x: W + 30, z: rndi(RIDE.zmin + 4, RIDE.zmax - 2), hit: false });
  }
  for (const o of R.obs) {
    o.x -= RIDE.roadV;
    if (!o.hit && Math.abs(o.x - p.x) < 16 && Math.abs(o.z - p.z) < 9 && p.h < 12) { o.hit = true; rideHurt(6); }
  }
  R.obs = R.obs.filter(o => o.x > -40);
  // 甩板斧 → 翻車
  for (const a of R.axes) {
    if (!a.stuck) { a.t++; const k = Math.min(1, a.t / 26); a.x = lerp(a.x0, a.x1, k); a.y = lerp(a.y0, a.y1, k) - Math.sin(k * Math.PI) * 40; a.rot += 0.5; if (k >= 1) { a.stuck = true; sfx('hit'); G.shake = 3; } }
    else a.x -= 0;   // 卡在鐵軌上（跟著火車一起看起來不動）
  }
  if (R.phase === 'axe' && R.axes.length && R.axes.every(a => a.stuck)) { R.phase = 'crash'; R.ct = 0; }
  if (R.phase === 'crash') {
    R.ct++;
    R.trainX += 3.2;   // 黑車衝向板斧
    const front = R.trainX + R.trainW;
    if (front >= R.axes[0].x - 4 && !R.flip) { R.flip = { t: 0, rot: 0, vy: -7, y: 0 }; R.phase = 'flip'; sfx('break'); sfx('quake'); G.shake = 16; G.flash = 6; }
  }
  if (R.phase === 'flip') {
    const f = R.flip; f.t++; f.rot -= 0.05; f.y += f.vy; f.vy += 0.12; R.trainX -= 1.5;   // 黑車騰空翻起
    if (f.t % 6 === 0) { sfx('gunFar'); }
    if (f.t === 50) { sfx('wave'); G.flash = 10; }
    if (f.t > 62) { G.score += 5000; go('midro'); }
  }
  for (const q of parts) { q.t++; q.x += q.vx; q.y += q.vy; q.vy += q.g; }
  parts = parts.filter(q => q.t < q.life);
  for (const q of pops) q.t++;
  pops = pops.filter(q => q.t < 70);
  if (G.score > G.hi) G.hi = G.score;
}
function rideAttack(strong) {
  const p = P, ch = p.ch;
  p.rst = 'atk'; p.rt = 16; p.atkN++;
  const shooter = ch.id !== 'liuzi' && !ch.rideMelee;
  if (shooter) {
    const n = strong ? 3 : 1;
    for (let i = 0; i < n; i++) projs.push({ x: p.x + 18 + (i - (n - 1) / 2) * 14, y: p.z - 54 - p.h, vx: (i - (n - 1) / 2) * 0.8, vy: -6, ty: R.railY - R.trainH * 0.5, t: 0, kind: ch.id === 'tang' ? 'coin' : 'bullet' });
    sfx(ch.id === 'tang' ? 'coins' : 'gun');
  } else {
    sfx('whiffBig');
    if (p.z < RIDE.zmin + 12) {   // 貼著車廂才打得到
      for (const w of R.windows) if (w.g && w.g.st !== 'dead') { const ww = windowWorld(w); if (Math.abs(ww.x - (p.x + 22)) < (strong ? 40 : 26)) { killGunner(w); if (!strong) break; } }
    } else pop(p.x + R.nearX, p.z - 80, '靠近車廂！', '#ffd040');
  }
}
function killGunner(w) {
  if (!w.g || w.g.st === 'dead') return;
  w.g.st = 'dead'; w.g.t = 0; R.kills++; G.score += 500; P.meter = Math.min(100, P.meter + 9);
  const ww = windowWorld(w); spark(ww.x, ww.y, true); sfx('hitBig');
  pop(ww.x + R.nearX, ww.y - 10, R.kills + '/' + RIDE.goal, '#ffffff');
  if (R.kills >= RIDE.goal && R.phase === 'fight') { R.phase = 'axe'; sfx('decide'); for (const v of R.windows) if (v.g && v.g.st !== 'dead') v.g.st = 'hide'; R.shots = []; R.obs = []; }
}
function rideSuper() {
  const p = P; p.meter = 0;
  G.cutin = { cid: p.cid, line: p.ch.line, name: p.ch.supn, t: 0 }; sfx('superStart');
  for (const w of R.windows) if (w.g && w.g.st !== 'dead') killGunner(w);
  for (let i = 0; i < 3; i++) { const w = pick(R.windows.filter(v => !v.g && windowWorld(v).x > 20 && windowWorld(v).x < W - 20)); if (w) { w.g = { st: 'rise', t: 0 }; killGunner(w); } }
}
function throwAxes() {
  const p = P; p.rst = 'atk'; p.rt = 24; sfx('throw');
  const target = Math.min(W - 20, R.trainX + R.trainW + 60);
  for (const d of [0, 14]) R.axes.push({ x0: p.x + 16, y0: p.z - 56, x1: target + d, y1: R.railY - 2, x: p.x, y: p.z - 56, t: -d / 2, rot: 0, stuck: false });
  R.thrown = true;
}

function riderFrame(p) {
  if (p.rst === 'hurt') return 'rhurt';
  if (p.rst === 'atk') return p.atkN & 1 ? 'ratk0' : 'ratk1';
  if (p.h > 0) return 'rjump';
  return 'ride' + ((R.t / 5 | 0) % 4);
}

// ---------- 繪製 ----------
function tileMirror(img, off, y) {   // 左右鏡像接起來，捲動不會有接縫
  if (!img) return;
  const w = img.width, o = ((off % (w * 2)) + w * 2) % (w * 2);
  for (let x = -o; x < W; x += w * 2) {
    ctx.drawImage(img, Math.round(x), y);
    ctx.save(); ctx.translate(Math.round(x + w * 2), y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); ctx.restore();
  }
}
function drawRide() {
  ctx.save();
  if (G.shake) ctx.translate(Math.round(rnd(-G.shake, G.shake) / 2), Math.round(rnd(-G.shake, G.shake) / 2));
  px(0, 0, W, H, '#7ab8e8');
  tileMirror(IMG.bg.r_far, R.farX, 0);
  // 火車（在鐵軌上）
  const ti = trainImg();
  if (ti) {
    const ty = R.railY - ti.height;
    ctx.save();
    if (R.flip) { ctx.translate(R.trainX + ti.width / 2, ty + ti.height / 2 + R.flip.y); ctx.rotate(R.flip.rot); ctx.translate(-ti.width / 2, -ti.height / 2); }
    else ctx.translate(Math.round(R.trainX), ty + ((R.t >> 2) & 1));
    ctx.drawImage(ti, 0, 0);
    // 車窗槍手：打開的窗口（黑底木框）裡露出上半身
    for (const w of R.windows) {
      const g = w.g; if (!g) continue;
      const k = g.st === 'rise' ? Math.min(1, g.t / 12) : g.st === 'hide' ? Math.max(0, 1 - g.t / 12) : g.st === 'dead' ? Math.max(0, 1 - g.t / 24) : 1;
      const wx = Math.round(w.x), wy = Math.round(w.y * ti.height), ww = 12, wh = 15;
      px(wx - ww / 2 - 1, wy - wh / 2 - 1, ww + 2, wh + 2, '#6a3a18'); px(wx - ww / 2, wy - wh / 2, ww, wh, '#120a06');
      ctx.save(); ctx.beginPath(); ctx.rect(wx - ww / 2, wy - wh / 2, ww, wh); ctx.clip();
      const fr = g.st === 'dead' ? 'fall' : g.st === 'fire' && g.t < 8 ? 'fire' : g.st === 'aim' ? (g.t > 30 && (G.t & 2) ? 'aim1' : 'aim0') : 'idle0';
      ctx.translate(wx - 1, wy + wh / 2 + 14 - k * 12); ctx.scale(0.4, 0.4); drawSpr('soldier', fr, 0, 0, 1, { flash: g.st === 'dead' && g.t < 6 }); ctx.restore();
      if (g.st === 'aim' && g.t > 30 && (G.t & 4)) px(wx + 7, wy - 3, 3, 3, '#ff3030');
      if (g.st === 'fire' && g.t < 6) px(wx + 8, wy - 4, 7, 6, '#fff3a0');
    }
    ctx.restore();
  }
  // 板斧
  for (const a of R.axes) { const ic = ICON.axe; if (!ic || a.t < 0) continue; ctx.save(); ctx.translate(Math.round(a.x), Math.round(a.y)); if (!a.stuck) ctx.rotate(a.rot); ctx.drawImage(ic, -ic.width / 2, -ic.height / 2); ctx.restore(); }
  // 近景鐵軌與路
  tileMirror(IMG.bg.r_near, R.nearX, NEAR_DY);
  // 石頭、倒木、玩家（依縱深）
  const list = R.obs.map(o => ({ z: o.z, d: () => { const ic = ICON[o.k]; shadow(o.x, o.z, 0, 22); if (ic) ctx.drawImage(ic, Math.round(o.x - ic.width / 2), Math.round(o.z - ic.height + 2)); } }));
  list.push({ z: P.z, d: () => {
    shadow(P.x, P.z, P.h, 54);
    if (P.inv > 0 && P.inv < 140 && (G.t & 2)) return;
    drawSpr(P.cid, riderFrame(P), P.x, P.z - P.h, 1, { flash: P.flash > 0 && (G.t & 1) });
  } });
  list.sort((a, b) => a.z - b.z); for (const o of list) o.d();
  // 陸軍的子彈（從車窗飛向地面）
  for (const s of R.shots) {
    const k = Math.min(1, s.t / s.T), x = lerp(s.x0, s.x1, k), y = lerp(s.y0, s.z1 - 30, k);
    if (s.t < s.T) { px(x - 1, y - 1, 3, 3, '#ff8040'); px(lerp(s.x0, s.x1, Math.max(0, k - 0.12)), lerp(s.y0, s.z1 - 30, Math.max(0, k - 0.12)), 2, 2, 'rgba(255,200,120,.6)'); }
    if (s.t > s.T - 14 && s.t < s.T && (G.t & 2)) { ctx.strokeStyle = '#ff4040'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(s.x1, s.z1, 9, 3, 0, 0, Math.PI * 2); ctx.stroke(); }
  }
  for (const b of projs) { if (b.kind === 'coin') ctx.drawImage(ICON.coin, Math.round(b.x - 4), Math.round(b.y - 4), 8, 8); else { px(b.x - 1, b.y - 3, 2, 6, '#fff3a0'); px(b.x, b.y + 3, 1, 6, 'rgba(255,240,160,.5)'); } }
  drawFx();
  ctx.restore();
  if (G.flash) { ctx.fillStyle = `rgba(255,255,255,${G.flash / 10})`; ctx.fillRect(0, 0, W, H); }
  drawHud();
  text('鐵血十八星陸軍', W - 4, 2, { c: '#ff8080', o: '#000', a: 'r' });
  text('擊倒 ' + Math.min(R.kills, RIDE.goal) + '／' + RIDE.goal, W - 4, 16, { c: '#ffffff', o: '#000', a: 'r' });
  if (R.phase === 'axe' && (G.t & 16)) { text('甩板斧！', W / 2, 70, { s: 2, c: '#fff', a: 'c', o: '#600', grad: ['#ffffff', '#ffb020'] }); text(isTouch ? '按「攻」把板斧甩進鐵軌' : '按 J（攻擊）把板斧甩進鐵軌', W / 2, 100, { c: '#ffd040', a: 'c', o: '#000' }); }
  if (R.t < 200 && R.phase === 'fight') text(isTouch ? '攻：開槍打車窗　跳：跳過石頭' : 'J 開槍打車窗　K 跳過石頭　↑↓ 換位置', W / 2, 40, { c: '#ffffff', a: 'c', o: '#000' });
  drawCutin();
}

SCENES.ridein = {
  enter() { setupRide(); Audio2.play('stage1'); },
  update() { if (G.st > 110 || (G.st > 20 && (Input.pressed.p || Input.pressed.start))) go('ride'); },
  draw() {
    drawRide(); ctx.fillStyle = `rgba(0,0,0,${Math.max(0, 1 - G.st / 40) * 0.8 + 0.2})`; ctx.fillRect(0, 0, W, H);
    text('序章　青石嶺', W / 2, 74, { s: 2, c: '#fff', a: 'c', o: '#300', grad: ['#ffffff', '#ffb020'] });
    text('劫火車', W / 2, 106, { c: '#e8d8b0', a: 'c', o: '#000' });
  },
};
SCENES.ride = {
  update() {
    if (G.paused) return pauseUpdate();
    if (Input.pressed.pause && !G.cutin && R.phase === 'fight') { G.paused = true; G.pauseSel = 0; G.showMoves = false; Audio2.sfx('pause'); return; }
    updateRide();
  },
  draw() { drawRide(); if (G.paused) pauseDraw(); },
};
