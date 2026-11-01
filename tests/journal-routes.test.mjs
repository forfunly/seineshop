import test from 'node:test';
import assert from 'node:assert/strict';
import {blogArticles, blogTags, journalPaths} from '../app/lib/journal.js';
import {isJournalPath} from '../app/lib/seo.js';

test('every tag has matching articles and never collides with article URLs', () => {
  for (const tag of blogTags('journal')) {
    const articles = blogArticles('journal');
    assert.ok(articles.some((a) => a.tags.some((t) => t.handle === tag.handle)));
    assert.ok(!articles.some((a) => a.handle === tag.handle));
  }
  const paths = journalPaths();
  assert.equal(new Set(paths).size, paths.length);
  assert.ok(paths.includes('/blogs/tag/iphone-18'));
  assert.ok(paths.includes('/blog/iphone-18-pro-max-case-review'));
  assert.ok(paths.every(isJournalPath));
  assert.equal(isJournalPath('/blogs/journal/nonexistent'), false);
  assert.deepEqual(blogTags('unknown'), []);
  assert.equal(isJournalPath('/blogs/journal/iphone-18'), false);
  assert.equal(isJournalPath('/blogs/tag/nonexistent'), false);
});
