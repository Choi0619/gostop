import { MONTHS } from '../game/cards';

// 한국식 화투 카드 SVG (비율 2:3, 기본 80x120)
export default function HwatuCard({ card, width = 80, faceDown = false, onClick, selected = false }) {
  const height = width * 1.5;

  if (faceDown) {
    return (
      <svg width={width} height={height} viewBox="0 0 80 120" onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default', borderRadius: 6 }}>
        <rect x="1" y="1" width="78" height="118" rx="6" fill="#b3001b" stroke="#7a0012" strokeWidth="2" />
        <rect x="8" y="8" width="64" height="104" rx="3" fill="none" stroke="#e63946" strokeWidth="1.5" />
        <circle cx="40" cy="60" r="16" fill="none" stroke="#e63946" strokeWidth="1.5" />
        <circle cx="40" cy="60" r="8" fill="#e63946" />
      </svg>
    );
  }

  const m = MONTHS[card.month];

  return (
    <svg width={width} height={height} viewBox="0 0 80 120" onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default', borderRadius: 6,
        filter: selected ? 'drop-shadow(0 0 6px #ffd60a)' : 'drop-shadow(1px 2px 3px rgba(0,0,0,0.4))',
        transform: selected ? 'translateY(-8px)' : 'none', transition: 'transform 0.15s',
      }}>
      <rect x="1" y="1" width="78" height="118" rx="6" fill="#fdf6e3" stroke="#333" strokeWidth="1.5" />

      {/* 월 표시 */}
      <text x="8" y="18" fontSize="11" fontWeight="bold" fill={m.color}>{card.month}</text>

      {/* 식물 모티브 (하단) */}
      <PlantMotif month={card.month} />

      {/* 타입별 요소 */}
      {card.type === 'gwang' && (
        <g>
          <circle cx="40" cy="45" r="17" fill={card.special === 'bigwang' ? '#495057' : '#e63946'} />
          <text x="40" y="52" fontSize="20" fontWeight="bold" fill="#ffd60a" textAnchor="middle">光</text>
        </g>
      )}
      {card.type === 'tti' && (
        <g>
          <rect x="26" y="28" width="28" height="42" rx="2"
            fill={card.ttiColor === 'hong' ? '#d00000' : card.ttiColor === 'cheong' ? '#023e8a' : card.ttiColor === 'cho' ? '#d00000' : '#adb5bd'} />
          {card.ttiColor === 'hong' && (
            <text x="40" y="55" fontSize="9" fill="#fff" textAnchor="middle" writingMode="vertical-rl">홍단</text>
          )}
          {card.ttiColor === 'cheong' && (
            <text x="40" y="55" fontSize="9" fill="#fff" textAnchor="middle" writingMode="vertical-rl">청단</text>
          )}
        </g>
      )}
      {card.type === 'yeol' && (
        <g>
          <ellipse cx="40" cy="45" rx="20" ry="13" fill={m.color} opacity="0.85" />
          <text x="40" y="49" fontSize="9" fontWeight="bold" fill="#fff" textAnchor="middle">{card.animal}</text>
        </g>
      )}
      {card.special === 'ssangpi' && (
        <text x="40" y="50" fontSize="12" fontWeight="bold" fill="#b3001b" textAnchor="middle">쌍피</text>
      )}
    </svg>
  );
}

// 월별 식물 간단 모티브
function PlantMotif({ month }) {
  const m = MONTHS[month];
  return (
    <g>
      <path d="M15 110 Q 25 85 40 95 Q 55 85 65 110" fill="none" stroke={m.color} strokeWidth="3" strokeLinecap="round" />
      <circle cx="25" cy="96" r="4" fill={m.color} />
      <circle cx="40" cy="92" r="4" fill={m.color} />
      <circle cx="55" cy="96" r="4" fill={m.color} />
      <text x="40" y="87" fontSize="8" fill={m.color} textAnchor="middle">{m.name}</text>
    </g>
  );
}
