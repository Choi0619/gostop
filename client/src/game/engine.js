// 고스톱 룰 엔진 (클라이언트/서버 공용)
// 상태를 순수 객체로 두고 action 함수로 전이한다.
import { CARDS } from './cards.js';
import { baseScore, finalScore } from './score.js';

// ── 유틸 ─────────────────────────────────────────────
export function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const byMonth = (cards, month) => cards.filter((c) => c.month === month);

// 상대들에게서 피 1장씩 뺏기 (일반피 우선)
function stealPi(state, playerIdx) {
  for (let i = 0; i < state.players.length; i++) {
    if (i === playerIdx) continue;
    const cap = state.players[i].captured;
    let idx = cap.findIndex((c) => c.type === 'pi' && c.special !== 'ssangpi');
    if (idx === -1) idx = cap.findIndex((c) => c.type === 'pi');
    if (idx !== -1) {
      state.players[playerIdx].captured.push(cap.splice(idx, 1)[0]);
      state.events.push({ type: 'stealPi', from: i, to: playerIdx });
    }
  }
}

// ── 게임 생성 ─────────────────────────────────────────
// playerCount 2: 맞고(10장/바닥8), 3~4: 고스톱(7장/바닥6, 4인은 광팔기로 3인 플레이)
export function createGame({ playerCount = 2, rules = {}, rng = Math.random } = {}) {
  const deck = shuffle(CARDS, rng);
  const handSize = playerCount === 2 ? 10 : 7;
  const floorSize = playerCount === 2 ? 8 : 6;
  const activeCount = Math.min(playerCount, 3);

  const state = {
    playerCount,
    activeCount,
    rules: { targetScore: playerCount === 2 ? 7 : 3, ...rules },
    players: [],
    floor: [],
    deck: [],
    ppeokMonths: [],       // 뻑으로 쌓인 월
    turn: 0,               // players 인덱스 (active만)
    phase: 'play',         // play | chooseFloorMatch | chooseFlipMatch | goStop | gwangSale | finished
    pending: null,         // 선택 대기 정보
    events: [],            // UI 애니메이션용 이벤트 로그
    result: null,
    firstPpeokBonus: {},   // playerIdx -> count
  };

  if (playerCount === 4) {
    // 광팔기: 4명 모두 7장 받고, 광 가진 사람이 팔고 빠질 수 있다
    for (let i = 0; i < 4; i++) {
      state.players.push(makePlayer(deck.splice(0, 7)));
    }
    state.floor = deck.splice(0, floorSize);
    state.deck = deck;
    state.phase = 'gwangSale';
    state.pending = { type: 'gwangSale', decided: [] };
    return state;
  }

  for (let i = 0; i < playerCount; i++) {
    state.players.push(makePlayer(deck.splice(0, handSize)));
  }
  state.floor = deck.splice(0, floorSize);
  state.deck = deck;

  checkChongtong(state);
  return state;
}

function makePlayer(hand) {
  return { hand, captured: [], goCount: 0, shakeCount: 0, active: true, folded: false, opts: {} };
}

// 총통: 시작 손패에 같은 월 4장
function checkChongtong(state) {
  for (let i = 0; i < state.players.length; i++) {
    const counts = {};
    for (const c of state.players[i].hand) counts[c.month] = (counts[c.month] || 0) + 1;
    const month = Object.keys(counts).find((m) => counts[m] === 4);
    if (month) {
      state.phase = 'finished';
      state.result = { type: 'chongtong', winner: i, month: +month };
      state.events.push({ type: 'chongtong', player: i, month: +month });
      return;
    }
  }
}

// ── 광팔기 (4인) ──────────────────────────────────────
// sell: true면 광 팔고 빠짐. 3명이 남을 때까지; 아무도 안 팔면 마지막 순번이 강제로 빠짐(관례상 재협상이지만 단순화)
export function decideGwangSale(state, playerIdx, sell) {
  if (state.phase !== 'gwangSale') throw new Error('not gwangSale phase');
  const p = state.pending;
  if (p.decided.includes(playerIdx)) return state;
  const gwangs = state.players[playerIdx].hand.filter((c) => c.type === 'gwang').length;
  if (sell && gwangs === 0) sell = false; // 광 없으면 못 팖

  p.decided.push(playerIdx);
  if (sell) {
    const pl = state.players[playerIdx];
    pl.folded = true;
    pl.active = false;
    pl.soldGwang = gwangs; // 광값 정산은 게임 종료 시
    state.events.push({ type: 'gwangSale', player: playerIdx, gwangs });
  }

  const folded = state.players.filter((pl) => pl.folded).length;
  if (folded === 1 || p.decided.length === 4) {
    // 아직 아무도 안 팔았고 전원 결정했으면: 마지막 광 보유자 강제 폴드, 광 보유자 없으면 마지막 순번 폴드
    if (folded === 0) {
      let idx = [...state.players.keys()].reverse().find((i) => state.players[i].hand.some((c) => c.type === 'gwang'));
      if (idx === undefined) idx = 3;
      state.players[idx].folded = true;
      state.players[idx].active = false;
      state.players[idx].soldGwang = state.players[idx].hand.filter((c) => c.type === 'gwang').length;
    }
    // 폴드된 손패는 덱에 섞고, 남은 3명이 표준 3인(7장)이 되도록 유지
    const foldedIdx = state.players.findIndex((pl) => pl.folded);
    state.deck = shuffle([...state.deck, ...state.players[foldedIdx].hand]);
    state.players[foldedIdx].hand = [];
    state.phase = 'play';
    state.pending = null;
    state.turn = state.players.findIndex((pl) => pl.active);
    checkChongtong(state);
  }
  return state;
}

