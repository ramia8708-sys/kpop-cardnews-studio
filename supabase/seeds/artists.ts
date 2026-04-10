import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const artists = [
  { name: 'BTS',          name_ko: '방탄소년단',   brand_color: '#9B59B6' },
  { name: 'BLACKPINK',    name_ko: '블랙핑크',     brand_color: '#FF007F' },
  { name: 'aespa',        name_ko: '에스파',        brand_color: '#6C3FC5' },
  { name: 'NewJeans',     name_ko: '뉴진스',        brand_color: '#5B9BD5' },
  { name: 'IVE',          name_ko: '아이브',        brand_color: '#FF6EC7' },
  { name: '(G)I-DLE',     name_ko: '(여자)아이들',  brand_color: '#8B00FF' },
  { name: 'SEVENTEEN',    name_ko: '세븐틴',        brand_color: '#F8B4D9' },
  { name: 'Stray Kids',   name_ko: '스트레이 키즈', brand_color: '#FF3B3B' },
  { name: 'TWICE',        name_ko: '트와이스',      brand_color: '#FF6F61' },
  { name: 'EXO',          name_ko: '엑소',          brand_color: '#C0C0C0' },
  { name: 'Red Velvet',   name_ko: '레드벨벳',      brand_color: '#E60033' },
  { name: 'NCT 127',      name_ko: 'NCT 127',      brand_color: '#00C73C' },
];

async function seed() {
  const { data, error } = await supabase
    .from('artists')
    .upsert(artists, { onConflict: 'name' })
    .select();

  if (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }

  console.log(`Seeded ${data.length} artists`);
}

seed();
