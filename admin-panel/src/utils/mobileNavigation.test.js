import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const appShellPath = fileURLToPath(new URL('../components/layout/AppShell.jsx', import.meta.url));
const stylesheetPath = fileURLToPath(new URL('../index.css', import.meta.url));
const appShell = readFileSync(appShellPath, 'utf8');
const stylesheet = readFileSync(stylesheetPath, 'utf8');

test('mobile navigation exposes its state and closes through all expected controls', () => {
  assert.match(appShell, /aria-controls="admin-navigation"/);
  assert.match(appShell, /aria-expanded=\{navOpen\}/);
  assert.match(appShell, /aria-hidden=\{isMobile && !navOpen\}/);
  assert.match(appShell, /inert=\{isMobile && !navOpen \? true : undefined\}/);
  assert.match(appShell, /event\.key === 'Escape'/);
  assert.match(appShell, /onClick=\{closeNavigation\}/);
  assert.match(appShell, /aria-label="Close navigation"/);
});

test('mobile navigation contains focus and restores the page after closing', () => {
  assert.match(appShell, /getNextFocusable\(sidebar, document\.activeElement, event\.shiftKey\)/);
  assert.match(appShell, /document\.body\.style\.overflow = 'hidden'/);
  assert.match(appShell, /restoreFocus\(menuButton\)/);
});

test('responsive styles turn the sidebar into a drawer without affecting desktop navigation', () => {
  assert.match(stylesheet, /@media \(max-width: 800px\)/);
  assert.match(stylesheet, /\.sidebar\.mobile-open\s*\{[^}]*translateX\(0\)/s);
  assert.match(stylesheet, /\.sidebar-backdrop\s*\{[^}]*position: fixed/s);
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\)/);
});
