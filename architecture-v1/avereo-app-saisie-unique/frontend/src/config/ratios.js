// Ratios de coûts (E08, cadrage §3.1 point 7). La formule est portée par cette configuration (T25) :
// pour chaque poste dont la surface est renseignée et positive, prix au m² = montant du poste ÷ surface ;
// la valeur affichée est la moyenne simple de ces prix sur les postes du regroupement, tous dossiers confondus.
// Un poste sans surface est exclu de la moyenne et compté à part.
export const RATIOS = {
  // Plan lu dans chaque dossier : les factures quand le plan Devis est figé, le devis sinon.
  plan: 'factures_sinon_devis',
  denominateur: 'pst_surface',
  mesures: [
    { id: 'ht', champ: 'pst_ht', libelle: 'Prix HT moyen au m²' },
    { id: 'ttc', champ: 'pst_ttc', libelle: 'Prix TTC moyen au m²' },
  ],
  regroupements: [
    { id: 'travail', champ: 'pst_travail', libelle: 'Par catégorie de travaux' },
    { id: 'materiau', champ: 'pst_materiau', libelle: 'Par matériau ou type' },
  ],
  nonRenseigne: '(non renseigné)',
};
