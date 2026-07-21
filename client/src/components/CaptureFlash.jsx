import HwatuCard from './HwatuCard';

// 획득 연출: 낸 카드 + 딸려온 카드가 가운데 모여 반짝 → 획득한 사람 쪽으로 날아감.
// event: { cards:[...], played, flip, player, _k }, mine: 내가 먹었는지
export default function CaptureFlash({ event, mine }) {
  if (!event) return null;
  const cards = event.cards || [];
  const playedId = event.played?.id;
  const flipId = event.flip?.id;

  return (
    <div className={`capture-flash ${mine ? 'to-me' : 'to-opp'}`} key={event._k}>
      <div className="cf-label">{mine ? '내가 먹음!' : '상대가 먹음'}</div>
      <div className="cf-cards">
        {cards.map((c, i) => {
          const role = c.id === playedId ? 'played' : c.id === flipId ? 'flip' : 'match';
          return (
            <span key={c.id} className={`cf-card cf-${role}`} style={{ animationDelay: `${i * 0.05}s` }}>
              <HwatuCard card={c} width={56} />
              {role === 'played' && <span className="cf-tag">낸 패</span>}
              {role === 'flip' && <span className="cf-tag">뒤집기</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
}
