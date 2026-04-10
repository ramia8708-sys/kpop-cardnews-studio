export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function POST(req: NextRequest) {
  try {
    const { url } = (await req.json()) as { url: string };

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const { data: html } = await axios.get<string>(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(html);

    // 제목 추출: og:title > title 태그
    const title =
      $('meta[property="og:title"]').attr('content')?.trim() ||
      $('title').text().trim() ||
      '';

    // 본문 추출: article 태그 또는 주요 본문 영역
    let body = '';

    // 주요 본문 셀렉터들 (우선순위)
    const selectors = [
      'article',
      '[itemprop="articleBody"]',
      '.article_body',
      '.article-body',
      '.news_body',
      '.newsct_article',
      '#articleBody',
      '#article-body',
      '#newsct_article',
      '.story-body',
      '.post-content',
      '.entry-content',
      '#content',
      '.content',
    ];

    for (const sel of selectors) {
      const $el = $(sel);
      if ($el.length) {
        // 스크립트, 스타일, 광고 제거
        $el.find('script, style, iframe, .ad, .advertisement, nav, footer, aside').remove();
        body = $el.text().replace(/\s+/g, ' ').trim();
        if (body.length > 50) break;
      }
    }

    // 위 셀렉터로 못 찾으면 p 태그들 모아서 추출
    if (body.length < 50) {
      const paragraphs: string[] = [];
      $('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 20) paragraphs.push(text);
      });
      body = paragraphs.join(' ');
    }

    if (!body || body.length < 30) {
      return NextResponse.json({ error: '기사 본문을 추출할 수 없습니다.' }, { status: 400 });
    }

    return NextResponse.json({ title, body });
  } catch (err) {
    console.error('[scrape] Error:', err);
    return NextResponse.json({ error: '기사를 불러올 수 없습니다.' }, { status: 500 });
  }
}
