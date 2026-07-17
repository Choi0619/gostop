# 고스톱 (Go-Stop)

한국 전통 화투 게임 고스톱의 웹 버전.

## 구성

- `client/` — React (Vite) 프론트엔드. 화투 48장 자체 제작 SVG 카드.
- `server/` — FastAPI 백엔드 + PostgreSQL (예정)

## 로드맵

1. ✅ 화투 SVG 카드 + 메인화면
2. ⬜ 고스톱 룰 엔진 (맞고 7점 / 3인 고스톱 3점)
3. ⬜ AI 맞고 대전
4. ⬜ 로그인 / DB / 게임머니
5. ⬜ 친구 추가 + 온라인 실시간 대전 (WebSocket)
6. ⬜ 룰 변형 옵션

## 개발

```bash
cd client
npm install
npm run dev
```
