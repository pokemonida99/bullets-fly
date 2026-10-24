// 音效（WebAudio 即時合成）＋配樂（使用者提供的三首 mp3，music/）＋過關／接關的短合成音樂
'use strict';
const Audio2 = (() => {
  let ac = null, master, sfxBus, musBus, noiseBuf, unlocked = false;
  let song = null, step = 0, nextT = 0, timer = null;
  const muted = { v: Store.get('mute', false) };
  let quiet = false;   // 示範模式不出聲

  function init() {
    if (ac) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = muted.v ? 0 : 0.8; master.connect(ac.destination);
    sfxBus = ac.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
    musBus = ac.createGain(); musBus.gain.value = 0.22; musBus.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function unlock() {
    init();
    if (!ac) return;
    if (ac.state !== 'running') ac.resume();
    if (!unlocked) {          // iPhone：在使用者手勢裡播一個無聲 buffer
      const b = ac.createBufferSource(); b.buffer = ac.createBuffer(1, 1, 22050); b.connect(ac.destination); b.start(0);
      unlocked = true;
    }
  }
  const ok = () => ac && ac.state === 'running';

  function tone(type, f0, f1, dur, vol, bus = sfxBus, t = ac.currentTime, duty) {
    const o = ac.createOscillator(), g = ac.createGain();
    if (type === 'pulse') {
      // 用兩個鋸齒波相減做脈衝波（25% duty）
      o.type = 'sawtooth';
      const o2 = ac.createOscillator(); o2.type = 'sawtooth';
      const inv = ac.createGain(); inv.gain.value = -1;
      const dl = ac.createDelay(); dl.delayTime.value = (duty || 0.25) / f0;
      o2.frequency.setValueAtTime(f0, t);
      if (f1 !== f0) o2.frequency.exponentialRampToValueAtTime(f1, t + dur);
      o2.connect(inv); inv.connect(dl); dl.connect(g);
      o2.start(t); o2.stop(t + dur + 0.02);
    } else o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, fType, f0, f1, bus = sfxBus, t = ac.currentTime, q = 1) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    s.playbackRate.value = 1;
    const f = ac.createBiquadFilter(); f.type = fType; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    s.connect(f); f.connect(g); g.connect(bus);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  const SFX = {
    whiff() { noise(0.08, 0.22, 'bandpass', 2400, 900, sfxBus, undefined, 1.5); },
    whiffBig() { noise(0.16, 0.3, 'bandpass', 1400, 400, sfxBus, undefined, 1.2); },
    hit() { tone('sine', 160, 50, 0.14, 0.9); noise(0.1, 0.55, 'lowpass', 3000, 400); },
    hitBig() { tone('sine', 120, 35, 0.3, 1); noise(0.25, 0.8, 'lowpass', 4000, 200); tone('square', 90, 40, 0.18, 0.18); },
    slash() { noise(0.12, 0.5, 'highpass', 6000, 2000); tone('sawtooth', 900, 300, 0.08, 0.12); },
    gun() { noise(0.18, 0.9, 'lowpass', 6000, 300); tone('square', 220, 50, 0.1, 0.3); },
    gunFar() { noise(0.14, 0.5, 'bandpass', 2000, 400, sfxBus, undefined, 0.8); },
    ricochet() { tone('sine', 2600, 900, 0.25, 0.12); },
    knife() { noise(0.1, 0.35, 'highpass', 7000, 4000); tone('triangle', 1800, 2400, 0.06, 0.08); },
    coin() { const t = ac.currentTime; tone('square', 1976, 1976, 0.05, 0.12, sfxBus, t); tone('square', 2637, 2637, 0.18, 0.12, sfxBus, t + 0.05); },
    coins() { const t = ac.currentTime; for (let i = 0; i < 6; i++) tone('square', 1800 + Math.random() * 1200, 2600, 0.06, 0.07, sfxBus, t + i * 0.05); },
    eat() { const t = ac.currentTime; [523, 659, 784, 1047].forEach((f, i) => tone('pulse', f, f, 0.1, 0.16, sfxBus, t + i * 0.06)); },
    break() { noise(0.35, 0.8, 'lowpass', 2500, 200); const t = ac.currentTime; for (let i = 0; i < 4; i++) tone('triangle', 900 + Math.random() * 900, 400, 0.08, 0.1, sfxBus, t + 0.04 + i * 0.04); },
    gong() { tone('triangle', 147, 140, 1.6, 0.5); tone('triangle', 294, 280, 1.2, 0.22); tone('sine', 441, 420, 0.8, 0.1); noise(0.9, 0.35, 'bandpass', 900, 300, sfxBus, undefined, 0.6); },
    jump() { tone('square', 220, 520, 0.12, 0.1); },
    land() { noise(0.08, 0.3, 'lowpass', 900, 200); },
    whoosh() { noise(0.4, 0.5, 'bandpass', 300, 3000, sfxBus, undefined, 1.2); },
    hoof() { const t = ac.currentTime; noise(0.04, 0.16, 'lowpass', 700, 300, sfxBus, t); noise(0.04, 0.12, 'lowpass', 700, 300, sfxBus, t + 0.09); },
    fall() { tone('sine', 110, 40, 0.3, 0.9); noise(0.25, 0.6, 'lowpass', 1500, 120); },
    grab() { noise(0.06, 0.4, 'lowpass', 1200, 400); tone('sine', 200, 150, 0.06, 0.4); },
    throw() { noise(0.3, 0.4, 'bandpass', 500, 2500, sfxBus, undefined, 1.2); },
    hurt() { tone('square', 300, 120, 0.2, 0.15); noise(0.15, 0.4, 'lowpass', 2000, 300); },
    ko() { const t = ac.currentTime; tone('sawtooth', 400, 60, 0.6, 0.2, sfxBus, t); noise(0.5, 0.4, 'lowpass', 2000, 100, sfxBus, t); },
    blip() { tone('pulse', 880, 880, 0.05, 0.14); },
    talk() { tone('pulse', 600 + Math.random() * 200, 600, 0.03, 0.06); },
    cursor() { const t = ac.currentTime; tone('pulse', 1046, 1046, 0.04, 0.14, sfxBus, t); tone('pulse', 1568, 1568, 0.05, 0.1, sfxBus, t + 0.04); },
    decide() { const t = ac.currentTime; [587, 784, 880, 1175].forEach((f, i) => tone('pulse', f, f, 0.16, 0.18, sfxBus, t + i * 0.05)); noise(0.5, 0.3, 'highpass', 4000, 8000, sfxBus, t); },
    locked() { tone('square', 200, 160, 0.15, 0.15); },
    go() { const t = ac.currentTime; tone('pulse', 659, 659, 0.08, 0.16, sfxBus, t); tone('pulse', 880, 880, 0.18, 0.16, sfxBus, t + 0.09); },
    superStart() { const t = ac.currentTime; noise(0.8, 0.5, 'bandpass', 300, 6000, sfxBus, t, 1); [294, 349, 440, 587].forEach((f, i) => tone('pulse', f, f, 0.5, 0.14, sfxBus, t + i * 0.06)); },
    freeze() { tone('sine', 3000, 3200, 0.9, 0.06); tone('triangle', 1500, 1520, 0.9, 0.05); },
    quake() { tone('sine', 55, 30, 0.9, 1); noise(0.9, 0.8, 'lowpass', 600, 60); },
    wave() { noise(0.6, 0.6, 'lowpass', 2000, 200); tone('sawtooth', 80, 40, 0.6, 0.25); },
    abacus() { const t = ac.currentTime; for (let i = 0; i < 6; i++) tone('square', 2200, 2200, 0.02, 0.1, sfxBus, t + i * 0.07); },
    shoutS() { const t = ac.currentTime; for (let i = 0; i < 3; i++) tone('sawtooth', 330 - i * 20, 300 - i * 20, 0.22, 0.16, sfxBus, t + i * 0.2); noise(0.6, 0.25, 'bandpass', 1200, 900, sfxBus, t, 2); },
    roar() { tone('sawtooth', 110, 70, 0.9, 0.3); noise(0.9, 0.5, 'bandpass', 500, 300, sfxBus, undefined, 0.8); },
    charge() { noise(0.5, 0.4, 'lowpass', 400, 1200); tone('sawtooth', 70, 110, 0.5, 0.2); },
    alert() { const t = ac.currentTime; tone('square', 1400, 1400, 0.06, 0.12, sfxBus, t); tone('square', 1400, 1400, 0.06, 0.12, sfxBus, t + 0.1); },
    tick() { tone('square', 1300, 1300, 0.03, 0.08); },
    pause() { const t = ac.currentTime; tone('pulse', 988, 988, 0.06, 0.14, sfxBus, t); tone('pulse', 659, 659, 0.08, 0.14, sfxBus, t + 0.07); },
    firework() { tone('sine', 120, 40, 0.4, 0.7); noise(0.7, 0.5, 'lowpass', 6000, 300); const t = ac.currentTime; for (let i = 0; i < 6; i++) noise(0.05, 0.25, 'highpass', 6000, 6000, sfxBus, t + 0.2 + i * 0.07); },
    // 選角代表音
    ch_dage() { const t = ac.currentTime; SFX.gun(); tone('sine', 2600, 900, 0.3, 0.1, sfxBus, t + 0.12); },
    ch_erge() { SFX.slash(); tone('sine', 80, 40, 0.3, 0.8); },
    ch_sange() { const t = ac.currentTime; for (let i = 0; i < 3; i++) noise(0.06, 0.35, 'highpass', 7000, 4000, sfxBus, t + i * 0.07); },
    ch_liuzi() { tone('sine', 70, 30, 0.4, 1); noise(0.3, 0.5, 'lowpass', 700, 80); },
    ch_tang() { SFX.coins(); },
    ch_wife() { SFX.whiffBig(); tone('sine', 140, 60, 0.2, 0.6); },
    ch_huajie() { SFX.drum(); setTimeout(() => SFX.drum(), 140); },
    drum() { tone('sine', 110, 46, 0.4, 1); tone('triangle', 70, 40, 0.3, 0.5); noise(0.12, 0.5, 'lowpass', 1200, 150); },
    drumBig() { tone('sine', 90, 34, 0.9, 1); tone('triangle', 60, 30, 0.7, 0.6); noise(0.5, 0.8, 'lowpass', 1500, 80); },
  };

  // ---------- 配樂：簡易步進音序器 ----------
  const NOTE = n => {
    const m = /^([A-G])(#?)(\d)$/.exec(n);
    const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] ? 1 : 0);
    return 440 * Math.pow(2, (base + (+m[3] + 1) * 12 - 69) / 12);
  };
  const parse = s => s.trim().split(/\s+/).map(x => x === '.' ? null : x === '-' ? '-' : x);

  // 短的合成音樂（過關、接關），一格 = 十六分音符。lead 主旋律／lead2 和聲／arp 和弦琶音／bass／drum
  // drum：k 大鼓 s 小鼓 h 閉鈸 o 開鈸 c 銅鈸 w 梆子（木魚） g 鑼
  const SONGS = {
    clear: {
      bpm: 120, len: 32, once: true,
      lead: parse(`C5 . E5 . G5 . C6 . . . A5 . C6 . . .  D6 . . . C6 . A5 . C6 . . . . . . .`),
      lead2: parse(`G4 . C5 . E5 . G5 . . . E5 . A5 . . .  A5 . . . G5 . E5 . E5 . . . . . . .`),
      bass: parse(`C3 . . . C3 . . . A2 . . . A2 . . .  G2 . . . G2 . . . C3 . . . . . . .`),
      drum: 'k.......k.......k...s...k.s.s.g.',
    },
    gameover: {
      bpm: 90, len: 32, once: true, leadType: 'triangle',
      lead: parse(`A4 . . . G4 . . . E4 . . . D4 . . .  C4 . . . . . . . A3 . . . . . . .`),
      bass: parse(`A2 . . . . . . . G2 . . . . . . .  F2 . . . . . . . E2 . . . . . . .`),
      drum: 'g...............................',
    },
  };

  function schedule() {
    if (!song || !ok()) return;
    const spb = 60 / song.bpm / 4;
    while (nextT < ac.currentTime + 0.12) {
      const i = step % song.len;
      const ln = song.lead[i], bs = song.bass[i % song.bass.length], dr = song.drum[i % song.drum.length];
      const dur = arr => { let d = 1; while (arr[(i + d) % song.len] === null && d < 8) d++; return d; };
      if (ln && ln !== '-') tone(song.leadType || 'pulse', NOTE(ln), NOTE(ln), spb * dur(song.lead) * 0.95, song.leadType ? 0.32 : 0.2, musBus, nextT, 0.25);
      if (song.lead2) { const l2 = song.lead2[i]; if (l2 && l2 !== '-') tone('pulse', NOTE(l2), NOTE(l2), spb * dur(song.lead2) * 0.9, 0.09, musBus, nextT, 0.5); }
      if (song.arp) {                      // 和弦琶音：每格輪流彈和弦裡的一個音
        const seg = song.len / song.arp.length, ch = song.arp[Math.floor(i / seg)].split(' ');
        const n = ch[i % ch.length];
        tone('pulse', NOTE(n) * 2, NOTE(n) * 2, spb * 0.8, 0.045, musBus, nextT, 0.125);
      }
      if (bs && bs !== '-') tone('triangle', NOTE(bs), NOTE(bs), spb * 1.8, 0.55, musBus, nextT);
      if (dr === 'k') { tone('sine', 140, 45, 0.12, 0.9, musBus, nextT); }
      else if (dr === 's') { noise(0.1, 0.45, 'bandpass', 1800, 1200, musBus, nextT, 0.7); tone('triangle', 220, 160, 0.06, 0.2, musBus, nextT); }
      else if (dr === 'h') noise(0.03, 0.2, 'highpass', 8000, 8000, musBus, nextT);
      else if (dr === 'o') noise(0.18, 0.18, 'highpass', 7000, 7000, musBus, nextT);
      else if (dr === 'c') noise(1.0, 0.35, 'highpass', 5000, 3000, musBus, nextT);
      else if (dr === 'w') { tone('sine', 1250, 1150, 0.05, 0.28, musBus, nextT); tone('triangle', 2500, 2300, 0.03, 0.08, musBus, nextT); }
      else if (dr === 'g') { tone('triangle', 147, 138, 1.4, 0.32, musBus, nextT); tone('triangle', 294, 276, 1.0, 0.12, musBus, nextT); noise(0.8, 0.22, 'bandpass', 900, 300, musBus, nextT, 0.6); }
      nextT += spb; step++;
      if (song.once && step >= song.len) { song = null; return; }
    }
  }
  // ---------- 使用者提供的配樂（music/*.mp3）：標題／選角／過場／結局＝《讓子彈飛》、關卡＝《策馬向前》、頭目戰＝《金戈鐵馬》 ----------
  // loop：[循環起點, 循環終點（秒，切掉結尾淡出）]
  const TRACKS = {
    theme: { src: 'music/theme.mp3', loop: [0, 120.6] },
    stage: { src: 'music/stage.mp3', loop: [0, 87.2] },
    boss: { src: 'music/boss.mp3', loop: [0.34, 83.4] },
  };
  const USE = { title: 'theme', select: 'theme', ending: 'theme', stage1: 'stage', boss: 'boss' };
  const bufs = {}, loading = {};
  let trackBus = null, track = null, trackName = null, want = null;
  function loadTrack(k) {
    if (bufs[k] || loading[k] || !ac) return loading[k];
    loading[k] = fetch(TRACKS[k].src).then(r => r.arrayBuffer()).then(a => new Promise((res, rej) => ac.decodeAudioData(a, res, rej)))
      .then(b => { bufs[k] = b; if (want === k) startTrack(k); }).catch(e => console.warn('music', k, e));
    return loading[k];
  }
  function stopTrack() {
    if (track) { const t = track, g = t.g; try { g.gain.setTargetAtTime(0, ac.currentTime, 0.15); t.stop(ac.currentTime + 0.8); } catch (e) { /* 已停 */ } }
    track = null; trackName = null;
  }
  function startTrack(k) {
    if (!bufs[k]) { loadTrack(k); return; }
    if (trackName === k) return;
    stopTrack();
    const src = ac.createBufferSource(), g = ac.createGain();
    src.buffer = bufs[k]; src.loop = true; [src.loopStart, src.loopEnd] = TRACKS[k].loop;
    g.gain.value = 0; g.gain.setTargetAtTime(1, ac.currentTime, 0.05);
    src.connect(g); g.connect(trackBus); src.start(0, TRACKS[k].loop[0]);
    src.g = g; track = src; trackName = k;
  }
  function play(name) {
    init();
    if (!ac) return;
    if (!trackBus) { trackBus = ac.createGain(); trackBus.gain.value = 0.55; trackBus.connect(master); for (const k in TRACKS) loadTrack(k); }
    const k = USE[name];
    if (k) {   // 用 mp3 配樂
      song = null; want = k;
      startTrack(k);
      return;
    }
    // 短的合成音樂（過關、接關）
    want = null; stopTrack();
    if (song && song.name === name) return;
    song = Object.assign({ name }, SONGS[name]);
    step = 0; nextT = ac.currentTime + 0.05;
    if (!timer) timer = setInterval(schedule, 30);
  }
  function stop() { song = null; want = null; if (ac) stopTrack(); }
  function ding(level) { if (!ok() || quiet) return; const f = 880 * Math.pow(2, Math.min(level, 19) / 12); tone('triangle', f, f, 0.18, 0.16); tone('triangle', f * 2, f * 2, 0.12, 0.06, sfxBus, ac.currentTime + 0.04); }
  function sfx(name) { if (quiet) return; if (ok() && SFX[name]) try { SFX[name](); } catch (e) { console.warn('sfx', name, e); } }
  function toggleMute() {
    muted.v = !muted.v; Store.set('mute', muted.v);
    if (master) master.gain.value = muted.v ? 0 : 0.8;
    return muted.v;
  }
  return { unlock, play, stop, sfx, ding, toggleMute, get muted() { return muted.v; }, set quiet(v) { quiet = v; if (musBus) musBus.gain.value = v ? 0 : 0.22; if (trackBus) trackBus.gain.value = v ? 0 : 0.55; } };
})();
