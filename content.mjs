// Content engine: turns src/content/*.json into real pages on this static site.
// Each JSON file is one blog post or page, written by the SEO Queue Worker (n8n)
// or by hand. The blog index is generated from every post, so it never goes stale.
// Settings live in src/content.config.json. No file there means the engine is off.
import fs from 'node:fs/promises';
import path from 'node:path';

const esc = s => String(s ?? '').replaceAll('&amp;', '&').replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const normPath = p => '/' + String(p).replace(/^https?:\/\/[^/]+/, '').replace(/^\/+|\/+$/g, '') + '/';
const fmtDate = d => {
  const t = new Date(d);
  return isNaN(t) ? '' : t.toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Dublin' });
};

// Strip anything that should never come from generated content.
function clean(html) {
  return String(html ?? '')
    .replace(/<(script|style|iframe|object|embed|form)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|style|iframe|object|embed|form|link|meta)\b[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"')
    .replace(/<h1\b([^>]*)>([\s\S]*?)<\/h1>/gi, '<h2$1>$2</h2>')
    .replace(/\u2014/g, ', ');
}

// Reuse an existing page's header and footer for sites whose chrome lives inside each page file.
async function loadShell(file) {
  const s = await fs.readFile(path.join('src/pages', file), 'utf8');
  const hEnd = s.indexOf('</header>');
  const fStart = s.indexOf('<footer');
  if (hEnd === -1 || fStart === -1 || fStart < hEnd) throw new Error(`content shell ${file}: could not find </header> and <footer`);
  const before = s.slice(0, hEnd + '</header>'.length);
  const middle = s.slice(hEnd + '</header>'.length, fStart);
  const unclosed = (middle.match(/<\/div>/g) || []).length - (middle.match(/<div\b/g) || []).length;
  return { before, after: '</div>'.repeat(Math.max(unclosed, 0)) + s.slice(fStart) };
}

function card(p) {
  const date = p.date ? `<p class="cx-card-date"><time datetime="${esc(p.date)}">${fmtDate(p.date)}</time></p>` : '';
  const img = p.image ? `<a href="${esc(p.path)}" tabindex="-1" aria-hidden="true"><img src="${esc(p.image)}" alt="" loading="lazy" width="800" height="450"></a>` : '';
  return `<article class="cx-card">${img}<div>${date}<h3><a href="${esc(p.path)}">${esc(p.h1 || p.title)}</a></h3><p>${esc(p.excerpt || p.description)}</p><a class="cx-more" href="${esc(p.path)}">Read more</a></div></article>`;
}

function ctaBlock(cfg) {
  const c = cfg.cta || {};
  const tel = c.tel ? ` <a class="cx-tel" href="tel:${esc(c.tel)}">Call ${esc(c.phone || c.tel)}</a>` : '';
  const btn = c.href ? `<a class="cx-btn" href="${esc(c.href)}">${esc(c.text || 'Get in touch')}</a>` : '';
  if (!btn && !tel) return '';
  return `<aside class="cx-cta"><h2>${esc(c.heading || 'Talk to us')}</h2>${c.body ? `<p>${esc(c.body)}</p>` : ''}<p>${btn}${tel}</p></aside>`;
}

function articleHtml(p, posts, cfg) {
  const isPost = p.kind === 'post';
  const crumbs = isPost && cfg.blogIndex
    ? `<nav class="cx-crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="${esc(cfg.blogIndex)}">${esc(cfg.blogIndexLabel || 'Blog')}</a></nav>` : '';
  const meta = isPost && p.date ? `<p class="cx-meta"><time datetime="${esc(p.date)}">${fmtDate(p.date)}</time></p>` : '';
  const hero = p.image ? `<img class="cx-hero" src="${esc(p.image)}" alt="${esc(p.imageAlt)}" width="1200" height="675">` : '';
  const related = isPost ? posts.filter(o => o.path !== p.path).slice(0, 3) : [];
  const relatedHtml = related.length
    ? `<section class="cx-related" aria-labelledby="cx-related-title"><h2 id="cx-related-title">More from the blog</h2><div class="cx-grid">${related.map(card).join('')}</div></section>` : '';
  const ld = isPost ? `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.h1 || p.title,
    description: p.description, datePublished: p.date || undefined,
    image: p.image ? cfg.site + p.image : undefined, mainEntityOfPage: cfg.site + p.path,
    publisher: { '@type': 'Organization', name: cfg.brand }
  }).replace(/</g, '\\u003c')}</script>` : '';
  return `<main id="content" class="cx-main" style="--cx-accent:${esc(cfg.accent || '#222')}"><article class="cx-article">${crumbs}<h1>${esc(p.h1 || p.title)}</h1>${meta}${hero}<div class="cx-body">${p.body}</div>${ctaBlock(cfg)}</article>${relatedHtml}${ld}</main>`;
}

// Replace one element (found by a class name) and everything inside it.
function replaceElement(html, className, replacement) {
  const at = html.search(new RegExp(`<(div|section|ul)\\b[^>]*class="[^"]*\\b${className}\\b[^"]*"`));
  if (at === -1) return null;
  const tag = html.slice(at + 1).match(/^\w+/)[0];
  const re = new RegExp(`<${tag}\\b|</${tag}>`, 'g');
  re.lastIndex = at;
  let depth = 0, m;
  while ((m = re.exec(html))) {
    depth += m[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return html.slice(0, at) + replacement + html.slice(m.index + m[0].length);
  }
  return null;
}

function indexHtml(posts, cfg) {
  return `<main id="content" class="cx-main" style="--cx-accent:${esc(cfg.accent || '#222')}"><header class="cx-index-head"><h1>${esc(cfg.blogIndexHeading || 'Blog')}</h1>${cfg.blogIndexIntro ? `<p>${esc(cfg.blogIndexIntro)}</p>` : ''}</header><div class="cx-grid">${posts.map(card).join('')}</div>${ctaBlock(cfg)}</main>`;
}

// Add one link to a footer list, copying a linked item from that list so it matches the styling.
// Also turns any plain-text item named in link.fix ({ "Contact Us": "/contact-us/" }) into a real link.
function addFooterLink(html, link) {
  const f = html.indexOf('<footer');
  if (f === -1) return html;
  const h = html.indexOf(link.afterHeading, f);
  if (h === -1) return html;
  const ulStart = html.indexOf('<ul', h);
  const ulEnd = html.indexOf('</ul>', ulStart);
  if (ulStart === -1 || ulEnd === -1) return html;
  let list = html.slice(ulStart, ulEnd);
  for (const [text, href] of Object.entries(link.fix || {})) {
    const re = new RegExp(`(<li\\b[^>]*>)(\\s*)(<span class="elementor-icon-list-text">\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*</span>)(\\s*)(</li>)`);
    list = list.replace(re, (m, a, b, span, c, d) => `${a}${b}<a href="${esc(href)}">${span}</a>${c}${d}`);
  }
  if (!list.includes(`href="${link.href}"`)) {
    const items = list.match(/<li\b[\s\S]*?<\/li>/g) || [];
    const template = [...items].reverse().find(i => /<a\b[^>]*href=/.test(i));
    if (template) {
      const item = template
        .replace(/href="[^"]*"/, `href="${esc(link.href)}"`)
        .replace(/(<span class="elementor-icon-list-text">)[\s\S]*?(<\/span>)/, `$1${esc(link.text)}$2`);
      list += item;
    }
  }
  return html.slice(0, ulStart) + list + html.slice(ulEnd);
}

export async function withContent(pages) {
  let cfg;
  try { cfg = JSON.parse(await fs.readFile('src/content.config.json', 'utf8')); } catch { return pages; }

  let files = [];
  try { files = (await fs.readdir('src/content')).filter(f => f.endsWith('.json')).sort(); } catch {}

  const shell = cfg.shell ? await loadShell(cfg.shell) : null;
  const wrap = inner => shell ? shell.before + inner + shell.after : inner;
  const base = pages.find(p => p.file === cfg.shell) || pages.find(p => p.path === cfg.blogIndex) || pages[0];
  const routes = new Set(pages.map(p => p.path));
  const out = pages.map(p => ({ ...p }));

  for (const f of files) {
    const e = JSON.parse(await fs.readFile(path.join('src/content', f), 'utf8'));
    if (e.draft === true) continue;
    const slug = String(e.slug || '').trim();
    if (!slug || !e.title || !e.html) throw new Error(`src/content/${f}: needs slug, title and html`);
    const p = normPath(e.path || slug);
    if (routes.has(p)) throw new Error(`src/content/${f}: ${p} already exists on the site`);
    routes.add(p);
    out.push({
      id: 'content-' + slug, path: p, file: null, generated: true,
      kind: e.type === 'page' ? 'page' : 'post',
      title: e.seo_title || e.title, h1: e.title,
      description: e.meta_description || e.excerpt || '',
      excerpt: e.excerpt || e.meta_description || '',
      date: e.date || '', image: e.image || '', imageAlt: e.image_alt || e.title,
      body: clean(e.html), styles: base.styles, bodyClass: base.bodyClass
    });
  }

  const dated = p => (p.date ? Date.parse(p.date) : 0);
  const posts = out.filter(p => p.kind === 'post').sort((a, b) => dated(b) - dated(a));
  for (const p of out.filter(p => p.generated)) p.html = wrap(articleHtml(p, posts, cfg));

  if (cfg.blogIndex) {
    const listing = wrap(indexHtml(posts, cfg));
    const idx = out.find(p => p.path === cfg.blogIndex);
    if (idx && cfg.blogIndexReplace && idx.file) {
      // Keep the existing blog page (hero, forms, reviews) and swap only its post list.
      const original = await fs.readFile(path.join('src/pages', idx.file), 'utf8');
      const grid = `<div class="cx-grid" style="--cx-accent:${esc(cfg.accent || '#222')}">${posts.map(card).join('')}</div>`;
      const swapped = replaceElement(original, cfg.blogIndexReplace, grid);
      if (!swapped) throw new Error(`content: could not find .${cfg.blogIndexReplace} on ${idx.file}`);
      idx.html = swapped; idx.generatedIndex = true;
    } else if (idx) { idx.html = listing; idx.generatedIndex = true; }
    else out.push({
      id: 'content-blog-index', path: cfg.blogIndex, file: null, generated: true, kind: 'index', generatedIndex: true,
      title: cfg.blogIndexTitle || cfg.blogIndexHeading || 'Blog', description: cfg.blogIndexDescription || '',
      styles: base.styles, bodyClass: base.bodyClass, html: listing
    });
  }
  const footerLinks = [].concat(cfg.footerLinks || [], cfg.footerLink || []);
  if (footerLinks.length) {
    for (const p of out) {
      if (p.html == null && p.file) p.html = await fs.readFile(path.join('src/pages', p.file), 'utf8');
      if (p.html != null) for (const link of footerLinks) p.html = addFooterLink(p.html, link);
    }
  }
  return out;
}
