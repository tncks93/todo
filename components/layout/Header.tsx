"use client";

import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth/session";

const TITLES: Record<string, string> = {
  "/": "대시보드",
  "/todos": "칸반 보드",
  "/weekly": "주간 계획",
  "/goals": "1년 목표",
};

export default function Header({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const key = Object.keys(TITLES)
    .filter((k) => (k === "/" ? pathname === "/" : pathname.startsWith(k)))
    .sort((a, b) => b.length - a.length)[0];
  const title = TITLES[key] ?? "할일 + 계획 관리";

  return (
    <header className="flex h-14 items-center justify-between border-b border-hairline bg-canvas px-6">
      <h1 className="text-base font-semibold text-ink">{title}</h1>
      {user && (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- external GitHub avatar URL, next/image domain config not worth it here */}
          <img
            src={user.avatarUrl}
            alt={user.username}
            className="h-7 w-7 rounded-full"
          />
          <span className="text-sm text-body">{user.username}</span>
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-sm px-2 py-1 text-sm text-muted hover:bg-surface-soft hover:text-ink"
            >
              로그아웃
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
