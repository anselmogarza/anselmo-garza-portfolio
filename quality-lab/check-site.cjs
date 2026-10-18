const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.join(__dirname, 'dist');
const pages = fs.readdirSync(root).filter((name) => name.endsWith('.html'));
for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, `Duplicate IDs: ${page}`);
  for (const [, ref] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^[a-z]+:/i.test(ref)) continue;
    const [filename, anchor] = ref.split('#');
    const target = path.resolve(root, filename || page);
    assert(target.startsWith(root + path.sep), `Link escapes site: ${ref}`);
    assert(fs.existsSync(target), `Missing asset: ${page} -> ${ref}`);
    if (anchor) assert(fs.readFileSync(target, 'utf8').includes(`id="${anchor}"`), `Missing anchor: ${ref}`);
  }
  const nav = html.match(/<nav aria-label="Main navigation">([\s\S]*?)<\/nav>/)?.[1];
  assert(nav, `Missing navigation: ${page}`);
  for (const other of pages.filter((name) => name !== page)) {
    assert(nav.includes(`href="${other}`), `Missing navigation: ${page} -> ${other}`);
  }
}
const pdf = fs.readFileSync(path.join(root, 'Anselmo_Garza_CV.pdf')).toString('ascii');
assert(pdf.startsWith('%PDF-1.4'), 'PDF header');
assert(pdf.includes('/URI (https://anselmogarza.github.io/anselmo-garza-portfolio)'), 'Public portfolio link in PDF');
for (const [, offset] of pdf.matchAll(/^(\d{10}) 00000 n/gm)) {
  assert(/^\d+ 0 obj/.test(pdf.slice(Number(offset))), 'PDF object offset');
}
console.log(`PASS: ${pages.length} HTML pages, navigation, local assets, anchors, and PDF links/offsets.`);
