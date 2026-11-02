import { lambert93, RGA_MESSAGE, RGA_TRANSFER_KEY, rgaLevelLabel } from './modules/rgaContext.js';
import { validLocation } from './modules/locationMap.js';
import { buildGeorisquesRiskSummaryUrl, normalizeGeorisquesRiskSummary, rgaRisk } from './modules/georisquesRiskSummary.js';
import { buildGeorisquesReportUrl } from './modules/georisquesReport.js';

const $ = id => document.getElementById(id);
const embedded = new URLSearchParams(location.hash.slice(1)).get('mode') === 'rapport' && window.parent !== window;
let selected = null, result = null, cartography = null, sequence = 0, controller = null;
const status = text => { $('adresse-status').textContent = text; };
function transferButton() {
  $('bien-use').hidden = !result && !cartography;
  $('bien-use').textContent = embedded ? 'Utiliser dans ce rapport' : 'Créer un rapport pour ce bien';
}
function cancel() { sequence++; controller?.abort(); controller = new AbortController(); return sequence; }
function showPoint(point) {
  selected = point; result = null; cartography = null;
  $('bien-result').hidden = false;
  $('bien-label').textContent = point.label || 'Point transmis depuis Rapport';
  $('bien-rga').textContent = 'Information non disponible';
  $('bien-map').textContent = 'Chargement du détail…';
  $('bien-commune').textContent = '';
  $('bien-date').textContent = '';
  $('bien-use').hidden = true;
  $('bien-official').href = buildGeorisquesReportUrl(point.lon, point.lat);
  const xy = lambert93(point.lon, point.lat);
  if (point.lon >= -6 && point.lon <= 10 && point.lat >= 41 && point.lat <= 52) {
    window.dispatchEvent(new CustomEvent('avereo-rga-point', { detail: xy }));
  } else {
    $('bien-map').textContent = 'Hors couverture métropolitaine';
    status('Le point est en dehors de la couverture de cette carte métropolitaine.');
  }
  const hash = new URLSearchParams(location.hash.slice(1));
  hash.set('lon', point.lon); hash.set('lat', point.lat); hash.set('adresse', point.label || '');
  history.replaceState(null, '', `#${hash}`);
}
async function lookupRisks() {
  if (!selected) return;
  const run = cancel(), point = { ...selected };
  result = null; transferButton();
  $('bien-rga').textContent = 'Consultation en cours…';
  status('Consultation de Géorisques pour ce point…');
  const currentController = controller;
  const timeout = setTimeout(() => currentController.abort(), 15000);
  try {
    const response = await fetch(buildGeorisquesRiskSummaryUrl(point.lon, point.lat), { signal: controller.signal, referrerPolicy: 'no-referrer' });
    if (!response.ok) throw new Error('Service indisponible');
    const payload = await response.json(), fetchedAt = new Date().toISOString();
    const summary = normalizeGeorisquesRiskSummary(payload, fetchedAt);
    if (run !== sequence) return;
    const rga = rgaRisk(summary);
    $('bien-rga').textContent = rga?.addressStatus || 'Information non disponible';
    $('bien-commune').textContent = `Sur la commune : ${rga?.communeStatus || 'Information non disponible'}`;
    $('bien-date').textContent = `${summary.source} — consulté le ${new Date(fetchedAt).toLocaleString('fr-FR')}. Millésime de la réponse API non précisé ; carte locale 2026.`;
    result = { type: RGA_MESSAGE, lon: point.lon, lat: point.lat, fetchedAt, payload };
    transferButton();
    status('Résultat reçu. Vérifiez le point et la date de consultation.');
  } catch {
    if (run !== sequence) return;
    $('bien-rga').textContent = 'Information non disponible';
    $('bien-commune').textContent = '';
    $('bien-date').textContent = '';
    transferButton();
    status('Géorisques est indisponible. La lecture indicative de la carte reste distincte. Réessayez ou consultez le rapport officiel.');
  } finally { clearTimeout(timeout); }
}
$('adresse-form').addEventListener('submit', async event => {
  event.preventDefault();
  const query = $('adresse').value.trim();
  if (query.length < 3) return;
  const run = cancel(); result = null; selected = null; cartography = null;
  $('bien-result').hidden = true; $('adresse-choices').replaceChildren();
  status('Recherche d’adresses…');
  const url = new URL('https://data.geopf.fr/geocodage/search');
  url.searchParams.set('q', query); url.searchParams.set('limit', '5');
  const currentController = controller;
  const timeout = setTimeout(() => currentController.abort(), 15000);
  try {
    const response = await fetch(url, { signal: controller.signal, referrerPolicy: 'no-referrer' });
    if (!response.ok) throw new Error('Service indisponible');
    const payload = await response.json();
    if (run !== sequence) return;
    const features = (payload.features || []).filter(f => f.geometry?.type === 'Point'
      && validLocation(f.geometry.coordinates?.[0], f.geometry.coordinates?.[1]) && typeof f.properties?.label === 'string');
    status(features.length ? 'Choisissez l’adresse correspondant au bien.' : 'Aucune adresse trouvée. Précisez la voie et la commune.');
    for (const f of features.slice(0, 5)) {
      const button = document.createElement('button'); button.type = 'button';
      button.style.cssText = 'display:block;text-align:left;margin-top:8px;width:100%';
      button.textContent = f.properties.label;
      button.addEventListener('click', () => {
        if (run !== sequence) return;
        $('adresse-choices').replaceChildren();
        showPoint({ lon: Number(f.geometry.coordinates[0]), lat: Number(f.geometry.coordinates[1]), label: f.properties.label });
        lookupRisks();
      });
      $('adresse-choices').append(button);
    }
  } catch { if (run === sequence) status('Recherche d’adresse indisponible. Réessayez dans un instant.'); }
  finally { clearTimeout(timeout); }
});
$('bien-refresh').addEventListener('click', lookupRisks);
$('bien-use').addEventListener('click', () => {
  if (!selected || (!result && !cartography)) return;
  const message = { ...(result || { type: RGA_MESSAGE, lon: selected.lon, lat: selected.lat }), cartography };
  if (embedded) window.parent.postMessage(message, window.location.origin);
  else {
    try {
      const data = JSON.stringify({ message, label: selected.label });
      if (data.length > 250000) throw new Error('Résultat trop volumineux');
      sessionStorage.setItem(RGA_TRANSFER_KEY, data);
      window.top.location.href = `${window.location.origin}/#rga-import`;
    } catch { status('Transfert indisponible. Ouvrez Rapport et recherchez la même adresse dans Site.'); }
  }
});
window.addEventListener('avereo-rga-reading', event => {
  if (!selected) return;
  const value = event.detail;
  if (!value || value.status === 'unavailable') {
    $('bien-map').textContent = 'Données détaillées indisponibles'; cartography = null; transferButton(); return;
  }
  cartography = { ...value, lon: selected.lon, lat: selected.lat, fetchedAt: new Date().toISOString() };
  $('bien-map').textContent = value.level ? `Exposition ${rgaLevelLabel(value.level)} (indicative)`
    : value.status === 'outside_coverage' ? 'Hors couverture' : 'Zone non classée dans les contours affichés';
  transferButton();
});
const params = new URLSearchParams(location.hash.slice(1));
if (validLocation(params.get('lon'), params.get('lat'))) {
  showPoint({ lon: Number(params.get('lon')), lat: Number(params.get('lat')), label: (params.get('adresse') || '').slice(0, 500) });
  lookupRisks();
}
