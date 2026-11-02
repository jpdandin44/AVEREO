import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Map, Image, Check, Pencil, LocateFixed, ExternalLink, Loader2 } from 'lucide-react';
import { buildIgnMapUrl, buildIgnTileUrl, locationConfirmed, validLocation } from './locationMap.js';
import { terrainMapSamples } from './terrainContext.js';
import { createRgaLayer, createRgaPanes } from './rgaOverlay.js';
import useRgaAccess from './useRgaAccess.js';

export function CadastralMap({ lon, lat, mode, revision, editing = false, draft = null, onPointChange, terrainAnalysis = null, rga = false, rgaOpacity = .4 }) {
  const container = useRef(null);
  const mapRef = useRef(null);
  const rgaRef = useRef(null);
  const [rgaStatus, setRgaStatus] = useState('loading');
  const [mapZoom, setMapZoom] = useState(18);
  const markerRef = useRef(null);
  const interaction = useRef({ editing, onPointChange });
  interaction.current = { editing, onPointChange };
  const [tiles, setTiles] = useState({ base: 'loading', cadastre: 'loading' });
  const samples = useMemo(() => terrainMapSamples(terrainAnalysis, lon, lat), [terrainAnalysis, lon, lat]);

  useEffect(() => {
    let active = true;
    setTiles({ base: 'loading', cadastre: 'loading' });
    const map = L.map(container.current, { scrollWheelZoom: false, minZoom: 3, maxZoom: 20, zoomControl: false })
      .setView([Number(lat), Number(lon)], 18);
    mapRef.current = map;
    setMapZoom(18);
    map.on('zoomend', () => { if (active) setMapZoom(map.getZoom()); });
    createRgaPanes(map);
    L.control.zoom({ zoomInTitle: 'Zoomer', zoomOutTitle: 'Dézoomer' }).addTo(map);
    L.control.scale({ imperial: false }).addTo(map);
    const addTiles = (layer, name, attribution) => {
      let failed = false;
      L.tileLayer(buildIgnTileUrl(layer), {
        maxNativeZoom: 19, maxZoom: 20, noWrap: true, keepBuffer: 1,
        referrerPolicy: 'no-referrer', attribution, pane: name === 'cadastre' ? 'cadastrePane' : 'tilePane',
      }).on('tileerror', () => {
        failed = true;
        if (active) setTiles((prev) => ({ ...prev, [name]: 'error' }));
      }).on('load', () => {
        if (active && !failed) setTiles((prev) => ({ ...prev, [name]: 'ready' }));
      }).addTo(map);
    };
    addTiles(mode === 'aerial' ? 'aerial' : 'plan', 'base', '<a href="https://cartes.gouv.fr/" target="_blank" rel="noopener noreferrer">© IGN</a>');
    addTiles('cadastre', 'cadastre', 'Parcellaire Express (PCI) © IGN / DGFiP');
    const marker = samples.length ? null : L.marker([Number(lat), Number(lon)], {
      icon: L.divIcon({ className: 'property-map-marker', html: '<span></span>', iconSize: [30, 38], iconAnchor: [15, 38] }),
      title: 'Bien à vérifier', alt: 'Repère du bien recherché', draggable: false,
    }).addTo(map).bindTooltip('Bien à vérifier', { direction: 'top', offset: [0, -35] });
    markerRef.current = marker;
    const selectPoint = ({ lng, lat: latitude }) => {
      if (interaction.current.editing && validLocation(lng, latitude)) {
        interaction.current.onPointChange?.(Number(lng.toFixed(7)), Number(latitude.toFixed(7)));
      }
    };
    map.on('click', (event) => selectPoint(event.latlng));
    marker?.on('dragend', () => selectPoint(marker.getLatLng()));
    if (samples.length) {
      const bounds = L.latLngBounds(samples.map((p) => [p.lat, p.lon]));
      L.rectangle(bounds, { color: '#334155', weight: 2, dashArray: '6 6', fill: false, interactive: false }).addTo(map);
      for (const point of samples) {
        const center = point.label === 'Centre';
        const value = point.z.toFixed(2).replace('.', ',');
        const caption = center ? 'Visite' : point.label;
        // Labels come from the validated grid; only finite numeric elevations enter HTML.
        L.marker([point.lat, point.lon], {
          interactive: false, keyboard: false,
          icon: L.divIcon({
            className: 'terrain-map-label',
            html: `<div class="terrain-map-value ${point.level}${center ? ' visit' : ''}" role="img" aria-label="${caption} : ${value} mètres"><small>${caption}</small><strong>${value} m</strong></div>`,
            iconSize: [78, 44], iconAnchor: [39, 22],
          }),
        }).addTo(map);
      }
      map.fitBounds(bounds, { padding: [60, 65], maxZoom: 19, animate: false });
    }
    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(container.current);
    const timeout = setTimeout(() => {
      if (active) setTiles((prev) => Object.fromEntries(Object.entries(prev).map(([key, value]) => [key, value === 'loading' ? 'error' : value])));
    }, 15000);
    return () => {
      active = false;
      clearTimeout(timeout);
      resize.disconnect();
      markerRef.current = null;
      mapRef.current = null;
      rgaRef.current = null;
      map.remove();
    };
  }, [lon, lat, mode, revision, samples]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !rga) return;
    let active = true, failed = false;
    setRgaStatus('loading');
    const layer = createRgaLayer(L).on('loading', () => { failed = false; if (active) setRgaStatus('loading'); })
      .on('tileerror', () => { failed = true; if (active) setRgaStatus('error'); })
      .on('load', () => { if (active && !failed) setRgaStatus('ready'); }).addTo(map);
    rgaRef.current = layer;
    return () => { active = false; layer.remove(); rgaRef.current = null; };
  }, [rga, lon, lat, mode, revision, samples]);

  useEffect(() => { rgaRef.current?.setOpacity(rgaOpacity); }, [rgaOpacity, rga, lon, lat, mode, revision, samples]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    const point = draft && validLocation(draft.lon, draft.lat) ? draft : { lon, lat };
    marker.setLatLng([Number(point.lat), Number(point.lon)]);
    if (editing) marker.dragging.enable(); else marker.dragging.disable();
    marker.setTooltipContent(editing ? 'Déplacez le point puis validez' : 'Bien à vérifier');
  }, [draft, editing, lon, lat, mode, revision, samples]);

  const failed = Object.values(tiles).includes('error');
  const loading = Object.values(tiles).includes('loading');
  return (
    <>
      <div className="property-map-frame">
        <div ref={container} className="property-map-canvas" role="region" aria-label="Carte cadastrale du bien" />
        <span className="map-north" title="Nord géographique en haut">N<br />↑</span>
      </div>
      {failed ? <p className="property-map-status warning" role="status">Une partie de la carte est indisponible. Réessayez ou ouvrez le plan IGN.</p>
        : loading ? <p className="property-map-status" role="status"><Loader2 size={16} className="spin" /> Chargement du fond et des parcelles…</p> : null}
      {rga && <p className={`property-map-status${rgaStatus === 'error' ? ' warning' : ''}`} role="status">
        {rgaStatus === 'error' ? 'La couche RGA est indisponible. Utilisez Recentrer pour réessayer.' : rgaStatus === 'loading' ? 'Chargement de la couche RGA…' : `RGA 2026 · Contours simplifiés à ${mapZoom >= 11 ? '20' : '250'} m à cette échelle : précision parcellaire non garantie.`}</p>}
    </>
  );
}

