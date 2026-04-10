# KPop CardNews Studio

## 프로젝트 개요
- K-pop 아이돌 카드뉴스를 자동/수동으로 생성하는 Next.js 웹앱
- 스택: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase + Vercel

## 핵심 원칙
- 모든 컴포넌트는 TypeScript strict mode
- API Route는 항상 export const runtime = 'nodejs' 명시
- Playwright 절대 사용 금지 (Vercel 서버리스 비호환) → Cheerio + fetch 사용
- 환경변수는 .env.local에만, 코드에 하드코딩 금지

## 지원 언어 (카드 콘텐츠)
ko, en, ja, es, zh, pt, id

## 주요 디렉토리
- /lib/sources/ : 뉴스 소스 플러그인
- /lib/ai/ : Claude API 호출 로직
- /components/ : UI 컴포넌트
- /app/api/ : API Routes

## Supabase 테이블
artists, news_sources, cardnews, instagram_connections
