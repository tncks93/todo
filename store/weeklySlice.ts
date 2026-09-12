import type { StateCreator } from "zustand";
import type { AppStore } from "./index";
import type { WeeklyPlan, WeeklyPlanInput } from "@/types";
import { api } from "@/lib/apiClient";

export interface WeeklySlice {
  weeklyPlans: WeeklyPlan[];
  currentPlan: WeeklyPlan | null;
  weeklyLoading: boolean;
  weeklyError: string | null;
  fetchWeeklyPlans: (limit?: number) => Promise<void>;
  fetchWeeklyPlan: (id: string) => Promise<void>;
  fetchPlanByWeek: (weekStartISO: string) => Promise<WeeklyPlan | null>;
  addWeeklyPlan: (input: WeeklyPlanInput) => Promise<WeeklyPlan>;
  updateWeeklyPlan: (id: string, patch: Partial<WeeklyPlan>) => Promise<void>;
  toggleWeeklyGoal: (
    id: string,
    goalIndex: number,
    done: boolean
  ) => Promise<void>;
  deleteWeeklyPlan: (id: string) => Promise<void>;
}

function replace(list: WeeklyPlan[], plan: WeeklyPlan): WeeklyPlan[] {
  return list.map((p) => (p._id === plan._id ? plan : p));
}

export const createWeeklySlice: StateCreator<
  AppStore,
  [],
  [],
  WeeklySlice
> = (set, get) => ({
  weeklyPlans: [],
  currentPlan: null,
  weeklyLoading: false,
  weeklyError: null,

  fetchWeeklyPlans: async (limit = 4) => {
    set({ weeklyLoading: true, weeklyError: null });
    try {
      const plans = await api.get<WeeklyPlan[]>(`/api/weekly?limit=${limit}`);
      set({ weeklyPlans: plans, weeklyLoading: false });
    } catch (e) {
      set({ weeklyError: (e as Error).message, weeklyLoading: false });
    }
  },

  fetchWeeklyPlan: async (id) => {
    set({ weeklyLoading: true, weeklyError: null });
    try {
      const plan = await api.get<WeeklyPlan>(`/api/weekly/${id}`);
      set({ currentPlan: plan, weeklyLoading: false });
    } catch (e) {
      set({ weeklyError: (e as Error).message, weeklyLoading: false });
    }
  },

  fetchPlanByWeek: async (weekStartISO) => {
    const plan = await api.get<WeeklyPlan | null>(
      `/api/weekly?weekStart=${encodeURIComponent(weekStartISO)}`
    );
    set({ currentPlan: plan });
    return plan;
  },

  addWeeklyPlan: async (input) => {
    const plan = await api.post<WeeklyPlan>("/api/weekly", input);
    set({
      weeklyPlans: [plan, ...get().weeklyPlans],
      currentPlan: plan,
    });
    return plan;
  },

  updateWeeklyPlan: async (id, patch) => {
    const updated = await api.put<WeeklyPlan>(`/api/weekly/${id}`, patch);
    set((s) => ({
      weeklyPlans: replace(s.weeklyPlans, updated),
      currentPlan: s.currentPlan?._id === id ? updated : s.currentPlan,
    }));
  },

  toggleWeeklyGoal: async (id, goalIndex, done) => {
    const updated = await api.patch<WeeklyPlan>(`/api/weekly/${id}`, {
      goalIndex,
      done,
    });
    set((s) => ({
      weeklyPlans: replace(s.weeklyPlans, updated),
      currentPlan: s.currentPlan?._id === id ? updated : s.currentPlan,
    }));
  },

  deleteWeeklyPlan: async (id) => {
    await api.del(`/api/weekly/${id}`);
    set((s) => ({
      weeklyPlans: s.weeklyPlans.filter((p) => p._id !== id),
      currentPlan: s.currentPlan?._id === id ? null : s.currentPlan,
    }));
  },
});
