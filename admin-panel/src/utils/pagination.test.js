import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { clampPage, normalizeTotalPages } from './pagination.js';

test('normalizes missing and empty pagination metadata to one page', () => {
  assert.equal(normalizeTotalPages(undefined), 1);
  assert.equal(normalizeTotalPages(0), 1);
  assert.equal(normalizeTotalPages(-4), 1);
});

test('clamps a requested page to the available range', () => {
  assert.equal(clampPage(0, 5), 1);
  assert.equal(clampPage(3, 5), 3);
  assert.equal(clampPage(8, 5), 5);
  assert.equal(clampPage('4', '6'), 4);
});

test('recovers to page one when an empty result set removes the final page', () => {
  assert.equal(clampPage(2, 0), 1);
});

test('pagination controls expose navigation and page-change announcements', () => {
  const componentPath = fileURLToPath(new URL('../components/ui/Pagination.jsx', import.meta.url));
  const source = readFileSync(componentPath, 'utf8');

  assert.match(source, /<nav className="pagination" aria-label="Pagination">/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /aria-atomic="true"/);
  assert.match(source, /aria-label="Go to previous page"/);
  assert.match(source, /aria-label="Go to next page"/);
});
