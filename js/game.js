// 遊戲主程式：戰鬥、敵人、關卡流程
'use strict';

const G = {
  scene: 'boot', t: 0, st: 0, chIdx: 0, paused: false, pauseSel: 0, showMoves: false,
  hitstop: 0, shake: 0, flash: 0, camX: 0, lockL: 0, lockR: 0, wave: -1, waveT: 0, grp: 0, grpT: 0,
  score: 0, hi: Store.get('hi', 20000), talk: null, cutin: null, foe: null, foeT: 0, goT: 0, clear: false, cont: 0, freeze: 0,
};
let P = null, foes = [], projs = [], props = [], items = [], parts = [], pops = [], fx = [];
let STAGE = STAGE1, stageLen = STAGE1.segs.length * W;

function go(scene) { G.scene = scene; G.st = 0; SCENES[scene].enter && SCENES[scene].enter(); }
const sfx = n => Audio2.sfx(n);

// ---------- 粒子 ----------
function part(o) { parts.push(Object.assign({ vx: 0, vy: 0, g: 0, life: 30, t: 0, type: 'px', col: '#fff', s: 1 }, o)); }
function spark(x, y, big, col = '#fff7a0') { part({ x, y, life: big ? 10 : 7, type: 'spark', s: big ? 12 : 8, col }); }
function burst(x, y, col, n = 8, spd = 2) {
  for (let i = 0; i < n; i++) { const a = rnd(0, Math.PI * 2), v = rnd(0.5, spd); part({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, g: 0.12, life: rndi(16, 28), col }); }
}
function dust(x, z, n = 4) { for (let i = 0; i < n; i++) part({ x: x + rnd(-8, 8), y: z, vx: rnd(-0.8, 0.8), vy: rnd(-0.6, -0.1), life: rndi(14, 24), type: 'dust', col: '#c8b898' }); }
function pop(x, y, str, col = '#fff') { pops.push({ x, y, str, col, t: 0 }); }

// ---------- 共用：角色本體 ----------
// x：世界座標、z：腳底畫面 y（縱深）、h：離地高度
function newBody(o) {
  return Object.assign({ x: 0, z: 180, h: 0, vx: 0, vh: 0, face: 1, st: 'idle', t: 0, mv: null, mt: 0, hitSet: new Set(), inv: 0, flash: 0 }, o);
}
function moveFrame(b) {
  let t = b.mt;
  for (const [f, d] of b.mv.seq) { if (t < d) return f; t -= d; }
  return b.mv.seq[b.mv.seq.length - 1][0];
}
const moveLen = mv => mv.seq.reduce((a, s) => a + s[1], 0);
function boxWorld(b, box) {
  const [dx, top, w, hh] = box;
  return { x0: b.face > 0 ? b.x + dx : b.x - dx - w, x1: b.face > 0 ? b.x + dx + w : b.x - dx, top: b.h + top, bot: b.h + top - hh };
}
function overlapBody(bx, t, zr, az, tall = 64) {
  if (Math.abs(t.z - az) > zr) return false;
  if (t.x + 10 < bx.x0 || t.x - 10 > bx.x1) return false;
  return t.h < bx.top && t.h + tall > bx.bot;
}

