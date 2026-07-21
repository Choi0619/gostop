import { tierOf, tierProgress } from '../game/rank';

// 티어 뱃지 (이모지 + 이름 + RP). size: 'sm' | 'md' | 'lg'
export default function RankBadge({ rp = 0, size = 'md', showProgress = false }) {
  const t = tierOf(rp);
  return (
    <span className={`rank-badge rank-${size}`} style={{ '--tier': t.color }}>
      <span className="rank-emoji">{t.emoji}</span>
      <span className="rank-text">
        <b style={{ color: t.color }}>{t.name}</b>
        <small>{rp} RP</small>
      </span>
      {showProgress && <TierBar rp={rp} />}
    </span>
  );
}

export function TierBar({ rp = 0 }) {
  const { next, pct, remain } = tierProgress(rp);
  return (
    <span className="tier-bar-wrap">
      <span className="tier-bar"><span className="tier-bar-fill" style={{ width: `${pct * 100}%` }} /></span>
      {next ? <small className="tier-remain">{next.emoji} {next.name}까지 {remain} RP</small> : <small className="tier-remain">최고 티어! 👑</small>}
    </span>
  );
}
