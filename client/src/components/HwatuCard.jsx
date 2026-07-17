import { MONTHS } from '../game/cards';

// 한국식 화투 카드 SVG (비율 2:3, viewBox 80x120)
// 실제 화투 도안을 참고해 월별 그림을 벡터로 그린다.
export default function HwatuCard({ card, width = 80, faceDown = false, onClick, selected = false, dealt = false }) {
  const height = width * 1.5;

  if (faceDown) {
    return (
      <svg width={width} height={height} viewBox="0 0 80 120" onClick={onClick}
        className={`hwatu-card ${dealt ? 'dealt' : ''}`}
        style={{ cursor: onClick ? 'pointer' : 'default', borderRadius: 6 }}>
        <rect x="1" y="1" width="78" height="118" rx="6" fill="#a4161a" stroke="#660708" strokeWidth="2" />
        <rect x="7" y="7" width="66" height="106" rx="4" fill="none" stroke="#e5383b" strokeWidth="1.2" />
        <g opacity="0.9">
          <circle cx="40" cy="60" r="18" fill="none" stroke="#e5383b" strokeWidth="1.5" />
          <path d="M40 46 Q 48 54 40 60 Q 32 66 40 74" fill="none" stroke="#e5383b" strokeWidth="2" strokeLinecap="round" />
          <circle cx="40" cy="52" r="2.5" fill="#e5383b" />
          <circle cx="40" cy="68" r="2.5" fill="#e5383b" />
        </g>
      </svg>
    );
  }

  return (
    <svg width={width} height={height} viewBox="0 0 80 120" onClick={onClick}
      className={`hwatu-card ${selected ? 'selected' : ''} ${dealt ? 'dealt' : ''}`}
      style={{ cursor: onClick ? 'pointer' : 'default', borderRadius: 6 }}>
      <defs>
        <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fffdf5" />
          <stop offset="1" stopColor="#f5eeda" />
        </linearGradient>
        <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.7" stopColor="#e5383b" />
          <stop offset="1" stopColor="#ba181b" />
        </radialGradient>
        <radialGradient id="moon" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.6" stopColor="#fff3b0" />
          <stop offset="1" stopColor="#e09f3e" />
        </radialGradient>
      </defs>
      <rect x="1" y="1" width="78" height="118" rx="6" fill="#1a1a1a" />
      <rect x="3.5" y="3.5" width="73" height="113" rx="4" fill="url(#paper)" />
      <Face card={card} />
    </svg>
  );
}

function Face({ card }) {
  return (
    <g>
      <MonthArt month={card.month} type={card.type} special={card.special} />
      {card.type === 'gwang' && <GwangBadge dark={card.special === 'bigwang'} />}
      {card.type === 'tti' && <Ribbon color={card.ttiColor} />}
      {card.type === 'yeol' && <Animal card={card} />}
      {card.special === 'ssangpi' && (
        <g>
          <rect x="46" y="8" width="26" height="14" rx="3" fill="#a4161a" />
          <text x="59" y="19" fontSize="10" fontWeight="bold" fill="#fff" textAnchor="middle">쌍피</text>
        </g>
      )}
      <text x="9" y="16" fontSize="10" fontWeight="900" fill="#333">{card.month}</text>
    </g>
  );
}

function GwangBadge({ dark }) {
  return (
    <g>
      <circle cx="17" cy="103" r="11" fill={dark ? '#343a40' : '#ba181b'} stroke="#1a1a1a" strokeWidth="1" />
      <text x="17" y="108.5" fontSize="14" fontWeight="bold" fill="#ffd60a" textAnchor="middle">光</text>
    </g>
  );
}

function Ribbon({ color }) {
  const fill = color === 'cheong' ? '#14417b' : color === 'plain' ? '#8d5524' : '#c1121f';
  const label = color === 'hong' ? '홍단' : color === 'cheong' ? '청단' : null;
  return (
    <g>
      <path d="M24 30 L 56 34 L 55 78 L 23 74 Z" fill={fill} stroke="#7f0e14" strokeWidth="0.5" opacity="0.95" />
      <path d="M24 30 L 20 24 L 26 27 Z" fill={fill} />
      {label && (
        <text x="40" y="58" fontSize="10" fontWeight="bold" fill="#fff" textAnchor="middle"
          style={{ writingMode: 'vertical-rl' }}>{label}</text>
      )}
    </g>
  );
}

