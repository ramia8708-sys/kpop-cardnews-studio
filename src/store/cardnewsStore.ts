import { create } from 'zustand';
import type { Artist } from '@/types';
import type { CardContent } from '@/lib/ai/generateCard';

export type FlowStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface NewsArticle {
  title: string;
  link: string;
  summary: string;
  date: string;
}

interface CardNewsState {
  // ── 플로우 ────────────────
  step: FlowStep;
  setStep: (s: FlowStep) => void;
  nextStep: () => void;
  prevStep: () => void;

  // ── Step 1: 아티스트 ──────
  artist: Artist | null;
  setArtist: (a: Artist) => void;

  // ── Step 2: 언어 ──────────
  languages: string[];
  setLanguages: (l: string[]) => void;

  // ── Step 3: 뉴스 / 수동 입력 ─
  articles: NewsArticle[];
  setArticles: (a: NewsArticle[]) => void;
  selectedArticle: NewsArticle | null;
  setSelectedArticle: (a: NewsArticle | null) => void;

  // 수동 입력
  manualTitle: string;
  setManualTitle: (t: string) => void;
  manualHeadline: string;
  setManualHeadline: (h: string) => void;

  // 이미지
  imageUrl: string;
  setImageUrl: (u: string) => void;

  // 채널 태그
  channelTag: string;
  setChannelTag: (t: string) => void;

  // ── Step 4–5: 생성 결과 ───
  generating: boolean;
  setGenerating: (g: boolean) => void;
  results: Record<string, CardContent> | null;
  setResults: (r: Record<string, CardContent> | null) => void;
  updateResult: (lang: string, partial: Partial<CardContent>) => void;
  activeLanguage: string;
  setActiveLanguage: (l: string) => void;

  // ── Step 6: 렌더 이미지 ───
  renderedImage: string | null;
  setRenderedImage: (img: string | null) => void;

  // ── 리셋 ──────────────────
  reset: () => void;
}

export const useCardNewsStore = create<CardNewsState>((set) => ({
  step: 1,
  setStep: (s) => set({ step: s }),
  nextStep: () => set((st) => ({ step: Math.min(6, st.step + 1) as FlowStep })),
  prevStep: () => set((st) => ({ step: Math.max(1, st.step - 1) as FlowStep })),

  artist: null,
  setArtist: (a) => set({ artist: a }),

  languages: ['ko'],
  setLanguages: (l) => set({ languages: l }),

  articles: [],
  setArticles: (a) => set({ articles: a }),
  selectedArticle: null,
  setSelectedArticle: (a) => set({ selectedArticle: a }),

  manualTitle: '',
  setManualTitle: (t) => set({ manualTitle: t }),
  manualHeadline: '',
  setManualHeadline: (h) => set({ manualHeadline: h }),

  imageUrl: '',
  setImageUrl: (u) => set({ imageUrl: u }),

  channelTag: '',
  setChannelTag: (t) => set({ channelTag: t }),

  generating: false,
  setGenerating: (g) => set({ generating: g }),
  results: null,
  setResults: (r) => set({ results: r }),
  updateResult: (lang, partial) =>
    set((st) => {
      if (!st.results || !st.results[lang]) return st;
      return {
        results: {
          ...st.results,
          [lang]: { ...st.results[lang], ...partial },
        },
      };
    }),
  activeLanguage: 'ko',
  setActiveLanguage: (l) => set({ activeLanguage: l }),

  renderedImage: null,
  setRenderedImage: (img) => set({ renderedImage: img }),

  reset: () =>
    set({
      step: 1,
      artist: null,
      languages: ['ko'],
      articles: [],
      selectedArticle: null,
      manualTitle: '',
      manualHeadline: '',
      imageUrl: '',
      channelTag: '',
      generating: false,
      results: null,
      activeLanguage: 'ko',
      renderedImage: null,
    }),
}));
