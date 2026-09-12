# 할일 + 계획 관리 앱 (todo-planner)

단기 실행(할일)과 중기/장기 목표(주간 계획 · 1년 목표)를 하나의 구조로 연결해
"무엇을 하는지"와 "왜 · 어디로 가는지"를 함께 관리하는 앱.

- 상세 기획: [`docs/PRD.md`](docs/PRD.md)
- 구현 계획: [`docs/PLAN.md`](docs/PLAN.md)

## 기술 스택

| 영역 | 선택 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript |
| DB | MongoDB + Mongoose |
| 스타일 | Tailwind CSS |
| 상태 관리 | Zustand (슬라이스 구조) |
| 드래그앤드랍 | dnd-kit |
| 카드 순서 | fractional-indexing (`order` 문자열, 이동 시 PATCH 1회) |

## 시작하기

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env.local
# .env.local 의 MONGODB_URI / GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET / APP_URL 를 채운다
# (GitHub OAuth App 발급 방법은 아래 "GitHub OAuth 로그인" 절 참고)

# 3. 개발 서버
npm run dev            # http://localhost:3000

# 4. 프로덕션 빌드 / 린트
npm run build
npm run lint

# 5. API 통합 스모크 테스트 (dev 서버가 떠 있는 상태에서)
npm run test:api
```

> `npm run test:api`는 `node --env-file=.env.local`을 사용하므로 **Node.js 20.6 이상**이
> 필요하고, `.env.local` 파일이 없으면 즉시 실패한다.

### 환경 변수

| 이름 | 필수 | 설명 |
|------|------|------|
| `MONGODB_URI` | ✅ | MongoDB Atlas 연결 문자열. `.env.local` 에 저장 (git 무시됨). |
| `GITHUB_CLIENT_ID` | ✅ | GitHub OAuth App의 Client ID |
| `GITHUB_CLIENT_SECRET` | ✅ | GitHub OAuth App의 Client Secret — 코드에 하드코딩 금지, `.env.local`에만 저장 |
| `APP_URL` | ✅ | 앱이 서비스되는 base URL (예: `http://localhost:3000`). OAuth callback URL 생성에 사용. 프로덕션(`NODE_ENV=production`)에서 비어 있으면 앱이 즉시 에러를 던진다 — Host 헤더를 신뢰해 리다이렉트 URL을 만들지 않기 위함 |

모든 값은 `.env.local`에만 두고(`.gitignore`에 의해 git에서 제외됨), `.env.example`은
플레이스홀더만 커밋한다.

## GitHub OAuth 로그인

### 1. GitHub OAuth App 만들기

1. https://github.com/settings/developers → "New OAuth App"
2. Homepage URL: `http://localhost:3000` (배포 시 실제 도메인)
3. **Authorization callback URL**: `http://localhost:3000/auth/github/callback`
   (배포 시 `<APP_URL>/auth/github/callback`으로 정확히 일치해야 한다)
4. 발급된 Client ID / Client Secret을 `.env.local`의 `GITHUB_CLIENT_ID` /
   `GITHUB_CLIENT_SECRET`에 채운다.

### 2. 로그인 흐름

| 라우트 | 설명 |
|--------|------|
| `GET /auth/github` | GitHub 인증 화면으로 리다이렉트 (CSRF `state` 쿠키 발급) |
| `GET /auth/github/callback` | `code` 교환 → GitHub 사용자 조회 → `User` upsert → 세션 생성 → `/`로 리다이렉트 |
| `POST /auth/logout` | 서버 측 세션 문서 삭제(완전 삭제) + 쿠키 제거 → `/login`으로 리다이렉트 |
| `/login` | 로그인 안 된 사용자가 리다이렉트되는 페이지 |

세션은 JWT가 아니라 **DB에 저장되는 opaque 토큰**(`models/Session.ts`, TTL 30일)이라
로그아웃 시 서버에서 즉시 무효화된다. `middleware.ts`는 쿠키 존재 여부만으로 페이지
접근을 빠르게 막고(`/`, `/todos`, `/weekly`, `/goals`), 실제 인가는 각 API 라우트가
`lib/auth/requireUser.ts`로 세션을 DB에서 검증해 수행한다.

모든 `/api/*` 라우트는 로그인 세션을 요구하며, 각 사용자는 **본인 소유(`userId`)
문서만** 조회·수정·삭제할 수 있다(다른 사용자의 문서는 `404`). 로그인하지 않은 요청은
`401` 이다.

### 3. 기존 데이터 마이그레이션

로그인 기능 도입 이전에 만들어진 문서에는 `userId` 가 없으므로 한 번 마이그레이션이
필요하다.

