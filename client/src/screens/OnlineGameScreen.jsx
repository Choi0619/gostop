import { useEffect, useRef, useState } from 'react';
import HwatuCard from '../components/HwatuCard';
import ScorePanel from '../components/ScorePanel';
import Callout from '../components/Callout';
import Confetti from '../components/Confetti';
import MuteButton from '../components/MuteButton';
import { getSocket } from '../socket';
import { getUser } from '../api';
import ReactionBar from '../components/ReactionBar';
import { pickCallout } from '../game/callouts';
import { playEventSound, sfx } from '../game/sound';

// 서버 상태 기반 온라인 게임 화면
export default function OnlineGameScreen({ room, onLeave, onExit }) {
  const [st, setSt] = useState(null);
  const [callout, setCallout] = useState(null);
  const [rpDelta, setRpDelta] = useState(null);
  const [chat, setChat] = useState([]);
  const [msg, setMsg] = useState('');
  const prevEventsKey = useRef('');
  const calloutKey = useRef(0);
  const finishedRef = useRef(false);
  const chatRef = useRef(null);

  useEffect(() => {
    const s = getSocket();
    const onState = (state) => {
      setSt(state);
      // 새 이벤트 감지 (서버가 최근 이벤트만 보냄) → 사운드 + 멘트
      const key = (state.events || []).map((e) => e.type).join('|') + ':' + (state.events?.length || 0);
      if (key !== prevEventsKey.current) {
        const fresh = state.events || [];
        // 직전과 겹치지 않는 꼬리 이벤트만 재생 (근사)
        const tail = fresh.slice(-2);
        for (const e of tail) playEventSound(e.type);
        const c = pickCallout(fresh);
        if (c) {
          calloutKey.current++;
          setCallout({ ...c, _k: calloutKey.current });
          setTimeout(() => setCallout(null), 1500);
        }
        prevEventsKey.current = key;
      }
      // 게임 종료 사운드
      if (state.phase === 'finished' && !finishedRef.current) {
        finishedRef.current = true;
        if (state.result?.type === 'nagari') sfx.flip();
        else if (state.result?.winner === state.myIdx) sfx.win();
        else sfx.lose();
      }
      if (state.phase !== 'finished') finishedRef.current = false;
    };
    const onMsg = (m) => setChat((c) => [...c, m]);
    const onRp = ({ delta }) => setRpDelta(delta);
    s.on('game-state', onState);
    s.on('chat-message', onMsg);
    s.on('rp-update', onRp);
    s.emit('request-state'); // 첫 상태 놓침 방지
    return () => { s.off('game-state', onState); s.off('chat-message', onMsg); s.off('rp-update', onRp); };
  }, []);

  useEffect(() => { chatRef.current?.scrollTo(0, 99999); }, [chat]);

  if (!st) return <div className="game-screen"><p style={{ margin: 'auto' }}>게임 준비 중...</p></div>;

  const act = (a) => getSocket().emit('game-action', a, (r) => { if (r?.error) console.warn(r.error); });

  const me = st.me;
  const myIdx = st.myIdx;
  const myTurn = st.phase === 'play' && st.turn === myIdx;
  const opponents = st.players.map((p, i) => ({ ...p, i, nickname: room.players[i]?.nickname || `P${i + 1}` }))
    .filter((p) => p.i !== myIdx);

  // 폭탄/흔들기 감지 (내 손패 기준)
  const monthCount = {};
  for (const c of me.hand) monthCount[c.month] = (monthCount[c.month] || 0) + 1;
  const bombMonth = Object.keys(monthCount).find((m) =>
    monthCount[m] === 3 && st.floor.filter((c) => c.month === +m).length === 1 && st.rules.bomb !== false);
  const shakeMonth = Object.keys(monthCount).find((m) =>
    monthCount[m] === 3 && st.floor.filter((c) => c.month === +m).length === 0 && st.rules.heundeulgi !== false);

  const chooseWait = st.phase === 'chooseFloorMatch' && st.pending?.options;

  return (
    <div className={`game-screen online ${myTurn ? 'my-turn-glow' : ''}`}>
      <MuteButton />
      <div className="online-main">
        {/* 상대들 */}
        <div className="opp-area">
          {opponents.map((p) => (
            <div key={p.i} className="opp-block">
              <div className="player-info">
                <span className="player-name"><span className='avatar-inline'>{room.players[p.i]?.avatar || '🀄'}</span> {p.nickname} {p.folded && '(광팜)'}</span>
                <span className="player-score">{p.score}점 {p.goCount > 0 && `· ${p.goCount}고`}</span>
                {st.phase === 'play' && st.turn === p.i && <b className="turn-badge">차례</b>}
              </div>
              <div className="hand-row">
                {Array.from({ length: p.handCount }).map((_, k) => (
                  <HwatuCard key={k} card={{ month: 1 }} width={38} faceDown />
                ))}
              </div>
              <CapturedRow captured={p.captured} small />
            </div>
          ))}
        </div>

        {/* 바닥 */}
        <div className="floor-area">
          <div className="deck-stack">
            {st.deckCount > 0 && <HwatuCard card={{ month: 1 }} width={54} faceDown />}
            <span className="deck-count">{st.deckCount}</span>
          </div>
          <div className="floor-cards">
            {st.floor.map((c) => {
              const selectable = chooseWait && st.pending.options.includes(c.id);
              return (
                <HwatuCard key={c.id} card={c} width={54} selected={selectable}
                  onClick={selectable ? () => act({ action: 'chooseFloorMatch', cardId: c.id }) : undefined} />
              );
            })}
          </div>
        </div>

        {/* 내 영역 */}
        <div className="my-area">
          <CapturedRow captured={me.captured} />
          <div className="hand-row my-hand">
            {me.hand.map((c) => (
              <HwatuCard key={c.id} card={c} width={62}
                onClick={myTurn ? () => act({ action: 'play', cardId: c.id }) : undefined} />
            ))}
            {myTurn && me.bombPasses > 0 && (
              <button className="menu-btn small" onClick={() => act({ action: 'play', cardId: null })}>패스 ({me.bombPasses})</button>
            )}
          </div>
          <div className="player-info">
            <span className="player-name"><span className='avatar-inline'>{getUser()?.avatar || '😎'}</span> 나 {myTurn && <b className="turn-badge">내 차례</b>}</span>
            <span className="player-score">{st.players[myIdx]?.score}점 {me.goCount > 0 && `· ${me.goCount}고`}</span>
            {myTurn && bombMonth && <button className="menu-btn small primary" onClick={() => act({ action: 'bomb', month: +bombMonth })}>💣 폭탄 ({bombMonth}월)</button>}
            {myTurn && shakeMonth && <button className="menu-btn small" onClick={() => act({ action: 'shake', month: +shakeMonth })}>👋 흔들기 ({shakeMonth}월)</button>}
            <button className="menu-btn small" onClick={onExit}>나가기</button>
          </div>
        </div>
      </div>

      {/* 채팅 사이드 */}
      <div className="game-chat">
        <div className="chat-log" ref={chatRef}>
          {chat.map((m, i) => <div key={i} className="chat-line"><b>{m.avatar} {m.nickname}</b> {m.text}</div>)}
        </div>
        <form className="friend-add" onSubmit={(e) => {
          e.preventDefault();
          if (msg.trim()) { getSocket().emit('chat-message', { text: msg }); setMsg(''); }
        }}>
          <input placeholder="채팅..." value={msg} onChange={(e) => setMsg(e.target.value)} />
          <button className="menu-btn small">↵</button>
        </form>
      </div>

      <ReactionBar />

      {/* 실시간 점수 패널 (내 것) */}
      <ScorePanel captured={me.captured} target={st.rules.targetScore} />

      {/* 큰 멘트 */}
      <Callout data={callout} />

      {/* 광팔기 결정 (4인) */}
      {st.phase === 'gwangSale' && !st.players[myIdx].folded && (
        <div className="modal-backdrop">
          <div className="modal go-stop-modal">
            <h2>광팔기</h2>
            <p>광을 팔고 이번 판을 쉴까요?</p>
            <p className="empty-hint">내 광: {me.hand.filter((c) => c.type === 'gwang').length}장</p>
            <div className="modal-actions center">
              <button className="menu-btn primary" onClick={() => act({ action: 'gwangSale', sell: true })}>광 팔기</button>
              <button className="menu-btn" onClick={() => act({ action: 'gwangSale', sell: false })}>참여</button>
            </div>
          </div>
        </div>
      )}

      {/* 고/스톱 */}
      {st.phase === 'goStop' && st.pending?.playerIdx === myIdx && (
        <div className="modal-backdrop">
          <div className="modal go-stop-modal">
            <h2>{st.pending.score}점!</h2>
            <div className="modal-actions center">
              <button className="menu-btn primary" onClick={() => act({ action: 'go' })}>GO!</button>
              <button className="menu-btn" onClick={() => act({ action: 'stop' })}>STOP</button>
            </div>
          </div>
        </div>
      )}

      {/* 결과 */}
      {st.phase === 'finished' && st.result && (
        <div className="modal-backdrop">
          {st.result.winner === myIdx && <Confetti />}
          <div className="modal result-modal">
            {st.result.type === 'nagari' ? <h2>나가리 🤝</h2> : (
              <>
                <h2>{st.result.winner === myIdx ? '🎉 승리!' : `${room.players[st.result.winner]?.nickname} 승리`}</h2>
                {st.result.detail && (
                  <div className="result-detail">
                    {st.result.detail.map((d, i) => (
                      <div key={i} className="result-line"><span>{d.name}</span><b>{d.score}점</b></div>
                    ))}
                    {st.result.payments?.map((p, i) => (
                      <div key={i} className="result-line total">
                        <span>{room.players[p.player]?.nickname} {p.bak.join('+')}</span><b>-{p.payment}점</b>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            {rpDelta != null && (
              <div className={`rp-popup ${rpDelta >= 0 ? 'up' : 'down'}`}>
                {rpDelta >= 0 ? '▲ +' : '▼ '}{rpDelta} RP
              </div>
            )}
            <div className="modal-actions center">
              <button className="menu-btn primary" onClick={onLeave}>한판 더 (대기실)</button>
              <button className="menu-btn" onClick={onExit}>방 나가기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CapturedRow({ captured, small }) {
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
            {cards.map((c) => <HwatuCard key={c.id} card={c} width={small ? 38 : 46} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
