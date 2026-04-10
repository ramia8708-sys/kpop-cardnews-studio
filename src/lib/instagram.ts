import { createServerClient } from '@/lib/supabase';
import crypto from 'crypto';

// ─── 암호화 유틸 ─────────────────────────────────────
const ALGORITHM = 'aes-256-gcm';
const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY!.slice(0, 32); // 32-byte key

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decrypt(data: string): string {
  const [ivHex, authTagHex, encrypted] = data.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ─── Instagram Graph API ─────────────────────────────
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID!;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/instagram/auth`;

/** OAuth 인증 URL 생성 */
export function getAuthUrl(artistId: string): string {
  const state = Buffer.from(JSON.stringify({ artistId })).toString('base64url');
  return (
    `https://www.facebook.com/v21.0/dialog/oauth` +
    `?client_id=${INSTAGRAM_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement` +
    `&response_type=code` +
    `&state=${state}`
  );
}

/** 인가 코드 → 액세스 토큰 교환 */
export async function exchangeToken(code: string): Promise<{
  accessToken: string;
  expiresIn: number;
  igUserId: string;
}> {
  // 1. 단기 토큰 발급
  const tokenRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token` +
      `?client_id=${INSTAGRAM_APP_ID}` +
      `&client_secret=${INSTAGRAM_APP_SECRET}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&code=${code}`,
    { method: 'GET' }
  );
  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);
  }

  // 2. 장기 토큰으로 교환
  const longRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${INSTAGRAM_APP_ID}` +
      `&client_secret=${INSTAGRAM_APP_SECRET}` +
      `&fb_exchange_token=${tokenData.access_token}`
  );
  const longData = await longRes.json();

  // 3. Instagram 비즈니스 계정 ID 조회
  const pagesRes = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?access_token=${longData.access_token}`
  );
  const pagesData = await pagesRes.json();
  const page = pagesData.data?.[0];

  if (!page) throw new Error('No Facebook Page found');

  const igRes = await fetch(
    `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${longData.access_token}`
  );
  const igData = await igRes.json();
  const igUserId = igData.instagram_business_account?.id;

  if (!igUserId) throw new Error('No Instagram Business account linked');

  return {
    accessToken: longData.access_token,
    expiresIn: longData.expires_in ?? 5184000, // 기본 60일
    igUserId,
  };
}

/** 토큰을 Supabase에 암호화 저장 */
export async function saveConnection(
  artistId: string,
  igAccount: string,
  accessToken: string,
  expiresIn: number
) {
  const supabase = createServerClient();
  const encryptedToken = encrypt(accessToken);
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  const { error } = await supabase.from('instagram_connections').upsert(
    {
      artist_id: artistId,
      instagram_account: igAccount,
      access_token: encryptedToken,
      token_expires_at: expiresAt,
      is_active: true,
    },
    { onConflict: 'artist_id' }
  );

  if (error) throw error;
}

/** 저장된 토큰 복호화 조회 */
export async function getConnection(artistId: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('instagram_connections')
    .select('*')
    .eq('artist_id', artistId)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  return {
    ...data,
    access_token: decrypt(data.access_token),
  };
}

/** Instagram 단일 이미지 게시 */
export async function publishSingleImage(
  igUserId: string,
  accessToken: string,
  imageUrl: string,
  caption: string
): Promise<string> {
  // 1. 미디어 컨테이너 생성
  const createRes = await fetch(
    `https://graph.facebook.com/v21.0/${igUserId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: accessToken,
      }),
    }
  );
  const createData = await createRes.json();
  if (!createData.id) {
    throw new Error(`Media create failed: ${JSON.stringify(createData)}`);
  }

  // 2. 게시
  const publishRes = await fetch(
    `https://graph.facebook.com/v21.0/${igUserId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: createData.id,
        access_token: accessToken,
      }),
    }
  );
  const publishData = await publishRes.json();
  if (!publishData.id) {
    throw new Error(`Publish failed: ${JSON.stringify(publishData)}`);
  }

  return publishData.id;
}
