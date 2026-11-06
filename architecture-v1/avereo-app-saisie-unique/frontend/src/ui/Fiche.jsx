// Fiche unique : cinq onglets dans l'ordre de l'interface actuelle (E09, T23), groupes de champs pilotés par la
// configuration, plans Devis et Factures dans Financement, Énergie et Travaux (E04).
import { useRef } from 'react';
import { CHAMP, champApplicable, champsDuGroupe, groupesDeLOnglet, lignes, ONGLETS } from '../lib/modele.js';
import { progression } from '../lib/progression.js';
import { eur, fmtDate } from '../lib/nombres.js';
import { Badges, Champ } from './Champ.jsx';
import { lireValeur, useActions } from './contexte.js';

const ONGLETS_PLAN = new Set(['financement', 'energie', 'travaux']);
const SYMBOLE = { complet: '✓', partiel: '●', vide: '○', sans_objet: '—' };
const TEXTE = { complet: 'complet', partiel: 'en cours', vide: 'à remplir', sans_objet: 'sans champ de document' };

// Champs d'un poste affichés en premier ; les autres sont dans « Caractéristiques ».
const POSTE_PRINCIPAUX = ['pst_intitule', 'pst_travail', 'pst_localisation', 'pst_surface', 'pst_ht', 'pst_tva', 'pst_ttc', 'pst_eligible'];
const POSTE_CALCULES = ['pst_prix_ht_m2', 'pst_prix_ttc_m2'];

