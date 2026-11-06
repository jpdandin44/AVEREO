// Journal des modifications (règle de la maquette, fonction record) : des frappes successives dans un même champ,
// à moins de 2 500 ms, sont regroupées en une seule entrée (T08). Le journal couvre aussi les champs de suivi.
import { heure } from './nombres.js';

export const DELAI_REGROUPEMENT = 2500;
export const ENTREES_CONSERVEES = 200;
export const ENTREES_AFFICHEES = 12;

export function enregistrer(journal, items, source = 'manuel', titre = 'Modification d’un champ', t = Date.now()) {
  const dernier = journal[0];
  if (source === 'manuel' && dernier && dernier.source === 'manuel' && dernier.items.length === 1 && items.length === 1
    && dernier.items[0].cle === items[0].cle && t - dernier.t < DELAI_REGROUPEMENT) {
    const fusion = { ...dernier, t, heure: heure(new Date(t)), items: [{ ...dernier.items[0], vers: items[0].vers }] };
    return { journal: [fusion, ...journal.slice(1)], entree: fusion };
  }
  const entree = { t, heure: heure(new Date(t)), source, titre, items };
  return { journal: [entree, ...journal].slice(0, ENTREES_CONSERVEES), entree };
}
