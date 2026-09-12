import ProgressBar from "@/components/shared/ProgressBar";

interface GoalProgressProps {
  /** Completion percentage, 0..100. */
  percent: number;
  /** Number of linked todos; when given (with `done`) a `완료 n / total` caption is shown. */
  count?: number;
  /** Number of those linked todos that are done. */
  done?: number;
}

export default function GoalProgress({ percent, count, done }: GoalProgressProps) {
  return (
    <div className="flex flex-col gap-1">
      <ProgressBar value={percent} showLabel />
      {count != null && done != null && (
        <span className="text-xs text-gray-500">
          완료 {done} / {count}
        </span>
      )}
    </div>
  );
}
