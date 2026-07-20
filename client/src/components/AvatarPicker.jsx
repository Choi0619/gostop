import { useState } from 'react';
import { api, getUser, saveAuth, getToken } from '../api';

const AVATARS = ['🐱', '🐶', '🐰', '🦊', '🐯', '🐻', '🐸', '🐢', '🦅', '🐗', '🦌', '🐦', '🦄'];
// 화투 동물 테마 해금: 멧돼지(7월)·사슴(10월)·기러기(8월)·꾀꼬리(고도리)
const UNLOCKS = { '🐢': 3, '🦅': 7, '🐗': 12, '🦌': 20, '🐦': 30, '🦄': 50 };
const NAMES = {
  '🐱': '나비', '🐶': '백구', '🐰': '토끼', '🦊': '여우', '🐯': '호랑이', '🐻': '곰돌이', '🐸': '개구리',
  '🐢': '거북이', '🦅': '기러기', '🐗': '멧돼지', '🦌': '사슴', '🐦': '꾀꼬리', '🦄': '유니콘',
};

export default function AvatarPicker({ wins = 0, onClose, onChange }) {
  const user = getUser();
  const [error, setError] = useState('');

  const pick = async (avatar) => {
    try {
      await api('/api/avatar', { method: 'POST', body: { avatar } });
      saveAuth(getToken(), { ...user, avatar });
      onChange?.(avatar);
      onClose();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>🎭 캐릭터 선택</h2>
        <p className="empty-hint">승리하면 새 캐릭터가 열려요! (현재 {wins}승)</p>
        <div className="avatar-grid">
          {AVATARS.map((a) => {
            const need = UNLOCKS[a] || 0;
            const locked = wins < need;
            const mine = user?.avatar === a;
            return (
              <button key={a} className={`avatar-cell ${mine ? 'mine' : ''} ${locked ? 'locked' : ''}`}
                onClick={() => !locked && pick(a)} title={NAMES[a]}>
                <span className="avatar-emoji">{a}</span>
                <span className="avatar-name">{locked ? `🔒 ${need}승` : NAMES[a]}</span>
              </button>
            );
          })}
        </div>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions center">
          <button className="menu-btn small" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}
