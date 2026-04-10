'use client';

import { useEffect, useState } from 'react';
import LanguagePicker from '@/components/LanguagePicker';
import ImageUploader from '@/components/ImageUploader';
import CardPreview from '@/components/CardPreview';
import type { CardData, Artist } from '@/types';
import type { CardContent } from '@/lib/ai/generateCard';

type Step = 1 | 2 | 3 | 4 | 5;
const STEP_LABELS = ['URL 입력', '미리보기', '카드 생성 중', '미리보기', '내보내기'];

// 아티스트 없이 사용할 기본 아티스트 객체
const DEFAULT_ARTIST: Artist = {
  id: 'url-mode',
  name: 'K-pop',
  name_ko: null,
  brand_color: '#1e3a5f',
  logo_url: null,
  created_at: '',
  updated_at: '',
};

export default function UrlCreatePage() {
  const [step, setStep] = useState<Step>(1);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [languages, setLanguages] = useState<string[]>(['ko']);
  const [imageUrl, setImageUrl] = useState('');
  const [channelTag, setChannelTag] = useState('');

  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<Record<string, CardContent> | null>(null);
  const [activeLanguage, setActiveLanguage] = useState('ko');

  useEffect(() => {
    const saved = localStorage.getItem('channel_tag');
    if (saved) setChannelTag(saved);
  }, []);

  // Step 1: URL로 기사 가져오기
  const handleFetchArticle = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setTitle(data.title);
      setBody(data.body);
      setStep(2);
    } catch {
      setError('기사를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 → 3: 카드 생성
  const handleGenerate = async () => {
    setGenerating(true);
    setStep(3);
    try {
      const newsText = `${title}\n\n${body}`;
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsText, languages }),
      });
      const data = await res.json();
      setResults(data.results);
      setActiveLanguage(languages[0]);
      setStep(4);
    } catch {
      alert('카드 생성에 실패했습니다.');
      setStep(2);
    } finally {
      setGenerating(false);
    }
  };

  // 다운로드
  const handleDownload = async () => {
    if (!results) return;
    const content = results[activeLanguage];
    if (!content) return;

    const card: CardData = {
      tag: channelTag || 'K-pop News',
      headline: content.headline,
      image_url: imageUrl,
    };

    const res = await fetch('/api/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card, artist: DEFAULT_ARTIST, language: activeLanguage }),
    });
    const data = await res.json();
    if (!data.image) return;

    const link = document.createElement('a');
    link.href = `data:image/png;base64,${data.image}`;
    link.download = `cardnews_${activeLanguage}.png`;
    link.click();
  };

  const currentCard: CardData | null = results?.[activeLanguage]
    ? {
        tag: channelTag || 'K-pop News',
        headline: results[activeLanguage].headline,
        image_url: imageUrl,
      }
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">URL 입력 생성</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">뉴스 기사 URL을 입력하면 AI가 카드뉴스를 자동 생성합니다</p>
      </div>

      {/* 스텝 인디케이터 */}
      <div className="mb-8 flex items-center gap-1">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  i + 1 === step
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : i + 1 < step
                      ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {i + 1 < step ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" /></svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-[10px] ${i + 1 === step ? 'font-medium text-[var(--accent)]' : 'text-[var(--muted)]'}`}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`mb-4 h-0.5 w-6 ${i + 1 < step ? 'bg-[var(--accent-light)]' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 1: URL 입력 + 언어 선택 ─── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="mb-4 text-sm font-semibold">뉴스 기사 URL</h3>
            <div className="flex gap-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/news/article..."
                className="input flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleFetchArticle()}
              />
              <button
                onClick={handleFetchArticle}
                disabled={!url.trim() || loading}
                className="btn-primary"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    불러오는 중
                  </span>
                ) : '불러오기'}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-xs text-red-500">{error}</p>
            )}
          </div>

          <div className="card">
            <LanguagePicker selected={languages} onChange={setLanguages} mode="multi" />
          </div>
        </div>
      )}

      {/* ── Step 2: 기사 미리보기 + 이미지 업로드 ─── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="mb-2 text-sm font-semibold">기사 미리보기</h3>
            <div className="rounded-xl border border-[var(--border)] p-4">
              <h4 className="text-base font-bold text-[var(--foreground)]">{title}</h4>
              <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                {body.slice(0, 500)}{body.length > 500 ? '...' : ''}
              </p>
              <div className="mt-3 flex justify-end">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  기사 바로가기
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                </a>
              </div>
            </div>
          </div>

          <div className="card">
            <ImageUploader imageUrl={imageUrl} onImageChange={setImageUrl} />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary">이전</button>
            <button onClick={handleGenerate} className="btn-primary">
              카드 생성
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: 로딩 ─── */}
      {step === 3 && (
        <div className="card flex flex-col items-center gap-4 py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--accent)]" />
          <p className="text-sm text-[var(--muted)]">
            {languages.length}개 언어로 카드를 생성하고 있습니다...
          </p>
        </div>
      )}

      {/* ── Step 4: 카드 미리보기 ─── */}
      {step === 4 && results && currentCard && (
        <div className="space-y-4">
          <div className="card">
            <div className="mb-4 flex gap-2">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLanguage(lang)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    activeLanguage === lang
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-gray-100 text-[var(--muted)] hover:bg-gray-200'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="mx-auto max-w-sm">
              <CardPreview card={currentCard} artist={DEFAULT_ARTIST} language={activeLanguage} />
            </div>
          </div>

          {results[activeLanguage] && (
            <div className="card bg-gray-50">
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Caption</p>
              <p className="mt-2 text-sm text-[var(--foreground)]">{results[activeLanguage].caption}</p>
              <p className="mt-3 text-sm text-[var(--accent)]">
                {results[activeLanguage].hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn-secondary">다시 선택</button>
            <button onClick={() => setStep(5)} className="btn-primary">다음</button>
          </div>
        </div>
      )}

      {/* ── Step 5: 내보내기 ─── */}
      {step === 5 && (
        <div className="card space-y-5">
          <h3 className="text-base font-semibold">내보내기</h3>
          <div className="flex gap-3">
            <button onClick={handleDownload} className="btn-primary">
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                PNG 다운로드 ({activeLanguage.toUpperCase()})
              </span>
            </button>
          </div>
          <div className="flex gap-3 border-t border-[var(--border)] pt-5">
            <button onClick={() => setStep(4)} className="btn-secondary">이전</button>
            <button
              onClick={() => {
                setStep(1);
                setUrl('');
                setTitle('');
                setBody('');
                setImageUrl('');
                setResults(null);
                setError('');
              }}
              className="btn-secondary"
            >
              처음부터
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
