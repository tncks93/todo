"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { TodoInput } from "@/types";
import { useAppStore } from "@/store";
import Modal from "@/components/shared/Modal";
import TodoForm from "@/components/todos/TodoForm";

// dnd-kit needs the DOM: render the board on the client only.
const KanbanBoard = dynamic(() => import("@/components/todos/KanbanBoard"), {
  ssr: false,
  loading: () => <p className="text-sm text-body">보드 불러오는 중...</p>,
});

export default function TodosPage() {
  const todosLoading = useAppStore((s) => s.todosLoading);
  const todosError = useAppStore((s) => s.todosError);
  const fetchTodos = useAppStore((s) => s.fetchTodos);
  const addTodo = useAppStore((s) => s.addTodo);

  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleCreate = async (input: TodoInput) => {
    await addTodo(input);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-ink">칸반 보드</h2>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-active"
        >
          새 할 일
        </button>
      </div>

      <div className="mt-6">
        {/* Loading/error render as indicators, not as a gate on KanbanBoard --
            unmounting it on every fetch would tear down its DndContext (and
            any in-progress drag) each time `todosLoading` flips true, which
            can happen from other pages sharing the same store. */}
        {todosLoading && (
          <p className="mb-2 text-xs text-muted-soft">불러오는 중...</p>
        )}
        {todosError && (
          <p className="mb-4 text-sm text-error">{todosError}</p>
        )}

        <KanbanBoard />
      </div>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="새 할 일"
      >
        <TodoForm
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
        />
      </Modal>
    </div>
  );
}
