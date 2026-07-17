// node로 직접 실행하는 엔진 검증: node src/game/engine.test.js
import { CARDS } from './cards.js';
import { baseScore } from './score.js';
import { createGame, playCard, chooseFloorMatch, declareGo, declareStop, decideGwangSale, playBomb, declareShake, legalActions } from './engine.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error('FAIL:', msg); }
}

// ── 카드 구성 검증 ──
assert(CARDS.length === 48, '48장');
assert(CARDS.filter((c) => c.type === 'gwang').length === 5, '광 5장');
assert(CARDS.filter((c) => c.type === 'tti').length === 10, '띠 10장');
assert(CARDS.filter((c) => c.type === 'yeol').length === 9, '열끗 9장(국진 포함)');
assert(CARDS.filter((c) => c.type === 'pi').length === 24, '피 24장');
assert(CARDS.filter((c) => c.special === 'ssangpi').length === 2, '쌍피 2장');
assert(CARDS.filter((c) => c.godori).length === 3, '고도리 3장');

// ── 점수 계산 검증 ──
const g = (id) => CARDS.find((c) => c.id === id);
assert(baseScore([g('1-0'), g('3-0'), g('8-0')]).score === 3, '3광=3점');
assert(baseScore([g('1-0'), g('3-0'), g('12-0')]).score === 2, '비광 포함 3광=2점');
assert(baseScore([g('1-0'), g('3-0'), g('8-0'), g('11-0'), g('12-0')]).score === 15, '오광=15점');
assert(baseScore([g('2-0'), g('4-0'), g('8-1')]).score === 5, '고도리=5점');
assert(baseScore([g('1-1'), g('2-1'), g('3-1')]).score === 3, '홍단=3점');
{
  const pis = CARDS.filter((c) => c.type === 'pi' && !c.special).slice(0, 10);
  assert(baseScore(pis).score === 1, '피 10장=1점');
  const withSsang = [...pis.slice(0, 8), g('11-1'), g('12-3')]; // 일반8+쌍피2=12피
  assert(baseScore(withSsang).score === 3, '피 12(쌍피2)=3점');
}

// ── 배분 검증 ──
{
  const s2 = createGame({ playerCount: 2 });
  assert(s2.players[0].hand.length === 10 && s2.floor.length === 8 && s2.deck.length === 20, '2인 배분 10/10/8/20');
  const s3 = createGame({ playerCount: 3 });
  assert(s3.players.every((p) => p.hand.length === 7) && s3.floor.length === 6 && s3.deck.length === 21, '3인 배분 7x3/6/21');
}

// ── 랜덤 플레이아웃: 상태 불변식 ──
function totalCards(s) {
  return s.players.reduce((n, p) => n + p.hand.length + p.captured.length, 0)
    + s.floor.length + s.deck.length + (s.pending?.card ? 1 : 0);
}

function randomPlayout(playerCount, seedRng) {
  let s = createGame({ playerCount, rng: seedRng });
  let guard = 0;
  while (s.phase !== 'finished' && guard++ < 500) {
    if (s.phase === 'gwangSale') {
      const undecided = [0, 1, 2, 3].filter((i) => !s.pending.decided.includes(i));
      s = decideGwangSale(s, undecided[0], seedRng() < 0.4);
      continue;
    }
    if (s.phase === 'goStop') {
      s = seedRng() < 0.3 ? declareGo(s) : declareStop(s);
      continue;
    }
    if (s.phase === 'chooseFloorMatch') {
      s = chooseFloorMatch(s, s.pending.options[Math.floor(seedRng() * s.pending.options.length)]);
      continue;
    }
    const acts = legalActions(s);
    if (acts.length === 0) break;
    const a = acts[Math.floor(seedRng() * acts.length)];
    if (a.action === 'bomb') s = playBomb(s, s.turn, a.month);
    else if (a.action === 'shake') { s = declareShake(s, s.turn, a.month); }
    else s = playCard(s, s.turn, a.cardId);

    if (playerCount !== 4 || s.phase !== 'gwangSale') {
      const t = totalCards(s);
      if (t !== 48) return { error: `카드 ${t}장 (48이어야 함)`, state: s };
    }
  }
  if (s.phase !== 'finished') return { error: `미종료 guard=${guard}` };
  return { ok: true, result: s.result };
}

// 간단 시드 RNG
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const outcomes = { win: 0, nagari: 0, chongtong: 0 };
let errors = 0;
for (let seed = 1; seed <= 1000; seed++) {
  for (const pc of [2, 3, 4]) {
    const r = randomPlayout(pc, mulberry32(seed * 10 + pc));
    if (r.error) {
      if (errors++ < 5) console.error(`seed=${seed} ${pc}인:`, r.error);
    } else {
      outcomes[r.result.type] = (outcomes[r.result.type] || 0) + 1;
    }
  }
}
assert(errors === 0, `랜덤 플레이아웃 오류 ${errors}건`);
console.log('플레이아웃 결과 분포:', outcomes);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
