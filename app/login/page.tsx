export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const failed = searchParams?.error === "oauth_failed";

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-md border border-hairline bg-canvas p-8 text-center shadow-card">
        <h1 className="text-xl font-bold text-primary">할일 + 계획 관리</h1>
        <p className="mt-2 text-sm text-body">
          GitHub 계정으로 로그인하고 내 할일을 관리하세요.
        </p>

        {failed && (
          <p className="mt-4 text-sm text-error">
            로그인에 실패했습니다. 다시 시도해주세요.
          </p>
        )}

        <a
          href="/auth/github"
          className="mt-6 inline-block rounded-sm bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-active"
        >
          GitHub로 로그인
        </a>
      </div>
    </div>
  );
}