// ---------- 玩家 ----------
function newPlayer(ch, keep) {
  const p = newBody({
    ch, cid: ch.id, x: G.camX + 60, z: 182, hp: ch.hp, maxhp: ch.hp, lives: 2, meter: 0, combo: 0, comboT: 0, buf: false, mvHit: false,
    lastTap: { d: 0, t: -99 }, run: 0, grab: null, grabT: 0, knees: 0, walkT: 0, idleT: 0, landT: 0,
  });
  if (keep) Object.assign(p, keep);
  return p;
}
const freeSt = st => st === 'idle' || st === 'walk' || st === 'run';
function startMove(p, name) {
  const mv = p.ch.moves[name];
  p.st = 'move'; p.mv = mv; p.mvName = name; p.mt = 0; p.hitSet = new Set(); p.mvHit = false; p.buf = false; p.costPaid = false;
  if (mv.hop) { p.vh = mv.hop; }
  if (mv.hits && !mv.ev) sfx(mv.sfx || 'whiff');
}
function updatePlayer(p) {
  const I = Input.held, Pr = Input.pressed;
  if (p.inv > 0) p.inv--;
  if (p.flash > 0) p.flash--;
  if (p.comboT > 0 && --p.comboT === 0) p.combo = 0;
  p.t++;
  const dx = (I.right ? 1 : 0) - (I.left ? 1 : 0), dz = (I.down ? 1 : 0) - (I.up ? 1 : 0);
  // 連按兩下方向＝跑
  for (const d of [-1, 1]) if (Pr[d < 0 ? 'left' : 'right']) {
    if (p.lastTap.d === d && Input.frame - p.lastTap.t < 16) p.run = d;
    p.lastTap = { d, t: Input.frame };
  }
  if (p.run && dx !== p.run) p.run = 0;

  switch (p.st) {
    case 'idle': case 'walk': case 'run': {
      if (Pr.sup && p.meter >= 100) { p.landT = 0; doSuper(p); break; }
      if (Pr.s1) { p.landT = 0; startMove(p, 's1'); break; }
      if (Pr.s2) { p.landT = 0; startMove(p, 's2'); break; }
      if (p.landT > 0) { p.landT--; break; }
      if (Pr.k) { p.st = 'jump'; p.vh = p.ch.jump; p.vx = dx * p.ch.spd * (p.run ? 1.7 : 1.05); p.mv = null; p.jz = dz * 0.5; sfx('jump'); break; }
      if (Pr.p) {
        if (p.run) { p.run = 0; startMove(p, 'dash'); break; }
        const n = p.comboT > 0 && p.mvHitLast ? Math.min(p.combo + 1, 3) : 0;
        p.combo = n; startMove(p, 'c' + n); break;
      }
      const sp = p.ch.spd * (p.run ? 1.8 : 1);
      if (dx || dz) {
        p.st = p.run ? 'run' : 'walk'; p.walkT++;
        p.x += dx * sp; p.z = clamp(p.z + dz * p.ch.spd * 0.62, ZMIN, ZMAX);
        if (dx) p.face = dx;
        if (p.run && p.walkT % 10 === 0) dust(p.x - p.face * 6, p.z, 2);
        tryGrab(p, dx);
      } else { p.st = 'idle'; p.walkT = 0; }
      break;
    }
    case 'jump': {
      p.h += p.vh; p.vh -= 0.27; p.x += p.vx; p.z = clamp(p.z + (p.jz || 0), ZMIN, ZMAX);
      if (Pr.p && !p.mv) { p.mv = p.ch.moves.jatk; p.mt = 0; p.hitSet = new Set(); sfx('whiff'); }
      if (p.mv) { doHits(p, p.mv, p.mt, true); p.mt++; }
      if (p.h <= 0) { p.h = 0; p.st = 'idle'; p.mv = null; p.landT = 5; dust(p.x, p.z, 4); sfx('land'); }
      break;
    }
    case 'move': {
      const mv = p.mv, L = moveLen(mv);
      if (mv.vx) for (const [a, b, v] of mv.vx) if (p.mt >= a && p.mt < b) p.x += v * p.face;
      if (mv.hop) { p.h = Math.max(0, p.h + p.vh); p.vh -= 0.3; }
      if (mv.ev && mv.ev[p.mt]) moveEvent(p, mv.ev[p.mt]);
      doHits(p, mv, p.mt, true);
      if (Pr.p && p.mvName[0] === 'c') p.buf = true;
      p.mt++;
      // 打中後可以提早接下一段
      const actEnd = mv.hits ? Math.max(...mv.hits.map(h => h.f[1])) : L;
      if ((p.mt >= L) || (p.buf && p.mvHit && p.mt > actEnd + 1 && p.mvName[0] === 'c' && p.mvName !== 'c3')) {
        const wasCombo = p.mvName[0] === 'c', hit = p.mvHit;
        p.mvHitLast = hit; p.mv = null; p.h = 0;
        if (wasCombo) { p.comboT = hit ? 26 : 0; if (p.mvName === 'c3') { p.combo = 0; p.comboT = 0; p.mvHitLast = false; } }
        p.st = 'idle';
        if (p.buf && wasCombo) {
          p.buf = false;
          const n = hit && p.mvName !== 'c3' ? p.combo + 1 : 0;
          p.combo = n; startMove(p, 'c' + n);
        }
      }
      break;
    }
    case 'grab': {
      const e = p.grab;
      if (!p.sub && (!e || e.st !== 'grabbed')) { p.grab = null; p.st = 'idle'; break; }
      if (e && e.st === 'grabbed') { e.x = p.x + p.face * 15; e.z = p.z + 0.5; e.face = -p.face; }
      p.grabT++;
      if (p.sub) {   // 膝撞或摔的動作中
        const mv = p.sub; doHits(p, mv, p.mt, true);
        if (mv.ev && mv.ev[p.mt] === 'release' && e && e.st === 'grabbed') throwFoe(p, e, mv);
        p.mt++;
        if (p.mt >= moveLen(mv)) { p.sub = null; p.mv = null; if (mv === p.ch.moves.throw) { p.st = 'idle'; p.grab = null; } else if (p.knees >= 3) startThrow(p, p.face); }
        break;
      }
      if (Pr.p) {
        if (dx === -p.face) startThrow(p, -p.face);
        else if (dx === p.face && p.grabT > 8) startThrow(p, p.face);
        else { p.sub = p.ch.moves.knee; p.mv = p.sub; p.mt = 0; p.hitSet = new Set(); p.knees++; sfx('whiff'); }
      } else if (Pr.k || p.grabT > 110) { releaseGrab(p); }
      break;
    }
    case 'hurt': if (--p.t2 <= 0) p.st = 'idle'; break;
    case 'fall': {
      p.x += p.vx; p.h += p.vh; p.vh -= 0.3;
      if (p.h <= 0) {
        p.h = 0;
        if (p.bounce) { p.bounce = false; p.vh = 1.6; p.vx *= 0.5; dust(p.x, p.z, 5); sfx('fall'); G.shake = 3; }
        else { p.st = 'down'; p.t2 = p.hp <= 0 ? 70 : 34; }
      }
      break;
    }
    case 'down': if (--p.t2 <= 0) { if (p.hp <= 0) playerDie(p); else { p.st = 'getup'; p.t2 = 12; } } break;
    case 'getup': if (--p.t2 <= 0) { p.st = 'idle'; p.inv = 50; } break;
    case 'super': break;   // 由 updateSuper 處理
    case 'win': break;
  }
  p.x = clamp(p.x, G.camX + 18, G.camX + W - 18);
}
function playerFrame(p) {
  switch (p.st) {
    case 'idle': return p.landT > 0 ? 'jump0' : ((G.t / 24 | 0) & 1 ? 'idle1' : 'idle0');
    case 'walk': return 'walk' + ((p.walkT / 6 | 0) % 6);
    case 'run': return 'walk' + ((p.walkT / 4 | 0) % 6);
    case 'jump': return p.mv ? moveFrame(p) : p.vh > 2 ? 'jump1' : p.vh > -2 ? 'jump2' : 'jump3';
    case 'move': case 'super': return p.mv ? moveFrame(p) : 'idle0';
    case 'grab': return p.sub ? moveFrame(p) : 'grab';
    case 'hurt': return p.t2 > 8 ? 'hurt0' : 'hurt1';
    case 'fall': return p.h > 2 ? 'fall' : 'down';
    case 'down': return 'down';
    case 'getup': return 'jump0';
    case 'win': return (G.t / 30 | 0) & 1 ? 'win1' : 'win0';
  }
  return 'idle0';
}

function tryGrab(p, dx) {
  if (!dx) return;
  const r = p.ch.grabR || 18;
  for (const e of foes) {
    if (e.type.heavy || e.h > 0 || !(e.st === 'idle' || e.st === 'walk' || e.st === 'hurt')) continue;
    if (Math.abs(e.z - p.z) < 6 && Math.sign(e.x - p.x) === dx && Math.abs(e.x - p.x) < r) {
      p.st = 'grab'; p.grab = e; p.grabT = 0; p.knees = 0; p.sub = null; p.mv = null;
      e.st = 'grabbed'; e.t2 = 0; e.mv = null; sfx('grab');
      return;
    }
  }
}
function startThrow(p, dir) {
  p.face = dir; p.sub = p.ch.moves.throw; p.mv = p.sub; p.mt = 0; p.hitSet = new Set(); sfx('throw');
}
function releaseGrab(p) {
  const e = p.grab; p.grab = null; p.st = 'idle'; p.sub = null;
  if (e && e.st === 'grabbed') { e.st = 'hurt'; e.t2 = 10; e.x += p.face * 8; }
}
function throwFoe(p, e, mv) {
  if (!e) return;
  e.st = 'thrown'; e.h = 18; e.vx = p.face * (mv.far ? 5.5 : 3.8); e.vh = mv.slam ? 2 : 3.2; e.face = -p.face; e.x = p.x + p.face * 10;
  e.tdmg = mv.tdmg * p.ch.pow; e.thrower = p; e.hitSet = new Set();
  if (mv.slam) { e.x = p.x - p.face * 2; e.vx = p.face * 1.2; e.vh = 4; }
  p.grab = null;
}

function hurtPlayer(p, dmg, kd, dir) {
  if (p.inv > 0 || p.st === 'fall' || p.st === 'down' || p.st === 'super' || p.st === 'getup' || G.clear) return false;
  if (p.st === 'move' && p.mv.inv && p.mt >= p.mv.inv[0] && p.mt <= p.mv.inv[1]) return false;
  if (p.grab) releaseGrab(p);
  p.hp = Math.max(0, p.hp - dmg); p.meter = Math.min(100, p.meter + dmg * 0.9); p.flash = 6;
  p.mv = null; p.run = 0; p.combo = 0;
  sfx(dmg >= 12 ? 'hitBig' : 'hit'); sfx('hurt'); G.shake = Math.max(G.shake, dmg >= 12 ? 5 : 3); G.hitstop = 4;
  buzz(dmg >= 12 ? 60 : 30);
  if (kd || p.hp <= 0 || dmg >= 12) { p.st = 'fall'; p.vh = 3.2; p.vx = dir * 2; p.h = Math.max(p.h, 1); p.bounce = true; }
  else { p.st = 'hurt'; p.t2 = 16; p.x += dir * 3; }
  return true;
}
function playerDie(p) {
  if (p.lives > 0) {
    p.lives--; p.hp = p.maxhp; p.st = 'idle'; p.inv = 150; p.meter = 50;
    // 復活時周圍的敵人被震開
    for (const e of foes) if (Math.abs(e.x - p.x) < 90 && canHit(e)) knock(e, Math.sign(e.x - p.x) || 1, 0, true);
    sfx('superStart'); G.flash = 8;
  } else { p.st = 'dead'; G.resume = 'play'; go('continue'); }
}

