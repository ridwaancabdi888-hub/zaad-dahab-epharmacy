const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function isVisible(element) {
  if (element.hidden || element.getAttribute?.('aria-hidden') === 'true') return false;
  return typeof element.getClientRects !== 'function' || element.getClientRects().length > 0;
}

export function getFocusableElements(container) {
  if (!container?.querySelectorAll) return [];
  return [...container.querySelectorAll(FOCUSABLE_SELECTOR)].filter(isVisible);
}

export function getNextFocusable(container, current, backwards = false) {
  const elements = getFocusableElements(container);
  if (elements.length === 0) return container ?? null;

  const currentIndex = elements.indexOf(current);
  if (currentIndex === -1) return backwards ? elements.at(-1) : elements[0];

  const offset = backwards ? -1 : 1;
  return elements[(currentIndex + offset + elements.length) % elements.length];
}

export function restoreFocus(element) {
  if (!element?.isConnected || typeof element.focus !== 'function') return false;
  element.focus();
  return true;
}
