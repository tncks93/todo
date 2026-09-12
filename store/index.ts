import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createGoalSlice, type GoalSlice } from "./goalSlice";
import { createWeeklySlice, type WeeklySlice } from "./weeklySlice";
import { createTodoSlice, type TodoSlice } from "./todoSlice";

export type AppStore = GoalSlice & WeeklySlice & TodoSlice;

export const useAppStore = create<AppStore>()(
  devtools(
    (...a) => ({
      ...createGoalSlice(...a),
      ...createWeeklySlice(...a),
      ...createTodoSlice(...a),
    }),
    { name: "todo-planner-store" }
  )
);