// ---------- 招式事件（飛道具、超必殺） ----------
function proj(o) { projs.push(Object.assign({ h: 30, vh: 0, g: 0, life: 120, t: 0, pierce: 1, zr: 8, hitSet: new Set(), from: 'p' }, o)); }
function moveEvent(p, ev) {
  const f = p.face;
  switch (ev) {
    case 'bullet': proj({ kind: 'bullet', x: p.x + f * 30, z: p.z, h: 44, vx: f * 7.5, dmg: 6 * p.ch.pow, pierce: 2 }); sfx('gun'); spark(p.x + f * 30 - G.camX, p.z - 44, false, '#ffd040'); break;
    case 'gun2': sfx('gun'); spark(p.x + 24 - G.camX, p.z - 42, false, '#ffd040'); spark(p.x - 24 - G.camX, p.z - 42, false, '#ffd040'); break;
    case 'knives': for (const dz of [-14, 0, 14]) proj({ kind: 'knife', x: p.x + f * 22, z: clamp(p.z + dz, ZMIN, ZMAX), h: 44, vx: f * 6.5, dmg: 7 * p.ch.pow, pierce: 1, life: 90 }); sfx('knife'); break;
    case 'coins3': [3.4, 4.4, 5.4].forEach((v, i) => proj({ kind: 'coin', x: p.x + f * 16, z: p.z + (i - 1) * 6, h: 40, vx: f * v, vh: 3.2, g: 0.22, dmg: 6 * p.ch.pow, pierce: 1, ground: true })); sfx('coins'); break;
    case 'slash': sfx('slash'); break;
    case 'whiff': sfx('whiff'); break;
    case 'whiffBig': sfx('whiffBig'); break;
    case 'land': sfx('land'); dust(p.x + f * 16, p.z, 4); G.shake = 3; break;
    case 'rifle': proj({ kind: 'bullet', x: p.x + f * 34, z: p.z, h: 46, vx: f * 9, dmg: 14 * p.ch.pow, pierce: 3, kd: true, big: false, life: 80, heavy: true }); sfx('gun'); G.shake = 3; spark(p.x + f * 34 - G.camX, p.z - 46, true, '#ffd040'); break;
    case 'volley': for (const dz of [-16, 0, 16]) proj({ kind: 'bullet', x: p.x + f * 34, z: clamp(p.z + dz, ZMIN, ZMAX), h: 46, vx: f * 9, dmg: 12, pierce: 9, kd: true, life: 80, heavy: true, zr: 10 }); sfx('gun'); G.shake = 5; G.flash = 2; break;
    case 'shots3': for (const dz of [-14, 0, 14]) proj({ kind: 'bullet', x: p.x + f * 24, z: clamp(p.z + dz, ZMIN, ZMAX), h: 44, vx: f * 7.5, dmg: 6 * p.ch.pow, pierce: 1, life: 90 }); sfx('gun'); break;
    case 'soundwave': proj({ kind: 'sound', x: p.x + f * 30, z: p.z, h: 50, vx: f * 3.2, dmg: 8, kd: true, pierce: 9, zr: 14, life: 34, big: true }); sfx('shoutS'); break;
    case 'shout': sfx('shoutS'); pop(p.x, p.z - 90, '鵝城的父老鄉親們——！', '#ffd040'); break;
    case 'leap': p.vh = 0; break;
    case 'bulletsUp': {   // 讓子彈飛一會兒：子彈射上天、停在空中
      sfx('gun'); sfx('freeze');
      for (const e of foes) if (canHit(e, true) && onScreen(e)) fx.push({ kind: 'hang', x: e.x + rnd(-6, 6), y: rnd(26, 50), target: e, t: 0, d: rndi(0, 20) });
      for (let i = 0; i < 10; i++) fx.push({ kind: 'hang', x: G.camX + rnd(20, W - 20), y: rnd(26, 60), t: 0, d: rndi(0, 30) });
      pop(p.x, p.z - 90, '讓子彈飛一會兒……', '#ffd040'); break;
    }
    case 'bulletRain': {
      sfx('gun'); sfx('gunFar'); G.shake = 6; G.flash = 4;
      for (const e of foes) if (canHit(e, true) && onScreen(e)) { hitFoe(e, 32, true, Math.sign(e.x - p.x) || 1, p, { launch: 3.6, all: true }); spark(e.x - G.camX, e.z - 40, true); }
      fx = fx.filter(f => f.kind !== 'hang');
      break;
    }
    case 'roarS': sfx('roar'); G.shake = 4; break;
    case 'quakeWave': sfx('wave'); G.shake = 10; proj({ kind: 'wave', x: p.x + f * 30, z: p.z, h: 0, vx: f * 4.5, dmg: 34, kd: true, pierce: 99, zr: 18, life: 100, big: true }); break;
    case 'stomp': {
      sfx('quake'); G.shake = 14; G.flash = 3;
      for (const e of foes) if (canHit(e, true) && onScreen(e) && e.h < 4) { hitFoe(e, 30, true, Math.sign(e.x - p.x) || 1, p, { launch: 4.2, all: true }); }
      for (let i = 0; i < 16; i++) dust(G.camX + rnd(0, W), rnd(ZMIN, ZMAX), 2);
      break;
    }
    case 'glint': sfx('knife'); break;
    case 'gunDash': {   // 閃身連射：一瞬間閃到每個敵人身邊開槍
      const list = foes.filter(e => canHit(e, true) && onScreen(e)).slice(0, 8);
      p.dashList = list; p.st = 'super'; p.superKind = 'sange'; p.mt = 0; p.home = { x: p.x, z: p.z };
      break;
    }
    case 'abacus': sfx('abacus'); break;
    case 'moneyRain': {
      sfx('coins'); sfx('coins');
      for (let i = 0; i < 36; i++) proj({ kind: 'coin', x: G.camX + rnd(10, W - 10), z: rnd(ZMIN, ZMAX), h: rnd(130, 260), vx: 0, vh: 0, g: 0.12, dmg: 4, pierce: 1, ground: true, zr: 10, rain: true });
      for (const e of foes) if (canHit(e, true) && onScreen(e) && !e.type.boss) { e.st = 'daze'; e.t2 = 170; e.mv = null; }
      for (const e of foes) if (e.type.boss && canHit(e, true)) { e.st = 'daze'; e.t2 = 70; e.mv = null; }
      break;
    }
  }
}
function doSuper(p) {
  p.meter = 0; p.run = 0;
  G.cutin = { cid: p.cid, line: p.ch.line, name: p.ch.supn, t: 0 };
  sfx('superStart');
  startMove(p, 'sup');
}
// 三哥超必殺的閃身連斬
function updateSuper(p) {
  if (p.superKind !== 'sange') return;
  const list = p.dashList, i = Math.floor(p.mt / 9), k = p.mt % 9;
  if (i >= list.length) { if (p.mt < list.length * 9 + 24) { p.mv = { seq: [[p.mt < list.length * 9 + 10 ? 'sp4' : 'sp5', 99]] }; p.x = p.home.x; p.z = p.home.z; p.mt++; return; } p.st = 'idle'; p.superKind = null; p.inv = 20; p.mv = null; return; }
  const e = list[i];
  if (k === 0) { p.x = e.x - 34 * (Math.random() < 0.5 ? 1 : -1); p.z = e.z; p.face = Math.sign(e.x - p.x) || 1; sfx('whiff'); for (let j = 0; j < 4; j++) part({ x: p.x - G.camX + rnd(-8, 8), y: p.z - rnd(10, 60), life: 10, col: '#c0c8ff' }); }
  if (k === 4 && canHit(e, true)) { sfx('gun'); hitFoe(e, 15, i === list.length - 1 || e.hp <= 15, p.face, p, { all: true, launch: 3 }); spark(e.x - G.camX, e.z - 40, true, '#ffd040'); }
  p.mv = { seq: [[k < 3 ? 'sp1' : k < 6 ? 'sp2' : 'sp3', 99]] };
  p.mt++;
}

