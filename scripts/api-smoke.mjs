/**
 * End-to-end CRUD smoke test against a running dev server.
 *
 *   1. npm run dev           (in one terminal, with a real MONGODB_URI in .env.local)
 *   2. Log in once at http://localhost:3000/auth/github in a browser, then copy
 *      the `session_token` cookie value (devtools -> Application/Storage -> Cookies)
 *   3. SMOKE_SESSION_TOKEN=<value> npm run test:api   (in another terminal)
 *
 * Every route now requires a logged-in session, so this script sends the
 * given token as the session cookie on each request. Without it every
 * request 401s, so it fails fast with a message instead of running.
 *
 * Idempotent: uses a fixed far-future test week and deletes any pre-existing
 * plan for it before creating a fresh one, so the run doesn't depend on
 * whether you've already clicked around the UI for the current week.
 *
 * Exits 0 when every assertion passes, 1 otherwise.
 */

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const SESSION_TOKEN = process.env.SMOKE_SESSION_TOKEN;

if (!SESSION_TOKEN) {
  console.error(
    "SMOKE_SESSION_TOKEN is not set. Log in at /auth/github in a browser, " +
      "copy the `session_token` cookie value, then re-run:\n" +
      "  SMOKE_SESSION_TOKEN=<value> npm run test:api"
  );
  process.exit(1);
}

// A fixed Monday far in the future, reserved for this smoke test.
const TEST_WEEK_START = "2030-01-07T00:00:00.000Z";

let passed = 0;
let failed = 0;

function ok(name, cond, extra = "") {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name} ${extra}`);
  }
}

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Cookie: `session_token=${SESSION_TOKEN}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* empty body */
  }
  return { status: res.status, json };
}

