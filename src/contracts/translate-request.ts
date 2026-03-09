export type TranslateSource = 'selection' | 'paste';

export interface PageContext {
  title: string;
  url: string;
}

export interface TranslateTextRequest {
  text: string;
  source: TranslateSource;
  targetLang: string;
  style: 'bilingual';
  pageContext?: PageContext;
}

export interface ScreenshotRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
}

export interface TranslateImageRequest {
  imageBase64: string;
  mimeType: string;
  source: 'screenshot';
  targetLang: string;
  style: 'bilingual';
  pageContext?: PageContext;
  region: ScreenshotRegion;
}
