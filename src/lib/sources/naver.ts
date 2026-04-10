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
    // .list_news 안의 각 뉴스 아이템은 외부 링크(원문)를 가진 a 태그 쌍으로 구성됨
    // 제목 a와 요약 a가 같은 href를 공유하며, 네이버/Keep 링크는 제외
    const seen = new Set<string>();
    const allLinks = $('.list_news a');

    allLinks.each((_, el) => {
      const $a = $(el);
      const href = $a.attr('href') ?? '';
      const text = $a.text().trim();

      // 네이버 내부 링크, Keep, 빈 텍스트 제외
      if (
        !href ||
        !text ||
        href.startsWith('#') ||
        href.startsWith('javascript:') ||
        href.includes('naver.com') ||
        href.includes('keep.naver') ||
        text.length < 5
      ) {
        return;
      }

      // 이미 본 링크면 요약으로 처리
      if (seen.has(href)) {
        const existing = items.find((item) => item.link === href);
        if (existing && !existing.summary && text.length > existing.title.length) {
          existing.summary = text;
        }
        return;
      }

      seen.add(href);
      items.push({
        title: text,
        link: href,
        summary: '',
        date: '',
      });
    });

    // 최대 10개
    return items.slice(0, 10);
  } catch (err) {
    console.error(`[naver] Failed to fetch news for query: "${query}"`, err);
    return [];
  }
}
