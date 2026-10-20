import fs from 'node:fs';
const places=JSON.parse(fs.readFileSync(new URL('./src/locations.json',import.meta.url),'utf8'));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const links=places.map(p=>`<li><a href="${p.path}">${esc(p.name)}</a></li>`).join('')+'<li><a href="/areas/">All areas</a></li>';
const footer=`<nav class="crr-location-footer" aria-label="Painting areas"><div class="crr-location-inner"><h2>Painters across Cork</h2><p>Painting and decorating in your area.</p><ul>${links}</ul></div></nav>`;
const footerBlock=`<section class="crr-footer-locations" aria-labelledby="crr-footer-locations-title"><div class="crr-footer-locations-inner"><h2 id="crr-footer-locations-title">Areas</h2><ul>${links}</ul></div></section>`;
const cards=places.map(p=>`<article class="crr-location-card"><a href="${p.path}"><img src="${p.image}" width="${p.width}" height="${p.height}" loading="lazy" decoding="async" alt="${esc(p.alt)}"><div><h3>${esc(p.name)}</h3><span>Painting and decorating <span aria-hidden="true">↗</span></span></div></a></article>`).join('');
const credits=places.filter(p=>p.source).map(p=>`<li><strong>${esc(p.name)}:</strong> <a href="${esc(p.source)}">${esc(p.file.replaceAll('_',' '))}</a>, ${esc(p.artist)}, <a href="${esc(p.licenseUrl)}">${esc(p.license)}</a>. Resized and displayed with a crop.</li>`).join('');
const block=`<section id="locations" class="crr-locations" aria-labelledby="crr-locations-title"><div class="crr-location-inner"><div class="crr-location-heading"><div><p class="crr-location-eyebrow">PAINTERS ACROSS CORK</p><h2 id="crr-locations-title">Your area. Your price in writing.</h2><p>Painting and decorating across Cork city and county. Choose your area to find out more, or see <a href="/areas/">all the areas we cover</a>.</p></div></div><div id="crr-location-row" class="crr-location-row" role="region" aria-label="Painting areas">${cards}</div><details class="crr-photo-credits"><summary>Location photo credits</summary><ul>${credits}</ul></details></div></section>`;
export function addLocations(content,page){
 if(page.path==='/'||page.path==='/areas/')content=content.replace(/<footer\b/,block+'<footer');
 if(page.layout==='standalone')content=content.replace('</footer>',footer+'</footer>');
 else if(/<section[^>]*elementor-element-e074cc3/.test(content))content=content.replace(/<section([^>]*elementor-element-e074cc3)/,footerBlock+'<section$1');
 else content=content.replace('</footer>',footerBlock+'</footer>');
 const assets='<link rel="stylesheet" href="/locations.css?v=20261020p"><script src="/locations.js?v=20261020p" defer></script>';
 return page.layout==='standalone'?content.replace('</head>',assets+'</head>'):assets+content;
}
