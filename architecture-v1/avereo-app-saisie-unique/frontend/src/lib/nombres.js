// Saisie et affichage des nombres et des montants (T19) : virgule et espaces acceptés, arrondi au centime.

export function estVide(v) {
  return v == null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === '');
}

// Lit un nombre saisi : « 3 200,50 », « 3200.5 », « 3 200 € ». Renvoie null si la saisie n'est pas un nombre.
export function lireNombre(v) {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const brut = String(v).replace(/[\s  €%]/g, '').replace(',', '.');
  if (brut === '' || !/^[-+]?\d*\.?\d+$/.test(brut)) return null;
  const n = Number(brut);
  return Number.isFinite(n) ? n : null;
}

// Valeur numérique d'une saisie, 0 si vide ou invalide (règle de la maquette).
export function num(v) {
  return lireNombre(v) ?? 0;
}

export function centimes(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function somme(valeurs) {
  return centimes(valeurs.reduce((a, v) => a + num(v), 0));
}

const euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const eurosCentimes = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nombre = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

// Montant en euros : sans décimales s'il est rond, sinon au centime (8 545,50 €).
export function eur(n) {
  const c = centimes(n);
  return Number.isInteger(c) ? euros.format(c) : eurosCentimes.format(c);
}

export function fmtNombre(n) {
  return nombre.format(n);
}

// Date ISO (AAAA-MM-JJ) vers l'affichage JJ/MM/AAAA ; une autre saisie est rendue telle quelle.
export function fmtDate(v) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v || ''));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(v || '');
}

export function aujourdHui(d = new Date()) {
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function heure(d = new Date()) {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
