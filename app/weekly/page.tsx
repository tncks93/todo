"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { WeeklyPlan, WeeklyPlanInput } from "@/types";
import { useAppStore } from "@/store";
import { weekStartISO } from "@/lib/utils";
import Modal from "@/components/shared/Modal";
import WeeklyPlanCard from "@/components/weekly/WeeklyPlanCard";
import WeeklyPlanForm from "@/components/weekly/WeeklyPlanForm";

export default function WeeklyListPage() {
  const weeklyPlans = useAppStore((s) => s.weeklyPlans);
  const weeklyLoading = useAppStore((s) => s.weeklyLoading);
  const weeklyError = useAppStore((s) => s.weeklyError);
  const fetchWeeklyPlans = useAppStore((s) => s.fetchWeeklyPlans);
  const fetchPlanByWeek = useAppStore((s) => s.fetchPlanByWeek);
  const addWeeklyPlan = useAppStore((s) => s.addWeeklyPlan);

  const [formOpen, setFormOpen] = useState(false);
  const [thisWeek, setThisWeek] = useState<WeeklyPlan | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchWeeklyPlans(4);
    fetchPlanByWeek(weekStartISO())
      .then(setThisWeek)
      .catch(() => undefined);
  }, [fetchWeeklyPlans, fetchPlanByWeek]);

  const handleCreate = async (input: WeeklyPlanInput) => {
    try {
      const plan = await addWeeklyPlan(input);
      setThisWeek(plan);
      setNotice(null);
      setFormOpen(false);
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      if (status === 409) {
        setFormOpen(false);
        setNotice("이미 이번 주 계획이 있습니다.");
        const existing = await fetchPlanByWeek(weekStartISO()).catch(
          () => null
        );
        setThisWeek(existing);
        return;
      }
      throw err;
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-ink">주간 계획</h2>
        {thisWeek ? (
          <Link
            href={`/weekly/${thisWeek._id}`}
            className="shrink-0 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-active"
          >
            이번 주 계획 보기
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="shrink-0 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-active"
          >
            이번 주 계획 만들기
          </button>
        )}
      </div>

      {notice && (
        <p className="rounded-sm border border-hairline bg-surface-soft px-3 py-2 text-sm text-body">
          {notice}
        </p>
      )}
      {weeklyError && <p className="text-sm text-error">{weeklyError}</p>}

      {weeklyLoading && weeklyPlans.length === 0 ? (
        <p className="text-sm text-muted">불러오는 중...</p>
      ) : weeklyPlans.length === 0 ? (
        <p className="text-sm text-muted">아직 주간 계획이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {weeklyPlans.map((plan) => (
            <WeeklyPlanCard key={plan._id} plan={plan} />
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="이번 주 계획 만들기"
      >
        <WeeklyPlanForm
          onSubmit={handleCreate}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  );
}
