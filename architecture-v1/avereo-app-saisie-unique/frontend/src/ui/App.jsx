// Coque de l'application : bandeau « Données fictives » permanent (T21), navigation, vues.
import { ConfirmationDialogue } from './Dialogue.jsx';
import { useActions, useStore } from './contexte.js';
import { ListeDossiers, VueDossier, VueParametres, VueRatios } from './Vues.jsx';

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
  return (
    <>
      <p className="bandeau-fictif" role="note"><strong>Données fictives — ne saisir aucune donnée réelle.</strong></p>
      <div className="wrap">
        <header className="top">
          <div className="rule" aria-hidden="true" />
          <div className="entete-ligne">
            <div>
              <p className="eyebrow"><span className="chip chip-v1">V1</span><span>AVEREO · outil complémentaire de l’interface actuelle</span></p>
              <h1>AVEREO UNI</h1>
              <p className="lead">Saisissez le dossier une seule fois : les documents se pré-remplissent et suivent chaque modification.</p>
            </div>
            <nav aria-label="Navigation principale" className="nav">
              {NAV.map((n) => (
                <button key={n.id} type="button" className="nav-lien" aria-current={vue === n.id || (n.id === 'liste' && vue === 'dossier') ? 'page' : undefined} onClick={() => actions.afficher(n.id)}>{n.libelle}</button>
              ))}
            </nav>
          </div>
          {ui.erreurStockage && <p className="alerte" role="alert">{ui.erreurStockage}</p>}
        </header>
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
