"use client";

import type { Todo } from "@/types";
import { DAY_LABELS_KO } from "@/lib/utils";
import { COLUMN_TO_DOW } from "@/lib/week";
import PriorityBadge from "@/components/shared/PriorityBadge";

interface WeekGridProps {
  todos: Todo[];
  onAssignDay?: (todoId: string, dayOfWeek: number | null) => void;
}

export default function WeekGrid({ todos, onAssignDay }: WeekGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {DAY_LABELS_KO.map((label, col) => {
        const dow = COLUMN_TO_DOW[col];
        const dayTodos = todos.filter((t) => t.dayOfWeek === dow);
        return (
          <div
            key={label}
            className="flex min-h-[96px] flex-col gap-2 rounded-xl border border-gray-200 bg-white p-2"
          >
            <div className="text-center text-xs font-semibold text-gray-500">
              {label}
            </div>
            {dayTodos.length === 0 ? (
              <p className="text-center text-[11px] text-gray-300">-</p>
            ) : (
              dayTodos.map((t) => (
                <div
                  key={t._id}
                  className="flex flex-col gap-1 rounded-lg border border-gray-100 bg-gray-50 p-2"
                >
                  <span className="text-xs text-gray-900">{t.title}</span>
                  <div className="flex items-center justify-between">
                    <PriorityBadge priority={t.priority} />
                    {onAssignDay && (
                      <button
                        type="button"
                        onClick={() => onAssignDay(t._id, null)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                        aria-label="요일 배치 해제"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
