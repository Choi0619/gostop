// DB 어댑터: DATABASE_URL 있으면 Postgres(Render), 없으면 로컬 SQLite
// query(sql, params) — sql은 $1, $2 플레이스홀더로 통일

let query;

if (process.env.DATABASE_URL) {
  const { default: pg } = await import('pg');
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  query = async (sql, params = []) => (await pool.query(sql, params)).rows;
} else {
  const { default: Database } = await import('better-sqlite3');
  const { fileURLToPath } = await import('url');
  const db = new Database(fileURLToPath(new URL('./gostop.db', import.meta.url)));
  db.pragma('journal_mode = WAL');
  query = async (sql, params = []) => {
    // $1, $2... → :p1, :p2 (같은 번호 중복 사용 지원)
    const converted = sql.replace(/\$(\d+)/g, ':p$1').replace(/SERIAL PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
    const bound = Object.fromEntries(params.map((v, i) => [`p${i + 1}`, v]));
    const stmt = db.prepare(converted);
    if (/^\s*select/i.test(converted) || /returning/i.test(converted)) return stmt.all(bound);
    stmt.run(bound);
    return [];
  };
}

export { query };

export async function initDb() {
  await query(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    nickname TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    money INTEGER DEFAULT 100000,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )`.replace("(datetime('now'))", process.env.DATABASE_URL ? 'now()::text' : "(datetime('now'))"));

  try { await query(`ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT '🐱'`); } catch { /* 이미 있음 */ }
  try { await query(`ALTER TABLE users ADD COLUMN email TEXT`); } catch { /* 이미 있음 */ }
  try { await query(`ALTER TABLE users ADD COLUMN rp INTEGER DEFAULT 0`); } catch { /* 이미 있음 */ }
  try { await query(`ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'classic'`); } catch { /* 이미 있음 */ }

  // 개인 전적 기록 (1판당 참가자 수만큼 행)
  await query(`CREATE TABLE IF NOT EXISTS match_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    won INTEGER NOT NULL,
    score INTEGER DEFAULT 0,
    rp_delta INTEGER DEFAULT 0,
    players INTEGER DEFAULT 2,
    opponents TEXT,
    ts INTEGER NOT NULL
  )`);

  await query(`CREATE TABLE IF NOT EXISTS dms (
    id SERIAL PRIMARY KEY,
    from_id INTEGER NOT NULL,
    to_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    ts INTEGER NOT NULL,
    read INTEGER DEFAULT 0
  )`);

  await query(`CREATE TABLE IF NOT EXISTS friends (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    UNIQUE(user_id, friend_id)
  )`);

  await query(`CREATE TABLE IF NOT EXISTS game_results (
    id SERIAL PRIMARY KEY,
    room_code TEXT,
    winner_id INTEGER,
    detail TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`.replace("(datetime('now'))", process.env.DATABASE_URL ? 'now()::text' : "(datetime('now'))"));
}
