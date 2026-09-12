"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Todo, TodoStatus } from "@/types";
import { cn } from "@/lib/utils";
import TodoCard from "./TodoCard";

export const STATUS_LABELS: Record<TodoStatus, string> = {
  todo: "할 일",
  doing: "진행 중",
  done: "완료",
};

interface KanbanColumnProps {
  status: TodoStatus;
  /** Cards of this column, already sorted by `order` ascending. */
  todos: Todo[];
}

/** Sort rank for the high-first grouping: lower sorts first. */
export function priorityRank(todo: Todo): number {
  return todo.priority === "high" ? 0 : 1;
}

/**
 * Display ordering for a column: every `priority === "high"` card is pinned to
 * the top, then the remaining cards follow. `filter` preserves input order, so
 * as long as `todos` arrives sorted by `order` ascending, each group stays in
 * ascending `order` sequence. `KanbanBoard`'s drag-end uses this same helper
 * (and `priorityRank`) so neighbour `order` lookups match what the user sees.
 */
export function groupHighFirst(todos: Todo[]): Todo[] {
  const high = todos.filter((t) => priorityRank(t) === 0);
  const rest = todos.filter((t) => priorityRank(t) !== 0);
  return [...high, ...rest];
}

export default function KanbanColumn({ status, todos }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const ordered = groupHighFirst(todos);

  return (
    <section className="flex min-w-0 flex-1 flex-col rounded-xl border border-gray-200 bg-gray-50 p-3">
      <header className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-gray-900">
          {STATUS_LABELS[status]}
        </h3>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-600">
          {ordered.length}
        </span>
      </header>

      <SortableContext
        items={ordered.map((t) => t._id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={cn(
            "flex min-h-[120px] flex-col gap-2 rounded-lg p-1 transition-colors",
            isOver && "bg-gray-100"
          )}
        >
          {ordered.map((todo) => (
            <TodoCard key={todo._id} todo={todo} />
          ))}
          {ordered.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-gray-400">
              여기로 끌어다 놓으세요
            </p>
          )}
        </div>
      </SortableContext>
    </section>
  );
}
