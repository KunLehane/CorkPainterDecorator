import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const originals = ['work-exterior-after', 'work-exterior-before', 'work-lilac-bedroom', 'work-navy-feature-wall', 'work-sage-room-white-door', 'work-bedroom-after', 'work-bedroom-before'];
for (const file of ['index.html', 'our-work.html']) {
  test(`${file}: named gallery preserves photos and adds three Interior Whitechurch after photos`, async () => {
    const html = await fs.readFile(`src/pages/${file}`, 'utf8');
    const gallery = html.match(/<section class="crr-gal"[\s\S]*?<\/section>/)?.[0];
    assert.match(gallery, /Painting Jobs Across Cork/);
    const items = [...gallery.matchAll(/<button class="crr-gal__item"[\s\S]*?<\/button>/g)].map(m => m[0]);
    const added = items.filter(item => item.includes('whitechurch-bathroom'));
    assert.equal(added.length, 3);
    assert.equal(items.length, file === 'index.html' ? 10 : 13);
    const retained = file === 'index.html' ? originals : [...originals, 'work-van', 'work-exterior-gable-prep', 'work-exterior-gable-after'];
    for (const name of retained) assert.equal(items.filter(item => item.includes(`/images/${name}.webp`)).length, 1);
    for (const name of ['window', 'door', 'mirror']) {
      const src = `/images/whitechurch-bathroom-after-${name}.webp`;
      const item = added.find(item => item.includes(src));
      assert.ok(item, src);
      assert.match(item, /data-cat="interior" type="button"/);
      assert.match(item, /alt="Whitechurch bathroom after painting:[^"]+"/);
      assert.match(item, /loading="lazy" decoding="async"/);
      assert.match(item, /class="crr-gal__cap">Whitechurch bathroom:/);
      assert.ok(!item.includes('\u2014'));
      await fs.access(`public${src}`);
    }
  });
}
