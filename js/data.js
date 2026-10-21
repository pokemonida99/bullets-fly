// 角色、招式、敵人、關卡、台詞
'use strict';

// ---------- 版本與更新紀錄（改版時一起更新；標題畫面與桌墊都看得到） ----------
const VERSION = 'v0.1';
const CHANGELOG = [
  ['v0.1', '試玩版：第一關「鵝城」——城門、騎樓街、涼粉攤、黃昏街道、黃府碉樓門前',
    '可選大哥（張麻子）、二哥、三哥、六子、湯師爺；四哥、五哥、七弟正式版登場',
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
  { id: 'dage', name: '大哥', full: '張麻子', title: '平衡型・雙槍', spd: 1.7, hp: 100, pow: 1, jump: 5.4, stat: [3, 3, 3],
    line: '讓子彈飛一會兒。', pick: '公平，公平，還是公平！',
    s1n: '雙槍連射', s2n: '旋身雙槍', supn: '讓子彈飛一會兒',
    moves: {
      c0: { seq: [['b0', 12]], hits: [HB([3, 6], [4, 54, 28, 14], 5)], vx: [[0, 4, 0.8]] },
      c1: { seq: [['b1', 13]], hits: [HB([3, 7], [4, 56, 32, 18], 6)], vx: [[0, 4, 0.8]] },
      c2: { seq: [['b2', 15]], hits: [HB([4, 8], [4, 52, 34, 22], 7)], vx: [[0, 5, 0.8]] },
      c3: { seq: [['b3', 22]], hits: [HB([4, 9], [2, 56, 32, 24], 10, { kd: 1 })], vx: [[0, 6, 1.2]] },
      dash: { seq: [['b2', 22]], hits: [HB([2, 12], [4, 52, 34, 26], 9, { kd: 1 })], vx: [[0, 12, 3.2]] },
      jatk: { seq: [['jatk', 40]], hits: [HB([2, 30], [0, 42, 32, 28], 8, { kd: 1 })], air: true },
      knee: { seq: [['b0', 12]], hits: [HB([3, 6], [4, 56, 26, 20], 4, { grab: 1 })] },
      throw: { seq: [['throw', 22]], ev: { 6: 'release' }, tdmg: 12 },
      s1: { seq: [['c0', 6], ['c1', 8], ['c2', 8], ['c1', 8]], ev: { 6: 'bullet', 14: 'bullet' } },
      s2: { seq: loop('c3', 'c4', 3), inv: [0, 22], hits: [HB([0, 24], [-32, 60, 64, 60], 8, { kd: 1, zr: 14 })], cost: 4, ev: { 0: 'gun2', 12: 'gun2' } },
      sup: { seq: [['c5', 16], ['c6', 74], ['c7', 20]], inv: [0, 110], ev: { 0: 'leap', 16: 'bulletsUp', 72: 'bulletRain' } },
    } },
  { id: 'erge', name: '二哥', full: '二哥', title: '力量型・步槍', spd: 1.4, hp: 120, pow: 1, jump: 5.0, stat: [2, 5, 4],
    line: '這一槍，不會落空。', pick: '跟著大哥，有肉吃！',
    s1n: '步槍狙擊', s2n: '槍托旋風', supn: '連環快槍',
    moves: {
      c0: { seq: [['b0', 14]], hits: [HB([4, 8], [2, 56, 38, 18], 7)], sfx: 'whiffBig' },
      c1: { seq: [['b1', 15]], hits: [HB([4, 8], [2, 58, 40, 22], 8)], sfx: 'whiffBig' },
      c2: { seq: [['b2', 17]], hits: [HB([5, 9], [2, 56, 34, 26], 9)] },
      c3: { seq: [['b3', 26]], hits: [HB([6, 11], [4, 70, 40, 60], 14, { kd: 1 })], sfx: 'whiffBig' },
      dash: { seq: [['b1', 24]], hits: [HB([2, 14], [2, 58, 40, 30], 11, { kd: 1 })], vx: [[0, 14, 3]] },
      jatk: { seq: [['jatk', 40]], hits: [HB([2, 30], [0, 44, 34, 30], 11, { kd: 1 })], air: true },
      knee: { seq: [['b0', 13]], hits: [HB([3, 6], [4, 56, 26, 20], 5, { grab: 1 })] },
      throw: { seq: [['throw', 24]], ev: { 7: 'release' }, tdmg: 15 },
      s1: { seq: [['c0', 12], ['c1', 12], ['c2', 16]], ev: { 12: 'rifle' } },
      s2: { seq: loop('c3', 'c4', 3).concat([['c5', 10]]), inv: [0, 22], hits: [HB([0, 24], [-40, 64, 80, 64], 10, { kd: 1, zr: 16 })], cost: 5, ev: { 0: 'whiffBig', 12: 'whiffBig', 24: 'land' } },
      sup: { seq: [['c6', 30], ['c1', 8], ['c2', 8], ['c1', 8], ['c2', 8], ['c1', 8], ['c7', 16]], inv: [0, 86], ev: { 0: 'roarS', 30: 'volley', 46: 'volley', 62: 'volley' } },
    } },
  { id: 'sange', name: '三哥', full: '三哥', title: '速度型・快槍', spd: 2.15, hp: 100, pow: 1, jump: 5.8, stat: [5, 2, 3],
    line: '眨眼就到。', pick: '慢的人，先倒下。',
    s1n: '快槍三發', s2n: '側翻踢', supn: '閃身連射',
    moves: {
      c0: { seq: [['b0', 9]], hits: [HB([2, 5], [4, 54, 26, 14], 4)] },
      c1: { seq: [['b1', 9]], hits: [HB([2, 5], [4, 54, 28, 16], 4)] },
      c2: { seq: [['b2', 13]], hits: [HB([3, 7], [0, 58, 34, 26], 6)] },
      c3: { seq: [['b3', 16]], hits: [HB([3, 7], [4, 48, 26, 24], 8, { kd: 1 })], vx: [[0, 5, 1.4]] },
      dash: { seq: [['jatk', 22]], hits: [HB([2, 14], [0, 40, 34, 26], 8, { kd: 1 })], vx: [[0, 16, 4]] },
      jatk: { seq: [['jatk', 40]], hits: [HB([2, 30], [0, 38, 34, 28], 8, { kd: 1 })], air: true },
      knee: { seq: [['b3', 10]], hits: [HB([2, 5], [4, 50, 24, 22], 4, { grab: 1 })] },
      throw: { seq: [['throw', 20]], ev: { 5: 'release' }, tdmg: 11 },
      s1: { seq: [['c0', 5], ['c1', 6], ['c2', 12]], ev: { 5: 'shots3' } },
      s2: { seq: [['c3', 8], ['c4', 8], ['c5', 12]], inv: [0, 20], vx: [[0, 20, 1.6]], hop: 4.6, hits: [HB([0, 26], [-10, 74, 44, 74], 9, { kd: 1, zr: 12 })], cost: 3 },
      sup: { seq: [['c6', 30]], inv: [0, 30], ev: { 0: 'glint', 29: 'gunDash' } },
    } },
  { id: 'siger', name: '四哥', locked: true, title: '穩健型・步槍' },
  { id: 'wuge', name: '五哥', locked: true, title: '中距離・繩鏢' },
  { id: 'liuzi', name: '六子', full: '小六子', title: '投技型・蠻力', spd: 1.6, hp: 110, pow: 1, jump: 5.2, stat: [3, 4, 4], grabR: 22,
    line: '我吃得多，力氣也大！', pick: '大哥，看我的！',
    s1n: '蠻牛頭槌', s2n: '旋風臂', supn: '大地震腳',
    moves: {
      c0: { seq: [['b0', 11]], hits: [HB([3, 6], [4, 54, 26, 14], 5)] },
      c1: { seq: [['b1', 12]], hits: [HB([3, 6], [4, 54, 28, 18], 6)] },
      c2: { seq: [['b2', 16]], hits: [HB([4, 8], [4, 62, 30, 32], 8)] },
      c3: { seq: [['b3', 20]], hits: [HB([3, 10], [2, 58, 32, 42], 11, { kd: 1 })], vx: [[2, 10, 2.6]] },
      dash: { seq: [['b3', 24]], hits: [HB([2, 14], [2, 58, 32, 42], 11, { kd: 1 })], vx: [[0, 14, 3.6]] },
      jatk: { seq: [['jatk', 40]], hits: [HB([2, 30], [-8, 44, 44, 34], 10, { kd: 1, zr: 12 })], air: true },
      knee: { seq: [['b1', 12]], hits: [HB([3, 6], [4, 56, 26, 20], 5, { grab: 1 })] },
      throw: { seq: [['grab', 8], ['throw', 22]], ev: { 14: 'release' }, tdmg: 20, slam: 1 },
      s1: { seq: [['c0', 12], ['c1', 18], ['c2', 10]], vx: [[12, 30, 5]], hits: [HB([12, 30], [0, 56, 32, 42], 13, { kd: 1 })] },
      s2: { seq: loop('c4', 'c5', 3), inv: [0, 22], hits: [HB([0, 24], [-36, 60, 72, 56], 9, { kd: 1, zr: 14 })], cost: 4 },
      sup: { seq: [['c6', 32], ['c3', 50], ['c7', 14]], inv: [0, 96], ev: { 0: 'roarS', 32: 'stomp' } },
    } },
  { id: 'qidi', name: '七弟', locked: true, title: '小個子・彈弓' },
  { id: 'tang', name: '湯師爺', full: '湯師爺（馬邦德）', title: '技巧型・大聲公', spd: 1.4, hp: 100, pow: 0.85, jump: 5.0, stat: [2, 1, 2],
    line: '鵝城的父老鄉親們——！', pick: '在下湯師爺。',
    s1n: '撒銀元', s2n: '大聲公', supn: '天降橫財',
    moves: {
      c0: { seq: [['b0', 12]], hits: [HB([3, 6], [4, 50, 32, 14], 4)] },
      c1: { seq: [['b1', 13]], hits: [HB([3, 7], [4, 52, 30, 18], 5)] },
      c2: { seq: [['b2', 14]], hits: [HB([3, 8], [2, 40, 30, 28], 5)] },
      c3: { seq: [['b3', 18]], hits: [HB([4, 9], [4, 66, 28, 40], 7, { kd: 1 })] },
      dash: { seq: [['b2', 22]], hits: [HB([2, 12], [4, 40, 28, 30], 7, { kd: 1 })], vx: [[0, 12, 2.8]] },
      jatk: { seq: [['jatk', 40]], hits: [HB([2, 30], [0, 46, 32, 32], 7, { kd: 1 })], air: true },
      knee: { seq: [['b0', 12]], hits: [HB([3, 6], [4, 50, 26, 20], 3, { grab: 1 })] },
      throw: { seq: [['throw', 20]], ev: { 5: 'release' }, tdmg: 8, far: 1 },
      s1: { seq: [['c0', 8], ['c1', 8], ['c2', 12]], ev: { 8: 'coins3' } },
      s2: { seq: [['c5', 12], ['c3', 8], ['c4', 20]], inv: [0, 14], cost: 3, ev: { 20: 'soundwave' } },
      sup: { seq: [['c4', 32], ['c6', 40], ['c7', 20]], inv: [0, 92], ev: { 0: 'shout', 32: 'moneyRain' } },
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
  huwan: { name: '黃府管家 胡萬', hp: 150, spd: 1.2, dmg: 9, boss: true, score: 3000 },
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
    { lock: 384, groups: [{ left: 9, foes: [['guard', 'R'], ['mask', 'R']] }, { left: 1, drum: 150, foes: [['guard', 'L'], ['guardR', 'R'], ['mask', 'R']] }] },
    { lock: 768, talk: 'huwan', music: 'boss', groups: [{ left: 9, foes: [['huwan', 'R', 180]] }, { left: 1, delay: 300, foes: [['guard', 'L'], ['guard', 'R']] }] },
    { lock: 1152, music: 'stage1', groups: [{ left: 9, foes: [['mask', 'R'], ['mask', 'L']] }, { left: 1, foes: [['guardB', 'R'], ['guardR', 'R'], ['mask', 'L']] }, { left: 1, foes: [['mask', 'R'], ['guardR', 'L']] }] },
    { lock: 1536, talk: 'wu', music: 'boss', boss: 'wu', groups: [{ left: 9, foes: [['wu', 'R', 178]] }, { left: 1, hpBelow: 0.5, foes: [['guard', 'L'], ['guardB', 'R']] }] },
  ],
};

// ---------- 台詞 ----------
// 說話者：角色 id、'P'＝目前玩家、'' 旁白。台詞照劇本原句（出處場次見 docs/story.md），髒話拿掉
const TALK = {
  start: [['huwan', '黃老爺百忙無暇，特命我黃府大管家胡萬！'], ['wu', '黃府團練教頭武智衝！'], ['huwan', '禮帽，禮帽，歡迎縣長！'], ['dage', '來者不善吶。'], ['tang', '你，才是來者。']],
  huwan: [['huwan', '六爺，你吃了兩碗的粉，只給了一碗的錢。'], ['liuzi', '放屁！我就吃了一碗的粉，給了他一碗的錢！'], ['huwan', '縣長要給我們鵝城一個公平，好！'], ['huwan', '我今天討的就是一個公平！']],
  huwanDown: [['huwan', '你不敢殺我，你不能殺我！']],
  wu: [['wu', '老子是光緒三十一年皇上欽點的武舉人。'], ['dage', '哪個皇上？我見過嗎？']],
  wuDown: [['wu', '別打了！我磕！我磕！'], ['wu', '需要兄弟的時候，你吆喝一聲，兄弟立馬出現！']],
};
const NAMES = { dage: '大哥 張麻子', erge: '二哥', sange: '三哥', liuzi: '六子', tang: '湯師爺', guard: '黃家護院', mask: '假麻匪', huwan: '胡萬', wu: '武舉人', '': '' };

// 開場與結局的過場（bg：背景圖；lines：[說話者, 台詞]）
const INTRO = [
  { bg: 'title', lines: [['', '北洋年間，南部中國。'], ['', '一列馬拉的火車，載著新縣長開往鵝城……']] },
  { bg: 'title', lines: [['liuzi', '沒打中？'], ['dage', '讓子彈飛一會兒……']] },
  { bg: 'bg1', lines: [['', '麻匪張麻子劫了火車，'], ['', '冒名當上了鵝城縣長。'], ['tang', '此乃南國一霸——黃四郎。'], ['tang', '乾的是倒賣人口、倒賣鴉片的大生意。']] },
];
const OUTRO = [
  { bg: 'bg1', lines: [['dage', '我來鵝城只辦三件事，'], ['dage', '公平！公平！還是公平！']] },
  { bg: 'bg5', lines: [['tang', '那你是想站著，還是想掙錢呢？'], ['dage', '我是想站著，還把錢掙了。']] },
  { bg: 'ending', lines: [['', '黃四郎的碉樓還在。'], ['dage', '槍在手，跟我走！'], ['', '殺四郎！搶碉樓！']] },
];
