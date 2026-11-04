import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const route = '/our-work/whitechurch-bathroom/';
test('homepage and portfolio index link to a labelled Whitechurch comparison', async () => {
  for (const file of ['index.html', 'our-work.html']) {
    const html = await fs.readFile(`src/pages/${file}`, 'utf8');
    const section = html.match(/<section class="pcd-proof pcd-whitechurch-feature"[\s\S]*?<\/section>/)?.[0];
    assert.ok(section, `${file} needs a Whitechurch feature`);
    assert.ok(section.includes(`href="${route}"`));
    assert.match(section, /whitechurch-bathroom-before.webp/);
    assert.match(section, /whitechurch-bathroom-after-window.webp/);
    assert.match(section, /<figcaption>Before:/);
    assert.match(section, /<figcaption>After:/);
    assert.ok(!section.includes('\u2014'));
  }
});
test('Whitechurch project is registered with factual copy and all supplied media', async () => {
  const pages = JSON.parse(await fs.readFile('src/pages.json', 'utf8'));
  const page = pages.find(p => p.path === route);
  assert.ok(page, 'Whitechurch project route must exist');
  const html = await fs.readFile(`src/pages/${page.file}`, 'utf8');
  const main = html.match(/<main\b[\s\S]*?<\/main>/)?.[0];
  assert.ok(main);
  assert.equal((main.match(/<h1\b/g) || []).length, 1);
  for (const fact of ['Whitechurch', '20 years', 'Festool electric sander', 'caulked', 'three coats of water-based satin']) assert.ok(main.includes(fact), fact);
  assert.ok(!main.includes('\u2014'));
  for (const name of ['before', 'after-mirror', 'after-door', 'after-ceiling', 'after-window']) {
    assert.ok(main.includes(`/images/whitechurch-bathroom-${name}.webp`));
    await fs.access(`public/images/whitechurch-bathroom-${name}.webp`);
  }
  assert.match(main, /<figcaption>Before:/);
  assert.match(main, /<figcaption>After:/);
  assert.match(main, /<video[^>]*controls[^>]*preload="none"/);
  assert.ok(!/<video[^>]*autoplay/.test(main));
  await fs.access('public/videos/whitechurch-bathroom.mp4');
});
