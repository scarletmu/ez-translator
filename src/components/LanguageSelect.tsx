import { SUPPORTED_LANGUAGES } from '@/constants/languages';

interface LanguageSelectProps {
  value: string;
  onChange: (lang: string) => void;
}

export default function LanguageSelect({ value, onChange }: LanguageSelectProps) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {SUPPORTED_LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}
