-- slides → card 단일 카드로 단순화
ALTER TABLE cardnews RENAME COLUMN slides TO card;
ALTER TABLE cardnews ALTER COLUMN card SET DEFAULT '{}';

-- user_preferences 테이블
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  channel_tag TEXT,
  default_language VARCHAR(5) DEFAULT 'ko'
);

-- instagram_connections에 username 컬럼 추가
ALTER TABLE instagram_connections ADD COLUMN IF NOT EXISTS username VARCHAR(100);
