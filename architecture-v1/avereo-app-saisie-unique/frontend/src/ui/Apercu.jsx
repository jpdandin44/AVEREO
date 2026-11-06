// Aperçu pré-rempli d'un document : rubriques de l'imprimé, valeurs de la fiche, « À compléter » pour les champs
// requis vides, valeurs modifiées signalées, dernière page de signature isolée (E10, T20).
import { Fragment } from 'react';
import { CHAMP, adresseDemandeur, champApplicable, lignes, TYPES } from '../lib/modele.js';
import { liste } from '../config/listes.js';
import { requisDuDocument } from '../lib/documents.js';
import { eur, estVide, num } from '../lib/nombres.js';
import { cleDe, estModifie, formater, lireValeur } from './contexte.js';

function Valeur({ texte, requis, modifie }) {
  const cls = modifie ? 'changed' : undefined;
  if (texte == null || texte === '') {
    return <dd className={cls}>{requis ? <span className="missing">À compléter</span> : <span className="vide">—</span>}</dd>;
  }
  return <dd className={cls}>{texte}</dd>;
}

function Coche({ oui, children }) {
  return <span className="coche"><span aria-hidden="true">{oui ? '☒' : '☐'}</span> {children}<span className="sr-only">{oui ? ' (coché)' : ' (non coché)'}</span></span>;
}

