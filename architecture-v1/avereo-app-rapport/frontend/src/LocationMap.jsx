import React, { useState } from 'react';
import { buildIgnMapUrl, locationConfirmed } from './locationMap.js';

export default function LocationMap({ report, setReport }) {
  const [revision, setRevision] = useState(0);
  const mapUrl = buildIgnMapUrl(report.cadastre.lon, report.cadastre.lat);
  if (!mapUrl) return null;
  const confirmed = locationConfirmed(report);

  return (
    <section className="location-map" aria-labelledby="location-title">
      <h3 id="location-title">Vérifier le lieu avec le client</h3>
      <p><strong>Adresse du dossier :</strong> {report.adresse_logement}</p>
      <p><strong>Adresse trouvée :</strong> {report.localisation?.adresse_trouvee || 'Adresse non conservée dans cet ancien dossier ; vérifiez le repère.'}</p>
      <iframe key={`${mapUrl}-${revision}`} src={mapUrl} title="Plan IGN du lieu de visite"
        loading="lazy" referrerPolicy="no-referrer" allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" />
      <div className="toolbar">
        <button type="button" className="button ghost" onClick={() => setRevision((value) => value + 1)}>Recentrer sur le lieu recherché</button>
        <a className="button ghost" href={mapUrl} target="_blank" rel="noopener noreferrer">Ouvrir le plan sur cartes.gouv.fr</a>
      </div>
      <p className="location-help">Le repère correspond aux coordonnées recherchées. Déplacer la carte ne change pas le lieu du dossier. Si ce n'est pas le bon bien, corrigez l'adresse dans « Dossier », puis relancez la recherche.</p>
      <label className="inline-confirmation">
        <input type="checkbox" checked={confirmed} onChange={(event) => {
          const checked = event.target.checked;
          setReport((prev) => ({ ...prev, localisation: {
            ...prev.localisation,
            confirmation: checked ? { adresse: prev.adresse_logement, lon: prev.cadastre.lon, lat: prev.cadastre.lat, date: new Date().toISOString() } : null,
          } }));
        }} />
        Le client confirme que le repère correspond au bien visité.
      </label>
      <p className="location-help">{confirmed ? 'Lieu confirmé pour cette adresse. ' : ''}Repérage géographique, sans validation juridique de la parcelle. Carte IGN externe : connexion Internet nécessaire. Si elle ne s'affiche pas, utilisez le lien ci-dessus.</p>
    </section>
  );
}
