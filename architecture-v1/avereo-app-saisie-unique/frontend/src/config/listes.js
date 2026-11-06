// Listes de choix, recopiées des captures de l'interface actuelle et des imprimés (catalogue de la phase 0).
// Les valeurs qui nomment un acteur réel sont génériques ici ; les valeurs propres au poste viennent du fichier
// local valeurs-locales.json, injecté à l'assemblage et jamais versé au dépôt.
// « libre: true » : la capture ne montre pas toutes les options (question Q09) ; la saisie reste libre et les
// valeurs connues sont proposées.

export const LISTES = {
  dos_statut: { valeurs: ['Nouveau', 'En cours', 'Déposer', "S'engager", 'Avance', 'Soldé', 'Relance', 'Abandonner'] },
  dos_abandon_cause: { valeurs: [], libre: true },
  dos_programme: { valeurs: ['Programme A'], libre: true },
  dos_origine_contact: {
    valeurs: ['le partenaire', 'Espace conseil public', 'Collectivités', 'Travailleur social', 'Entreprise', 'Médias',
      'Bouche à oreille', 'Autre'],
  },
  prop_civilite: { valeurs: ['Mr', 'Mme'] },
  prop_qualite: { valeurs: ['Propriétaire occupant', 'Propriétaire bailleur', 'Locataire', 'Commune'] },
  prop_qualite_occupation: {
    valeurs: ['propriétaire ou copropriétaire en pleine propriété', 'propriétaire ou copropriétaire en indivision',
      "associé d'une SCI propriétaire du logement", 'usufruitier', "titulaire d'un droit d'usage et d'habitation",
      "titulaire d'un droit réel immobilier", 'locataire', "occupant d'un logement en viager"],
  },
  prop_cas_particulier: {
    valeurs: ['charge des travaux pour des ascendants ou descendants de revenus modestes',
      'hébergement à titre gratuit d’un ménage de ressources modestes'],
  },
  foy_niveau_ressources: { valeurs: ['Très modestes', 'Modestes', 'Intermédiaires', 'Supérieures'], libre: true },
  foy_occ_civilite: { valeurs: ['M.', 'Mme'] },
  foy_origine_socio: { valeurs: [], libre: true },
  dos_niveau_apa: { valeurs: ['Néant', 'GIR 1', 'GIR 2', 'GIR 3', 'GIR 4', 'GIR 5', 'GIR 6'] },
  log_epci: { valeurs: ['Territoire A'], libre: true },
  dos_type_projet: { valeurs: ['Petite LHI', 'Grande LHI', 'Énergie', 'Handicap', 'Mixte PO', 'Mixte PB', 'Décence', 'TU', 'FSL', 'RSD/SI'] },
  etp_conseiller: { valeurs: [], libre: true },
  log_type: { valeurs: ['Maison individuelle', 'Appartement'] },
  log_periode_construction: { valeurs: ['< 1949', '1949-1974', '1974-1990', '1990-2006', '2007-2012', '2013-2020', '> 2020'] },
  log_chauffage: { valeurs: ['Fioul', 'Gaz', 'Électricité', 'Bois', 'Autre'] },
  dos_travaux_nature: {
    valeurs: ['rénovation énergétique', "adaptation à la perte d'autonomie et accessibilité", 'rénovation lourde', 'autres'],
  },
  ene_classe_avant: { valeurs: ['≤ 70 A', '71 à 110 B', '111 à 180 C', '181 à 250 D', '251 à 330 E', '331 à 420 F', '≥ 421 G'] },
  ene_classe_apres: { memeQue: 'ene_classe_avant' },
  ene_ges_classe_avant: { valeurs: ['≤ 6 A', '7 à 11 B', '12 à 30 C', '31 à 50 D', '51 à 70 E', '71 à 100 F', '≥ 101 G'] },
  ene_ges_classe_apres: { memeQue: 'ene_ges_classe_avant' },
  fin_pret1_type: { valeurs: [], libre: true },
  fin_pret2_type: { valeurs: [], libre: true },
  fin_pret3_type: { valeurs: [], libre: true },
  fin_retraite_org_base: { valeurs: ['CNAV/CARSAT', 'MSA', 'RSI', 'Autres'] },
  fin_retraite_org_compl: { valeurs: ['AGIRC', 'ARRCO', 'IRCANTEC', 'Autres'] },
  acp_rang: { valeurs: ['1er acompte', '2e acompte'] },
  doc_signataire_qualite: { valeurs: ["Demandeur de l'aide", 'Mandataire'] },
  pst_travail: {
    libre: true,
    valeurs: ['Isolation des combles perdus', 'Isolation des rampants de toiture', 'Isolation des murs par l’intérieur',
      'Isolation des murs par l’extérieur', 'Isolation du plancher bas', 'Isolation des planchers',
      'Remplacement des menuiseries extérieures', 'Installation de volets', 'Installation d’une VMC simple flux hygroréglable',
      'Installation d’une pompe à chaleur air/eau', 'Installation d’une pompe à chaleur air/air',
      'Installation d’un chauffe-eau thermodynamique', 'Installation d’un poêle'],
  },
  pst_localisation: { valeurs: [], libre: true },
  pst_tva: { valeurs: ['5,5 %', '10 %', '20 %', 'Mixte'], libre: true },
  pst_materiau: {
    libre: true,
    valeurs: ['Ouate de cellulose', 'Laine de verre', 'Laine de roche', 'Laine minérale', 'Fibre de bois',
      'Polystyrène graphité', 'PVC', 'Aluminium', 'Bois'],
  },
  rfa_prestations: {
    valeurs: ["test d'étanchéité à l'air et contrôle de la ventilation", "prêt d'outils de mesure", 'visites complémentaires',
      'mandataire financier', 'mandataire administratif', 'auto-rénovation accompagnée', 'suivi des consommations post-travaux'],
  },
  rfa_documents_cases: {
    valeurs: ['Synthèse de la grille d’analyse du logement', 'Plan de financement', 'Rapport de l’audit énergétique',
      'Attestation de travaux sur devis, ou devis', 'Devis et factures',
      'Rapport de dégradation ou d’insalubrité, diagnostic multicritères', 'Contrat ou convention mentionnant la sous-traitance',
      'Attestation de travaux sur factures'],
  },
  etp_cases: {
    groupes: [
      { titre: 'Phase 1 : préalable à la demande', valeurs: ['Information préalable sur le déroulement du projet',
        'Présentation des pièces administratives pour les aides mobilisables', 'Attestation de passage au guichet France Rénov’',
        'Création du compte de demande auprès de l’Anah', 'Retour des pièces administratives par le ménage'] },
      { titre: 'Phase 2 : visite à domicile et validation du programme', valeurs: ['Visite du domicile et évaluation du logement',
        'Proposition et validation du programme de travaux, du plan de financement et du rapport d’audit',
        'Mise à jour des devis selon le scénario retenu'] },
      { titre: 'Phase 3 : finalisation du dossier pour le dépôt', valeurs: ['Retour des devis retenus, définitifs et conformes',
        'Mise à jour définitive de l’audit et du plan de financement', 'Renseignement de la demande sur France Rénov’'] },
      { titre: 'Phase 4 : validation de la demande de subvention', valeurs: ['Message électronique de l’Anah ou du conseiller'] },
      { titre: 'Phase 5 : attente des décisions des financeurs', valeurs: ['Accords des financeurs et montants des aides reçus'] },
      { titre: 'Phase 6 : éco-prêt à taux zéro (dossiers énergie)', valeurs: ['Mobilisation de l’éco-PTZ pour le reste à charge'] },
      { titre: 'Phase 7 : signature des devis', valeurs: ['Devis signés pour la demande d’avance et renvoyés au conseiller',
        'Demande de paiement de l’avance validée'] },
      { titre: 'Phase 8 : réalisation des travaux', valeurs: ['Travaux réalisés'] },
      { titre: 'Phase 9 : demande de versement d’un acompte', valeurs: ['Factures au nom du demandeur, tamponnées et signées',
        'Demande de paiement de l’acompte validée'] },
      { titre: 'Phase 10 : fin de travaux', valeurs: ['Factures de fin de travaux au nom du demandeur',
        'Rendez-vous de visite de fin de travaux pris', 'Factures validées et imprimés de paiement renseignés',
        'Carnet d’information du logement et rapport de visite établis'] },
      { titre: 'Phase 11 : demande de solde des subventions', valeurs: ['Demandes de paiement déposées auprès des financeurs',
        'Message électronique de l’Anah ou du conseiller', 'Demande de paiement du solde validée sur France Rénov’'] },
    ],
  },
};

// Valeurs propres au poste, injectées par l'assemblage (scripts/build.mjs) depuis valeurs-locales.json.
export function valeursLocales() {
  try {
    return (typeof window !== 'undefined' && window.__AVEREO_UNI_LOCAL__) || {};
  } catch {
    return {};
  }
}

// Liste effective d'un champ : valeurs locales si elles existent, sinon valeurs génériques.
export function liste(id, locales = valeursLocales()) {
  const def = LISTES[id];
  if (!def) return null;
  if (def.memeQue) return liste(def.memeQue, locales);
  const remplacement = locales.listes && locales.listes[id];
  if (def.groupes) return { ...def, valeurs: def.groupes.flatMap((g) => g.valeurs) };
  return { ...def, valeurs: Array.isArray(remplacement) ? remplacement : def.valeurs };
}
