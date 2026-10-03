import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const app = new URL('../', import.meta.url);
const original = readFileSync(new URL('../avereo-app-connect/frontend/src/App.jsx', app), 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
const calculation = readFileSync(new URL('frontend/src/lib/chiffrage.js', app), 'utf8').replace(/\r\n/g, '\n');
let restored = readFileSync(new URL('frontend/src/App.jsx', app), 'utf8').replace(/\r\n/g, '\n');
// Écart d autorisé par le responsable : correction ciblée de la page blanche PDF.
const pdfCorrection = `            const hasOverflowContent = () => {
                if (heightLeft <= 0) return false;
                // Un arrondi du canvas peut ajouter moins d'un pixel blanc à l'A4.
                if (heightLeft > imgWidth / canvasWidth) return true;
                const context = canvas.getContext('2d');
                if (!context) return true;
                const { data } = context.getImageData(0, canvasHeight - 1, canvasWidth, 1);
                for (let i = 0; i < data.length; i += 4) {
                    if (data[i + 3] && (data[i] < 255 || data[i + 1] < 255 || data[i + 2] < 255)) return true;
                }
                return false;
            };

`;
assert.ok(restored.includes(pdfCorrection), 'Le correctif PDF doit correspondre au seul bloc autorisé d');
restored = restored.replace(pdfCorrection, '').replace('while (hasOverflowContent()) {', 'while (heightLeft > 0) {');
restored = restored.replace("import { calculateDevis, calculateDevisForPdf } from './lib/chiffrage.js';\n", '');
restored = restored.replaceAll('avereo-passeport-immo-biens', 'avero-biens').replaceAll('avereo-passeport-immo-tarifs', 'avero-tarifs');
restored = restored.replaceAll('AVEREO – Passeport Immo', 'AVEREO');
const loader = original.slice(original.indexOf('// --- SCRIPT LOADER ---'), original.indexOf('// --- MOCK DATA & CONFIGURATION ---'));
restored = restored.replace('// --- MOCK DATA & CONFIGURATION ---', loader + '// --- MOCK DATA & CONFIGURATION ---');
const loading = original.match(/   loadScript\('https:[\s\S]*?\n    \}\);\n/)[0];
restored = restored.replace('useEffect(() => {\n    hydrate();', 'useEffect(() => {\n' + loading + '    hydrate();');
for (const [local, name, params] of [['devis', 'calculateDevis', 'bien, tarifs, priceTier'], ['devisForPdf', 'calculateDevisForPdf', 'bien, tarifs']]) {
  const definition = calculation.split(`export function ${name}(${params}) {\n`)[1].split('\n}\n')[0];
  const body = definition.split('\n').map(line => line ? `        ${line}` : '').join('\n');
  const needle = `    const ${local} = useMemo(() => ${name}(${params}), [${params}]);`;
  assert.ok(restored.includes(needle), `App doit utiliser le calcul ${name}`);
  restored = restored.replace(needle, `    const ${local} = useMemo(() => {\n${body}\n    }, [${params}]);`);
}
const normalize = text => text.split('\n').map(line => line.trim()).join('\n').trim();
const actual = normalize(restored);
const expected = normalize(original);
if (actual !== expected) {
  const a = actual.split('\n'); const b = expected.split('\n');
  const line = a.findIndex((value, index) => value !== b[index]);
  console.error('Écart de parité, ligne reconstruite', line + 1, { actuel: a.slice(line, line + 3), source: b.slice(line, line + 3) });
  process.exit(1);
}
console.log('Parité a/b/c + correctif PDF d vérifiée : autres comportements et classes inchangés.');
