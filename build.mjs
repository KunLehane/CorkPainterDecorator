// Zero-dependency static build. Wraps each page body in the shared layout,
// adds JSON-LD, writes dist/, sitemap.xml and robots.txt.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { SITE_URL, SITE_NAME, PHONE, WHATSAPP, EMAIL } from './src/config.mjs';

// Content hash on CSS and JS so each deploy bypasses old browser caches.
const ver = async f => crypto.createHash('sha1').update(await fs.readFile(f)).digest('hex').slice(0, 8);
const CSS_V = await ver('public/site.css');
const JS_V = await ver('public/site.js');

const pages = JSON.parse(await fs.readFile('src/pages.json', 'utf8'));
const header = await fs.readFile('src/partials/header.html', 'utf8');
const footer = await fs.readFile('src/partials/footer.html', 'utf8');
const formTpl = await fs.readFile('src/partials/form.html', 'utf8');
const ctaBand = await fs.readFile('src/partials/cta.html', 'utf8');
const mobileBar = await fs.readFile('src/partials/mobile-bar.html', 'utf8');

const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const BIZ_ID = `${SITE_URL}/#business`;
const FONTS = 'https://fonts.googleapis.com/css2?family=Oswald:wght@500;600&family=Source+Sans+3:wght@400;600&display=swap';

// Contact details. Empty values hide the matching links in the build.
const TEL_URL = PHONE ? 'tel:' + PHONE.replace(/[^\d+]/g, '') : '';
const WA_URL = WHATSAPP ? 'https://wa.me/' + WHATSAPP.replace(/\D/g, '') : '';
const vars = { PHONE, TEL_URL, WHATSAPP, WA_URL, EMAIL, CONTACT: PHONE || WHATSAPP || EMAIL, YEAR: String(new Date().getFullYear()) };

