import { baseScore, countPi } from '../game/score';

// 실시간 점수 내역 + 목표 게이지 + 다음 점수 힌트
export default function ScorePanel({ captured, target = 7, gukjinAsPi = false }) {
  const { score, detail, pi } = baseScore(captured, { gukjinAsPi });

  // 다음 점수까지 힌트
  const hints = [];
  const gwang = captured.filter((c) => c.type === 'gwang').length;
  const yeol = captured.filter((c) => c.type === 'yeol').length;
  const tti = captured.filter((c) => c.type === 'tti').length;
  if (gwang === 2) hints.push('광 1장 더 → 3점');
  if (yeol >= 4 && yeol < 7) hints.push(`열끗 ${5 - Math.min(yeol, 5) || 1}장 더`);
  if (tti === 4) hints.push('띠 1장 더 → 1점');
  if (pi >= 8 && pi < 10) hints.push(`피 ${10 - pi}장 더 → 1점`);

  const pct = Math.min(100, (score / target) * 100);
  const almost = target - score;

  return (
    <div className="score-panel">
      <div className="score-head">
        <span className="score-big">{score}<small>점</small></span>
        {score > 0 && score < target && almost <= 2 && <span className="score-almost">{almost}점만 더!</span>}
      </div>
      <div className="score-gauge">
        <div className="score-gauge-fill" style={{ width: `${pct}%` }} />
        <span className="score-gauge-label">목표 {target}점</span>
      </div>
      {detail.length > 0 && (
        <div className="score-detail">
          {detail.map((d, i) => (
            <span key={i} className="score-chip">{d.name} <b>{d.score}</b></span>
          ))}
        </div>
      )}
      {hints.length > 0 && score < target && (
        <div className="score-hint">💡 {hints[0]}</div>
      )}
    </div>
  );
}
