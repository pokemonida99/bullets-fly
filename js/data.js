// 角色、招式、敵人、關卡、台詞
'use strict';

// ---------- 版本與更新紀錄（改版時一起更新；標題畫面與桌墊都看得到） ----------
const VERSION = 'v0.3.1';
const CHANGELOG = [
  ['v0.3.1', '角色名稱改成劇本的稱呼：張牧之、老二、老三、老四、老五、六子、老七、老湯、夫人'],
  ['v0.3', '新第二關「夜襲縣衙」：胡萬帶戴九筒面具的假麻匪夜襲，屋頂有槍手掃射（看地上的紅圈），頭目胡萬',
    '新小遊戲「散銀子」：沿街把麻袋銀子丟進窗戶，丟越多分數越高',
    '劇情接到第 90 場：六子墓前、鴻門宴（三張牌、請帖、酒一口一口喝）、殺雞取卵、揭面具、綁票、花姐、四筒對四筒、翻譯翻譯什麼叫驚喜',
    '選六子的話六子活著；選其他角色就照劇本，六子在涼粉案死去',
    '老湯標成「高難度」：給想挑戰的玩家用'],
  ['v0.2', '新序章「青石嶺 劫火車」：騎白馬追馬拉火車，打倒車窗裡的鐵血十八星陸軍，甩板斧讓火車翻進河裡',
    '劇情過場改成劇本經典場面插圖：火車火鍋「大風起兮雲飛揚」、讓子彈飛一會兒、鬧鐘逼問、上任鵝城、冤鼓、涼粉、武舉人、公平公平還是公平、站著把錢掙了',
    '動作更順：每位角色動作格從 24 格增加到 56 格（走路 6 格、跳躍 4 段、每招都有預備與收招），敵人與頭目也加格',
    '鵝城街景改成分層：連續的天空（越走越接近黃昏）、一棟棟騎樓立面、連續的石板路，不再看到背景接縫'],
  ['v0.1', '試玩版：第一關「鵝城」——城門、騎樓街、涼粉攤、黃昏街道、黃府碉樓門前',
    '可選張牧之（張麻子）、老二、老三、六子、老湯；老四、老五、老七正式版登場',
    '中頭目胡萬、頭目武舉人；雜兵黃家護院、假麻匪',
    '連打、跳躍攻擊、跑步衝刺、抓人摔、兩種專屬招式、怒氣超必殺',
    '騎樓街的「冤鼓」會滾過整條街，撞到誰誰倒（劇本第 35～36 場）',
    '台詞照電影劇本原句；假麻匪戴九筒麻將面具；打倒武舉人掉兩隻燒鵝；假麻匪會掉「麻袋銀子」',
    '角色、背景、道具（冤鼓、酒罈、燒鵝、涼粉、銀元）全部用 GPT 畫',
    '配樂：《讓子彈飛》（標題、選角、過場、結局）、《策馬向前》（關卡）、《金戈鐵馬》（頭目戰）',
    '角色造型照電影劇照；鍵盤、手把、手機觸控'],
];

// 地面縱深：腳底的畫面 y 範圍
const ZMIN = 148, ZMAX = 208;

// ---------- 招式 ----------
// seq：[[動作格, 幀數], ...]；hits：{ f: [起, 迄], box: [前方距離, 頂端離地高, 寬, 高], dmg, kd 擊倒, zr 縱深容許, push 擊退, every 每幾幀重打一次 }
// vx：[[起, 迄, 速度], ...]；inv：[起, 迄] 無敵；ev：{ 幀: '事件名' }；air：空中招；cost：打中扣自己的血
const HB = (f, box, dmg, o = {}) => Object.assign({ f, box, dmg }, o);
const loop = (a, b, n, d = 4) => { const s = []; for (let i = 0; i < n; i++) s.push([a, d], [b, d]); return s; };

