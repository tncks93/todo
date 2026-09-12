"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Todo } from "@/types";
import { cn, formatDateKo, isOverdue } from "@/lib/utils";
import PriorityBadge from "@/components/shared/PriorityBadge";
import TodoModal from "./TodoModal";

interface TodoCardViewProps {
  todo: Todo;
  className?: string;
}

/** Presentational card body. Used by the sortable card and by the DragOverlay. */
export function TodoCardView({ todo, className }: TodoCardViewProps) {
  const overdue = isOverdue(todo.dueDate);
  const due = formatDateKo(todo.dueDate);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-md border border-hairline bg-canvas p-3 transition-shadow hover:shadow-card",
        className
      )}
    >
      <p className="text-sm font-medium text-ink">{todo.title}</p>
      <div className="flex items-center justify-between gap-2">
        <PriorityBadge priority={todo.priority} />
        {due && (
          <span
            className={cn(
              "text-xs",
              overdue ? "text-error" : "text-muted"
            )}
          >
            {due}
          </span>
        )}
      </div>
    </div>
  );
}

interface TodoCardProps {
  todo: Todo;
}

export default function TodoCard({ todo }: TodoCardProps) {
  const [open, setOpen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo._id });

  return (
    <>
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
        }}
        {...attributes}
        {...listeners}
        onClick={() => {
          if (isDragging) return;
          setOpen(true);
        }}
        className={cn(
          "cursor-grab touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ink",
          isDragging && "opacity-40"
        )}
      >
        <TodoCardView todo={todo} />
      </div>

      {open && (
        <TodoModal todo={todo} open={open} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