function TablePostes({ it, r }) {
  const { ctx, planId, requis } = r;
  let postes = lignes(ctx.dossier, 'poste', planId);
  if (it.filtre === 'eligibles') postes = postes.filter((p) => p.valeurs.pst_eligible !== 'non');
  const colonnes = it.colonnes.filter((col) => !col.c || champApplicable(CHAMP[col.c], ctx.dossier.type));
  const posteRequis = requis.has('pst_intitule') || requis.has('pst_ht');
  if (!postes.length) {
    return <p>{posteRequis ? <><span className="missing">À compléter</span> Aucun poste de travaux.</> : <span className="vide">Aucun poste de travaux.</span>}</p>;
  }
  const totaux = it.total ? it.total.map((t) => formater(t.calc, lireValeur(ctx, t.calc, planId))) : null;
  // Les totaux se placent sous les dernières colonnes de montants.
  const colTotaux = totaux ? colonnes.map((c, i) => (c.num ? i : -1)).filter((i) => i >= 0).slice(-totaux.length) : [];
  const totalModifie = it.total && it.total.some((t) => estModifie(r.derniere, null, t.calc));
  return (
    <div className="scroll">
      <table className="lines">
        <thead><tr>{colonnes.map((col) => <th key={col.l} className={col.num ? 'num' : undefined} scope="col">{col.l}</th>)}</tr></thead>
        <tbody>
          {postes.map((p) => (
            <tr key={p.id}>
              {colonnes.map((col) => {
                if (col.entreprise) return <td key={col.l}>{ctx.dossier.valeurs.ent_nom || <span className="vide">—</span>}</td>;
                const v = p.valeurs[col.c];
                const texte = formater(col.c, v);
                const modifie = estModifie(r.derniere, `poste:${planId}:${p.id}:${col.c}`, col.c);
                const cls = [col.num ? 'num' : '', modifie ? 'changed' : ''].filter(Boolean).join(' ') || undefined;
                const details = (col.details || []).map((id) => [id, formater(id, p.valeurs[id])]).filter(([id, t]) => t && champApplicable(CHAMP[id], ctx.dossier.type));
                return (
                  <td key={col.l} className={cls}>
                    {texte ?? (requis.has(col.c) ? <span className="missing">À compléter</span> : <span className="vide">—</span>)}
                    {details.length > 0 && <ul className="details">{details.map(([id, t]) => <li key={id}>{CHAMP[id].libelle} : {t}</li>)}</ul>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        {totaux && (
          <tfoot>
            <tr>
              {colonnes.map((col, i) => {
                const k = colTotaux.indexOf(i);
                if (k >= 0) return <td key={col.l} className={`num${totalModifie ? ' changed' : ''}`}>{totaux[k] ?? ''}</td>;
                return <td key={col.l}>{i === 0 ? 'Total' : ''}</td>;
              })}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

function TableLignes({ it, r, niveau, vide }) {
  const { ctx, planId } = r;
  const ls = lignes(ctx.dossier, niveau, planId);
  if (!ls.length) return <p className="vide">{vide}</p>;
  return (
    <div className="scroll">
      {it.titre && <p className="sous-titre">{it.titre}</p>}
      <table className="lines">
        <thead><tr>{it.colonnes.map((col) => <th key={col.c} scope="col">{col.l}</th>)}</tr></thead>
        <tbody>
          {ls.map((l) => (
            <tr key={l.id}>{it.colonnes.map((col) => <td key={col.c} className={estModifie(r.derniere, `${niveau}:${planId}:${l.id}:${col.c}`, col.c) ? 'changed' : undefined}>{formater(col.c, l.valeurs[col.c]) ?? <span className="vide">—</span>}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LigneMontant({ libelle, montant, modifie, fort }) {
  return (
    <tr className={fort ? 'fort' : undefined}>
      <td>{libelle}</td>
      <td className={`num${modifie ? ' changed' : ''}`}>{eur(montant)}</td>
    </tr>
  );
}

function BlocFinancement({ r }) {
  const { ctx, planId } = r;
  const cp = ctx.calc[planId];
  const v = ctx.dossier.plans[planId].valeurs;
  const mod = (ids) => r.derniere && r.derniere.items.some((i) => ids.includes(i.champ));
  const orgs = (id) => {
    const choisis = Array.isArray(v[id]) ? v[id] : [];
    return <span className="organismes">{(liste(id)?.valeurs || []).map((o) => <Coche key={o} oui={choisis.includes(o)}>{o}</Coche>)}</span>;
  };
  return (
    <div className="scroll">
      <table className="lines plan">
        <tbody>
          <LigneMontant libelle="Coût total des travaux à réaliser (HT)" montant={cp.valeurs.fin_travaux_ht} modifie={mod(['pst_ht', 'poste_struct'])} />
          <LigneMontant libelle="Honoraires d’assistance à maîtrise d’ouvrage (HT)" montant={num(v.fin_honoraires_amo)} modifie={mod(['fin_honoraires_amo'])} />
          <LigneMontant libelle="Honoraires de maîtrise d’œuvre (HT)" montant={num(v.fin_honoraires_moe)} modifie={mod(['fin_honoraires_moe'])} />
          <LigneMontant libelle="Montant total des dépenses HT" montant={cp.valeurs.fin_depenses_ht} fort />
          <LigneMontant libelle="Montant total des dépenses TTC" montant={cp.valeurs.fin_depenses_ttc} fort />
          <tr className="intertitre"><td colSpan={2}>Financement</td></tr>
          <LigneMontant libelle="• Prêt bancaire (total des prêts)" montant={cp.valeurs.fin_pret} modifie={mod(['fin_ecoptz', 'fin_autre_pret', 'fin_pret1_montant', 'fin_pret2_montant', 'fin_pret3_montant'])} />
          <LigneMontant libelle="• Apport de fonds personnels" montant={num(v.fin_apport)} modifie={mod(['fin_apport'])} />
          <tr className="intertitre"><td colSpan={2}>• Aides publiques accordées</td></tr>
          {cp.lignesAides.map((l) => (
            <tr key={l.id}>
              <td>
                – {l.libelle} {l.id !== 'anah' && <span className="non-oui"><Coche oui={l.montant === 0}>non</Coche> <Coche oui={l.montant > 0}>oui</Coche></span>}
                {l.organisme && l.montant > 0 && <div className="sous">Si oui, organisme : {orgs(l.organisme)}</div>}
                {l.nature && !estVide(v[l.nature]) && <div className="sous">À préciser : {v[l.nature]}</div>}
              </td>
              <td className={`num${mod(l.champs) ? ' changed' : ''}`}>{eur(l.montant)}</td>
            </tr>
          ))}
          <LigneMontant libelle="Total des aides publiques" montant={cp.valeurs.fin_total_aides_publiques} fort />
          <tr>
            <td>• Autres aides <span className="non-oui"><Coche oui={cp.autresAides === 0}>non</Coche> <Coche oui={cp.autresAides > 0}>oui</Coche></span></td>
            <td className={`num${mod(['fin_autres_aides', 'fin_prime_cee', 'fin_autres_primes']) ? ' changed' : ''}`}>{eur(cp.autresAides)}</td>
          </tr>
        </tbody>
        <tfoot><tr><td>Total des ressources</td><td className="num">{eur(cp.valeurs.fin_total_ressources)}</td></tr></tfoot>
      </table>
    </div>
  );
}

function BlocEnergie({ r }) {
  const { ctx, planId } = r;
  if (ctx.dossier.type !== 'energie') return <p className="vide">Sans objet pour un dossier de type {TYPES.find((t) => t.id === ctx.dossier.type)?.libelle}.</p>;
  const lignesE = [
    ['Consommation conventionnelle en kWh/m²/an d’énergie primaire', 'ene_prim_avant', 'ene_prim_apres'],
    ['en kWh/m²/an d’énergie finale', 'ene_fin_avant', 'ene_fin_apres'],
    ['Émissions annuelles de gaz à effet de serre en kgCO2eq/m²/an', 'ene_ges_avant', 'ene_ges_apres'],
    ['Classe de performance énergétique (de A à G)', 'ene_classe_avant', 'ene_classe_apres'],
    ['Surface de référence du logement en m²', 'ene_surface_ref_avant', 'ene_surface_ref_apres'],
  ];
  const cell = (id) => {
    const t = formater(id, lireValeur(ctx, id, planId));
    return <td className={`num${estModifie(r.derniere, cleDe(id, planId), id) ? ' changed' : ''}`}>{t ?? <span className="vide">—</span>}</td>;
  };
  return (
    <>
      <div className="scroll">
        <table className="lines">
          <thead><tr><th scope="col">Indicateur</th><th className="num" scope="col">Situation initiale (« avant travaux »)</th><th className="num" scope="col">Situation projetée (« après travaux »)</th></tr></thead>
          <tbody>{lignesE.map(([l, a, b]) => <tr key={a}><td>{l}</td>{cell(a)}{cell(b)}</tr>)}</tbody>
        </table>
      </div>
      <dl className="kv"><dt>Référence ou n° du scénario retenu</dt><Valeur texte={formater('ene_scenario_ref', lireValeur(ctx, 'ene_scenario_ref', planId))} modifie={estModifie(r.derniere, cleDe('ene_scenario_ref', planId), 'ene_scenario_ref')} /></dl>
    </>
  );
}

function BlocGain({ r }) {
  const { ctx, planId } = r;
  if (ctx.dossier.type !== 'energie') return null;
  const g = lireValeur(ctx, 'ene_gain_classes', planId);
  return (
    <p className={estModifie(r.derniere, null, 'ene_gain_classes') ? 'changed' : undefined}>
      Gain de classe de performance énergétique associé au projet de travaux :{' '}
      <Coche oui={g === 2}>Gain de 2 classes</Coche> <Coche oui={g === 3}>Gain de 3 classes</Coche> <Coche oui={g >= 4}>Gain de 4 classes ou plus</Coche>
      {g == null && <span className="vide"> (classes avant et après à saisir)</span>}
    </p>
  );
}

function BlocEntreprises({ r }) {
  const { ctx } = r;
  const v = ctx.dossier.valeurs;
  const c = ctx.calc.valeurs;
  const req = r.requis;
  const t = (id) => formater(id, id in c ? c[id] : v[id]);
  const cellule = (id, numerique) => <td className={numerique ? 'num' : undefined}>{t(id) ?? (req.has(id) ? <span className="missing">À compléter</span> : <span className="vide">—</span>)}</td>;
  return (
    <div className="scroll">
      <table className="lines">
        <thead><tr><th scope="col">Entreprise : raison sociale, adresse</th><th scope="col">N° d’inscription RM ou RCS</th><th scope="col">Référence du devis</th><th className="num" scope="col">Montant HT du devis</th><th className="num" scope="col">Montant HT des travaux exécutés sur devis</th><th className="num" scope="col">Pourcentage de travaux exécutés</th><th scope="col">Observations</th></tr></thead>
        <tbody>
          <tr>
            <td className={estModifie(r.derniere, 'dossier:ent_nom', 'ent_nom') ? 'changed' : undefined}>{t('ent_nom') ?? (req.has('ent_nom') ? <span className="missing">À compléter</span> : '—')}{t('ent_adresse') && <div className="sous">{t('ent_adresse')}</div>}</td>
            {cellule('ent_siret')}
            <td className={estModifie(r.derniere, 'dossier:dev_reference', 'dev_reference') ? 'changed' : undefined}>{t('dev_reference') ?? (req.has('dev_reference') ? <span className="missing">À compléter</span> : '—')}</td>
            {cellule('ent_devis_ht', true)}{cellule('ent_travaux_executes_ht', true)}{cellule('ent_pct_executes', true)}{cellule('ent_observations')}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function BlocPlanFinal({ r }) {
  const { ctx, planId } = r;
  const cp = ctx.calc[planId];
  const v = ctx.dossier.plans[planId].valeurs;
  const cout = cp.valeurs.fin_travaux_ttc;
  const subv = cp.valeurs.fin_aides;
  return (
    <div className="scroll">
      <table className="lines">
        <thead><tr><th scope="col">Ressources</th><th className="num" scope="col">Montant</th></tr></thead>
        <tbody>
          <LigneMontant libelle="Coût des travaux (TTC)" montant={cout} />
          <LigneMontant libelle="Total des subventions" montant={subv} />
          <LigneMontant libelle="Reste à charge" montant={cout - subv} fort />
          <LigneMontant libelle="Éco-PTZ" montant={num(v.fin_ecoptz)} />
          <LigneMontant libelle="Autre prêt" montant={num(v.fin_autre_pret)} />
          <LigneMontant libelle="Apport personnel" montant={num(v.fin_apport)} />
        </tbody>
        <tfoot><tr><td>Total TTC</td><td className="num">{eur(subv + num(v.fin_ecoptz) + num(v.fin_autre_pret) + num(v.fin_apport))}</td></tr></tfoot>
      </table>
    </div>
  );
}

function BlocEtapes({ r }) {
  const coches = Array.isArray(r.ctx.dossier.valeurs.etp_cases) ? r.ctx.dossier.valeurs.etp_cases : [];
  return (
    <div className="etapes">
      {liste('etp_cases').groupes.map((g) => (
        <div key={g.titre}>
          <p className="sous-titre">{g.titre}</p>
          <ul className="sans-puce">{g.valeurs.map((o) => <li key={o}><Coche oui={coches.includes(o)}>{o}</Coche></li>)}</ul>
        </div>
      ))}
    </div>
  );
}

function Bloc({ it, r }) {
  const { ctx, planId, requis } = r;
  switch (it.bloc) {
    case 'pf_financement': return <BlocFinancement r={r} />;
    case 'equilibre': {
      const e = ctx.calc[planId].equilibre;
      return (
        <>
          <p className={`status ${e.etat === 'equilibre' ? 'ok' : 'warn'}${estModifie(r.derniere, null, 'fin_solde_projet') ? ' changed' : ''}`}>{e.message}</p>
          <p className="hint">Somme simple des montants saisis. Aucune règle d’aide n’est appliquée.</p>
        </>
      );
    }
    case 'energie_avant_apres': return <BlocEnergie r={r} />;
    case 'gain_classes': return <BlocGain r={r} />;
    case 'aco_entreprises': return <BlocEntreprises r={r} />;
    case 'rfa_plan_final': return <BlocPlanFinal r={r} />;
    case 'etapes': return <BlocEtapes r={r} />;
    case 'noms_postes': {
      const postes = lignes(ctx.dossier, 'poste', planId);
      if (!postes.length) return <p><span className="missing">À compléter</span> Aucun poste de travaux.</p>;
      return (
        <ul className="names">
          {postes.map((p) => (
            <li key={p.id} className={estModifie(r.derniere, `poste:${planId}:${p.id}:pst_intitule`, 'pst_intitule') ? 'changed' : undefined}>
              {p.valeurs.pst_intitule || <span className="missing">À compléter</span>}
            </li>
          ))}
        </ul>
      );
    }
    case 'texte_libre': {
      const v = lireValeur(ctx, it.c, planId);
      if (estVide(v)) return <p>{requis.has(it.c) ? <span className="missing">À compléter</span> : <span className="vide">—</span>}</p>;
      return <p className={`free${estModifie(r.derniere, cleDe(it.c, planId), it.c) ? ' changed' : ''}`}>{v}</p>;
    }
    case 'lignes_montants': {
      const ls = Array.isArray(ctx.dossier.valeurs[it.c]) ? ctx.dossier.valeurs[it.c] : [];
      if (!ls.length) return <p className="vide">Aucune ligne propre au plan prévisionnel.</p>;
      return (
        <table className="lines"><tbody>{ls.map((l, i) => <LigneMontant key={i} libelle={l.libelle || '—'} montant={num(l.montant)} />)}</tbody></table>
      );
    }
    case 'photos': return <p className="vide">21 emplacements d’images : photos à joindre au rapport imprimé (non enregistrées dans l’outil en V1).</p>;
    default: return null;
  }
}

function Element({ it, r }) {
  const { ctx, planId, requis } = r;
  const type = ctx.dossier.type;
  if (it.texte) return <p className="texte-fixe">{it.texte}</p>;
  if (it.bloc) return <Bloc it={it} r={r} />;
  if (it.table === 'postes') return <TablePostes it={it} r={r} />;
  if (it.table === 'derogations') return type === 'energie' ? <TableLignes it={it} r={r} niveau="derogation" vide="Aucune demande de dérogation." /> : null;
  if (it.table === 'occupants') return <TableLignes it={it} r={r} niveau="occupant" vide="Aucun occupant renseigné (hors demandeur)." />;
  let texte;
  let modifie;
  let estRequis = false;
  if (it.c) {
    if (!champApplicable(CHAMP[it.c], type)) return null;
    let v = lireValeur(ctx, it.c, planId);
    if (it.annee && v) v = String(v).slice(0, 4);
    texte = it.annee ? (v || null) : formater(it.c, v);
    if (texte && it.unite) texte = `${texte} ${it.unite}`;
    modifie = estModifie(r.derniere, cleDe(it.c, planId), it.c);
    estRequis = requis.has(it.c) && CHAMP[it.c].statut !== 'a_confirmer';
  } else if (it.calc) {
    if (!champApplicable(CHAMP[it.calc], type)) return null;
    texte = formater(it.calc, lireValeur(ctx, it.calc, planId));
    modifie = estModifie(r.derniere, null, it.calc);
  } else if (it.compose) {
    texte = it.compose.map((id) => formater(id, lireValeur(ctx, id, planId))).filter(Boolean).join(' ') || null;
    modifie = it.compose.some((id) => estModifie(r.derniere, cleDe(id, planId), id));
    estRequis = it.compose.some((id) => requis.has(id));
  } else if (it.adresse) {
    texte = adresseDemandeur(ctx.dossier) || null;
    modifie = ['prop_adresse_differente', 'log_adresse', 'log_cp', 'log_commune'].some((id) => estModifie(r.derniere, cleDe(id, planId), id));
    estRequis = requis.has('log_adresse');
  }
  return <><dt>{it.l}</dt><Valeur texte={texte} requis={estRequis} modifie={modifie} /></>;
}

// Regroupe les valeurs simples dans une liste de définitions ; les tableaux et rubriques particulières à part.
function Elements({ items, r }) {
  const groupes = [];
  for (const it of items) {
    const simple = it.c || it.calc || it.compose || it.adresse;
    const dernier = groupes[groupes.length - 1];
    if (simple && !it.bloc && !it.table) {
      if (dernier && dernier.simple) dernier.items.push(it);
      else groupes.push({ simple: true, items: [it] });
    } else {
      groupes.push({ simple: false, items: [it] });
    }
  }
  return groupes.map((g, i) => (g.simple
    ? <dl key={i} className="kv">{g.items.map((it, j) => <Element key={j} it={it} r={r} />)}</dl>
    : <Fragment key={i}><Element it={g.items[0]} r={r} /></Fragment>));
}

export function Apercu({ doc, ctx, planId, derniere, signalement }) {
  const r = { ctx, planId, derniere, requis: new Set(requisDuDocument(doc)) };
  if (signalement.indisponible) {
    return <p className="status warn">Le plan Factures est créé par « Figer au dépôt » (onglet Financement) : ce document se remplit ensuite à partir des factures.</p>;
  }
  return (
    <>
      {signalement.miss.length > 0 && <p className="status warn">! À compléter dans la fiche : {signalement.miss.join(' ; ')}.</p>}
      {doc.sections.map((s) => (
        <section key={s.titre} className="rubrique">
          <h4>{s.titre}</h4>
          <Elements items={s.items} r={r} />
        </section>
      ))}
      {doc.signature && (
        <section className="page-signature" aria-label="Dernière page : signature">
          <p className="page-marque">Dernière page — à signer à la main</p>
          <Elements items={doc.signature.items} r={r} />
          <div className="signataires">
            {doc.signature.signataires.map((s) => <div key={s} className="cadre-signature"><span>{s}</span></div>)}
          </div>
        </section>
      )}
    </>
  );
}