// ── 흔들기 ────────────────────────────────────────────
export function declareShake(state, playerIdx, month) {
  const p = state.players[playerIdx];
  if (byMonth(p.hand, month).length < 3) throw new Error('흔들기 불가');
  p.shakeCount++;
  p.shookMonths = [...(p.shookMonths || []), month];
  state.events.push({ type: 'shake', player: playerIdx, month });
  return state;
}

// ── 폭탄: 손에 3장 + 바닥 1장 ─────────────────────────
export function playBomb(state, playerIdx, month) {
  const p = state.players[playerIdx];
  const handCards = byMonth(p.hand, month);
  const floorCards = byMonth(state.floor, month);
  if (handCards.length !== 3 || floorCards.length !== 1) throw new Error('폭탄 불가');

  p.hand = p.hand.filter((c) => c.month !== month);
  state.floor = state.floor.filter((c) => c.month !== month);
  p.captured.push(...handCards, ...floorCards);
  p.shakeCount++;
  p.bombPasses = (p.bombPasses || 0) + 2; // 이후 2턴은 손패 없이 패스 가능
  state.events.push({ type: 'bomb', player: playerIdx, month });
  stealPi(state, playerIdx);

  return flipPhase(state, playerIdx, null);
}

// ── 카드 내기 ─────────────────────────────────────────
// cardId: 낼 카드. bombPass면 cardId=null(폭탄 이후 손패 패스)
export function playCard(state, playerIdx, cardId, floorChoiceId = null) {
  if (state.phase !== 'play') throw new Error(`phase=${state.phase}`);
  if (state.turn !== playerIdx) throw new Error('not your turn');
  const p = state.players[playerIdx];

  if (cardId === null) {
    if (!(p.bombPasses > 0)) throw new Error('패스 불가');
    p.bombPasses--;
    return flipPhase(state, playerIdx, null);
  }

  const ci = p.hand.findIndex((c) => c.id === cardId);
  if (ci === -1) throw new Error('no card');
  const card = p.hand.splice(ci, 1)[0];
  const matches = byMonth(state.floor, card.month);

  if (matches.length === 0) {
    state.floor.push(card);
    state.events.push({ type: 'lay', player: playerIdx, card });
    return flipPhase(state, playerIdx, { laid: card });
  }
  if (matches.length === 1) {
    return flipPhase(state, playerIdx, { paired: [card, matches[0]] });
  }
  if (matches.length === 2) {
    if (!floorChoiceId) {
      state.phase = 'chooseFloorMatch';
      state.pending = { card, playerIdx, options: matches.map((c) => c.id) };
      return state;
    }
    const chosen = matches.find((c) => c.id === floorChoiceId);
    return flipPhase(state, playerIdx, { paired: [card, chosen], hadTwo: true, otherId: matches.find((c) => c.id !== floorChoiceId).id });
  }
  // 3장(뻑 무더기): 4장 전부 획득 + 피 뺏기(자뻑/뻑먹기)
  state.floor = state.floor.filter((c) => c.month !== card.month);
  const take = [card, ...matches];
  state.events.push({ type: 'eatPpeok', player: playerIdx, month: card.month });
  stealPi(state, playerIdx);
  state.ppeokMonths = state.ppeokMonths.filter((m) => m !== card.month);
  return flipPhase(state, playerIdx, { captured: take });
}

export function chooseFloorMatch(state, floorChoiceId) {
  if (state.phase !== 'chooseFloorMatch') throw new Error('bad phase');
  const { card, playerIdx } = state.pending;
  const matches = byMonth(state.floor, card.month);
  const chosen = matches.find((c) => c.id === floorChoiceId);
  if (!chosen) throw new Error('bad choice');
  state.phase = 'play';
  state.pending = null;
  return flipPhase(state, playerIdx, { paired: [card, chosen], hadTwo: true, otherId: matches.find((c) => c.id !== floorChoiceId)?.id });
}

