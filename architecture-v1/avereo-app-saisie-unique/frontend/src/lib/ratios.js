// Calcul des ratios de coûts au m² sur les dossiers saisis (E08, T10, T25).
import { RATIOS } from '../config/ratios.js';
import { centimes, lireNombre } from './nombres.js';

function planSource(dossier, regle) {
  if (regle === 'devis') return dossier.plans.devis;
  if (regle === 'factures') return dossier.plans.factures;
  return dossier.plans.factures || dossier.plans.devis;
}

export function calculerRatios(dossiers, config = RATIOS) {
  const resultat = {};
  for (const r of config.regroupements) {
    const groupes = new Map();
    for (const d of dossiers) {
      const plan = planSource(d, config.plan);
      if (!plan) continue;
      for (const p of plan.postes) {
        const cle = String(p.valeurs[r.champ] || '').trim() || config.nonRenseigne;
        if (!groupes.has(cle)) groupes.set(cle, { cle, postes: 0, sansSurface: 0, mesures: Object.fromEntries(config.mesures.map((m) => [m.id, []])) });
        const g = groupes.get(cle);
        g.postes += 1;
        const surface = lireNombre(p.valeurs[config.denominateur]);
        if (surface == null || surface <= 0) {
          g.sansSurface += 1;
          continue;
        }
        for (const m of config.mesures) {
          const montant = lireNombre(p.valeurs[m.champ]);
          if (montant != null) g.mesures[m.id].push(montant / surface);
        }
      }
    }
    resultat[r.id] = [...groupes.values()]
      .map((g) => ({
        cle: g.cle,
        postes: g.postes,
        sansSurface: g.sansSurface,
        moyennes: Object.fromEntries(config.mesures.map((m) => {
          const xs = g.mesures[m.id];
          return [m.id, xs.length ? { valeur: centimes(xs.reduce((a, x) => a + x, 0) / xs.length), retenus: xs.length } : null];
        })),
      }))
      .sort((a, b) => a.cle.localeCompare(b.cle, 'fr'));
  }
  return resultat;
}
