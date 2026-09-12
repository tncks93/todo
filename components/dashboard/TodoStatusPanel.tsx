"use client";

import { useAppStore } from "@/store";
import ProgressBar from "@/components/shared/ProgressBar";
import type { TodoStatus } from "@/types";

const TILES: { status: TodoStatus; label: string }[] = [
  { status: "todo", label: "할 일" },
  { status: "doing", label: "진행 중" },
  { status: "done", label: "완료" },
];

export default function TodoStatusPanel() {
  const todos = useAppStore((s) => s.todos);

  const total = todos.length;
  const counts: Record<TodoStatus, number> = {
    todo: todos.filter((t) => t.status === "todo").length,
    doing: todos.filter((t) => t.status === "doing").length,
    done: todos.filter((t) => t.status === "done").length,
  };
  const ratio = total === 0 ? 0 : (counts.done / total) * 100;

  return (
    <section className="flex flex-col gap-4 rounded-md border border-hairline bg-canvas p-5">
      <h3 className="text-sm font-semibold text-ink">할 일 현황</h3>

      <div className="grid grid-cols-3 gap-2">
        {TILES.map(({ status, label }) => (
          <div
            key={status}
            className="flex flex-col items-center gap-1 rounded-sm border border-hairline bg-surface-soft px-2 py-3"
          >
            <span className="text-2xl font-bold text-ink">
              {counts[status]}
            </span>
            <span className="text-xs text-muted">{label}</span>
          </div>
        ))}
      </div>

      <ProgressBar value={ratio} showLabel />
    </section>
  );
}