export default function LocationMap({ report, setReport, onCorrectAddress, onMovePoint }) {
  const rgaAllowed = useRgaAccess();
  const [mode, setMode] = useState('cadastre');
  const [revision, setRevision] = useState(0);
  const [rga, setRga] = useState(true);
  const [rgaOpacity, setRgaOpacity] = useState(.4);
  const [draft, setDraft] = useState(null);
  const lon = report.cadastre?.lon;
  const lat = report.cadastre?.lat;
  useEffect(() => setDraft(null), [lon, lat, report.adresse_logement]);
  if (!validLocation(lon, lat)) return null;
  const editing = draft !== null;
  const changed = editing && validLocation(draft.lon, draft.lat)
    && (Number(draft.lon) !== Number(lon) || Number(draft.lat) !== Number(lat));
  const confirmed = locationConfirmed(report);
  const found = report.localisation?.adresse_trouvee;
  const confirm = (value) => setReport((prev) => ({ ...prev, localisation: {
    ...prev.localisation,
    confirmation: value ? { adresse: prev.adresse_logement, lon: prev.cadastre.lon, lat: prev.cadastre.lat, date: new Date().toISOString() } : null,
  } }));

  return (
    <section className={`location-map${confirmed ? ' is-confirmed' : ''}`} aria-labelledby="location-title">
      <div className="property-map-heading">
        <span className="property-map-icon" aria-hidden="true"><MapPin size={24} /></span>
        <div><p className="property-map-eyebrow">LE LIEU DE LA VISITE</p><h3 id="location-title">Est-ce bien ce logement ?</h3></div>
        <span className={`property-map-badge${confirmed ? ' confirmed' : ''}`} role="status">{confirmed ? <><Check size={15} /> Lieu confirmé</> : 'À confirmer'}</span>
      </div>
      <div className="property-map-address"><strong>{report.adresse_logement}</strong>
        {found && found !== report.adresse_logement && <p>Adresse trouvée : {found}</p>}
        {!found && <p>Adresse trouvée non conservée dans ce dossier : vérifiez le repère.</p>}
        <p>Point de visite : {Number(lat).toFixed(7)}, {Number(lon).toFixed(7)}
          {report.localisation?.point_manuel && ' · Ajusté manuellement'}</p>
      </div>
      <div className="property-map-toolbar">
        <div className="property-map-switch" role="group" aria-label="Fond de carte">
          <button type="button" aria-pressed={mode === 'cadastre'} onClick={() => setMode('cadastre')}><Map size={17} /> Cadastre</button>
          <button type="button" aria-pressed={mode === 'aerial'} onClick={() => setMode('aerial')}><Image size={17} /> Vue aérienne</button>
        </div>
        {!editing && <button className="property-map-recenter" type="button" onClick={() => setDraft({ lon, lat })}><MapPin size={17} /> Déplacer le point</button>}
        <button className="property-map-recenter" type="button" onClick={() => setRevision((value) => value + 1)}><LocateFixed size={17} /> Recentrer</button>
      </div>
      {rgaAllowed ? <div className="property-rga-controls">
        <label><input type="checkbox" checked={rga} onChange={event => setRga(event.target.checked)} /> Superposer le RGA</label>
        <label>Intensité des couleurs <input type="range" min="0" max="80" step="5" value={Math.round(rgaOpacity * 100)} disabled={!rga}
          onChange={event => setRgaOpacity(Number(event.target.value) / 100)} /> <output>{Math.round(rgaOpacity * 100)} %</output></label>
        <span className="rga-level-key"><i style={{ background: '#f3cf55' }} />Faible <i style={{ background: '#ee8a22' }} />Moyen <i style={{ background: '#b3202a' }} />Fort</span>
      </div> : <p className="location-help"><a href="/rga/" target="_blank" rel="noopener noreferrer">Ouvrir mon accès RGA dans CONNECT</a> pour afficher la superposition, puis revenir ici.</p>}
      {editing && <div className="property-map-edit" role="group" aria-label="Ajuster le point de visite">
        <p>Cliquez sur le bon bâtiment ou faites glisser le point bleu. La correction ne sera conservée qu’après validation.</p>
        <div className="form-grid two">
          <label className="field">Latitude du point<input type="number" step="0.0000001" min="-90" max="90" value={draft.lat}
            onChange={(event) => setDraft((prev) => ({ ...prev, lat: event.target.value }))} /></label>
          <label className="field">Longitude du point<input type="number" step="0.0000001" min="-180" max="180" value={draft.lon}
            onChange={(event) => setDraft((prev) => ({ ...prev, lon: event.target.value }))} /></label>
        </div>
        <p>La validation actualise cadastre, PLU et risques, et invalide l’ancien relevé de relief. Vos notes sont conservées, à revérifier. Le lieu devra être confirmé à nouveau.</p>
        <div className="property-map-actions">
          <button className="button primary" type="button" disabled={!changed} onClick={() => { onMovePoint(Number(draft.lon), Number(draft.lat)); setDraft(null); }}>Utiliser ce point</button>
          <button className="button ghost" type="button" onClick={() => setDraft(null)}>Annuler le déplacement</button>
        </div>
      </div>}
      <CadastralMap lon={lon} lat={lat} mode={mode} revision={revision} editing={editing} draft={draft} rga={rga && rgaAllowed} rgaOpacity={rgaOpacity}
        onPointChange={(nextLon, nextLat) => setDraft({ lon: nextLon, lat: nextLat })} />
      <div className="property-map-legend"><span><i className="property-legend-point" /> Bien recherché</span><span><i className="property-legend-parcel" /> Parcelles cadastrales</span>
        <a href={buildIgnMapUrl(lon, lat)} target="_blank" rel="noopener noreferrer">Ouvrir le plan IGN <ExternalLink size={13} /></a>
      </div>
      <div className="property-map-confirmation">
        <p>{confirmed ? 'Le client a confirmé le lieu de la visite.' : 'Vérifiez le repère avec le client, puis confirmez le bien.'}</p>
        <div className="property-map-actions">
          <button className="button primary" type="button" disabled={confirmed || editing} onClick={() => confirm(true)}><Check size={18} /> {confirmed ? 'Bien confirmé' : 'Confirmer ce bien'}</button>
          <button className="button ghost" type="button" onClick={() => { confirm(false); onCorrectAddress(); }}><Pencil size={17} /> Corriger l’adresse</button>
          {confirmed && <button className="property-map-undo" type="button" onClick={() => confirm(false)}>Annuler la confirmation</button>}
        </div>
      </div>
      {report.localisation?.point_manuel && <p className="location-help">Point ajusté manuellement : vérifiez les notes d’urbanisme, l’orientation et les ressources déjà retenues. Relancez « Étudier le relief » si nécessaire.</p>}
      <p className="location-help">Déplacer la carte ne change pas l’adresse du dossier. Repérage indicatif, sans valeur de bornage. Les règles du PLU restent consultables avec « Carte PLU ».</p>
    </section>
  );
}