// ---------- 打擊判定 ----------
function doHits(a, mv, t, isP) {
  if (!mv.hits) return;
  mv.hits.forEach((hb, hi) => {
    if (t < hb.f[0] || t > hb.f[1]) return;
    const bx = boxWorld(a, hb.box), zr = hb.zr || 9;
    if (isP) {
      for (const e of foes) {
        const key = hi + ':' + e.id + (hb.every ? ':' + Math.floor(t / hb.every) : '');
        if (a.hitSet.has(key) || !canHit(e)) continue;
        if (hb.grab ? e !== a.grab : e.st === 'grabbed') continue;
        if (!overlapBody(bx, e, zr, a.z, e.type.heavy ? 90 : 64)) continue;
        a.hitSet.add(key);
        const dir = a.face;
        hitFoe(e, hb.dmg * a.ch.pow, !!hb.kd, dir, a, hb);
        a.mvHit = true;
        if (a.mv && a.mv.cost && !a.costPaid) { a.costPaid = true; a.hp = Math.max(1, a.hp - a.mv.cost); }
        spark((bx.x0 + bx.x1) / 2 + dir * 6 - G.camX, e.z - e.h - (bx.top + bx.bot) / 2 + a.h + (e.z - a.z) * 0, hb.kd);
      }
      for (const pr of props) {
        const key = hi + ':prop' + pr.id;
        if (pr.dead || a.hitSet.has(key) || Math.abs(pr.z - a.z) > 12) continue;
        if (pr.x + 8 < bx.x0 || pr.x - 8 > bx.x1 || bx.bot > 22) continue;
        a.hitSet.add(key); hitProp(pr);
      }
    }
  });
}
const canHit = (e, any) => e.st !== 'dead' && e.st !== 'enter' && e.st !== 'flee' && (any ? e.st !== 'down' || true : !(e.st === 'fall' || e.st === 'down' || e.st === 'getup' || e.st === 'thrown')) && e.inv <= 0;
const onScreen = e => e.x > G.camX - 10 && e.x < G.camX + W + 10;

function hitFoe(e, dmg, kd, dir, a, hb = {}) {
  if (e.st === 'dead') return;
  if (e.type.boss && e.ai.armor && !hb.all && !kd) { e.hp -= dmg * 0.6; e.flash = 4; sfx('hit'); G.hitstop = 2; checkFoeDead(e, dir); return; }
  e.hp -= dmg; e.flash = 5;
  G.score += Math.round(dmg * 10); if (P) P.meter = Math.min(100, P.meter + dmg * 0.55);
  G.foe = e; G.foeT = 150;
  G.hitstop = kd ? 6 : 3;
  sfx(kd || dmg >= 10 ? 'hitBig' : 'hit');
  if (e.st === 'grabbed') { if (e.hp <= 0) { if (P.grab === e) P.grab = null; P.st = 'idle'; P.sub = null; knock(e, dir, 3); } return; }
  if (e.type.boss && !kd && e.hp > 0) {   // 頭目：普攻只讓牠縮一下
    e.poise = (e.poise || 0) + 1;
    if (e.poise < (e.type.heavy ? 5 : 3)) { checkFoeDead(e, dir); return; }
    e.poise = 0;
  }
  if (e.type.heavy && kd && e.hp > 0 && !hb.all) {   // 武舉人：被擊倒招打到只會踉蹌，大招才會倒
    e.st = 'hurt'; e.t2 = 22; e.mv = null; e.x += dir * 6; e.poise = 0; checkFoeDead(e, dir); return;
  }
  if (kd || e.hp <= 0) knock(e, dir, hb.launch);
  else { e.st = 'hurt'; e.t2 = 16; e.mv = null; e.x += dir * 2.5; }
  checkFoeDead(e, dir);
}
function checkFoeDead(e, dir) { if (e.hp <= 0 && e.st !== 'fall' && e.st !== 'dead' && e.st !== 'thrown') knock(e, dir, 3.4); }
function knock(e, dir, launch, soft) {
  e.st = 'fall'; e.mv = null; e.vx = dir * (soft ? 2.5 : 2.4); e.vh = launch || 3.2; e.h = Math.max(e.h, 1); e.bounce = true; e.face = -dir;
  if (e.kind === 'mask' && !e.unmasked && e.hp <= e.type.hp * 0.5) { e.unmasked = true; part({ x: e.x - G.camX, y: e.z - 58, vx: dir * 1.5, vy: -2.5, g: 0.15, life: 50, type: 'icon', icon: 'mask' }); }
}
function hitProp(pr) {
  pr.hp--; pr.shake = 8; sfx('hit');
  if (pr.hp <= 0) {
    pr.dead = true; sfx('break'); burst(pr.x - G.camX, pr.z - 10, pr.k === 'jar' ? '#8a4a22' : '#c08a48', 14, 2.6);
    const r = Math.random(), k = pr.k === 'jar' ? (r < 0.35 ? 'goose' : r < 0.75 ? 'jelly' : 'coin') : (r < 0.5 ? 'gold' : r < 0.8 ? 'coin' : 'jelly');
    items.push({ k, x: pr.x, z: pr.z, h: 10, vh: 2.4, t: 0 });
  }
}

// ---------- 敵人 ----------
let foeId = 0;
function spawnFoe(kind, side, z) {
  const type = FOES[kind], spr = type.base || kind;
  const x = side === 'R' ? G.camX + W + 24 : G.camX - 24;
  const e = newBody({ id: ++foeId, kind: spr, key: kind, type, x, z: z || rndi(ZMIN + 4, ZMAX - 4), hp: type.hp, face: side === 'R' ? -1 : 1, ai: { cd: rndi(30, 90), side: side === 'R' ? 1 : -1 }, st: 'walk', t2: 0 });
  if (type.boss) { e.st = 'enter'; e.tx = side === 'R' ? G.camX + W - 70 : G.camX + 70; e.ai.cd = 60; e.ai.step = 0; G.foe = e; G.foeT = 99999; }
  foes.push(e);
  return e;
}
function attackers() { return foes.filter(e => e.st === 'wind' || e.st === 'atk').length; }

