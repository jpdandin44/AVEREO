const STOPWORDS = new Set(['de', 'la', 'le', 'les', 'des', 'du', 'un', 'une', 'et', 'a', 'l', 'd', 'en', 'au', 'aux', 'sur', 'pour', 'par', 'dans', 'est', 'ou', 'que', 'qui', 'ce', 'se', 'sa', 'son', 'ses', 'il', 'elle']);

// Minuscules sans accents : « Émissivité » → « emissivite »
export const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export const isStopword = t => STOPWORDS.has(t);

export function tokenize(s) {
  return norm(s).split(/[^a-z0-9°]+/).filter(t => t.length > 1 && !STOPWORDS.has(t));
}

// Découpe `text` en segments { t, m } où m = true si le segment commence par un des termes.
// La normalisation est faite caractère par caractère pour garder les positions du texte d'origine.
export function highlightSegments(text, terms) {
  const src = String(text ?? '');
  const wanted = [...new Set((terms || []).map(norm).filter(t => t.length > 1))].sort((a, b) => b.length - a.length);
  if (!wanted.length || !src) return [{ t: src, m: false }];
  let flat = '';
  const pos = [];
  for (let i = 0; i < src.length; i++) {
    const n = norm(src[i]);
    for (let k = 0; k < n.length; k++) { flat += n[k]; pos.push(i); }
  }
  const marks = new Array(src.length).fill(false);
  for (const term of wanted) {
    let from = 0, at;
    while ((at = flat.indexOf(term, from)) !== -1) {
      const wordStart = at === 0 || !/[a-z0-9]/.test(flat[at - 1]);
      if (wordStart) for (let k = at; k < at + term.length; k++) marks[pos[k]] = true;
      from = at + term.length;
    }
  }
  const out = [];
  for (let i = 0; i < src.length; i++) {
    const last = out[out.length - 1];
    if (last && last.m === marks[i]) last.t += src[i];
    else out.push({ t: src[i], m: marks[i] });
  }
  return out;
}

export function todayISO() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).slice(0, 10).split('-');
  return d && m && y ? `${d}/${m}/${y}` : String(iso);
}

export function uid(prefix = 'RES') {
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${rnd}`;
}