```bash
# 1. 리포트만 출력 (아무것도 변경하지 않음)
node --env-file=.env.local scripts/migrate-add-user-id.mjs

# 2. userId 없는 문서를 특정 사용자에게 귀속
node --env-file=.env.local scripts/migrate-add-user-id.mjs --user-id <ObjectId>
```

`<ObjectId>` 는 한 번 로그인한 뒤 `users` 컬렉션에서 본인 문서의 `_id` 를 확인하면
된다. 대상 컬렉션은 `todos`, `goals`, `weeklyplans` 이다.

## 데이터 모델

### User — GitHub 계정
`githubId`(unique), `username`, `avatarUrl`, `createdAt`, `updatedAt`

### Session — 로그인 세션 (서버 측 저장, JWT 아님)
`token`(unique), `userId`(→ User), `expiresAt`(TTL 인덱스로 자동 만료 삭제)

### Goal — 1년 목표
`userId`(→ User), `title`, `description`, `progress`(0–100, 연결된 todo 완료율),
`createdAt`, `updatedAt`

### WeeklyPlan — 주간 계획
`userId`(→ User), `weekStart`(월요일 00:00), `goals`: `{ text, done }[]` (최대 5), `memo`,
`retrospective`, `goalId?`(→ Goal), `createdAt`, `updatedAt`

### Todo — 할일
`userId`(→ User), `title`, `description?`, `status`(`todo|doing|done`),
`priority`(`high|medium|low`), `dueDate?`, `dayOfWeek?`(0=일 … 6=토),
`order`(fractional index 문자열), `weeklyPlanId?`(→ WeeklyPlan), `goalId?`(→ Goal),
`createdAt`, `updatedAt`

인덱스: `Todo { status: 1, order: 1 }`, `WeeklyPlan { userId: 1, weekStart: 1 } unique`
(같은 주라도 사용자가 다르면 각자 계획을 가질 수 있다), `User { githubId } unique`,
`Session { token } unique`, `Session { expiresAt }` TTL.

## API 라우트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET / POST | `/api/goals` | 목록 / 생성 |
| GET / PUT / DELETE | `/api/goals/[id]` | 단건 조회 / 수정 / 삭제 |
| GET | `/api/weekly?limit=N` | 최근 N주 |
| GET | `/api/weekly?weekStart=<iso>` | 해당 주 계획(없으면 `null`) |
| POST | `/api/weekly` | 생성 (같은 주 중복 시 `409`) |
| GET / PUT / DELETE | `/api/weekly/[id]` | 조회 / 수정 / 삭제 |
| PATCH | `/api/weekly/[id]` | `{ goalIndex, done }` — 주간 목표 완료 토글 |
| GET | `/api/todos?status=&weeklyPlanId=&goalId=` | 필터 조회 |
| POST | `/api/todos` | 생성 (컬럼 맨 뒤 `order` 자동 부여) |
| GET / PUT / DELETE | `/api/todos/[id]` | 조회 / 수정 / 삭제 |
| PATCH | `/api/todos/[id]` | `{ status?, order? }` — 드래그 이동 1회 반영 |

모든 라우트는 로그인 세션이 필요하며(없으면 `401`), 응답 데이터는 항상 요청자 본인
소유로 스코핑된다. 오류 규약: 로그인 안 됨 → `401`, 잘못된 ObjectId → `400`, 없는/타인
소유 리소스 → `404`, 중복 주차(본인 기준) → `409`, 서버 오류 → `500`.

## 디렉토리 구조

```
app/            App Router 페이지 + /api 라우트 핸들러
app/auth/       github · github/callback · logout (OAuth 라우트 핸들러)
app/login/      로그인 페이지
components/     layout · shared · goals · weekly · todos
lib/            mongodb(연결 캐시) · api · apiClient · fractionalIndex · utils · week
lib/auth/       constants · session(세션 CRUD) · requireUser(API 라우트 가드) ·
                appUrl(콜백 URL 계산) · assertOwnedRef(참조 소유권 검증)
models/         User · Session · Goal · WeeklyPlan · Todo (Mongoose)
store/          Zustand 루트 + goalSlice · weeklySlice · todoSlice
types/          공통 인터페이스
docs/           PRD · PLAN · LOGIN
scripts/        api-smoke.mjs · migrate-add-user-id.mjs
middleware.ts   비로그인 사용자를 /login 으로 리다이렉트 (쿠키 존재 여부만 확인)
```

## 주요 화면

- `/` — 대시보드: 이번 주 계획 · 상태별 할일 수 · 주간 진행률 · 목표별 연결 할일
- `/todos` — 칸반 보드: 3열(할 일 / 진행 중 / 완료) 드래그앤드랍, 이동 시 PATCH 1회
- `/weekly` — 주간 계획 목록 및 상세(요일 그리드 · 메모 · 회고)
- `/goals` — 1년 목표 CRUD 및 진행률
