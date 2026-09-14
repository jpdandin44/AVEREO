import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Map, Image, Check, Pencil, LocateFixed, ExternalLink, Loader2 } from 'lucide-react';
import { buildIgnMapUrl, buildIgnTileUrl, locationConfirmed, validLocation } from './locationMap.js';

export function CadastralMap({ lon, lat, mode, revision }) {
  const container = useRef(null);
  const [tiles, setTiles] = useState({ base: 'loading', cadastre: 'loading' });

  useEffect(() => {
    let active = true;
    setTiles({ base: 'loading', cadastre: 'loading' });
    const map = L.map(container.current, { scrollWheelZoom: false, minZoom: 3, maxZoom: 20, zoomControl: false })
      .setView([Number(lat), Number(lon)], 18);
    L.control.zoom({ zoomInTitle: 'Zoomer', zoomOutTitle: 'Dézoomer' }).addTo(map);
    L.control.scale({ imperial: false }).addTo(map);
    const addTiles = (layer, name, attribution) => {
      let failed = false;
      L.tileLayer(buildIgnTileUrl(layer), {
        maxNativeZoom: 19, maxZoom: 20, noWrap: true, keepBuffer: 1,
        referrerPolicy: 'no-referrer', attribution,
      }).on('tileerror', () => {
        failed = true;
        if (active) setTiles((prev) => ({ ...prev, [name]: 'error' }));
      }).on('load', () => {
        if (active && !failed) setTiles((prev) => ({ ...prev, [name]: 'ready' }));
      }).addTo(map);
    };
    addTiles(mode === 'aerial' ? 'aerial' : 'plan', 'base', '<a href="https://cartes.gouv.fr/" target="_blank" rel="noopener noreferrer">© IGN</a>');
    addTiles('cadastre', 'cadastre', 'Parcellaire Express (PCI) © IGN / DGFiP');
    L.marker([Number(lat), Number(lon)], {
      icon: L.divIcon({ className: 'property-map-marker', html: '<span></span>', iconSize: [30, 38], iconAnchor: [15, 38] }),
      title: 'Bien à vérifier', alt: 'Repère du bien recherché', draggable: false,
    }).addTo(map).bindTooltip('Bien à vérifier', { direction: 'top', offset: [0, -35] });
    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(container.current);
    const timeout = setTimeout(() => {
      if (active) setTiles((prev) => Object.fromEntries(Object.entries(prev).map(([key, value]) => [key, value === 'loading' ? 'error' : value])));
    }, 15000);
    return () => {
      active = false;
      clearTimeout(timeout);
      resize.disconnect();
      map.remove();
    };
  }, [lon, lat, mode, revision]);

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
    </>
  );
}

export default function LocationMap({ report, setReport, onCorrectAddress }) {
  const [mode, setMode] = useState('cadastre');
  const [revision, setRevision] = useState(0);
  const lon = report.cadastre?.lon;
  const lat = report.cadastre?.lat;
  if (!validLocation(lon, lat)) return null;
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
      </div>
      <div className="property-map-toolbar">
        <div className="property-map-switch" role="group" aria-label="Fond de carte">
          <button type="button" aria-pressed={mode === 'cadastre'} onClick={() => setMode('cadastre')}><Map size={17} /> Cadastre</button>
          <button type="button" aria-pressed={mode === 'aerial'} onClick={() => setMode('aerial')}><Image size={17} /> Vue aérienne</button>
        </div>
        <button className="property-map-recenter" type="button" onClick={() => setRevision((value) => value + 1)}><LocateFixed size={17} /> Recentrer</button>
      </div>
      <CadastralMap lon={lon} lat={lat} mode={mode} revision={revision} />
      <div className="property-map-legend"><span><i className="property-legend-point" /> Bien recherché</span><span><i className="property-legend-parcel" /> Parcelles cadastrales</span>
        <a href={buildIgnMapUrl(lon, lat)} target="_blank" rel="noopener noreferrer">Ouvrir le plan IGN <ExternalLink size={13} /></a>
      </div>
      <div className="property-map-confirmation">
        <p>{confirmed ? 'Le client a confirmé le lieu de la visite.' : 'Vérifiez le repère avec le client, puis confirmez le bien.'}</p>
        <div className="property-map-actions">
          <button className="button primary" type="button" disabled={confirmed} onClick={() => confirm(true)}><Check size={18} /> {confirmed ? 'Bien confirmé' : 'Confirmer ce bien'}</button>
          <button className="button ghost" type="button" onClick={() => { confirm(false); onCorrectAddress(); }}><Pencil size={17} /> Corriger l’adresse</button>
          {confirmed && <button className="property-map-undo" type="button" onClick={() => confirm(false)}>Annuler la confirmation</button>}
        </div>
      </div>
      <p className="location-help">Déplacer la carte ne change pas l’adresse du dossier. Repérage indicatif, sans valeur de bornage. Les règles du PLU restent consultables avec « Carte PLU ».</p>
    </section>
  );
}
