// Coque de l'application : bandeau « Données fictives » permanent (T21), navigation, vues.
import { ConfirmationDialogue } from './Dialogue.jsx';
import { useEffect } from 'react';
import { useMissionDossier } from '../../../../avereo-platform/shared/mission-dossier.js';
import { useActions, useStore } from './contexte.js';
import { exporterDossiers, ListeDossiers, VueDossier, VueParametres, VueRatios } from './Vues.jsx';

const NAV = [
  { id: 'liste', libelle: 'Dossiers' },
  { id: 'ratios', libelle: 'Ratios' },
  { id: 'parametres', libelle: 'Paramètres' },
];

export function App() {
  const donnees = useStore((s) => s.donnees);
  const ui = useStore((s) => s.ui);
  const actions = useActions();
  const dossier = ui.dossierId ? donnees.dossiers[ui.dossierId] : null;
  const vue = ui.vue === 'dossier' && !dossier ? 'liste' : ui.vue;
  const fiche = vue === 'dossier' ? dossier.valeurs : null;
  useMissionDossier(useEffect, fiche ? {label:'Dossier fictif · Saisie unique',fields:{
    referenceDossier:dossier.id, client:[fiche.prop_prenom,fiche.prop_nom].filter(Boolean).join(' '),
    email:fiche.prop_email, telephone:fiche.prop_telephone, adresseClient:fiche.prop_adresse_differente,
    adresseBien:[fiche.log_adresse,fiche.log_cp,fiche.log_commune].filter(Boolean).join(' '),
  }} : {label:'Mission fictive · Saisie unique',fields:{}});
  return (
    <>
      <p className="bandeau-fictif" role="note"><strong>Données fictives — ne saisir aucune donnée réelle.</strong></p>
      <div className="wrap">
        <div className="entete-ligne">
          <nav aria-label="Navigation principale" className="nav">
            {NAV.map((n) => (
              <button key={n.id} type="button" className="nav-lien" aria-current={vue === n.id || (n.id === 'liste' && vue === 'dossier') ? 'page' : undefined} onClick={() => actions.afficher(n.id)}>{n.libelle}</button>
            ))}
          </nav>
          <avereo-account-menu app-name="Saisie unique">
            <button slot="local-copy" data-avereo-save="local" data-avereo-proxy="" onClick={() => exporterDossiers(actions)}>Exporter les dossiers</button>
            <button slot="items" type="button" onClick={() => actions.afficher('liste')}>Mes dossiers locaux</button>
            <button slot="items" type="button" onClick={() => actions.afficher('parametres')}>Préférences</button>
          </avereo-account-menu>
        </div>
        {ui.erreurStockage && <p className="alerte" role="alert">{ui.erreurStockage}</p>}
        {vue === 'liste' && <ListeDossiers donnees={donnees} ui={ui} />}
        {vue === 'dossier' && dossier && <VueDossier dossier={dossier} donnees={donnees} ui={ui} />}
        {vue === 'ratios' && <VueRatios donnees={donnees} />}
        {vue === 'parametres' && <VueParametres donnees={donnees} />}
        <p className="foot">AVEREO UNI, version 1 sur données fictives. Les dossiers restent dans ce navigateur ; l’outil n’est relié à aucun service en ligne, dont Mon projet Anah.</p>
      </div>
      <ConfirmationDialogue />
    </>
  );
}
