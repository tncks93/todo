import type { StateCreator } from "zustand";
import type { AppStore } from "./index";
import type { Todo, TodoInput, TodoStatus } from "@/types";
import { api } from "@/lib/apiClient";

export interface TodoSlice {
  todos: Todo[];
  todosLoading: boolean;
  todosError: string | null;
  fetchTodos: (params?: {
    status?: TodoStatus;
    weeklyPlanId?: string;
    goalId?: string;
  }) => Promise<void>;
  addTodo: (input: TodoInput) => Promise<Todo>;
  updateTodo: (id: string, patch: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  /** Persist a drag-drop move (status and/or order) with optimistic update + rollback. */
  reorderTodo: (
    id: string,
    move: { status: TodoStatus; order: string; dayOfWeek?: number | null }
  ) => Promise<void>;
}

export const createTodoSlice: StateCreator<AppStore, [], [], TodoSlice> = (
  set,
  get
) => ({
  todos: [],
  todosLoading: false,
  todosError: null,

  fetchTodos: async (params) => {
    set({ todosLoading: true, todosError: null });
    try {
      const qs = new URLSearchParams(
        Object.entries(params ?? {}).filter(([, v]) => v != null) as [
          string,
          string
        ][]
      ).toString();
      const todos = await api.get<Todo[]>(`/api/todos${qs ? `?${qs}` : ""}`);
      set({ todos, todosLoading: false });
    } catch (e) {
      set({ todosError: (e as Error).message, todosLoading: false });
    }
  },

  addTodo: async (input) => {
    const todo = await api.post<Todo>("/api/todos", input);
    set({ todos: [...get().todos, todo] });
    return todo;
  },

  updateTodo: async (id, patch) => {
    const updated = await api.put<Todo>(`/api/todos/${id}`, patch);
    set({ todos: get().todos.map((t) => (t._id === id ? updated : t)) });
  },

  deleteTodo: async (id) => {
    await api.del(`/api/todos/${id}`);
    set({ todos: get().todos.filter((t) => t._id !== id) });
  },

  reorderTodo: async (id, move) => {
    // Capture just the one card's pre-move snapshot -- rolling back the
    // whole array would also discard any card added/removed by another
    // in-flight request while this PATCH was pending.
    const previousTodo = get().todos.find((t) => t._id === id);
    if (!previousTodo) return;
    set({
      todos: get().todos.map((t) => (t._id === id ? { ...t, ...move } : t)),
    });
    try {
      const updated = await api.patch<Todo>(`/api/todos/${id}`, move);
      set({ todos: get().todos.map((t) => (t._id === id ? updated : t)) });
    } catch (e) {
      set({
        todos: get().todos.map((t) => (t._id === id ? previousTodo : t)),
        todosError: (e as Error).message,
      });
      throw e;
    }
  },
});
