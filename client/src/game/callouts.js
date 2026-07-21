// 이벤트별 멘트 (크게 띄우는 연출용). label=큰 글자, sub=아래 작은 멘트, variant=색상 테마
export const CALLOUTS = {
  ppeok: { label: '뻑!', sub: '아이고 이런...', variant: 'bad' },
  jjok: { label: '쪽!', sub: '착 붙었다!', variant: 'good' },
  ttadak: { label: '따닥!', sub: '두 장 한 번에!', variant: 'good' },
  sseul: { label: '쓸!', sub: '싹 쓸어버렸다!', variant: 'great' },
  eatPpeok: { label: '뻑 먹기!', sub: '무더기째 꿀꺽~', variant: 'great' },
  bomb: { label: '폭탄!', sub: 'three! 뻥이야!', variant: 'great' },
  shake: { label: '흔들기!', sub: '점수 두 배 간다', variant: 'good' },
  go: { label: 'GO!', sub: '멈출 수 없다!', variant: 'great' },
  stop: { label: 'STOP!', sub: '여기서 끝!', variant: 'good' },
  chongtong: { label: '총통!', sub: '같은 패 네 장, 즉시 승리!', variant: 'great' },
  nagari: { label: '나가리', sub: '이번 판은 무승부', variant: 'neutral' },
  stealPi: null, // 표시 안 함
};

// 여러 이벤트가 한 번에 나면 가장 임팩트 큰 것 하나만
const PRIORITY = ['chongtong', 'bomb', 'sseul', 'eatPpeok', 'ttadak', 'ppeok', 'jjok', 'shake', 'go', 'stop', 'nagari'];

export function pickCallout(events) {
  for (const t of PRIORITY) {
    if (events.some((e) => e.type === t)) return CALLOUTS[t];
  }
  return null;
}