// ── 월별 배경 그림 ───────────────────────────────────────
function MonthArt({ month, type, special }) {
  switch (month) {
    case 1: return <Pine gwang={type === 'gwang'} />;
    case 2: return <Plum />;
    case 3: return <Cherry gwang={type === 'gwang'} />;
    case 4: return <Wisteria />;
    case 5: return <Iris />;
    case 6: return <Peony />;
    case 7: return <BushClover />;
    case 8: return <Moon gwang={type === 'gwang'} />;
    case 9: return <Chrysanthemum />;
    case 10: return <Maple />;
    case 11: return <Paulownia gwang={type === 'gwang'} />;
    case 12: return <Rain gwang={type === 'gwang'} special={special} />;
    default: return null;
  }
}

// 1월 송학: 소나무 + (광이면 학과 해)
function Pine({ gwang }) {
  return (
    <g>
      {gwang && <circle cx="55" cy="25" r="13" fill="url(#sun)" />}
      <path d="M10 118 Q 14 80 22 60 Q 26 48 24 38" fill="none" stroke="#5c4d3c" strokeWidth="5" strokeLinecap="round" />
      <g fill="#2d6a4f">
        <path d="M8 55 Q 24 30 42 48 Q 30 58 8 55" />
        <path d="M14 78 Q 32 58 50 74 Q 34 84 14 78" />
        <path d="M6 98 Q 26 82 44 96 Q 28 106 6 98" />
      </g>
      {gwang && (
        <g>
          <ellipse cx="52" cy="78" rx="14" ry="10" fill="#fff" stroke="#333" strokeWidth="1" />
          <path d="M62 72 Q 70 62 66 52" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="66" cy="51" r="3.5" fill="#fff" stroke="#333" strokeWidth="1" />
          <path d="M69 50 L 75 52 L 69 54 Z" fill="#e09f3e" />
          <circle cx="66" cy="50" r="0.9" fill="#111" />
          <circle cx="67" cy="49" r="1.8" fill="#c1121f" opacity="0.85" />
          <path d="M44 82 Q 40 90 44 96 M 52 84 Q 50 92 54 97" stroke="#333" strokeWidth="1.5" fill="none" />
          <path d="M42 76 Q 50 70 60 74" fill="#495057" opacity="0.6" />
        </g>
      )}
    </g>
  );
}

// 2월 매조: 매화 가지
function Plum() {
  return (
    <g>
      <path d="M70 118 Q 60 84 40 66 Q 28 54 30 40" fill="none" stroke="#5c4d3c" strokeWidth="4" strokeLinecap="round" />
      {[[32, 44], [44, 62], [56, 84], [40, 78], [62, 100]].map(([x, y], i) => (
        <g key={i}>
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={x + 4.5 * Math.cos((a * Math.PI) / 180)} cy={y + 4.5 * Math.sin((a * Math.PI) / 180)} r="3.2" fill="#e5383b" />
          ))}
          <circle cx={x} cy={y} r="2" fill="#ffd60a" />
        </g>
      ))}
    </g>
  );
}

// 3월 벚꽃: 벚나무 + (광이면 장막)
function Cherry({ gwang }) {
  return (
    <g>
      {[[24, 36], [40, 28], [56, 40], [30, 56], [50, 58], [40, 44]].map(([x, y], i) => (
        <g key={i}>
          {[36, 108, 180, 252, 324].map((a) => (
            <ellipse key={a} cx={x + 5 * Math.cos((a * Math.PI) / 180)} cy={y + 5 * Math.sin((a * Math.PI) / 180)}
              rx="3.6" ry="2.8" fill="#ffb3c1" />
          ))}
          <circle cx={x} cy={y} r="1.8" fill="#c9184a" />
        </g>
      ))}
      {gwang && (
        <g>
          <path d="M6 74 Q 40 66 74 74 L 74 112 Q 40 104 6 112 Z" fill="#9d4edd" opacity="0.9" />
          <path d="M6 74 Q 40 66 74 74" fill="none" stroke="#5a189a" strokeWidth="2.5" />
          {[16, 30, 44, 58].map((x) => (
            <path key={x} d={`M${x} 76 Q ${x + 3} 92 ${x} 108`} stroke="#c77dff" strokeWidth="2" fill="none" />
          ))}
        </g>
      )}
    </g>
  );
}

// 4월 흑싸리(등나무)
function Wisteria() {
  return (
    <g>
      <path d="M20 10 Q 34 40 30 118" fill="none" stroke="#3c2f2f" strokeWidth="4" strokeLinecap="round" />
      {[[40, 34], [52, 52], [46, 76], [58, 96]].map(([x, y], i) => (
        <path key={i} d={`M${x - 8} ${y} Q ${x} ${y - 12} ${x + 8} ${y} Q ${x} ${y + 14} ${x - 8} ${y}`} fill="#3f3d56" />
      ))}
    </g>
  );
}

