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
  '콘텐츠 입력',
  '카드 생성 중',
  '미리보기',
  '내보내기',
];

export default function ManualCreatePage() {
  const s = useCardNewsStore();

  useEffect(() => {
    const saved = localStorage.getItem('channel_tag');
    if (saved) s.setChannelTag(saved);
  }, []);

  const handleGenerate = async () => {
    if (!s.manualTitle) return;
    s.setGenerating(true);
    s.nextStep();

    try {
      const newsText = `${s.manualTitle}\n\n${s.manualHeadline}`;
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

    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card, artist: s.artist, language: s.activeLanguage }),
      });
      const data = await res.json();
      if (!data.image) {
        alert('렌더링 실패: ' + (data.error || '알 수 없는 오류'));
        return;
      }

      const link = document.createElement('a');
      link.href = `data:image/png;base64,${data.image}`;
      link.download = `${s.artist.name}_${s.activeLanguage}.png`;
      link.click();
    } catch (err) {
      alert('다운로드 실패: ' + String(err));
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
        <h1 className="text-2xl font-bold text-[var(--foreground)]">수동 생성</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">직접 콘텐츠를 입력하고 다국어 카드를 만듭니다</p>
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
            <button onClick={s.nextStep} disabled={s.languages.length === 0} className="btn-primary">
              다음
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: 콘텐츠 입력 ──────────────────── */}
      {s.step === 3 && (
        <div className="space-y-4">
          <div className="card space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">뉴스 제목 / 주제</label>
              <input
                type="text"
                value={s.manualTitle}
                onChange={(e) => s.setManualTitle(e.target.value)}
                placeholder="카드뉴스 주제를 입력하세요"
                className="input"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">원하는 헤드라인 (선택)</label>
              <input
                type="text"
                value={s.manualHeadline}
                onChange={(e) => s.setManualHeadline(e.target.value)}
                placeholder="AI가 자동 생성하지만, 직접 입력도 가능합니다"
                className="input"
              />
            </div>
          </div>

          <div className="card">
            <ImageUploader imageUrl={s.imageUrl} onImageChange={s.setImageUrl} />
          </div>

          <div className="flex gap-3">
            <button onClick={s.prevStep} className="btn-secondary">이전</button>
            <button onClick={handleGenerate} disabled={!s.manualTitle} className="btn-primary">
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
            <button onClick={() => s.setStep(3)} className="btn-secondary">수정</button>
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
