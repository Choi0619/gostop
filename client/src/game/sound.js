// Web Audio로 합성한 효과음 (오디오 파일 없이). 음소거 상태는 localStorage에 저장.
let ctx = null;
let muted = localStorage.getItem('gostop_muted') === '1';

export function isMuted() { return muted; }
export function toggleMute() {
  muted = !muted;
  localStorage.setItem('gostop_muted', muted ? '1' : '0');
  return muted;
}

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// 단순 톤 하나
function tone(freq, start, dur, { type = 'sine', gain = 0.2, slideTo } = {}) {
  const a = ac();
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime + start);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + start + dur);
  g.gain.setValueAtTime(0.0001, a.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, a.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  o.connect(g); g.connect(a.destination);
  o.start(a.currentTime + start);
  o.stop(a.currentTime + start + dur + 0.02);
}

function noise(start, dur, gain = 0.15) {
  const a = ac();
  const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource();
  const g = a.createGain();
  g.gain.value = gain;
  src.buffer = buf; src.connect(g); g.connect(a.destination);
  src.start(a.currentTime + start);
}

export const sfx = {
  play() { if (!muted) { try { tone(320, 0, 0.08, { type: 'triangle', gain: 0.18 }); noise(0, 0.05, 0.06); } catch {} } },     // 카드 내려놓기
  eat() { if (!muted) { try { tone(520, 0, 0.09, { type: 'sine', slideTo: 720, gain: 0.22 }); } catch {} } },                  // 먹기
  flip() { if (!muted) { try { tone(240, 0, 0.06, { type: 'square', gain: 0.1 }); } catch {} } },                              // 뒤집기
  ppeok() { if (!muted) { try { tone(140, 0, 0.25, { type: 'sawtooth', slideTo: 80, gain: 0.25 }); noise(0, 0.15, 0.12); } catch {} } }, // 뻑
  jjok() { if (!muted) { try { tone(880, 0, 0.12, { type: 'sine', slideTo: 1200, gain: 0.22 }); } catch {} } },                // 쪽/따닥
  go() { if (!muted) { try { [523, 659, 784].forEach((f, i) => tone(f, i * 0.08, 0.15, { type: 'triangle', gain: 0.2 })); } catch {} } }, // 고
  win() { if (!muted) { try { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.3, { type: 'triangle', gain: 0.22 })); } catch {} } }, // 승리
  lose() { if (!muted) { try { [400, 340, 280].forEach((f, i) => tone(f, i * 0.14, 0.3, { type: 'sawtooth', gain: 0.18 })); } catch {} } },     // 패배
};

// 이벤트 타입 → 효과음
export function playEventSound(type) {
  ({
    lay: sfx.play, paired: sfx.eat, eatPpeok: sfx.eat,
    ppeok: sfx.ppeok, jjok: sfx.jjok, ttadak: sfx.jjok, sseul: sfx.eat,
    bomb: sfx.ppeok, shake: sfx.go, go: sfx.go, flip: sfx.flip,
  }[type] || (() => {}))();
}
