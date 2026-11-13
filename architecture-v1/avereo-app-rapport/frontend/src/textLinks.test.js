import test from 'node:test';
import assert from 'node:assert/strict';
import { textLinks, textToLinkedHtml } from './textLinks.js';

const links = text => textLinks(text).filter(part => part.href);
const joined = text => textLinks(text).map(part => part.text).join('');

test('the input text is preserved exactly, with or without links', () => {
  for (const text of ['', 'Texte simple', '  espaces  \n\nlignes\r\nmixtes ', 'Voir https://example.com/a?x=1&y=2, puis (http://example.org/b).\nFin « https://example.net »',
    'javascript:alert(1) https:// http://', 'ligne\nhttps://example.com/\n']) {
    assert.equal(joined(text), text);
  }
  assert.deepEqual(textLinks(''), []);
  assert.deepEqual(textLinks(undefined), []);
  assert.deepEqual(textLinks('Aucun lien'), [{ text: 'Aucun lien' }]);
});

test('only valid HTTP and HTTPS addresses become links', () => {
  assert.deepEqual(links('A https://example.com/doc et http://example.org/page.'), [
    { text: 'https://example.com/doc', href: 'https://example.com/doc' },
    { text: 'http://example.org/page', href: 'http://example.org/page' },
  ]);
  assert.equal(links('HTTPS://EXAMPLE.COM/Chemin')[0].href, 'https://example.com/Chemin');
  for (const text of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,<b>x</b>', 'file:///C:/secret.txt', 'ftp://example.com/a',
    'https://', 'http://:80', 'xhttps://example.com', 'https://user:secret@example.com/']) {
    assert.deepEqual(links(text), [], text);
  }
  assert.deepEqual(links('javascript:alert(1) puis https://example.com'), [{ text: 'https://example.com', href: 'https://example.com/' }]);
});

test('sentence punctuation and unbalanced brackets stay outside the address', () => {
  for (const [text, expected] of [
    ['Voir https://example.com/a.', 'https://example.com/a'],
    ['Voir https://example.com/a, puis', 'https://example.com/a'],
    ['Vrai ? https://example.com/a?!', 'https://example.com/a'],
    ['(https://example.com/a)', 'https://example.com/a'],
    ['[https://example.com/a]', 'https://example.com/a'],
    ['https://example.com/a_(b).', 'https://example.com/a_(b)'],
    ['(voir https://example.com/a_(b))', 'https://example.com/a_(b)'],
    ['https://example.com/a?x=1&y=2;', 'https://example.com/a?x=1&y=2'],
    ['« https://example.com/a »', 'https://example.com/a'],
    ['"https://example.com/a"', 'https://example.com/a'],
  ]) {
    assert.equal(links(text)[0]?.text, expected, text);
  }
});

test('line breaks end an address and are kept in the plain text', () => {
  const parts = textLinks('https://example.com/a\nhttps://example.com/b');
  assert.deepEqual(parts.map(part => part.text), ['https://example.com/a', '\n', 'https://example.com/b']);
  assert.equal(parts.filter(part => part.href).length, 2);
});

test('linked HTML escapes user text, keeps anchors safe and converts line breaks', () => {
  const html = textToLinkedHtml('<script>alert(1)</script> & "guillemets" l\'été\nhttps://example.com/a?x=1&y="2"<b>.');
  assert.doesNotMatch(html, /<script|<b>|onerror/i);
  assert.match(html, /^&lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; &quot;guillemets&quot; l&#39;été<br \/>/);
  assert.match(html, /<a href="https:\/\/example\.com\/a\?x=1&amp;y=" rel="noopener noreferrer">https:\/\/example\.com\/a\?x=1&amp;y=<\/a>&quot;2&quot;&lt;b&gt;\.$/);
  assert.equal(textToLinkedHtml('a\r\nb'), 'a<br />b');
});

test('a malicious label or address never produces an executable attribute or protocol', () => {
  const html = textToLinkedHtml('https://example.com/" onmouseover="alert(1) javascript:alert(1) <img src=x onerror=alert(1)>');
  assert.equal(html.match(/<a /g)?.length ?? 0, 1);
  assert.doesNotMatch(html, /<img|href="javascript|onmouseover="/);
  assert.equal(textToLinkedHtml('javascript:alert(1)'), 'javascript:alert(1)');
  assert.equal(textToLinkedHtml(''), '');
  assert.equal(textToLinkedHtml('   \n '), '');
  assert.equal(textToLinkedHtml(null), '');
});

test('parentheses and ampersands in addresses are kept and escaped in the attribute', () => {
  const html = textToLinkedHtml('https://example.com/a_(b)?c=1&d=2');
  assert.equal(html, '<a href="https://example.com/a_(b)?c=1&amp;d=2" rel="noopener noreferrer">https://example.com/a_(b)?c=1&amp;d=2</a>');
});
