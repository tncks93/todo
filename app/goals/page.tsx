"use client";

import { useEffect, useState } from "react";
import type { GoalInput } from "@/types";
import { useAppStore } from "@/store";
import Modal from "@/components/shared/Modal";
import GoalCard from "@/components/goals/GoalCard";
import GoalForm from "@/components/goals/GoalForm";

export default function GoalsPage() {
  const goals = useAppStore((s) => s.goals);
  const goalsLoading = useAppStore((s) => s.goalsLoading);
  const goalsError = useAppStore((s) => s.goalsError);
  const fetchGoals = useAppStore((s) => s.fetchGoals);
  const addGoal = useAppStore((s) => s.addGoal);
  const todos = useAppStore((s) => s.todos);
  const fetchTodos = useAppStore((s) => s.fetchTodos);

  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchGoals();
    fetchTodos();
  }, [fetchGoals, fetchTodos]);

  const handleCreate = async (input: GoalInput) => {
    await addGoal(input);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-ink">1년 목표</h2>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-active"
        >
          새 목표
        </button>
      </div>

      <div className="mt-6">
        {goalsLoading && (
          <p className="text-sm text-body">불러오는 중...</p>
        )}

        {goalsError && !goalsLoading && (
          <p className="text-sm text-error">{goalsError}</p>
        )}

        {!goalsLoading && !goalsError && goals.length === 0 && (
          <p className="text-sm text-body">
            아직 등록된 목표가 없습니다. &quot;새 목표&quot;를 눌러 추가하세요.
          </p>
        )}

        {!goalsLoading && !goalsError && goals.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => {
              const linked = todos.filter((t) => t.goalId === goal._id);
              const done = linked.filter((t) => t.status === "done").length;
              const percent = linked.length
                ? (done / linked.length) * 100
                : 0;
              return (
                <GoalCard
                  key={goal._id}
                  goal={goal}
                  todoPercent={percent}
                  linkedCount={linked.length}
                  linkedDone={done}
                />
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="새 목표"
      >
        <GoalForm
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
        />
      </Modal>
    </div>
  );
}
