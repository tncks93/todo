"use client";

import { useEffect, useState } from "react";
import type { Priority, TodoInput } from "@/types";
import { PRIORITIES } from "@/types";
import { useAppStore } from "@/store";
import { DAY_LABELS_KO, formatDateKo } from "@/lib/utils";
import { COLUMN_TO_DOW } from "@/lib/week";

/**
 * ISO string -> `yyyy-mm-dd` for `<input type="date">`.
 * Dates in this app are calendar dates stored as UTC midnight, so this reads
 * with UTC accessors to round-trip through `fromDateInput` without drifting
 * a day in non-UTC timezones.
 */
export function toDateInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** `yyyy-mm-dd` -> ISO string (UTC midnight of that calendar date), or null when empty. */
export function fromDateInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Mon..Sun `<select>` options mapping to `Todo.dayOfWeek` (0=Sun..6=Sat). */
export const DAY_OPTIONS = DAY_LABELS_KO.map((label, col) => ({
  label,
  dow: COLUMN_TO_DOW[col],
}));

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

const FIELD =
  "rounded-sm border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-ink";
const LABEL = "text-sm font-medium text-ink";

interface TodoFormProps {
  onSubmit: (input: TodoInput) => Promise<void>;
  onCancel: () => void;
}

export default function TodoForm({ onSubmit, onCancel }: TodoFormProps) {
  const weeklyPlans = useAppStore((s) => s.weeklyPlans);
  const goals = useAppStore((s) => s.goals);
  const fetchWeeklyPlans = useAppStore((s) => s.fetchWeeklyPlans);
  const fetchGoals = useAppStore((s) => s.fetchGoals);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [weeklyPlanId, setWeeklyPlanId] = useState("");
  const [goalId, setGoalId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (weeklyPlans.length === 0) fetchWeeklyPlans();
  }, [weeklyPlans.length, fetchWeeklyPlans]);

  useEffect(() => {
    if (goals.length === 0) fetchGoals();
  }, [goals.length, fetchGoals]);

  const trimmedTitle = title.trim();
  const canSubmit = trimmedTitle.length > 0 && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: trimmedTitle,
        description: description.trim(),
        status: "todo",
        priority,
        dueDate: fromDateInput(dueDate),
        dayOfWeek: dayOfWeek === "" ? null : Number(dayOfWeek),
        weeklyPlanId: weeklyPlanId || null,
        goalId: goalId || null,
      });
      onCancel();
    } catch (err) {
      setError((err as Error).message || "저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="todo-title" className={LABEL}>
          제목
        </label>
        <input
          id="todo-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="할 일 제목"
          autoFocus
          className={FIELD}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="todo-description" className={LABEL}>
          설명
        </label>
        <textarea
          id="todo-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="설명 (선택)"
          rows={3}
          className={`resize-none ${FIELD}`}
        />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="todo-priority" className={LABEL}>
            우선순위
          </label>
          <select
            id="todo-priority"
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
          <label htmlFor="todo-due" className={LABEL}>
            마감일
          </label>
          <input
            id="todo-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={FIELD}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="todo-day" className={LABEL}>
          요일 배치
        </label>
        <select
          id="todo-day"
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
        <label htmlFor="todo-weekly" className={LABEL}>
          주간 계획
        </label>
        <select
          id="todo-weekly"
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
        <label htmlFor="todo-goal" className={LABEL}>
          1년 목표
        </label>
        <select
          id="todo-goal"
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

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-sm border border-hairline px-4 py-2 text-sm font-medium text-body hover:bg-surface-soft disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-active disabled:bg-primary-disabled"
        >
          {submitting ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}
