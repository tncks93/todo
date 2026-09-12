"use client";

import { useEffect, useState } from "react";
import type { WeeklyGoalItem, WeeklyPlanInput } from "@/types";
import { useAppStore } from "@/store";
import { weekStartISO } from "@/lib/utils";

interface WeeklyPlanFormInitial {
  weekStart: string;
  goals: WeeklyGoalItem[];
  memo: string;
  goalId?: string | null;
}

interface WeeklyPlanFormProps {
  onSubmit: (input: WeeklyPlanInput) => Promise<void>;
  onCancel: () => void;
  initial?: WeeklyPlanFormInitial;
  submitLabel?: string;
}

const MAX_GOALS = 5;

export default function WeeklyPlanForm({
  onSubmit,
  onCancel,
  initial,
  submitLabel,
}: WeeklyPlanFormProps) {
  const goals = useAppStore((s) => s.goals);
  const fetchGoals = useAppStore((s) => s.fetchGoals);

  const [rows, setRows] = useState<WeeklyGoalItem[]>(
    initial && initial.goals.length > 0
      ? initial.goals.map((g) => ({ ...g }))
      : [{ text: "", done: false }]
  );
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [goalId, setGoalId] = useState(initial?.goalId ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (goals.length === 0) fetchGoals();
  }, [goals.length, fetchGoals]);

  const setRow = (index: number, value: string) =>
    setRows((r) =>
      r.map((row, i) => (i === index ? { ...row, text: value } : row))
    );
  const addRow = () =>
    setRows((r) =>
      r.length >= MAX_GOALS ? r : [...r, { text: "", done: false }]
    );
  const removeRow = (index: number) =>
    setRows((r) => (r.length <= 1 ? r : r.filter((_, i) => i !== index)));

  const cleaned = rows
    .map((r) => ({ text: r.text.trim(), done: r.done }))
    .filter((r) => r.text.length > 0);
  const canSubmit = cleaned.length > 0 && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        weekStart: initial?.weekStart ?? weekStartISO(),
        goals: cleaned,
        memo: memo.trim(),
        goalId: goalId || null,
      });
    } catch (err) {
      setError((err as Error).message || "저장에 실패했습니다.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray-900">
          주간 목표 (최대 {MAX_GOALS}개)
        </span>
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={row.text}
              onChange={(e) => setRow(i, e.target.value)}
              placeholder={`목표 ${i + 1}`}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              disabled={rows.length <= 1}
              className="rounded-lg border border-gray-200 px-2 py-2 text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40"
              aria-label="목표 삭제"
            >
              ✕
            </button>
          </div>
        ))}
        {rows.length < MAX_GOALS && (
          <button
            type="button"
            onClick={addRow}
            className="self-start rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
          >
            + 목표 추가
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="weekly-memo"
          className="text-sm font-medium text-gray-900"
        >
          메모
        </label>
        <textarea
          id="weekly-memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="이번 주 메모 (선택)"
          rows={3}
          className="resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="weekly-goal"
          className="text-sm font-medium text-gray-900"
        >
          1년 목표 연결
        </label>
        <select
          id="weekly-goal"
          value={goalId}
          onChange={(e) => setGoalId(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
        >
          <option value="">연결 안 함</option>
          {goals.map((g) => (
            <option key={g._id} value={g._id}>
              {g.title}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {submitting ? "저장 중..." : submitLabel ?? "저장"}
        </button>
      </div>
    </form>
  );
}
