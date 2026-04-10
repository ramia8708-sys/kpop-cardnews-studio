export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

interface DownloadRequest {
  image: string;       // base64 PNG
  artistName?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DownloadRequest;
    const { image, artistName = 'cardnews' } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'image is required' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(image, 'base64');
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${artistName}_${date}.png"`,
      },
    });
  } catch (err) {
    console.error('[download] Error:', err);
    return NextResponse.json(
      { error: 'Download failed', detail: String(err) },
      { status: 500 }
    );
  }
}
