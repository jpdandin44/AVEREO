// Detects HTTP/HTTPS addresses in free text. The text is never rewritten:
// the concatenation of every returned `text` equals the input exactly.
// Module without imports, so that React previews and Word exports can share it.
const CANDIDATE = /(?<![A-Za-z0-9+.-])https?:\/\/[^\s<>"'`’«»“”\\]+/gi;
const TRAILING_PUNCTUATION = /[.,;:!?]$/;
const PAIRS = { ')': '(', ']': '[' };

function count(text, char) {
  return text.split(char).length - 1;
}

// Sentence punctuation and unbalanced closing brackets belong to the sentence, not to the address.
function trimTrailing(candidate) {
  let value = candidate;
  for (;;) {
    const last = value.at(-1);
    if (TRAILING_PUNCTUATION.test(value)) value = value.slice(0, -1);
    else if (PAIRS[last] && count(value, last) > count(value, PAIRS[last])) value = value.slice(0, -1);
    else return value;
  }
}

function safeHref(candidate) {
  try {
    const url = new URL(candidate);
    const valid = ['http:', 'https:'].includes(url.protocol) && url.hostname && !url.username && !url.password;
    return valid ? url.href : '';
  } catch {
    return '';
  }
}

export function textLinks(text) {
  const value = typeof text === 'string' ? text : String(text ?? '');
  const parts = [];
  let cursor = 0;
  const push = (segment, href) => {
    if (!segment) return;
    const previous = parts.at(-1);
    if (!href && previous && !previous.href) previous.text += segment;
    else parts.push(href ? { text: segment, href } : { text: segment });
  };
  for (const match of value.matchAll(CANDIDATE)) {
    const candidate = trimTrailing(match[0]);
    const href = safeHref(candidate);
    push(value.slice(cursor, match.index), '');
    if (href) {
      push(candidate, href);
      cursor = match.index + candidate.length;
    } else {
      cursor = match.index;
    }
  }
  push(value.slice(cursor), '');
  return parts;
}

function escapeText(value) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

// Escapes every character of the user text, then adds only the anchors produced by textLinks.
// Returns an empty string when there is nothing to show; callers choose their own placeholder.
export function textToLinkedHtml(text) {
  const value = (typeof text === 'string' ? text : String(text ?? '')).trim();
  return textLinks(value).map(part => {
    const safe = escapeText(part.text).replace(/\r\n|\r|\n/g, '<br />');
    return part.href ? `<a href="${escapeText(part.href)}" rel="noopener noreferrer">${safe}</a>` : safe;
  }).join('');
}
