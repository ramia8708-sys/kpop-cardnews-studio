'use client';

import type { SupportedLanguage } from '@/types';

interface LanguagePickerProps {
  selected: string[];
  onChange: (langs: string[]) => void;
  mode: 'single' | 'multi';
}

const LANGUAGES: { code: SupportedLanguage; flag: string; label: string }[] = [
  { code: 'ko', flag: '🇰🇷', label: '한국어' },
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'ja', flag: '🇯🇵', label: '日本語' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'zh', flag: '🇨🇳', label: '中文' },
  { code: 'pt', flag: '🇧🇷', label: 'Português' },
  { code: 'id', flag: '🇮🇩', label: 'Indonesia' },
];

export default function LanguagePicker({
  selected,
  onChange,
  mode,
}: LanguagePickerProps) {
  const handleClick = (code: string) => {
    if (mode === 'single') {
      onChange([code]);
      return;
    }

    if (selected.includes(code)) {
      onChange(selected.filter((s) => s !== code));
    } else {
      onChange([...selected, code]);
    }
  };

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
      {LANGUAGES.map(({ code, flag, label }) => {
        const active = selected.includes(code);
        return (
          <button
            key={code}
            onClick={() => handleClick(code)}
            className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-center transition-all ${
              active
                ? 'border-[var(--accent)] bg-[var(--accent-light)]/30 shadow-sm'
                : 'border-[var(--border)] bg-white hover:border-[var(--accent)]/50'
            }`}
          >
            <span className="text-xl">{flag}</span>
            <span className="text-[11px] font-medium">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
