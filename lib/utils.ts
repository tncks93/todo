/**
 * UTC-midnight instant for the calendar date `date` reports in the caller's
 * local timezone (i.e. "today" as a plain date, anchored so it round-trips
 * identically through any server timezone).
 */
function localMidnightUTC(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

/**
 * Returns the Monday 00:00 UTC of the week containing `date`.
 *
 * Operates purely on UTC accessors, so calling this again on an
 * already-computed result (e.g. when the API route re-normalizes a
 * client-sent `weekStart`) is idempotent no matter what timezone the server
 * process runs in. To seed it from "today" in the *caller's local* calendar
 * day, anchor first — see `weekStartISO`.
 */
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date.getTime());
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const daysSinceMonday = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  return d;
}

/** ISO Monday-00:00-UTC for the week containing `date`'s local calendar day. */
export function weekStartISO(date: Date = new Date()): string {
  return getWeekStart(localMidnightUTC(date)).toISOString();
}

/** Join truthy class names. */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Format an ISO date string as `M월 D일`. Returns "" for empty input.
 * Uses UTC accessors because dates in this app (weekStart, dueDate) are
 * calendar dates stored as UTC midnight -- reading them with local getters
 * would show the wrong day in negative-UTC-offset timezones.
 */
export function formatDateKo(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
}

/** True when `iso` (a UTC-midnight calendar date) is strictly before today. */
export function isOverdue(iso?: string | null): boolean {
  if (!iso) return false;
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return false;
  const today = localMidnightUTC(new Date());
  return due.getTime() < today.getTime();
}

export const DAY_LABELS_KO = ["월", "화", "수", "목", "금", "토", "일"];

/**
 * Combined weekly progress %: weekly-goal checkmarks blended with the
 * completion of todos linked to the plan, so finishing a todo automatically
 * moves the weekly progress bar (PRD: "완료 작업이 주간 진행률에 자동 반영").
 */
export function weeklyProgressRatio(input: {
  goalsTotal: number;
  goalsDone: number;
  todosTotal: number;
  todosDone: number;
}): number {
  const total = input.goalsTotal + input.todosTotal;
  if (total === 0) return 0;
  return ((input.goalsDone + input.todosDone) / total) * 100;
}
