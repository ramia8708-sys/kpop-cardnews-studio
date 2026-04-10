'use client';

import { useEffect, useState, useCallback } from 'react';
import { useCardNewsStore } from '@/store/cardnewsStore';
import ArtistPicker from '@/components/ArtistPicker';
import LanguagePicker from '@/components/LanguagePicker';
import CardPreview from '@/components/CardPreview';
import ImageUploader from '@/components/ImageUploader';
import type { CardData } from '@/types';
import { svgToPng } from '@/lib/svgToPng';

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
  const [renderedImage, setRenderedImage] = useState('');
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('channel_tag');
    if (saved) s.setChannelTag(saved);
  }, []);

  const renderCard = useCallback(async () => {
    if (!s.results || !s.artist) return;
    const content = s.results[s.activeLanguage];
    if (!content) return;

    setRendering(true);
    setRenderError('');
    setRenderedImage('');

    const card: CardData = {
      tag: s.channelTag || s.artist.name,
      headline: content.headline,
      image_url: s.imageUrl,
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card, artist: s.artist, language: s.activeLanguage }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const text = await res.text();
        setRenderError(`서버 오류 (${res.status}): ${text.slice(0, 200)}`);
        return;
      }

      const data = await res.json();
      if (!data.svg) {
        setRenderError(data.detail || data.error || '렌더링 실패: SVG 없음');
        return;
      }

      const pngDataUrl = await svgToPng(data.svg);
      setRenderedImage(pngDataUrl);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setRenderError('서버 응답 시간 초과 (30초). 다시 시도해주세요.');
      } else {
        setRenderError(String(err));
      }
    } finally {
      setRendering(false);
    }
  }, [s.results, s.artist, s.activeLanguage, s.channelTag, s.imageUrl]);

  useEffect(() => {
    if (s.step === 6) renderCard();
  }, [s.step, renderCard]);

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
                {s.articles.map((article, i) => {
                  const isSelected = s.selectedArticle?.link === article.link;
                  return (
                    <div
                      key={i}
                      onClick={() => s.setSelectedArticle(article)}
                      className={`w-full cursor-pointer rounded-xl border p-4 text-left transition-all ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent-light)]/30'
                          : 'border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-gray-50'
                      }`}
                    >
                      <h3 className="text-sm font-semibold">{article.title}</h3>
                      <p className={`mt-1 text-xs text-[var(--muted)] ${isSelected ? '' : 'line-clamp-2'}`}>
                        {isSelected
                          ? article.summary.slice(0, 400) + (article.summary.length > 400 ? '...' : '')
                          : article.summary}
                      </p>
                      {article.date && <span className="mt-1 inline-block text-[10px] text-gray-400">{article.date}</span>}
                      {isSelected && (
                        <div className="mt-3 flex justify-end">
                          <a
                            href={article.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                          >
                            기사 바로가기
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
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

      {/* ── Step 5: 미리보기 (수정 가능) ───────────────────── */}
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

          {/* 헤드라인 수정 */}
          <div className="card">
            <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
              Headline
            </label>
            <textarea
              value={s.results[s.activeLanguage]?.headline || ''}
              onChange={(e) => s.updateResult(s.activeLanguage, { headline: e.target.value })}
              rows={2}
              className="input resize-none"
            />
          </div>

          {/* 캡션 수정 */}
          {s.results[s.activeLanguage] && (
            <div className="card">
              <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                Caption
              </label>
              <textarea
                value={s.results[s.activeLanguage].caption}
                onChange={(e) => s.updateResult(s.activeLanguage, { caption: e.target.value })}
                rows={4}
                className="input resize-none"
              />
              <label className="mt-3 mb-1.5 flex items-center gap-2 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" /></svg>
                Hashtags
              </label>
              <input
                type="text"
                value={s.results[s.activeLanguage].hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}
                onChange={(e) => {
                  const tags = e.target.value.split(/\s+/).filter(Boolean).map((t) => t.replace(/^#/, ''));
                  s.updateResult(s.activeLanguage, { hashtags: tags });
                }}
                className="input"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => s.setStep(3)} className="btn-secondary">다시 선택</button>
            <button onClick={s.nextStep} className="btn-primary">다음</button>
          </div>
        </div>
      )}

      {/* ── Step 6: 내보내기 (이미지 직접 표시) ───────────────────── */}
      {s.step === 6 && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="mb-4 text-base font-semibold">완성된 카드뉴스</h3>
            {rendering && (
              <div className="flex flex-col items-center gap-4 py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--accent)]" />
                <p className="text-sm text-[var(--muted)]">이미지를 생성하고 있습니다...</p>
              </div>
            )}
            {renderError && (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                렌더링 실패: {renderError}
              </div>
            )}
            {renderedImage && (
              <div className="mx-auto max-w-md">
                <img
                  src={renderedImage}
                  alt="카드뉴스"
                  className="w-full rounded-xl shadow-lg"
                  style={{ aspectRatio: '4 / 5' }}
                />
                <p className="mt-3 text-center text-xs text-[var(--muted)]">
                  이미지를 길게 누르거나 우클릭하여 저장하세요
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={s.prevStep} className="btn-secondary">이전</button>
            <button onClick={s.reset} className="btn-secondary">처음부터</button>
          </div>
        </div>
      )}
    </div>
  );
}
