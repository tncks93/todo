import type { StateCreator } from "zustand";
import type { AppStore } from "./index";
import type { Goal, GoalInput } from "@/types";
import { api } from "@/lib/apiClient";

export interface GoalSlice {
  goals: Goal[];
  goalsLoading: boolean;
  goalsError: string | null;
  fetchGoals: () => Promise<void>;
  addGoal: (input: GoalInput) => Promise<Goal>;
  updateGoal: (id: string, patch: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

export const createGoalSlice: StateCreator<AppStore, [], [], GoalSlice> = (
  set,
  get
) => ({
  goals: [],
  goalsLoading: false,
  goalsError: null,

  fetchGoals: async () => {
    set({ goalsLoading: true, goalsError: null });
    try {
      const goals = await api.get<Goal[]>("/api/goals");
      set({ goals, goalsLoading: false });
    } catch (e) {
      set({ goalsError: (e as Error).message, goalsLoading: false });
    }
  },

  addGoal: async (input) => {
    const goal = await api.post<Goal>("/api/goals", input);
    set({ goals: [goal, ...get().goals] });
    return goal;
  },

  updateGoal: async (id, patch) => {
    const updated = await api.put<Goal>(`/api/goals/${id}`, patch);
    set({ goals: get().goals.map((g) => (g._id === id ? updated : g)) });
  },

  deleteGoal: async (id) => {
    await api.del(`/api/goals/${id}`);
    set({ goals: get().goals.filter((g) => g._id !== id) });
  },
});
