-- ============================================
-- KPop CardNews Studio - Initial Schema
-- ============================================

-- UUID 확장
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 아티스트 테이블
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  name_ko VARCHAR(100),
  brand_color VARCHAR(7) NOT NULL DEFAULT '#000000',
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 뉴스 소스 테이블
CREATE TABLE news_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL,       -- 'rss', 'web', 'twitter', 'weverse'
  source_url TEXT NOT NULL,
  source_name VARCHAR(200),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_crawled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 카드뉴스 테이블
CREATE TABLE cardnews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES cardnews(id) ON DELETE SET NULL,   -- 번역본의 원본 참조
  language VARCHAR(5) NOT NULL DEFAULT 'ko',                   -- ko, en, ja, es, zh, pt, id
  title VARCHAR(500) NOT NULL,
  summary TEXT,
  source_url TEXT,
  slides JSONB NOT NULL DEFAULT '[]',         -- 슬라이드 배열 [{heading, body, imageUrl}]
  thumbnail_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, published, archived
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인스타그램 연결 테이블
CREATE TABLE instagram_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  instagram_account VARCHAR(200) NOT NULL,
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_news_sources_artist ON news_sources(artist_id);
CREATE INDEX idx_cardnews_artist ON cardnews(artist_id);
CREATE INDEX idx_cardnews_parent ON cardnews(parent_id);
CREATE INDEX idx_cardnews_language ON cardnews(language);
CREATE INDEX idx_cardnews_status ON cardnews(status);
CREATE INDEX idx_instagram_artist ON instagram_connections(artist_id);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_artists_updated_at
  BEFORE UPDATE ON artists FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_news_sources_updated_at
  BEFORE UPDATE ON news_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_cardnews_updated_at
  BEFORE UPDATE ON cardnews FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_instagram_updated_at
  BEFORE UPDATE ON instagram_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
