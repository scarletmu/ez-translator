import LanguageSelect from '@/components/LanguageSelect';

interface DefaultLanguageSectionProps {
  value: string;
  onChange: (lang: string) => void;
}

export default function DefaultLanguageSection({ value, onChange }: DefaultLanguageSectionProps) {
  return (
    <div className="settings-section">
      <h2>默认目标语言</h2>
      <div className="form-group">
        <LanguageSelect value={value} onChange={onChange} />
      </div>
    </div>
  );
}
