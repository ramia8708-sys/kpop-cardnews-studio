import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/** Supabase 환경변수 설정 여부 확인 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

/** 브라우저/클라이언트 컴포넌트용 */
export function createBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다. .env.local을 확인하세요.');
  }
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}

/** 서버 컴포넌트 / API Route용 (service role) */
export function createServerClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다. .env.local을 확인하세요.');
  }
  return createSupabaseClient(supabaseUrl, supabaseServiceKey);
}