// ── 더미 뒤집기 & 정산 ────────────────────────────────
function flipPhase(state, playerIdx, playResult) {
  const p = state.players[playerIdx];
  const flip = state.deck.pop();
  const toCapture = [];
  let gotJjok = false, gotTtadak = false, gotPpeok = false;

  if (playResult?.captured) toCapture.push(...playResult.captured);

  if (flip) {
    state.events.push({ type: 'flip', card: flip });
    const pairedMonth = playResult?.paired?.[0]?.month;

    if (playResult?.paired && flip.month === pairedMonth) {
      if (playResult.hadTwo) {
        // 따닥: 바닥 2장 중 하나 골랐는데 뒤집은 게 같은 월 → 4장 모두 획득 + 피
        const other = state.floor.find((c) => c.id === playResult.otherId);
        state.floor = state.floor.filter((c) => c.id !== playResult.otherId && c.id !== playResult.paired[1].id);
        toCapture.push(...playResult.paired, flip, ...(other ? [other] : []));
        gotTtadak = true;
      } else {
        // 뻑: 낸 카드+바닥 1장+뒤집은 카드 3장이 바닥에 남는다
        state.floor = state.floor.filter((c) => c.id !== playResult.paired[1].id);
        state.floor.push(playResult.paired[0], playResult.paired[1], flip);
        state.ppeokMonths.push(flip.month);
        gotPpeok = true;
        state.events.push({ type: 'ppeok', player: playerIdx, month: flip.month });
        if (state.rules.firstPpeok !== false && state.turnCount === undefined) {
          // 첫 턴 첫뻑 보너스는 아래 공통 처리
        }
        state.firstPpeokBonus[playerIdx] = (state.firstPpeokBonus[playerIdx] || 0) + 1;
      }
    } else {
      if (playResult?.paired) {
        // 낸 카드 매칭 확정
        state.floor = state.floor.filter((c) => c.id !== playResult.paired[1].id);
        toCapture.push(...playResult.paired);
      }
      // 뒤집은 카드 매칭
      const fm = byMonth(state.floor, flip.month);
      if (playResult?.laid && flip.month === playResult.laid.month) {
        // 쪽: 방금 놓은 카드에 붙음 → 둘 다 갖고 피 뺏기
        state.floor = state.floor.filter((c) => c.id !== playResult.laid.id);
        toCapture.push(playResult.laid, flip);
        gotJjok = true;
      } else if (fm.length === 0) {
        state.floor.push(flip);
      } else if (fm.length === 1) {
        state.floor = state.floor.filter((c) => c.id !== fm[0].id);
        toCapture.push(flip, fm[0]);
      } else if (fm.length === 2) {
        // 뒤집은 카드가 2장과 매칭 → 좋은 것 선택 (단순화: 쌍피>피>기타 우선 자동 선택)
        const pick = pickBest(fm);
        state.floor = state.floor.filter((c) => c.id !== pick.id);
        toCapture.push(flip, pick);
      } else {
        // 뒤집어서 뻑 무더기 먹기
        state.floor = state.floor.filter((c) => c.month !== flip.month);
        toCapture.push(flip, ...fm);
        state.ppeokMonths = state.ppeokMonths.filter((m) => m !== flip.month);
        stealPi(state, playerIdx);
      }
    }
  } else if (playResult?.paired) {
    state.floor = state.floor.filter((c) => c.id !== playResult.paired[1].id);
    toCapture.push(...playResult.paired);
  }

  p.captured.push(...toCapture);
  // 획득 연출용: 낸 카드 / 뒤집은 카드 / 딸려온 전체 카드를 기록
  if (toCapture.length > 0) {
    const played = playResult?.paired?.[0] || playResult?.laid || null;
    state.events.push({
      type: 'capture',
      player: playerIdx,
      cards: toCapture.map((c) => ({ ...c })),
      played: played ? { ...played } : null,
      flip: flip ? { ...flip } : null,
    });
  }
  if (gotJjok) { state.events.push({ type: 'jjok', player: playerIdx }); stealPi(state, playerIdx); }
  if (gotTtadak) { state.events.push({ type: 'ttadak', player: playerIdx }); stealPi(state, playerIdx); }

  // 쓸: 바닥을 비웠으면 피 뺏기
  if (toCapture.length > 0 && state.floor.length === 0 && state.deck.length > 0) {
    state.events.push({ type: 'sseul', player: playerIdx });
    stealPi(state, playerIdx);
  }

  state.turnCount = (state.turnCount || 0) + 1;

  // 종료/고스톱 판정
  return afterTurn(state, playerIdx);
}

