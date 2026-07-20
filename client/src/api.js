const BASE = import.meta.env.VITE_API_URL || '';

export function getToken() { return localStorage.getItem('gostop_token'); }
export function getUser() {
  try { return JSON.parse(localStorage.getItem('gostop_user')); } catch { return null; }
}
export function saveAuth(token, user) {
  localStorage.setItem('gostop_token', token);
  localStorage.setItem('gostop_user', JSON.stringify(user));
}
export function clearAuth() {
  localStorage.removeItem('gostop_token');
  localStorage.removeItem('gostop_user');
}

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || '요청 실패');
  return data;
}
