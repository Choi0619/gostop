import { useState } from 'react';
import { api, getUser, saveAuth, getToken } from '../api';
import { THEME_LIST, applyTheme } from '../game/themes';

// 테마 선택 (승수로 해금). 미리보기 스와치 + 즉시 적용.
export default function ThemePicker({ wins = 0, current, onClose, onChange }) {
  const user = getUser();
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(current || 'classic');

  const pick = async (key, locked) => {
    if (locked) return;
    // 즉시 미리보기
    setPreview(key);
    applyTheme(key);
    try {
      await api('/api/theme', { method: 'POST', body: { theme: key } });
      saveAuth(getToken(), { ...user, theme: key });
      onChange?.(key);
    } catch (e) {
      setError(e.message);
      applyTheme(current || 'classic'); // 실패 시 되돌리기
      setPreview(current || 'classic');
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => { applyTheme(current || 'classic'); onClose(); }}>
      <div className="modal theme-modal" onClick={(e) => e.stopPropagation()}>
        <h2>🎨 테마</h2>
        <p className="empty-hint">게임판과 카드 뒷면 색이 바뀌어요 (현재 {wins}승)</p>
        <div className="theme-grid">
          {THEME_LIST.map((t) => {
            const locked = wins < t.unlock;
            const active = preview === t.key;
            return (
              <button key={t.key} className={`theme-cell ${active ? 'active' : ''} ${locked ? 'locked' : ''}`}
                onClick={() => pick(t.key, locked)} title={t.name}>
                <span className="theme-swatch" style={{ background: `radial-gradient(circle at 40% 35%, ${t.felt1}, ${t.felt3})` }}>
                  <span className="theme-back" style={{ background: t.back, borderColor: t.backLine }} />
                </span>
                <span className="theme-name">{t.emoji} {t.name}</span>
                {locked && <span className="theme-lock">🔒 {t.unlock}승</span>}
              </button>
            );
          })}
        </div>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions center">
          <button className="menu-btn small" onClick={() => { applyTheme(preview); onClose(); }}>완료</button>
        </div>
      </div>
    </div>
  );
}