const CHARS = [
  { id: 'dage', name: '張牧之', full: '張麻子', title: '平衡型・雙槍', spd: 1.7, hp: 100, pow: 1, jump: 5.4, stat: [3, 3, 3],
    line: '讓子彈飛一會兒。', pick: '公平，公平，還是公平！',
    s1n: '雙槍連射', s2n: '旋身雙槍', supn: '讓子彈飛一會兒',
    moves: {
      c0: { seq: [['c0a', 3], ['c0b', 6], ['c0a', 3]], hits: [HB([3, 7], [4, 54, 28, 14], 5)], vx: [[0, 4, 0.8]] },
      c1: { seq: [['c1a', 3], ['c1b', 6], ['c1a', 4]], hits: [HB([3, 7], [4, 56, 32, 18], 6)], vx: [[0, 4, 0.8]] },
      c2: { seq: [['c2a', 4], ['c2b', 7], ['c2a', 4]], hits: [HB([4, 9], [4, 52, 34, 22], 7)] },
      c3: { seq: [['c3a', 6], ['c3b', 8], ['c3c', 10]], hits: [HB([6, 12], [2, 56, 32, 24], 10, { kd: 1 })], vx: [[0, 8, 1]] },
      dash: { seq: [['dash0', 6], ['dash1', 14], ['dash0', 4]], hits: [HB([4, 18], [4, 52, 34, 26], 9, { kd: 1 })], vx: [[0, 18, 3.2]] },
      jatk: { seq: [['jatk0', 6], ['jatk1', 34]], hits: [HB([5, 34], [0, 42, 32, 28], 8, { kd: 1 })], air: true },
      knee: { seq: [['c0a', 4], ['c0b', 8]], hits: [HB([4, 8], [4, 56, 26, 20], 4, { grab: 1 })] },
      throw: { seq: [['throw0', 8], ['throw1', 16]], ev: { 8: 'release' }, tdmg: 12 },
      s1: { seq: [['s1a', 4], ['s1b', 6], ['s1c', 6], ['s1d', 4], ['s1c', 6], ['s1d', 6], ['s1b', 4]], ev: { 10: 'bullet', 22: 'bullet' } },
      s2: { seq: [['s2a', 4]].concat(loop('s2b', 's2c', 3), [['s2d', 6]]), inv: [0, 26], hits: [HB([4, 28], [-32, 60, 64, 60], 8, { kd: 1, zr: 14 })], cost: 4, ev: { 4: 'gun2', 16: 'gun2' } },
      sup: { seq: [['sp0', 6], ['sp1', 12], ['sp2', 10], ['sp3', 8], ['sp4', 62], ['sp5', 20]], inv: [0, 118], ev: { 0: 'leap', 28: 'bulletsUp', 94: 'bulletRain' } },
    } },
  { id: 'erge', name: '老二', full: '老二', title: '力量型・步槍', spd: 1.4, hp: 120, pow: 1, jump: 5.0, stat: [2, 5, 4],
    line: '這一槍，不會落空。', pick: '跟著大哥，有肉吃！',
    s1n: '步槍狙擊', s2n: '槍托旋風', supn: '連環快槍',
    moves: {
      c0: { seq: [['c0a', 3], ['c0b', 6], ['c0a', 3]], hits: [HB([3, 7], [2, 56, 38, 18], 7)] },
      c1: { seq: [['c1a', 3], ['c1b', 6], ['c1a', 4]], hits: [HB([3, 7], [2, 58, 40, 22], 8)] },
      c2: { seq: [['c2a', 4], ['c2b', 7], ['c2a', 4]], hits: [HB([4, 9], [2, 56, 34, 26], 9)] },
      c3: { seq: [['c3a', 6], ['c3b', 8], ['c3c', 10]], hits: [HB([6, 12], [4, 70, 40, 60], 14, { kd: 1 })] },
      dash: { seq: [['dash0', 6], ['dash1', 14], ['dash0', 4]], hits: [HB([4, 18], [2, 58, 40, 30], 11, { kd: 1 })], vx: [[0, 18, 3]] },
      jatk: { seq: [['jatk0', 6], ['jatk1', 34]], hits: [HB([5, 34], [0, 44, 34, 30], 11, { kd: 1 })], air: true },
      knee: { seq: [['c0a', 4], ['c0b', 8]], hits: [HB([4, 8], [4, 56, 26, 20], 5, { grab: 1 })] },
      throw: { seq: [['throw0', 8], ['throw1', 16]], ev: { 8: 'release' }, tdmg: 15 },
      s1: { seq: [['s1a', 6], ['s1b', 8], ['s1c', 8], ['s1d', 12]], ev: { 14: 'rifle' } },
      s2: { seq: [['s2a', 4]].concat(loop('s2b', 's2c', 3), [['s2d', 10]]), inv: [0, 26], hits: [HB([4, 28], [-40, 64, 80, 64], 10, { kd: 1, zr: 16 })], cost: 5, ev: { 4: 'whiffBig', 16: 'whiffBig', 28: 'land' } },
      sup: { seq: [['sp0', 30], ['sp1', 6], ['sp2', 8], ['sp3', 8], ['sp4', 8], ['sp3', 8], ['sp4', 8], ['sp5', 14]], inv: [0, 90], ev: { 0: 'roarS', 36: 'volley', 52: 'volley', 68: 'volley' } },
    } },
  { id: 'sange', name: '老三', full: '老三', title: '速度型・快槍', spd: 2.15, hp: 100, pow: 1, jump: 5.8, stat: [5, 2, 3],
    line: '眨眼就到。', pick: '慢的人，先倒下。',
    s1n: '快槍三發', s2n: '側翻踢', supn: '閃身連射',
    moves: {
      c0: { seq: [['c0a', 3], ['c0b', 6], ['c0a', 3]], hits: [HB([3, 7], [4, 54, 26, 14], 4)] },
      c1: { seq: [['c1a', 3], ['c1b', 6], ['c1a', 4]], hits: [HB([3, 7], [4, 54, 28, 16], 4)] },
      c2: { seq: [['c2a', 4], ['c2b', 7], ['c2a', 4]], hits: [HB([4, 9], [0, 58, 34, 26], 6)] },
      c3: { seq: [['c3a', 6], ['c3b', 8], ['c3c', 10]], hits: [HB([6, 12], [4, 48, 26, 24], 8, { kd: 1 })], vx: [[0, 8, 1.4]] },
      dash: { seq: [['dash0', 6], ['dash1', 14], ['dash0', 4]], hits: [HB([4, 18], [0, 30, 36, 24], 8, { kd: 1 })], vx: [[0, 18, 4]] },
      jatk: { seq: [['jatk0', 6], ['jatk1', 34]], hits: [HB([5, 34], [0, 38, 34, 28], 8, { kd: 1 })], air: true },
      knee: { seq: [['c0a', 4], ['c0b', 8]], hits: [HB([4, 8], [4, 56, 26, 20], 4, { grab: 1 })] },
      throw: { seq: [['throw0', 8], ['throw1', 16]], ev: { 8: 'release' }, tdmg: 11 },
      s1: { seq: [['s1a', 3], ['s1b', 5], ['s1c', 5], ['s1d', 8]], ev: { 3: 'shots3' } },
      s2: { seq: [['s2a', 5], ['s2b', 7], ['s2c', 7], ['s2d', 9]], inv: [0, 20], vx: [[0, 20, 1.6]], hop: 4.6, hits: [HB([0, 26], [-10, 74, 44, 74], 9, { kd: 1, zr: 12 })], cost: 3 },
      sup: { seq: [['sp0', 30]], inv: [0, 30], ev: { 0: 'glint', 29: 'gunDash' } },
    } },
  { id: 'siger', name: '老四', locked: true, title: '穩健型・步槍' },
  { id: 'wuge', name: '老五', locked: true, title: '中距離・繩鏢' },
  { id: 'liuzi', name: '六子', full: '小六子', title: '投技型・蠻力', spd: 1.6, hp: 110, pow: 1, jump: 5.2, stat: [3, 4, 4], grabR: 22,
    line: '我吃得多，力氣也大！', pick: '爹，看我的！',
    s1n: '蠻牛頭槌', s2n: '旋風臂', supn: '大地震腳',
    moves: {
      c0: { seq: [['c0a', 3], ['c0b', 6], ['c0a', 3]], hits: [HB([3, 7], [4, 54, 26, 14], 5)] },
      c1: { seq: [['c1a', 3], ['c1b', 6], ['c1a', 4]], hits: [HB([3, 7], [4, 54, 28, 18], 6)] },
      c2: { seq: [['c2a', 4], ['c2b', 7], ['c2a', 4]], hits: [HB([4, 9], [4, 62, 30, 32], 8)] },
      c3: { seq: [['c3a', 6], ['c3b', 8], ['c3c', 10]], hits: [HB([6, 12], [2, 58, 32, 42], 11, { kd: 1 })], vx: [[4, 14, 2.6]] },
      dash: { seq: [['dash0', 6], ['dash1', 14], ['dash0', 4]], hits: [HB([4, 18], [2, 58, 32, 42], 11, { kd: 1 })], vx: [[0, 18, 3.6]] },
      jatk: { seq: [['jatk0', 6], ['jatk1', 34]], hits: [HB([5, 34], [-8, 44, 44, 34], 10, { kd: 1, zr: 12 })], air: true },
      knee: { seq: [['c0a', 4], ['c0b', 8]], hits: [HB([4, 8], [4, 56, 26, 20], 5, { grab: 1 })] },
      throw: { seq: [['throw0', 8], ['throw1', 16]], ev: { 8: 'release' }, tdmg: 20, slam: 1 },
      s1: { seq: [['s1a', 12], ['s1b', 8], ['s1c', 10], ['s1d', 10]], vx: [[12, 30, 5]], hits: [HB([12, 32], [0, 56, 32, 42], 13, { kd: 1 })] },
      s2: { seq: [['s2a', 4]].concat(loop('s2b', 's2c', 3), [['s2d', 10]]), inv: [0, 26], hits: [HB([4, 28], [-36, 60, 72, 56], 9, { kd: 1, zr: 14 })], cost: 4 },
      sup: { seq: [['sp0', 32], ['sp1', 8], ['sp2', 8], ['sp3', 30], ['sp4', 12], ['sp5', 8]], inv: [0, 98], ev: { 0: 'roarS', 44: 'stomp' } },
    } },
  { id: 'qidi', name: '老七', locked: true, title: '小個子・彈弓' },
  { id: 'tang', name: '老湯', full: '老湯（馬邦德）', title: '高難度・大聲公', spd: 1.4, hp: 100, pow: 0.85, jump: 5.0, stat: [2, 1, 2],
    line: '鵝城的父老鄉親們——！', pick: '在下湯師爺。',
    s1n: '撒銀元', s2n: '大聲公', supn: '天降橫財',
    moves: {
      c0: { seq: [['c0a', 3], ['c0b', 6], ['c0a', 3]], hits: [HB([3, 7], [4, 50, 32, 14], 4)] },
      c1: { seq: [['c1a', 3], ['c1b', 6], ['c1a', 4]], hits: [HB([3, 7], [4, 52, 30, 18], 5)] },
      c2: { seq: [['c2a', 4], ['c2b', 7], ['c2a', 4]], hits: [HB([4, 9], [2, 40, 30, 28], 5)] },
      c3: { seq: [['c3a', 6], ['c3b', 8], ['c3c', 10]], hits: [HB([6, 12], [4, 66, 28, 40], 7, { kd: 1 })] },
      dash: { seq: [['dash0', 6], ['dash1', 14], ['dash0', 4]], hits: [HB([4, 18], [4, 40, 28, 30], 7, { kd: 1 })], vx: [[0, 18, 2.8]] },
      jatk: { seq: [['jatk0', 6], ['jatk1', 34]], hits: [HB([5, 34], [0, 46, 32, 32], 7, { kd: 1 })], air: true },
      knee: { seq: [['c0a', 4], ['c0b', 8]], hits: [HB([4, 8], [4, 56, 26, 20], 3, { grab: 1 })] },
      throw: { seq: [['throw0', 8], ['throw1', 16]], ev: { 8: 'release' }, tdmg: 8, far: 1 },
      s1: { seq: [['s1a', 6], ['s1b', 6], ['s1c', 6], ['s1d', 10]], ev: { 12: 'coins3' } },
      s2: { seq: [['s1a', 2], ['s2a', 12], ['s2b', 6], ['s2c', 6], ['s2d', 14]], inv: [0, 14], cost: 3, ev: { 22: 'soundwave' } },
      sup: { seq: [['sp0', 16], ['sp1', 24], ['sp2', 10], ['sp3', 30], ['sp4', 20], ['sp5', 10]], inv: [0, 110], ev: { 0: 'shout', 50: 'moneyRain' } },
    } },
];
const PLAYABLE = CHARS.filter(c => !c.locked);
const charById = id => CHARS.find(c => c.id === id);

