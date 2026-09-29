import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInsights, categoryTotals, sum } from '../src/utils/analytics.js';

test('sum and category totals handle empty data', () => {
  assert.equal(sum([]), 0);
  assert.deepEqual(categoryTotals([]), []);
});

test('category totals aggregate amounts by category', () => {
  const totals = categoryTotals([
    { amount: '20.50', categories: { name: 'Food' } },
    { amount: '10', categories: { name: 'Food' } },
    { amount: 5, categories: { name: 'Travel' } },
  ]);
  assert.deepEqual(totals, [{ name: 'Food', value: 30.5 }, { name: 'Travel', value: 5 }]);
});

test('insights reflect user spending and avoid division by zero', () => {
  const insights = buildInsights([{ amount: 20, category_id: 'food', categories: { name: 'Food' } }], [], []);
  assert.match(insights[0].message, /Food/);
  assert.equal(insights.length, 1);
});