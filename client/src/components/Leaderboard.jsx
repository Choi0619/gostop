import { useEffect, useState } from 'react';
import { api, getUser } from '../api';
import { tierOf } from '../game/rank';

// 랭킹 순위표
export default function Leaderboard({ onClose, onProfile }) {
  const [data, setData] = useState(null);
  const me = getUser();

  useEffect(() => { api('/api/leaderboard').then(setData).catch(() => {}); }, []);

  const medal = (rank) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal leaderboard-modal" onClick={(e) => e.stopPropagation()}>
        <h2>🏆 랭킹</h2>
        {!data ? <p className="empty-hint">불러오는 중...</p> : (
          <>
            <div className="lb-list">
              {data.top.map((u) => {
                const t = tierOf(u.rp);
                return (
                  <div key={u.id} className={`lb-row ${u.id === me?.id ? 'lb-me' : ''} ${u.rank <= 3 ? 'lb-top' : ''}`}
                    onClick={() => onProfile?.(u.id)}>
                    <span className="lb-rank">{medal(u.rank)}</span>
                    <span className="lb-avatar">{u.avatar || '🐱'}</span>
                    <span className="lb-name">{u.nickname}</span>
                    <span className="lb-tier" style={{ color: t.color }}>{t.emoji} {t.name}</span>
                    <span className="lb-rp">{u.rp} RP</span>
                  </div>
                );
              })}
              {data.top.length === 0 && <p className="empty-hint">아직 랭킹이 없어요. 첫 승리의 주인공이 되어보세요!</p>}
            </div>
            {data.me && data.me.rank > 10 && (
              <div className="lb-myrank">내 순위: <b>{data.me.rank}위</b> · {data.me.rp} RP</div>
            )}
          </>
        )}
        <div className="modal-actions center">
          <button className="menu-btn small" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}