// ---------- 敵人 ----------
const FOES = {
  guard: { name: '黃家護院', hp: 26, spd: 0.9, dmg: 6, wind: 16, act: 8, rec: 20, reach: 34, box: [4, 56, 36, 22], score: 300, frames: { atk0: 'atk0', atk1: 'atk1' } },
  guardB: { base: 'guard', name: '護院頭', hp: 42, spd: 0.85, dmg: 7, wind: 16, act: 8, rec: 18, reach: 34, box: [4, 56, 36, 22], score: 500, tint: '#2050ff' },
  guardR: { base: 'guard', name: '狠護院', hp: 30, spd: 1.15, dmg: 7, wind: 10, act: 8, rec: 16, reach: 34, box: [4, 56, 36, 22], score: 500, tint: '#ff2020' },
  mask: { name: '假麻匪', hp: 34, spd: 1.2, dmg: 8, wind: 12, act: 8, rec: 18, reach: 30, box: [4, 60, 32, 30], score: 500, lunge: true },
  maskB: { base: 'mask', name: '假麻匪頭', hp: 48, spd: 1.1, dmg: 9, wind: 12, act: 8, rec: 16, reach: 30, box: [4, 60, 32, 30], score: 700, lunge: true, tint: '#2050ff' },
  maskR: { base: 'mask', name: '狠麻匪', hp: 36, spd: 1.45, dmg: 9, wind: 9, act: 8, rec: 14, reach: 30, box: [4, 60, 32, 30], score: 700, lunge: true, tint: '#ff2020' },
  maskr: { name: '假麻匪 槍手', hp: 30, spd: 1.0, dmg: 8, wind: 14, act: 8, rec: 18, reach: 30, box: [4, 58, 30, 22], score: 600, rifle: true },
  huwan: { name: '黃府管家 胡萬', hp: 150, spd: 1.2, dmg: 9, boss: true, score: 3000 },
  huwan2: { base: 'huwan', name: '假麻匪頭目 胡萬', hp: 230, spd: 1.35, dmg: 10, boss: true, score: 6000, fast: true },
  wu: { name: '團練教頭 武舉人', hp: 320, spd: 1.0, dmg: 14, boss: true, score: 8000, heavy: true },
};

