import { useState } from 'react';
import HwatuCard from './components/HwatuCard';
import { CARDS } from './game/cards';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState('main'); // main | gallery

  if (screen === 'gallery') return <Gallery onBack={() => setScreen('main')} />;
  return <MainScreen onGallery={() => setScreen('gallery')} />;
}

function MainScreen({ onGallery }) {
  // 타이틀 위 부채꼴 카드 장식 (광 5장)
  const fanCards = [CARDS[0], CARDS[8], CARDS[28], CARDS[40], CARDS[44]];

  return (
    <div className="main-screen">
      <div className="main-box">
        <div className="card-fan">
          {fanCards.map((c, i) => (
            <div key={c.id} className="fan-card"
              style={{ transform: `rotate(${(i - 2) * 12}deg) translateY(${Math.abs(i - 2) * 8}px)` }}>
              <HwatuCard card={c} width={70} />
            </div>
          ))}
        </div>
        <h1 className="title">고스톱</h1>
        <p className="subtitle">GO-STOP · 화투 온라인</p>
        <div className="menu">
          <button className="menu-btn primary">🤖 AI 맞고 (준비중)</button>
          <button className="menu-btn" disabled>👥 온라인 대전 (준비중)</button>
          <button className="menu-btn" onClick={onGallery}>🎴 카드 도감</button>
          <button className="menu-btn" disabled>🔑 로그인 (준비중)</button>
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
      </div>
      {months.map((m) => (
        <div key={m} className="month-row">
          <span className="month-label">{m}월</span>
          <div className="month-cards">
            {CARDS.filter((c) => c.month === m).map((c) => (
              <div key={c.id} className="gallery-card">
                <HwatuCard card={c} width={72} />
                <span className="card-label">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
