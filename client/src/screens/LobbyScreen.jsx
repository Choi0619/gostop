import { useEffect, useState, useCallback, useRef } from 'react';
import { api, getUser, clearAuth } from '../api';
import { getSocket, closeSocket } from '../socket';
import OnlineGameScreen from './OnlineGameScreen';
import AvatarPicker from '../components/AvatarPicker';
import DMChat from '../components/DMChat';
import { saveAuth, getToken } from '../api';

// 로비: 방 목록 + 친구 + 방 내부(대기/채팅) + 온라인 게임
export default function LobbyScreen({ onExit }) {
  const user = getUser();
  const [rooms, setRooms] = useState([]);
  const [room, setRoom] = useState(null);        // 현재 들어간 방
  const [playing, setPlaying] = useState(false);
  const [friends, setFriends] = useState([]);
  const [onlineIds, setOnlineIds] = useState([]);
  const [friendNick, setFriendNick] = useState('');
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const [dmFriend, setDmFriend] = useState(null);
  const [unread, setUnread] = useState({});
  const [me, setMe] = useState(user);

  const loadFriends = useCallback(() => {
    api('/api/friends').then(setFriends).catch(() => {});
  }, []);

  useEffect(() => {
    const s = getSocket();
    s.emit('list-rooms', setRooms);
    s.on('rooms-updated', setRooms);
    s.on('room-updated', setRoom);
    s.on('online-users', setOnlineIds);
    s.on('game-started', () => setPlaying(true));
    s.on('invited', setInvite);
    loadFriends();
    api('/api/me').then(setMe).catch(() => {});
    api('/api/dms-unread').then((rows) => setUnread(Object.fromEntries(rows.map((r) => [r.from_id, r.cnt])))).catch(() => {});
    const onDm = (m) => setUnread((u) => ({ ...u, [m.from_id]: (u[m.from_id] || 0) + 1 }));
    s.on('dm', onDm);
    return () => {
      s.off('rooms-updated'); s.off('room-updated'); s.off('online-users');
      s.off('game-started'); s.off('invited'); s.off('dm');
    };
  }, [loadFriends]);

  const createRoom = (settings, name) => {
    getSocket().emit('create-room', { name, settings }, (r) => {
      if (r.ok) { setRoom(r.room); setShowCreate(false); }
    });
  };

  const joinRoom = (code) => {
    getSocket().emit('join-room', { code }, (r) => {
      if (r.error) setError(r.error);
      else setRoom(r.room);
    });
  };

  const leaveRoom = () => {
    getSocket().emit('leave-room');
    setRoom(null);
    setPlaying(false);
  };

  if (playing && room) {
    return <OnlineGameScreen room={room} onLeave={() => { setPlaying(false); getSocket().emit('play-again'); }} onExit={leaveRoom} />;
  }

  if (room) {
    return <RoomWait room={room} friends={friends} onlineIds={onlineIds} onLeave={leaveRoom} />;
  }

  return (
    <div className="lobby-screen">
      <div className="lobby-header">
        <h2>🎴 로비</h2>
        <button className="avatar-medallion" onClick={() => setShowAvatar(true)} title="캐릭터 변경">{me?.avatar || '🐱'}</button>
        <span className="lobby-user">
          <button className="nick-edit" title="닉네임 변경" onClick={async () => {
            const nick = prompt('새 닉네임 (2~12자)', me?.nickname);
            if (!nick || nick === me?.nickname) return;
            try {
              const r = await api('/api/nickname', { method: 'POST', body: { nickname: nick } });
              saveAuth(r.token, { ...user, nickname: r.nickname });
              setMe((m) => ({ ...m, nickname: r.nickname }));
              closeSocket(); getSocket();
            } catch (e) { setError(e.message); }
          }}>{me?.nickname} ✏️</button>
          <small>{me?.wins || 0}승 {me?.losses || 0}패 · 💰{(me?.money ?? 0).toLocaleString()}</small>
        </span>
        <button className="menu-btn small" onClick={() => setShowCreate(true)}>+ 방 만들기</button>
        <button className="menu-btn small" onClick={() => { closeSocket(); clearAuth(); onExit(); }}>로그아웃</button>
        <button className="menu-btn small" onClick={onExit}>← 메인</button>
      </div>

      {error && <p className="form-error" onClick={() => setError('')}>{error}</p>}
      {invite && (
        <div className="invite-banner">
          💌 {invite.from}님이 [{invite.name}] 방에 초대했어요!
          <button className="menu-btn small primary" onClick={() => { joinRoom(invite.code); setInvite(null); }}>참여</button>
          <button className="menu-btn small" onClick={() => setInvite(null)}>거절</button>
        </div>
      )}

      <div className="lobby-body">
        <div className="room-list">
          <h3>대기 중인 방</h3>
          {rooms.length === 0 && <p className="empty-hint">아직 방이 없어요. 첫 방을 만들어보세요!</p>}
          {rooms.map((r) => (
            <div key={r.code} className="room-item">
              <div>
                <b>{r.name}</b>
                <span className="room-meta"> {r.players.length}/{r.playerCount}명 {r.playing ? '· 게임중' : ''}</span>
              </div>
              <button className="menu-btn small" disabled={r.playing || r.players.length >= r.playerCount}
                onClick={() => joinRoom(r.code)}>입장</button>
            </div>
          ))}
        </div>

        <div className="friend-panel">
          <h3>친구</h3>
          <div className="friend-add">
            <input placeholder="닉네임으로 추가" value={friendNick} onChange={(e) => setFriendNick(e.target.value)} />
            <button className="menu-btn small" onClick={async () => {
              try { await api('/api/friends/request', { method: 'POST', body: { nickname: friendNick } }); setFriendNick(''); loadFriends(); }
              catch (e) { setError(e.message); }
            }}>추가</button>
          </div>
          {friends.map((f) => (
            <div key={f.id} className="friend-item">
              <span className={onlineIds.length && f.online !== false ? '' : ''}>
                {f.avatar || '🐱'} {f.nickname} <small>({f.wins}승 {f.losses}패)</small>
              </span>
              {f.status === 'pending' && f.incoming && (
                <span>
                  <button className="menu-btn small" onClick={async () => { await api('/api/friends/respond', { method: 'POST', body: { id: f.id, accept: true } }); loadFriends(); }}>수락</button>
                  <button className="menu-btn small" onClick={async () => { await api('/api/friends/respond', { method: 'POST', body: { id: f.id, accept: false } }); loadFriends(); }}>거절</button>
                </span>
              )}
              {f.status === 'pending' && !f.incoming && <small>요청중...</small>}
              {f.status === 'accepted' && (
                <button className="menu-btn small" onClick={() => { setDmFriend(f); setUnread((u) => ({ ...u, [f.userId]: 0 })); }}>
                  💬{unread[f.userId] > 0 && <span className="badge">{unread[f.userId]}</span>}
                </button>
              )}
            </div>
          ))}
          {friends.length === 0 && <p className="empty-hint">친구를 추가해보세요</p>}
        </div>
      </div>

      {showCreate && <CreateRoomModal onCreate={createRoom} onClose={() => setShowCreate(false)} />}
      {showAvatar && <AvatarPicker wins={me?.wins || 0} onClose={() => setShowAvatar(false)} onChange={(a) => setMe((m) => ({ ...m, avatar: a }))} />}
      {dmFriend && <DMChat friend={dmFriend} onClose={() => setDmFriend(null)} />}
    </div>
  );
}

