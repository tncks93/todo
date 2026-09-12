"use client";

import { useAppStore } from "@/store";

export default function GoalWeeklyPanel() {
  const goals = useAppStore((s) => s.goals);
  const todos = useAppStore((s) => s.todos);
  const currentPlan = useAppStore((s) => s.currentPlan);

  const planId = currentPlan?._id ?? null;

  return (
    <section className="flex flex-col gap-3 rounded-md border border-hairline bg-canvas p-5">
      <h3 className="text-sm font-semibold text-ink">
        1년 목표별 이번 주 할 일
      </h3>

      {goals.length === 0 ? (
        <p className="text-sm text-muted">등록된 목표가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {goals.map((goal) => {
            const count = planId
              ? todos.filter(
                  (t) => t.goalId === goal._id && t.weeklyPlanId === planId
                ).length
              : 0;
            return (
              <li
                key={goal._id}
                className="flex items-center justify-between gap-3 rounded-sm border border-hairline px-3 py-2"
              >
                <span className="truncate text-sm text-ink">
                  {goal.title}
                </span>
                <span className="shrink-0 text-xs font-medium text-muted">
                  {count}개
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
