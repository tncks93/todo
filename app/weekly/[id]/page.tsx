"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { formatDateKo, weeklyProgressRatio } from "@/lib/utils";
import type { WeeklyPlanInput } from "@/types";
import ProgressBar from "@/components/shared/ProgressBar";
import WeeklyGoalItem from "@/components/weekly/WeeklyGoalItem";
import WeekGrid from "@/components/weekly/WeekGrid";
import WeeklyPlanForm from "@/components/weekly/WeeklyPlanForm";
import Modal from "@/components/shared/Modal";

function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export default function WeeklyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();

  const currentPlan = useAppStore((s) => s.currentPlan);
  const weeklyLoading = useAppStore((s) => s.weeklyLoading);
  const weeklyError = useAppStore((s) => s.weeklyError);
  const fetchWeeklyPlan = useAppStore((s) => s.fetchWeeklyPlan);
  const toggleWeeklyGoal = useAppStore((s) => s.toggleWeeklyGoal);
  const updateWeeklyPlan = useAppStore((s) => s.updateWeeklyPlan);
  const deleteWeeklyPlan = useAppStore((s) => s.deleteWeeklyPlan);
  const todos = useAppStore((s) => s.todos);
  const fetchTodos = useAppStore((s) => s.fetchTodos);
  const updateTodo = useAppStore((s) => s.updateTodo);

  const [memoDraft, setMemoDraft] = useState<{ id: string; value: string } | null>(
    null
  );
  const [retroDraft, setRetroDraft] = useState<
    { id: string; value: string } | null
  >(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    fetchWeeklyPlan(id);
    fetchTodos({ weeklyPlanId: id });
  }, [id, fetchWeeklyPlan, fetchTodos]);

  const plan = currentPlan && currentPlan._id === id ? currentPlan : null;

  if (weeklyLoading && !plan) {
    return <p className="text-sm text-gray-500">불러오는 중...</p>;
  }
  if (weeklyError && !plan) {
    return <p className="text-sm text-red-600">{weeklyError}</p>;
  }
  if (!plan) {
    return (
      <p className="text-sm text-gray-500">주간 계획을 찾을 수 없습니다.</p>
    );
  }

  const memo = memoDraft?.id === id ? memoDraft.value : plan.memo;
  const retrospective =
    retroDraft?.id === id ? retroDraft.value : plan.retrospective;
  const total = plan.goals.length;
  const doneCount = plan.goals.filter((g) => g.done).length;
  const linkedTodos = todos.filter((t) => t.weeklyPlanId === plan._id);
  const ratio = weeklyProgressRatio({
    goalsTotal: total,
    goalsDone: doneCount,
    todosTotal: linkedTodos.length,
    todosDone: linkedTodos.filter((t) => t.status === "done").length,
  });

  const handleDelete = async () => {
    if (!window.confirm("이 주간 계획을 삭제할까요?")) return;
    await deleteWeeklyPlan(id);
    router.push("/weekly");
  };

  const handleMemoBlur = async () => {
    if (memo === plan.memo) return;
    await updateWeeklyPlan(id, { memo });
  };

  const handleRetrospectiveBlur = async () => {
    if (retrospective === plan.retrospective) return;
    await updateWeeklyPlan(id, { retrospective });
  };

  const handleEditSubmit = async (input: WeeklyPlanInput) => {
    await updateWeeklyPlan(id, {
      goals: input.goals,
      memo: input.memo,
      goalId: input.goalId,
    });
    setEditOpen(false);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-gray-900">
          {formatDateKo(plan.weekStart)} ~{" "}
          {formatDateKo(addDaysISO(plan.weekStart, 6))}
        </h2>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
          >
            수정
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            삭제
          </button>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-900">주간 목표</h3>
          <div className="w-40">
            <ProgressBar value={ratio} showLabel />
          </div>
        </div>
        {total === 0 ? (
          <p className="text-sm text-gray-500">등록된 목표가 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {plan.goals.map((g, i) => (
              <WeeklyGoalItem
                key={i}
                text={g.text}
                done={g.done}
                onToggle={(done) => toggleWeeklyGoal(id, i, done)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <label
          htmlFor="weekly-detail-memo"
          className="text-sm font-semibold text-gray-900"
        >
          메모
        </label>
        <textarea
          id="weekly-detail-memo"
          value={memo}
          onChange={(e) => setMemoDraft({ id, value: e.target.value })}
          onBlur={handleMemoBlur}
          placeholder="이번 주 메모"
          rows={3}
          className="resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
        />
      </section>

      <section className="flex flex-col gap-2">
        <label
          htmlFor="weekly-detail-retrospective"
          className="text-sm font-semibold text-gray-900"
        >
          주간 회고
        </label>
        <textarea
          id="weekly-detail-retrospective"
          value={retrospective}
          onChange={(e) => setRetroDraft({ id, value: e.target.value })}
          onBlur={handleRetrospectiveBlur}
          placeholder="이번 주 회고"
          rows={3}
          className="resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
        />
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-gray-900">요일별 할일</h3>
        <p className="text-xs text-gray-400">
          할 일의 &quot;요일 배치&quot;는 할 일 카드를 열어 설정합니다.
          여기서는 ✕로 배치를 해제할 수 있습니다.
        </p>
        <WeekGrid
          todos={todos}
          onAssignDay={(todoId, dayOfWeek) =>
            updateTodo(todoId, { dayOfWeek })
          }
        />
      </section>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="주간 계획 수정"
      >
        <WeeklyPlanForm
          initial={{
            weekStart: plan.weekStart,
            goals: plan.goals,
            memo: plan.memo,
            goalId: plan.goalId,
          }}
          submitLabel="수정 완료"
          onSubmit={handleEditSubmit}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>
    </div>
  );
}