// 5월 난초(제비붓꽃)
function Iris() {
  return (
    <g>
      {[[24, 0], [38, -6], [52, 2], [32, 6], [46, 8]].map(([x, dy], i) => (
        <path key={i} d={`M${x} ${118 + dy} Q ${x - 6} ${70 + dy} ${x + 2} ${34 + dy}`} fill="none" stroke="#2d6a4f" strokeWidth="3.5" strokeLinecap="round" />
      ))}
      {[[26, 34], [48, 28]].map(([x, y], i) => (
        <g key={i}>
          <path d={`M${x} ${y} Q ${x - 8} ${y - 10} ${x - 4} ${y - 16} Q ${x + 2} ${y - 8} ${x} ${y}`} fill="#7209b7" />
          <path d={`M${x} ${y} Q ${x + 8} ${y - 10} ${x + 4} ${y - 16} Q ${x - 2} ${y - 8} ${x} ${y}`} fill="#9d4edd" />
        </g>
      ))}
    </g>
  );
}

// 6월 모란
function Peony() {
  return (
    <g>
      <path d="M40 118 Q 38 90 40 72" fill="none" stroke="#2d6a4f" strokeWidth="3.5" />
      <path d="M40 96 Q 24 92 18 100 M 40 88 Q 56 84 62 92" fill="none" stroke="#2d6a4f" strokeWidth="3" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <ellipse key={a} cx={40 + 13 * Math.cos((a * Math.PI) / 180)} cy={52 + 13 * Math.sin((a * Math.PI) / 180)}
          rx="9" ry="7" fill="#c1121f" />
      ))}
      <circle cx="40" cy="52" r="7" fill="#e5383b" />
      <circle cx="40" cy="52" r="3" fill="#ffd60a" />
    </g>
  );
}

// 7월 홍싸리
function BushClover() {
  return (
    <g>
      {[[22, 4], [36, -4], [50, 4], [60, 12]].map(([x, dy], i) => (
        <path key={i} d={`M${x} 118 Q ${x - 4} ${80 + dy} ${x + 6} ${40 + dy}`} fill="none" stroke="#9d0208" strokeWidth="3" strokeLinecap="round" />
      ))}
      {[[28, 52], [42, 40], [56, 52], [34, 72], [50, 68], [26, 90], [58, 86]].map(([x, y], i) => (
        <g key={i} fill="#9d0208">
          <ellipse cx={x - 4} cy={y} rx="4" ry="2.6" />
          <ellipse cx={x + 4} cy={y} rx="4" ry="2.6" />
          <ellipse cx={x} cy={y - 5} rx="2.6" ry="4" />
        </g>
      ))}
    </g>
  );
}

// 8월 공산: 보름달 + 산 능선 (광), 아니면 억새 언덕
function Moon({ gwang }) {
  return (
    <g>
      {gwang ? (
        <g>
          <rect x="3.5" y="3.5" width="73" height="113" rx="4" fill="#212529" />
          <circle cx="40" cy="42" r="20" fill="url(#moon)" />
          <path d="M3.5 92 Q 25 70 45 88 Q 62 100 76.5 90 L 76.5 116.5 L 3.5 116.5 Z" fill="#495057" />
          <path d="M3.5 100 Q 30 86 55 100 Q 68 106 76.5 102 L 76.5 116.5 L 3.5 116.5 Z" fill="#343a40" />
        </g>
      ) : (
        <g>
          <path d="M3.5 84 Q 30 68 55 84 Q 68 92 76.5 86 L 76.5 116.5 L 3.5 116.5 Z" fill="#6c757d" opacity="0.5" />
          {[14, 26, 38, 50, 62].map((x) => (
            <path key={x} d={`M${x} 112 Q ${x + 2} 84 ${x - 2} 62 M${x - 2} 62 Q ${x + 6} 58 ${x + 8} 50`} stroke="#8d99ae" strokeWidth="2" fill="none" strokeLinecap="round" />
          ))}
        </g>
      )}
    </g>
  );
}

// 9월 국진: 국화
function Chrysanthemum() {
  return (
    <g>
      <path d="M40 118 Q 40 96 40 80" stroke="#2d6a4f" strokeWidth="3.5" fill="none" />
      <path d="M40 100 Q 26 96 20 104 M 40 92 Q 54 88 60 96" stroke="#2d6a4f" strokeWidth="3" fill="none" />
      {[...Array(16)].map((_, i) => {
        const a = (i * 22.5 * Math.PI) / 180;
        return <ellipse key={i} cx={40 + 12 * Math.cos(a)} cy={56 + 12 * Math.sin(a)} rx="7" ry="3.4"
          fill="#ffd60a" stroke="#e09f3e" strokeWidth="0.5" />;
      })}
      <circle cx="40" cy="56" r="6" fill="#e09f3e" />
    </g>
  );
}

