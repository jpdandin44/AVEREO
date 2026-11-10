// Assemble l'application en un seul fichier HTML autonome (dist/index.html), à ouvrir d'un double-clic.
// Les valeurs propres au poste (valeurs-locales.json, jamais versé au dépôt) sont injectées si le fichier existe.
// Option --livrer : copie aussi le fichier sous « AVEREO UNI.html » dans le dossier parent.
import { build } from 'esbuild';
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AVEREO_LOGO } from '../../../avereo-platform/shared/report-identity.js';
import { buildMissionScript } from '../../../../.github/scripts/build-mission-script.mjs';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const paquet = JSON.parse(readFileSync(join(racine, 'package.json'), 'utf-8'));
const fichierLocal = join(racine, 'valeurs-locales.json');
const locales = existsSync(fichierLocal) ? JSON.parse(readFileSync(fichierLocal, 'utf-8')) : {};

const r = await build({
  entryPoints: [join(racine, 'src/main.jsx')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['chrome110', 'edge110', 'firefox115', 'safari16'],
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
  outdir: join(racine, 'dist'),
  write: false,
  legalComments: 'none',
  logLevel: 'warning',
});

const js = r.outputFiles.find((f) => f.path.endsWith('.js')).text;
const css = r.outputFiles.find((f) => f.path.endsWith('.css')).text;
const sur = (s) => s.replace(/<\/(script|style)/gi, '<\\/$1');
const injection = Object.keys(locales).length ? `<script>window.__AVEREO_UNI_LOCAL__=${sur(JSON.stringify({ listes: locales.listes || {}, parametres: locales.parametres || {} }))};</script>` : '';

// Offline delivery uses the model exported by the CONNECT administrator.
const appearanceIndex = process.argv.indexOf('--appearance');
let appearanceMeta = '';
if (appearanceIndex !== -1) {
  const source = process.argv[appearanceIndex + 1];
  if (!source) throw new Error('Indiquez le fichier du modèle après --appearance.');
  const values = JSON.parse(readFileSync(source, 'utf8'));
  if (!values || Object.keys(values).some(key => !['headerHeight','logoWidth','accountTone','accountBadge'].includes(key)) || ![56,68,84].includes(values.headerHeight)
    || ![100,116,136].includes(values.logoWidth) || !['mist','white'].includes(values.accountTone)) {
    throw new Error('Modèle d’apparence invalide.');
  }
  const badge = Object.hasOwn(values, 'accountBadge') ? values.accountBadge : 'MOI';
  if (typeof badge !== 'string' || !/^[\p{L}\p{Nd}]{1,3}$/u.test(badge)) {
    throw new Error('Texte du médaillon invalide.');
  }
  appearanceMeta = '<meta name="avereo-offline-appearance" content=\'' + JSON.stringify({
    headerHeight:values.headerHeight, logoWidth:values.logoWidth, accountTone:values.accountTone, accountBadge:badge
  }) + '\'>';
}

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'">
${appearanceMeta}
<meta name="avereo-shell-logo" content="${AVEREO_LOGO}">
<meta name="generator" content="AVEREO UNI ${paquet.version}">
<title>AVEREO UNI</title>
<style>${sur(css)}</style>
</head>
<body>
<div id="app"></div>
${injection}<script>${sur((await buildMissionScript()).toString('utf8'))}</script><script>${sur(js)}</script>
</body>
</html>
`;
mkdirSync(join(racine, 'dist'), { recursive: true });
writeFileSync(join(racine, 'dist/index.html'), html, 'utf-8');
console.log(`dist/index.html : ${(html.length / 1024).toFixed(0)} Ko${injection ? ', valeurs locales injectées' : ', valeurs génériques'}`);
if (process.argv.includes('--livrer')) {
  copyFileSync(join(racine, 'dist/index.html'), join(racine, '..', 'AVEREO UNI.html'));
  console.log('Copie : ../AVEREO UNI.html');
}
