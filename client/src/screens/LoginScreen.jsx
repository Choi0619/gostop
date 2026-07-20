import { useState } from 'react';
import { api, saveAuth } from '../api';

export default function LoginScreen({ onLogin, onBack }) {
  const [mode, setMode] = useState('login'); // login | register
  const [form, setForm] = useState({ username: '', nickname: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api(`/api/${mode}`, { method: 'POST', body: form });
      saveAuth(data.token, data.user);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="main-screen">
      <div className="main-box login-box">
        <h1 className="title small-title">고스톱</h1>
        <p className="subtitle">{mode === 'login' ? '로그인' : '회원가입'}</p>
        <form className="login-form" onSubmit={submit}>
          <input placeholder="아이디" value={form.username} onChange={set('username')} autoFocus />
          {mode === 'register' && (
            <input placeholder="닉네임 (게임에서 표시)" value={form.nickname} onChange={set('nickname')} />
          )}
          <input type="password" placeholder="비밀번호" value={form.password} onChange={set('password')} />
          {error && <p className="form-error">{error}</p>}
          <button className="menu-btn primary" disabled={busy}>
            {busy ? '...' : mode === 'login' ? '로그인' : '가입하기'}
          </button>
        </form>
        <button className="link-btn" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? '계정이 없어요 → 회원가입' : '이미 계정이 있어요 → 로그인'}
        </button>
        <button className="link-btn" onClick={onBack}>← 메인으로</button>
      </div>
    </div>
  );
}
