import Link from "next/link";
import type { WeeklyPlan } from "@/types";
import { formatDateKo } from "@/lib/utils";
import ProgressBar from "@/components/shared/ProgressBar";

function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export default function WeeklyPlanCard({ plan }: { plan: WeeklyPlan }) {
  const total = plan.goals.length;
  const doneCount = plan.goals.filter((g) => g.done).length;
  const ratio = total === 0 ? 0 : (doneCount / total) * 100;

  return (
    <Link
      href={`/weekly/${plan._id}`}
      className="flex flex-col gap-3 rounded-md border border-hairline bg-canvas p-4 transition-shadow hover:shadow-card"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-ink">
          {formatDateKo(plan.weekStart)} ~ {formatDateKo(addDaysISO(plan.weekStart, 6))}
        </h3>
        <span className="shrink-0 text-xs text-muted">
          목표 {doneCount}/{total}
        </span>
      </div>
      <ProgressBar value={ratio} showLabel />
      {plan.memo && (
        <p className="line-clamp-2 text-sm text-body">{plan.memo}</p>
      )}
    </Link>
  );
}
