import { useState, useEffect } from 'react';
import HwatuCard from './components/HwatuCard';
import GameScreen from './screens/GameScreen';
import LoginScreen from './screens/LoginScreen';
import LobbyScreen from './screens/LobbyScreen';
import Petals from './components/Petals';
import { getUser } from './api';
import { applyTheme } from './game/themes';
import { CARDS } from './game/cards';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState('main'); // main | gallery | game | login | lobby
  const [theme, setTheme] = useState(getUser()?.theme || 'classic');

  useEffect(() => { applyTheme(getUser()?.theme || 'classic'); }, [screen]);
  useEffect(() => {
    const on = (e) => setTheme(e.detail);
    window.addEventListener('themechange', on);
    return () => window.removeEventListener('themechange', on);
  }, []);

  let content;
  if (screen === 'gallery') content = <Gallery onBack={() => setScreen('main')} />;
  else if (screen === 'game') content = <GameScreen onExit={() => setScreen('main')} />;
  else if (screen === 'login') content = <LoginScreen onLogin={() => setScreen('lobby')} onBack={() => setScreen('main')} />;
  else if (screen === 'lobby') content = <LobbyScreen onExit={() => setScreen('main')} />;
  else content = (
    <MainScreen
      onGallery={() => setScreen('gallery')}
      onPlayAI={() => setScreen('game')}
      onOnline={() => setScreen(getUser() ? 'lobby' : 'login')}
    />
  );

  return (
    <>
      {theme === 'sakura' && <Petals />}
      {content}
    </>
  );
}

function MainScreen({ onGallery, onPlayAI, onOnline }) {
  const fanCards = [CARDS[0], CARDS[8], CARDS[28], CARDS[40], CARDS[44]]; // 광 5장
  const [dealt, setDealt] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDealt(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="main-screen">
      <div className="main-box">
        <div className="card-fan">
          {fanCards.map((c, i) => (
            <div key={c.id} className={`fan-card ${dealt ? 'in' : ''}`}
              style={{
                transitionDelay: `${i * 0.12}s`,
                '--rot': `${(i - 2) * 13}deg`,
                '--ty': `${Math.abs(i - 2) * 9}px`,
              }}>
              <HwatuCard card={c} width={72} />
            </div>
          ))}
        </div>
        <h1 className="title">고스톱</h1>
        <p className="subtitle">GO-STOP · 화투 온라인</p>
        <div className="menu">
          <button className="menu-btn primary" onClick={onPlayAI}>🤖 AI 맞고</button>
          <button className="menu-btn" onClick={onOnline}>👥 온라인 대전</button>
          <button className="menu-btn" onClick={onGallery}>🎴 카드 도감</button>
          <button className="menu-btn" onClick={onOnline}>🔑 {getUser() ? `${getUser().nickname}님 로비` : '로그인'}</button>
        </div>
      </div>
    </div>
  );
}

function Gallery({ onBack }) {
  const months = [...new Set(CARDS.map((c) => c.month))];
  return (
    <div className="gallery-screen">
      <div className="gallery-header">
        <button className="menu-btn small" onClick={onBack}>← 메인으로</button>
        <h2>화투 48장</h2>
        <div className="gallery-back-sample"><HwatuCard card={CARDS[0]} width={48} faceDown /></div>
      </div>
      {months.map((m) => (
        <div key={m} className="month-row">
          <span className="month-label">{m}월</span>
          <div className="month-cards">
            {CARDS.filter((c) => c.month === m).map((c) => (
              <div key={c.id} className="gallery-card">
                <HwatuCard card={c} width={76} />
                <span className="card-label">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
