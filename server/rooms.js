// 방 관리 + 실시간 게임 진행 (엔진은 클라이언트와 공유)
import {
  createGame, playCard, chooseFloorMatch, declareGo, declareStop,
  playBomb, declareShake, decideGwangSale, legalActions, scoreOf,
} from '../client/src/game/engine.js';
import { query } from './db.js';

const rooms = new Map();       // code -> room
const online = new Map();      // userId -> socket

const genCode = () => Math.random().toString(36).slice(2, 6).toUpperCase();

function roomSummary(r) {
  return {
    code: r.code,
    name: r.name,
    playerCount: r.settings.playerCount,
    players: r.players.map((p) => ({ nickname: p.nickname, ready: p.ready, avatar: p.avatar })),
    playing: !!r.state && r.state.phase !== 'finished',
  };
}

// 플레이어별로 숨김 처리한 상태 전송
function sanitize(state, idx) {
  return {
    phase: state.phase,
    turn: state.turn,
    floor: state.floor,
    deckCount: state.deck.length,
    rules: state.rules,
    myIdx: idx,
    me: state.players[idx],
    players: state.players.map((p, i) => ({
      handCount: p.hand.length,
      captured: p.captured,
      goCount: p.goCount,
      shakeCount: p.shakeCount,
      active: p.active,
      folded: p.folded,
      score: state.phase !== 'gwangSale' ? safeScore(state, i) : 0,
    })),
    pending: state.pending && (state.pending.playerIdx === undefined || state.pending.playerIdx === idx || state.phase === 'goStop')
      ? { ...state.pending, card: undefined } : (state.phase === 'chooseFloorMatch' ? { waiting: true } : state.pending?.type === 'gwangSale' ? state.pending : null),
    result: state.result,
    events: state.events.slice(-6),
  };
}

function safeScore(state, i) {
  try { return scoreOf(state, i).score; } catch { return 0; }
}

function broadcast(io, room) {
  for (const p of room.players) {
    const s = online.get(p.userId);
    if (s && room.state) s.emit('game-state', sanitize(room.state, p.idx));
  }
}

function lobbyRooms() {
  return [...rooms.values()].map(roomSummary);
}