// 방 대기실: 플레이어 목록 + 준비 + 채팅 + 친구 초대
function RoomWait({ room, friends, onlineIds, onLeave }) {
  const user = getUser();
  const [chat, setChat] = useState([]);
  const [msg, setMsg] = useState('');
  const chatRef = useRef(null);

  useEffect(() => {
    const s = getSocket();
    const onMsg = (m) => setChat((c) => [...c, m]);
    s.on('chat-message', onMsg);
    return () => s.off('chat-message', onMsg);
  }, []);

  useEffect(() => { chatRef.current?.scrollTo(0, 99999); }, [chat]);

  const me = room.players.find((p) => p.nickname === user?.nickname);
  const acceptedFriends = friends.filter((f) => f.status === 'accepted');

  return (
    <div className="lobby-screen">
      <div className="lobby-header">
        <h2>🏠 {room.name} <small className="room-code">코드: {room.code}</small></h2>
        <button className="menu-btn small" onClick={onLeave}>나가기</button>
      </div>
      <div className="lobby-body">
        <div className="room-list">
          <h3>플레이어 ({room.players.length}/{room.playerCount})</h3>
          {room.players.map((p) => (
            <div key={p.nickname} className="room-item">
              <span><span className='avatar-inline'>{p.avatar || '🐱'}</span> {p.nickname} {p.nickname === user?.nickname && '(나)'}</span>
              <span>{p.ready ? '✅ 준비완료' : '⏳ 대기중'}</span>
            </div>
          ))}
          <button className="menu-btn primary" style={{ marginTop: 12 }}
            onClick={() => getSocket().emit('set-ready', { ready: !me?.ready })}>
            {me?.ready ? '준비 취소' : '준비 완료'}
          </button>
          <p className="empty-hint">전원 준비되면 자동으로 시작됩니다</p>

          {acceptedFriends.length > 0 && (
            <>
              <h3 style={{ marginTop: 16 }}>친구 초대</h3>
              {acceptedFriends.map((f) => (
                <div key={f.id} className="room-item">
                  <span>{f.nickname}</span>
                  <button className="menu-btn small" onClick={() => getSocket().emit('invite-friend', { friendId: f.userId })}>초대</button>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="friend-panel chat-panel">
          <h3>💬 채팅</h3>
          <div className="chat-log" ref={chatRef}>
            {chat.map((m, i) => (
              <div key={i} className="chat-line"><b>{m.avatar} {m.nickname}</b> {m.text}</div>
            ))}
          </div>
          <form className="friend-add" onSubmit={(e) => {
            e.preventDefault();
            if (msg.trim()) { getSocket().emit('chat-message', { text: msg }); setMsg(''); }
          }}>
            <input placeholder="메시지..." value={msg} onChange={(e) => setMsg(e.target.value)} />
            <button className="menu-btn small">전송</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function CreateRoomModal({ onCreate, onClose }) {
  const [players, setPlayers] = useState(2);
  const [name, setName] = useState('');
  const [rules, setRules] = useState({ pibak: true, gwangbak: true, meongbak: true, heundeulgi: true, bomb: true, firstPpeok: true, gukjinAsPi: true });
  const [targetScore, setTargetScore] = useState(7);

  useEffect(() => { setTargetScore(players === 2 ? 7 : 3); }, [players]);

  const ruleItems = [
    ['pibak', '피박'], ['gwangbak', '광박'], ['meongbak', '멍따'],
    ['heundeulgi', '흔들기'], ['bomb', '폭탄'], ['firstPpeok', '첫뻑 보너스'], ['gukjinAsPi', '국진 쌍피'],
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>🏠 방 만들기</h2>
        <div className="modal-section">
          <label className="section-label">방 이름</label>
          <input className="room-name-input" placeholder="방 이름 (선택)" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
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
              <button key={s} className={`pick-btn ${targetScore === s ? 'active' : ''}`} onClick={() => setTargetScore(s)}>{s}점</button>
            ))}
          </div>
        </div>
        <div className="modal-section">
          <label className="section-label">룰 옵션</label>
          <div className="rule-list">
            {ruleItems.map(([k, label]) => (
              <label key={k} className="rule-item">
                <input type="checkbox" checked={rules[k]} onChange={() => setRules((r) => ({ ...r, [k]: !r[k] }))} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="menu-btn small" onClick={onClose}>취소</button>
          <button className="menu-btn primary small"
            onClick={() => onCreate({ playerCount: players, rules: { ...rules, targetScore } }, name)}>
            방 생성
          </button>
        </div>
      </div>
    </div>
  );
}
