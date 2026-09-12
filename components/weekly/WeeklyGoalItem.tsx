"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface WeeklyGoalItemProps {
  text: string;
  done: boolean;
  onToggle: (done: boolean) => void | Promise<void>;
}

export default function WeeklyGoalItem({
  text,
  done,
  onToggle,
}: WeeklyGoalItemProps) {
  const [checked, setChecked] = useState(done);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setChecked(done);
  }, [done]);

  const handleChange = async () => {
    const next = !checked;
    setChecked(next);
    setPending(true);
    try {
      await onToggle(next);
    } catch {
      setChecked(!next);
    } finally {
      setPending(false);
    }
  };

  return (
    <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={pending}
        className="h-4 w-4 shrink-0 rounded border-gray-300 accent-gray-900"
      />
      <span
        className={cn(
          "text-sm text-gray-900",
          checked && "text-gray-400 line-through"
        )}
      >
        {text}
      </span>
    </label>
  );
}
