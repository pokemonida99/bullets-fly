// 小遊戲「打鐵門」（劇本第 162～166 場）：四個人對著黃家的鐵門打了一夜
// 移動準星開槍，在鐵門上打出驚嘆號「！」；打得越像分數越高
// 隱藏：張牧之當年把驚嘆號打成了問號——如果打出「？」，會開啟隱藏結局「贗品」
'use strict';
const GATE = { time: 25 * 60, cols: 12, rows: 8, x0: 72, y0: 34, cw: 20, ch: 19 };
const TPL = {   // 12×8 格的字形
  bang: ['.....##.....', '.....##.....', '.....##.....', '.....##.....', '.....##.....', '............', '.....##.....', '.....##.....'],
  ques: ['...######...', '..##....##..', '........##..', '......###...', '.....##.....', '............', '.....##.....', '.....##.....'],
};
let GT = null;
function gateCells(tpl) { const c = []; TPL[tpl].forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '#') c.push([x, y]); })); return c; }
function gateScore(tpl) {   // 打中字形的格子比例，扣掉打在外面的
  const cells = gateCells(tpl), set = new Set(cells.map(([x, y]) => x + ',' + y));
  let hit = 0, out = 0;
  for (const [k, n] of GT.grid) { if (n < 2) continue; if (set.has(k)) hit++; else out++; }
  return Math.max(0, hit / cells.length - out * 0.03);
}
function setupGate() {
  GT = { t: 0, left: GATE.time, x: W / 2, y: 110, holes: [], grid: new Map(), cd: 0, done: 0, shots: 0 };
}
function updateGate() {
  const I = Input.held, Pr = Input.pressed;
  if (GT.done) {
    GT.done++;
    if (GT.done > 60 && (Pr.p || Pr.start || GT.done > 300)) { G.score += GT.score; go('story6'); }
    return;
  }
  GT.t++; GT.left--;
  const sp = 2.6;
  GT.x = clamp(GT.x + ((I.right ? 1 : 0) - (I.left ? 1 : 0)) * sp, GATE.x0 - 10, GATE.x0 + GATE.cols * GATE.cw + 10);
  GT.y = clamp(GT.y + ((I.down ? 1 : 0) - (I.up ? 1 : 0)) * sp, GATE.y0 - 10, GATE.y0 + GATE.rows * GATE.ch + 10);
  if (GT.cd > 0) GT.cd--;
  if ((I.p || I.s1) && GT.cd <= 0) {   // 按住可以連射
    GT.cd = 5; GT.shots++;
    const hx = GT.x + rnd(-2, 2), hy = GT.y + rnd(-2, 2);
    GT.holes.push([hx, hy, rndi(0, 2)]);
    const cx = Math.floor((hx - GATE.x0) / GATE.cw), cy = Math.floor((hy - GATE.y0) / GATE.ch);
    if (cx >= 0 && cx < GATE.cols && cy >= 0 && cy < GATE.rows) { const k = cx + ',' + cy; GT.grid.set(k, (GT.grid.get(k) || 0) + 1); }
    sfx('gunFar'); if (GT.shots % 3 === 0) sfx('ricochet');
    spark(hx, hy, false, '#ffd040');
  }
  for (const q of parts) { q.t++; q.x += q.vx; q.y += q.vy; q.vy += q.g; }
  parts = parts.filter(q => q.t < q.life);
  if (GT.left <= 0 || Pr.s2) {   // 時間到（或按招式二提早收工）
    const b = gateScore('bang'), q = gateScore('ques');
    GT.result = q > b && q > 0.55 ? 'ques' : 'bang';
    GT.match = Math.max(b, q);
    GT.score = Math.round(GT.match * 10000);
    G.flags = G.flags || {};
    if (GT.result === 'ques') G.flags.question = true;
    GT.done = 1; sfx(GT.result === 'ques' ? 'superStart' : 'decide'); Audio2.play('clear');
  }
}
function drawGate() {
  if (IMG.bg.ironwall) ctx.drawImage(IMG.bg.ironwall, 0, 0); else px(0, 0, W, H, '#202024');
  // 淡淡的驚嘆號參考線
  if (!GT.done) { ctx.globalAlpha = 0.18 + 0.06 * Math.sin(G.t / 10); for (const [x, y] of gateCells('bang')) px(GATE.x0 + x * GATE.cw + 2, GATE.y0 + y * GATE.ch + 2, GATE.cw - 4, GATE.ch - 4, '#ffffff'); ctx.globalAlpha = 1; }
  for (const [x, y, k] of GT.holes) {   // 彈孔
    px(x - 2, y - 2, 4, 4, '#050505'); px(x - 1, y - 3, 2, 1, '#888'); if (k) px(x + 2, y - 1, 1, 2, '#9a9a9a');
  }
  drawFx();
  if (!GT.done) {   // 準星
    const x = Math.round(GT.x), y = Math.round(GT.y);
    ctx.strokeStyle = '#ff3030'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.stroke();
    px(x - 11, y, 7, 1, '#ff3030'); px(x + 5, y, 7, 1, '#ff3030'); px(x, y - 11, 1, 7, '#ff3030'); px(x, y + 5, 1, 7, '#ff3030');
  }
  px(0, 0, W, 22, 'rgba(0,0,0,.6)');
  text('打鐵門　在門上打出驚嘆號！', 6, 4, { c: '#ffd040', o: '#000' });
  text('TIME ' + Math.max(0, Math.ceil(GT.left / 60)), W - 6, 4, { c: GT.left < 300 && (G.t & 8) ? '#ff6060' : '#ffffff', o: '#000', a: 'r' });
  if (GT.t < 200 && !GT.done) text(isTouch ? '搖桿移動準星　按住「攻」連射　「招二」收工' : '方向鍵移動準星　按住 J 連射　I 提早收工', W / 2, H - 16, { c: '#ffffff', o: '#000', a: 'c' });
  if (GT.done) {
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 64, W, 92);
    const q = GT.result === 'ques';
    text(q ? '問號！' : '驚嘆號！', W / 2, 72, { s: 2, c: '#fff', a: 'c', o: '#300', grad: ['#ffffff', '#ffb020'] });
    text(q ? '「勾？再看！」　——門上打出了一個問號……' : '「這像驚嘆號嗎，那點呢？」', W / 2, 106, { c: '#ffd040', a: 'c', o: '#000' });
    text('相似度 ' + Math.round(GT.match * 100) + '%　　獎勵 ' + GT.score, W / 2, 128, { c: '#ffffff', a: 'c', o: '#000' });
  }
}
SCENES.gatein = {
  enter() { setupGate(); Audio2.play('stage1'); },
  update() { if (G.st > 120 || (G.st > 20 && (Input.pressed.p || Input.pressed.start))) go('gate'); },
  draw() {
    drawGate(); ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(0, 0, W, H);
    text('小遊戲　打鐵門', W / 2, 62, { s: 2, c: '#fff', a: 'c', o: '#300', grad: ['#ffffff', '#ffb020'] });
    text('在黃家的鐵門上打出一個驚嘆號「！」', W / 2, 98, { c: '#ffd040', a: 'c', o: '#000' });
    text('打得越像分數越高', W / 2, 116, { c: '#e8d8b0', a: 'c', o: '#000' });
  },
};
SCENES.gate = { update() { updateGate(); }, draw() { drawGate(); } };
