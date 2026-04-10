'use client';

import { useEffect } from 'react';
import { useCardNewsStore } from '@/store/cardnewsStore';
import ArtistPicker from '@/components/ArtistPicker';
import LanguagePicker from '@/components/LanguagePicker';
import CardPreview from '@/components/CardPreview';
import ImageUploader from '@/components/ImageUploader';
import type { CardData } from '@/types';

const STEP_LABELS = [
  '아티스트 선택',
  '언어 선택',
  '뉴스 검색',
  '카드 생성 중',
  '미리보기',
  '내보내기',
];

export default function AutoCreatePage() {
  const s = useCardNewsStore();

  useEffect(() => {
    const saved = localStorage.getItem('channel_tag');
    if (saved) s.setChannelTag(saved);
  }, []);

  const handleSearchNews = async () => {
    if (!s.artist) return;
    const q = encodeURIComponent(s.artist.name);
    const res = await fetch(`/api/news?q=${q}`);
    const data = await res.json();
    s.setArticles(data.articles ?? []);
  };

  const handleGenerate = async () => {
    if (!s.selectedArticle) return;
    s.setGenerating(true);
    s.nextStep();

    try {
      const newsText = `${s.selectedArticle.title}\n\n${s.selectedArticle.summary}`;
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsText, languages: s.languages }),
      });
      const data = await res.json();
      s.setResults(data.results);
      s.setActiveLanguage(s.languages[0]);
      s.setStep(5);
    } catch {
      alert('카드 생성에 실패했습니다.');
      s.prevStep();
    } finally {
      s.setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!s.results || !s.artist) return;
    const content = s.results[s.activeLanguage];
    if (!content) return;

    const card: CardData = {
      tag: s.channelTag || s.artist.name,
      headline: content.headline,
      image_url: s.imageUrl,
    };

    const res = await fetch('/api/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card, artist: s.artist, language: s.activeLanguage }),
    });
    const data = await res.json();
    if (!data.image) return;

    const link = document.createElement('a');
    link.href = `data:image/png;base64,${data.image}`;
    link.download = `${s.artist.name}_${s.activeLanguage}.png`;
    link.click();
  };

  const currentCard: CardData | null = s.results?.[s.activeLanguage]
    ? {
        tag: s.channelTag || s.artist?.name || '',
        headline: s.results[s.activeLanguage].headline,
        image_url: s.imageUrl,
      }
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">자동 생성</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">뉴스 기사를 선택하면 AI가 카드뉴스를 자동 생성합니다</p>
      </div>

      {/* 스텝 인디케이터 */}
      <div className="mb-8 flex items-center gap-1">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  i + 1 === s.step
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : i + 1 < s.step
                      ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {i + 1 < s.step ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" /></svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-[10px] ${i + 1 === s.step ? 'font-medium text-[var(--accent)]' : 'text-[var(--muted)]'}`}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`mb-4 h-0.5 w-6 ${i + 1 < s.step ? 'bg-[var(--accent-light)]' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 1: 아티스트 ─────────────────────── */}
      {s.step === 1 && (
        <div className="card">
          <ArtistPicker
            selected={s.artist ?? undefined}
            onSelect={(a) => { s.setArtist(a); s.nextStep(); }}
          />
        </div>
      )}

      {/* ── Step 2: 언어 ────────────────────────── */}
      {s.step === 2 && (
        <div className="card space-y-6">
          <LanguagePicker selected={s.languages} onChange={s.setLanguages} mode="multi" />
          <div className="flex gap-3">
            <button onClick={s.prevStep} className="btn-secondary">이전</button>
            <button
              onClick={() => { handleSearchNews(); s.nextStep(); }}
              disabled={s.languages.length === 0}
              className="btn-primary"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: 뉴스 검색 + 이미지 업로드 ─── */}
      {s.step === 3 && (
        <div className="space-y-4">
          <div className="card">
            <ImageUploader imageUrl={s.imageUrl} onImageChange={s.setImageUrl} />
          </div>

          <div className="card">
            <h3 className="mb-4 text-sm font-semibold">뉴스 기사 선택</h3>
            {s.articles.length === 0 ? (
              <div className="flex items-center gap-3 py-8 justify-center text-sm text-[var(--muted)]">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-[var(--accent)]" />
                뉴스를 불러오는 중...
              </div>
            ) : (
              <div className="space-y-2">
                {s.articles.map((article, i) => (
                  <button
                    key={i}
                    onClick={() => s.setSelectedArticle(article)}
                    className={`w-full rounded-xl border p-4 text-left transition-all ${
                      s.selectedArticle?.link === article.link
                        ? 'border-[var(--accent)] bg-[var(--accent-light)]/30'
                        : 'border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-gray-50'
                    }`}
                  >
                    <h3 className="text-sm font-semibold">{article.title}</h3>
                    <p className="mt-1 text-xs text-[var(--muted)] line-clamp-2">{article.summary}</p>
                    {article.date && <span className="mt-1 inline-block text-[10px] text-gray-400">{article.date}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={s.prevStep} className="btn-secondary">이전</button>
            <button onClick={handleGenerate} disabled={!s.selectedArticle} className="btn-primary">
              카드 생성
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: 로딩 ───────────────────────── */}
      {s.step === 4 && (
        <div className="card flex flex-col items-center gap-4 py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--accent)]" />
          <p className="text-sm text-[var(--muted)]">
            {s.languages.length}개 언어로 카드를 생성하고 있습니다...
          </p>
        </div>
      )}

      {/* ── Step 5: 미리보기 ───────────────────── */}
      {s.step === 5 && s.results && s.artist && currentCard && (
        <div className="space-y-4">
          <div className="card">
            <div className="mb-4 flex gap-2">
              {s.languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => s.setActiveLanguage(lang)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    s.activeLanguage === lang
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-gray-100 text-[var(--muted)] hover:bg-gray-200'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="mx-auto max-w-sm">
              <CardPreview card={currentCard} artist={s.artist} language={s.activeLanguage} />
            </div>
          </div>

          {s.results[s.activeLanguage] && (
            <div className="card bg-gray-50">
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Caption</p>
              <p className="mt-2 text-sm text-[var(--foreground)]">{s.results[s.activeLanguage].caption}</p>
              <p className="mt-3 text-sm text-[var(--accent)]">
                {s.results[s.activeLanguage].hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => s.setStep(3)} className="btn-secondary">다시 선택</button>
            <button onClick={s.nextStep} className="btn-primary">다음</button>
          </div>
        </div>
      )}

      {/* ── Step 6: 내보내기 ───────────────────── */}
      {s.step === 6 && (
        <div className="card space-y-5">
          <h3 className="text-base font-semibold">내보내기</h3>
          <div className="flex gap-3">
            <button onClick={handleDownload} className="btn-primary">
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                PNG 다운로드 ({s.activeLanguage.toUpperCase()})
              </span>
            </button>
            <button
              disabled
              className="btn-secondary cursor-not-allowed opacity-50"
              title="Instagram 연결 후 활성화됩니다"
            >
              Instagram 게시
            </button>
          </div>
          <p className="text-xs text-[var(--muted)]">Instagram 게시는 계정 연결 후 사용할 수 있습니다.</p>
          <div className="flex gap-3 border-t border-[var(--border)] pt-5">
            <button onClick={s.prevStep} className="btn-secondary">이전</button>
            <button onClick={s.reset} className="btn-secondary">처음부터</button>
          </div>
        </div>
      )}
    </div>
  );
}