// ---------- 關卡 ----------
// waves：鏡頭走到 lock 就鎖住，groups 依序出場（上一批剩 left 隻以下才出下一批）
// side：R 右邊進場／L 左邊進場；z 可省略（隨機）
const STAGE1 = {
  name: '第一關　鵝城', segs: ['bg1', 'bg2', 'bg3', 'bg4', 'bg5'],
  props: [
    { k: 'jar', x: 300, z: 160 }, { k: 'crate', x: 560, z: 196 }, { k: 'jar', x: 690, z: 158 },
    { k: 'jar', x: 940, z: 200 }, { k: 'crate', x: 1270, z: 168 }, { k: 'jar', x: 1420, z: 198 }, { k: 'jar', x: 1600, z: 156 },
  ],
  waves: [
    { lock: 0, talk: 'start', groups: [{ left: 9, foes: [['guard', 'R'], ['guard', 'R']] }, { left: 1, foes: [['guardB', 'L'], ['guard', 'R']] }] },
    { lock: 384, talk: 'drum', groups: [{ left: 9, foes: [['guard', 'R'], ['mask', 'R']] }, { left: 1, drum: 150, foes: [['guard', 'L'], ['guardR', 'R'], ['mask', 'R']] }] },
    { lock: 768, talk: 'huwan', music: 'boss', groups: [{ left: 9, foes: [['huwan', 'R', 180]] }, { left: 1, delay: 300, foes: [['guard', 'L'], ['guard', 'R']] }] },
    { lock: 1152, music: 'stage1', groups: [{ left: 9, foes: [['mask', 'R'], ['mask', 'L']] }, { left: 1, foes: [['guardB', 'R'], ['guardR', 'R'], ['mask', 'L']] }, { left: 1, foes: [['mask', 'R'], ['guardR', 'L']] }] },
    { lock: 1536, talk: 'wu', music: 'boss', boss: 'wu', groups: [{ left: 9, foes: [['wu', 'R', 178]] }, { left: 1, hpBelow: 0.5, foes: [['guard', 'L'], ['guardB', 'R']] }] },
  ],
};

