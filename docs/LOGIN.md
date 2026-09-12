현재 할일 앱에 GitHub OAuth 로그인을 추가해줘.

## 완료 조건 (Acceptance Criteria)
- [x] GitHub OAuth App 설정 가이드 또는 .env.example 제공 — `.env.example` + README "GitHub OAuth 로그인" 절
- [x] /auth/github, /auth/github/callback 라우트 동작 — 실사용자(tncks93) 로그인으로 실증
- [x] 로그인 후 GitHub username, avatar_url을 DB에 저장 — `users` 컬렉션에 실제 로그인 결과 확인 (githubId 85801663, username tncks93)
- [x] 로그인하지 않은 사용자는 할일 목록에 접근 불가 (401 또는 리다이렉트) — API 401, 페이지 307 리다이렉트를 curl로 확인
- [x] 로그인한 사용자는 본인의 할일만 조회/수정/삭제 가능 — todos/goals/weekly 전 라우트 userId 스코핑, 타 사용자 접근 404로 실증
- [x] 로그아웃 시 세션 완전 삭제 — `/auth/logout`이 서버 측 Session 문서를 삭제, 폐기된 토큰은 이후 401
- [x] 기존 할일 데이터 스키마에 user_id 컬럼 추가 및 마이그레이션 — `scripts/migrate-add-user-id.mjs` (로그인 전 생성된 기존 문서 1건씩은 사용자가 로그인 후 본인 ObjectId로 마이그레이션 실행 필요, README 안내됨)

## 하지 말아야 할 것
- 기존 할일 CRUD 로직 변경 금지
- 하드코딩된 CLIENT_SECRET 금지
- 미완성 상태로 "완료"라고 보고하지 말 것