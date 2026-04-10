export const runtime = 'nodejs';
export const maxDuration = 300; // 5분 제한

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { fetchNaverNews } from '@/lib/sources/naver';

export async function GET(req: NextRequest) {
  // Vercel Cron 인증 (프로덕션)
  const authHeader = req.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();

  // 활성 소스 전체 조회
  const { data: sources, error: srcError } = await supabase
    .from('news_sources')
    .select('*, artists(name)')
    .eq('is_active', true);

  if (srcError || !sources) {
    return NextResponse.json(
      { error: 'Failed to fetch sources', detail: srcError?.message },
      { status: 500 }
    );
  }

  let totalCollected = 0;

  for (const source of sources) {
    const artist = source.artists as unknown as { name: string } | null;
    if (!artist) continue;

    try {
      let articles: { title: string; link: string; summary: string; date: string }[] = [];

      if (source.source_type === 'web') {
        // 네이버 뉴스 검색
        articles = await fetchNaverNews(artist.name);
      }
      // TODO: RSS, Twitter, Weverse 소스 지원 추가

      // 수집된 기사를 cardnews draft로 저장 (중복 방지: source_url 기준)
      for (const article of articles) {
        const { data: existing } = await supabase
          .from('cardnews')
          .select('id')
          .eq('source_url', article.link)
          .eq('artist_id', source.artist_id)
          .limit(1);

        if (existing && existing.length > 0) continue;

        await supabase.from('cardnews').insert({
          artist_id: source.artist_id,
          language: 'ko',
          title: article.title,
          summary: article.summary,
          source_url: article.link,
          status: 'draft',
          card: {},
        });

        totalCollected++;
      }

      // last_crawled_at 갱신
      await supabase
        .from('news_sources')
        .update({ last_crawled_at: new Date().toISOString() })
        .eq('id', source.id);
    } catch (err) {
      console.error(`[cron/collect] Error for source ${source.id}:`, err);
    }
  }

  return NextResponse.json({
    collected: totalCollected,
    sourcesProcessed: sources.length,
    timestamp: new Date().toISOString(),
  });
}
