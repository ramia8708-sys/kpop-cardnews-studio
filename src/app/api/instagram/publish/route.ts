export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getConnection, publishSingleImage } from '@/lib/instagram';

interface PublishRequest {
  artistId: string;
  imageUrl: string;   // 공개 접근 가능한 단일 이미지 URL
  caption: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PublishRequest;
    const { artistId, imageUrl, caption } = body;

    if (!artistId || !imageUrl || !caption) {
      return NextResponse.json(
        { error: 'artistId, imageUrl, and caption are required' },
        { status: 400 }
      );
    }

    const connection = await getConnection(artistId);
    if (!connection) {
      return NextResponse.json(
        { error: 'Instagram account not connected for this artist' },
        { status: 404 }
      );
    }

    if (new Date(connection.token_expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Instagram token expired. Please reconnect.' },
        { status: 401 }
      );
    }

    const postId = await publishSingleImage(
      connection.instagram_account,
      connection.access_token,
      imageUrl,
      caption
    );

    return NextResponse.json({ postId });
  } catch (err) {
    console.error('[instagram/publish] Error:', err);
    return NextResponse.json(
      { error: 'Publish failed', detail: String(err) },
      { status: 500 }
    );
  }
}
