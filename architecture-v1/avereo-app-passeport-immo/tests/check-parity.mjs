import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const app = new URL('../', import.meta.url);
const original = readFileSync(new URL('../avereo-app-connect/frontend/src/App.jsx', app), 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
const calculation = readFileSync(new URL('frontend/src/lib/chiffrage.js', app), 'utf8').replace(/\r\n/g, '\n');
let restored = readFileSync(new URL('frontend/src/App.jsx', app), 'utf8').replace(/\r\n/g, '\n');
// Écart g autorisé le 15 octobre : persistance serveur et identité CONNECT.
for (const addition of [
  "import { SERVER_STORAGE, persistLocal, attachServerStorage, hydrateServer } from './documents/server-store.js';\n",
  "        if (SERVER_STORAGE) return hydrateServer(useAppStore, LATEST_INITIAL_TARIFS);\n",
  "        if (SERVER_STORAGE) { window.location.assign('/connect/logout.php'); return; }\n",
  "attachServerStorage(useAppStore);\n\n",
  "      {SERVER_STORAGE && storageSaving && <p role=\"status\" className=\"bg-blue-50 p-3 text-center\">Enregistrement sur le serveur…</p>}\n",
  "      {SERVER_STORAGE && storageError && <div role=\"alert\" className=\"fixed inset-0 z-50 flex items-center justify-center bg-white/95 p-6\"><div className=\"max-w-xl\"><h1 className=\"text-xl font-bold\">Enregistrement interrompu</h1><p className=\"my-4\">{storageError}</p><p className=\"my-4\">Les dernières modifications peuvent ne pas être enregistrées. Copiez-les avant de recharger le dossier conservé sur le serveur.</p><button className=\"rounded bg-indigo-600 px-4 py-2 text-white\" onClick={() => window.location.reload()}>Recharger le dossier du serveur</button><a className=\"ml-4 underline\" href=\"/connect/logout.php\">Revenir à CONNECT</a></div></div>}\n",
]) {
  assert.ok(restored.includes(addition), 'Chaque ajout de persistance g est contrôlé explicitement');
  restored = restored.replace(addition, '');
}
restored = restored.replaceAll('persistLocal(', 'localStorage.setItem(')
  .replace(' const { isLoading, isAuthenticated, hydrate, storageSaving, storageError } = useAppStore();',
    ' const { isLoading, isAuthenticated, hydrate } = useAppStore();');
// Écart e autorisé le 14 octobre : documents liés au client et au bien.
const documentImport = "import DocumentsPanel from './documents/DocumentsPanel.jsx';\nimport './documents/documents.css';\n";
assert.ok(restored.includes(documentImport), 'Le module documentaire doit être raccordé');
restored = restored.replace(documentImport, '').replace('            <DocumentsPanel bien={bien} />\n', '');
const attachmentLabel = original.indexOf('<h2 className="text-xl font-semibold mb-4">Pièces Jointes</h2>');
const attachmentStart = original.lastIndexOf('                    <div className="bg-white p-6 rounded-xl shadow-sm border">', attachmentLabel);
const attachmentEnd = original.indexOf('                    </div>\n\n                </div>', attachmentLabel) + '                    </div>'.length;
const attachmentMarker = '                    {/* Documents du bien regroupés au-dessus du dossier travaux. */}';
assert.ok(restored.includes(attachmentMarker), 'La substitution documentaire doit rester explicite');
restored = restored.replace(attachmentMarker, original.slice(attachmentStart, attachmentEnd));
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
console.log('Parité a/b/c + correctif PDF d + module documentaire e et persistance g vérifiée : chiffrage et autres comportements conservés.');
