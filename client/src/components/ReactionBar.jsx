import { useEffect, useState } from 'react';
import { getSocket } from '../socket';

const EMOJIS = ['👍', '😂', '😡', '🥳', '😱', '💢', '🙏', '😴'];

// 인게임 이모티콘: 보내기 바 + 떠오르는 리액션 표시
export default function ReactionBar() {
  const [floats, setFloats] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const s = getSocket();
    const onReaction = (r) => {
      const id = r.ts + r.nickname;
      setFloats((f) => [...f, { ...r, id, x: 15 + Math.random() * 70 }]);
      setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 2600);
    };
    s.on('reaction', onReaction);
    return () => s.off('reaction', onReaction);
  }, []);

  return (
    <>
      <div className={`reaction-bar ${open ? 'open' : ''}`}>
        <button className="reaction-toggle" onClick={() => setOpen(!open)}>😊</button>
        {open && EMOJIS.map((e) => (
          <button key={e} className="reaction-btn"
            onClick={() => { getSocket().emit('reaction', { emoji: e }); setOpen(false); }}>
            {e}
          </button>
        ))}
      </div>
      <div className="reaction-floats">
        {floats.map((f) => (
          <div key={f.id} className="reaction-float" style={{ left: `${f.x}%` }}>
            <span className="reaction-emoji">{f.emoji}</span>
            <span className="reaction-who">{f.avatar} {f.nickname}</span>
          </div>
        ))}
      </div>
    </>
  );
}
