import axios from 'axios';
import * as cheerio from 'cheerio';

export interface NewsItem {
  title: string;
  link: string;
  summary: string;
  date: string;
}

/**
 * 네이버 뉴스 검색 결과를 크롤링합니다.
 * Cheerio + fetch 사용 (Playwright 사용 금지 — Vercel 서버리스 비호환)
 * 에러 시 빈 배열 반환
 */
export async function fetchNaverNews(query: string): Promise<NewsItem[]> {
  try {
    const url = `https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(query)}&sort=1`;

    const { data: html } = await axios.get<string>(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(html);
    const items: NewsItem[] = [];

    // 네이버 뉴스 검색 결과 파싱 (2024~2026 신규 구조)
    // 각 뉴스 블록(.bx)에서 제목, 요약, 날짜를 추출
    const newsBlocks = $('.list_news .bx');

    newsBlocks.each((_, block) => {
      const $block = $(block);

      // 제목 + 링크 추출
      const $titleLink = $block.find('.news_tit');
      const title = $titleLink.attr('title')?.trim() || $titleLink.text().trim();
      const link = $titleLink.attr('href') ?? '';

      // 요약 추출
      const summary = $block.find('.news_dsc .dsc_wrap').text().trim();

      // 날짜 추출
      const date = $block.find('.info_group .info').first().text().trim();

      // 유효하지 않은 항목 제외
      if (!title || !link || link.includes('naver.com')) return;

      items.push({ title, link, summary, date });
    });

    // 본문(summary)이 없는 기사 제외
    // 검색어(아티스트명)와 관련 없는 기사 제외 (제목이나 요약에 검색어 포함 여부)
    const queryLower = query.toLowerCase().replace(/\s+/g, '');
    const filtered = items.filter((item) => {
      if (!item.summary || item.summary.length < 10) return false;
      const titleLower = item.title.toLowerCase().replace(/\s+/g, '');
      const summaryLower = item.summary.toLowerCase().replace(/\s+/g, '');
      return titleLower.includes(queryLower) || summaryLower.includes(queryLower);
    });

    // 최대 10개
    return filtered.slice(0, 10);
  } catch (err) {
    console.error(`[naver] Failed to fetch news for query: "${query}"`, err);
    return [];
  }
}
