// 화투 카드: 앞면은 public/cards/의 실제 화투 SVG 이미지(itsent-lab/hwatu, MIT), 뒷면은 빨간 벡터 디자인.
const pad = (n) => String(n).padStart(2, '0');

// card.id = `${month}-${index}` (index 0~3) → /cards/m{월}-{인덱스+1}.svg
export function cardImage(card) {
  const [month, index] = card.id.split('-').map(Number);
  return `/cards/m${pad(month)}-${pad(index + 1)}.svg`;
}

export default function HwatuCard({ card, width = 80, faceDown = false, onClick, selected = false, dealt = false }) {
  const height = width * 1.5;
  const cls = `hwatu-card ${selected ? 'selected' : ''} ${dealt ? 'dealt' : ''}`;
  const style = { cursor: onClick ? 'pointer' : 'default', borderRadius: 6, width, height, display: 'block' };

  if (faceDown) {
    return (
      <svg width={width} height={height} viewBox="0 0 80 120" onClick={onClick} className={cls} style={style}>
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
    <img src={cardImage(card)} alt={card.label || card.id} width={width} height={height}
      onClick={onClick} className={cls} draggable={false}
      style={{ ...style, background: '#fffdf5', objectFit: 'cover', border: '1px solid #1a1a1a' }} />
  );
}
