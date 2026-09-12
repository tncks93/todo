export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const failed = searchParams?.error === "oauth_failed";

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">할일 + 계획 관리</h1>
        <p className="mt-2 text-sm text-gray-600">
          GitHub 계정으로 로그인하고 내 할일을 관리하세요.
        </p>

        {failed && (
          <p className="mt-4 text-sm text-red-600">
            로그인에 실패했습니다. 다시 시도해주세요.
          </p>
        )}

        <a
          href="/auth/github"
          className="mt-6 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          GitHub로 로그인
        </a>
      </div>
    </div>
  );
}
