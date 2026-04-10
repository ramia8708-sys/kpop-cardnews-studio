import Link from 'next/link';
import { isSupabaseConfigured, createServerClient } from '@/lib/supabase';

const LANG_LABELS: Record<string, string> = {
  ko: '🇰🇷', en: '🇺🇸', ja: '🇯🇵', es: '🇪🇸', zh: '🇨🇳', pt: '🇧🇷', id: '🇮🇩',
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const configured = isSupabaseConfigured();

  let cards: Record<string, unknown>[] | null = null;
  if (configured) {
    try {
      const supabase = createServerClient();
      const { data } = await supabase
        .from('cardnews')
        .select('*, artists(name, brand_color)')
        .order('created_at', { ascending: false })
        .limit(10);
      cards = data as Record<string, unknown>[] | null;
    } catch {
      cards = null;
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">대시보드</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          K-pop 아이돌 카드뉴스를 자동으로 생성하세요
        </p>
      </div>

      {/* Supabase 미설정 안내 */}
      {!configured && (
        <div className="mb-8 card border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            <div>
              <h3 className="font-semibold text-amber-800">Supabase 연결 필요</h3>
              <p className="mt-1 text-sm text-amber-700">
                .env.local에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정하세요.
                Supabase 없이도 아래 생성 기능은 테스트할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 퀵 액션 카드 */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/create/auto" className="card group transition-all hover:shadow-md hover:border-[var(--accent)]">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[var(--accent)]">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
          </div>
          <h3 className="text-sm font-semibold">자동 생성</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">뉴스 기사를 AI가 카드뉴스로</p>
        </Link>

        <Link href="/create/manual" className="card group transition-all hover:shadow-md hover:border-[var(--accent)]">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
          </div>
          <h3 className="text-sm font-semibold">수동 생성</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">직접 콘텐츠를 입력해서 생성</p>
        </Link>

        <Link href="/artists" className="card group transition-all hover:shadow-md hover:border-[var(--accent)]">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
          </div>
          <h3 className="text-sm font-semibold">아티스트</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">{configured ? '아티스트 관리' : '12개 아티스트 등록됨'}</p>
        </Link>

        <Link href="/sources" className="card group transition-all hover:shadow-md hover:border-[var(--accent)]">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5" /></svg>
          </div>
          <h3 className="text-sm font-semibold">뉴스 소스</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">뉴스 소스 관리</p>
        </Link>
      </div>

      {/* 최근 카드뉴스 */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">최근 카드뉴스</h2>
          {cards && cards.length > 0 && (
            <span className="text-xs text-[var(--muted)]">{cards.length}개</span>
          )}
        </div>

        {!cards || cards.length === 0 ? (
          <div className="py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
            <p className="mt-3 text-sm text-[var(--muted)]">
              아직 생성된 카드뉴스가 없습니다
            </p>
            <p className="mt-1 text-xs text-gray-400">
              위 버튼으로 첫 카드를 만들어보세요
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="pb-3 font-medium text-[var(--muted)]">제목</th>
                  <th className="pb-3 font-medium text-[var(--muted)]">아티스트</th>
                  <th className="pb-3 font-medium text-[var(--muted)]">언어</th>
                  <th className="pb-3 font-medium text-[var(--muted)]">상태</th>
                  <th className="pb-3 font-medium text-[var(--muted)]">날짜</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/50">
                {cards.map((card) => {
                  const artist = card.artists as { name: string; brand_color: string } | null;
                  return (
                    <tr key={card.id as string} className="hover:bg-gray-50/50">
                      <td className="py-3 pr-4">
                        <span className="font-medium line-clamp-1">{card.title as string}</span>
                      </td>
                      <td className="py-3 pr-4">
                        {artist && (
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: artist.brand_color }} />
                            <span className="text-xs text-[var(--muted)]">{artist.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-sm">
                          {LANG_LABELS[card.language as string] ?? (card.language as string)}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={
                          card.status === 'published'
                            ? 'badge-success'
                            : card.status === 'archived'
                              ? 'badge bg-gray-100 text-gray-600'
                              : 'badge-warning'
                        }>
                          {card.status as string}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-[var(--muted)]">
                        {new Date(card.created_at as string).toLocaleDateString('ko-KR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
