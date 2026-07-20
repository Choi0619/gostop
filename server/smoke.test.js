// 2인 온라인 대전 스모크 테스트: node smoke.test.js
import { io } from 'socket.io-client';

const BASE = 'http://localhost:3001';

async function api(path, body, token) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  return res.json();
}

const t1 = (await api('/api/login', { username: 'test1', password: '1234' })).token;
const t2 = (await api('/api/login', { username: 'test2', password: '1234' })).token;
if (!t1 || !t2) { console.error('로그인 실패'); process.exit(1); }

const s1 = io(BASE, { auth: { token: t1 } });
const s2 = io(BASE, { auth: { token: t2 } });

const states = { 1: null, 2: null };
let chatReceived = false;
let finished = null;

function actFor(who, sock) {
  const st = states[who];
  if (!st || finished) return;
  if (st.phase === 'finished') { finished = st.result; return; }
  const myTurn =
    (st.phase === 'play' && st.turn === st.myIdx) ||
    (st.phase === 'goStop' && st.pending?.playerIdx === st.myIdx) ||
    (st.phase === 'chooseFloorMatch' && st.pending?.options);
  if (!myTurn) return;

  let action;
  if (st.phase === 'goStop') action = { action: 'stop' };
  else if (st.phase === 'chooseFloorMatch') action = { action: 'chooseFloorMatch', cardId: st.pending.options[0] };
  else if (st.me.hand.length > 0) action = { action: 'play', cardId: st.me.hand[0].id };
  else if (st.me.bombPasses > 0) action = { action: 'play', cardId: null };
  else return;

  sock.emit('game-action', action, (r) => {
    if (r?.error) console.error(`P${who} action 오류:`, r.error, JSON.stringify(action));
  });
}

s1.on('game-state', (st) => { states[1] = st; setTimeout(() => actFor(1, s1), 30); });
s2.on('game-state', (st) => { states[2] = st; setTimeout(() => actFor(2, s2), 30); });
s2.on('chat-message', (m) => { if (m.text === '안녕!') chatReceived = true; });

await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('시간 초과')), 20000);

  s1.on('connect', () => {
    s1.emit('create-room', { name: '테스트방', settings: { playerCount: 2 } }, (r) => {
      if (!r.ok) return reject(new Error('방 생성 실패'));
      s2.emit('join-room', { code: r.room.code }, (r2) => {
        if (!r2.ok) return reject(new Error('입장 실패: ' + r2.error));
        s1.emit('chat-message', { text: '안녕!' });
        s1.emit('set-ready', { ready: true });
        s2.emit('set-ready', { ready: true });
      });
    });
  });

  const iv = setInterval(() => {
    if (finished) { clearTimeout(timeout); clearInterval(iv); resolve(); }
  }, 200);
});

console.log('게임 종료:', finished.type, finished.type === 'win' ? `승자 P${finished.winner} ${finished.score}점` : '');
console.log('채팅 수신:', chatReceived ? 'OK' : 'FAIL');
console.log(chatReceived && finished ? 'SMOKE TEST PASS' : 'SMOKE TEST FAIL');
s1.close(); s2.close();
process.exit(chatReceived && finished ? 0 : 1);
