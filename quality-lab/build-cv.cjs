// Dependency-free, selectable-text PDF generated from the plain-text CV.
const fs = require('node:fs');
const path = require('node:path');
const site = 'https://anselmo-garza-quality-lab.rubybread7.chatgpt.site';
const source = fs.readFileSync(path.join(__dirname, 'dist/anselmo-garza-cv.txt'), 'utf8').trim().split(/\r?\n/);
const escape = (value) => value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
const objects = [null];
const add = (value) => { objects.push(value); return objects.length - 1; };
const catalog = add('');
const pagesObject = add('');
const regular = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
const bold = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
const info = add('<< /Title (Anselmo Garza - CV) /Author (Anselmo Garza) /Subject (QA Automation and Technical Leadership) >>');
const pages = [];
let commands, y, annotations;
function text(value, x, baseline, size = 10, weight = false, green = false) {
  commands.push(`${green ? '0.15 0.42 0.32' : '0.12 0.17 0.16'} rg BT /${weight ? 'F2' : 'F1'} ${size} Tf 1 0 0 1 ${x} ${baseline} Tm (${escape(value)}) Tj ET`);
}
function begin() {
  commands = []; annotations = []; y = 675;
  text('ANSELMO GARZA', 48, 745, 23, true, true);
  text('Senior QA Dev Engineer | QA Automation & Technical Leadership', 48, 724, 10, true);
  text('jose.anselmo@gmail.com', 48, 706, 9);
  text('Portfolio / Quality Lab', 398, 706, 9, true, true);
  annotations.push(add(`<< /Type /Annot /Subtype /Link /Rect [396 702 548 717] /Border [0 0 0] /A << /S /URI /URI (${site}) >> >>`));
  annotations.push(add('<< /Type /Annot /Subtype /Link /Rect [48 702 200 717] /Border [0 0 0] /A << /S /URI /URI (mailto:jose.anselmo@gmail.com) >> >>'));
  commands.push('0.82 0.87 0.82 RG 0.7 w 48 695 m 547 695 l S');
}
function finish() {
  text(`Anselmo Garza | CV                                      ${pages.length + 1}`, 48, 32, 8);
  const stream = commands.join('\n');
  const content = add(`<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}\nendstream`);
  pages.push(add(`<< /Type /Page /Parent ${pagesObject} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${regular} 0 R /F2 ${bold} 0 R >> >> /Contents ${content} 0 R /Annots [${annotations.map((id) => `${id} 0 R`).join(' ')}] >>`));
}
begin();
// Group continuation lines with their paragraph to avoid breaking bullets.
const groups = [];
for (const line of source.slice(3)) {
  if (/^  /.test(line) && groups.length) groups[groups.length - 1].push(line);
  else groups.push([line]);
}
for (const group of groups) {
  const height = group.reduce((sum, line) => sum + (line === '' ? 7 : 13), 0);
  if (y - height < 57) { finish(); begin(); }
  for (const line of group) {
    if (!line) { y -= 7; continue; }
    const heading = /^[A-Z][A-Z &]+$/.test(line);
    const role = /^(Senior QA|Junior QA|Regression QA team|EPICOR|DEXTRA)/.test(line);
    text(line, 48, y, heading ? 10.5 : 9.5, heading || role, heading);
    y -= 13;
  }
}
finish();
objects[catalog] = `<< /Type /Catalog /Pages ${pagesObject} 0 R >>`;
objects[pagesObject] = `<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((id) => `${id} 0 R`).join(' ')}] >>`;
let pdf = '%PDF-1.4\n';
const offsets = [0];
for (let i = 1; i < objects.length; i++) {
  offsets.push(Buffer.byteLength(pdf, 'ascii'));
  pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
}
const xref = Buffer.byteLength(pdf, 'ascii');
pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
pdf += `trailer\n<< /Size ${objects.length} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
const output = path.join(__dirname, 'dist/Anselmo_Garza_CV.pdf');
fs.writeFileSync(output, pdf, 'ascii');
console.log(`Generated ${pages.length}-page CV: ${output}`);
