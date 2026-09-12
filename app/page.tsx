"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store";
import { weekStartISO } from "@/lib/utils";
import WeekPlanPanel from "@/components/dashboard/WeekPlanPanel";
import TodoStatusPanel from "@/components/dashboard/TodoStatusPanel";
import GoalWeeklyPanel from "@/components/dashboard/GoalWeeklyPanel";

export default function DashboardPage() {
  const fetchPlanByWeek = useAppStore((s) => s.fetchPlanByWeek);
  const fetchTodos = useAppStore((s) => s.fetchTodos);
  const fetchGoals = useAppStore((s) => s.fetchGoals);

  useEffect(() => {
    fetchPlanByWeek(weekStartISO()).catch(() => undefined);
    fetchTodos();
    fetchGoals();
  }, [fetchPlanByWeek, fetchTodos, fetchGoals]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <h2 className="text-xl font-bold text-gray-900">대시보드</h2>

      <div className="grid gap-4 lg:grid-cols-3">
        <WeekPlanPanel />
        <TodoStatusPanel />
        <GoalWeeklyPanel />
      </div>
    </div>
  );
}
