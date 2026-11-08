// Vues de l'application : liste des dossiers, dossier ouvert, ratios, paramètres ; dialogues de confirmation.
import { useEffect, useMemo, useRef, useState } from 'react';
import { liste } from '../config/listes.js';
import { RATIOS } from '../config/ratios.js';
import { CHAMP, TYPES } from '../lib/modele.js';
import { calculerDossier } from '../lib/calculs.js';
import { calculerRatios } from '../lib/ratios.js';
import { eur, fmtDate } from '../lib/nombres.js';
import { nomFichierSauvegarde } from '../lib/sauvegarde.js';
import { Champ } from './Champ.jsx';
import { OngletsFiche, PanneauFiche } from './Fiche.jsx';
import { PanneauDocuments } from './Documents.jsx';
import { useActions } from './contexte.js';

const libType = (t) => TYPES.find((x) => x.id === t)?.libelle || t;

export function exporterDossiers(actions) {
    const blob = new Blob([actions.exporter()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomFichierSauvegarde();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Sauvegarde dans un fichier du poste (téléchargement) et import, sans aucun échange réseau.
function Sauvegarde({ message }) {
  const actions = useActions();
  const fichier = useRef(null);
  const importer = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (f) actions.importer(await f.text());
  };
  return (
    <div className="sauvegarde">
      <div className="toolbar">
        <button type="button" className="btn" onClick={() => exporterDossiers(actions)}>Exporter les dossiers</button>
        <button type="button" className="btn" onClick={() => fichier.current?.click()}>Importer une sauvegarde…</button>
        <input ref={fichier} type="file" accept=".json,application/json" className="sr-only" tabIndex={-1} aria-label="Fichier de sauvegarde à importer" onChange={importer} />
      </div>
      <p className="hint">La sauvegarde est un fichier enregistré sur ce poste. L’import ajoute ses dossiers sans remplacer ceux déjà présents.</p>
      {message && <p className={message.type === 'erreur' ? 'alerte' : 'status ok'} role="status">{message.texte}</p>}
    </div>
  );
}

export function ListeDossiers({ donnees, ui }) {
  const actions = useActions();
  const [nom, setNom] = useState('');
  const [type, setType] = useState('energie');
  const dossiers = donnees.ordre.map((id) => donnees.dossiers[id]).filter(Boolean);
  const filtres = ui.filtreStatut ? dossiers.filter((d) => (d.valeurs.dos_statut || '') === ui.filtreStatut) : dossiers;
  const aExemple = dossiers.some((d) => d.exemple);
  return (
    <section className="panneau" aria-labelledby="h-liste">
      <div className="titre-ligne">
        <h2 id="h-liste">Dossiers</h2>
        <p className="muted">{dossiers.length} dossier{dossiers.length > 1 ? 's' : ''}, enregistrés dans ce navigateur.</p>
      </div>
      <form className="nouveau" onSubmit={(e) => { e.preventDefault(); actions.creerDossier({ type, nom: nom.trim() }); setNom(''); }}>
        <div>
          <label className="lbl" htmlFor="n-nom">Nom du nouveau dossier</label>
          <input id="n-nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Par exemple : Dossier Exemple 2026" autoComplete="off" />
        </div>
        <div>
          <label className="lbl" htmlFor="n-type">Type de dossier</label>
          <select id="n-type" value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map((t) => <option key={t.id} value={t.id}>{t.libelle}</option>)}</select>
        </div>
        <button type="submit" className="btn btn-primary">Créer le dossier</button>
        {!aExemple && <button type="button" className="btn" onClick={() => actions.creerExemple()}>Ajouter le dossier d’exemple</button>}
      </form>
      <Sauvegarde message={ui.messageSauvegarde} />
      <div className="filtre">
        <label className="lbl" htmlFor="filtre-statut">Filtrer par statut</label>
        <select id="filtre-statut" value={ui.filtreStatut} onChange={(e) => actions.setFiltreStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          {liste('dos_statut').valeurs.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="muted" aria-live="polite">{filtres.length} affiché{filtres.length > 1 ? 's' : ''}</span>
      </div>
      {!filtres.length ? (
        <p className="muted">Aucun dossier{ui.filtreStatut ? ' pour ce statut' : ''}.</p>
      ) : (
        <div className="scroll">
          <table className="lines liste-dossiers">
            <thead><tr><th scope="col">Dossier</th><th scope="col">Propriétaire</th><th scope="col">Type</th><th scope="col">Statut</th><th scope="col">Programme</th><th scope="col">Année</th><th scope="col">Alarme</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {filtres.map((d) => (
                <tr key={d.id}>
                  <td><button type="button" className="lien" onClick={() => actions.ouvrir(d.id)}>{d.valeurs.dos_nom || `Dossier sans nom (${d.id})`}</button>{d.exemple && <span className="badge">exemple</span>}</td>
                  <td>{d.valeurs.prop_nom || '—'}</td>
                  <td>{libType(d.type)}</td>
                  <td>{d.valeurs.dos_statut || '—'}</td>
                  <td>{d.valeurs.dos_programme || '—'}</td>
                  <td>{d.valeurs.dos_annee || '—'}</td>
                  <td>{d.valeurs.dos_alarme === 'oui' ? <span className="alarme">⚑ Oui</span> : d.valeurs.dos_alarme === 'non' ? 'Non' : '—'}</td>
                  <td><button type="button" className="rm" onClick={() => actions.demanderConfirmation({ type: 'supprimer', dossierId: d.id })} aria-label={`Supprimer le dossier ${d.valeurs.dos_nom || d.id}`}>Supprimer</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SuggestionDepot({ suggestion, dossier }) {
  const actions = useActions();
  const [date, setDate] = useState(suggestion.date);
  const [statut, setStatut] = useState(false);
  const [avecDate, setAvecDate] = useState(!dossier.valeurs.dos_date_depot);
  return (
    <div className="suggestion" role="status">
      <p><strong>Plan Devis figé au dépôt.</strong> Le plan Factures a été créé par duplication. Vous pouvez aussi, sans obligation :</p>
      <div className="suggestion-champs">
        <label className="case"><input type="checkbox" checked={avecDate} onChange={(e) => setAvecDate(e.target.checked)} /> <span>Renseigner la date de dépôt du dossier</span></label>
        <label className="sr-only" htmlFor="sug-date">Date de dépôt</label>
        <input id="sug-date" type="date" value={date} disabled={!avecDate} onChange={(e) => setDate(e.target.value)} />
        <label className="case"><input type="checkbox" checked={statut} onChange={(e) => setStatut(e.target.checked)} /> <span>Passer le statut à « Déposer »</span></label>
      </div>
      <div className="toolbar">
        <button type="button" className="btn btn-primary" onClick={() => actions.appliquerSuggestionDepot(dossier.id, { date: avecDate ? date : null, statut })}>Appliquer</button>
        <button type="button" className="btn" onClick={() => actions.fermerSuggestion()}>Ne rien changer</button>
      </div>
    </div>
  );
}

export function VueDossier({ dossier, donnees, ui }) {
  const actions = useActions();
  const parametres = donnees.parametres;
  const calc = useMemo(() => calculerDossier(dossier, parametres), [dossier, parametres]);
  const ctx = useMemo(() => ({ dossier, calc, parametres }), [dossier, calc, parametres]);
  const planVue = dossier.plans[ui.planVue] ? ui.planVue : 'devis';
  return (
    <>
      <div className="dossier-tete">
        <button type="button" className="btn btn-petit" onClick={() => actions.afficher('liste')}>← Liste des dossiers</button>
        <div className="dossier-titre">
          <h2>{dossier.valeurs.dos_nom || 'Dossier sans nom'}</h2>
          <p className="muted">
            {dossier.valeurs.prop_nom || 'Propriétaire à renseigner'} · statut : {dossier.valeurs.dos_statut || '—'}
            {dossier.fige ? ` · plan Devis figé le ${fmtDate(dossier.fige.date)}` : ''}
          </p>
        </div>
        <div>
          <label className="lbl" htmlFor="type-dossier">Type de dossier</label>
          <select id="type-dossier" value={dossier.type} onChange={(e) => actions.changerType(dossier.id, e.target.value)}>
            {TYPES.map((t) => <option key={t.id} value={t.id}>{t.libelle}</option>)}
          </select>
        </div>
      </div>
      {dossier.exemple && (
        <div className="toolbar">
          <button type="button" className="btn btn-primary" onClick={() => actions.changementAvis(dossier.id)}>
            {dossier.variante ? 'Revenir au choix initial' : 'Simuler un changement d’avis du propriétaire'}
          </button>
          <button type="button" className="btn" onClick={() => actions.demanderConfirmation({ type: 'retablir', dossierId: dossier.id })}>Rétablir l’exemple</button>
          <span className="hint">Le changement d’avis modifie le poste 2 : regardez quels documents bougent.</span>
        </div>
      )}
      {ui.suggestionDepot && ui.suggestionDepot.dossierId === dossier.id && <SuggestionDepot suggestion={ui.suggestionDepot} dossier={dossier} />}
      <main className="grid">
        <section className="form-panel" aria-labelledby="h-fiche">
          <h2 id="h-fiche">Fiche unique</h2>
          <OngletsFiche dossier={dossier} onglet={ui.onglet} planId={planVue} />
          <form autoComplete="off" noValidate onSubmit={(e) => e.preventDefault()}>
            <PanneauFiche ctx={ctx} onglet={ui.onglet} planId={planVue} />
          </form>
        </section>
        <PanneauDocuments ctx={ctx} ui={ui} />
      </main>
    </>
  );
}

function TableRatios({ titre, lignes }) {
  return (
    <section className="rubrique">
      <h3>{titre}</h3>
      {!lignes.length ? <p className="muted">Aucun poste de travaux saisi.</p> : (
        <div className="scroll">
          <table className="lines">
            <thead><tr><th scope="col">Regroupement</th><th className="num" scope="col">Postes</th><th className="num" scope="col">Sans surface (exclus)</th>
              {RATIOS.mesures.map((m) => <th key={m.id} className="num" scope="col">{m.libelle}</th>)}</tr></thead>
            <tbody>
              {lignes.map((l) => (
                <tr key={l.cle}>
                  <td>{l.cle}</td><td className="num">{l.postes}</td><td className="num">{l.sansSurface}</td>
                  {RATIOS.mesures.map((m) => <td key={m.id} className="num">{l.moyennes[m.id] ? <>{eur(l.moyennes[m.id].valeur)} <span className="muted">({l.moyennes[m.id].retenus} poste{l.moyennes[m.id].retenus > 1 ? 's' : ''})</span></> : '—'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function VueRatios({ donnees }) {
  const dossiers = donnees.ordre.map((id) => donnees.dossiers[id]).filter(Boolean);
  const r = useMemo(() => calculerRatios(dossiers), [donnees]);
  return (
    <section className="panneau" aria-labelledby="h-ratios">
      <div className="titre-ligne">
        <h2 id="h-ratios">Ratios de coûts</h2>
        <p className="muted">{dossiers.length > 1 ? `Calculés sur les ${dossiers.length} dossiers de ce navigateur.` : `Calculés sur ${dossiers.length} dossier de ce navigateur.`}</p>
      </div>
      <p className="notice">
        Prix au m² d’un poste = montant du poste ÷ surface. La valeur affichée est la moyenne simple de ces prix sur les postes du regroupement.
        Un poste sans surface est exclu du calcul et compté à part. Plan lu : les factures quand le plan Devis est figé, le devis sinon.
      </p>
      {RATIOS.regroupements.map((g) => <TableRatios key={g.id} titre={g.libelle} lignes={r[g.id]} />)}
    </section>
  );
}

export function VueParametres({ donnees }) {
  const actions = useActions();
  const p = donnees.parametres;
  return (
    <section className="panneau" aria-labelledby="h-param">
      <div className="titre-ligne"><h2 id="h-param">Paramètres</h2><p className="muted">Communs à tous les dossiers de ce navigateur.</p></div>
      <fieldset>
        <legend>Organisation accompagnatrice</legend>
        <div className="fields">
          {['org_raison_sociale', 'org_siret', 'org_lieu'].map((id) => (
            <Champ key={id} champ={CHAMP[id]} valeur={p[id]} onChange={(v) => actions.setParametre(id, v)} />
          ))}
        </div>
        <p className="hint">Reprises dans les attestations de travaux et le rapport de fin d’accompagnement.</p>
      </fieldset>
      <fieldset>
        <legend>Base de l’équilibre du plan de financement</legend>
        <div className="radios">
          <label className="case"><input type="radio" name="base" checked={p.baseEquilibre !== 'ttc'} onChange={() => actions.setParametre('baseEquilibre', 'ht')} /> <span>Montant HT des dépenses (comme la maquette)</span></label>
          <label className="case"><input type="radio" name="base" checked={p.baseEquilibre === 'ttc'} onChange={() => actions.setParametre('baseEquilibre', 'ttc')} /> <span>Montant TTC des dépenses</span></label>
        </div>
        <p className="hint">Le reste à charge, le solde du projet et le message d’équilibre se calculent sur cette base.</p>
      </fieldset>
      <fieldset>
        <legend>Données</legend>
        <p>Les dossiers sont enregistrés dans ce navigateur seulement (stockage local), sur ce poste. Rien n’est envoyé sur le réseau. Vider les données du navigateur efface les dossiers : exportez-les régulièrement depuis la liste des dossiers (« Exporter les dossiers »).</p>
      </fieldset>
    </section>
  );
}

export function Confirmation({ confirmation, donnees }) {
  const actions = useActions();
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, [confirmation]);
  if (!confirmation) return null;
  const d = donnees.dossiers[confirmation.dossierId];
  if (!d) return null;
  const textes = {
    figer: ['Figer le plan Devis au dépôt ?', 'Le plan Devis ne sera plus modifiable. Le plan Factures est créé par duplication ; les écarts sont ensuite calculés. Cette action ne peut pas être annulée dans l’outil.', 'Figer au dépôt', () => actions.figerDevis(d.id)],
    supprimer: [`Supprimer le dossier « ${d.valeurs.dos_nom || d.id} » ?`, 'Le dossier et son journal sont effacés de ce navigateur. Cette action ne peut pas être annulée.', 'Supprimer', () => actions.supprimer(d.id)],
    retablir: ['Rétablir le dossier d’exemple ?', 'Les modifications du dossier d’exemple et son journal sont remplacées par les données de départ.', 'Rétablir', () => actions.retablirExemple(d.id)],
  }[confirmation.type];
  const fermer = () => actions.demanderConfirmation(null);
  return (
    <div className="voile" onKeyDown={(e) => { if (e.key === 'Escape') fermer(); }}>
      <div className="dialogue" role="alertdialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-d">
        <h2 id="dlg-t">{textes[0]}</h2>
        <p id="dlg-d">{textes[1]}</p>
        <div className="toolbar">
          <button type="button" className="btn btn-primary" onClick={() => { textes[3](); fermer(); }}>{textes[2]}</button>
          <button type="button" className="btn" ref={ref} onClick={fermer}>Annuler</button>
        </div>
      </div>
    </div>
  );
}
