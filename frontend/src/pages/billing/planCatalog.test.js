import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePlanCatalog, DEFAULT_PLAN_CATALOG } from './planCatalog.js';

test('normalizes a wrapped plans payload into the visible catalog', () => {
  const payload = {
    plans: [
      { id: 'free', slug: 'free', name: 'Basic / Free', base_price_paise: 0, is_popular: false },
      { id: 'custom', slug: 'custom', name: 'Custom / Add-on', base_price_paise: null, is_popular: false },
      { id: 'pro', slug: 'pro', name: 'Pro', base_price_paise: 349900, is_popular: true },
    ],
  };

  const normalized = normalizePlanCatalog(payload, DEFAULT_PLAN_CATALOG);
  assert.equal(normalized.length, 3);
  assert.equal(normalized[0].slug, 'free');
  assert.equal(normalized[1].slug, 'custom');
  assert.equal(normalized[2].slug, 'pro');
  assert.equal(normalized[0].price, 0);
  assert.equal(normalized[1].price, null);
  assert.equal(normalized[2].price, 349900);
});

test('falls back to the default three-plan catalog when the payload is empty', () => {
  const normalized = normalizePlanCatalog({}, DEFAULT_PLAN_CATALOG);
  assert.deepEqual(normalized.map(p => p.slug), ['free', 'custom', 'pro']);
});