export function OngletsFiche({ dossier, onglet, planId }) {
  const actions = useActions();
  const refs = useRef({});
  const clavier = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const ids = ONGLETS.map((o) => o.id);
    let i = ids.indexOf(onglet);
    i = (i + (e.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length;
    actions.setOnglet(ids[i]);
    refs.current[ids[i]]?.focus();
    e.preventDefault();
  };
  return (
    <div className="onglets" role="tablist" aria-label="Onglets de la fiche" onKeyDown={clavier}>
      {ONGLETS.map((o) => {
        const p = progression(dossier, o.id, planId);
        const sel = o.id === onglet;
        return (
          <button key={o.id} type="button" role="tab" id={`onglet-${o.id}`} aria-controls="panneau-fiche" aria-selected={sel}
            tabIndex={sel ? 0 : -1} className={`onglet etat-${p.etat}`} ref={(el) => { refs.current[o.id] = el; }}
            onClick={() => actions.setOnglet(o.id)}>
            <span className="o-titre">{o.libelle}</span>
            <span className="o-etat" title={p.total ? `${p.remplis} champs utilisés par les documents remplis sur ${p.total} : ${TEXTE[p.etat]}` : TEXTE[p.etat]}>
              <span aria-hidden="true">{SYMBOLE[p.etat]}</span> {p.total ? `${p.remplis}/${p.total}` : ''}
              <span className="sr-only">{p.total ? ` champs de document remplis : ${TEXTE[p.etat]}` : TEXTE[p.etat]}</span>
            </span>
            <span className="o-barre" aria-hidden="true"><span style={{ width: `${p.total ? Math.round((p.remplis / p.total) * 100) : 0}%` }} /></span>
          </button>
        );
      })}
    </div>
  );
}

function BarrePlan({ dossier, planId }) {
  const actions = useActions();
  return (
    <div className="barre-plan">
      <div className="segments" role="group" aria-label="Plan affiché">
        <button type="button" className="segment" aria-pressed={planId === 'devis'} onClick={() => actions.setPlanVue('devis')}>
          Plan Devis{dossier.fige ? ` · figé le ${fmtDate(dossier.fige.date)}` : ''}
        </button>
        <button type="button" className="segment" aria-pressed={planId === 'factures'} disabled={!dossier.plans.factures}
          title={dossier.plans.factures ? undefined : 'Le plan Factures est créé par « Figer au dépôt ».'} onClick={() => actions.setPlanVue('factures')}>
          Plan Factures
        </button>
      </div>
      {!dossier.fige && (
        <button type="button" className="btn btn-accent" onClick={() => actions.demanderConfirmation({ type: 'figer', dossierId: dossier.id })}>
          Figer au dépôt…
        </button>
      )}
      <p className="hint">
        {dossier.fige
          ? (planId === 'devis' ? 'Le plan Devis est figé : il se consulte sans se modifier.' : 'Le plan Factures est modifiable ; les écarts avec le devis sont calculés.')
          : 'Le plan Devis est modifiable jusqu’au dépôt. « Figer au dépôt » le fige et crée le plan Factures par duplication.'}
      </p>
    </div>
  );
}

function Postes({ ctx, planId, lectureSeule }) {
  const actions = useActions();
  const { dossier, calc } = ctx;
  const postes = lignes(dossier, 'poste', planId);
  const cp = calc[planId];
  const ecarts = planId === 'factures' && calc.ecarts ? new Map(calc.ecarts.lignes.map((l) => [l.id, l])) : null;
  const visibles = (ids) => ids.map((id) => CHAMP[id]).filter((c) => c && champApplicable(c, dossier.type));
  const secondaires = Object.values(CHAMP).filter((c) => c.niveau === 'poste' && !POSTE_PRINCIPAUX.includes(c.id) && !POSTE_CALCULES.includes(c.id)
    && !['pst_ecart_ht', 'pst_ecart_ttc'].includes(c.id) && champApplicable(c, dossier.type));
  const ajouter = () => {
    const nid = actions.ajouterLigne(dossier.id, 'poste', planId);
    if (nid != null) setTimeout(() => document.getElementById(`p${nid}-pst_intitule`)?.focus(), 0);
  };
  return (
    <div className="postes">
      {!postes.length && <p className="hint">Aucun poste. Ajoutez au moins un poste de travaux.</p>}
      {postes.map((p, i) => {
        const e = ecarts && ecarts.get(p.id);
        return (
          <section key={p.id} className="poste" aria-label={`Poste ${i + 1}`}>
            <div className="poste-tete">
              <h4>Poste {i + 1}</h4>
              <button type="button" className="rm" disabled={lectureSeule} onClick={() => actions.supprimerLigne(dossier.id, 'poste', planId, p.id)} aria-label={`Supprimer le poste ${i + 1}`}>Supprimer</button>
            </div>
            <div className="fields">
              {visibles(POSTE_PRINCIPAUX).map((c) => (
                <Champ key={c.id} champ={c} idDom={`p${p.id}-${c.id}`} libelle={c.id === 'pst_intitule' ? 'Intitulé du poste' : c.libelle} large={c.id === 'pst_intitule'}
                  valeur={p.valeurs[c.id]} lectureSeule={lectureSeule}
                  onChange={(v) => actions.saisir(dossier.id, c.id, v, { niveau: 'poste', planId, ligneId: p.id })} />
              ))}
              {visibles(POSTE_CALCULES).map((c) => (
                <Champ key={c.id} champ={c} idDom={`p${p.id}-${c.id}`} calcul={cp?.parPoste[p.id]?.[c.id]} />
              ))}
            </div>
            {e && (
              <p className="ecart">Écart devis-facture : <strong>{e.pst_ecart_ht >= 0 ? '+' : ''}{eur(e.pst_ecart_ht)} HT</strong> · {e.pst_ecart_ttc >= 0 ? '+' : ''}{eur(e.pst_ecart_ttc)} TTC <span className="muted">(devis : {eur(e.devisHT)} HT ; {e.origine})</span></p>
            )}
            <details className="poste-details">
              <summary>Caractéristiques (matériau, performances, devis type)</summary>
              <div className="fields">
                {secondaires.map((c) => (
                  <Champ key={c.id} champ={c} idDom={`p${p.id}-${c.id}`} valeur={p.valeurs[c.id]} lectureSeule={lectureSeule} compact
                    onChange={(v) => actions.saisir(dossier.id, c.id, v, { niveau: 'poste', planId, ligneId: p.id })} />
                ))}
              </div>
            </details>
          </section>
        );
      })}
      <div className="postes-foot">
        <button type="button" className="btn" disabled={lectureSeule} onClick={ajouter}>Ajouter un poste</button>
        <span className="total">Total des postes : {eur(cp?.valeurs.fin_travaux_ht ?? 0)} HT · {eur(cp?.valeurs.fin_travaux_ttc ?? 0)} TTC</span>
      </div>
      {ecarts && (
        <p className="ecart total-ecart">Écart total devis-factures : <strong>{calc.ecarts.fin_ecart_ht >= 0 ? '+' : ''}{eur(calc.ecarts.fin_ecart_ht)} HT</strong> · {calc.ecarts.fin_ecart_ttc >= 0 ? '+' : ''}{eur(calc.ecarts.fin_ecart_ttc)} TTC</p>
      )}
      <p className="hint">Montants saisis : le HT et le TTC de chaque poste sont saisis tous deux ; la TVA n’est pas calculée.</p>
    </div>
  );
}

function LignesRepetees({ ctx, niveau, planId, ids, titre, lectureSeule }) {
  const actions = useActions();
  const { dossier } = ctx;
  const ls = lignes(dossier, niveau, planId);
  const champs = ids.map((id) => CHAMP[id]).filter(Boolean);
  const nom = niveau === 'occupant' ? 'Occupant' : 'Dérogation';
  return (
    <div className="full repetees">
      <p className="lbl">{titre} {champs[0] && <Badges champ={champs[0]} />}</p>
      {ls.map((l, i) => (
        <div key={l.id} className="ligne-repetee">
          <p className="ligne-titre">{nom} {i + 1}</p>
          <div className="fields">
            {champs.map((c) => (
              <Champ key={c.id} champ={c} idDom={`${niveau}${l.id}-${c.id}`} valeur={l.valeurs[c.id]} lectureSeule={lectureSeule} compact
                onChange={(v) => actions.saisir(dossier.id, c.id, v, { niveau, planId, ligneId: l.id })} />
            ))}
          </div>
          <button type="button" className="rm" disabled={lectureSeule} onClick={() => actions.supprimerLigne(dossier.id, niveau, planId, l.id)} aria-label={`Supprimer : ${nom.toLowerCase()} ${i + 1}`}>Supprimer</button>
        </div>
      ))}
      <button type="button" className="btn btn-petit" disabled={lectureSeule} onClick={() => actions.ajouterLigne(dossier.id, niveau, planId)}>Ajouter : {nom.toLowerCase()}</button>
    </div>
  );
}

export function PanneauFiche({ ctx, onglet, planId }) {
  const actions = useActions();
  const { dossier } = ctx;
  const avecPlan = ONGLETS_PLAN.has(onglet);
  const planVu = avecPlan ? planId : 'devis';
  const devisFige = !!dossier.fige && planVu === 'devis';
  return (
    <div id="panneau-fiche" role="tabpanel" aria-labelledby={`onglet-${onglet}`} className="panneau-fiche">
      {avecPlan && <BarrePlan dossier={dossier} planId={planId} />}
      {groupesDeLOnglet(onglet).map((g) => {
        const champs = champsDuGroupe(onglet, g.id).filter((c) => champApplicable(c, dossier.type) && c.saisie !== 'zone');
        if (!champs.length) return null;
        if (g.id === 'postes') {
          return (
            <fieldset key={g.id}>
              <legend>{g.titre}</legend>
              <Postes ctx={ctx} planId={planVu} lectureSeule={devisFige} />
            </fieldset>
          );
        }
        const simples = champs.filter((c) => c.niveau === 'dossier');
        const occupants = champs.filter((c) => c.niveau === 'occupant');
        const derogations = champs.filter((c) => c.niveau === 'derogation');
        return (
          <fieldset key={g.id}>
            <legend>{g.titre}</legend>
            <div className="fields">
              {simples.map((c) => {
                const lecture = c.plan && devisFige;
                const val = c.saisie === 'calcule' ? undefined : lireValeur(ctx, c.id, planVu);
                return (
                  <Champ key={c.id} champ={c} valeur={val} lectureSeule={lecture}
                    calcul={c.saisie === 'calcule' ? lireValeur(ctx, c.id, planVu) : null}
                    onChange={(v) => actions.saisir(dossier.id, c.id, v, { planId: planVu })} />
                );
              })}
              {occupants.length > 0 && <LignesRepetees ctx={ctx} niveau="occupant" planId={planVu} ids={occupants.map((c) => c.id)} titre="Occupants du logement (hors demandeur)" lectureSeule={false} />}
              {derogations.length > 0 && <LignesRepetees ctx={ctx} niveau="derogation" planId={planVu} ids={derogations.map((c) => c.id)} titre="Demandes de dérogation" lectureSeule={devisFige} />}
            </div>
            {g.id === 'aides' && <p className="hint">Montants saisis à la main : l’outil ne calcule aucune aide.</p>}
            {g.id === 'synthese' && <p className="hint">Sommes simples des montants saisis. Base de l’équilibre : montant {ctx.parametres.baseEquilibre === 'ttc' ? 'TTC' : 'HT'} des dépenses (Paramètres).</p>}
          </fieldset>
        );
      })}
    </div>
  );
}
