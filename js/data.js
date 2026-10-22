// 角色、招式、敵人、關卡、台詞
'use strict';

// ---------- 版本與更新紀錄（改版時一起更新；標題畫面與桌墊都看得到） ----------
const VERSION = 'v0.6.1';
const CHANGELOG = [
  ['v0.6.1', '手機主畫面圖示可以挑：四款（九筒面具、張牧之、火車、子彈飛），按桌墊上方的「圖示」選'],
  ['v0.6', '台詞依章節順序重排：第一關改成 冤鼓 → 武舉人 → 唱機穆扎 → 涼粉胡萬；後面章節不再借用前面的台詞',
    '經典段落補上關鍵句：站著把錢掙了、穆扎與東洋西洋南洋北洋、大哥你是瞭解我的、照片「那時候我還很瘦」',
    '重畫鴻門宴敬酒插圖（手部畫錯）；新增唱機、縣衙兩張插圖',
    '旁白與說明文字不再用破折號（劇本原句裡的保留）'],
  ['v0.5.1', '選角色之後可以選擇從哪個章節開始（試玩版全部開放）', '補上假麻子的頭像；修正動作破圖：鄰格碎片、黃四郎倒地被切斷、騎馬跳躍畫面上的柵欄、重複出現的斗笠和銀元；頭像雜點'],
  ['v0.5', '劇情做到最後：第三關「出城剿匪」（頭目假麻子：地雷、萬民傘擋正面）、小遊戲「打鐵門」、最終關「殺四郎，搶碉樓」（頭目黃四郎：武士長刀、六顆子彈、替身會慢半拍學他的動作）',
    '結局：普通結局「同去，同去」＋三個隱藏結局（結局收集）',
    '玩家自己的角色不會在劇情裡死去（六子、老二、老湯）'],
  ['v0.4', '新角色老四：遠距離型，普通攻擊就是開槍；斗笠飛盤去了會回來；後跳射擊；超必殺一槍一個',
    '新角色老五：最耐打、出招霸體；吹哨叫兄弟衝進來助陣、哨音震暈敵人；超必殺總攻',
    '新角色老七：反擊型，按住招式二擺「被動」架勢正面無敵、自動反擊；雙槍連轟；超必殺「我喜歡被動」一段時間無敵',
    '八位兄弟全部可選；選角台詞用劇本第 80 場「大哥你是瞭解我的……」',
    '張牧之加強：速度、力量、耐打都提高；怒氣累積快 1.5 倍；連打最後一擊補一發穿透重彈；招式一改成雙槍六連射',
    '復活與接關：角色從畫面上方跳進來蹲著落地，衝擊波讓畫面上的敵人全部倒下並扣血'],
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
  ['v0.1', '試玩版：第一關「鵝城」，有城門、騎樓街、涼粉攤、黃昏街道、黃府碉樓門前',
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
  { id: 'dage', name: '張牧之', full: '張麻子', title: '全能型・雙槍手', spd: 1.85, hp: 115, pow: 1.15, jump: 5.6, stat: [4, 4, 4], meterGain: 1.5,
    line: '讓子彈飛一會兒。', pick: '公平，公平，還是公平！',
    s1n: '雙槍六連射', s2n: '旋身雙槍', supn: '讓子彈飛一會兒',
    moves: {
      c0: { seq: [['c0a', 3], ['c0b', 6], ['c0a', 3]], hits: [HB([3, 7], [4, 54, 28, 14], 5)], vx: [[0, 4, 0.8]] },
      c1: { seq: [['c1a', 3], ['c1b', 6], ['c1a', 4]], hits: [HB([3, 7], [4, 56, 32, 18], 6)], vx: [[0, 4, 0.8]] },
      c2: { seq: [['c2a', 4], ['c2b', 7], ['c2a', 4]], hits: [HB([4, 9], [4, 52, 34, 22], 7)] },
      c3: { seq: [['c3a', 6], ['c3b', 8], ['s1c', 10]], hits: [HB([6, 12], [2, 56, 32, 24], 11, { kd: 1 })], vx: [[0, 8, 1]], ev: { 14: 'finisherShot' } },
      dash: { seq: [['dash0', 6], ['dash1', 14], ['dash0', 4]], hits: [HB([4, 18], [4, 52, 34, 26], 9, { kd: 1 })], vx: [[0, 18, 3.2]] },
      jatk: { seq: [['jatk0', 6], ['jatk1', 34]], hits: [HB([5, 34], [0, 42, 32, 28], 8, { kd: 1 })], air: true },
      knee: { seq: [['c0a', 4], ['c0b', 8]], hits: [HB([4, 8], [4, 56, 26, 20], 4, { grab: 1 })] },
      throw: { seq: [['throw0', 8], ['throw1', 16]], ev: { 8: 'release' }, tdmg: 12 },
      s1: { seq: [['s1a', 3], ['s1b', 4], ['s1c', 4], ['s1d', 4], ['s1c', 4], ['s1d', 4], ['s1c', 4], ['s1d', 4], ['s1b', 4]], ev: { 7: 'bullet', 11: 'bullet', 15: 'bullet', 19: 'bullet', 23: 'bullet2', 27: 'bullet2' } },
      s2: { seq: [['s2a', 4]].concat(loop('s2b', 's2c', 3), [['s2d', 6]]), inv: [0, 26], hits: [HB([4, 28], [-32, 60, 64, 60], 8, { kd: 1, zr: 14 })], cost: 4, ev: { 4: 'gun2', 16: 'gun2' } },
      sup: { seq: [['sp0', 6], ['sp1', 12], ['sp2', 10], ['sp3', 8], ['sp4', 62], ['sp5', 20]], inv: [0, 118], ev: { 0: 'leap', 28: 'bulletsUp', 94: 'bulletRain' } },
    } },
  { id: 'erge', name: '老二', full: '老二', title: '力量型・步槍', spd: 1.4, hp: 120, pow: 1, jump: 5.0, stat: [2, 5, 4],
    line: '這一槍，不會落空。', pick: '別看著我呀！大哥，你是瞭解我的。',
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
    line: '眨眼就到。', pick: '大哥你是瞭解我的，以我的習慣，萬事不求人。',
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
  { id: 'siger', name: '老四', full: '老四', title: '遠距離型・斗笠', spd: 1.5, hp: 85, pow: 1, jump: 5.2, stat: [3, 2, 1], ranged: true,
    line: '如果是我，不會有人活著來告狀。', pick: '大哥你是瞭解我的，如果是我，不會有人活著來告狀。',
    s1n: '斗笠飛盤', s2n: '後跳射擊', supn: '一槍一個',
    moves: {
      r0: { seq: [['c0a', 4], ['c0b', 7], ['c0a', 3]], ev: { 4: 'pshot' } },
      r1: { seq: [['c0a', 3], ['c0b', 7], ['c0a', 3]], ev: { 3: 'pshot' } },
      r2: { seq: [['c3a', 7], ['c3b', 8], ['c3c', 10]], ev: { 7: 'pshot2' } },
      c0: { seq: [['c1a', 4], ['c1b', 7], ['c1a', 3]], hits: [HB([4, 9], [4, 56, 28, 18], 5)] },
      c1: { seq: [['c2a', 4], ['c2b', 8], ['c2a', 5]], hits: [HB([4, 10], [4, 50, 32, 24], 6, { kd: 1 })] },
      dash: { seq: [['dash0', 6], ['dash1', 14], ['dash0', 4]], hits: [HB([4, 18], [4, 54, 34, 26], 8, { kd: 1 })], vx: [[0, 18, 3]] },
      jatk: { seq: [['jatk0', 6], ['jatk1', 34]], hits: [HB([5, 34], [0, 42, 32, 28], 7, { kd: 1 })], air: true },
      knee: { seq: [['c0a', 4], ['c0b', 8]], hits: [HB([4, 8], [4, 56, 26, 20], 3, { grab: 1 })] },
      throw: { seq: [['throw0', 8], ['throw1', 16]], ev: { 8: 'release' }, tdmg: 10 },
      s1: { seq: [['s1a', 5], ['s1b', 6], ['s1c', 12]], ev: { 11: 'hat' } },
      s2: { seq: [['s2a', 5], ['s2b', 16], ['s2c', 8]], hop: 3.8, vx: [[5, 21, -2.8]], inv: [0, 18], ev: { 8: 'pshot', 15: 'pshot' } },
      sup: { seq: [['sp0', 20]], inv: [0, 20], ev: { 0: 'glint', 19: 'snipe' } },
    } },
  { id: 'wuge', name: '老五', full: '老五', title: '耐打型・吹哨號令', spd: 1.25, hp: 140, pow: 1.05, jump: 4.8, stat: [1, 4, 5], armor: true, rideMelee: true,
    line: '總攻！', pick: '大哥你是瞭解我的，我老五雖然歲數最大，我、我至今……俗稱處男。',
    s1n: '吹哨傳令', s2n: '哨音震', supn: '總攻',
    moves: {
      c0: { seq: [['c0a', 5], ['c0b', 7], ['c0a', 4]], hits: [HB([5, 10], [4, 56, 30, 16], 7)] },
      c1: { seq: [['c1a', 5], ['c1b', 7], ['c1a', 4]], hits: [HB([5, 10], [4, 56, 32, 18], 8)] },
      c2: { seq: [['c2a', 6], ['c2b', 8], ['c2a', 4]], hits: [HB([6, 12], [4, 64, 30, 34], 9)] },
      c3: { seq: [['c3a', 7], ['c3b', 9], ['c3c', 10]], hits: [HB([7, 14], [2, 58, 36, 40], 13, { kd: 1 })], vx: [[6, 12, 1.4]] },
      dash: { seq: [['dash0', 6], ['dash1', 14], ['dash0', 4]], hits: [HB([4, 18], [4, 54, 34, 26], 11, { kd: 1 })], vx: [[0, 18, 3.2]] },
      jatk: { seq: [['jatk0', 6], ['jatk1', 34]], hits: [HB([5, 34], [0, 42, 32, 28], 10, { kd: 1 })], air: true },
      knee: { seq: [['c0a', 4], ['c0b', 8]], hits: [HB([4, 8], [4, 56, 26, 20], 5, { grab: 1 })] },
      throw: { seq: [['throw0', 8], ['throw1', 16]], ev: { 8: 'release' }, tdmg: 18, slam: 1 },
      s1: { seq: [['s1a', 6], ['s1b', 14], ['s1c', 12]], ev: { 12: 'callBro' } },
      s2: { seq: [['s2a', 6], ['s2b', 20], ['s2c', 6]], cost: 0, ev: { 8: 'whistleStun' } },
      sup: { seq: [['sp0', 16], ['sp1', 30], ['sp2', 12], ['sp3', 30]], inv: [0, 88], ev: { 0: 'shoutW', 18: 'allCharge' } },
    } },
  { id: 'liuzi', name: '六子', full: '小六子', title: '投技型・蠻力', spd: 1.6, hp: 110, pow: 1, jump: 5.2, stat: [3, 4, 4], grabR: 22,
    line: '我吃得多，力氣也大！', pick: '一就是一，二就是二。',
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
  { id: 'qidi', name: '老七', full: '老七', title: '反擊型・近身無敵', spd: 2.1, hp: 85, pow: 1, jump: 5.6, stat: [5, 2, 1], counter: true,
    line: '我喜歡被動。', pick: '大哥你是瞭解我的，我從來不做仗勢欺人的事，我喜歡被動。',
    s1n: '雙槍連轟', s2n: '被動（按住）', supn: '我喜歡被動',
    moves: {
      c0: { seq: [['c0a', 3], ['c0b', 6]], hits: [HB([2, 7], [4, 54, 26, 14], 4)] },
      c1: { seq: [['c1a', 3], ['c1b', 7]], hits: [HB([2, 8], [4, 46, 30, 24], 5)] },
      c2: { seq: [['c2a', 4], ['c2b', 8]], hits: [HB([4, 10], [0, 56, 34, 26], 6)] },
      c3: { seq: [['c3a', 4], ['c3b', 8], ['c3c', 8]], hits: [HB([4, 11], [4, 62, 26, 34], 9, { kd: 1, launch: 4.2 })], vx: [[0, 6, 1.6]] },
      dash: { seq: [['dash0', 6], ['dash1', 14], ['dash0', 4]], hits: [HB([4, 18], [4, 54, 34, 26], 8, { kd: 1 })], vx: [[0, 18, 4]] },
      jatk: { seq: [['jatk0', 6], ['jatk1', 34]], hits: [HB([5, 34], [0, 42, 32, 28], 8, { kd: 1 })], air: true },
      knee: { seq: [['c0a', 4], ['c0b', 8]], hits: [HB([4, 8], [4, 56, 26, 20], 4, { grab: 1 })] },
      throw: { seq: [['throw0', 8], ['throw1', 16]], ev: { 8: 'release' }, tdmg: 11 },
      s1: { seq: [['s1a', 4], ['s1b', 6], ['s1c', 6], ['s1d', 6]], ev: { 4: 'twinA', 10: 'twinB' } },
      s2: { seq: [['s2a', 99]] },
      counter: { seq: [['s2c', 14], ['s2d', 8]], vx: [[0, 12, 4.6]], inv: [0, 22], hits: [HB([0, 14], [0, 60, 40, 50], 14, { kd: 1, zr: 12 })], ev: { 0: 'gun2', 6: 'gun2' } },
      acounter: { seq: [['sp2', 8], ['sp3', 8]], vx: [[0, 8, 4]], inv: [0, 16], hits: [HB([0, 12], [-10, 60, 50, 50], 16, { kd: 1, zr: 14, all: 1 })], ev: { 0: 'gun2' } },
      sup: { seq: [['sp0', 18], ['sp1', 12]], inv: [0, 30], ev: { 29: 'aura' } },
    } },
  { id: 'tang', name: '老湯', full: '老湯（馬邦德）', title: '高難度・大聲公', spd: 1.4, hp: 100, pow: 0.85, jump: 5.0, stat: [2, 1, 2],
    line: '鵝城的父老鄉親們！', pick: '在下湯師爺。',
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
  jiamazi: { name: '假麻子', hp: 260, spd: 1.15, dmg: 11, boss: true, score: 7000 },
  huang: { name: '南國一霸 黃四郎', hp: 320, spd: 1.2, dmg: 13, boss: true, score: 15000 },
  tishen: { base: 'huang', name: '替身 楊萬樓', hp: 60, spd: 1.2, dmg: 10, boss: true, score: 2000, decoy: true },
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
    { lock: 0, talk: 's1start', groups: [{ left: 9, foes: [['guard', 'R'], ['guard', 'R']] }, { left: 1, foes: [['guardB', 'L'], ['guard', 'R']] }] },
    { lock: 384, talk: 'drum', groups: [{ left: 9, foes: [['guard', 'R'], ['mask', 'R']] }, { left: 1, drum: 150, foes: [['guard', 'L'], ['guardR', 'R'], ['mask', 'R']] }] },
    { lock: 768, talk: 'wu', music: 'boss', boss: 'wu', bossTalk: 'wuDown', groups: [{ left: 9, foes: [['wu', 'R', 178]] }, { left: 1, hpBelow: 0.5, foes: [['guard', 'L'], ['guardB', 'R']] }] },
    { lock: 1152, talk: 'mozart', music: 'stage1', groups: [{ left: 9, foes: [['mask', 'R'], ['mask', 'L']] }, { left: 1, foes: [['guardB', 'R'], ['guardR', 'R'], ['mask', 'L']] }, { left: 1, foes: [['mask', 'R'], ['guardR', 'L']] }] },
    { lock: 1536, talk: 'huwan', music: 'boss', groups: [{ left: 9, foes: [['huwan', 'R', 180]] }, { left: 1, delay: 300, foes: [['guard', 'L'], ['guard', 'R']] }] },
  ],
};

const STAGE2 = {
  name: '第二關　夜襲縣衙', sub: '殺雞取卵', segs: 4, night: true,
  anchors: [['g_gate', 0], ['g_hall', 360], ['g_rooms', 790], ['g_moon', null]], fillers: ['g_corridor', 'g_moon', 'g_corridor'], sky: ['sky_night'],
  props: [{ k: 'jar', x: 260, z: 162 }, { k: 'crate', x: 610, z: 198 }, { k: 'jar', x: 980, z: 160 }, { k: 'crate', x: 1300, z: 196 }],
  waves: [
    { lock: 0, talk: 's2start', music: 'stage1', groups: [{ left: 9, foes: [['mask', 'R'], ['mask', 'L']] }, { left: 1, foes: [['maskr', 'R'], ['mask', 'R']] }] },
    { lock: 384, groups: [{ left: 9, foes: [['mask', 'R'], ['maskr', 'L'], ['maskB', 'R']] }, { left: 1, foes: [['maskR', 'L'], ['maskr', 'R']] }] },
    { lock: 768, talk: 's2bed', volley: true, groups: [{ left: 9, foes: [['maskR', 'R'], ['maskr', 'R'], ['mask', 'L']] }, { left: 1, foes: [['maskB', 'R'], ['maskr', 'L'], ['mask', 'R']] }] },
    { lock: 1152, talk: 'huwan2', music: 'boss', boss: 'huwan2', bossTalk: 'huwan2Down', groups: [{ left: 9, foes: [['huwan2', 'R', 180]] }, { left: 1, hpBelow: 0.6, foes: [['mask', 'L'], ['maskr', 'R']] }, { left: 1, hpBelow: 0.3, foes: [['maskR', 'L'], ['maskB', 'R']] }] },
  ],
};
STAGE1.bgs = STAGE1.segs; STAGE1.segs = 5; STAGE1.sub = '北洋年間　南部中國';
STAGE1.anchors = [['f_gate', 0], ['f_yamen', 740], ['f_wall', 1180], ['f_noodle', null]]; STAGE1.fillers = ['f_shop1', 'f_shop2', 'f_shop3']; STAGE1.sky = ['sky_day', 'sky_dusk'];
STAGE1.next = 'story2';
STAGE2.next = 'story3';
const STAGE3 = {
  name: '第三關　出城剿匪', sub: '青石嶺', segs: 5,
  anchors: [['w_rocks', 0], ['w_bamboo', 420], ['w_rocks', 900], ['w_trees1', 1300], ['w_rocks', null]], fillers: ['w_trees1', 'w_trees2', 'w_bamboo'], sky: ['sky_day'], ground: 'ground_dirt',
  props: [{ k: 'crate', x: 300, z: 196 }, { k: 'jar', x: 700, z: 160 }, { k: 'crate', x: 1120, z: 200 }, { k: 'jar', x: 1400, z: 162 }],
  waves: [
    { lock: 0, talk: 's3start', music: 'stage1', groups: [{ left: 9, foes: [['mask', 'R'], ['maskr', 'R']] }, { left: 1, foes: [['maskR', 'L'], ['maskr', 'R'], ['mask', 'R']] }] },
    { lock: 384, volley: true, talk: 's3snipe', groups: [{ left: 9, foes: [['mask', 'R'], ['maskB', 'L'], ['maskr', 'R']] }, { left: 1, foes: [['maskR', 'R'], ['maskr', 'L']] }] },
    { lock: 768, talk: 's3cable', groups: [{ left: 9, foes: [['maskB', 'R'], ['maskR', 'L'], ['maskr', 'R']] }, { left: 1, foes: [['mask', 'R'], ['maskr', 'L'], ['maskB', 'R']] }] },
    { lock: 1152, groups: [{ left: 9, foes: [['maskr', 'R'], ['maskr', 'L'], ['maskR', 'R']] }, { left: 1, foes: [['maskB', 'L'], ['maskR', 'R'], ['mask', 'R']] }] },
    { lock: 1536, talk: 's3boss', music: 'boss', boss: 'jiamazi', bossTalk: 's3bossDown', groups: [{ left: 9, foes: [['jiamazi', 'R', 180]] }, { left: 1, hpBelow: 0.5, foes: [['maskr', 'L'], ['mask', 'R']] }] },
  ],
};
const STAGE4 = {
  name: '最終關　殺四郎，搶碉樓', sub: '黃家碉樓', segs: 4,
  anchors: [['d_irongate', 0], ['d_tower1', 520], ['d_tower2', 900], ['d_tower1', null]], fillers: ['d_bamboo', 'd_tower2', 'd_bamboo'], sky: ['sky_day', 'sky_dusk'], skyDusk: [200, 900],
  props: [{ k: 'jar', x: 260, z: 160 }, { k: 'crate', x: 640, z: 198 }, { k: 'jar', x: 900, z: 162 }],
  waves: [
    { lock: 0, talk: 's4start', music: 'stage1', groups: [{ left: 9, foes: [['guard', 'R'], ['guardB', 'R'], ['guard', 'L']] }, { left: 1, foes: [['guardR', 'R'], ['maskr', 'R'], ['guard', 'L']] }] },
    { lock: 384, groups: [{ left: 9, foes: [['guardB', 'R'], ['maskr', 'L'], ['guardR', 'R']] }, { left: 1, foes: [['maskB', 'R'], ['guardR', 'L'], ['maskr', 'R']] }] },
    { lock: 768, talk: 's4boss', music: 'boss', boss: 'huang', bossTalk: 's4bossDown', groups: [{ left: 9, foes: [['huang', 'R', 182]] }, { left: 1, hpBelow: 0.4, foes: [['guardB', 'L'], ['guardR', 'R']] }] },
  ],
};
STAGE3.next = 'story5'; STAGE4.next = 'storyEnd';
const STAGES = [STAGE1, STAGE2, STAGE3, STAGE4];

// ---------- 章節選擇 ----------
// 試玩版：全部章節都能選。之後要改成「打過的才能選」，把 CHAPTER_LOCK 改成 true 就好（打過的章節已經會記錄在瀏覽器裡）
const CHAPTER_LOCK = false;
const CHAPTERS = [   // start：從哪個場景開始（含該章前面的劇情過場）
  { name: '序章　青石嶺 劫火車', sub: '騎白馬追馬拉火車', start: 'intro', thumb: 'p_split' },
  { name: '第一關　鵝城', sub: '冤鼓、涼粉、武舉人', start: 'midro', thumb: 'p_gate' },
  { name: '第二關　夜襲縣衙', sub: '鴻門宴、殺雞取卵、胡萬', start: 'story2', thumb: 'p_raid' },
  { name: '小遊戲　散銀子', sub: '把銀子丟進窗戶', start: 'story3', thumb: 'p_silver' },
  { name: '第三關　出城剿匪', sub: '青石嶺、假麻子', start: 'story4', thumb: 'p_cable' },
  { name: '小遊戲　打鐵門', sub: '槍在手，跟我走', start: 'story5', thumb: 'p_gate' },
  { name: '最終關　殺四郎，搶碉樓', sub: '黃四郎與替身', start: 'story6', thumb: 'p_crowd' },
];

// ---------- 台詞 ----------
// 說話者：角色 id、'P'＝目前玩家、'' 旁白。台詞照劇本原句（出處場次見 docs/story.md），髒話拿掉
const TALK = {   // 照章節順序，括號內是劇本場次；每章只用自己那段的台詞
  s1start: [['', '縣衙門外，六子使出全身武功，砍著一面比他高出幾尺的青藤圓牆。']],   // 35
  drum: [{ panel: 'p_drum' }, ['tang', '這不是樹！別砍了！這是冤鼓！'], ['liuzi', '我爹說了，有冤鼓就有冤！'], ['tang', '鼓呢？叫你別砍吧，把鼓給砍跑了！']],   // 35
  wu: [{ panel: 'p_wu' }, ['', '冤鼓一路滾到街上，撞上了拎著兩隻燒鵝的武舉人。'], ['wu', '老子是光緒三十一年皇上欽點的武舉人。'], ['dage', '哪個皇上？我見過嗎？']],   // 36、37
  wuDown: [{ panel: 'p_gongping' }, ['wu', '別打了！我磕！我磕！'], ['dage', '起來！不準跪！'], ['dage', '我來鵝城只辦三件事，公平！公平！還是公平！']],   // 37、38
  mozart: [{ panel: 'p_mozart' }, ['', '夜裡，張牧之修好了老縣長的唱機。'], ['dage', '這單活幹完了，我送你去留洋。東洋三年，西洋三年，南洋三年。'], ['liuzi', '北洋，北洋三年。'], ['dage', '傻孩子，你生在北洋。就不必留了。'],
    ['dage', '聽著像穆扎。他們那邊叫穆扎，咱們這邊叫莫扎特。'], ['', '能聽出是誰吹的？得看唱片上有沒有印他的名字。']],   // 40
  huwan: [{ panel: 'p_liangfen' }, ['huwan', '六爺，你吃了兩碗的粉，只給了一碗的錢。'], ['liuzi', '一就是一，二就是二。我今天就吃了一碗涼粉！']],   // 45
  huwanDown: [['huwan', '你不敢殺我，你不能殺我！']],   // 45
  s2start: [{ panel: 'p_raid' }, ['', '槍聲爆開寂靜，子彈嘯叫奪魂，床頭木碎棉飛。'], ['', '房頂之上，胡萬一派，姿態張狂，端槍狂轟，門窗俱裂。'], ['', '張牧之抄槍躥起，縱躍出窗。']],   // 65、66
  s2bed: [['', '臥室這廂，床板側翻，滿目槍孔，幾近蜂窩。'], ['', '屋頂還有人在開槍，看地上的紅圈！']],   // 65
  huwan2: [['', '房頂一陣激烈槍響，幾個身影輕盈落地。'], ['', '為首的麻將腦殼，正是胡萬！']],   // 67
  huwan2Down: [{ panel: 'p_unmask' }, ['dage', '我居然上了你們的當！'], ['', '面具底下的人自稱張麻子的老三，最後才招認：是黃老爺派他來的。'], ['dage', '不錯，張麻子！'], ['huwan', '可大哥您臉上沒麻子。'], ['dage', '黃四郎，臉上有四嗎？'], ['huwan', '懂了！'], ['', '砰！']],   // 67
  s3start: [['tang', '恩人，給你看個寶貝。'], ['dage', '茲委任馬邦德為康城縣長，哎，等會兒！康城？不是鵝城嗎？'], ['tang', '從來就是康城！'], ['', '突然槍聲四起！'], ['wuge', '大哥！好像有人冒充你，伏擊咱們！'], ['dage', '告訴弟兄們，散開。別開槍，往山頂上跑。']],   // 98
  s3snipe: [['', '整個樹林一個敵人都看不見，只有子彈從各處射來。'], ['', '看地上的紅圈！']],   // 98
  s3cable: [{ panel: 'p_cable', cond: 'dead:erge' }, ['', '只見山谷的高空中拉起一條索道……', '', 'dead:erge'], ['', '南國張麻子在此，錢留下，銀子也留下！', '假麻子', 'dead:erge'], ['dage', '告訴弟兄們，上東邊去！抓著活的，問出他們頭在哪兒！我親手宰了他！'],
    ['', '索道上的子彈全打空了，老二自己盪了回來。', '', 'alive:erge']],   // 108、113
  s3boss: [['dage', '頭在哪兒？'], ['', '北面，臉上有麻子的就是。', '假麻匪'], ['', '北面，山頂上。', '假麻匪'], ['dage', '總攻！']],   // 115
  s3bossDown: [{ panel: 'p_fakemazi' }, ['jiamazi', '你是張麻子？你臉上怎麼沒有麻子呢？'], ['dage', '這事，誰問誰死。'], ['', '假麻子全招了：麻子是黃老爺燙的，前五任縣長都死在他手上。']],   // 124
  s4start: [['', '鐵門之外，腳步轟隆，由遠而近。'], ['', '胡千雙手握槍，兩股戰戰。']],   // 177
  s4boss: [['huang', '我不是他。'], ['wu', '知道你是替身，替他享福！替他作惡！'], ['huang', '我真的不是他！']],   // 179
  s4bossDown: [['huang', '毀於一旦啊！五代家業，毀於一旦啊！']],   // 180
};
const NAMES = { jiamazi: '假麻子', siger: '老四', wuge: '老五', qidi: '老七', huang: '黃四郎', huajie: '花姐', hubai: '胡百', huqian: '胡千', dage: '張牧之', erge: '老二', sange: '老三', liuzi: '六子', tang: '老湯', guard: '黃家護院', mask: '假麻匪', huwan: '胡萬', wu: '武舉人', shiye: '師爺', wife: '夫人', soldier: '鐵血十八星陸軍', '': '' };

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
  { bg: 'p_gate', lines: [['', '「鵝城」二字赫然入目！鼓陣齊鳴，城門徐啟。'], ['', '黃老爺沒來，轎子裡只放了一頂禮帽，胡萬和武舉人代他迎接。'], ['dage', '來者不善吶。'], ['tang', '你，才是來者。'], ['tang', '此乃南國一霸——黃四郎。']] },   // 29
  { bg: 'p_stand', lines: [['tang', '晚了！前幾任縣長，把鵝城的稅收到九十年以後……咱們來錯地方了。'], ['', '老湯細細算給他聽：當縣長，就是跪著要飯。'], ['dage', '我就是腿腳不利索，跪不下去！'],
    ['tang', '那你是想站著，還是想掙錢呢？'], ['dage', '我是想站著，還把錢掙了。'], ['tang', '掙不成！'], ['', '張牧之把槍拍在驚堂木旁邊。'], ['tang', '敢問九筒大哥何方神聖？'], ['dage', '鄙人，張麻子！']] },   // 34
];
// 頁或句子的第 4 個欄位／cond：'dead'＝玩家不是六子（六子照劇本死去）、'alive'＝玩家選六子（六子活著）
const OUTRO = [   // 第一關之後
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
  { bg: 'p_skills', lines: [['', '假麻匪在城裡作惡，苦主告上了縣衙。張牧之盯著兄弟們看。'], ['qidi', '大哥你是瞭解我的……我喜歡被動。'], ['sange', '大哥你是瞭解我的……萬事不求人。'], ['siger', '大哥你是瞭解我的……不會有人活著來告狀。'],
    ['wuge', '大哥你是瞭解我的……俗稱處男。'], ['erge', '別看著我呀！大哥，你是瞭解我的。'], ['dage', '我聽出來了，你們都個個身懷絕技。但是，有人騙了我。'], ['dage', '老湯！這麼明顯的事兒，一個師爺看不出來？']] },   // 80
  { bg: 'p_situng', lines: [['dage', '那邊領頭的戴的是幾筒看見了嗎？'], ['sange', '四筒。'], ['', '衣服一樣，面具相同，全是四筒，敵我難辨。'], ['', '都是四筒，下不了手啊！', '黃家人'], ['dage', '一、二、三，撤！']] },   // 85、87
  { bg: 'p_fanyi', lines: [['dage', '胡萬，就是麻匪！麻匪，就是胡萬！'], ['huang', '三天之後，一定給縣長一個驚喜。'], ['dage', '湯師爺，你給翻譯翻譯，什麼叫驚喜？'], ['tang', '不用翻譯，就是驚喜啊！'], ['dage', '我就想讓你翻譯翻譯，什麼叫驚喜！'],
    ['huang', '驚喜就是三天之後，我出一百八十萬給你們出城剿匪！'], ['dage', '大哥這是驚喜啊，小弟我願意等你三天。']] },   // 90
  { bg: 'p_cloud', lines: [['dage', '我姓張。'], ['tang', '知道！'], ['dage', '叫牧之。'], ['dage', '從講武堂出來，我追隨過松坡將軍，給他做過手槍隊長。'], ['dage', '雲！那片雲，我見過。'], ['tang', '說明你要……東山再起！'], ['dage', '說明……要下雨了。']] },   // 91
  { bg: 'p_photo', lines: [['huang', '這照片是你嗎？'], ['dage', '是我！那時候我還很瘦！'], ['', '張牧之越說越理直氣壯：照相館給錯了照片，他也沒辦法。'], ['tang', '這明明是我！我才是馬邦德！'], ['dage', '三舅，這話能跟他說嗎？']] },   // 96
  { bg: 'p_rally', lines: [['huang', '自宣統皇帝退位以後，鵝城一共來過五十一任縣長。'], ['tang', '大風起兮雲飛揚，安得猛士兮走四方！'], ['tang', '麻匪，任何時候都要剿！不剿不行！'], ['dage', '出發！']] },   // 97
];
const STORY5 = [   // 第三關之後 → 回鵝城 → 打鐵門
  { bg: 'p_tangdie', cond: 'dead:tang', lines: [['tang', '我是個大騙子。'], ['dage', '我知道。'], ['tang', '你到底是不是張麻子？'], ['dage', '放心，我就是張麻子。'], ['tang', '聽我的，千萬別回鵝城，你呀，弄不過黃四郎，帶上銀子，走吧。']] },   // 125
  { bg: 'p_burn', cond: 'alive:tang', lines: [['', '馬車在山谷裡炸飛了，老湯卻從銀子堆裡爬了出來。'], ['tang', '騙子最怕受騙……這回騙我的是地雷。'], ['dage', '命大！']] },
  { bg: 'p_burn', lines: [['dage', '我弄不清楚，你到底是老湯，還是馬邦德。', '', 'dead:tang'], ['dage', '但是你沒了，張麻子也沒了，真的也沒了，假的也沒了。', '', 'dead:tang'], ['dage', '弟兄們，回鵝城！']] },   // 126
  { bg: 'p_return', lines: [['huang', '鵝城父老，恭迎縣長凱旋。'], ['dage', '湯師爺請你吃飯。', '', 'dead:tang'], ['huang', '他人呢？', '', 'dead:tang'], ['dage', '本人張牧之，以訛傳訛被傳成了張麻子。'], ['dage', '三天之內，縣長馬邦德法辦通匪惡霸黃四郎。'], ['huang', '天馬行空！童言無忌！']] },   // 130
  { bg: 'p_charge', lines: [['dage', '槍在手，跟我走！'], ['', '殺四郎！', '老四'], ['', '搶碉樓！', '老五'], ['siger', '大哥，大哥你看，跟我們來的只有它們！'], ['dage', '明白了！誰贏，他們幫誰！'], ['dage', '打！就打鐵門！']] },   // 160、162
  { bg: 'p_gate', lines: [['dage', '知道驚歎號吧？'], ['dage', '在門上打出個驚歎號來！']] },   // 166
];
const STORY6 = [   // 打鐵門之後 → 最終關
  { bg: 'p_crowd', lines: [['wu', '黃四郎被抓了！黃四郎被抓了！'], ['', '黃四郎被抓了！', '百姓'], ['dage', '去碉樓！拿回你們自己的東西！'], ['wu', '黃天已死！'], ['', '蒼天當立！', '百姓'], ['wu', '錢在碉樓！'], ['', '分了大吉！', '百姓']] },   // 171、174
  { bg: 'p_charge2', lines: [['', '鐵門如紙，人潮破鐵而入。'], ['', '比火車快，比狼群野。']] },   // 177
];
const STORYEND = [   // 打倒黃四郎之後
  { bg: 'p_smoke', lines: [['huang', '你，是一開始就想到了今天這步嗎？'], ['dage', '沒有。走一步，看一步。'], ['dage', '你說是錢對我重要？還是你對我重要？'], ['huang', '還是我重要！'], ['dage', '你和錢對我都不重要。'], ['huang', '那誰重要？'], ['dage', '沒有你，對我很重要。']] },   // 180
  { bg: 'p_explode', lines: [['huang', '張麻子——'], ['', '轟！碉樓炸成了龐大的煙塵，宛如國畫中盛開的花。'], ['dage', '%MOURN%，你們看到了吧。']] },   // 181
  { bg: 'p_bikes', lines: [['sange', '大哥，我們準備去上海了。'], ['huajie', '今天不是把錢都發光了嗎？還有比今天更過癮的？'], ['dage', '別忘了下回跟我打個招呼啊！'], ['', '保重！大哥再見！', '眾兄弟']] },   // 181
  { bg: 'ending', lines: [['', '上海就是浦東，浦東就是上海！', '老三'], ['', '馬拉火車呼嘯而過。張牧之輕抖韁繩，順著火車的方向而去。']] },   // 184
  { bg: 'h_ryuyou', cond: 'alive:liuzi', end: 'ryuyou', lines: [['', '這單活，終於幹完了。'], ['', '張牧之兌現了那晚在唱機旁說的話，六子坐上了出洋的大船。'], ['liuzi', '爹！等我回來，我就知道那個人是怎麼把聲音吹進唱片裡的了！']] },   // 遊戲原創
  { bg: 'bg1', cond: 'alive:tang', end: 'kangcheng', lines: [['', '老湯沒有回鵝城。'], ['', '他揣著那幾張委任狀，搭上了往康城的馬車。'], ['tang', '這一回，在下不是師爺，是縣長。']] },   // 遊戲原創
  { bg: 'h_whiteman', cond: 'flag:question', end: 'yanpin', lines: [['', '火車車尾，站著一個穿白西裝、戴禮帽的人。'], ['', '他朝著遠處那匹白馬，輕輕抬了抬禮帽。'], ['', '碉樓頂上那個人，究竟是誰？']] },   // 遊戲原創
];
const ENDINGS = { normal: ['普通結局', '同去，同去'], ryuyou: ['隱藏結局', '留洋（用六子破關）'], kangcheng: ['隱藏結局', '康城縣長（用老湯破關）'], yanpin: ['隱藏結局', '贗品（鐵門打出問號）'] };