async function main() {
  console.log(`API smoke test -> ${BASE}\n`);

  // ---- Goals ----
  console.log("Goals");
  const gCreate = await req("POST", "/api/goals", {
    title: "3년 안에 시니어 개발자",
    description: "설계/리뷰 역량 강화",
  });
  ok("POST /api/goals -> 201", gCreate.status === 201, `got ${gCreate.status}`);
  const goalId = gCreate.json?._id;
  ok("created goal has _id", Boolean(goalId));

  const gList = await req("GET", "/api/goals");
  ok("GET /api/goals -> 200 array", gList.status === 200 && Array.isArray(gList.json));
  ok(
    "list contains created goal",
    gList.json?.some?.((g) => g._id === goalId)
  );

  const gUpd = await req("PUT", `/api/goals/${goalId}`, { progress: 25 });
  ok("PUT /api/goals/:id -> progress 25", gUpd.status === 200 && gUpd.json?.progress === 25);

  const gBad = await req("GET", "/api/goals/not-an-objectid");
  ok("GET /api/goals/:badId -> 400", gBad.status === 400, `got ${gBad.status}`);

  const gMissing = await req("GET", "/api/goals/000000000000000000000000");
  ok("GET /api/goals/:missingId -> 404", gMissing.status === 404, `got ${gMissing.status}`);

  // ---- Weekly ----
  console.log("Weekly plans");
  const weekStart = TEST_WEEK_START;

  // Idempotency: clear out any plan left over from a previous run of this script.
  const existing = await req("GET", `/api/weekly?weekStart=${encodeURIComponent(weekStart)}`);
  if (existing.json?._id) {
    await req("DELETE", `/api/weekly/${existing.json._id}`);
  }

  const wBad = await req("GET", "/api/weekly/not-an-objectid");
  ok("GET /api/weekly/:badId -> 400", wBad.status === 400, `got ${wBad.status}`);

  const wMissing = await req("GET", "/api/weekly/000000000000000000000000");
  ok("GET /api/weekly/:missingId -> 404", wMissing.status === 404, `got ${wMissing.status}`);

  const wCreate = await req("POST", "/api/weekly", {
    weekStart,
    goals: [
      { text: "알고리즘 5문제", done: false },
      { text: "PR 3건 리뷰", done: false },
    ],
    memo: "집중 주간",
    goalId,
  });
  ok("POST /api/weekly -> 201", wCreate.status === 201, `got ${wCreate.status}`);
  const planId = wCreate.json?._id;

  const wDup = await req("POST", "/api/weekly", { weekStart });
  ok("POST /api/weekly same week -> 409", wDup.status === 409, `got ${wDup.status}`);

  const wPut = await req("PUT", `/api/weekly/${planId}`, {
    memo: "수정된 메모",
    retrospective: "이번 주 회고",
  });
  ok(
    "PUT /api/weekly/:id updates memo + retrospective",
    wPut.status === 200 &&
      wPut.json?.memo === "수정된 메모" &&
      wPut.json?.retrospective === "이번 주 회고"
  );

  const wPatch = await req("PATCH", `/api/weekly/${planId}`, { goalIndex: 0, done: true });
  ok(
    "PATCH /api/weekly/:id toggles goals[0].done",
    wPatch.status === 200 && wPatch.json?.goals?.[0]?.done === true
  );

  const wByWeek = await req(
    "GET",
    `/api/weekly?weekStart=${encodeURIComponent(weekStart)}`
  );
  ok("GET /api/weekly?weekStart= -> the plan", wByWeek.json?._id === planId);

  // ---- Todos ----
  console.log("Todos");

  const tBad = await req("GET", "/api/todos/not-an-objectid");
  ok("GET /api/todos/:badId -> 400", tBad.status === 400, `got ${tBad.status}`);

  const tMissing = await req("GET", "/api/todos/000000000000000000000000");
  ok("GET /api/todos/:missingId -> 404", tMissing.status === 404, `got ${tMissing.status}`);

  const t1 = await req("POST", "/api/todos", { title: "설계 문서 초안", weeklyPlanId: planId, goalId });
  const t2 = await req("POST", "/api/todos", { title: "테스트 추가", weeklyPlanId: planId });
  ok("POST /api/todos x2 -> 201", t1.status === 201 && t2.status === 201);
  ok(
    "todos get distinct order keys",
    Boolean(t1.json?.order) && Boolean(t2.json?.order) && t1.json.order !== t2.json.order
  );

  const tGet = await req("GET", `/api/todos/${t1.json._id}`);
  ok("GET /api/todos/:id -> the todo", tGet.status === 200 && tGet.json?._id === t1.json._id);

  const tPut = await req("PUT", `/api/todos/${t1.json._id}`, {
    description: "상세 설명 추가",
    priority: "high",
  });
  ok(
    "PUT /api/todos/:id updates description + priority",
    tPut.status === 200 &&
      tPut.json?.description === "상세 설명 추가" &&
      tPut.json?.priority === "high"
  );

  const tMove = await req("PATCH", `/api/todos/${t1.json._id}`, {
    status: "doing",
    order: "Zz",
  });
  ok(
    "PATCH /api/todos/:id updates status + order in one call",
    tMove.status === 200 && tMove.json?.status === "doing" && tMove.json?.order === "Zz"
  );

  const tFilter = await req("GET", `/api/todos?status=doing`);
  ok(
    "GET /api/todos?status=doing filters",
    tFilter.status === 200 && tFilter.json.every((t) => t.status === "doing")
  );

  const tByPlan = await req("GET", `/api/todos?weeklyPlanId=${planId}`);
  ok("GET /api/todos?weeklyPlanId= filters", tByPlan.json.length >= 2);

  // ---- Cleanup ----
  console.log("Cleanup");
  const d1 = await req("DELETE", `/api/todos/${t1.json._id}`);
  const d2 = await req("DELETE", `/api/todos/${t2.json._id}`);
  const d3 = await req("DELETE", `/api/weekly/${planId}`);
  const d4 = await req("DELETE", `/api/goals/${goalId}`);
  ok("DELETE all fixtures -> 200", [d1, d2, d3, d4].every((d) => d.status === 200));

  const gGone = await req("GET", `/api/goals/${goalId}`);
  ok("deleted goal -> 404", gGone.status === 404, `got ${gGone.status}`);

  const tGone = await req("GET", `/api/todos/${t1.json._id}`);
  ok("deleted todo -> 404", tGone.status === 404, `got ${tGone.status}`);

  const wGone = await req("GET", `/api/weekly/${planId}`);
  ok("deleted weekly plan -> 404", wGone.status === 404, `got ${wGone.status}`);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("\nSmoke test crashed:", err);
  process.exit(1);
});
