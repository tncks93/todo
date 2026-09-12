"use client";

import { useState } from "react";
import type { Goal, GoalInput } from "@/types";

interface GoalFormProps {
  initial?: Goal;
  onSubmit: (input: GoalInput) => Promise<void>;
  onCancel: () => void;
}

export default function GoalForm({ initial, onSubmit, onCancel }: GoalFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <label
          htmlFor="goal-title"
          className="text-sm font-medium text-ink"
        >
          제목
        </label>
        <input
          id="goal-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="목표 제목"
          autoFocus
          className="rounded-sm border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-ink"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="goal-description"
          className="text-sm font-medium text-ink"
        >
          설명
        </label>
        <textarea
          id="goal-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="목표에 대한 설명 (선택)"
          rows={4}
          className="resize-none rounded-sm border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-ink"
        />
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
