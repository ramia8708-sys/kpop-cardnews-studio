import Anthropic from '@anthropic-ai/sdk';

// ─── 타입 ────────────────────────────────────────────
export interface CardContent {
  language: string;
  headline: string;
  caption: string;
  hashtags: string[];
}

// ─── 언어별 설정 ─────────────────────────────────────
interface LanguageConfig {
  systemInstruction: string;
  hashtagStyle: string;
}

const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  ko: {
    systemInstruction:
      '한국어로 작성하세요. 친근하고 팬 커뮤니티 톤을 사용하세요',
    hashtagStyle: '한국어 해시태그 (#방탄소년단 스타일)',
  },
  en: {
    systemInstruction:
      'Write in English. Use a casual, fan-friendly tone',
    hashtagStyle: 'English hashtags (#BTS style)',
  },
  ja: {
    systemInstruction:
      '日本語で作成してください。ファンに親しみやすいトーンを使ってください',
    hashtagStyle: '日本語ハッシュタグ (#防弾少年団 スタイル)',
  },
  es: {
    systemInstruction:
      'Escribe en español. Usa un tono cercano y amigable para fans',
    hashtagStyle: 'Hashtags en español (#BTS estilo)',
  },
  zh: {
    systemInstruction:
      '用中文撰写。使用亲切友好的粉丝社区语气',
    hashtagStyle: '中文标签 (#防弹少年团 风格)',
  },
  pt: {
    systemInstruction:
      'Escreva em português. Use um tom casual e amigável para fãs',
    hashtagStyle: 'Hashtags em português (#BTS estilo)',
  },
  id: {
    systemInstruction:
      'Tulis dalam bahasa Indonesia. Gunakan nada yang ramah dan kasual untuk penggemar',
    hashtagStyle: 'Hashtag bahasa Indonesia (#BTS gaya)',
  },
};

// ─── Claude 클라이언트 ───────────────────────────────
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ─── 단일 언어 생성 ──────────────────────────────────
export async function generateCardContent(
  newsText: string,
  language: string
): Promise<CardContent> {
  const langConfig = LANGUAGE_CONFIGS[language] ?? LANGUAGE_CONFIGS.en;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: `You are a K-pop card news editor. ${langConfig.systemInstruction}. Respond ONLY with valid JSON.`,
    messages: [
      {
        role: 'user',
        content: `Based on the following news article, create a single card news image.

Return JSON in this exact format:
{
  "language": "${language}",
  "headline": "short impactful headline (max 2 lines)",
  "caption": "Instagram caption text (2-3 lines)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}

Rules:
- Headline: max 50 characters, bold and attention-grabbing
- Hashtags: use ${langConfig.hashtagStyle}, provide 5-8 tags
- Caption: 2-3 lines suitable for Instagram

News article:
${newsText}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude API returned no text content');
  }

  const raw = textBlock.text.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse JSON from Claude response');
  }

  return JSON.parse(jsonMatch[0]) as CardContent;
}

// ─── 다국어 병렬 생성 ────────────────────────────────
export async function generateMultiLanguageCards(
  newsText: string,
  languages: string[]
): Promise<Record<string, CardContent>> {
  const entries = await Promise.all(
    languages.map(async (lang) => {
      const content = await generateCardContent(newsText, lang);
      return [lang, content] as const;
    })
  );

  return Object.fromEntries(entries);
}
