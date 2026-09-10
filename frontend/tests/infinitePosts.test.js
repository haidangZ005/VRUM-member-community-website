import test from 'node:test';
import assert from 'node:assert/strict';
import { getNextPostsPage } from '../src/utils/postPagination.js';

test('loads the next post page until the feed is complete', () => {
  assert.equal(getNextPostsPage({ meta: { page: 1, totalPages: 3 } }), 2);
  assert.equal(getNextPostsPage({ meta: { page: 3, totalPages: 3 } }), undefined);
});