function updateFoe(e) {
  if (e.flash > 0) e.flash--;
  if (e.inv > 0) e.inv--;
  e.t++;
  const p = P;
  switch (e.st) {
    case 'enter': {
      e.x += Math.sign(e.tx - e.x) * 1.2; e.walkT = (e.walkT || 0) + 1; e.face = Math.sign(p.x - e.x) || e.face;
      if (Math.abs(e.tx - e.x) < 2) e.st = 'idle';
      return;
    }
    case 'hurt': if (--e.t2 <= 0) { e.st = 'idle'; e.ai.cd = rndi(10, 30); } return;
    case 'daze': if (--e.t2 <= 0) { e.st = 'idle'; e.ai.cd = 20; } else if (e.t % 24 === 0) { e.x += rnd(-6, 6); } return;
    case 'grabbed': e.t2++; return;
    case 'fall': case 'thrown': {
      e.x += e.vx; e.h += e.vh; e.vh -= 0.28;
      if (e.st === 'thrown') {   // 被丟出去的人會撞倒別人
        for (const o of foes) if (o !== e && canHit(o) && !e.hitSet.has(o.id) && Math.abs(o.z - e.z) < 12 && Math.abs(o.x - e.x) < 18 && !o.type.heavy) {
          e.hitSet.add(o.id); hitFoe(o, 8, true, Math.sign(e.vx) || 1, P, {});
        }
      }
      if (e.h <= 0) {
        e.h = 0;
        if (e.st === 'thrown') { e.hp -= e.tdmg; G.score += Math.round(e.tdmg * 10); G.foe = e; G.foeT = 150; sfx('fall'); G.shake = 6; dust(e.x, e.z, 7); e.st = 'fall'; e.bounce = true; e.vh = 2; e.vx *= 0.4; break; }
        if (e.bounce) { e.bounce = false; e.vh = 1.8; e.vx *= 0.45; sfx('fall'); dust(e.x, e.z, 5); G.shake = Math.max(G.shake, 2); }
        else { e.st = 'down'; e.t2 = e.hp <= 0 ? 50 : (e.type.boss ? 40 : 46); }
      }
      return;
    }
    case 'down': {
      if (--e.t2 > 0) return;
      if (e.hp <= 0) return foeDie(e);
      e.st = 'getup'; e.t2 = 14; return;
    }
    case 'getup': if (--e.t2 <= 0) { e.st = 'idle'; e.inv = 24; e.ai.cd = rndi(16, 40); } return;
    case 'dead': return;
    case 'flee': { e.x += 2.6; e.face = 1; e.walkT = (e.walkT || 0) + 1; if (e.x > G.camX + W + 40) e.gone = true; return; }
    case 'kneel': return;
  }
  if (e.type.boss) return e.kind === 'wu' ? aiWu(e, p) : aiHuwan(e, p);
  aiGrunt(e, p);
}
function aiGrunt(e, p) {
  const T = e.type, dxp = p.x - e.x;
  if (e.st === 'wind') {
    if (--e.t2 <= 0) { e.st = 'atk'; e.t2 = T.act; e.hitDone = false; sfx('whiff'); if (e.lunge) e.lungeV = 4; }
    return;
  }
  if (e.st === 'atk') {
    if (e.lungeV) { e.x += e.face * e.lungeV; e.lungeV *= 0.88; }
    if (!e.hitDone) {
      const bx = boxWorld(e, T.box);
      if (overlapBody(bx, p, 9, e.z)) { e.hitDone = true; hurtPlayer(p, T.dmg, e.lunge, e.face); }
    }
    if (--e.t2 <= 0) { e.st = 'rec'; e.t2 = T.rec; e.lunge = false; e.lungeV = 0; }
    return;
  }
  if (e.st === 'rec') { if (--e.t2 <= 0) { e.st = 'idle'; e.ai.cd = rndi(30, 80); } return; }
  // 走位：繞到玩家左右兩側
  if (e.ai.cd > 0) e.ai.cd--;
  if (e.t % 90 === 0 && Math.random() < 0.3) e.ai.side = -e.ai.side;
  const busy = attackers() >= 2 && e.st !== 'wind';
  const want = busy || e.ai.cd > 0 ? T.reach + 26 + (e.id % 3) * 12 : T.reach - 6;
  const tx = p.x - e.ai.side * want, tz = busy ? clamp(p.z + ((e.id % 2) ? 16 : -16), ZMIN, ZMAX) : p.z;
  const ddx = tx - e.x, ddz = tz - e.z;
  let moved = false;
  if (Math.abs(ddx) > 3) { e.x += Math.sign(ddx) * Math.min(T.spd, Math.abs(ddx)); moved = true; }
  if (Math.abs(ddz) > 2) { e.z += Math.sign(ddz) * Math.min(T.spd * 0.6, Math.abs(ddz)); moved = true; }
  e.z = clamp(e.z, ZMIN, ZMAX);
  e.face = Math.sign(dxp) || e.face;
  e.st = moved ? 'walk' : 'idle'; if (moved) e.walkT = (e.walkT || 0) + 1;
  const canAtk = e.ai.cd <= 0 && attackers() < 2 && (p.st !== 'fall' && p.st !== 'down');
  if (canAtk && Math.abs(e.z - p.z) < 6 && Math.abs(dxp) < T.reach + 4 && Math.abs(dxp) > 8) { e.st = 'wind'; e.t2 = T.wind; }
  else if (canAtk && T.lunge && Math.abs(e.z - p.z) < 6 && Math.abs(dxp) > 60 && Math.abs(dxp) < 110 && Math.random() < 0.02) { e.st = 'wind'; e.t2 = 18; e.lunge = true; sfx('alert'); }
}
function foeFrame(e) {
  const k = e.kind, wt = e.walkT || 0;
  switch (e.st) {
    case 'idle': return (G.t / 28 | 0) & 1 ? 'idle1' : 'idle0';
    case 'walk': case 'enter': case 'flee': return 'walk' + ((wt / (k === 'wu' ? 8 : 6) | 0) % 6);
    case 'wind': return 'atk0';
    case 'atk': return 'atk1';
    case 'rec': return 'atk2';
    case 'hurt': return e.t2 > 8 ? 'hurt0' : 'hurt1';
    case 'grabbed': return 'hurt0';
    case 'daze': return (e.t >> 4) & 1 ? 'hurt1' : 'idle0';
    case 'fall': case 'thrown': return e.h > 2 ? 'fall' : (k === 'huwan' && e.hp <= 0 ? 'down2' : 'down');
    case 'down': case 'dead': return k === 'huwan' && e.hp <= 0 ? 'down2' : 'down';
    case 'getup': return k === 'guard' || k === 'mask' ? 'getup' : 'hurt1';
    case 'kneel': return 'kneel';
    case 'boss': {
      const f = e.frame;
      if (f === 'kick') return e.t2 > 12 ? 'kick0' : 'kick1';
      if (f === 'slap') return e.t2 > 11 ? 'slap0' : 'slap1';
      if (f === 'punch1') return e.t2 > 6 ? 'punch1' : 'punch2';
      if (f === 'charge1') return (e.t / 5 | 0) & 1 ? 'charge2' : 'charge1';
      return f;
    }
  }
  return 'idle0';
}
function foeDie(e) {
  if (e.type.boss) {
    if (e.kind === 'huwan') { e.st = 'flee'; e.hp = 0; G.score += e.type.score; startTalk('huwanDown'); return; }
    e.st = 'kneel'; e.hp = 0; G.score += e.type.score;
    for (const d of [-1, 1]) items.push({ k: 'goose', x: e.x + d * 22, z: clamp(e.z + d * 6, ZMIN, ZMAX), h: 30, vh: 3, t: 0 });   // 劇本：武舉人一手拎著兩隻燒鵝
    return;
  }
  e.st = 'dead'; e.t2 = 40; G.score += e.type.score;
  if (e.kind === 'mask' && Math.random() < 0.4) items.push({ k: 'pouch', x: e.x, z: e.z, h: 8, vh: 2, t: 0 });   // 劇本：銀子裝在麻將面具做的小麻袋裡
}

