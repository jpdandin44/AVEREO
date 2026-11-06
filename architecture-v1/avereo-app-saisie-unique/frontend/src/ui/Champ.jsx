// Saisie d'un champ, selon son type (configuration pilotée par les données).
import { liste } from '../config/listes.js';
import { formater } from './contexte.js';

const PLEINE_LARGEUR = new Set(['texte_long', 'cases', 'serie_dates', 'lignes_montants', 'images']);

export function Badges({ champ }) {
  return (
    <>
      {champ.sensible && <span className="badge badge-sensible" title="Donnée sensible : santé, situation sociale ou familiale, revenus, naissance, identifiant fiscal ou texte libre.">sensible</span>}
      {champ.statut === 'a_confirmer' && <span className="badge badge-confirmer" title={`Champ à confirmer avec le partenaire${champ.questionStatut ? ` (question ${champ.questionStatut})` : ''}. Il ne compte ni dans la progression ni dans les signalements.`}>à confirmer{champ.questionStatut ? ` · ${champ.questionStatut}` : ''}</span>}
    </>
  );
}

export function Champ({ champ, valeur, onChange, lectureSeule = false, calcul = null, idDom, libelle, compact = false, large = false }) {
  const id = idDom || `f-${champ.id}`;
  const lib = libelle || champ.libelle;
  const pleine = large || (PLEINE_LARGEUR.has(champ.saisie) && !compact);
  const entete = (
    <label className="lbl" htmlFor={id}>
      {lib} <Badges champ={champ} />
    </label>
  );
  const v = valeur ?? '';
  let corps;
  switch (champ.saisie) {
    case 'calcule': {
      const texte = formater(champ.id, calcul);
      corps = <output id={id} className="calcule" aria-live="off">{texte ?? '—'}</output>;
      break;
    }
    case 'texte_long':
      corps = <textarea id={id} value={v} disabled={lectureSeule} onChange={(e) => onChange(e.target.value)} />;
      break;
    case 'montant':
      corps = (
        <div className="money">
          <input id={id} value={v} inputMode="decimal" autoComplete="off" disabled={lectureSeule} onChange={(e) => onChange(e.target.value)} />
          <span aria-hidden="true">€</span>
        </div>
      );
      break;
    case 'pourcentage':
      corps = (
        <div className="money">
          <input id={id} value={v} inputMode="decimal" autoComplete="off" disabled={lectureSeule} onChange={(e) => onChange(e.target.value)} />
          <span aria-hidden="true">%</span>
        </div>
      );
      break;
    case 'nombre':
      corps = <input id={id} value={v} inputMode="decimal" autoComplete="off" disabled={lectureSeule} onChange={(e) => onChange(e.target.value)} />;
      break;
    case 'date':
      corps = <input id={id} type="date" value={v} disabled={lectureSeule} onChange={(e) => onChange(e.target.value)} />;
      break;
    case 'oui_non':
      corps = (
        <select id={id} value={v} disabled={lectureSeule} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          <option value="oui">Oui</option>
          <option value="non">Non</option>
        </select>
      );
      break;
    case 'choix':
    case 'liste': {
      const l = liste(champ.id) || { valeurs: [] };
      if (l.libre) {
        corps = (
          <>
            <input id={id} list={`dl-${id}`} value={v} autoComplete="off" disabled={lectureSeule} onChange={(e) => onChange(e.target.value)} />
            <datalist id={`dl-${id}`}>{l.valeurs.map((o) => <option key={o} value={o} />)}</datalist>
          </>
        );
      } else {
        const options = v && !l.valeurs.includes(v) ? [...l.valeurs, v] : l.valeurs;
        corps = (
          <select id={id} value={v} disabled={lectureSeule} onChange={(e) => onChange(e.target.value)}>
            <option value="">—</option>
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        );
      }
      break;
    }
    case 'cases': {
      const l = liste(champ.id) || { valeurs: [] };
      const coches = Array.isArray(valeur) ? valeur : [];
      const basculer = (o) => onChange(coches.includes(o) ? coches.filter((x) => x !== o) : [...coches, o]);
      const groupes = l.groupes || [{ titre: null, valeurs: l.valeurs }];
      return (
        <fieldset className={`cases${pleine ? ' full' : ''}`} id={id}>
          <legend className="lbl">{lib} <Badges champ={champ} /></legend>
          {groupes.map((g) => (
            <div key={g.titre || 'g'} className="cases-groupe">
              {g.titre && <p className="cases-titre">{g.titre}</p>}
              {g.valeurs.map((o) => (
                <label key={o} className="case">
                  <input type="checkbox" checked={coches.includes(o)} disabled={lectureSeule} onChange={() => basculer(o)} />
                  <span>{o}</span>
                </label>
              ))}
            </div>
          ))}
        </fieldset>
      );
    }
    case 'serie_dates': {
      const dates = Array.isArray(valeur) ? valeur : [];
      return (
        <fieldset className="full serie" id={id}>
          <legend className="lbl">{lib} <Badges champ={champ} /></legend>
          {dates.map((d, i) => (
            <div key={i} className="ligne-simple">
              <label className="sr-only" htmlFor={`${id}-${i}`}>{`${lib}, date ${i + 1}`}</label>
              <input id={`${id}-${i}`} type="date" value={d} disabled={lectureSeule} onChange={(e) => onChange(dates.map((x, j) => (j === i ? e.target.value : x)))} />
              <button type="button" className="rm" disabled={lectureSeule} onClick={() => onChange(dates.filter((_, j) => j !== i))} aria-label={`Supprimer la date ${i + 1}`}>Supprimer</button>
            </div>
          ))}
          <button type="button" className="btn btn-petit" disabled={lectureSeule} onClick={() => onChange([...dates, ''])}>Ajouter une date</button>
        </fieldset>
      );
    }
    case 'lignes_montants': {
      const ls = Array.isArray(valeur) ? valeur : [];
      const maj = (i, k, x) => onChange(ls.map((l, j) => (j === i ? { ...l, [k]: x } : l)));
      return (
        <fieldset className="full serie" id={id}>
          <legend className="lbl">{lib} <Badges champ={champ} /></legend>
          {ls.map((l, i) => (
            <div key={i} className="ligne-montant">
              <label className="sr-only" htmlFor={`${id}-${i}-l`}>{`Ligne ${i + 1}, libellé`}</label>
              <input id={`${id}-${i}-l`} value={l.libelle || ''} placeholder="Libellé (audit, prêt…)" disabled={lectureSeule} onChange={(e) => maj(i, 'libelle', e.target.value)} />
              <div className="money">
                <label className="sr-only" htmlFor={`${id}-${i}-m`}>{`Ligne ${i + 1}, montant`}</label>
                <input id={`${id}-${i}-m`} value={l.montant || ''} inputMode="decimal" placeholder="Montant" disabled={lectureSeule} onChange={(e) => maj(i, 'montant', e.target.value)} />
                <span aria-hidden="true">€</span>
              </div>
              <button type="button" className="rm" disabled={lectureSeule} onClick={() => onChange(ls.filter((_, j) => j !== i))} aria-label={`Supprimer la ligne ${i + 1}`}>Supprimer</button>
            </div>
          ))}
          <button type="button" className="btn btn-petit" disabled={lectureSeule} onClick={() => onChange([...ls, { libelle: '', montant: '' }])}>Ajouter une ligne</button>
        </fieldset>
      );
    }
    case 'images':
      return (
        <div className="full">
          {entete}
          <p className="hint" id={id}>Les photos ne sont pas enregistrées dans l’outil en V1 : elles se joignent au rapport imprimé (21 emplacements sur le modèle).</p>
        </div>
      );
    case 'zone':
      return null;
    default:
      corps = <input id={id} value={v} autoComplete="off" disabled={lectureSeule} onChange={(e) => onChange(e.target.value)} />;
  }
  return (
    <div className={pleine ? 'full' : undefined}>
      {entete}
      {corps}
    </div>
  );
}
