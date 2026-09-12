"use client";

import { useMemo, useState } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { TODO_STATUSES, type Todo, type TodoStatus } from "@/types";
import { useAppStore } from "@/store";
import { keyBetween } from "@/lib/fractionalIndex";
import KanbanColumn, { groupHighFirst, priorityRank } from "./KanbanColumn";
import { TodoCardView } from "./TodoCard";

function byOrder(a: Todo, b: Todo): number {
  return a.order < b.order ? -1 : a.order > b.order ? 1 : 0;
}

function isStatus(value: string): value is TodoStatus {
  return (TODO_STATUSES as string[]).includes(value);
}

export default function KanbanBoard() {
  const todos = useAppStore((s) => s.todos);
  const reorderTodo = useAppStore((s) => s.reorderTodo);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columns = useMemo(() => {
    const grouped: Record<TodoStatus, Todo[]> = {
      todo: [],
      doing: [],
      done: [],
    };
    for (const todo of todos) grouped[todo.status].push(todo);
    for (const status of TODO_STATUSES) grouped[status].sort(byOrder);
    return grouped;
  }, [todos]);

  const activeTodo = activeId
    ? todos.find((t) => t._id === activeId) ?? null
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeTodoId = String(active.id);
    const dragged = todos.find((t) => t._id === activeTodoId);
    if (!dragged) return;

    const overId = String(over.id);
    const destStatus: TodoStatus = isStatus(overId)
      ? overId
      : todos.find((t) => t._id === overId)?.status ?? dragged.status;

    const sameColumn = destStatus === dragged.status;
    // Destination column in the exact order the user sees it: high-priority
    // cards pinned to the top, then the rest, each group by `order` ascending.
    // Using the same helper as KanbanColumn keeps neighbour lookup aligned with
    // the rendered SortableContext.
    const destDisplay = groupHighFirst(columns[destStatus]);
    // Same list without the dragged card.
    const rest = destDisplay.filter((t) => t._id !== activeTodoId);

    // Index at which the dragged card should land inside `rest`.
    let index: number;
    if (isStatus(overId)) {
      index = rest.length;
    } else if (sameColumn) {
      // Within one column, arrayMove semantics: the card lands at the hovered
      // card's index in the full (dragged card included) list.
      index = destDisplay.findIndex((t) => t._id === overId);
    } else {
      // Across columns, the card is inserted before the hovered card.
      index = rest.findIndex((t) => t._id === overId);
    }
    if (index < 0) return;

    // The high/normal pin means the visible list is grouped by priority, so
    // `order` (a single flat key per column) can only be compared safely
    // between two cards of the SAME priority rank -- across the group
    // boundary a "later" high card can have a smaller `order` than an
    // "earlier" normal card. Bracket the dragged card only with neighbours
    // from its own rank; `rest` stays ascending by `order` within each rank
    // (see `groupHighFirst`), so these bounds never invert.
    const myRank = priorityRank(dragged);
    const sameRank = rest.filter((t) => priorityRank(t) === myRank);
    const localIndex = rest
      .slice(0, index)
      .filter((t) => priorityRank(t) === myRank).length;

    if (sameColumn) {
      const oldLocalIndex = destDisplay
        .filter((t) => priorityRank(t) === myRank)
        .findIndex((t) => t._id === activeTodoId);
      if (oldLocalIndex === localIndex) return; // dropped in the same slot
    }

    const prev = sameRank[localIndex - 1] ?? null;
    const next = sameRank[localIndex] ?? null;

    // One key between the two same-rank neighbours -> one reorderTodo call ->
    // one PATCH. A cross-group drop clamps to the nearest legal slot inside
    // the dragged card's own rank rather than the exact cursor position.
    const order = keyBetween(prev?.order ?? null, next?.order ?? null);

    try {
      // Single PATCH /api/todos/[id]; optimistic update + rollback live here.
      await reorderTodo(activeTodoId, { status: destStatus, order });
    } catch {
      // reorderTodo already rolled back and set `todosError`.
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {TODO_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            todos={columns[status]}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTodo ? (
          <TodoCardView todo={activeTodo} className="rotate-2 shadow-lg" />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
