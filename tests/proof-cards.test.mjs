import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('homepage proof has three static cards and one full-card Whitechurch link', async () => {
  const html = await fs.readFile('src/pages/index.html', 'utf8');
  const section = html.match(/<section class="pcd-proof" aria-labelledby="pcd-proof-title">[\s\S]*?<\/section>/)[0];
  const grid = section.match(/<div class="pcd-proof__grid[^\"]*">([\s\S]*?)<\/div>/)[1];
  const cards = [...grid.matchAll(/<figure>[\s\S]*?<\/figure>/g)].map(m => m[0]);
  assert.equal(cards.length, 4);
  for (const card of cards.slice(0, 3)) assert.ok(!card.includes('<a '));
  assert.equal((grid.match(/<a /g) || []).length, 1);
  assert.match(grid, /<a class="pcd-proof__card-link" href="\/our-work\/whitechurch-bathroom\/">\s*<figure>[\s\S]*whitechurch-bathroom-after-window.webp[\s\S]*<figcaption>Whitechurch bathroom repaint<\/figcaption><\/figure>\s*<\/a>/);
  assert.match(section, /href="\/our-work\/">See all our work<\/a>/);
  assert.match(section, /href="\/quote\/">Get a written quote<\/a>/);
  assert.ok(!grid.includes('\u2014'));
});
