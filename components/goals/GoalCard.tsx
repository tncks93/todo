"use client";

import { useState } from "react";
import type { Goal, GoalInput } from "@/types";
import { useAppStore } from "@/store";
import Modal from "@/components/shared/Modal";
import GoalForm from "./GoalForm";
import GoalProgress from "./GoalProgress";

interface GoalCardProps {
  goal: Goal;
  /** Completion % of todos linked to this goal (0..100). */
  todoPercent?: number;
  /** Number of todos linked to this goal. */
  linkedCount?: number;
  /** Number of those linked todos that are done. */
  linkedDone?: number;
}

export default function GoalCard({
  goal,
  todoPercent,
  linkedCount,
  linkedDone,
}: GoalCardProps) {
  const hasLinked = (linkedCount ?? 0) > 0;
  const updateGoal = useAppStore((s) => s.updateGoal);
  const deleteGoal = useAppStore((s) => s.deleteGoal);
  const [editing, setEditing] = useState(false);

  const handleEdit = async (input: GoalInput) => {
    await updateGoal(goal._id, input);
  };

  const handleDelete = async () => {
    if (!window.confirm("이 목표를 삭제할까요?")) return;
    await deleteGoal(goal._id);
  };

  return (
    <>
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="font-semibold text-gray-900">{goal.title}</h3>
        {goal.description && (
          <p className="line-clamp-3 text-sm text-gray-600">
            {goal.description}
          </p>
        )}
        <GoalProgress
          percent={hasLinked ? todoPercent ?? 0 : goal.progress}
          count={hasLinked ? linkedCount : undefined}
          done={hasLinked ? linkedDone : undefined}
        />
        <div className="mt-1 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
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

      <Modal open={editing} onClose={() => setEditing(false)} title="목표 수정">
        <GoalForm
          initial={goal}
          onSubmit={handleEdit}
          onCancel={() => setEditing(false)}
        />
      </Modal>
    </>
  );
}
