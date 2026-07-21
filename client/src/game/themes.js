// 테마 정의 — 게임판(felt) 색, 카드 뒷면, 강조색(accent). 서버/클라 공용.
// unlock: 해금 조건(wins). 0이면 기본 제공.

export const THEMES = {
  classic: {
    name: '전통 초록', emoji: '🟢', unlock: 0,
    felt1: '#17601f', felt2: '#0b3a12', felt3: '#062408',
    accent: '#ffd60a', back: '#a4161a', backLine: '#e5383b',
  },
  navy: {
    name: '심야 남색', emoji: '🔵', unlock: 0,
    felt1: '#1b3a5c', felt2: '#0d1f38', felt3: '#060f1e',
    accent: '#4fc3f7', back: '#12395c', backLine: '#4fc3f7',
  },
  wood: {
    name: '원목 우드', emoji: '🟤', unlock: 0,
    felt1: '#6b4423', felt2: '#432b16', felt3: '#2a1a0d',
    accent: '#f4a259', back: '#7a3b12', backLine: '#e09f3e',
  },
  ink: {
    name: '먹빛 흑', emoji: '⚫', unlock: 0,
    felt1: '#2b2b2f', felt2: '#18181b', felt3: '#0c0c0e',
    accent: '#e5c07b', back: '#3a3a3f', backLine: '#8d99ae',
  },
  wine: {
    name: '자주 와인', emoji: '🟣', unlock: 0,
    felt1: '#5a1a3a', felt2: '#360f22', felt3: '#1f0813',
    accent: '#ff8fab', back: '#6a1a3a', backLine: '#ff8fab',
  },
  sakura: {
    name: '벚꽃 사쿠라', emoji: '🌸', unlock: 3,
    felt1: '#8c4a6b', felt2: '#5c2b46', felt3: '#3a1a2c',
    accent: '#ffb3c1', back: '#c9184a', backLine: '#ffb3c1',
    petals: true, // 꽃잎 흩날림 효과
  },
};

export const THEME_LIST = Object.entries(THEMES).map(([key, t]) => ({ key, ...t }));

export function getTheme(key) { return THEMES[key] || THEMES.classic; }

// 테마를 문서 루트 CSS 변수로 적용
export function applyTheme(key) {
  const t = getTheme(key);
  const r = document.documentElement.style;
  r.setProperty('--felt1', t.felt1);
  r.setProperty('--felt2', t.felt2);
  r.setProperty('--felt3', t.felt3);
  r.setProperty('--accent', t.accent);
  r.setProperty('--card-back', t.back);
  r.setProperty('--card-back-line', t.backLine);
  document.documentElement.dataset.theme = key;
  window.dispatchEvent(new CustomEvent('themechange', { detail: key }));
}
