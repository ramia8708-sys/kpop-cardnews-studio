'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient, isSupabaseConfigured } from '@/lib/supabase';
import type { Artist } from '@/types';

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const igStatus = searchParams.get('instagram');

  const [artists, setArtists] = useState<Artist[]>([]);
  const [channelTag, setChannelTag] = useState('');
  const [savedTag, setSavedTag] = useState('');
  const [connections, setConnections] = useState<
    { artist_id: string; instagram_account: string; username: string | null; is_active: boolean }[]
  >([]);

  useEffect(() => {
    const saved = localStorage.getItem('channel_tag');
    if (saved) {
      setChannelTag(saved);
      setSavedTag(saved);
    }

    if (!isSupabaseConfigured()) return;

    const load = async () => {
      try {
        const supabase = createBrowserClient();
        const [artRes, connRes] = await Promise.all([
          supabase.from('artists').select('*').order('name'),
          supabase.from('instagram_connections').select('*').eq('is_active', true),
        ]);
        if (artRes.data) setArtists(artRes.data as Artist[]);
        if (connRes.data) setConnections(connRes.data as typeof connections);

        const firstConn = connRes.data?.[0];
        if (firstConn?.username && !saved) {
          setChannelTag(firstConn.username);
          setSavedTag(firstConn.username);
        }
      } catch {
        // Supabase 연결 실패 시 무시
      }
    };
    load();
  }, []);

  const handleSaveTag = async () => {
    localStorage.setItem('channel_tag', channelTag);
    setSavedTag(channelTag);
  };

  const getArtistName = (id: string) =>
    artists.find((a) => a.id === id)?.name ?? id;

  return (
    <div className="mx-auto max-w-3xl">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">설정</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">앱 설정 및 외부 서비스 연결을 관리합니다</p>
      </div>

      {/* Instagram 연결 상태 알림 */}
      {igStatus === 'connected' && (
        <div className="mb-6 card border-emerald-200 bg-emerald-50">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-sm font-medium text-emerald-700">Instagram 계정이 성공적으로 연결되었습니다!</span>
          </div>
        </div>
      )}
      {igStatus === 'error' && (
        <div className="mb-6 card border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
            <span className="text-sm font-medium text-red-700">Instagram 연결 중 오류가 발생했습니다. 다시 시도해주세요.</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* 카드 채널명 */}
        <div className="card">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[var(--accent)]">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" /></svg>
            </div>
            <div>
              <h2 className="text-base font-semibold">카드 채널명</h2>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                카드 좌상단에 표시되는 채널 계정명입니다. Instagram 연결 시 자동으로 설정됩니다.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={channelTag}
              onChange={(e) => setChannelTag(e.target.value)}
              placeholder="@channel_name"
              className="input flex-1"
            />
            <button
              onClick={handleSaveTag}
              disabled={channelTag === savedTag}
              className="btn-primary"
            >
              저장
            </button>
          </div>
          {savedTag && channelTag === savedTag && (
            <p className="mt-2 text-xs text-[var(--success)]">현재 저장됨: {savedTag}</p>
          )}
        </div>

        {/* Instagram 연결 */}
        <div className="card">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-pink-50 text-pink-500">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>
            </div>
            <div>
              <h2 className="text-base font-semibold">Instagram 연결</h2>
              <p className="mt-0.5 text-xs text-[var(--muted)]">아티스트별 Instagram 계정을 연결하여 직접 게시할 수 있습니다</p>
            </div>
          </div>

          {connections.length > 0 && (
            <div className="mb-5 space-y-2">
              {connections.map((conn) => (
                <div
                  key={conn.artist_id}
                  className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3"
                >
                  <div className="h-2 w-2 rounded-full bg-[var(--success)]" />
                  <span className="text-sm font-medium">{getArtistName(conn.artist_id)}</span>
                  <span className="text-xs text-[var(--muted)]">{conn.username || conn.instagram_account}</span>
                  <span className="badge-success ml-auto">연결됨</span>
                </div>
              ))}
            </div>
          )}

          {artists.length > 0 ? (
            <div className="space-y-2">
              <p className="mb-3 text-xs font-medium text-[var(--muted)]">아티스트별 연결 상태</p>
              {artists.map((artist) => {
                const connected = connections.some((c) => c.artist_id === artist.id);
                return (
                  <div
                    key={artist.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: artist.brand_color }} />
                      <span className="text-sm">{artist.name}</span>
                    </div>
                    {connected ? (
                      <span className="badge-success">연결됨</span>
                    ) : (
                      <a
                        href={`/api/instagram/auth?artistId=${artist.id}`}
                        className="text-xs font-medium text-[var(--accent)] hover:text-blue-700"
                      >
                        연결하기
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              {isSupabaseConfigured() ? '등록된 아티스트가 없습니다.' : 'Supabase 연결 후 Instagram 연동을 사용할 수 있습니다.'}
            </p>
          )}
        </div>

        {/* 환경 정보 */}
        <div className="card">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-[var(--muted)]">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
            </div>
            <div>
              <h2 className="text-base font-semibold">환경 정보</h2>
              <p className="mt-0.5 text-xs text-[var(--muted)]">현재 앱 구성 상태</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <span className="text-sm text-[var(--muted)]">Supabase</span>
              {isSupabaseConfigured() ? (
                <span className="badge-success">연결됨</span>
              ) : (
                <span className="badge-warning">미연결</span>
              )}
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <span className="text-sm text-[var(--muted)]">데이터 저장</span>
              <span className="badge-info">{isSupabaseConfigured() ? 'Supabase' : 'localStorage'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
