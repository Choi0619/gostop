// 고스톱 점수 계산
// captured: 획득한 카드 배열, opts: { gukjinAsPi: 국진을 쌍피로 쓸지 여부(플레이어 선택) }

export function countPi(cards, { gukjinAsPi = false } = {}) {
  let pi = 0;
  for (const c of cards) {
    if (c.type === 'pi') pi += c.special === 'ssangpi' ? 2 : 1;
    else if (c.special === 'gukjin' && gukjinAsPi) pi += 2;
  }
  return pi;
}

export function countGwang(cards) {
  return cards.filter((c) => c.type === 'gwang');
}

export function countYeol(cards, { gukjinAsPi = false } = {}) {
  return cards.filter((c) => c.type === 'yeol' && !(c.special === 'gukjin' && gukjinAsPi));
}

export function countTti(cards) {
  return cards.filter((c) => c.type === 'tti');
}

// 기본 점수 (고/흔들기/박 배수 적용 전)
export function baseScore(captured, opts = {}) {
  const detail = [];
  let score = 0;

  // 광
  const gwang = countGwang(captured);
  if (gwang.length >= 3) {
    const hasBi = gwang.some((c) => c.special === 'bigwang');
    let s;
    if (gwang.length === 5) s = 15;
    else if (gwang.length === 4) s = 4;
    else s = hasBi ? 2 : 3; // 비광 포함 3광은 2점
    score += s;
    detail.push({ name: `${gwang.length}광${gwang.length === 3 && hasBi ? '(비광)' : ''}`, score: s });
  }

  // 열끗
  const yeol = countYeol(captured, opts);
  if (yeol.length >= 5) {
    const s = yeol.length - 4;
    score += s;
    detail.push({ name: `열끗 ${yeol.length}장`, score: s });
  }
  // 고도리
  const godori = yeol.filter((c) => c.godori);
  if (godori.length === 3) {
    score += 5;
    detail.push({ name: '고도리', score: 5 });
  }

  // 띠
  const tti = countTti(captured);
  if (tti.length >= 5) {
    const s = tti.length - 4;
    score += s;
    detail.push({ name: `띠 ${tti.length}장`, score: s });
  }
  for (const [color, name] of [['hong', '홍단'], ['cheong', '청단'], ['cho', '초단']]) {
    if (tti.filter((c) => c.ttiColor === color).length === 3) {
      score += 3;
      detail.push({ name, score: 3 });
    }
  }

  // 피
  const pi = countPi(captured, opts);
  if (pi >= 10) {
    const s = pi - 9;
    score += s;
    detail.push({ name: `피 ${pi}장`, score: s });
  }

  return { score, detail, pi, gwangCount: gwang.length, yeolCount: yeol.length };
}

// 최종 점수: 고 보너스, 멍따, 피박/광박/고박, 흔들기/폭탄 배수
// winner/losers: { captured, goCount, shakeCount(흔들기+폭탄 횟수) }
export function finalScore(winner, losers, rules = {}) {
  const { score: base, detail, pi, yeolCount } = baseScore(winner.captured, winner.opts);
  let score = base;

  // 고 보너스: 1고 +1, 2고 +2, 3고부터 2배씩
  const go = winner.goCount || 0;
  if (go === 1) score += 1;
  else if (go === 2) score += 2;
  else if (go >= 3) score = (score + 2) * Math.pow(2, go - 2);

  let mult = 1;
  const multDetail = [];

  // 멍따: 열끗 7장 이상
  if (rules.meongbak !== false && yeolCount >= 7) {
    mult *= 2;
    multDetail.push('멍따');
  }

  // 흔들기/폭탄: 횟수당 2배
  const shakes = winner.shakeCount || 0;
  if (shakes > 0) {
    mult *= Math.pow(2, shakes);
    multDetail.push(`흔들기/폭탄 x${shakes}`);
  }

  // 박 판정은 패자별로 적용
  const perLoser = losers.map((l) => {
    let m = mult;
    const bak = [];
    const lb = baseScore(l.captured, l.opts);
    const winnerScoredPi = detail.some((d) => d.name.startsWith('피'));
    const winnerScoredGwang = detail.some((d) => d.name.includes('광'));

    if (rules.pibak !== false && winnerScoredPi && lb.pi > 0 && lb.pi <= 5) {
      m *= 2;
      bak.push('피박');
    }
    if (rules.gwangbak !== false && winnerScoredGwang && lb.gwangCount === 0) {
      m *= 2;
      bak.push('광박');
    }
    // 고박: 고를 했다가 남이 나면 그 판 전체를 물어줌 (호출측에서 처리 플래그)
    if (l.goBak) {
      bak.push('고박');
    }
    return { payment: score * m, bak, multDetail };
  });

  return { base, detail, score, perLoser };
}
