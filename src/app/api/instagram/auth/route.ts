export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { exchangeToken, saveConnection, getAuthUrl } from '@/lib/instagram';

/** GET /api/instagram/auth?artistId=xxx → OAuth URL 리다이렉트 */
export async function GET(req: NextRequest) {
  const artistId = req.nextUrl.searchParams.get('artistId');
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');

  // ── 1) 최초 요청: OAuth URL로 리다이렉트 ──────────
  if (!code && artistId) {
    const url = getAuthUrl(artistId);
    return NextResponse.redirect(url);
  }

  // ── 2) 콜백: 코드 → 토큰 교환 → 저장 ─────────────
  if (code && state) {
    try {
      const { artistId: aid } = JSON.parse(
        Buffer.from(state, 'base64url').toString()
      );

      const { accessToken, expiresIn, igUserId } = await exchangeToken(code);
      await saveConnection(aid, igUserId, accessToken, expiresIn);

      // 성공 시 설정 페이지로 리다이렉트
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      return NextResponse.redirect(
        `${appUrl}/settings?instagram=connected`
      );
    } catch (err) {
      console.error('[instagram/auth] Error:', err);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      return NextResponse.redirect(
        `${appUrl}/settings?instagram=error`
      );
    }
  }

  return NextResponse.json(
    { error: 'artistId or code is required' },
    { status: 400 }
  );
}
