export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import satori from 'satori';
import sharp from 'sharp';
import type { Artist, CardData } from '@/types';
import { createElement } from 'react';
import CardTemplate from '@/components/CardTemplate';

// ─── Google Fonts 바이너리 로드 (satori는 폰트 ArrayBuffer 필요) ──
interface FontData {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: 'normal';
}

const GOOGLE_FONT_CSS =
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&family=Noto+Sans+JP:wght@400;700&family=Noto+Sans+SC:wght@400;700&family=DM+Sans:wght@400;700&display=swap';

let fontCache: FontData[] | null = null;

async function loadFonts(): Promise<FontData[]> {
  if (fontCache) return fontCache;

  const cssRes = await fetch(GOOGLE_FONT_CSS, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  const css = await cssRes.text();

  const fontEntries: FontData[] = [];
  const faceRegex =
    /font-family:\s*'([^']+)';\s*font-style:\s*(\w+);\s*font-weight:\s*(\d+);[\s\S]*?src:\s*url\(([^)]+)\)/g;

  let match: RegExpExecArray | null;
  const seen = new Set<string>();

  while ((match = faceRegex.exec(css)) !== null) {
    const name = match[1];
    const weight = parseInt(match[3], 10) as 400 | 700;
    const url = match[4];
    const key = `${name}-${weight}`;

    if (seen.has(key)) continue;
    seen.add(key);

    try {
      const fontRes = await fetch(url);
      const data = await fontRes.arrayBuffer();
      fontEntries.push({ name, data, weight, style: 'normal' });
    } catch {
      // 개별 폰트 로드 실패 시 스킵
    }
  }

  fontCache = fontEntries;
  return fontEntries;
}

// ─── POST 핸들러 ─────────────────────────────────────
interface RenderRequest {
  card: CardData;
  artist: Artist;
  language: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RenderRequest;
    const { card, artist, language } = body;

    if (!card || !artist) {
      return NextResponse.json(
        { error: 'card and artist are required' },
        { status: 400 }
      );
    }

    const lang = language || 'ko';

    // 로컬 업로드 이미지를 절대 URL로 변환 (satori가 fetch할 수 있도록)
    if (card.image_url && card.image_url.startsWith('/')) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      card.image_url = `${appUrl}${card.image_url}`;
    }

    const fonts = await loadFonts();

    const element = createElement(CardTemplate, { card, artist, language: lang });

    const svg = await satori(element, {
      width: 1080,
      height: 1350,
      fonts: fonts.map((f) => ({
        name: f.name,
        data: f.data,
        weight: f.weight,
        style: 'normal' as const,
      })),
    });

    const png = await sharp(Buffer.from(svg)).png({ quality: 90 }).toBuffer();
    const image = png.toString('base64');

    return NextResponse.json({ image });
  } catch (err) {
    console.error('[render] Error:', err);
    return NextResponse.json(
      { error: 'Render failed', detail: String(err) },
      { status: 500 }
    );
  }
}
