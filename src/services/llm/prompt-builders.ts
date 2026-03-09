import type { TranslateTextRequest } from '@/contracts';
import type { ChatMessage } from './fetch-chat-completion';

export function buildTextTranslatePrompt(request: TranslateTextRequest): ChatMessage[] {
  const systemPrompt = `You are a professional translator. Translate the following text to ${request.targetLang}. Return ONLY a JSON object with two fields: "originalText" (the input text) and "translatedText" (your translation). Do not include any other text or explanation.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: request.text },
  ];
}

export function buildScreenshotDirectPrompt(targetLang: string): ChatMessage[] {
  const systemPrompt = `You are a professional translator with vision capabilities. Look at the image and:
1. Extract all visible text from the image.
2. Translate the extracted text to ${targetLang}.
Return ONLY a JSON object with two fields: "originalText" (the text you extracted from the image) and "translatedText" (your translation). Do not include any other text or explanation.`;

  return [{ role: 'system', content: systemPrompt }];
}

export function buildScreenshotExtractPrompt(): ChatMessage[] {
  const systemPrompt = `You are an OCR assistant with vision capabilities. Look at the image and extract ALL visible text exactly as it appears. Return ONLY the extracted text, nothing else. Preserve the original text layout as much as possible.`;

  return [{ role: 'system', content: systemPrompt }];
}

export function buildScreenshotTranslatePrompt(
  extractedText: string,
  targetLang: string,
): ChatMessage[] {
  const systemPrompt = `You are a professional translator. Translate the following text to ${targetLang}. Return ONLY a JSON object with two fields: "originalText" (the input text) and "translatedText" (your translation). Do not include any other text or explanation.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: extractedText },
  ];
}

export function buildImageUserMessage(imageBase64: string, mimeType: string): ChatMessage {
  return {
    role: 'user',
    content: [
      {
        type: 'image_url',
        image_url: {
          url: `data:${mimeType};base64,${imageBase64}`,
          detail: 'high',
        },
      },
      {
        type: 'text',
        text: 'Please process this image according to the instructions.',
      },
    ],
  };
}
