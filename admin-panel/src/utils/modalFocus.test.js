import assert from 'node:assert/strict';
import test from 'node:test';

import { getFocusableElements, getNextFocusable, restoreFocus } from './modalFocus.js';

function element({ hidden = false, ariaHidden = null, visible = true, connected = true } = {}) {
  return {
    hidden,
    isConnected: connected,
    focusCount: 0,
    getAttribute: (name) => (name === 'aria-hidden' ? ariaHidden : null),
    getClientRects: () => (visible ? [{}] : []),
    focus() {
      this.focusCount += 1;
    },
  };
}

function container(elements) {
  return {
    querySelectorAll: () => elements,
    focusCount: 0,
    focus() {
      this.focusCount += 1;
    },
  };
}

test('filters hidden controls from the modal focus order', () => {
  const visible = element();
  const controls = container([
    visible,
    element({ hidden: true }),
    element({ ariaHidden: 'true' }),
    element({ visible: false }),
  ]);

  assert.deepEqual(getFocusableElements(controls), [visible]);
});

test('wraps focus in both directions', () => {
  const first = element();
  const second = element();
  const controls = container([first, second]);

  assert.equal(getNextFocusable(controls, second), first);
  assert.equal(getNextFocusable(controls, first, true), second);
  assert.equal(getNextFocusable(controls, element()), first);
});

test('keeps focus on an empty modal and only restores connected elements', () => {
  const emptyModal = container([]);
  assert.equal(getNextFocusable(emptyModal, null), emptyModal);

  const opener = element();
  assert.equal(restoreFocus(opener), true);
  assert.equal(opener.focusCount, 1);
  assert.equal(restoreFocus(element({ connected: false })), false);
  assert.equal(restoreFocus(null), false);
});
