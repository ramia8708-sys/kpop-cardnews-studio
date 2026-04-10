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

interface ArtistPickerProps {
  onSelect: (artist: Artist) => void;
  selected?: Artist;
}

export default function ArtistPicker({ onSelect, selected }: ArtistPickerProps) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let custom: Artist[] = [];
    try {
      const saved = localStorage.getItem('custom_artists');
      if (saved) custom = JSON.parse(saved);
    } catch { /* ignore */ }

    if (!isSupabaseConfigured()) {
      setArtists([...FALLBACK_ARTISTS, ...custom]);
      setLoading(false);
      return;
    }
    try {
      const supabase = createBrowserClient();
      supabase
        .from('artists')
        .select('*')
        .order('name')
        .then(({ data }) => {
          setArtists(data && data.length > 0 ? (data as Artist[]) : [...FALLBACK_ARTISTS, ...custom]);
          setLoading(false);
        });
    } catch {
      setArtists([...FALLBACK_ARTISTS, ...custom]);
      setLoading(false);
    }
  }, []);

  const filtered = artists.filter(
    (a) =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      (a.name_ko && a.name_ko.includes(query))
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
        <input
          type="text"
          placeholder="아티스트 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--muted)]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[var(--accent)]" />
          로딩 중...
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {filtered.map((artist) => {
            const isSelected = selected?.id === artist.id;
            return (
              <button
                key={artist.id}
                onClick={() => onSelect(artist)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                  isSelected
                    ? 'border-[var(--accent)] bg-[var(--accent-light)]/30 shadow-sm'
                    : 'border-[var(--border)] bg-white hover:border-[var(--accent)]/50 hover:shadow-sm'
                }`}
              >
                <span
                  className="inline-block h-5 w-5 rounded-full ring-2 ring-white"
                  style={{ backgroundColor: artist.brand_color }}
                />
                <span className="text-xs font-semibold leading-tight">
                  {artist.name}
                </span>
                {artist.name_ko && (
                  <span className="text-[10px] text-[var(--muted)]">
                    {artist.name_ko}
                  </span>
                )}
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full py-6 text-center text-sm text-[var(--muted)]">
              검색 결과가 없습니다
            </div>
          )}
        </div>
      )}
    </div>
  );
}
