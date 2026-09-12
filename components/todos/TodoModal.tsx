"use client";

import { useEffect, useState } from "react";
import type { Priority, Todo } from "@/types";
import { PRIORITIES } from "@/types";
import { useAppStore } from "@/store";
import { formatDateKo } from "@/lib/utils";
import Modal from "@/components/shared/Modal";
import {
  DAY_OPTIONS,
  PRIORITY_LABELS,
  fromDateInput,
  toDateInput,
} from "./TodoForm";

const FIELD =
  "rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900";
const LABEL = "text-sm font-medium text-gray-900";

interface TodoModalProps {
  todo: Todo;
  open: boolean;
  onClose: () => void;
}

export default function TodoModal({ todo, open, onClose }: TodoModalProps) {
  const weeklyPlans = useAppStore((s) => s.weeklyPlans);
  const goals = useAppStore((s) => s.goals);
  const fetchWeeklyPlans = useAppStore((s) => s.fetchWeeklyPlans);
  const fetchGoals = useAppStore((s) => s.fetchGoals);
  const updateTodo = useAppStore((s) => s.updateTodo);
  const deleteTodo = useAppStore((s) => s.deleteTodo);

  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.description ?? "");
  const [priority, setPriority] = useState<Priority>(todo.priority);
  const [dueDate, setDueDate] = useState(toDateInput(todo.dueDate));
  const [dayOfWeek, setDayOfWeek] = useState(
    todo.dayOfWeek == null ? "" : String(todo.dayOfWeek)
  );
  const [weeklyPlanId, setWeeklyPlanId] = useState(todo.weeklyPlanId ?? "");
  const [goalId, setGoalId] = useState(todo.goalId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (weeklyPlans.length === 0) fetchWeeklyPlans();
  }, [weeklyPlans.length, fetchWeeklyPlans]);

  useEffect(() => {
    if (goals.length === 0) fetchGoals();
  }, [goals.length, fetchGoals]);

  const trimmedTitle = title.trim();
  const canSave = trimmedTitle.length > 0 && !saving;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await updateTodo(todo._id, {
        title: trimmedTitle,
        description: description.trim(),
        priority,
        dueDate: fromDateInput(dueDate),
        dayOfWeek: dayOfWeek === "" ? null : Number(dayOfWeek),
        weeklyPlanId: weeklyPlanId || null,
        goalId: goalId || null,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("이 할 일을 삭제할까요?")) return;
    setSaving(true);
    setError(null);
    try {
      await deleteTodo(todo._id);
      onClose();
    } catch (err) {
      setError((err as Error).message || "삭제에 실패했습니다.");
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="할 일">
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="todo-edit-title" className={LABEL}>
            제목
          </label>
          <input
            id="todo-edit-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={FIELD}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="todo-edit-description" className={LABEL}>
            설명
          </label>
          <textarea
            id="todo-edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={`resize-none ${FIELD}`}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="todo-edit-priority" className={LABEL}>
              우선순위
            </label>
            <select
              id="todo-edit-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className={FIELD}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="todo-edit-due" className={LABEL}>
              마감일
            </label>
            <input
              id="todo-edit-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={FIELD}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="todo-edit-day" className={LABEL}>
            요일 배치
          </label>
          <select
            id="todo-edit-day"
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(e.target.value)}
            className={FIELD}
          >
            <option value="">배치 안 함</option>
            {DAY_OPTIONS.map(({ label, dow }) => (
              <option key={dow} value={dow}>
                {label}요일
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="todo-edit-weekly" className={LABEL}>
            주간 계획
          </label>
          <select
            id="todo-edit-weekly"
            value={weeklyPlanId}
            onChange={(e) => setWeeklyPlanId(e.target.value)}
            className={FIELD}
          >
            <option value="">연결 안 함</option>
            {weeklyPlans.map((plan) => (
              <option key={plan._id} value={plan._id}>
                {formatDateKo(plan.weekStart)} 주
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="todo-edit-goal" className={LABEL}>
            1년 목표
          </label>
          <select
            id="todo-edit-goal"
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
            className={FIELD}
          >
            <option value="">연결 안 함</option>
            {goals.map((goal) => (
              <option key={goal._id} value={goal._id}>
                {goal.title}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            삭제
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
