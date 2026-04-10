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

    // 네이버 뉴스 검색 결과 파싱 (2026 fender-ui 구조)
    // 제목 링크: a[class*='OhDwx'] — 같은 href를 가진 다음 링크가 요약
    const seen = new Set<string>();
    const allLinks = $('.list_news a');

    allLinks.each((_, el) => {
      const $a = $(el);
      const cls = $a.attr('class') || '';
      const href = $a.attr('href') || '';
      const text = $a.text().trim();

      // 제목 링크 식별 (fender-ui 제목 클래스)
      if (cls.includes('OhDwx') && href.startsWith('http') && text.length > 5) {
        if (seen.has(href)) return;
        seen.add(href);
        items.push({ title: text, link: href, summary: '', date: '' });
        return;
      }

      // 이미 등록된 링크와 같은 href면 → 요약 텍스트
      if (href.startsWith('http') && seen.has(href)) {
        const existing = items.find((item) => item.link === href);
        if (existing && !existing.summary && text.length > 20) {
          existing.summary = text;
        }
        return;
      }
    });

    // 날짜 추출: 각 뉴스 블록의 상위 컨테이너에서 시간 정보 추출
    const containers = $('[class*="ELMWWj"]');
    containers.each((_, el) => {
      const $el = $(el);
      const titleLink = $el.find('a[class*="OhDwx"]');
      if (!titleLink.length) return;
      const href = titleLink.attr('href') || '';
      const item = items.find((it) => it.link === href);
      if (!item) return;
      // 시간 텍스트 (예: "3분 전", "1시간 전")
      const infoText = $el.find('[class*="fender-ui"]').filter((_, e) => {
        const t = $(e).text().trim();
        return t.includes('전') || t.includes('일 전') || /\d{4}\.\d{2}\.\d{2}/.test(t);
      }).first().text().trim();
      if (infoText) item.date = infoText;
    });

    // 본문(summary)이 없는 기사 제외
    // 검색어(아티스트명)와 관련 없는 기사 제외
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
