import * as L from './vendor/leaflet/leaflet-src.esm.js';
import { createRgaLayer, createRgaPanes, fromLambert93 } from './modules/rgaOverlay.js';
import { buildIgnTileUrl, validLocation } from './modules/locationMap.js';

const $ = id => document.getElementById(id);
let map, overlay, marker, point, layerError = false, baseError = false;
function status() {
  $('overlay-status').textContent = layerError ? 'Couche RGA indisponible : recentrez pour réessayer.'
    : `${baseError ? 'Fond IGN partiellement indisponible. ' : ''}Contours RGA simplifiés à ${map.getZoom() >= 11 ? '20' : '250'} m · Précision parcellaire non garantie.`;
}
function initialize() {
  if (map) return;
  map = L.map('cadastre-view', { minZoom: 3, maxZoom: 20, scrollWheelZoom: false, zoomControl: false }).setView([46.5, 3], 6);
  L.control.zoom({ zoomInTitle: 'Zoomer', zoomOutTitle: 'Dézoomer' }).addTo(map);
  createRgaPanes(map);
  for (const name of ['plan', 'cadastre']) {
    L.tileLayer(buildIgnTileUrl(name), { maxNativeZoom: 19, maxZoom: 20, noWrap: true, keepBuffer: 1,
      pane: name === 'cadastre' ? 'cadastrePane' : 'tilePane',
      attribution: name === 'cadastre' ? 'Parcellaire Express (PCI) © IGN / DGFiP' : '© IGN',
      referrerPolicy: 'no-referrer',
    }).on('tileerror', () => { baseError = true; status(); }).addTo(map);
  }
  overlay = createRgaLayer(L, window.RGA?.filters || {})
    .on('loading', () => { layerError = false; $('overlay-status').textContent = 'Chargement de la couche RGA…'; })
    .on('tileerror', () => { layerError = true; status(); }).on('load', status).addTo(map);
  L.control.scale({ imperial: false }).addTo(map);
  map.on('zoomend', status);
  new ResizeObserver(() => map.invalidateSize()).observe($('cadastre-view'));
}
function show(cadastral) {
  $('map').classList.toggle('cadastral', cadastral);
  $('view-cadastre').setAttribute('aria-pressed', String(cadastral));
  $('view-territories').setAttribute('aria-pressed', String(!cadastral));
  if (cadastral) { initialize(); requestAnimationFrame(() => map.invalidateSize()); }
}
function locate(lon, lat) {
  if (!validLocation(lon, lat)) return;
  point = [Number(lat), Number(lon)]; show(true);
  if (!marker) marker = L.marker(point, { title: 'Bien recherché', alt: 'Repère du bien recherché',
    icon: L.divIcon({ className: 'rga-property-point', iconSize: [19, 19], iconAnchor: [9.5, 9.5] }),
  }).addTo(map).bindTooltip('Bien recherché');
  else marker.setLatLng(point);
  map.setView(point, 18, { animate: false });
  $('view-property').hidden = false;
}
$('view-cadastre').onclick = () => show(true);
$('view-territories').onclick = () => show(false);
$('zoomsel').addEventListener('click', () => show(false));
$('view-property').onclick = () => { if (point) { show(true); map.setView(point, 18); overlay.redraw(); } };
$('rga-opacity').oninput = event => {
  const value = Number(event.target.value);
  overlay?.setOpacity(value / 100); $('rga-opacity-value').textContent = `${value} %`;
};
window.addEventListener('avereo-rga-point', event => {
  if (Array.isArray(event.detail) && event.detail.length === 2) {
    const location = fromLambert93(...event.detail); if (location) locate(...location);
  }
});
window.addEventListener('avereo-rga-filters', event => {
  if (overlay) { Object.assign(overlay.options, event.detail); overlay.redraw(); }
});
// Address search can initialize while this module's dependencies are downloading.
const hash = new URLSearchParams(location.hash.slice(1));
if (hash.has('lon') && hash.has('lat')) locate(Number(hash.get('lon')), Number(hash.get('lat')));
