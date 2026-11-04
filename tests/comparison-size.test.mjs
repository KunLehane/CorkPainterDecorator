import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
test('portfolio before and confirmed after share equal comparison frames', async () => {
 const html = await fs.readFile('src/pages/whitechurch-bathroom.html', 'utf8');
 const pair = html.match(/<div class="pcd-whitechurch-pair">[\s\S]*?<\/div>/)?.[0];
 assert.ok(pair);
 assert.equal((pair.match(/<figure/g)||[]).length, 2);
 assert.match(pair, /whitechurch-bathroom-before.webp/);
 assert.match(pair, /whitechurch-bathroom-after-mirror.webp/);
 const css = await fs.readFile('public/painter-clone.css', 'utf8');
 assert.match(css, /\.pcd-whitechurch-pair img\{width:100%;height:auto;aspect-ratio:16\/9;object-fit:cover\}/);
 assert.match(css, /\.pcd-project__gallery\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\);gap:24px\}/);
});