// ---------- 頭目：胡萬 ----------
function aiHuwan(e, p) {
  const A = e.ai, dxp = p.x - e.x, adx = Math.abs(dxp);
  if (e.st !== 'boss') e.face = Math.sign(dxp) || e.face;
  if (e.st === 'boss') {
    e.t2--;
    const m = e.mode;
    if (m === 'aim') { e.face = Math.sign(dxp) || e.face; if (Math.abs(p.z - e.z) > 2) e.z += Math.sign(p.z - e.z) * 0.6; if (e.t2 <= 0) { e.mode = 'fire'; e.frame = 'fire'; e.t2 = 22; sfx('gun'); proj({ kind: 'shot', from: 'e', x: e.x + e.face * 26, z: e.z, h: 48, vx: e.face * 4.6, dmg: 10, life: 120 }); } }
    else if (m === 'kick' || m === 'slap') {
      if (e.t2 === 10) { const bx = boxWorld(e, m === 'kick' ? [2, 44, 34, 26] : [4, 60, 30, 18]); if (overlapBody(bx, p, 9, e.z)) hurtPlayer(p, m === 'kick' ? 10 : 7, m === 'kick', e.face); sfx('whiff'); }
    } else if (m === 'hop') { e.x -= e.face * 3; e.h = Math.max(0, Math.sin((1 - e.t2 / 24) * Math.PI) * 24); }
    else if (m === 'beg') {
      if (adx < 40 && Math.abs(p.z - e.z) < 10 && e.t2 < 150) { e.mode = 'counter'; e.frame = 'dash'; e.t2 = 26; sfx('alert'); pop(e.x, e.z - 80, '騙你的！', '#ff6060'); }
    } else if (m === 'counter') {
      e.x += e.face * 3.6;
      const bx = boxWorld(e, [0, 50, 34, 40]); if (!e.hitDone && overlapBody(bx, p, 10, e.z)) { e.hitDone = true; hurtPlayer(p, 14, true, e.face); }
    }
    if (e.t2 <= 0) { e.st = 'idle'; e.h = 0; e.hitDone = false; A.cd = m === 'beg' || m === 'counter' ? 20 : rndi(30, 60); if (m === 'beg') { e.mode = 'laugh'; e.st = 'boss'; e.frame = 'laugh'; e.t2 = 40; pop(e.x, e.z - 80, '嘿嘿嘿……', '#c8ffc8'); } }
    return;
  }
  if (!A.begged && e.hp < e.type.hp * 0.35) { A.begged = true; e.st = 'boss'; e.mode = 'beg'; e.frame = 'beg'; e.t2 = 170; pop(e.x, e.z - 80, '饒命啊大爺！', '#ffffff'); return; }
  if (A.cd > 0) { A.cd--; }
  // 保持中距離，對齊後開槍；靠太近就踢或後跳
  const want = 110, tx = p.x - Math.sign(dxp || 1) * want;
  let moved = false;
  if (adx < 46 && A.cd <= 0 && Math.abs(p.z - e.z) < 8) {
    const r = Math.random();
    e.st = 'boss'; e.hitDone = false;
    if (r < 0.4) { e.mode = 'kick'; e.frame = 'kick'; e.t2 = 22; }
    else if (r < 0.65) { e.mode = 'slap'; e.frame = 'slap'; e.t2 = 20; }
    else { e.mode = 'hop'; e.frame = 'hop'; e.t2 = 24; sfx('jump'); }
    return;
  }
  if (Math.abs(tx - e.x) > 4) { e.x += Math.sign(tx - e.x) * e.type.spd; moved = true; }
  if (Math.abs(p.z - e.z) > 3) { e.z += Math.sign(p.z - e.z) * 0.7; moved = true; }
  e.x = clamp(e.x, G.camX + 16, G.camX + W - 16);
  e.st = moved ? 'walk' : 'idle'; if (moved) e.walkT = (e.walkT || 0) + 1;
  if (A.cd <= 0 && Math.abs(p.z - e.z) < 10 && adx > 60) {
    e.st = 'boss'; e.mode = 'aim'; e.frame = 'aim'; e.t2 = 34; sfx('alert');
    if (Math.random() < 0.3) { e.mode = 'bow'; e.frame = 'bow'; e.t2 = 30; pop(e.x, e.z - 80, '請——', '#ffffff'); }
  }
}

