// 랭크(RP)·티어 정의 — 서버/클라 공용
// 티어는 화투 테마 등급. RP는 0부터 시작, 이기면 +, 지면 - (0 미만 없음).

export const TIERS = [
  { key: 'chodan',  name: '초단',   emoji: '🌱', color: '#8d9e6a', min: 0 },
  { key: 'pi',      name: '피 수집가', emoji: '🃏', color: '#9aa5b1', min: 200 },
  { key: 'hongdan', name: '홍단',   emoji: '🎴', color: '#e5383b', min: 500 },
  { key: 'godori',  name: '고도리', emoji: '🐦', color: '#e09f3e', min: 1000 },
  { key: 'samgwang',name: '삼광',   emoji: '☀️', color: '#f4a259', min: 2000 },
  { key: 'ogwang',  name: '오광',   emoji: '🌟', color: '#ffd60a', min: 3500 },
  { key: 'tazza',   name: '타짜',   emoji: '👑', color: '#c77dff', min: 5500 },
];

export function tierOf(rp = 0) {
  let t = TIERS[0];
  for (const tier of TIERS) if (rp >= tier.min) t = tier;
  return t;
}

// 다음 티어까지 진행도 (0~1) + 남은 RP
export function tierProgress(rp = 0) {
  const cur = tierOf(rp);
  const idx = TIERS.indexOf(cur);
  const next = TIERS[idx + 1];
  if (!next) return { cur, next: null, pct: 1, remain: 0 };
  const span = next.min - cur.min;
  return { cur, next, pct: (rp - cur.min) / span, remain: next.min - rp };
}

// 판 종료 시 RP 증감 계산
// 승자: 기본 +20 + 점수 보너스(점수*2, 최대 +30). 패자: -12 (0 미만 방지는 호출측).
export function rpDelta({ won, score = 0 }) {
  if (won) return 20 + Math.min(score * 2, 30);
  return -12;
}
