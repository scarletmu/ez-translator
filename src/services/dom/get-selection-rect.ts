const MIN_SELECTION_LENGTH = 1;

export function getSelectionRect(): { rect: DOMRect; text: string } | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const text = selection.toString().trim();
  if (text.length < MIN_SELECTION_LENGTH) return null;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  if (rect.width === 0 && rect.height === 0) return null;

  return { rect, text };
}
