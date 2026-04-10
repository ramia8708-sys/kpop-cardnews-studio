'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient, isSupabaseConfigured } from '@/lib/supabase';
import type { Artist } from '@/types';

const FALLBACK_ARTISTS: Artist[] = [
  { id: 'bts', name: 'BTS', name_ko: '방탄소년단', brand_color: '#9B59B6', logo_url: null, created_at: '', updated_at: '' },
  { id: 'blackpink', name: 'BLACKPINK', name_ko: '블랙핑크', brand_color: '#FF007F', logo_url: null, created_at: '', updated_at: '' },
  { id: 'aespa', name: 'aespa', name_ko: '에스파', brand_color: '#6C3FC5', logo_url: null, created_at: '', updated_at: '' },
  { id: 'newjeans', name: 'NewJeans', name_ko: '뉴진스', brand_color: '#5B9BD5', logo_url: null, created_at: '', updated_at: '' },
  { id: 'ive', name: 'IVE', name_ko: '아이브', brand_color: '#FF6EC7', logo_url: null, created_at: '', updated_at: '' },
  { id: 'gidle', name: '(G)I-DLE', name_ko: '(여자)아이들', brand_color: '#8B00FF', logo_url: null, created_at: '', updated_at: '' },
  { id: 'seventeen', name: 'SEVENTEEN', name_ko: '세븐틴', brand_color: '#F8B4D9', logo_url: null, created_at: '', updated_at: '' },
  { id: 'skz', name: 'Stray Kids', name_ko: '스트레이 키즈', brand_color: '#FF3B3B', logo_url: null, created_at: '', updated_at: '' },
  { id: 'twice', name: 'TWICE', name_ko: '트와이스', brand_color: '#FF6F61', logo_url: null, created_at: '', updated_at: '' },
  { id: 'exo', name: 'EXO', name_ko: '엑소', brand_color: '#C0C0C0', logo_url: null, created_at: '', updated_at: '' },
  { id: 'rv', name: 'Red Velvet', name_ko: '레드벨벳', brand_color: '#E60033', logo_url: null, created_at: '', updated_at: '' },
  { id: 'nct127', name: 'NCT 127', name_ko: 'NCT 127', brand_color: '#00C73C', logo_url: null, created_at: '', updated_at: '' },
];

const LS_KEY = 'custom_artists';

