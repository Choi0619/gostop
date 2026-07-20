import { useEffect, useRef, useState, useCallback } from 'react';
import HwatuCard from '../components/HwatuCard';
import { createGame, playCard, chooseFloorMatch, declareGo, declareStop, playBomb, declareShake, legalActions, scoreOf } from '../game/engine';
import { chooseAction } from '../game/ai';
import { getUser } from '../api';

const EVENT_LABEL = {
  ppeok: '뻑!', jjok: '쪽!', ttadak: '따닥!', sseul: '쓸!', bomb: '폭탄!',
  shake: '흔들기!', eatPpeok: '뻑 먹기!', go: 'GO!', stop: 'STOP!',
  chongtong: '총통!', nagari: '나가리',
};

// AI 맞고 (플레이어 0 = 나, 1 = AI)
export default function GameScreen({ onExit }) {
  const stateRef = useRef(null);
  const [, setTick] = useState(0);
  const [toast, setToast] = useState(null);
  const eventCursor = useRef(0);
  const ME = 0, AI = 1;

  const rerender = useCallback(() => setTick((t) => t + 1), []);

  const flushEvents = useCallback(() => {
    const s = stateRef.current;
    const fresh = s.events.slice(eventCursor.current);
    eventCursor.current = s.events.length;
    const important = fresh.filter((e) => EVENT_LABEL[e.type]);
    if (important.length) {
      setToast(important.map((e) => EVENT_LABEL[e.type]).join(' '));
      setTimeout(() => setToast(null), 1400);
    }
  }, []);

  const newGame = useCallback(() => {
    stateRef.current = createGame({ playerCount: 2 });
    eventCursor.current = 0;
    rerender();
  }, [rerender]);

  useEffect(() => { newGame(); }, [newGame]);

  // AI 턴 자동 진행
  useEffect(() => {
    const s = stateRef.current;
    if (!s || s.phase === 'finished') return;
    const aiTurn =
      (s.phase === 'play' && s.turn === AI) ||
      (s.phase === 'goStop' && s.pending.playerIdx === AI) ||
      (s.phase === 'chooseFloorMatch' && s.pending.playerIdx === AI);
    if (!aiTurn) return;

    const t = setTimeout(() => {
      const a = chooseAction(s, AI);
      try {
        if (a.action === 'go') declareGo(s);
        else if (a.action === 'stop') declareStop(s);
        else if (a.action === 'chooseFloorMatch') chooseFloorMatch(s, a.cardId);
        else if (a.action === 'bomb') { playBomb(s, AI, a.month); }
        else playCard(s, AI, a.cardId);
      } catch (e) { console.error(e); }
      flushEvents();
      rerender();
    }, 1000);
    return () => clearTimeout(t);
  });

  const s = stateRef.current;
  if (!s) return null;

  const me = s.players[ME], ai = s.players[AI];
  const myTurn = s.phase === 'play' && s.turn === ME;
  const acts = myTurn ? legalActions(s) : [];
  const bombAct = acts.find((a) => a.action === 'bomb');
  const shakeAct = acts.find((a) => a.action === 'shake');
  const myScore = scoreOf(s, ME).score;
  const aiScore = scoreOf(s, AI).score;

  const onPlay = (cardId) => {
    if (!myTurn) return;
    try { playCard(s, ME, cardId); } catch { return; }
    flushEvents();
    rerender();
  };

  return (
    <div className="game-screen">
      {/* 상대 영역 */}
      <div className="opp-area">
        <div className="player-info">
          <span className="player-name">🤖 AI</span>
          <span className="player-score">{aiScore}점 {ai.goCount > 0 && `· ${ai.goCount}고`}</span>
        </div>
        <div className="hand-row">
          {ai.hand.map((c) => <HwatuCard key={c.id} card={c} width={44} faceDown />)}
        </div>
        <CapturedRow captured={ai.captured} />
      </div>

      {/* 바닥 */}
      <div className="floor-area">
        <div className="deck-stack">
          {s.deck.length > 0 && <HwatuCard card={s.deck[0]} width={56} faceDown />}
          <span className="deck-count">{s.deck.length}</span>
        </div>
        <div className="floor-cards">
          {s.floor.map((c) => {
            const selectable = s.phase === 'chooseFloorMatch' && s.pending.playerIdx === ME && s.pending.options.includes(c.id);
            return (
              <HwatuCard key={c.id} card={c} width={56}
                selected={selectable}
                onClick={selectable ? () => { chooseFloorMatch(s, c.id); flushEvents(); rerender(); } : undefined} />
            );
          })}
        </div>
      </div>

      {/* 내 영역 */}
      <div className="my-area">
        <CapturedRow captured={me.captured} />
        <div className="hand-row my-hand">
          {me.hand.map((c) => (
            <HwatuCard key={c.id} card={c} width={64}
              onClick={myTurn ? () => onPlay(c.id) : undefined} />
          ))}
          {myTurn && me.bombPasses > 0 && (
            <button className="menu-btn small" onClick={() => onPlay(null)}>패스 ({me.bombPasses})</button>
          )}
        </div>
        <div className="player-info">
          <span className="player-name"><span className='avatar-inline'>{getUser()?.avatar || '😎'}</span> 나 {myTurn && <b className="turn-badge">내 차례</b>}</span>
          <span className="player-score">{myScore}점 {me.goCount > 0 && `· ${me.goCount}고`}</span>
          {bombAct && <button className="menu-btn small primary" onClick={() => { playBomb(s, ME, bombAct.month); flushEvents(); rerender(); }}>💣 폭탄 ({bombAct.month}월)</button>}
          {shakeAct && <button className="menu-btn small" onClick={() => { declareShake(s, ME, shakeAct.month); flushEvents(); rerender(); }}>👋 흔들기 ({shakeAct.month}월)</button>}
          <button className="menu-btn small" onClick={onExit}>나가기</button>
        </div>
      </div>

      {/* 이벤트 토스트 */}
      {toast && <div className="toast">{toast}</div>}

      {/* 고/스톱 선택 */}
      {s.phase === 'goStop' && s.pending.playerIdx === ME && (
        <div className="modal-backdrop">
          <div className="modal go-stop-modal">
            <h2>{s.pending.score}점!</h2>
            <p>계속 하시겠습니까?</p>
            <div className="modal-actions center">
              <button className="menu-btn primary" onClick={() => { declareGo(s); flushEvents(); rerender(); }}>GO! ({me.goCount + 1}고)</button>
              <button className="menu-btn" onClick={() => { declareStop(s); flushEvents(); rerender(); }}>STOP</button>
            </div>
          </div>
        </div>
      )}

      {/* 결과 */}
      {s.phase === 'finished' && (
        <div className="modal-backdrop">
          <div className="modal result-modal">
            {s.result.type === 'nagari' ? (
              <h2>나가리 🤝</h2>
            ) : s.result.type === 'chongtong' ? (
              <h2>{s.result.winner === ME ? '😎 총통 승리!' : '🤖 AI 총통 승리'}</h2>
            ) : (
              <>
                <h2>{s.result.winner === ME ? '🎉 승리!' : '😭 패배...'}</h2>
                <div className="result-detail">
                  {s.result.detail.map((d, i) => (
                    <div key={i} className="result-line"><span>{d.name}</span><b>{d.score}점</b></div>
                  ))}
                  {s.result.payments.map((p, i) => (
                    <div key={i} className="result-line total">
                      <span>{p.bak.length > 0 ? p.bak.join('+') + ' 포함 ' : ''}최종</span>
                      <b>{p.payment}점</b>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="modal-actions center">
              <button className="menu-btn primary" onClick={newGame}>한판 더</button>
              <button className="menu-btn" onClick={onExit}>메인으로</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 획득 패: 종류별로 묶어서 표시
function CapturedRow({ captured }) {
  const groups = [
    ['광', captured.filter((c) => c.type === 'gwang')],
    ['열끗', captured.filter((c) => c.type === 'yeol')],
    ['띠', captured.filter((c) => c.type === 'tti')],
    ['피', captured.filter((c) => c.type === 'pi')],
  ];
  return (
    <div className="captured-row">
      {groups.map(([label, cards]) => cards.length > 0 && (
        <div key={label} className="captured-group">
          <span className="captured-label">{label} {cards.length}</span>
          <div className="captured-cards">
            {cards.map((c) => <HwatuCard key={c.id} card={c} width={34} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
