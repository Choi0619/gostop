// 고스톱 서버: 인증 API + Socket.IO 실시간 대전
import express from 'express';
import http from 'http';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { query, initDb } from './db.js';
import { attachGameSockets } from './rooms.js';

const JWT_SECRET = process.env.JWT_SECRET || 'gostop-dev-secret';
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());

const sign = (u) => jwt.sign({ id: u.id, nickname: u.nickname }, JWT_SECRET, { expiresIn: '30d' });

function authMiddleware(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: '로그인이 필요합니다' });
  }
}

// ── 인증 ──
app.post('/api/register', async (req, res) => {
  const { username, nickname, password } = req.body;
  if (!username || !nickname || !password) return res.status(400).json({ error: '모든 항목을 입력하세요' });
  if (password.length < 4) return res.status(400).json({ error: '비밀번호는 4자 이상' });
  try {
    const hash = bcrypt.hashSync(password, 10);
    await query('INSERT INTO users (username, nickname, password_hash) VALUES ($1, $2, $3)', [username, nickname, hash]);
    const [u] = await query('SELECT * FROM users WHERE username = $1', [username]);
    res.json({ token: sign(u), user: { id: u.id, nickname: u.nickname, money: u.money, avatar: u.avatar } });
  } catch (e) {
    res.status(400).json({ error: '이미 사용 중인 아이디 또는 닉네임입니다' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const [u] = await query('SELECT * FROM users WHERE username = $1', [username]);
  if (!u || !bcrypt.compareSync(password || '', u.password_hash)) {
    return res.status(401).json({ error: '아이디 또는 비밀번호가 틀립니다' });
  }
  res.json({ token: sign(u), user: { id: u.id, nickname: u.nickname, money: u.money, wins: u.wins, losses: u.losses, avatar: u.avatar } });
});

app.get('/api/me', authMiddleware, async (req, res) => {
  const [u] = await query('SELECT id, nickname, money, wins, losses, avatar FROM users WHERE id = $1', [req.user.id]);
  res.json(u);
});

// 캐릭터: 승수로 잠금해제
export const AVATAR_UNLOCKS = { '🐢': 3, '🦅': 7, '🐗': 12, '🦌': 20, '🐦': 30, '🦄': 50 };
const AVATARS = ['🐱', '🐶', '🐰', '🦊', '🐯', '🐻', '🐸', '🐢', '🦅', '🐗', '🦌', '🐦', '🦄'];

app.post('/api/avatar', authMiddleware, async (req, res) => {
  const { avatar } = req.body;
  if (!AVATARS.includes(avatar)) return res.status(400).json({ error: '없는 캐릭터입니다' });
  const [u] = await query('SELECT wins FROM users WHERE id = $1', [req.user.id]);
  const need = AVATAR_UNLOCKS[avatar] || 0;
  if ((u?.wins || 0) < need) return res.status(400).json({ error: `${need}승 달성 시 해금됩니다` });
  await query('UPDATE users SET avatar = $1 WHERE id = $2', [avatar, req.user.id]);
  res.json({ ok: true, avatar });
});

// ── 친구 ──
app.get('/api/friends', authMiddleware, async (req, res) => {
  const rows = await query(
    `SELECT f.id, f.status, f.user_id, f.friend_id,
            u.nickname, u.wins, u.losses, u.avatar
     FROM friends f
     JOIN users u ON u.id = CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END
     WHERE f.user_id = $1 OR f.friend_id = $1`,
    [req.user.id]
  );
  res.json(rows.map((r) => ({
    id: r.id,
    nickname: r.nickname,
    avatar: r.avatar,
    wins: r.wins,
    losses: r.losses,
    status: r.status,
    incoming: r.friend_id === req.user.id && r.status === 'pending',
  })));
});

app.post('/api/friends/request', authMiddleware, async (req, res) => {
  const [target] = await query('SELECT id FROM users WHERE nickname = $1', [req.body.nickname]);
  if (!target) return res.status(404).json({ error: '없는 닉네임입니다' });
  if (target.id === req.user.id) return res.status(400).json({ error: '자기 자신은 추가할 수 없어요' });
  try {
    await query('INSERT INTO friends (user_id, friend_id) VALUES ($1, $2)', [req.user.id, target.id]);
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: '이미 요청했거나 친구입니다' });
  }
});

app.post('/api/friends/respond', authMiddleware, async (req, res) => {
  const { id, accept } = req.body;
  if (accept) await query(`UPDATE friends SET status = 'accepted' WHERE id = $1 AND friend_id = $2`, [id, req.user.id]);
  else await query('DELETE FROM friends WHERE id = $1 AND friend_id = $2', [id, req.user.id]);
  res.json({ ok: true });
});

// ── 서버 기동 ──
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.use((socket, next) => {
  try {
    socket.user = jwt.verify(socket.handshake.auth?.token || '', JWT_SECRET);
    next();
  } catch {
    next(new Error('unauthorized'));
  }
});

attachGameSockets(io);

// async 라우트 오류로 프로세스가 죽지 않도록
process.on('unhandledRejection', (e) => console.error('unhandledRejection:', e));

await initDb();
server.listen(PORT, () => console.log(`고스톱 서버 :${PORT}`));
