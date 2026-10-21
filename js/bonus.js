// 小遊戲「散銀子」（劇本第 72～75 場）：夜裡沿街奔跑，把麻將面具做的麻袋銀子丟進窗戶
// 丟中越多分數越高；連續丟中倍率往上加（最多 ×5），丟歪或撞到東西就歸零
'use strict';
const BONUS = { time: 45 * 60, scroll: 2.4, px: 110 };
const BONUS_STAGE = { night: true, nightAll: true, sky: ['sky_night'], segs: 30 };
let B = null;
const CHEER = ['老天爺啊！', '老天爺啊！', '發財了！', '有銀子！'];

function setupBonus() {
  BONUS_STAGE.anchors = STAGE1.anchors.slice(0, 4).map(([k, x]) => [k, x]).concat([['f_huang', null]]);
  BONUS_STAGE.fillers = STAGE1.fillers;
  STAGE = BONUS_STAGE; stageLen = BONUS_STAGE.segs * W; facadeLayout = null;
  foes = []; projs = []; items = []; parts = []; pops = []; fx = []; props = [];
  G.camX = 0; G.talk = null; G.cutin = null; G.volley = [];
  const keep = P ? { lives: P.lives, meter: P.meter } : null;
  P = newPlayer(PLAYABLE[G.chIdx], keep); P.x = BONUS.px; P.z = 186;
  B = { t: 0, left: BONUS.time, wins: [], bags: [], obs: [], hits: 0, combo: 0, best: 0, score: 0, cd: 0, nextWin: 30, nextObs: 160, stumble: 0, done: 0 };
}
function updateBonus() {
  const I = Input.held, Pr = Input.pressed, p = P;
  if (B.done) { B.done++; if (B.done > 200 || (B.done > 40 && (Pr.p || Pr.start))) { G.score += B.score; go('story4'); } return; }
  B.t++; B.left--;
  G.camX += BONUS.scroll; p.x = G.camX + BONUS.px;
  if (B.cd > 0) B.cd--;
  if (B.stumble > 0) B.stumble--;
  const dz = (I.down ? 1 : 0) - (I.up ? 1 : 0);
  p.z = clamp(p.z + dz * 1.3, ZMIN + 4, ZMAX);
  if (p.h > 0 || p.vh > 0) { p.h += p.vh; p.vh -= 0.27; if (p.h <= 0) { p.h = 0; p.vh = 0; sfx('land'); } }
  if (Pr.k && p.h === 0 && !B.stumble) { p.vh = 4.8; sfx('jump'); }
  p.walkT++;
  // 丟銀子：↑ 丟高、↓ 丟低
  if ((Pr.p || Pr.s1) && B.cd <= 0 && !B.stumble) {
    B.cd = 14; p.throwT = 10;
    const vy = I.up ? -5.4 : I.down ? -3.4 : -4.4;
    B.bags.push({ x: p.x + 12, y: p.z - 56 - p.h, vx: BONUS.scroll + 2.8, vy, t: 0, hit: false });
    sfx('throw');
  }
  if (p.throwT > 0) p.throwT--;
  // 窗戶：從右邊出現，在建築立面上
  if (--B.nextWin <= 0) {
    B.nextWin = rndi(26, 52);
    B.wins.push({ x: G.camX + W + 20, y: rndi(52, 108), w: 16, h: 14, lit: 0 });
  }
  for (const b of B.bags) {
    if (b.hit) continue;
    b.t++; b.x += b.vx; b.y += b.vy; b.vy += 0.16;
    for (const w of B.wins) {
      if (w.lit || b.x < w.x - w.w / 2 || b.x > w.x + w.w / 2 || b.y < w.y - w.h / 2 || b.y > w.y + w.h / 2) continue;
      b.hit = true; w.lit = 1; B.hits++; B.combo = Math.min(5, B.combo + 1); B.best = Math.max(B.best, B.combo);
      const sc = 300 * B.combo; B.score += sc;
      sfx('break'); sfx('coin');
      pop(w.x, w.y - 10, pick(CHEER), '#ffd040'); pop(w.x, w.y + 2, '+' + sc, '#ffffff');
      break;
    }
    if (!b.hit && b.y > p.z + 4) { b.hit = true; b.miss = true; B.combo = 0; dust(b.x, clamp(b.y, ZMIN, ZMAX), 3); }
  }
  B.bags = B.bags.filter(b => !b.hit || b.t < 0);
  B.wins = B.wins.filter(w => w.x > G.camX - 30);
  // 擋路的木箱、酒罈：跳過去
  if (--B.nextObs <= 0) { B.nextObs = rndi(120, 220); B.obs.push({ k: Math.random() < 0.5 ? 'crate' : 'jar', x: G.camX + W + 20, z: rndi(ZMIN + 6, ZMAX - 2), hit: false }); }
  for (const o of B.obs) if (!o.hit && Math.abs(o.x - p.x) < 12 && Math.abs(o.z - p.z) < 8 && p.h < 10) { o.hit = true; B.stumble = 36; B.combo = 0; sfx('hurt'); burst(o.x - G.camX, o.z - 10, '#8a4a22', 10, 2); }
  B.obs = B.obs.filter(o => o.x > G.camX - 30 && !o.hit);
  for (const q of parts) { q.t++; q.x += q.vx; q.y += q.vy; q.vy += q.g; }
  parts = parts.filter(q => q.t < q.life);
  for (const q of pops) q.t++;
  pops = pops.filter(q => q.t < 70);
  if (B.left <= 0) { B.done = 1; sfx('decide'); Audio2.play('clear'); }
}
function drawBonus() {
  drawStageBg();
  // 夜色
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgb(105,118,180)'; ctx.fillRect(0, 0, W, H); ctx.restore();
  for (const w of B.wins) {
    const x = Math.round(w.x - G.camX - w.w / 2), y = Math.round(w.y - w.h / 2);
    px(x - 1, y - 1, w.w + 2, w.h + 2, '#3a2010');
    if (w.lit) { px(x, y, w.w, w.h, '#ffd060'); px(x + 2, y + 2, w.w - 4, w.h - 4, '#fff0b0'); ctx.fillStyle = 'rgba(255,210,100,.25)'; ctx.fillRect(x - 6, y - 6, w.w + 12, w.h + 12); }
    else { px(x, y, w.w, w.h, '#10141c'); px(x + w.w / 2 - 1, y, 1, w.h, '#3a2010'); if ((G.t + w.x) % 60 < 30) px(x + 3, y + 3, 2, 2, '#2a3a5a'); }
  }
  const list = B.obs.map(o => ({ z: o.z, d: () => { const ic = ICON[o.k]; shadow(o.x - G.camX, o.z, 0, 16); ctx.drawImage(ic, Math.round(o.x - G.camX - ic.width / 2), Math.round(o.z - ic.height)); } }));
  list.push({ z: P.z, d: () => {
    shadow(P.x - G.camX, P.z, P.h, 26);
    const fr = B.stumble ? 'hurt1' : P.throwT > 0 ? (P.throwT > 5 ? 'throw0' : 'throw1') : P.h > 0 ? (P.vh > 0 ? 'jump1' : 'jump3') : 'walk' + ((P.walkT / 4 | 0) % 6);
    drawSpr(P.cid, fr, P.x - G.camX, P.z - P.h, 1, {});
  } });
  list.sort((a, b) => a.z - b.z); for (const o of list) o.d();
  for (const b of B.bags) { const ic = ICON.pouch; ctx.drawImage(ic, Math.round(b.x - G.camX - ic.width / 2), Math.round(b.y - ic.height / 2)); }
  drawFx();
  // HUD
  px(0, 0, W, 31, 'rgba(0,0,0,.55)');
  const por = smallPor(P.cid, 28); if (por) { px(3, 1, 30, 30, '#d8b040'); ctx.drawImage(por, 4, 2); }
  text('散銀子', 37, 2, { c: '#ffd040', o: '#000' });
  text('丟中 ' + B.hits + ' 扇', 37, 17, { c: '#ffffff', o: '#000' });
  text('TIME ' + Math.max(0, Math.ceil(B.left / 60)), W / 2, 2, { c: B.left < 600 && (G.t & 8) ? '#ff6060' : '#ffffff', o: '#000', a: 'c' });
  text(String(B.score).padStart(6, '0'), W - 4, 2, { c: '#ffd040', o: '#000', a: 'r' });
  if (B.combo > 1) text('×' + B.combo, W - 4, 17, { c: '#ff8040', o: '#000', a: 'r', s: 1 });
  if (B.t < 220) text(isTouch ? '攻：丟銀子（搖桿↑丟高 ↓丟低）　跳：跳過木箱' : 'J 丟銀子（↑ 丟高　↓ 丟低）　K 跳過木箱', W / 2, 38, { c: '#ffffff', a: 'c', o: '#000' });
  if (B.done) {
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 50, W, 110);
    text('散銀子　結算', W / 2, 58, { s: 2, c: '#fff', a: 'c', o: '#300', grad: ['#ffffff', '#ffb020'] });
    text('丟進窗戶　' + B.hits + ' 扇', W / 2, 96, { c: '#ffffff', a: 'c', o: '#000' });
    text('最高連續　×' + B.best, W / 2, 112, { c: '#ffffff', a: 'c', o: '#000' });
    text('獎勵分數　' + B.score, W / 2, 130, { c: '#ffd040', a: 'c', o: '#000' });
  }
}
SCENES.bonusin = {
  enter() { setupBonus(); Audio2.play('stage1'); },
  update() { if (G.st > 120 || (G.st > 20 && (Input.pressed.p || Input.pressed.start))) go('bonus'); },
  draw() {
    drawBonus(); ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(0, 0, W, H);
    text('小遊戲　散銀子', W / 2, 60, { s: 2, c: '#fff', a: 'c', o: '#300', grad: ['#ffffff', '#ffb020'] });
    text('把麻袋銀子丟進窗戶！', W / 2, 96, { c: '#ffd040', a: 'c', o: '#000' });
    text('丟越多分數越高，連續丟中倍率往上加', W / 2, 114, { c: '#e8d8b0', a: 'c', o: '#000' });
    text(isTouch ? '攻：丟　搖桿↑丟高 ↓丟低　跳：跳過木箱' : 'J 丟　↑ 丟高　↓ 丟低　K 跳過木箱', W / 2, 140, { c: '#ffffff', a: 'c', o: '#000' });
  },
};
SCENES.bonus = { update() { if (G.paused) return pauseUpdate(); if (Input.pressed.pause && !B.done) { G.paused = true; G.pauseSel = 0; Audio2.sfx('pause'); return; } updateBonus(); }, draw() { drawBonus(); if (G.paused) pauseDraw(); } };
