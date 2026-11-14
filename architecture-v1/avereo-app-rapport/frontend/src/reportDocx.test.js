import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { createWordBlob } from './reportDocx.js';

// Minimal DOM input through the converter's existing parse seam; the assertions
// inspect the packaged Word XML rather than mocking docx's pagination options.
function element(tag, content = [], classes = '') {
  const node = { nodeType: 1, tagName: tag.toUpperCase(), classes,
    classList: { contains: name => classes.split(' ').includes(name) },
    getAttribute: name => name === 'src' ? pixel : null };
  node.childNodes = typeof content === 'string' ? [{ nodeType: 3, textContent: content }] : content;
  node.children = node.childNodes.filter(n => n.nodeType === 1);
  node.lastElementChild = node.children.at(-1);
  node.children.forEach((child, i) => { child.parentElement = node; child.previousElementSibling = node.children[i - 1]; });
  node.textContent = node.childNodes.map(n => n.textContent || '').join('');
  node.querySelectorAll = tag => node.children.flatMap(n => [ ...(n.tagName === tag.toUpperCase() ? [n] : []), ...n.querySelectorAll(tag) ]);
  return node;
}
const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXuoAAAAASUVORK5CYII=';
async function xml(body) {
  const blob = await createWordBlob('', { titre: 'Fictif', reference_dossier: 'TEST' }, () => ({ body }));
  return (await JSZip.loadAsync(await blob.arrayBuffer())).file('word/document.xml').async('string');
}
function paragraph(document, text) {
  const value = [...document.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map(m => m[0]).find(p => p.includes(`>${text}</w:t>`));
  assert.ok(value, `Paragraph missing: ${text}`);
  return value;
}
const kept = p => /<w:keepNext\/>/.test(p);

test('a selected client finding stays with its advice and nested photo caption, without linking the next block', async () => {
  const previous = globalThis.Image;
  globalThis.Image = class { naturalWidth = 1; naturalHeight = 1; async decode() {} };
  try {
    const body = element('body', [element('article', [
      element('h3', 'Constat sélectionné'), element('p', 'Constat conservé'),
      element('h4', 'Conseils habitologue'), element('p', 'Conseil conservé'),
      element('div', [element('img'), element('p', 'Légende conservée')], 'photo-block'),
    ], 'client-observation keep-together'), element('p', 'Bloc suivant')]);
    const document = await xml(body);
    for (const text of ['Constat conservé', 'Conseil conservé']) assert.ok(kept(paragraph(document, text)), text);
    assert.ok(!kept(paragraph(document, 'Légende conservée')));
    assert.ok(!kept(paragraph(document, 'Bloc suivant')));
    assert.match(paragraph(document, 'Conseil conservé'), /<w:keepLines\/>/);
    const picture = [...document.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map(m => m[0]).find(p => p.includes('<w:drawing>'));
    assert.ok(picture && kept(picture), 'Photo stays with its caption');
    assert.doesNotMatch(document, /w:pageBreakBefore/);
  } finally { globalThis.Image = previous; }
});

test('the last decision warning stays with the complete limits paragraph only', async () => {
  const body = element('body', [element('section', [element('div', [
    element('h3', 'Points restant à compléter'), element('ul', [element('li', 'Budget à préciser')]),
    element('p', 'Limites conservées'),
  ], 'decision-conclusion keep-together')], 'decision-report'), element('p', 'Signature suivante')]);
  const document = await xml(body);
  assert.ok(kept(paragraph(document, 'Budget à préciser')));
  assert.ok(!kept(paragraph(document, 'Limites conservées')));
  assert.match(paragraph(document, 'Limites conservées'), /<w:keepLines\/>/);
  assert.ok(!kept(paragraph(document, 'Signature suivante')));
});

test('compact decision spacing does not change ordinary report tables', async () => {
  const table = text => element('table', [element('tbody', [element('tr', [element('td', text)])])]);
  const document = await xml(element('body', [table('Hors décision'), element('section', [table('Dans décision')], 'decision-report')]));
  const tables = [...document.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>/g)].map(m => m[0]);
  assert.equal(tables.length, 2);
  assert.match(tables[0], /<w:top w:type="dxa" w:w="100"\/>/);
  assert.match(tables[1], /<w:top w:type="dxa" w:w="70"\/>/);
});
