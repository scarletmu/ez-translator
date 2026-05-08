import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SelectionTranslateManager from './SelectionTranslateManager';

function createSelectionMock(text: string) {
  const rect = {
    x: 120,
    y: 80,
    top: 80,
    left: 120,
    right: 240,
    bottom: 112,
    width: 120,
    height: 32,
    toJSON: () => ({}),
  } as DOMRect;

  const range = {
    getBoundingClientRect: () => rect,
  } as Range;

  return {
    rangeCount: 1,
    toString: () => text,
    getRangeAt: () => range,
  } as unknown as Selection;
}

describe('SelectionTranslateManager', () => {
  it('shows the trigger button after selection changes', async () => {
    vi.spyOn(window, 'getSelection').mockReturnValue(createSelectionMock('hello world'));

    render(<SelectionTranslateManager />);

    fireEvent(document, new Event('selectionchange'));

    expect(await screen.findByRole('button', { name: '翻译' })).toBeInTheDocument();
  });
});