function pickBest(cards) {
  const rank = (c) => (c.special === 'ssangpi' ? 4 : c.type === 'gwang' ? 3 : c.type === 'yeol' || c.type === 'tti' ? 2 : 1);
  return [...cards].sort((a, b) => rank(b) - rank(a))[0];
}

export function scoreOf(state, playerIdx) {
  const p = state.players[playerIdx];
  // 국진 쌍피 선택: 유리한 쪽 자동
  const a = baseScore(p.captured, { gukjinAsPi: false });
  const b = state.rules.gukjinAsPi !== false ? baseScore(p.captured, { gukjinAsPi: true }) : a;
  return b.score > a.score ? { ...b, gukjinAsPi: true } : { ...a, gukjinAsPi: false };
}

function afterTurn(state, playerIdx) {
  const p = state.players[playerIdx];
  const { score } = scoreOf(state, playerIdx);
  const target = state.rules.targetScore;

  if (score >= target && score > (p.lastGoScore || 0)) {
    state.phase = 'goStop';
    state.pending = { playerIdx, score };
    return state;
  }
  return advanceTurn(state, playerIdx);
}

function advanceTurn(state, playerIdx) {
  // 나가리: 모든 active 손패 소진
  const actives = state.players.filter((pl) => pl.active);
  if (actives.every((pl) => pl.hand.length === 0 && !(pl.bombPasses > 0))) {
    state.phase = 'finished';
    state.result = { type: 'nagari' };
    state.events.push({ type: 'nagari' });
    return state;
  }
  let next = playerIdx;
  do { next = (next + 1) % state.players.length; } while (!state.players[next].active);
  state.turn = next;
  state.phase = 'play';
  return state;
}

// ── 고 / 스톱 ─────────────────────────────────────────
export function declareGo(state) {
  if (state.phase !== 'goStop') throw new Error('bad phase');
  const { playerIdx, score } = state.pending;
  const p = state.players[playerIdx];
  p.goCount++;
  p.lastGoScore = score;
  p.wentGo = true;
  state.events.push({ type: 'go', player: playerIdx, count: p.goCount });
  state.pending = null;
  return advanceTurn(state, playerIdx);
}

export function declareStop(state) {
  if (state.phase !== 'goStop') throw new Error('bad phase');
  const { playerIdx } = state.pending;
  const winner = state.players[playerIdx];

  const losers = state.players
    .map((pl, i) => ({ pl, i }))
    .filter(({ pl, i }) => i !== playerIdx && pl.active)
    .map(({ pl, i }) => ({
      idx: i,
      captured: pl.captured,
      opts: pl.opts,
      goBak: !!pl.wentGo, // 고 했는데 남이 남 → 고박
    }));

  const result = finalScore(
    { captured: winner.captured, goCount: winner.goCount, shakeCount: winner.shakeCount, opts: { gukjinAsPi: scoreOf(state, playerIdx).gukjinAsPi } },
    losers,
    state.rules
  );

  state.phase = 'finished';
  state.result = {
    type: 'win',
    winner: playerIdx,
    score: result.score,
    detail: result.detail,
    payments: losers.map((l, k) => ({ player: l.idx, ...result.perLoser[k] })),
    firstPpeokBonus: state.firstPpeokBonus,
    soldGwang: state.players.map((pl) => pl.soldGwang || 0),
  };
  state.pending = null;
  state.events.push({ type: 'stop', player: playerIdx });
  return state;
}

// ── 도우미: 현재 플레이어가 가능한 액션 ───────────────
export function legalActions(state) {
  if (state.phase === 'finished') return [];
  if (state.phase === 'goStop') return [{ action: 'go' }, { action: 'stop' }];
  if (state.phase === 'chooseFloorMatch') {
    return state.pending.options.map((id) => ({ action: 'chooseFloorMatch', cardId: id }));
  }
  if (state.phase === 'gwangSale') {
    const undecided = [0, 1, 2, 3].filter((i) => !state.pending.decided.includes(i));
    return undecided.map((i) => ({ action: 'gwangSale', playerIdx: i }));
  }
  const p = state.players[state.turn];
  const acts = p.hand.map((c) => ({ action: 'play', cardId: c.id }));
  if (p.bombPasses > 0) acts.push({ action: 'play', cardId: null });
  // 폭탄 가능?
  const months = new Set(p.hand.map((c) => c.month));
  for (const m of months) {
    if (byMonth(p.hand, m).length === 3 && byMonth(state.floor, m).length === 1 && state.rules.bomb !== false) {
      acts.push({ action: 'bomb', month: m });
    }
    if (byMonth(p.hand, m).length === 3 && byMonth(state.floor, m).length === 0 && state.rules.heundeulgi !== false && !(p.shookMonths || []).includes(m)) {
      acts.push({ action: 'shake', month: m });
    }
  }
  return acts;
}