const STAGE2 = {
  name: '第二關　夜襲縣衙', sub: '—— 殺雞取卵 ——', segs: 4, night: true,
  anchors: [['g_gate', 0], ['g_hall', 360], ['g_rooms', 790], ['g_moon', null]], fillers: ['g_corridor', 'g_moon', 'g_corridor'], sky: ['sky_night'],
  props: [{ k: 'jar', x: 260, z: 162 }, { k: 'crate', x: 610, z: 198 }, { k: 'jar', x: 980, z: 160 }, { k: 'crate', x: 1300, z: 196 }],
  waves: [
    { lock: 0, talk: 's2start', music: 'stage1', groups: [{ left: 9, foes: [['mask', 'R'], ['mask', 'L']] }, { left: 1, foes: [['maskr', 'R'], ['mask', 'R']] }] },
    { lock: 384, groups: [{ left: 9, foes: [['mask', 'R'], ['maskr', 'L'], ['maskB', 'R']] }, { left: 1, foes: [['maskR', 'L'], ['maskr', 'R']] }] },
    { lock: 768, talk: 's2bed', volley: true, groups: [{ left: 9, foes: [['maskR', 'R'], ['maskr', 'R'], ['mask', 'L']] }, { left: 1, foes: [['maskB', 'R'], ['maskr', 'L'], ['mask', 'R']] }] },
    { lock: 1152, talk: 'huwan2', music: 'boss', boss: 'huwan2', bossTalk: 'huwan2Down', groups: [{ left: 9, foes: [['huwan2', 'R', 180]] }, { left: 1, hpBelow: 0.6, foes: [['mask', 'L'], ['maskr', 'R']] }, { left: 1, hpBelow: 0.3, foes: [['maskR', 'L'], ['maskB', 'R']] }] },
  ],
};
STAGE1.bgs = STAGE1.segs; STAGE1.segs = 5; STAGE1.sub = '—— 北洋年間　南部中國 ——';
STAGE1.anchors = [['f_gate', 0], ['f_yamen', 470], ['f_noodle', 850], ['f_wall', 1330], ['f_huang', null]]; STAGE1.fillers = ['f_shop1', 'f_shop2', 'f_shop3']; STAGE1.sky = ['sky_day', 'sky_dusk'];
STAGE1.next = 'story2';
STAGE2.next = 'story3';
const STAGES = [STAGE1, STAGE2];

