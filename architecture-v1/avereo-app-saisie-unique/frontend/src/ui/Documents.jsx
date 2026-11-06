// Panneau des documents : dernière modification, onglets des documents avec leur état, aperçu, journal.
import { useMemo, useRef } from 'react';
import { DOCUMENTS } from '../config/documents.js';
import { documentsConcernes, planDuDocument, signalements, statutDocument } from '../lib/documents.js';
import { ENTREES_AFFICHEES } from '../lib/journal.js';
import { Apercu } from './Apercu.jsx';
import { formaterJournal, useActions } from './contexte.js';

function Modification({ item }) {
  return <li>{item.libelle} : {formaterJournal(item, item.de)} → {formaterJournal(item, item.vers)}</li>;
}

function DerniereModification({ derniere }) {
  if (!derniere) {
    return (
      <div className="last" aria-live="polite">
        <h3>Dernière modification</h3>
        <p className="muted">Aucune pour l’instant. Modifiez un champ de la fiche : les documents concernés se mettent à jour et sont signalés.</p>
      </div>
    );
  }
  const imp = documentsConcernes(derniere);
  const non = DOCUMENTS.filter((d) => !imp.includes(d));
  return (
    <div className="last" aria-live="polite">
      <h3>Dernière modification · {derniere.heure}</h3>
      <p className="ttl">{derniere.titre}</p>
      <ul>{derniere.items.map((i, k) => <Modification key={k} item={i} />)}</ul>
      <p>
        <strong>Mis à jour automatiquement :</strong> {imp.length ? imp.map((d) => d.onglet).join(', ') : 'aucun document'}.
        {non.length > 0 && <span className="muted"> Non concernés : {non.length} document{non.length > 1 ? 's' : ''}.</span>}
      </p>
    </div>
  );
}

function Journal({ journal }) {
  return (
    <details className="journal">
      <summary>Journal des modifications ({journal.length})</summary>
      {!journal.length && <p className="muted">Le journal se remplit à chaque modification.</p>}
      {journal.length > 0 && (
        <ol>
          {journal.slice(0, ENTREES_AFFICHEES).map((e) => {
            const im = documentsConcernes(e);
            return (
              <li key={`${e.t}-${e.titre}`}>
                <span className="when">{e.heure}</span>
                <div>{e.titre}</div>
                <ul>{e.items.map((i, k) => <Modification key={k} item={i} />)}</ul>
                <div className="muted">Documents concernés : {im.length ? im.map((d) => d.onglet).join(', ') : 'aucun'}</div>
              </li>
            );
          })}
        </ol>
      )}
      {journal.length > ENTREES_AFFICHEES && <p className="muted">Les {ENTREES_AFFICHEES} entrées les plus récentes sont affichées.</p>}
    </details>
  );
}

export function PanneauDocuments({ ctx, ui }) {
  const actions = useActions();
  const { dossier } = ctx;
  const derniere = ui.derniere[dossier.id] || null;
  const refs = useRef({});
  const etats = useMemo(() => Object.fromEntries(DOCUMENTS.map((d) => {
    const { planId } = planDuDocument(d, dossier, ui.planDoc[d.id]);
    const s = signalements(dossier, d, planId, ctx.calc);
    return [d.id, { planId, s, statut: statutDocument(s) }];
  })), [dossier, ctx.calc, ui.planDoc]);
  const imp = documentsConcernes(derniere);
  const actif = DOCUMENTS.find((d) => d.id === ui.docActif) || DOCUMENTS[0];
  const pd = planDuDocument(actif, dossier, ui.planDoc[actif.id]);
  const clavier = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const ids = DOCUMENTS.map((d) => d.id);
    let i = ids.indexOf(actif.id);
    i = (i + (e.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length;
    actions.setDoc(ids[i]);
    refs.current[ids[i]]?.focus();
    e.preventDefault();
  };
  const onglet = (d) => {
    const sel = d.id === actif.id;
    const e = etats[d.id];
    const ok = e.statut === '✓ Complet';
    return (
      <button key={d.id} type="button" role="tab" id={`doc-${d.id}`} aria-controls="feuille" aria-selected={sel} tabIndex={sel ? 0 : -1}
        className={`tab${ok ? ' tab-ok' : ''}`} ref={(el) => { refs.current[d.id] = el; }} onClick={() => actions.setDoc(d.id)}>
        <span className="t-title">{d.onglet}</span>
        <span className="t-status">{e.statut}</span>
        {imp.includes(d) && <span className="upd">mis à jour</span>}
      </button>
    );
  };
  return (
    <section className="docs" aria-labelledby="h-docs">
      <h2 id="h-docs" className="sr-only">Documents pré-remplis</h2>
      <DerniereModification derniere={derniere} />
      <div role="tablist" aria-label="Documents pré-remplis" className="onglets-docs" onKeyDown={clavier}>
        <p className="tabs-titre">Documents prioritaires</p>
        <div className="tabs">{DOCUMENTS.filter((d) => d.prioritaire).map(onglet)}</div>
        <p className="tabs-titre">Autres documents</p>
        <div className="tabs">{DOCUMENTS.filter((d) => !d.prioritaire).map(onglet)}</div>
      </div>
      <article className="sheet" id="feuille" role="tabpanel" aria-labelledby={`doc-${actif.id}`}>
        <div className="sheet-tete">
          <div>
            <h3>{actif.titre}</h3>
            <p className="sub">{actif.reference} · aperçu pré-rempli depuis la fiche{actif.plans.length ? ` · plan ${pd.planId === 'devis' ? 'Devis' : 'Factures'}` : ''}</p>
          </div>
          <div className="sheet-actions">
            {pd.choixPossibles.length > 1 && (
              <div className="segments" role="group" aria-label="Plan lu par le document">
                {pd.choixPossibles.map((p) => (
                  <button key={p} type="button" className="segment" aria-pressed={pd.planId === p} onClick={() => actions.setPlanDoc(actif.id, p)}>{p === 'devis' ? 'Devis' : 'Factures'}</button>
                ))}
              </div>
            )}
            <button type="button" className="btn btn-petit" onClick={() => window.print()}>Imprimer</button>
          </div>
        </div>
        <Apercu doc={actif} ctx={ctx} planId={pd.planId} derniere={derniere} signalement={etats[actif.id].s} />
      </article>
      <Journal journal={dossier.journal} />
    </section>
  );
}
