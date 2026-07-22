// 간단한 휴리스틱 AI (맞고용)
import { legalActions, scoreOf } from './engine.js';

const cardValue = (c) => {
  if (!c) return 0;
  if (c.special === 'ssangpi') return 4;
  if (c.type === 'gwang') return 5;
  if (c.godori) return 4;
  if (c.type === 'yeol' || c.type === 'tti') return 2.5;
  return 1;
};

const byMonth = (cards, m) => cards.filter((c) => c.month === m);

// 온라인용 간이 자동수: 서버 상태(st: {me:{hand,bombPasses}, floor})만으로 계산
export function pickAutoMove(st) {
  const hand = st.me?.hand || [];
  const floor = st.floor || [];
  if (hand.length === 0) {
    if (st.me?.bombPasses > 0) return { action: 'play', cardId: null };
    return null;
  }
  const floorByMonth = (m) => floor.filter((c) => c.month === m);
  let best = null, bestScore = -Infinity;
  for (const c of hand) {
    const matches = floorByMonth(c.month);
    let s;
    if (matches.length === 3) s = 12; // 뻑 먹기
    else if (matches.length > 0) s = 3 + Math.max(...matches.map(cardValue));
    else s = -cardValue(c); // 버리기: 가치 낮은 것 우선
    if (s > bestScore) { bestScore = s; best = c; }
  }
  return best ? { action: 'play', cardId: best.id } : null;
}

// 낼 카드 선택: 먹을 수 있는 것 중 가치 최대, 없으면 상대에게 덜 유리한 카드 버리기
export function chooseAction(state, playerIdx) {
  const acts = legalActions(state);

  if (state.phase === 'goStop') {
    // 고 판단: 덱이 넉넉하고 아직 고 안 했으면 한 번은 고
    const p = state.players[playerIdx];
    const go = p.goCount < 1 && state.deck.length >= 8;
    return { action: go ? 'go' : 'stop' };
  }

  if (state.phase === 'chooseFloorMatch') {
    const best = state.pending.options
      .map((id) => state.floor.find((c) => c.id === id))
      .sort((a, b) => cardValue(b) - cardValue(a))[0];
    return { action: 'chooseFloorMatch', cardId: best.id };
  }

  // 폭탄 최우선
  const bomb = acts.find((a) => a.action === 'bomb');
  if (bomb) return bomb;

  const p = state.players[playerIdx];
  const plays = acts.filter((a) => a.action === 'play');

  let best = null, bestScore = -Infinity;
  for (const a of plays) {
    const card = p.hand.find((c) => c.id === a.cardId) || null;
    let s;
    if (card === null) {
      s = 0.5; // 폭탄 패스
    } else {
      const matches = byMonth(state.floor, card.month);
      if (matches.length === 3) s = 10 + matches.reduce((n, c) => n + cardValue(c), 0); // 뻑 먹기
      else if (matches.length > 0) {
        const take = Math.max(...matches.map(cardValue));
        s = 2 + take + cardValue(card) * 0.3;
        // 뻑 위험: 남은 같은 월 카드가 덱에 있을 확률은 무시(단순화)
      } else {
        // 버리기: 가치 낮고, 같은 월을 내가 더 갖고 있으면 아깝지 않음
        const mine = byMonth(p.hand, card.month).length;
        s = -cardValue(card) + (mine > 1 ? 0.8 : 0);
      }
    }
    if (s > bestScore) { bestScore = s; best = a; }
  }
  return best;
}
