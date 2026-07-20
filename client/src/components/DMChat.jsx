import { useEffect, useRef, useState } from 'react';
import { api, getUser } from '../api';
import { getSocket } from '../socket';

// 친구 1:1 채팅 모달
export default function DMChat({ friend, onClose }) {
  const me = getUser();
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const logRef = useRef(null);

  useEffect(() => {
    api(`/api/dms/${friend.userId}`).then(setMsgs).catch(() => {});
    const s = getSocket();
    const onDm = (m) => {
      if (m.from_id === friend.userId) setMsgs((arr) => [...arr, m]);
    };
    s.on('dm', onDm);
    return () => s.off('dm', onDm);
  }, [friend.userId]);

  useEffect(() => { logRef.current?.scrollTo(0, 99999); }, [msgs]);

  const send = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    getSocket().emit('dm', { toUserId: friend.userId, text: t }, (r) => {
      if (r?.ok) setMsgs((arr) => [...arr, r.msg]);
    });
    setText('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal dm-modal" onClick={(e) => e.stopPropagation()}>
        <h2><span className="avatar-inline">{friend.avatar || '🐱'}</span> {friend.nickname}</h2>
        <div className="chat-log dm-log" ref={logRef}>
          {msgs.length === 0 && <p className="empty-hint">첫 메시지를 보내보세요!</p>}
          {msgs.map((m, i) => (
            <div key={i} className={`dm-bubble ${m.from_id === friend.userId ? 'theirs' : 'mine'}`}>
              {m.text}
              <span className="dm-time">{new Date(m.ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
        </div>
        <form className="friend-add" onSubmit={send}>
          <input placeholder="메시지..." value={text} onChange={(e) => setText(e.target.value)} autoFocus />
          <button className="menu-btn small primary">전송</button>
        </form>
        <div className="modal-actions center">
          <button className="menu-btn small" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}
