export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { fetchNaverNews } from '@/lib/sources/naver';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');

  if (!query) {
    return NextResponse.json(
      { error: 'query parameter "q" is required' },
      { status: 400 }
    );
  }

  const articles = await fetchNaverNews(query);
  return NextResponse.json({ articles });
}