// {{#NAME}}...{{/NAME}} keeps the block when NAME is set, {{^NAME}}...{{/NAME}} when it is empty.
// Blocks may nest, so keep going until nothing changes.
function conditionals(html) {
  let prev;
  do {
    prev = html;
    html = html
      .replace(/\{\{#([A-Z_]+)\}\}((?:(?!\{\{[#^][A-Z_]+\}\})[\s\S])*?)\{\{\/\1\}\}/g, (_, k, body) => vars[k] ? body : '')
      .replace(/\{\{\^([A-Z_]+)\}\}((?:(?!\{\{[#^][A-Z_]+\}\})[\s\S])*?)\{\{\/\1\}\}/g, (_, k, body) => vars[k] ? '' : body);
  } while (html !== prev);
  return html;
}

function faqHtml(p) {
  if (!p.faq) return '';
  return `<div class="faq">${p.faq.map(({ q, a }) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
}

const tokens = (html, p = {}) => conditionals(html
  .replace(/\{\{form:([a-z-]+)\}\}/g, (_, name) => formTpl.replaceAll('{{FORM_NAME}}', name))
  .replaceAll('{{CTA}}', ctaBand)
  .replaceAll('{{FAQ}}', faqHtml(p)))
  .replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => (k in vars ? esc(vars[k]) : m));

function schemaFor(p) {
  const url = SITE_URL + p.path;
  const out = [];
  if (p.type === 'home') {
    const biz = {
      '@context': 'https://schema.org', '@type': ['LocalBusiness', 'HousePainter'], '@id': BIZ_ID,
      name: SITE_NAME, url: SITE_URL + '/', image: SITE_URL + '/logo.svg', logo: SITE_URL + '/logo.svg',
      description: p.description,
      areaServed: [
        { '@type': 'City', name: 'Cork' },
        { '@type': 'AdministrativeArea', name: 'County Cork' },
      ],
      knowsAbout: ['Interior painting', 'Exterior painting', 'Wallpapering', 'Kitchen cabinet painting', 'Commercial painting'],
    };
    // Only published once the values in src/config.mjs are filled in.
    if (PHONE) biz.telephone = PHONE;
    if (EMAIL) biz.email = EMAIL;
    out.push(biz);
    out.push({
      '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${SITE_URL}/#website`,
      name: SITE_NAME, url: SITE_URL + '/', inLanguage: 'en-IE', publisher: { '@id': BIZ_ID },
    });
  }
  if (p.service) {
    out.push({
      '@context': 'https://schema.org', '@type': 'Service', name: p.service.name,
      serviceType: p.service.serviceType, description: p.description, url,
      provider: { '@type': 'LocalBusiness', '@id': BIZ_ID, name: SITE_NAME, url: SITE_URL + '/' },
      areaServed: [{ '@type': 'City', name: 'Cork' }, { '@type': 'AdministrativeArea', name: 'County Cork' }],
    });
  }
  if (p.faq) {
    out.push({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: p.faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    });
  }
  if (p.crumbs) {
    const items = [['Home', '/'], ...p.crumbs, [p.crumbName ?? p.h1 ?? p.title, p.path]];
    out.push({
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: items.map(([name, href], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE_URL + href })),
    });
  }
  return out;
}

function crumbsHtml(p) {
  if (!p.crumbs) return '';
  const items = [['Home', '/'], ...p.crumbs];
  return `<nav class="crumbs container" aria-label="Breadcrumb"><ol>${items.map(([n, h]) => `<li><a href="${h}">${esc(n)}</a></li>`).join('')}<li><span aria-current="page">${esc(p.crumbName ?? p.title)}</span></li></ol></nav>`;
}

function navState(html, p) {
  return html.replace(/<a class="nav-link" href="([^"]+)">/g, (m, href) =>
    (href !== '/' && p.path.startsWith(href)) ? `<a class="nav-link" href="${href}" aria-current="page">` : m);
}

await fs.rm('dist', { recursive: true, force: true });
await fs.mkdir('dist', { recursive: true });
await fs.cp('public', 'dist', { recursive: true });

for (const p of pages) {
  const body = tokens(await fs.readFile(path.join('src/pages', p.file), 'utf8'), p);
  const url = SITE_URL + p.path;
  const ld = schemaFor(p).map(o => `<script type="application/ld+json">${JSON.stringify(o).replaceAll('<', '\\u003c')}</script>`).join('');
  const robots = p.noindex ? '<meta name="robots" content="noindex">' : '';
  const html = `<!doctype html>
<html lang="en-IE" class="no-js">
<head>
<meta charset="utf-8">
<script>document.documentElement.classList.remove("no-js")</script>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${url}">
${robots}<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${url}">
<meta name="theme-color" content="#b3261e">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="/site.css?v=${CSS_V}">
<script src="/site.js?v=${JS_V}" defer></script>
${ld}
</head>
<body class="page-${p.type}">
<a class="skip" href="#content">Skip to content</a>
${navState(tokens(header), p)}
<main id="content">
${crumbsHtml(p)}${body}
</main>
${tokens(footer)}
${tokens(mobileBar)}
</body>
</html>
`;
  const target = p.path === '/' ? 'dist/index.html' : p.path === '/404/' ? 'dist/404.html' : path.join('dist', p.path, 'index.html');
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, html);
}

const listed = pages.filter(p => !p.noindex);
await fs.writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${listed.map(p => `<url><loc>${SITE_URL}${p.path}</loc></url>`).join('\n')}
</urlset>
`);
await fs.writeFile('dist/robots.txt', `User-agent: *
Allow: /
Disallow: /thanks/
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`);
const todo = [PHONE ? '' : 'PHONE', WHATSAPP ? '' : 'WHATSAPP', EMAIL ? '' : 'EMAIL'].filter(Boolean);
console.log(`Built ${pages.length} pages (${listed.length} in sitemap).${todo.length ? ` Still empty in src/config.mjs: ${todo.join(', ')}.` : ''}`);
