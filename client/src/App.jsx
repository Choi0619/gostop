import { useState, useEffect } from 'react';
import HwatuCard from './components/HwatuCard';
import { CARDS } from './game/cards';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState('main'); // main | gallery
  const [showRoomModal, setShowRoomModal] = useState(false);

  if (screen === 'gallery') return <Gallery onBack={() => setScreen('main')} />;
  return (
    <>
      <MainScreen onGallery={() => setScreen('gallery')} onCreateRoom={() => setShowRoomModal(true)} />
      {showRoomModal && <RoomModal onClose={() => setShowRoomModal(false)} />}
    </>
  );
}

function MainScreen({ onGallery, onCreateRoom }) {
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
          <button className="menu-btn primary">🤖 AI 맞고 (준비중)</button>
          <button className="menu-btn" onClick={onCreateRoom}>👥 방 만들기</button>
          <button className="menu-btn" onClick={onGallery}>🎴 카드 도감</button>
          <button className="menu-btn" disabled>🔑 로그인 (준비중)</button>
        </div>
      </div>
    </div>
  );
}

// 방 만들기: 인원 + 룰 설정 (온라인 대전 연동 예정)
function RoomModal({ onClose }) {
  const [players, setPlayers] = useState(2);
  const [rules, setRules] = useState({
    targetScore: 7,       // 맞고 7점 / 고스톱 3점
    pibak: true,          // 피박
    gwangbak: true,       // 광박
    meongbak: true,       // 멍박(멍따)
    heundeulgi: true,     // 흔들기
    bomb: true,           // 폭탄
    firstPpeok: true,     // 첫뻑 보너스
    gukjinAsPi: true,     // 국진 쌍피 선택
  });

  useEffect(() => {
    // 인원 바뀌면 표준 목표점수 자동 조정 (2인 맞고 7점, 3~4인 고스톱 3점)
    setRules((r) => ({ ...r, targetScore: players === 2 ? 7 : 3 }));
  }, [players]);

  const toggle = (k) => setRules((r) => ({ ...r, [k]: !r[k] }));

  const ruleItems = [
    ['pibak', '피박 (피 5장 이하 2배)'],
    ['gwangbak', '광박 (광 없으면 2배)'],
    ['meongbak', '멍따 (열끗 7장 2배)'],
    ['heundeulgi', '흔들기 (같은 월 3장 2배)'],
    ['bomb', '폭탄'],
    ['firstPpeok', '첫뻑 보너스'],
    ['gukjinAsPi', '국진 쌍피 선택 가능'],
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>🏠 방 만들기</h2>

        <div className="modal-section">
          <label className="section-label">인원</label>
          <div className="player-picker">
            {[2, 3, 4].map((n) => (
              <button key={n} className={`pick-btn ${players === n ? 'active' : ''}`} onClick={() => setPlayers(n)}>
                {n}명{n === 2 ? ' (맞고)' : n === 4 ? ' (광팔기)' : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-section">
          <label className="section-label">목표 점수</label>
          <div className="player-picker">
            {[3, 5, 7].map((s) => (
              <button key={s} className={`pick-btn ${rules.targetScore === s ? 'active' : ''}`}
                onClick={() => setRules((r) => ({ ...r, targetScore: s }))}>
                {s}점
              </button>
            ))}
          </div>
        </div>

        <div className="modal-section">
          <label className="section-label">룰 옵션</label>
          <div className="rule-list">
            {ruleItems.map(([k, label]) => (
              <label key={k} className="rule-item">
                <input type="checkbox" checked={rules[k]} onChange={() => toggle(k)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="menu-btn small" onClick={onClose}>취소</button>
          <button className="menu-btn primary small" disabled title="온라인 대전은 서버 개발 후 오픈됩니다">
            방 생성 (준비중)
          </button>
        </div>
        <p className="modal-hint">※ 온라인 대전은 로그인/서버 구축 후 오픈됩니다</p>
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
