export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { generateMultiLanguageCards } from '@/lib/ai/generateCard';

interface GenerateRequest {
  newsText: string;
  languages: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateRequest;
    const { newsText, languages } = body;

    if (!newsText || !languages?.length) {
      return NextResponse.json(
        { error: 'newsText and languages are required' },
        { status: 400 }
      );
    }

    const results = await generateMultiLanguageCards(newsText, languages);
    return NextResponse.json({ results });
  } catch (err) {
    console.error('[generate] Error:', err);
    return NextResponse.json(
      { error: 'Generation failed', detail: String(err) },
      { status: 500 }
    );
  }
}
