const OFFSET = 8;

interface Position {
  top: number;
  left: number;
}

export function positionNearRect(
  rect: DOMRect,
  elementSize: { width: number; height: number },
): Position {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let top = rect.bottom + OFFSET + window.scrollY;
  let left = rect.right - elementSize.width + window.scrollX;

  // If overflowing right, move to left edge
  if (left + elementSize.width > viewportWidth + window.scrollX) {
    left = rect.left + window.scrollX;
  }

  // If overflowing left
  if (left < window.scrollX) {
    left = window.scrollX + OFFSET;
  }

  // If overflowing bottom, show above selection
  if (top + elementSize.height > viewportHeight + window.scrollY) {
    top = rect.top - elementSize.height - OFFSET + window.scrollY;
  }

  return { top, left };
}