// 10월 단풍
function Maple() {
  return (
    <g>
      <path d="M64 118 Q 56 84 40 64 Q 30 52 32 36" fill="none" stroke="#5c4d3c" strokeWidth="4" strokeLinecap="round" />
      {[[30, 40], [46, 58], [56, 82], [36, 70], [62, 102], [24, 58]].map(([x, y], i) => (
        <path key={i} fill={i % 2 ? '#e85d04' : '#bc3908'}
          d={`M${x} ${y - 7} L ${x + 2.5} ${y - 2} L ${x + 7} ${y - 3.5} L ${x + 4} ${y + 1} L ${x + 5.5} ${y + 6} L ${x} ${y + 3} L ${x - 5.5} ${y + 6} L ${x - 4} ${y + 1} L ${x - 7} ${y - 3.5} L ${x - 2.5} ${y - 2} Z`} />
      ))}
    </g>
  );
}

// 11월 오동: 오동잎 + (광이면 봉황)
function Paulownia({ gwang }) {
  return (
    <g>
      <g fill="#1b4332">
        <path d="M18 96 Q 12 76 26 68 Q 42 62 46 78 Q 48 94 34 100 Q 24 104 18 96" />
        <path d="M44 108 Q 40 92 54 86 Q 68 82 70 96 Q 70 110 56 113 Q 48 114 44 108" />
      </g>
      {[[30, 62], [58, 80]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="2.4" fill="#ffd60a" />
          <circle cx={x + 6} cy={y - 3} r="2.4" fill="#ffd60a" />
          <circle cx={x + 3} cy={y - 8} r="2.4" fill="#ffd60a" />
        </g>
      ))}
      {gwang && (
        <g>
          <path d="M26 20 Q 44 10 58 22 Q 66 30 60 40 Q 52 34 44 38 Q 34 42 26 34 Q 20 26 26 20" fill="#087e8b" />
          <circle cx="52" cy="24" r="1.5" fill="#111" />
          <path d="M58 26 L 66 28 L 59 31 Z" fill="#e09f3e" />
          <path d="M28 18 Q 20 8 10 10 M 32 16 Q 28 6 18 4" stroke="#087e8b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}

// 12월 비: 비광(우산 쓴 사람+개구리), 그 외 버들+빗줄기
function Rain({ gwang }) {
  return (
    <g>
      <path d="M12 8 Q 16 50 14 118 M 30 6 Q 36 54 32 118" stroke="#606c38" strokeWidth="2.5" fill="none" opacity="0.7" />
      {[20, 44, 58, 70].map((x) => (
        <path key={x} d={`M${x} 10 L ${x - 6} 118`} stroke="#7d8597" strokeWidth="1.4" opacity="0.55" />
      ))}
      {gwang && (
        <g>
          <path d="M28 46 Q 48 28 68 46 L 48 46 Z" fill="#495057" />
          <path d="M48 34 L 48 50" stroke="#333" strokeWidth="2" />
          <ellipse cx="48" cy="58" rx="7" ry="8" fill="#fdf0d5" />
          <path d="M40 66 Q 48 60 58 66 L 60 100 Q 48 106 38 100 Z" fill="#e09f3e" />
          <path d="M38 100 L 36 116 M 58 100 L 60 116" stroke="#333" strokeWidth="3" strokeLinecap="round" />
          <circle cx="46" cy="57" r="1" fill="#111" />
          <circle cx="51" cy="57" r="1" fill="#111" />
          <ellipse cx="16" cy="110" rx="6" ry="4.5" fill="#588157" />
          <circle cx="13" cy="106" r="1.6" fill="#588157" />
          <circle cx="19" cy="106" r="1.6" fill="#588157" />
        </g>
      )}
    </g>
  );
}

// 열끗 동물
function Animal({ card }) {
  switch (card.month) {
    case 2: return <Bird x={46} y={44} body="#ffd60a" wing="#e09f3e" />;
    case 4: return <Bird x={50} y={40} body="#8d99ae" wing="#495057" />;
    case 5: // 다리(야츠하시)
      return (
        <g>
          <path d="M4 70 L 40 60 L 76 74 L 76 82 L 40 68 L 4 78 Z" fill="#8d5524" stroke="#5c4d3c" strokeWidth="1" />
          <path d="M14 70 L 14 84 M 34 64 L 34 78 M 56 70 L 56 84" stroke="#5c4d3c" strokeWidth="2.5" />
        </g>
      );
    case 6: // 나비
      return (
        <g>
          <g fill="#f77f00">
            <ellipse cx="34" cy="26" rx="8" ry="6" />
            <ellipse cx="50" cy="26" rx="8" ry="6" />
            <ellipse cx="35" cy="36" rx="6" ry="4.5" />
            <ellipse cx="49" cy="36" rx="6" ry="4.5" />
          </g>
          <ellipse cx="42" cy="30" rx="2" ry="7" fill="#333" />
          <path d="M40 24 Q 37 19 34 18 M 44 24 Q 47 19 50 18" stroke="#333" strokeWidth="1" fill="none" />
        </g>
      );
    case 7: // 멧돼지
      return (
        <g>
          <ellipse cx="42" cy="94" rx="18" ry="11" fill="#6f4518" />
          <circle cx="58" cy="90" r="7" fill="#6f4518" />
          <path d="M63 88 L 68 90 L 63 93 Z" fill="#a47148" />
          <circle cx="59" cy="88" r="1.1" fill="#111" />
          <path d="M30 103 L 29 110 M 38 105 L 38 112 M 48 105 L 48 112 M 55 102 L 56 109" stroke="#4a2e14" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    case 8: // 기러기 세 마리
      return (
        <g fill="#333">
          {[[28, 26], [46, 18], [58, 32]].map(([x, y], i) => (
            <path key={i} d={`M${x - 8} ${y} Q ${x - 3} ${y - 6} ${x} ${y - 1} Q ${x + 3} ${y - 6} ${x + 8} ${y} Q ${x + 3} ${y - 2} ${x} ${y + 2} Q ${x - 3} ${y - 2} ${x - 8} ${y}`} />
          ))}
        </g>
      );
    case 9: // 국진 술잔
      return (
        <g>
          <path d="M28 40 L 52 40 L 48 56 Q 40 60 32 56 Z" fill="#c1121f" stroke="#7f0e14" strokeWidth="1" />
          <path d="M36 60 L 44 60 L 45 66 L 35 66 Z" fill="#c1121f" />
          <text x="40" y="52" fontSize="9" fontWeight="bold" fill="#ffd60a" textAnchor="middle">壽</text>
        </g>
      );
    case 10: // 사슴
      return (
        <g>
          <ellipse cx="40" cy="92" rx="15" ry="10" fill="#a47148" />
          <path d="M52 88 Q 56 78 54 72" stroke="#a47148" strokeWidth="5" strokeLinecap="round" fill="none" />
          <circle cx="55" cy="70" r="5" fill="#a47148" />
          <path d="M57 66 Q 60 58 66 56 M 57 66 Q 62 62 66 62" stroke="#6f4518" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <circle cx="56.5" cy="69" r="1" fill="#111" />
          <path d="M30 100 L 29 110 M 38 102 L 38 111 M 46 102 L 46 111 M 52 99 L 53 108" stroke="#6f4518" strokeWidth="2.4" strokeLinecap="round" />
          {[34, 42, 48].map((x, i) => <circle key={i} cx={x} cy={88 + (i % 2) * 5} r="1.4" fill="#fdf0d5" />)}
        </g>
      );
    case 12: return <Bird x={44} y={40} body="#14417b" wing="#0b2545" swallow />;
    default: return null;
  }
}

function Bird({ x, y, body, wing, swallow = false }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx="11" ry="7" fill={body} />
      <path d={`M${x - 4} ${y - 2} Q ${x - 12} ${y - 12} ${x - 18} ${y - 8} Q ${x - 10} ${y - 2} ${x - 4} ${y + 2}`} fill={wing} />
      <circle cx={x + 9} cy={y - 4} r="4" fill={body} />
      <path d={`M${x + 12.5} ${y - 5} L ${x + 18} ${y - 4} L ${x + 12.5} ${y - 2.5} Z`} fill="#e09f3e" />
      <circle cx={x + 10} cy={y - 5} r="0.9" fill="#111" />
      {swallow
        ? <path d={`M${x - 10} ${y + 2} L ${x - 20} ${y + 10} M ${x - 10} ${y + 3} L ${x - 18} ${y + 14}`} stroke={wing} strokeWidth="2" strokeLinecap="round" />
        : <path d={`M${x - 10} ${y + 2} L ${x - 17} ${y + 7}`} stroke={wing} strokeWidth="3" strokeLinecap="round" />}
    </g>
  );
}