// ---------- 頭目：武舉人 ----------
function aiWu(e, p) {
  const A = e.ai, dxp = p.x - e.x, adx = Math.abs(dxp), rage = A.rage ? 0.72 : 1;
  A.armor = e.st === 'boss' && e.mode !== 'rec';
  if (e.st === 'boss') {
    e.t2--;
    const m = e.mode;
    if (m === 'punch') {
      if (e.t2 === Math.round(12 * rage)) { e.frame = 'punch1'; sfx('whiffBig'); }
      if (e.frame === 'punch1' && !e.hitDone) { const bx = boxWorld(e, [8, 76, 44, 34]); if (overlapBody(bx, p, 10, e.z)) { e.hitDone = true; hurtPlayer(p, 14, true, e.face); } }
    } else if (m === 'chargeW') {
      if (e.t % 6 === 0) dust(e.x - e.face * 14, e.z, 1);
      if (e.t2 <= 0) { e.mode = 'charge'; e.frame = 'charge1'; e.t2 = 80; sfx('charge'); e.hitDone = false; }
      return;
    } else if (m === 'charge') {
      e.x += e.face * (A.rage ? 6.4 : 5.4);
      if (e.t % 4 === 0) dust(e.x - e.face * 18, e.z, 2);
      const bx = boxWorld(e, [0, 80, 44, 80]); if (!e.hitDone && overlapBody(bx, p, 13, e.z)) { e.hitDone = true; hurtPlayer(p, 16, true, e.face); }
      for (const o of foes) if (o !== e && canHit(o) && Math.abs(o.z - e.z) < 12 && Math.abs(o.x - e.x) < 24) hitFoe(o, 10, true, e.face, P, {});
      if (e.x < G.camX + 28 || e.x > G.camX + W - 28) { e.x = clamp(e.x, G.camX + 28, G.camX + W - 28); G.shake = 8; sfx('fall'); e.mode = 'rec'; e.frame = 'idle1'; e.t2 = 40; }
    } else if (m === 'jumpU') {
      const k = 1 - e.t2 / 40; e.h = Math.sin(Math.min(1, k) * Math.PI / 2) * 90;
      e.x += (e.jx - e.x) * 0.06; e.z += (e.jz - e.z) * 0.06;
      if (e.t2 <= 0) { e.mode = 'drop'; e.frame = 'jump'; e.t2 = 99; }
      return;
    } else if (m === 'drop') {
      e.h -= 7;
      if (e.h <= 0) {
        e.h = 0; e.mode = 'slam'; e.frame = 'slam'; e.t2 = 30; sfx('quake'); G.shake = 12;
        fx.push({ kind: 'ring', x: e.x, z: e.z, t: 0 });
        if (Math.abs(p.x - e.x) < 64 && Math.abs(p.z - e.z) < 18 && p.h < 6) hurtPlayer(p, 13, true, Math.sign(p.x - e.x) || 1);
        for (let i = 0; i < 10; i++) dust(e.x + rnd(-40, 40), e.z + rnd(-6, 6), 1);
      }
      return;
    } else if (m === 'reach') {
      if (e.t2 <= 0) { e.mode = 'butt'; e.frame = 'butt'; e.t2 = 20; sfx('whiffBig'); e.hitDone = false; }
      return;
    } else if (m === 'butt') {
      if (e.t2 > 10) e.x += e.face * 3.2;
      const bx = boxWorld(e, [4, 86, 34, 40]); if (!e.hitDone && overlapBody(bx, p, 10, e.z)) { e.hitDone = true; hurtPlayer(p, 15, true, e.face); G.shake = 6; }
    } else if (m === 'roar') {
      if (e.t2 === 50) { sfx('roar'); G.shake = 10; G.flash = 3; if (Math.abs(p.x - e.x) < 80) hurtPlayer(p, 4, true, Math.sign(p.x - e.x) || 1); }
    }
    if (e.t2 <= 0) {
      if (m === 'punch' || m === 'slam' || m === 'butt') { e.mode = 'rec'; e.frame = m === 'punch' ? 'punch2' : 'idle1'; e.t2 = Math.round(26 * rage); return; }
      e.st = 'idle'; e.h = 0; A.cd = Math.round(rndi(30, 60) * rage);
    }
    return;
  }
  e.face = Math.sign(dxp) || e.face;
  if (!A.rage && e.hp < e.type.hp * 0.5) { A.rage = true; e.st = 'boss'; e.mode = 'roar'; e.frame = 'roar'; e.t2 = 70; pop(e.x, e.z - 110, '喝啊——！', '#ff6060'); return; }
  if (A.cd > 0) A.cd--;
  let moved = false;
  if (A.cd <= 0) {
    const r = Math.random();
    e.st = 'boss'; e.hitDone = false;
    if (adx < 54 && Math.abs(p.z - e.z) < 10 && r < 0.55) { e.mode = 'punch'; e.frame = 'punch0'; e.t2 = Math.round(32 * rage); return; }
    if (r < 0.35) { e.z += (p.z - e.z); e.mode = 'chargeW'; e.frame = 'charge0'; e.t2 = Math.round(36 * rage); sfx('alert'); pop(e.x, e.z - 110, '!', '#ff4040'); return; }
    if (r < 0.65) { e.mode = 'jumpU'; e.frame = 'jump'; e.t2 = 40; e.jx = p.x; e.jz = p.z; sfx('jump'); return; }
    if (adx < 110 && Math.abs(p.z - e.z) < 10) { e.mode = 'reach'; e.frame = 'reach'; e.t2 = Math.round(26 * rage); sfx('alert'); return; }
    e.st = 'idle'; A.cd = 20;
  }
  // 慢慢逼近
  const tx = p.x - Math.sign(dxp || 1) * 46;
  if (Math.abs(tx - e.x) > 4) { e.x += Math.sign(tx - e.x) * e.type.spd * (A.rage ? 1.3 : 1); moved = true; }
  if (Math.abs(p.z - e.z) > 3) { e.z += Math.sign(p.z - e.z) * 0.5; moved = true; }
  e.x = clamp(e.x, G.camX + 24, G.camX + W - 24);
  e.st = moved ? 'walk' : 'idle'; if (moved) e.walkT = (e.walkT || 0) + 1;
}

// ---------- 飛道具 ----------
function updateProj(pr) {
  pr.t++; pr.x += pr.vx; if (pr.vz) pr.z += pr.vz;
  if (pr.g) { pr.h += pr.vh; pr.vh -= pr.g; }
  if (pr.ground && pr.h <= 0) {
    pr.h = 0;
    if (pr.kind === 'stone') { pr.dead = true; sfx('quake'); G.shake = 8; fx.push({ kind: 'ring', x: pr.x, z: pr.z, t: 0 }); if (Math.abs(P.x - pr.x) < 30 && Math.abs(P.z - pr.z) < 12 && P.h < 6) hurtPlayer(P, 10, true, Math.sign(P.x - pr.x) || 1); dust(pr.x, pr.z, 8); return; }
    if (pr.kind === 'coin') { pr.dead = true; if (pr.rain && Math.random() < 0.12) items.push({ k: 'coin', x: pr.x, z: pr.z, h: 0, vh: 0, t: 0, small: true }); return; }
  }
  if (pr.kind === 'wave' && pr.t % 3 === 0) dust(pr.x, pr.z, 2);
  if (--pr.life <= 0 || pr.x < G.camX - 40 || pr.x > G.camX + W + 40) { pr.dead = true; return; }
  if (pr.from === 'p') {
    for (const e of foes) {
      if (pr.hitSet.has(e.id) || !canHit(e)) continue;
      if (Math.abs(e.z - pr.z) > pr.zr || Math.abs(e.x - pr.x) > (pr.big ? 22 : 12)) continue;
      if (!pr.big && (pr.h < e.h - 4 || pr.h > e.h + (e.type.heavy ? 96 : 70))) continue;
      pr.hitSet.add(e.id);
      hitFoe(e, pr.dmg, !!pr.kd, Math.sign(pr.vx) || (Math.random() < 0.5 ? 1 : -1), P, { all: pr.big });
      spark(pr.x - G.camX, pr.z - Math.max(pr.h, 30), pr.big);
      if (--pr.pierce <= 0) { pr.dead = true; return; }
    }
    for (const it of props) if (!it.dead && !pr.big && Math.abs(it.z - pr.z) < 10 && Math.abs(it.x - pr.x) < 10 && pr.h < 24) { hitProp(it); pr.dead = true; return; }
  } else {
    const p = P;
    if (Math.abs(p.z - pr.z) <= pr.zr && Math.abs(p.x - pr.x) < (pr.big ? 16 : 10) && pr.h > p.h - 4 && pr.h < p.h + 66) {
      if (hurtPlayer(p, pr.dmg, !!pr.kd, Math.sign(pr.vx) || 1)) { pr.dead = true; if (pr.kind === 'stone') { fx.push({ kind: 'ring', x: pr.x, z: pr.z, t: 0 }); sfx('quake'); } }
    }
  }
}

// ---------- 道具 ----------
const ITEM = { goose: { name: '燒鵝', heal: 45, score: 0 }, jelly: { name: '涼粉', heal: 18, score: 0 }, coin: { name: '銀元', score: 500 }, gold: { name: '金條', score: 2000 }, pouch: { name: '麻袋銀子', score: 1000 } };
function updateItems() {
  for (const it of items) {
    it.t++;
    if (it.h > 0 || it.vh > 0) { it.h += it.vh; it.vh -= 0.25; if (it.h <= 0) { it.h = 0; it.vh = 0; } }
    if (it.t > 20 && P && freeSt(P.st) && Math.abs(P.x - it.x) < 14 && Math.abs(P.z - it.z) < 9) {
      it.dead = true; const I = ITEM[it.k];
      if (I.heal) { P.hp = Math.min(P.maxhp, P.hp + I.heal); sfx('eat'); pop(it.x, it.z - 30, I.name + '　回復', '#80ff80'); }
      else { const sc = it.small ? 100 : I.score; G.score += sc; sfx('coin'); pop(it.x, it.z - 24, '+' + sc, '#ffd040'); }
    }
    if (it.t > 900) it.dead = true;
  }
  items = items.filter(i => !i.dead);
}

