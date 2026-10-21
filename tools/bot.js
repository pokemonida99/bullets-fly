// 開發用：在瀏覽器 console 注入，自動玩一關（不會被遊戲載入）
// 用法：await runBot(角色索引, 最多幾幀) → 回傳結果
window.tap = (b, n = 2) => { Input.key[b] = true; step(n); Input.key[b] = false; step(1); };
window.botStep = () => {
  const K = Input.key; for (const k in K) K[k] = false;
  if (G.scene !== 'play') { if (G.st % 20 === 0) K.p = true; return; }
  if (G.talk) { if (G.t % 6 === 0) K.p = true; return; }
  if (!P || !freeSt(P.st) && P.st !== 'grab') return;
  const live = foes.filter(e => canHit(e) && e.st !== 'kneel');
  if (P.st === 'grab') { if (G.t % 8 === 0) K.p = true; return; }
  if (!live.length) { K.right = true; return; }
  const e = live.reduce((a, b) => Math.abs(a.x - P.x) + Math.abs(a.z - P.z) * 2 < Math.abs(b.x - P.x) + Math.abs(b.z - P.z) * 2 ? a : b);
  const dx = e.x - P.x, dz = e.z - P.z;
  if (P.meter >= 100 && live.length >= 2) { K.sup = true; return; }
  if (Math.abs(dz) > 3) K[dz > 0 ? 'down' : 'up'] = true;
  const want = 26;
  if (Math.abs(dx) > want + 6) K[dx > 0 ? 'right' : 'left'] = true;
  else if (Math.abs(dx) < 14) K[dx > 0 ? 'left' : 'right'] = true;
  else if (Math.abs(dz) <= 5) {
    P.face = Math.sign(dx) || 1;
    const r = Math.random();
    if (r < 0.04) K.s1 = true; else if (r < 0.06 && P.hp > 30) K.s2 = true; else if (G.t % 3 === 0) K.p = true;
  }
};
window.runBot = (ci = 0, maxF = 60 * 60 * 8) => {
  Audio2.stop(); G.chIdx = ci; G.score = 0; go('stagein'); step(110, false);
  let f = 0, minHp = 999, deaths = 0, lastLives = P.lives;
  const log = [];
  while (f < maxF && ['play', 'stagein', 'continue'].includes(G.scene)) {
    if (G.scene === 'continue') { deaths++; log.push('continue@' + f + ' wave' + G.wave); Input.key.p = true; tick(); Input.key.p = false; tick(); }
    botStep(); tick(); f++;
    if (P) { minHp = Math.min(minHp, P.hp); if (P.lives < lastLives) { log.push('lifeLost@' + f + ' wave' + G.wave); } lastLives = P.lives; }
    if (f % 600 === 0) log.push(`f${f} wave${G.wave} cam${Math.round(G.camX)} foes${foes.length} hp${P.hp}`);
  }
  for (const k in Input.key) Input.key[k] = false;
  render();
  return { ch: PLAYABLE[ci].id, scene: G.scene, frames: f, sec: Math.round(f / 60), wave: G.wave, score: G.score, lives: P.lives, hp: P.hp, conts: deaths, log };
};
'bot ready';
// 序章騎馬：對準有槍手的車窗開槍、看到石頭就跳、閃開陸軍子彈落點
window.rideBotStep = () => {
  const K = Input.key; for (const k in K) K[k] = false;
  if (G.scene !== 'ride') { if (G.st % 20 === 0) K.p = true; return; }
  if (R.phase === 'axe') { if (G.t % 10 === 0) K.p = true; return; }
  const p = P;
  const danger = R.shots.find(s => s.t > s.T - 18 && Math.abs(p.x - s.x1) < 18 && Math.abs(p.z - s.z1) < 12);
  if (danger) K[p.z > (RIDE.zmin + RIDE.zmax) / 2 ? 'up' : 'down'] = true;
  const ob = R.obs.find(o => o.x > p.x && o.x - p.x < 34 && Math.abs(o.z - p.z) < 10);
  if (ob && p.h === 0) K.k = true;
  const g = R.windows.find(w => w.g && w.g.st !== 'dead' && w.g.st !== 'hide');
  if (g) {
    const gx = windowWorld(g).x - 18;
    if (Math.abs(gx - p.x) > 6) K[gx > p.x ? 'right' : 'left'] = true;
    else if (G.t % 4 === 0) K.p = true;
    if (p.ch.id === 'liuzi' && p.z > RIDE.zmin + 6 && !danger) K.up = true;
  }
  if (p.meter >= 100) K.sup = true;
};
window.runRide = (ci = 0, maxF = 60 * 60 * 4) => {
  Audio2.stop(); G.chIdx = ci; G.score = 0; go('ridein'); step(115, false);
  let f = 0;
  while (f < maxF && ['ride', 'ridein', 'continue'].includes(G.scene)) {
    if (G.scene === 'continue') { Input.key.p = true; tick(); Input.key.p = false; tick(); }
    rideBotStep(); tick(); f++;
  }
  for (const k in Input.key) Input.key[k] = false;
  render();
  return { ch: PLAYABLE[ci].id, scene: G.scene, sec: Math.round(f / 60), kills: R.kills, lives: P.lives, hp: P.hp };
};
