'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient, isSupabaseConfigured } from '@/lib/supabase';
import type { Artist } from '@/types';

interface NewsSource {
  id: string;
  artist_id: string;
  source_type: string;
  source_url: string;
  source_name: string | null;
  is_active: boolean;
  last_crawled_at: string | null;
  artists?: { name: string } | null;
}

const SOURCE_TYPES = ['rss', 'web', 'twitter', 'weverse'] as const;

export default function SourcesPage() {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    artist_id: '',
    source_type: 'web' as string,
    source_url: '',
    source_name: '',
  });

  const fetchData = async () => {
    if (!isSupabaseConfigured()) { setLoading(false); return; }
    try {
      const supabase = createBrowserClient();
      const [srcRes, artRes] = await Promise.all([
        supabase.from('news_sources').select('*, artists(name)').order('created_at', { ascending: false }),
        supabase.from('artists').select('*').order('name'),
      ]);
      if (srcRes.data) setSources(srcRes.data as unknown as NewsSource[]);
      if (artRes.data) setArtists(artRes.data as Artist[]);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    if (!form.artist_id || !form.source_url || !isSupabaseConfigured()) return;
    const supabase = createBrowserClient();
    await supabase.from('news_sources').insert(form);
    setShowForm(false);
    setForm({ artist_id: '', source_type: 'web', source_url: '', source_name: '' });
    fetchData();
  };

  const handleToggle = async (id: string, current: boolean) => {
    if (!isSupabaseConfigured()) return;
    const supabase = createBrowserClient();
    await supabase.from('news_sources').update({ is_active: !current }).eq('id', id);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    if (!isSupabaseConfigured()) return;
    const supabase = createBrowserClient();
    await supabase.from('news_sources').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">뉴스 소스 관리</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">아티스트별 뉴스 수집 소스를 관리합니다</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" /></svg>
            소스 추가
          </span>
        </button>
      </div>

      {/* 추가 폼 */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="mb-4 text-sm font-semibold">새 소스 등록</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">아티스트</label>
              <select
                value={form.artist_id}
                onChange={(e) => setForm({ ...form, artist_id: e.target.value })}
                className="input"
              >
                <option value="">아티스트 선택</option>
                {artists.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">소스 유형</label>
              <select
                value={form.source_type}
                onChange={(e) => setForm({ ...form, source_type: e.target.value })}
                className="input"
              >
                {SOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>{t.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">소스 이름 (선택)</label>
            <input
              type="text"
              placeholder="예: 네이버 뉴스"
              value={form.source_name}
              onChange={(e) => setForm({ ...form, source_name: e.target.value })}
              className="input"
            />
          </div>
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">소스 URL</label>
            <input
              type="url"
              placeholder="https://..."
              value={form.source_url}
              onChange={(e) => setForm({ ...form, source_url: e.target.value })}
              className="input"
            />
          </div>
          <div className="mt-5 flex gap-3">
            <button onClick={handleAdd} className="btn-primary">저장</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">취소</button>
          </div>
        </div>
      )}

      {/* 소스 목록 */}
      {loading ? (
        <div className="card py-12 text-center text-sm text-[var(--muted)]">로딩 중...</div>
      ) : !isSupabaseConfigured() ? (
        <div className="card py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>
          <p className="mt-3 text-sm text-[var(--muted)]">Supabase 연결 후 사용할 수 있습니다</p>
          <p className="mt-1 text-xs text-gray-400">뉴스 소스 관리는 데이터베이스가 필요합니다</p>
        </div>
      ) : sources.length === 0 ? (
        <div className="card py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5" /></svg>
          <p className="mt-3 text-sm text-[var(--muted)]">등록된 소스가 없습니다</p>
        </div>
      ) : (
        <div className="card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="pb-3 font-medium text-[var(--muted)]">상태</th>
                <th className="pb-3 font-medium text-[var(--muted)]">유형</th>
                <th className="pb-3 font-medium text-[var(--muted)]">아티스트</th>
                <th className="pb-3 font-medium text-[var(--muted)]">소스</th>
                <th className="pb-3 text-right font-medium text-[var(--muted)]">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/50">
              {sources.map((src) => (
                <tr key={src.id} className="hover:bg-gray-50/50">
                  <td className="py-3 pr-4">
                    <button
                      onClick={() => handleToggle(src.id, src.is_active)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        src.is_active ? 'bg-[var(--success)]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          src.is_active ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="badge-info font-mono">{src.source_type}</span>
                  </td>
                  <td className="py-3 pr-4 text-[var(--muted)]">{src.artists?.name}</td>
                  <td className="py-3 pr-4">
                    <p className="truncate font-medium">{src.source_name || src.source_url}</p>
                  </td>
                  <td className="py-3 text-right">
                    <button onClick={() => handleDelete(src.id)} className="text-xs text-[var(--danger)] hover:text-red-700">삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
