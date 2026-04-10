export interface Artist {
  id: string;
  name: string;
  name_ko: string | null;
  brand_color: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CardData {
  tag: string;
  headline: string;
  image_url: string;
}

export type SupportedLanguage = 'ko' | 'en' | 'ja' | 'es' | 'zh' | 'pt' | 'id';