// ---------- 台詞 ----------
// 說話者：角色 id、'P'＝目前玩家、'' 旁白。台詞照劇本原句（出處場次見 docs/story.md），髒話拿掉
const TALK = {
  start: [['huwan', '黃老爺百忙無暇，特命我黃府大管家胡萬！'], ['wu', '黃府團練教頭武智衝！'], ['huwan', '禮帽，禮帽，歡迎縣長！'], ['dage', '來者不善吶。'], ['tang', '你，才是來者。']],   // 29
  drum: [{ panel: 'p_drum' }, ['tang', '這不是樹！別砍了！'], ['tang', '這是冤鼓！乾隆年間設的。'], ['liuzi', '我爹說了，有冤鼓就有冤！'], ['tang', '鼓呢？鼓呢？叫你別砍吧，把鼓給砍跑了！']],   // 35
  huwan: [{ panel: 'p_liangfen' }, ['huwan', '六爺，你吃了兩碗的粉，只給了一碗的錢。'], ['liuzi', '放屁！我就吃了一碗的粉，給了他一碗的錢！'], ['huwan', '縣長要給我們鵝城一個公平，好！'], ['huwan', '我今天討的就是一個公平！']],   // 45
  huwanDown: [['huwan', '你不敢殺我，你不能殺我！']],   // 45
  wu: [{ panel: 'p_wu' }, ['wu', '可惜了老子的酒，老子的雅興全讓你給毀了！'], ['wu', '老子是光緒三十一年皇上欽點的武舉人。'], ['dage', '哪個皇上？我見過嗎？']],   // 36、37
  wuDown: [['wu', '別打了！我磕！我磕！'], ['wu', '需要兄弟的時候，你吆喝一聲，兄弟立馬出現！']],   // 37、179
  s2start: [{ panel: 'p_raid' }, ['', '房頂之上，胡萬一派，端槍狂轟，門窗俱裂。'], ['', '張牧之抄槍躥起，縱躍出窗。']],   // 65、66
  s2bed: [['', '縣長臥室這廂，床板側翻，滿目槍孔。'], ['', '屋頂還有人在開槍——看地上的紅圈！']],   // 65
  huwan2: [['huwan', '殺雞取卵！'], ['huwan', '一定要在縣長的床上！']],   // 57
  huwan2Down: [{ panel: 'p_unmask' }, ['dage', '我居然上了你們的當！'], ['dage', '說，誰讓你冒充麻匪？'], ['huwan', '老子就是麻匪！張麻子是我大哥！'], ['dage', '哦，那你是老幾啊？'], ['huwan', '老三。'],
    ['dage', '是你大哥張麻子派你來的，還是你老爺黃四郎派你來的？'], ['huwan', '黃老爺。'], ['dage', '不錯，張麻子！'], ['huwan', '可大哥您臉上沒麻子。'], ['dage', '黃四郎，臉上有四嗎？'], ['huwan', '懂了！'], ['', '砰！']],   // 67
};
const NAMES = { huang: '黃四郎', huajie: '花姐', hubai: '胡百', huqian: '胡千', dage: '張牧之', erge: '老二', sange: '老三', liuzi: '六子', tang: '老湯', guard: '黃家護院', mask: '假麻匪', huwan: '胡萬', wu: '武舉人', shiye: '師爺', wife: '夫人', soldier: '鐵血十八星陸軍', '': '' };

