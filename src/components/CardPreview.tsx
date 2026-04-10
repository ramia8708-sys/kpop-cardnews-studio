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
 * 단일 카드 미리보기 — 4:5 세로형 비율
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
        className="relative w-full overflow-hidden rounded-2xl text-white shadow-lg"
        style={{
          aspectRatio: '4 / 5',
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

        {/* 하단: tag + headline + 딤 */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="h-56 bg-gradient-to-t from-black/75 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <div className="text-[13px] font-black opacity-90 mb-1">
              {card.tag}
            </div>
            <h2 className="text-2xl font-extrabold leading-tight sm:text-3xl"
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
