export interface TranslateResult {
  originalText: string;
  translatedText: string;
  detectedSourceLang?: string;
  targetLang: string;
  model: string;
  provider: string;
  requestId: string;
}