// 過場（bg：劇情插圖；lines：[說話者, 台詞, 顯示名稱（可省）]）——台詞照劇本原句，括號內是劇本場次
const INTRO = [
  { bg: 'p_ridge', lines: [['', '北洋年間，南部中國。'], ['', '青石嶺。青山白石，雄關漫道。'], ['', '鐵軌直插遠方。']] },   // 1
  { bg: 'p_hotpot', lines: [['tang', '湯師爺，是好吃，還是好聽？', '縣太爺'], ['shiye', '也好聽，也好吃！都好，都好！'], ['shiye', '馬縣長此番風度，正好比，大風起兮雲飛揚……'], ['wife', '屁！！']] },   // 2、4
  { bg: 'p_scope', lines: [['', '準星裡，馬拉火車早被牢牢「鎖死」。'], ['', '磅！磅！磅！……槍聲迴盪，鏗鏘十番。'], ['liuzi', '沒打中？'], ['dage', '讓子彈飛一會兒……']] },   // 3、8
  { bg: 'p_split', lines: [['', '車是車，馬是馬。十馬八方，各不相顧。'], ['dage', '老二老三跟我走！'], ['dage', '其他人把白馬抓回來！']] },   // 9、10
];
const MIDRO = [
  { bg: 'p_flip', lines: [['', '兩節黑車轟然騰空，旋起十八丈。'], ['dage', '火鍋？']] },   // 19、24
  { bg: 'p_clock', lines: [['liuzi', '爹，都找遍了！沒錢，沒貨，也沒銀子。'], ['liuzi', '人倒是剩倆活的。殺不殺？'], ['dage', '錢藏在哪兒了？說出來！'], ['dage', '鬧鐘響之前說不出來，腦袋搬家。'],
    ['tang', '有錢！有錢！上任就有錢！', '縣太爺'], ['dage', '師爺貴姓？'], ['tang', '姓湯！', '縣太爺'], ['dage', '湯師爺，我當縣長，你繼續當我的師爺，'], ['dage', '咱們鵝城走一趟。']] },   // 26、27
  { bg: 'p_caravan', lines: [['dage', '弟兄們，上任鵝城——！'], ['', '上任鵝城！', '眾兄弟'], ['dage', '師爺！當縣長最要緊的是什麼啊？'], ['tang', '忍耐！']] },   // 27、28
  { bg: 'p_gate', lines: [['', '「鵝城」二字赫然入目！'], ['', '恭迎縣長大人！', '眾老者'], ['tang', '此乃南國一霸——黃四郎。'], ['tang', '乾的是倒賣人口、倒賣鴉片的大生意。']] },   // 29
];
// 頁或句子的第 4 個欄位／cond：'dead'＝玩家不是六子（六子照劇本死去）、'alive'＝玩家選六子（六子活著）
const OUTRO = [   // 第一關之後
  { bg: 'p_gongping', lines: [['dage', '起來！不準跪！'], ['dage', '我來鵝城只辦三件事，'], ['dage', '公平！公平！還是公平！']] },   // 38
  { bg: 'p_stand', lines: [['tang', '那你是想站著，還是想掙錢呢？'], ['dage', '我是想站著，還把錢掙了。'], ['tang', '敢問九筒大哥何方神聖？'], ['dage', '鄙人，張麻子！']] },   // 34
  { bg: 'p_grave', cond: 'dead', lines: [['', '六子為了證明自己只吃了一碗粉，剖腹而死。'], ['', '六弟，四哥發誓替你報仇！', '老四'], ['sange', '六弟，三哥發誓替你報仇！'], ['dage', '六爺，一路走好！'], ['', '六爺一路走好！', '眾兄弟']] },   // 45、47
  { bg: 'p_cards', lines: [['huang', '先打哪張牌？'], ['huang', '請客、斬首、收下當狗！'], ['', '斬！', '胡千'], ['huang', 'No——請客！']] },   // 48
  { bg: 'p_invite', lines: [['', '鵝城小民黃四郎！恭請新任縣長馬邦德，光臨寒舍，略備薄酒，以表寸心……', '胡百'], ['tang', '鴻門宴！凶多吉少。'], ['dage', '什麼鴻門宴？就是惡霸請土匪！']] },   // 49、50
  { bg: 'p_banquet', cond: 'dead', lines: [['huang', '六爺的死，壯烈！'], ['huang', '如果真的是黃某指使，那我就像六爺一樣，當眾剖腹自殺！'], ['dage', '黃老爺，我聽說自裁用短刀。長刀歸介錯人。']] },   // 53
  { bg: 'p_banquet', cond: 'alive', lines: [['huang', '縣長，師爺！大駕光臨！有失遠迎！'], ['tang', '黃老爺的宅邸，竹林掩映，碉樓聳立，易守難攻，萬夫莫開啊！']] },   // 51、52
  { bg: 'p_toast', lines: [['huang', '我們鵝城有兩大家族，都是把人賣到 America，修鐵路，掙的都是 dollar。'], ['tang', 'Dollar——到了！黃老爺一來，錢就到了。'], ['tang', '酒一口一口喝，路一步一步走！'], ['tang', '步子邁大了，咔，容易扯著蛋！'], ['huang', '師爺，高！縣長，硬！'], ['', '黃老爺，又高又硬！', '張牧之、老湯']] },   // 53、55
  { bg: 'p_plot', lines: [['huang', '今晚，殺雞取卵！一定要在縣長的床上。'], ['huang', '哪個是雞？'], ['huwan', '縣長！']] },   // 57
];
const STORY3 = [   // 第二關之後 → 散銀子
  { bg: 'p_mourn', lines: [['tang', '我說我當不了縣長！你非要花錢幫我買這個官！'], ['tang', '她是我老婆！我是縣長，我就是馬邦德！'], ['dage', '啊——我說我當不了縣長！你非得給我花錢買這個官！'], ['huang', '你呀，太年輕了，不該一進城就槍斃麻匪。']] },   // 68、69
  { bg: 'p_kidnap', lines: [['', '我們是張麻子張大爺的隊伍！要錢！不要命！', '九筒'], ['', '三天之內錢不到就撕票！記住，我是九筒！', '九筒'], ['huang', '替身就是為我幹這個的！這個錢，我一分都不出！'], ['dage', '這替身這麼有用啊！得空幫我也找一個。']] },   // 70
  { bg: 'p_silver', lines: [['dage', '人不走，錢也不要了！都發出去！'], ['sange', '這錢你都發給誰吧？'], ['dage', '發給窮人唄！'], ['tang', '那誰是窮人啊？'], ['dage', '誰窮，誰就是窮人。']] },   // 72
];
const STORY4 = [   // 散銀子之後
  { bg: 'p_silver', lines: [['', '老天爺啊！', '百姓'], ['tang', '你劫我的時候戴的是九餅，我這是多少？'], ['dage', '自己摸摸。'], ['tang', '一餅。'], ['dage', '哈哈哈哈，過癮嗎？'], ['tang', '過癮！']] },   // 73
  { bg: 'p_huajie', lines: [['huajie', '原來縣長的人，是麻匪？'], ['sange', '我們，就想給你發點兒錢！']] },   // 75
  { bg: 'p_situng', lines: [['dage', '那邊領頭的戴的是幾筒看見了嗎？'], ['sange', '四筒。'], ['', '衣服一樣，面具相同，全是四筒，敵我難辨。'], ['', '都是四筒，下不了手啊！', '黃家人'], ['dage', '一、二、三，撤！']] },   // 85、87
  { bg: 'p_fanyi', lines: [['dage', '胡萬，就是麻匪！麻匪，就是胡萬！'], ['huang', '三天之後，一定給縣長一個驚喜。'], ['dage', '湯師爺，你給翻譯翻譯，什麼叫驚喜？'], ['tang', '不用翻譯，就是驚喜啊！'], ['dage', '我就想讓你翻譯翻譯，什麼叫驚喜！'],
    ['huang', '驚喜就是三天之後，我出一百八十萬給你們出城剿匪！'], ['dage', '大哥這是驚喜啊，小弟我願意等你三天。']] },   // 90
  { bg: 'p_charge', lines: [['', '下一關：出城剿匪。'], ['dage', '槍在手，跟我走！'], ['', '殺四郎！', '老四'], ['', '搶碉樓！', '老五']] },   // 預告（160）
];