function loadLocalArtists(): Artist[] {
  try {
    const saved = localStorage.getItem(LS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveLocalArtists(artists: Artist[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(artists));
}

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', name_ko: '', brand_color: '#1e3a5f' });

  const useSupabase = isSupabaseConfigured();

  const fetchArtists = async () => {
    if (useSupabase) {
      try {
        const supabase = createBrowserClient();
        const { data } = await supabase.from('artists').select('*').order('name');
        if (data) { setArtists(data as Artist[]); setLoading(false); return; }
      } catch { /* fallback */ }
    }
    const custom = loadLocalArtists();
    setArtists([...FALLBACK_ARTISTS, ...custom]);
    setLoading(false);
  };

  useEffect(() => { fetchArtists(); }, []);

  const handleAdd = async () => {
    if (!form.name) return;

    const newArtist: Artist = {
      id: `custom_${Date.now()}`,
      name: form.name,
      name_ko: form.name_ko || null,
      brand_color: form.brand_color,
      logo_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (useSupabase) {
      const supabase = createBrowserClient();
      await supabase.from('artists').insert({
        name: form.name,
        name_ko: form.name_ko || null,
        brand_color: form.brand_color,
      });
    } else {
      const custom = loadLocalArtists();
      custom.push(newArtist);
      saveLocalArtists(custom);
    }
    setShowForm(false);
    setForm({ name: '', name_ko: '', brand_color: '#1e3a5f' });
    fetchArtists();
  };

  const handleUpdate = async (id: string) => {
    if (useSupabase) {
      const supabase = createBrowserClient();
      await supabase
        .from('artists')
        .update({
          name: form.name,
          name_ko: form.name_ko || null,
          brand_color: form.brand_color,
        })
        .eq('id', id);
    } else {
      const custom = loadLocalArtists().map((a) =>
        a.id === id ? { ...a, name: form.name, name_ko: form.name_ko || null, brand_color: form.brand_color } : a
      );
      saveLocalArtists(custom);
    }
    setEditing(null);
    fetchArtists();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    if (useSupabase) {
      const supabase = createBrowserClient();
      await supabase.from('artists').delete().eq('id', id);
    } else {
      const custom = loadLocalArtists().filter((a) => a.id !== id);
      saveLocalArtists(custom);
    }
    fetchArtists();
  };

  const startEdit = (artist: Artist) => {
    setEditing(artist.id);
    setForm({
      name: artist.name,
      name_ko: artist.name_ko ?? '',
      brand_color: artist.brand_color,
    });
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">아티스트 관리</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{artists.length}개 아티스트 등록됨</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); }} className="btn-primary">
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" /></svg>
            아티스트 추가
          </span>
        </button>
      </div>

      {/* 추가 폼 */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="mb-4 text-sm font-semibold">새 아티스트</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">영문 이름</label>
              <input
                type="text"
                placeholder="BTS"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">한국어 이름</label>
              <input
                type="text"
                placeholder="방탄소년단"
                value={form.name_ko}
                onChange={(e) => setForm({ ...form, name_ko: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <label className="text-xs font-medium text-[var(--muted)]">브랜드 컬러</label>
            <input
              type="color"
              value={form.brand_color}
              onChange={(e) => setForm({ ...form, brand_color: e.target.value })}
              className="h-9 w-14 cursor-pointer rounded-lg border border-[var(--border)] bg-white p-1"
            />
            <span className="font-mono text-xs text-[var(--muted)]">{form.brand_color}</span>
          </div>
          <div className="mt-5 flex gap-3">
            <button onClick={handleAdd} className="btn-primary">저장</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">취소</button>
          </div>
        </div>
      )}

      {/* 아티스트 목록 */}
      {loading ? (
        <div className="card py-12 text-center text-sm text-[var(--muted)]">로딩 중...</div>
      ) : (
        <div className="card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="pb-3 font-medium text-[var(--muted)]">컬러</th>
                <th className="pb-3 font-medium text-[var(--muted)]">이름</th>
                <th className="pb-3 font-medium text-[var(--muted)]">한국어</th>
                <th className="pb-3 text-right font-medium text-[var(--muted)]">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/50">
              {artists.map((artist) =>
                editing === artist.id ? (
                  <tr key={artist.id} className="bg-blue-50/30">
                    <td className="py-3 pr-4">
                      <input
                        type="color"
                        value={form.brand_color}
                        onChange={(e) => setForm({ ...form, brand_color: e.target.value })}
                        className="h-8 w-10 cursor-pointer rounded border-0"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="input"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="text"
                        value={form.name_ko}
                        onChange={(e) => setForm({ ...form, name_ko: e.target.value })}
                        className="input"
                      />
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleUpdate(artist.id)} className="btn-primary text-xs">저장</button>
                        <button onClick={() => setEditing(null)} className="btn-secondary text-xs">취소</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={artist.id} className="hover:bg-gray-50/50">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-4 w-4 rounded-full" style={{ backgroundColor: artist.brand_color }} />
                        <span className="font-mono text-[10px] text-[var(--muted)]">{artist.brand_color}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-medium">{artist.name}</td>
                    <td className="py-3 pr-4 text-[var(--muted)]">{artist.name_ko || '—'}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => startEdit(artist)} className="text-xs text-[var(--accent)] hover:text-blue-700">편집</button>
                        <button onClick={() => handleDelete(artist.id)} className="text-xs text-[var(--danger)] hover:text-red-700">삭제</button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