// ---------- 關卡流程 ----------
function setupStage() {
  STAGE = STAGE1; stageLen = STAGE.segs.length * W;
  foes = []; projs = []; items = []; parts = []; pops = []; fx = [];
  props = STAGE.props.map((p, i) => ({ id: i, k: p.k, x: p.x, z: p.z, hp: p.k === 'jar' ? 1 : 2, shake: 0 }));
  G.camX = 0; G.lockL = 0; G.lockR = 0; G.wave = -1; G.clear = false; G.bossTalked = false; G.drum = null; G.drumAt = 0; G.foe = null; G.foeT = 0; G.talk = null; G.cutin = null;
  P = newPlayer(PLAYABLE[G.chIdx]);
  P.x = 60;
  nextWave();
}
function nextWave() {
  G.wave++; G.grp = -1; G.grpT = 0;
  const w = STAGE.waves[G.wave];
  G.lockR = w ? w.lock : stageLen - W;
}
function startTalk(key) {
  const src = TALK[key], pn = src.find(l => !Array.isArray(l));
  const lines = src.filter(l => Array.isArray(l)).map(([who, s, nm]) => [who === 'P' ? P.cid : who, s, nm]);
  G.talk = { lines, i: 0, t: 0, key, panel: pn && pn.panel };
}
function updateWaves() {
  const w = STAGE.waves[G.wave];
  if (!w) {   // 全部打完
    if (!G.clear && !G.talk && !foes.some(e => e.st !== 'dead' && e.st !== 'kneel' && e.st !== 'flee')) { G.clear = true; G.clearT = 0; }
    return;
  }
  if (G.grp < 0) {
    if (G.camX < w.lock) return;
    G.camX = w.lock; G.lockL = w.lock; G.grp = 0; G.grpT = 0;
    if (w.talk) startTalk(w.talk);
    if (w.music) Audio2.play(w.music);
    if (w.boss || w.talk === 'huwan') sfx('gong');
    spawnGroup(w.groups[0]);
    return;
  }
  G.grpT++;
  const alive = foes.filter(e => e.st !== 'dead' && !e.gone && e.st !== 'kneel' && e.st !== 'flee');
  const ng = w.groups[G.grp + 1];
  if (ng) {
    const boss = foes.find(e => e.type.boss);
    const ready = ng.hpBelow ? boss && boss.hp < boss.type.hp * ng.hpBelow : (alive.length <= ng.left && G.grpT > (ng.delay || 30));
    if (ready) { G.grp++; G.grpT = 0; spawnGroup(ng); if (ng.drum) G.drumAt = G.t + ng.drum; }
    return;
  }
  if (alive.length === 0 && !G.talk) {
    if (w.boss) {
      const b = foes.find(e => e.kind === w.boss);
      if (b && b.st === 'kneel' && !G.bossTalked) { G.bossTalked = true; startTalk('wuDown'); return; }
    }
    nextWave(); G.goT = 150;
    if (G.wave < STAGE.waves.length) sfx('go');
  }
}
function spawnGroup(g) { for (const [k, side, z] of g.foes) spawnFoe(k, side, z); }
// 冤鼓：從左邊滾過整條街，撞到的人全倒（玩家、敵人都一樣）
function startDrum() { G.drum = { x: G.camX - 30, z: clamp(P.z, ZMIN + 6, ZMAX - 4), t: -70, rot: 0, hit: new Set() }; sfx('alert'); }
function updateDrum() {
  const d = G.drum; if (!d) return;
  d.t++;
  if (d.t < 0) { d.z += clamp(P.z - d.z, -0.4, 0.4); d.z = clamp(d.z, ZMIN + 6, ZMAX - 4); return; }
  if (d.t === 0) sfx('gong');
  d.x += 3.4; d.rot += 3.4 / 22;
  if (d.t % 6 === 0) { dust(d.x - 18, d.z, 2); G.shake = Math.max(G.shake, 1); }
  if (d.t % 18 === 0) sfx('land');
  if (!d.hit.has('P') && Math.abs(P.x - d.x) < 22 && Math.abs(P.z - d.z) < 12 && P.h < 30 && hurtPlayer(P, 9, true, 1)) d.hit.add('P');
  for (const e of foes) if (!d.hit.has(e.id) && canHit(e) && Math.abs(e.x - d.x) < 24 && Math.abs(e.z - d.z) < 12) { d.hit.add(e.id); hitFoe(e, e.type.boss ? 12 : 30, true, 1, P, { all: true, launch: 4 }); }
  if (d.x > G.camX + W + 40) G.drum = null;
}

function updatePlay() {
  if (G.talk) {
    const T = G.talk; T.t++;
    const len = T.lines[T.i][1].length;
    if (T.t % 3 === 0 && T.t / 2 < len) sfx('talk');
    if ((Input.pressed.p || Input.pressed.k || Input.pressed.start) && T.t > 8) {
      if (T.t / 2 < len) T.t = len * 2;
      else { T.i++; T.t = 0; if (T.i >= T.lines.length) G.talk = null; }
    }
    return;
  }
  if (G.cutin) { if (++G.cutin.t > 56) G.cutin = null; return; }
  if (G.hitstop > 0) { G.hitstop--; return; }
  if (G.shake > 0) G.shake--;
  if (G.flash > 0) G.flash--;
  if (P.st === 'super') updateSuper(P); else updatePlayer(P);
  for (const e of foes) updateFoe(e);
  foes = foes.filter(e => !(e.st === 'dead' && --e.t2 <= 0) && !e.gone);
  for (const pr of projs) updateProj(pr);
  projs = projs.filter(p => !p.dead);
  updateItems();
  for (const pr of props) if (pr.shake > 0) pr.shake--;
  for (const f of fx) f.t++;
  fx = fx.filter(f => f.kind === 'hang' ? f.t < 200 : f.t < 30);
  for (const q of parts) { q.t++; q.x += q.vx; q.y += q.vy; q.vy += q.g; }
  parts = parts.filter(q => q.t < q.life);
  for (const q of pops) q.t++;
  pops = pops.filter(q => q.t < 70);
  if (G.foeT > 0) G.foeT--;
  if (G.goT > 0) G.goT--;
  // 鏡頭：只往前，碰到下一波就停
  const target = clamp(P.x - W * 0.42, G.lockL, Math.min(G.lockR, stageLen - W));
  if (target > G.camX) G.camX = Math.min(target, G.camX + 2.4);
  G.lockL = Math.max(G.lockL, G.camX);
  updateWaves();
  if (G.drumAt && G.t >= G.drumAt) { G.drumAt = 0; startDrum(); }
  updateDrum();
  if (G.score > G.hi) G.hi = G.score;
  if (G.clear) {
    G.clearT++;
    if (G.clearT === 1) { Audio2.play('clear'); P.st = 'win'; P.mv = null; }
    if (G.clearT > 220) { Store.set('hi', G.hi); go('outro'); }
  }
}
