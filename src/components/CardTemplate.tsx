import type { Artist, CardData } from '@/types';

export interface CardTemplateProps {
  card: CardData;
  artist: Artist;
  language: string;
}

const FONT_FAMILY: Record<string, string> = {
  ko: 'Noto Sans KR',
  ja: 'Noto Sans JP',
  zh: 'Noto Sans SC',
  en: 'DM Sans',
  es: 'DM Sans',
  pt: 'DM Sans',
  id: 'DM Sans',
};

/**
 * 단일 카드 템플릿 — 1080×1350 (4:5 인스타 세로형)
 * 배경: 업로드 사진 꽉 채움
 * 좌상단: tag (채널명)
 * 하단: headline (굵은 텍스트, 그라데이션 딤)
 */
export default function CardTemplate({
  card,
  artist,
  language,
}: CardTemplateProps) {
  const fontFamily = FONT_FAMILY[language] || 'DM Sans';
  const brandColor = artist.brand_color || '#1e3a5f';
  const headline = card.headline || '';
  const tag = card.tag || '';
  const hasImage = !!(card.image_url && card.image_url.length > 1);

  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily,
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: hasImage ? '#000000' : brandColor,
      }}
    >
      {/* 배경 이미지 */}
      {hasImage && (
        <img
          src={card.image_url}
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1080,
            height: 1350,
            objectFit: 'cover',
          }}
        />
      )}

      {/* 하단: tag + headline + 그라데이션 딤 */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          flex: 1,
        }}
      >
        {/* 딤 그라데이션 */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 650,
            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 100%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            padding: '0 56px 56px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* tag (채널명) — 제목 바로 위 */}
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              marginBottom: 12,
              letterSpacing: 0.5,
              opacity: 0.9,
            }}
          >
            {tag}
          </div>
          <div
            style={{
              fontSize: 74,
              fontWeight: 800,
              lineHeight: 1.25,
              margin: 0,
              textShadow: '0 2px 16px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {headline.split('\n').map((line, i) => (
              <span key={i}>{line}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
