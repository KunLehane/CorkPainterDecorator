import { addNavigation } from './navigation.mjs';
import { addLocations } from './locations.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { withContent } from './content.mjs';
// No tracking on this site: no tag manager, no pixels, no consent banner.
const stripConsent=h=>h.replace(/<script id="wpconsent-frontend-js-js-extra">[\s\S]*?<\/script>/g,'').replace(/<script id="wpconsent-frontend-js-js"[^>]*><\/script>/g,'').replace(/<link[^>]*wpconsent[^>]*>/g,'');
const FAVICONS='<link rel="icon" href="/favicon.svg" type="image/svg+xml">';
const head='<link rel="stylesheet" href="/navigation.css?v=20261020p"><script src="/navigation.js?v=20261020p" defer></script><script src="/cta-card.js?v=20261020p" defer></script><link rel="stylesheet" href="/painter-clone.css?v=20261020p">'+FAVICONS;
const SITE_URL='https://corkpainterdecorator.ie';
const pages=await withContent(JSON.parse(await fs.readFile('src/pages.json','utf8')));
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const header=await fs.readFile('src/header.html','utf8'),footer=await fs.readFile('src/footer.html','utf8');
await fs.rm('dist',{recursive:true,force:true});
await fs.mkdir('dist',{recursive:true});await fs.cp('public','dist',{recursive:true});
for(const p of pages){
 let content=p.html??await fs.readFile('src/pages/'+p.file,'utf8');
 content=addNavigation(addLocations(content,p));
 const target=p.path==='/'?'dist/index.html':path.join('dist',p.path,'index.html');
 await fs.mkdir(path.dirname(target),{recursive:true});
 if(p.layout==='standalone'){const robots=p.noindex?'<meta name="robots" content="noindex,follow">':'';await fs.writeFile(target,stripConsent(content.replace('</head>',robots+FAVICONS+'</head>')));continue;}
 const title=p.title.replaceAll('&amp;','&');
 const html=`<!doctype html><html lang="en-IE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><meta name="description" content="${escape(p.description)}"><link rel="canonical" href="${SITE_URL}${p.path}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(p.description)}"><meta property="og:url" content="${SITE_URL}${p.path}">${p.styles}<link rel="stylesheet" href="/site.css?v=20261020p"><script src="/site.js?v=20261020p" defer></script></head><body class="${escape(p.bodyClass)}"><a class="mft-skip" href="#content">Skip to content</a>${header}${content}${footer}</body></html>`;
 const withRobots=p.noindex?html.replace('</head>','<meta name="robots" content="noindex,follow"></head>'):html;
 const result=p.image?withRobots.replace('</head>',`<meta property="og:image" content="${SITE_URL}${escape(p.image)}"><meta name="twitter:card" content="summary_large_image"></head>`):withRobots;
 await fs.writeFile(target,stripConsent(result.replace('</head>',head+'</head>')));
}
// Cloudflare Pages serves /404.html for unknown paths.
await fs.copyFile('dist/404/index.html','dist/404.html');
await fs.writeFile('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+pages.filter(p=>!p.noindex).map(p=>`<url><loc>${SITE_URL}${p.path}</loc></url>`).join('')+'</urlset>');
console.log(`Built ${pages.length} static pages.`);
