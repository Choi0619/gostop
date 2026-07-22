import { useEffect, useRef, useState, useCallback } from 'react';
import HwatuCard from '../components/HwatuCard';
import ScorePanel from '../components/ScorePanel';
import Callout from '../components/Callout';
import Confetti from '../components/Confetti';
import MuteButton from '../components/MuteButton';
import CaptureFlash from '../components/CaptureFlash';
import { createGame, playCard, chooseFloorMatch, declareGo, declareStop, playBomb, declareShake, legalActions, scoreOf } from '../game/engine';
import { chooseAction } from '../game/ai';
import { pickCallout } from '../game/callouts';
import { playEventSound, sfx } from '../game/sound';
import { getUser } from '../api';

// AI 맞고 (플레이어 0 = 나, 1 = AI)
export default function GameScreen({ onExit }) {
  const stateRef = useRef(null);
  const [, setTick] = useState(0);
  const [callout, setCallout] = useState(null);
  const [justCaptured, setJustCaptured] = useState({}); // cardId -> true (방금 획득 애니메이션)
  const [capFlash, setCapFlash] = useState(null); // 획득 연출
  const eventCursor = useRef(0);
  const calloutKey = useRef(0);
  const flashKey = useRef(0);
  const ME = 0, AI = 1;

  const rerender = useCallback(() => setTick((t) => t + 1), []);

  const flushEvents = useCallback(() => {
    const s = stateRef.current;
    const fresh = s.events.slice(eventCursor.current);
    eventCursor.current = s.events.length;
    if (!fresh.length) return;

    // 사운드
    for (const e of fresh) playEventSound(e.type);

    // 획득 연출 (매칭된 카드가 모여 반짝 → 획득 더미로)
    const cap = [...fresh].reverse().find((e) => e.type === 'capture');
    if (cap) {
      flashKey.current++;
      setCapFlash({ ...cap, _k: flashKey.current });
      setTimeout(() => setCapFlash(null), 1100);
      // 획득 더미의 해당 카드 팝
      const ids = cap.cards.map((c) => c.id);
      setJustCaptured((m) => ({ ...m, ...Object.fromEntries(ids.map((id) => [id, true])) }));
      setTimeout(() => setJustCaptured({}), 1100);
    }

    // 큰 멘트
    const c = pickCallout(fresh);
    if (c) {
      calloutKey.current++;
      setCallout({ ...c, _k: calloutKey.current });
      setTimeout(() => setCallout(null), 1500);
    }
  }, []);

  const newGame = useCallback(() => {
    stateRef.current = createGame({ playerCount: 2 });
    eventCursor.current = 0;
    setCallout(null);
    setCapFlash(null);
    setJustCaptured({});
    rerender();
  }, [rerender]);

  useEffect(() => { newGame(); }, [newGame]);

  const s = stateRef.current;

  // 게임 종료 사운드
  const finishedRef = useRef(false);
  useEffect(() => {
    if (!s) return;
    if (s.phase === 'finished' && !finishedRef.current) {
      finishedRef.current = true;
      const iWon = s.result?.winner === ME || (s.result?.type === 'nagari' ? null : false);
      if (s.result?.type === 'nagari') sfx.flip();
      else if (s.result?.winner === ME) sfx.win();
      else sfx.lose();
    }
    if (s.phase !== 'finished') finishedRef.current = false;
  });

  // AI 턴 자동 진행
  useEffect(() => {
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

  if (!s) return null;

  const me = s.players[ME], ai = s.players[AI];
  const myTurn = s.phase === 'play' && s.turn === ME;
  // 짝 힌트: 내 차례일 때 바닥과 월이 맞는 손패 / 먹을 수 있는 바닥 카드
  const floorMonths = new Set(s.floor.map((c) => c.month));
  const handMonths = new Set(me.hand.map((c) => c.month));
  const handHint = (c) => myTurn && floorMonths.has(c.month);
  const floorHint = (c) => myTurn && handMonths.has(c.month);
  const acts = myTurn ? legalActions(s) : [];
  const bombAct = acts.find((a) => a.action === 'bomb');
  const shakeAct = acts.find((a) => a.action === 'shake');
  const myScore = scoreOf(s, ME).score;
  const aiScore = scoreOf(s, AI).score;
  const target = s.rules.targetScore;

  const onPlay = (cardId) => {
    if (!myTurn) return;
    try { playCard(s, ME, cardId); } catch { return; }
    flushEvents();
    rerender();
  };

  return (
    <div className={`game-screen ${myTurn ? 'my-turn-glow' : ''}`}>
      <MuteButton />
      {/* 상대 영역 */}
      <div className="opp-area">
        <div className="player-info">
          <span className="player-name">🤖 AI</span>
          <span className="player-score">{aiScore}점 {ai.goCount > 0 && `· ${ai.goCount}고`}</span>
        </div>
        <div className="hand-row">
          {ai.hand.map((c) => <HwatuCard key={c.id} card={c} width={44} faceDown />)}
        </div>
        <CapturedRow captured={ai.captured} justCaptured={justCaptured} />
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
                hintTarget={floorHint(c)}
                onClick={selectable ? () => { chooseFloorMatch(s, c.id); flushEvents(); rerender(); } : undefined} />
            );
          })}
        </div>
      </div>

      {/* 내 영역 */}
      <div className="my-area">
        <CapturedRow captured={me.captured} justCaptured={justCaptured} />
        <div className="hand-row my-hand">
          {me.hand.map((c) => (
            <span key={c.id} className={handHint(c) ? 'hint-wrap' : ''}>
              <HwatuCard card={c} width={64} hint={handHint(c)}
                onClick={myTurn ? () => onPlay(c.id) : undefined} />
              {handHint(c) && <span className="eat-badge">먹기</span>}
            </span>
          ))}
          {myTurn && me.bombPasses > 0 && (
            <button className="menu-btn small" onClick={() => onPlay(null)}>패스 ({me.bombPasses})</button>
          )}
        </div>
        <div className="player-info">
          <span className="player-name"><span className="avatar-inline">{getUser()?.avatar || '😎'}</span> 나 {myTurn && <b className="turn-badge">내 차례</b>}</span>
          {bombAct && <button className="menu-btn small primary" onClick={() => { playBomb(s, ME, bombAct.month); flushEvents(); rerender(); }}>💣 폭탄 ({bombAct.month}월)</button>}
          {shakeAct && <button className="menu-btn small" onClick={() => { declareShake(s, ME, shakeAct.month); flushEvents(); rerender(); }}>👋 흔들기 ({shakeAct.month}월)</button>}
          <button className="menu-btn small" onClick={onExit}>나가기</button>
        </div>
      </div>

      {/* 실시간 점수 패널 */}
      <ScorePanel captured={me.captured} target={target} gukjinAsPi={scoreOf(s, ME).gukjinAsPi} />

      {/* 큰 멘트 */}
      <Callout data={callout} />

      {/* 획득 연출 */}
      <CaptureFlash event={capFlash} mine={capFlash?.player === ME} />

      {/* 고/스톱 선택 */}
      {s.phase === 'goStop' && s.pending.playerIdx === ME && (
        <div className="modal-backdrop">
          <div className="modal go-stop-modal">
            <h2>{s.pending.score}점!</h2>
            <p>계속 하시겠습니까?</p>
            <div className="modal-actions center">
              <button className="menu-btn primary" onClick={() => { sfx.go(); declareGo(s); flushEvents(); rerender(); }}>GO! ({me.goCount + 1}고)</button>
              <button className="menu-btn" onClick={() => { declareStop(s); flushEvents(); rerender(); }}>STOP</button>
            </div>
          </div>
        </div>
      )}

      {/* 결과 */}
      {s.phase === 'finished' && (
        <div className="modal-backdrop">
          {s.result.winner === ME && <Confetti />}
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
function CapturedRow({ captured, justCaptured = {} }) {
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
            {cards.map((c) => (
              <span key={c.id} className={justCaptured[c.id] ? 'cap-pop' : ''}>
                <HwatuCard card={c} width={46} />
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
