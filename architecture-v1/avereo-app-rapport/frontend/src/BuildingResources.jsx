import React, { useState } from 'react';
import { BookOpen, Building2, Copy, ExternalLink } from 'lucide-react';
import { locationConfirmed } from './locationMap.js';
import { BUILDING_SOURCES, confirmBuildingResource, normalizeBuildingResources, resourceMatchesLocation, safeBuildingResourceUrl } from './buildingResources.js';

export default function BuildingResources({ report, setReport }) {
  const [copyStatus, setCopyStatus] = useState('');
  const confirmed = locationConfirmed(report);
  const resources = normalizeBuildingResources(report.ressources_batiment);
  const address = report.adresse_logement;
  const update = (key, field, value) => setReport((prev) => {
    const saved = normalizeBuildingResources(prev.ressources_batiment);
    return { ...prev, ressources_batiment: { ...saved, [key]: {
      ...saved[key], [field]: value, ...(field === 'url' ? { location: null } : {}),
    } } };
  });
  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopyStatus('Adresse copiée. Collez-la dans la recherche GoRénove.');
    } catch { setCopyStatus('Copie indisponible : sélectionnez puis copiez l’adresse affichée.'); }
  };
  return <section className="building-resources" aria-labelledby="building-resources-title">
    <h3 id="building-resources-title">Informations déjà disponibles</h3>
    <p>Consultez les sources, puis gardez les liens utiles au dossier. Aucun résultat n’est importé automatiquement.</p>
    {!confirmed && <p className="status-line warning">Confirmez d’abord le bien dans Cadastre pour consulter et rattacher ses ressources. Les notes déjà saisies restent conservées.</p>}
    {confirmed && <div className="building-resource-address">
      <strong>{address}</strong>
      {report.localisation?.adresse_trouvee && report.localisation.adresse_trouvee !== address
        && <p>Repère géocodé : {report.localisation.adresse_trouvee}</p>}
      <button type="button" className="button ghost" onClick={copyAddress}><Copy size={16} /> Copier l’adresse</button>
      <p role="status">{copyStatus}</p>
    </div>}
    <div className="building-resource-grid">
      {BUILDING_SOURCES.map(({ key, name, description, links }, index) => {
        const item = resources[key];
        const url = safeBuildingResourceUrl(key, item.url);
        const attached = Boolean(url && resourceMatchesLocation(report, item));
        return <article className="building-resource-card" key={key}>
          <h4>{key === 'gorenove' ? <Building2 size={23} /> : <BookOpen size={23} />} {index + 1}. {name}</h4>
          <p>{description}</p>
          <div className="building-resource-links">
            {links.map(([label, href]) => confirmed
              ? <a className="button secondary" key={href} href={href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{label} <ExternalLink size={15} /></a>
              : <button key={href} className="button secondary" type="button" disabled>{label} <ExternalLink size={15} /></button>)}
          </div>
          <p className="location-help">{key === 'gorenove'
            ? 'Copiez l’adresse, recherchez-la sur GoRénove et vérifiez le bâtiment. Accès ponctuel OPEN limité ; conditions et offres du site applicables.'
            : 'Choisissez selon le type, l’époque et les caractéristiques du bâti. Une typologie n’est pas un diagnostic de ce logement.'}</p>
          <details open={item.url || item.notes ? true : undefined}>
            <summary>Conserver une fiche / des notes</summary>
            <label className="field">Lien de la fiche {name}
              <input type="url" value={item.url} maxLength={4000} placeholder={key === 'gorenove' ? 'https://gorenove.fr/fiche-batiment?id=…' : 'https://www.proreno.fr/documents/…'}
                onChange={(event) => update(key, 'url', event.target.value)} aria-invalid={Boolean(item.url && !url)} />
            </label>
            {item.url && !url && <p role="alert">Lien non reconnu. Utilisez une fiche HTTPS du site {name}{key === 'proreno' ? ' ou son PDF officiel' : ''}.</p>}
            <label className="field">Date de consultation {name}<input type="date" value={item.consultedOn} onChange={(event) => update(key, 'consultedOn', event.target.value)} /></label>
            <button type="button" className="button primary" disabled={!confirmed || !url} onClick={() => setReport((prev) => confirmBuildingResource(prev, key, item.consultedOn || new Date().toISOString().slice(0, 10)))}>
              {key === 'gorenove' ? 'Confirmer la fiche de ce bâtiment' : 'Retenir cette ressource pour ce bien'}
            </button>
            <p role="status">{attached ? 'Ressource rattachée au bien confirmé. Correspondance déclarée par le professionnel.'
              : item.url ? 'Rattachement à vérifier : contrôlez la fiche avant de la confirmer pour ce bien.' : 'Aucune fiche retenue.'}</p>
            {url && confirmed && <a href={url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{attached ? 'Ouvrir la fiche retenue' : 'Vérifier la fiche avant rattachement'} <ExternalLink size={14} /></a>}
            <label className="field">Notes de consultation {name}<textarea rows={3} value={item.notes} maxLength={8000}
              placeholder="Donnée publiée ou simulée, source/date ; éléments restant à vérifier sur place…"
              onChange={(event) => update(key, 'notes', event.target.value)} /></label>
          </details>
        </article>;
      })}
    </div>
    <p className="location-help">Ouverture dans un nouvel onglet. Aucun nom, email, entretien ou photo n’est envoyé par Rapport. L’adresse n’est transmise à GoRénove que si vous l’y collez. Une source indisponible n’empêche pas la visite ni la prise de notes.</p>
  </section>;
}
