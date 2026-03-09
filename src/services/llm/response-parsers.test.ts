import { describe, expect, it } from 'vitest';
import { ErrorCode } from '@/errors';
import {
  parseScreenshotDirectResponse,
  parseScreenshotExtractResponse,
  parseTextTranslateResponse,
} from '@/services/llm/response-parsers';
import { createProviderProfile } from '@/test/factories';

const profile = createProviderProfile();

function createRawContent(content: string) {
  return {
    choices: [{ message: { content } }],
  };
}

describe('response parsers', () => {
  it('parses raw json content', () => {
    const result = parseTextTranslateResponse(
      createRawContent('{"originalText":"Hello","translatedText":"你好"}'),
      profile,
      'zh-CN',
    );

    expect(result.originalText).toBe('Hello');
    expect(result.translatedText).toBe('你好');
  });

  it('parses markdown code block json', () => {
    const result = parseScreenshotDirectResponse(
      createRawContent('```json\n{"originalText":"Hello","translatedText":"你好"}\n```'),
      profile,
      'zh-CN',
    );

    expect(result.translatedText).toBe('你好');
  });

  it('throws when content is empty', () => {
    expect(() => parseScreenshotExtractResponse({ choices: [{ message: { content: '' } }] })).toThrowError(
      expect.objectContaining({ code: ErrorCode.UPSTREAM_BAD_RESPONSE }),
    );
  });

  it('throws when json payload is invalid', () => {
    expect(() => parseTextTranslateResponse(createRawContent('not-json'), profile, 'zh-CN')).toThrowError(
      expect.objectContaining({ code: ErrorCode.UPSTREAM_BAD_RESPONSE }),
    );
  });
});
