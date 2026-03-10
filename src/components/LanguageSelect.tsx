import { SUPPORTED_LANGUAGES } from '@/constants/languages';

interface LanguageSelectProps {
  value: string;
  onChange: (lang: string) => void;
  className?: string;
  ariaLabel?: string;
}

export default function LanguageSelect({ value, onChange, className, ariaLabel }: LanguageSelectProps) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className} aria-label={ariaLabel}>
      {SUPPORTED_LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}
