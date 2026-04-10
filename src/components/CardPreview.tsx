'use client';

import type { Artist, CardData } from '@/types';

interface CardPreviewProps {
  card: CardData;
  artist: Artist;
  language: string;
}

const FONT_MAP: Record<string, string> = {
  ko: 'var(--font-noto-kr)',
  ja: 'var(--font-noto-jp)',
  zh: 'var(--font-noto-sc)',
  en: 'var(--font-dm-sans)',
  es: 'var(--font-dm-sans)',
  pt: 'var(--font-dm-sans)',
  id: 'var(--font-dm-sans)',
};

/**
 * 단일 카드 미리보기 — 1:1 비율
 * 배경: 업로드 사진 꽉 채움
 * 좌상단: tag, 하단: headline + 그라데이션 딤
 */
export default function CardPreview({
  card,
  artist,
  language,
}: CardPreviewProps) {
  const fontFamily = FONT_MAP[language] || FONT_MAP.en;

  return (
    <div className="relative w-full">
      <div
        className="relative aspect-square w-full overflow-hidden rounded-2xl text-white shadow-lg"
        style={{
          fontFamily,
          backgroundColor: card.image_url ? undefined : artist.brand_color,
        }}
      >
        {/* 배경 이미지 */}
        {card.image_url && (
          <img
            src={card.image_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* 좌상단: tag */}
        <div className="relative p-5">
          <span className="inline-block rounded-full bg-black/45 px-3 py-1 text-[11px] font-bold backdrop-blur-sm">
            {card.tag}
          </span>
        </div>

        {/* 하단: headline + 딤 */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="h-48 bg-gradient-to-t from-black/75 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <h2 className="text-lg font-bold leading-snug sm:text-xl"
              style={{ textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}
            >
              {card.headline}
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}
