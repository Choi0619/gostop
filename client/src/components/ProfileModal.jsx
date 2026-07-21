import { useEffect, useState } from 'react';
import { api } from '../api';
import RankBadge, { TierBar } from './RankBadge';

// 프로필 + 총 전적 + 최근 전적
export default function ProfileModal({ userId, onClose }) {
  const [data, setData] = useState(null);
  useEffect(() => { api(`/api/profile/${userId}`).then(setData).catch(() => {}); }, [userId]);

  if (!data) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal profile-modal" onClick={(e) => e.stopPropagation()}><p className="empty-hint">불러오는 중...</p></div>
      </div>
    );
  }

  const { user, history, rank } = data;
  const total = (user.wins || 0) + (user.losses || 0);
  const winrate = total ? Math.round((user.wins / total) * 100) : 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-head">
          <span className="profile-avatar">{user.avatar || '🐱'}</span>
          <div>
            <h2 style={{ margin: 0, textAlign: 'left' }}>{user.nickname}</h2>
            <RankBadge rp={user.rp || 0} size="sm" />
          </div>
          {rank && <span className="profile-rank">#{rank}</span>}
        </div>

        <TierBar rp={user.rp || 0} />

        <div className="profile-stats">
          <div className="stat"><b>{user.wins || 0}</b><span>승</span></div>
          <div className="stat"><b>{user.losses || 0}</b><span>패</span></div>
          <div className="stat"><b>{winrate}%</b><span>승률</span></div>
          <div className="stat"><b>{user.rp || 0}</b><span>RP</span></div>
        </div>

        <h3 className="profile-sub">최근 전적</h3>
        <div className="history-list">
          {history.length === 0 && <p className="empty-hint">아직 전적이 없어요</p>}
          {history.map((h, i) => (
            <div key={i} className={`history-row ${h.won ? 'win' : 'lose'}`}>
              <span className="hist-result">{h.won ? '승' : '패'}</span>
              <span className="hist-info">{h.players}인 · vs {h.opponents || '?'}</span>
              {h.won ? <span className="hist-score">{h.score}점</span> : <span />}
              <span className={`hist-rp ${h.rp_delta >= 0 ? 'up' : 'down'}`}>{h.rp_delta >= 0 ? '+' : ''}{h.rp_delta}</span>
            </div>
          ))}
        </div>

        <div className="modal-actions center">
          <button className="menu-btn small" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}
