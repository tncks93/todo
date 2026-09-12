"use client";

import Link from "next/link";
import { useAppStore } from "@/store";
import { formatDateKo, weeklyProgressRatio } from "@/lib/utils";
import ProgressBar from "@/components/shared/ProgressBar";
import WeeklyGoalItem from "@/components/weekly/WeeklyGoalItem";

function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export default function WeekPlanPanel() {
  const currentPlan = useAppStore((s) => s.currentPlan);
  const toggleWeeklyGoal = useAppStore((s) => s.toggleWeeklyGoal);
  const todos = useAppStore((s) => s.todos);

  if (!currentPlan) {
    return (
      <section className="flex flex-col items-start gap-3 rounded-md border border-hairline bg-canvas p-5">
        <h3 className="text-sm font-semibold text-ink">이번 주 계획</h3>
        <p className="text-sm text-muted">이번 주 계획이 아직 없어요</p>
        <Link
          href="/weekly"
          className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-active"
        >
          주간 계획 만들러 가기
        </Link>
      </section>
    );
  }

  const plan = currentPlan;
  const total = plan.goals.length;
  const doneCount = plan.goals.filter((g) => g.done).length;
  const linkedTodos = todos.filter((t) => t.weeklyPlanId === plan._id);
  const ratio = weeklyProgressRatio({
    goalsTotal: total,
    goalsDone: doneCount,
    todosTotal: linkedTodos.length,
    todosDone: linkedTodos.filter((t) => t.status === "done").length,
  });

  return (
    <section className="flex flex-col gap-3 rounded-md border border-hairline bg-canvas p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">이번 주 계획</h3>
        <span className="shrink-0 text-xs text-muted">
          {formatDateKo(plan.weekStart)} ~ {formatDateKo(addDaysISO(plan.weekStart, 6))}
        </span>
      </div>

      <ProgressBar value={ratio} showLabel />

      {total === 0 ? (
        <p className="text-sm text-muted">등록된 목표가 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {plan.goals.map((g, i) => (
            <WeeklyGoalItem
              key={i}
              text={g.text}
              done={g.done}
              onToggle={(done) => toggleWeeklyGoal(plan._id, i, done)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