export function attachGameSockets(io) {
  io.on('connection', async (socket) => {
    const user = socket.user; // { id, nickname }
    const [dbUser] = await query('SELECT avatar FROM users WHERE id = $1', [user.id]).catch(() => [null]) || [null];
    user.avatar = dbUser?.avatar || '🐱';
    online.set(user.id, socket);
    io.emit('online-users', [...online.keys()]);

    socket.on('list-rooms', (cb) => cb?.(lobbyRooms()));

    socket.on('create-room', ({ name, settings }, cb) => {
      let code;
      do { code = genCode(); } while (rooms.has(code));
      const room = {
        code,
        name: name || `${user.nickname}의 방`,
        host: user.id,
        settings: { playerCount: 2, rules: {}, ...settings },
        players: [{ userId: user.id, nickname: user.nickname, avatar: user.avatar, ready: false, idx: 0 }],
        state: null,
        chat: [],
      };
      rooms.set(code, room);
      socket.join(code);
      socket.roomCode = code;
      cb?.({ ok: true, room: roomSummary(room) });
      io.emit('rooms-updated', lobbyRooms());
    });

    socket.on('join-room', ({ code }, cb) => {
      const room = rooms.get(code);
      if (!room) return cb?.({ error: '방이 없습니다' });
      if (room.players.some((p) => p.userId === user.id)) {
        socket.join(code);
        socket.roomCode = code;
        return cb?.({ ok: true, room: roomSummary(room) });
      }
      if (room.players.length >= room.settings.playerCount) return cb?.({ error: '방이 가득 찼습니다' });
      if (room.state) return cb?.({ error: '게임이 진행 중입니다' });
      room.players.push({ userId: user.id, nickname: user.nickname, avatar: user.avatar, ready: false, idx: room.players.length });
      socket.join(code);
      socket.roomCode = code;
      cb?.({ ok: true, room: roomSummary(room) });
      io.to(code).emit('room-updated', roomSummary(room));
      io.emit('rooms-updated', lobbyRooms());
    });

    socket.on('leave-room', () => leaveRoom(socket));

    socket.on('invite-friend', ({ friendId }) => {
      const room = rooms.get(socket.roomCode);
      const fs = online.get(friendId);
      if (room && fs) fs.emit('invited', { from: user.nickname, code: room.code, name: room.name });
    });

    socket.on('chat-message', ({ text }) => {
      const room = rooms.get(socket.roomCode);
      if (!room || !text) return;
      const msg = { nickname: user.nickname, avatar: user.avatar, text: String(text).slice(0, 200), ts: Date.now() };
      room.chat.push(msg);
      io.to(room.code).emit('chat-message', msg);
    });

    // 친구 1:1 DM
    socket.on('dm', async ({ toUserId, text }, cb) => {
      text = String(text || '').slice(0, 300).trim();
      if (!text) return;
      const msg = { from_id: user.id, to_id: toUserId, text, ts: Date.now(), fromNickname: user.nickname, fromAvatar: user.avatar };
      try { await query('INSERT INTO dms (from_id, to_id, text, ts) VALUES ($1, $2, $3, $4)', [user.id, toUserId, text, msg.ts]); }
      catch (e) { console.error('dm 저장 실패', e); }
      online.get(toUserId)?.emit('dm', msg);
      cb?.({ ok: true, msg });
    });

    // 인게임 이모티콘 리액션
    socket.on('reaction', ({ emoji }) => {
      const room = rooms.get(socket.roomCode);
      if (!room) return;
      const ALLOWED = ['👍', '😂', '😡', '🥳', '😱', '💢', '🙏', '😴'];
      if (!ALLOWED.includes(emoji)) return;
      io.to(room.code).emit('reaction', { nickname: user.nickname, avatar: user.avatar, emoji, ts: Date.now() });
    });

    socket.on('set-ready', ({ ready }) => {
      const room = rooms.get(socket.roomCode);
      if (!room) return;
      const p = room.players.find((pl) => pl.userId === user.id);
      if (p) p.ready = ready;
      io.to(room.code).emit('room-updated', roomSummary(room));

      // 전원 준비 & 정원 충족 → 게임 시작
      if (room.players.length === room.settings.playerCount && room.players.every((pl) => pl.ready)) {
        room.state = createGame({ playerCount: room.settings.playerCount, rules: room.settings.rules });
        io.to(room.code).emit('game-started');
        broadcast(io, room);
      }
    });

    // 게임 화면 진입 시 현재 상태 재요청 (첫 브로드캐스트 놓침 방지)
    socket.on('request-state', () => {
      const room = rooms.get(socket.roomCode);
      const p = room?.players.find((pl) => pl.userId === user.id);
      if (room?.state && p) socket.emit('game-state', sanitize(room.state, p.idx));
    });

    socket.on('game-action', (a, cb) => {
      const room = rooms.get(socket.roomCode);
      if (!room?.state) return cb?.({ error: '게임 중이 아닙니다' });
      const p = room.players.find((pl) => pl.userId === user.id);
      if (!p) return cb?.({ error: '플레이어가 아닙니다' });
      const s = room.state;
      try {
        if (a.action === 'play') playCard(s, p.idx, a.cardId ?? null);
        else if (a.action === 'chooseFloorMatch') chooseFloorMatch(s, a.cardId);
        else if (a.action === 'go') declareGo(s);
        else if (a.action === 'stop') declareStop(s);
        else if (a.action === 'bomb') playBomb(s, p.idx, a.month);
        else if (a.action === 'shake') declareShake(s, p.idx, a.month);
        else if (a.action === 'gwangSale') decideGwangSale(s, p.idx, a.sell);
        else return cb?.({ error: '알 수 없는 액션' });
      } catch (e) {
        return cb?.({ error: e.message });
      }
      cb?.({ ok: true });
      broadcast(io, room);

      if (s.phase === 'finished') finishGame(io, room);
    });

    socket.on('play-again', () => {
      const room = rooms.get(socket.roomCode);
      if (!room || (room.state && room.state.phase !== 'finished')) return;
      room.state = null;
      room.players.forEach((pl) => { pl.ready = false; });
      io.to(room.code).emit('room-updated', roomSummary(room));
    });

    socket.on('disconnect', () => {
      online.delete(user.id);
      io.emit('online-users', [...online.keys()]);
      leaveRoom(socket, true);
    });

    function leaveRoom(sock, isDisconnect = false) {
      const room = rooms.get(sock.roomCode);
      if (!room) return;
      // 게임 중 이탈: 방 유지(재접속 가능), 로비 나가기: 제거
      if (!room.state || room.state.phase === 'finished' || !isDisconnect) {
        room.players = room.players.filter((pl) => pl.userId !== user.id);
        room.players.forEach((pl, i) => { pl.idx = i; });
        sock.leave(room.code);
        sock.roomCode = null;
        if (room.players.length === 0) rooms.delete(room.code);
        else io.to(room.code).emit('room-updated', roomSummary(room));
        io.emit('rooms-updated', lobbyRooms());
      }
    }
  });
}

async function finishGame(io, room) {
  const r = room.state.result;
  if (r?.type === 'win' || r?.type === 'chongtong') {
    const winner = room.players.find((p) => p.idx === r.winner);
    if (winner) {
      try {
        await query('UPDATE users SET wins = wins + 1 WHERE id = $1', [winner.userId]);
        for (const p of room.players) {
          if (p.userId !== winner.userId) await query('UPDATE users SET losses = losses + 1 WHERE id = $1', [p.userId]);
        }
        await query('INSERT INTO game_results (room_code, winner_id, detail) VALUES ($1, $2, $3)',
          [room.code, winner.userId, JSON.stringify(r)]);
      } catch (e) { console.error('결과 저장 실패', e); }
    }
  }
}
