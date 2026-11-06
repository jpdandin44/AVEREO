// Documents pré-remplis : aperçus à l'écran dont les rubriques et les intitulés suivent l'imprimé officiel ou le
// modèle du partenaire (E01, E10, E11). Aucun document n'est propre à un type de dossier (cadrage §3.1, point 3).
//
// Éléments d'une rubrique :
//   { c: id, l: intitulé }              valeur saisie (niveau dossier, ou plan du document)
//   { calc: id, l: intitulé }           valeur calculée
//   { compose: [ids], l: intitulé }     valeurs saisies juxtaposées
//   { adresse: 'demandeur', l }         adresse propre du demandeur, sinon celle du logement
//   { table: 'postes' | 'derogations' | 'occupants', colonnes: [...], filtre?, total? }
//   { bloc: nom }                       rubrique particulière (voir BLOCS)
//   { texte: '…' }                      texte fixe de l'imprimé, résumé
// « requis » : champs signalés « À compléter » (catalogue, colonne « requis par » ; proposition Q14 pour les autres).
// « signature » : dernière page, isolée à l'impression pour la signature manuscrite (E10, T20).

const RESERVE_ANAH = {
  titre: 'Réservé à l’Anah',
  items: [{ c: 'dos_delegation', l: 'Délégation' }, { c: 'dos_num_anah', l: 'N° de dossier' }, { c: 'dos_date_depot', l: 'Date du dépôt' }],
};

const COLONNES_POSTE_DETAIL = ['pst_travail', 'pst_localisation', 'pst_materiau', 'pst_marque', 'pst_gamme', 'pst_reference', 'pst_acermi',
  'pst_resistance_r', 'pst_epaisseur', 'pst_surface', 'pst_uw', 'pst_sw', 'pst_ud', 'pst_delta_r', 'pst_puissance', 'pst_regulation',
  'pst_scop', 'pst_seer', 'pst_fluide', 'pst_capacite', 'pst_cop', 'pst_etas', 'pst_profil_soutirage', 'pst_rendement'];

function attestationTravaux({ id, titre, plan, source, reference }) {
  return {
    id,
    onglet: titre.replace('Attestation de travaux', 'Attestation').trim(),
    titre,
    reference,
    prioritaire: true,
    plans: [plan],
    sections: [
      { titre: '1. Identité du demandeur', items: [{ compose: ['prop_nom', 'prop_prenom'], l: 'NOM, Prénom(s) du demandeur' }] },
      {
        titre: '2. Adresse du chantier',
        items: [{ c: 'log_adresse', l: 'Numéro et voie' }, { compose: ['log_cp', 'log_commune'], l: 'Code postal / Ville' },
          { c: 'log_type', l: 'Type de logement (repris de la maquette)' }, { c: 'log_annee', l: 'Année de construction (repris de la maquette)' }],
      },
      { titre: '3. Synthèse des travaux éligibles', items: [{ calc: 'fin_eligibles_ht', l: 'Coût total des travaux éligibles HT' }, { calc: 'fin_eligibles_ttc', l: 'Coût total des travaux éligibles TTC' }] },
      {
        titre: '4. Synthèse de l’audit énergétique',
        items: [
          { c: 'ene_audit_date', l: 'Date de réalisation de l’audit énergétique' },
          { c: 'ene_audit_id', l: 'Identifiant de l’audit énergétique (n°)' },
          { c: 'org_raison_sociale', l: 'Professionnel ayant réalisé l’audit : raison sociale' },
          { c: 'org_siret', l: 'SIRET' },
          { bloc: 'energie_avant_apres' },
          { bloc: 'gain_classes' },
        ],
      },
      {
        titre: `5. Description des travaux éligibles (${source})`,
        items: [{
          table: 'postes', filtre: 'eligibles',
          colonnes: [{ c: 'pst_intitule', l: 'Description des postes de travaux éligibles (dont travaux induits)', details: COLONNES_POSTE_DETAIL },
            { c: 'pst_ht', l: '€ HT', num: true }, { c: 'pst_ttc', l: '€ TTC', num: true }],
          total: [{ calc: 'fin_eligibles_ht' }, { calc: 'fin_eligibles_ttc' }],
        }],
      },
      {
        titre: '6. Demande de dérogation aux critères de résistance thermique, de coefficient de transmission thermique ou de facteur de transmission solaire',
        items: [{ table: 'derogations', colonnes: [{ c: 'ene_derogation_paroi', l: 'Paroi opaque ou vitrée concernée' }, { c: 'ene_derogation_motif', l: 'Motif (description de la contrainte technique, architecturale ou patrimoniale)' }] }],
      },
    ],
    signature: {
      items: [
        { texte: 'En signant le présent document, le demandeur atteste du programme de travaux décrit à la section 5 et des critères de l’imprimé (texte fixe de l’imprimé).' },
        { c: 'doc_lieu', l: 'Fait à' }, { c: 'doc_date', l: 'le' },
        { texte: 'NOM, Prénom et signature du demandeur :' },
        { texte: `En signant le présent document, l’accompagnateur agréé « Mon Accompagnateur Rénov’ » atteste, sur la base des ${source.replace('à partir des ', '')}, de la concordance avec le scénario de l’audit (texte fixe de l’imprimé).` },
        { c: 'org_lieu', l: 'Fait à' }, { c: 'doc_date', l: 'le' },
        { texte: 'NOM, Prénom et signature de l’accompagnateur :' },
        { c: 'org_raison_sociale', l: 'Raison sociale' }, { c: 'org_siret', l: 'SIRET' },
      ],
      signataires: ['Signature du demandeur', 'Signature de l’accompagnateur'],
    },
  };
}

export const DOCUMENTS = [
  {
    id: 'PF',
    onglet: 'Plan de financement',
    titre: 'Plan de financement',
    reference: 'cerfa n° 13460*03',
    prioritaire: true,
    plans: ['devis', 'factures'],
    sections: [
      RESERVE_ANAH,
      {
        titre: 'Identité du demandeur de la subvention',
        items: [
          { c: 'prop_nom', l: 'Votre nom' }, { c: 'prop_prenom', l: 'Votre prénom' }, { adresse: 'demandeur', l: 'Votre adresse' },
          { c: 'log_batiment', l: 'Bâtiment' }, { c: 'log_etage', l: 'Étage' }, { c: 'log_porte', l: 'Porte' }, { c: 'log_escalier', l: 'Escalier' },
          { c: 'log_cp', l: 'Code postal' }, { c: 'log_commune', l: 'Commune' }, { c: 'prop_telephone', l: 'Tél' }, { c: 'prop_email', l: 'Mèl' },
        ],
      },
      {
        titre: 'Détail du coût des travaux (onglet Travaux)',
        items: [{ table: 'postes', colonnes: [{ c: 'pst_intitule', l: 'Poste' }, { c: 'pst_ht', l: 'Montant HT', num: true }, { c: 'pst_ttc', l: 'Montant TTC', num: true }], total: [{ calc: 'fin_travaux_ht' }, { calc: 'fin_travaux_ttc' }] }],
      },
      { titre: 'Financement des travaux', items: [{ bloc: 'pf_financement' }, { bloc: 'equilibre' }] },
    ],
    signature: {
      items: [
        { compose: ['prop_nom', 'prop_prenom'], l: 'Je soussigné(e), nom et prénom' },
        { texte: 'certifie sur l’honneur l’exactitude des renseignements ci-dessus.' },
        { c: 'doc_lieu', l: 'Fait à' }, { c: 'doc_date', l: 'le' },
      ],
      signataires: ['Signature du demandeur'],
    },
  },
  attestationTravaux({ id: 'ATD', titre: 'Attestation de travaux (devis)', plan: 'devis', source: 'à partir des devis des entreprises', reference: 'modèle SRC-04, MaPrimeRénov’ Parcours accompagné' }),
  attestationTravaux({ id: 'ATF', titre: 'Attestation de travaux (factures)', plan: 'factures', source: 'à partir des factures des entreprises', reference: 'modèle SRC-05, MaPrimeRénov’ Parcours accompagné' }),
  {
    id: 'AVA',
    onglet: 'Demande d’avance',
    titre: 'Demande de versement d’une avance pour le commencement des travaux',
    reference: 'cerfa n° 13934*05',
    prioritaire: true,
    plans: ['devis'],
    sections: [
      RESERVE_ANAH,
      {
        titre: 'Identité du demandeur',
        items: [
          { c: 'prop_civilite', l: 'Madame / Monsieur' }, { compose: ['prop_nom', 'prop_prenom'], l: 'Nom, Prénom' },
          { adresse: 'demandeur', l: 'Adresse' }, { c: 'log_cp', l: 'Code postal' }, { c: 'log_commune', l: 'Commune' },
          { c: 'log_adresse', l: 'Logement concerné par les travaux' },
          { c: 'dos_date_depot', l: 'Date de la demande de subvention de l’Anah' },
          { c: 'dos_num_anah', l: 'S’il vous a déjà été fourni, n° de dossier Anah' },
        ],
      },
      {
        titre: 'Demande de versement d’une avance sur subvention',
        items: [
          { c: 'ent_nom', l: 'Entreprise' }, { c: 'dev_reference', l: 'Référence du devis' },
          { calc: 'fin_travaux_ht', l: 'Coût total des travaux' }, { c: 'ava_montant', l: 'Avance demandée' },
          { texte: 'Le taux et le plafond d’avance ne sont pas contrôlés par l’outil. Pièces à joindre : au moins un devis daté et signé mentionnant un acompte, un RIB original.' },
        ],
      },
      {
        titre: 'Travaux du devis',
        items: [{ table: 'postes', colonnes: [{ c: 'pst_intitule', l: 'Poste' }, { c: 'pst_ht', l: 'Montant HT', num: true }], total: [{ calc: 'fin_travaux_ht' }] }],
      },
    ],
    signature: {
      items: [{ c: 'doc_lieu', l: 'Fait à' }, { c: 'doc_date', l: 'le' }, { texte: 'Date et signature obligatoires, par la seule personne bénéficiaire de la subvention.' }],
      signataires: ['Signature'],
    },
  },
  {
    id: 'ACO',
    onglet: 'Demande d’acompte',
    titre: 'Demande de paiement d’acompte',
    reference: 'cerfa n° 13467*02',
    prioritaire: true,
    plans: ['devis'],
    sections: [
      RESERVE_ANAH,
      {
        titre: 'Demande',
        items: [
          { c: 'acp_rang', l: '1er acompte / 2e acompte' },
          { c: 'log_adresse', l: 'Adresse de l’immeuble ayant fait l’objet de travaux' }, { c: 'log_cp', l: 'Code postal' }, { c: 'log_commune', l: 'Commune' },
          { calc: 'acp_declarant', l: 'Je soussigné(e) (nom, prénom, adresse, numéro de téléphone)' },
          { texte: 'bénéficiaire, ou représentant légal du bénéficiaire, ou mandataire, certifie que les travaux, objet des factures ci-jointes, concernent bien l’immeuble mentionné ci-dessus et sont à ce jour entièrement exécutés.' },
          { c: 'acp_contact_verification', l: 'L’Anah, pour vérification, pourra contacter (nom, prénom, adresse, numéro de téléphone)' },
          { c: 'prop_telephone', l: 'Téléphone du demandeur' },
        ],
      },
      { titre: 'Entreprises', items: [{ bloc: 'aco_entreprises' }] },
      {
        titre: 'Travaux du devis',
        items: [{ table: 'postes', colonnes: [{ c: 'pst_intitule', l: 'Poste' }, { c: 'pst_ht', l: 'Montant HT', num: true }], total: [{ calc: 'fin_travaux_ht' }] }],
      },
    ],
    signature: {
      items: [{ c: 'doc_lieu', l: 'Fait à' }, { c: 'doc_date', l: 'le' }],
      signataires: ['Signature du bénéficiaire ou de son mandataire'],
    },
  },
  {
    id: 'SYN',
    onglet: 'Synthèse du logement',
    titre: 'Synthèse d’analyse du logement',
    reference: 'maquette (sans imprimé officiel dans le pack)',
    prioritaire: true,
    plans: ['devis'],
    sections: [
      {
        titre: 'Logement',
        items: [
          { c: 'prop_nom', l: 'Propriétaire' }, { c: 'log_adresse', l: 'Adresse du logement' }, { c: 'log_type', l: 'Type de logement' },
          { c: 'log_annee', l: 'Année de construction' }, { c: 'log_surface', l: 'Surface habitable', unite: 'm²' },
          { c: 'log_chauffage', l: 'Énergie de chauffage' }, { c: 'ene_classe_avant', l: 'Étiquette énergétique' },
        ],
      },
      { titre: 'Travaux envisagés', items: [{ bloc: 'noms_postes' }] },
      { titre: 'Observations du conseiller', items: [{ bloc: 'texte_libre', c: 'dos_observations', l: 'Observations du conseiller' }, { texte: 'Texte libre rédigé par le conseiller : il n’est pas généré par l’outil.' }] },
    ],
    signature: null,
  },
  // Documents de L6, dans l'ordre proposé au cadrage (§11).
  {
    id: 'DAP',
    onglet: 'Demande d’aide (PO)',
    titre: 'Demande d’aide — propriétaire occupant',
    reference: 'cerfa n° 12711*08',
    prioritaire: false,
    plans: ['devis'],
    requisPropose: ['prop_nom', 'log_adresse', 'doc_date'],
    sections: [
      { titre: 'Réservé à l’Anah', items: [{ c: 'dos_delegation', l: 'Délégation' }, { c: 'dos_num_anah', l: 'N° de dossier' }, { c: 'dos_date_depot', l: 'Date du dépôt' }] },
      {
        titre: '1. Identité du demandeur de l’aide',
        items: [
          { c: 'prop_civilite', l: 'Mr ou Mme' }, { c: 'prop_nom', l: 'Nom' }, { c: 'prop_prenom', l: 'Prénom' },
          { c: 'prop_naissance', l: 'Année de naissance', annee: true },
          { c: 'log_adresse', l: 'Adresse du logement à améliorer' }, { c: 'log_batiment', l: 'Bâtiment' }, { c: 'log_escalier', l: 'Escalier' },
          { c: 'log_etage', l: 'Étage' }, { c: 'log_porte', l: 'Porte' }, { c: 'log_cp', l: 'Code postal' }, { c: 'log_commune', l: 'Commune' },
          { c: 'prop_telephone', l: 'Tél' }, { c: 'prop_portable', l: 'Portable' }, { c: 'prop_email', l: 'Mèl' },
          { c: 'foy_composition', l: 'Nombre total d’occupants du logement à améliorer (vous y compris, le cas échéant)' },
          { table: 'occupants', titre: 'Identité des occupants du logement à améliorer (en dehors de vous)', colonnes: [{ c: 'foy_occ_civilite', l: 'Civilité' }, { c: 'foy_occ_nom', l: 'Nom' }, { c: 'foy_occ_prenom', l: 'Prénom' }, { c: 'foy_occ_naissance', l: 'Année de naissance' }] },
          { c: 'foy_liste_papier', l: 'Liste des occupants complétée sur papier libre' },
          { c: 'foy_enfants_naitre', l: 'Le cas échéant, nombre d’enfant(s) à naître' },
          { c: 'prop_qualite_occupation', l: 'Vous occupez le logement en qualité de' },
          { c: 'foy_rfr', l: 'Revenu fiscal de référence' }, { c: 'foy_rfr_annee', l: 'correspondant aux revenus de l’année' },
          { c: 'prop_cas_particulier', l: 'Cas particulier : vous n’occupez pas le logement à améliorer mais' },
          { c: 'foy_personnes_toit', l: 'Dans ce cas, nombre de personnes vivant sous le toit' },
        ],
      },
      {
        titre: '2. Description du logement à améliorer',
        items: [
          { c: 'prop_adresse_differente', l: 'Adresse, si différente' },
          { c: 'log_type', l: 'Type de logement' },
          { c: 'log_plus_15ans', l: 'Il a été construit depuis plus de 15 ans' }, { c: 'log_annee', l: 'Année de construction (facultatif)' },
          { c: 'log_parties_communes', l: 'Travaux sur les parties communes de l’immeuble' },
          { c: 'log_ptz_5ans', l: 'Prêt à taux zéro pour l’acquisition au cours des cinq dernières années' },
          { c: 'log_auto_rehab', l: 'Travaux en auto-réhabilitation avec un opérateur spécialisé' },
          { c: 'ene_prim_avant', l: 'Consommation énergétique avant travaux (kWh/m²/an)' },
          { c: 'ene_prim_apres', l: 'Consommation énergétique projetée après travaux (kWh/m²/an)' },
        ],
      },
      {
        titre: '3. Description des travaux',
        items: [{ c: 'dos_travaux_nature', l: 'Nature des travaux souhaités' }, { c: 'dos_travaux_nature_autre', l: 'Autres travaux : nature' }],
      },
      { titre: 'Vos engagements vis-à-vis de l’Anah', items: [{ c: 'prop_mandataire', l: 'Mandataire' }, { texte: 'J’atteste, je m’engage et je reconnais être informé(e) des engagements de l’imprimé (texte fixe de l’imprimé).' }] },
    ],
    signature: {
      items: [{ c: 'doc_lieu', l: 'Fait à' }, { c: 'doc_date', l: 'le' }, { c: 'doc_signataire_qualite', l: 'En qualité de' }],
      signataires: ['Signature du demandeur ou de son mandataire'],
    },
  },
  {
    id: 'RFA',
    onglet: 'Rapport de fin',
    titre: 'Rapport de fin d’accompagnement',
    reference: 'modèle SRC-03',
    prioritaire: false,
    plans: ['factures'],
    requisPropose: ['prop_nom', 'log_adresse', 'doc_date'],
    sections: [
      {
        titre: 'Rénovation énergétique',
        items: [
          { c: 'prop_nom', l: 'Propriétaire' }, { c: 'log_adresse', l: 'Adresse logement rénové' }, { c: 'dos_num_anah', l: 'Réf. demande Anah' },
          { c: 'dos_date_visite1', l: 'Date visite initiale' }, { c: 'dos_date_visite_fin', l: 'Date visite fin de travaux' }, { c: 'rfa_date', l: 'Date du rapport' },
          { c: 'rfa_prestations', l: 'Prestations facultatives réalisées à la demande ou avec l’accord du ménage' },
        ],
      },
      { titre: 'Contenu du rapport d’accompagnement : documents téléversés', items: [{ c: 'rfa_documents_cases', l: 'Document téléversé sur la plateforme' }] },
      {
        titre: 'Travaux réalisés',
        items: [{ table: 'postes', colonnes: [{ c: 'pst_intitule', l: 'Poste de travaux' }, { c: 'pst_surface', l: 'Surface / Qté', num: true }, { c: 'pst_materiau', l: 'Matériau / Type' }, { entreprise: true, l: 'Entreprises' }, { c: 'pst_ttc', l: 'Montant des travaux TTC', num: true }], total: [{ calc: 'fin_travaux_ttc' }] }],
      },
      { titre: 'Attestation de conformité', items: [{ texte: 'Les travaux réalisés sont conformes aux prestations attendues telles que définies dans les devis.' }] },
      { titre: 'Plan de financement final', items: [{ bloc: 'rfa_plan_final' }] },
      { titre: 'Rapport photographique de fin de travaux', items: [{ bloc: 'photos' }] },
    ],
    signature: {
      items: [{ c: 'org_raison_sociale', l: 'Organisation' }, { c: 'org_siret', l: 'SIRET' }, { c: 'doc_lieu', l: 'Fait à' }, { c: 'doc_date', l: 'le' }],
      signataires: ['Signature de l’accompagnateur'],
    },
  },
  {
    id: 'CEE',
    onglet: 'Engagements CEE',
    titre: 'Engagements complémentaires (certificats d’économies d’énergie)',
    reference: 'imprimé sans numéro, MaPrimeRénov’ Parcours accompagné',
    prioritaire: false,
    plans: [],
    requisPropose: ['prop_nom', 'log_adresse', 'doc_date'],
    sections: [
      {
        titre: 'Engagement',
        items: [
          { compose: ['prop_nom', 'prop_prenom'], l: 'Je soussigné(e) (nom et prénom de la personne ayant signé la demande d’aide), M. et/ou Mme' },
          { c: 'dos_num_anah', l: 'Numéro du dossier' }, { c: 'log_adresse', l: 'Adresse du logement à rénover' },
          { c: 'prop_qualite', l: 'Ayant formulé une demande d’aide en tant que' },
          { texte: 'reconnais être informé que l’Anah dispose d’un droit d’exclusivité pour l’enregistrement des certificats d’économies d’énergie générés par le projet, et m’engage à ne pas permettre leur enregistrement par moi-même ou un tiers (texte fixe de l’imprimé).' },
        ],
      },
    ],
    signature: { items: [{ c: 'doc_lieu', l: 'Fait à' }, { c: 'doc_date', l: 'le' }], signataires: ['Signature'] },
  },
  {
    id: 'EXC',
    onglet: 'Attestation d’exclusivité',
    titre: 'Attestation d’exclusivité du professionnel',
    reference: 'imprimé sans numéro, certificats d’économies d’énergie',
    prioritaire: false,
    plans: [],
    requisPropose: ['prop_nom', 'log_adresse', 'ent_nom', 'doc_date'],
    sections: [
      { titre: 'Réservé à l’Anah', items: [{ c: 'dos_delegation', l: 'Délégation' }, { c: 'dos_num_anah', l: 'N° de dossier' }] },
      {
        titre: 'Attestation',
        items: [
          { c: 'ent_representant', l: 'Je soussigné(e), M. et/ou Mme' }, { c: 'ent_nom', l: 'représentant de l’entreprise' }, { calc: 'ent_siren', l: 'n° SIREN' },
          { texte: 'atteste avoir mis en œuvre une opération d’économies d’énergie (texte fixe de l’imprimé).' },
          { c: 'prop_nom', l: 'Nom du maître d’ouvrage des travaux, bénéficiaire des aides' },
          { c: 'log_adresse', l: 'Adresse du logement ou de l’immeuble objet de l’aide' },
        ],
      },
    ],
    signature: { items: [{ c: 'doc_lieu', l: 'Fait à' }, { c: 'doc_date', l: 'le' }], signataires: ['Cachet et signature du professionnel'] },
  },
  ...['PRS', 'PRP'].map((id) => ({
    id,
    onglet: id === 'PRS' ? 'Procuration (engagements)' : 'Procuration (fonds)',
    titre: id === 'PRS' ? 'Procuration sous seing privé pour signer les engagements' : 'Procuration sous seing privé pour la perception des fonds',
    reference: id === 'PRS' ? 'cerfa n° 13462*01' : 'cerfa n° 13463*02',
    prioritaire: false,
    plans: [],
    requisPropose: ['prop_nom', 'log_adresse', 'mand_identite'],
    sections: [
      RESERVE_ANAH,
      {
        titre: 'Mandant',
        items: [
          { c: 'prop_nom', l: 'Je soussigné(e) — Nom' }, { c: 'prop_prenom', l: 'Prénom' }, { adresse: 'demandeur', l: 'Adresse' },
          { c: 'log_cp', l: 'Code postal' }, { c: 'log_commune', l: 'Commune' },
          { c: 'mand_personne_morale', l: 'Le cas échéant, représentant légal de la personne morale' }, { c: 'mand_siege', l: 'dont le siège se trouve' },
          { c: 'log_adresse', l: 'Propriétaire du logement situé' },
        ],
      },
      {
        titre: 'Mandat',
        items: [
          { c: 'mand_identite', l: 'donne mandat à M. (nom et prénom, qualité et adresse du mandataire désigné)' },
          { texte: id === 'PRS' ? 'pour signer en mon nom les engagements liés à la demande de subvention (texte fixe de l’imprimé).' : 'pour percevoir en mon nom les fonds de la subvention (texte fixe de l’imprimé).' },
        ],
      },
    ],
    signature: {
      items: [
        { c: 'mand_lieu', l: 'Fait à (mandataire)' }, { c: 'mand_date', l: 'le' }, { texte: 'Signature du mandataire précédée de la mention manuscrite « Bon pour acceptation de mandat »' },
        { c: 'doc_lieu', l: 'Fait à (mandant)' }, { c: 'doc_date', l: 'le' }, { texte: 'Signature du ou des mandant(s) précédée de la mention manuscrite « Bon pour pouvoir »' },
      ],
      signataires: ['Signature du mandataire', 'Signature du ou des mandant(s)'],
    },
  })),
  {
    id: 'DPE',
    onglet: 'Dossier par étape',
    titre: 'Votre dossier par étape',
    reference: 'modèle SRC-01 (contenu de la mission d’accompagnement)',
    prioritaire: false,
    plans: ['devis'],
    requisPropose: ['prop_nom', 'log_adresse'],
    sections: [
      { titre: 'Votre contact', items: [{ c: 'org_raison_sociale', l: 'Organisation' }, { c: 'etp_conseiller', l: 'Votre contact' }] },
      { titre: 'Étapes du dossier', items: [{ bloc: 'etapes' }] },
      {
        titre: 'Plan de financement prévisionnel',
        items: [
          { c: 'etp_presentation_date', l: 'Présentation faite le' }, { c: 'etp_nature_travaux', l: 'Nature des travaux financés' },
          { bloc: 'lignes_montants', c: 'etp_plan_lignes', l: 'Lignes propres du plan prévisionnel' },
          { calc: 'fin_travaux_ttc', l: 'Coût des travaux TTC' }, { calc: 'fin_aides', l: 'Aides' }, { calc: 'fin_reste_charge', l: 'Reste à charge' },
        ],
      },
      {
        titre: 'Devis type',
        items: [
          { c: 'ent_nom', l: 'Raison sociale et nom de l’entreprise' }, { c: 'ent_adresse', l: 'Adresse' }, { c: 'ent_telephone', l: 'Téléphone' },
          { c: 'ent_email', l: 'Email' }, { c: 'ent_siret', l: 'N° SIRET' }, { c: 'ent_rge', l: 'N° de certificat RGE' }, { c: 'ent_assurance', l: 'Assurance décennale' },
          { c: 'dev_date_edition', l: 'Date d’édition du devis' }, { compose: ['prop_nom', 'prop_prenom'], l: 'Nom et prénom du client' },
          { c: 'log_adresse', l: 'Adresse du client' }, { c: 'dev_reference', l: 'Devis N°' }, { c: 'dev_date_validite', l: 'Date de validité' },
          { c: 'dev_date_previsite', l: 'Date de pré-visite du chantier' }, { c: 'dev_date_travaux', l: 'Date prévisionnelle des travaux' },
          { c: 'dev_acompte_pct', l: 'Acompte mentionné au devis' },
          { table: 'postes', colonnes: [{ c: 'pst_intitule', l: 'Type de travaux' }, { c: 'pst_surface', l: 'Quantité', num: true }, { c: 'pst_unite', l: 'Unité' }, { c: 'pst_prix_unitaire', l: 'Prix unitaire', num: true }, { c: 'pst_ht', l: 'Total', num: true }], total: [{ calc: 'fin_travaux_ht' }] },
        ],
      },
    ],
    signature: null,
  },
];

// Champs utilisés par les rubriques particulières.
export const BLOCS = {
  pf_financement: ['fin_travaux_ht', 'fin_aides', 'fin_honoraires_amo', 'fin_honoraires_moe', 'fin_depenses_ht', 'fin_depenses_ttc', 'fin_pret',
    'fin_ecoptz', 'fin_autre_pret', 'fin_apport', 'fin_aide_anah', 'fin_aide_fart', 'fin_aide_epci', 'fin_prime_epci', 'fin_aide_cd',
    'fin_prime_cd', 'fin_aide_region', 'fin_prime_cr', 'fin_aide_ue', 'fin_aide_retraite_base', 'fin_retraite_org_base',
    'fin_aide_retraite_compl', 'fin_retraite_org_compl', 'fin_aide_autre_publique', 'fin_aide_autre_publique_nature', 'fin_aide_mdph',
    'fin_aide_fap', 'fin_aide_sla', 'fin_aide_retraite', 'fin_aide_sans_nom', 'fin_energie_primaire', 'fin_total_aides_publiques',
    'fin_autres_aides', 'fin_prime_cee', 'fin_autres_primes', 'fin_total_ressources', 'fin_cases_marge', 'fin_devis_fige',
    'fin_subv_total_prev', 'fin_subv_total_reel', 'fin_reste_charge', 'fin_solde_projet'],
  equilibre: ['fin_travaux_ht', 'fin_total_ressources', 'fin_solde_projet'],
  energie_avant_apres: ['ene_prim_avant', 'ene_prim_apres', 'ene_fin_avant', 'ene_fin_apres', 'ene_ges_avant', 'ene_ges_apres',
    'ene_classe_avant', 'ene_classe_apres', 'ene_surface_ref_avant', 'ene_surface_ref_apres', 'ene_scenario_ref'],
  gain_classes: ['ene_gain_classes'],
  aco_entreprises: ['ent_nom', 'ent_adresse', 'ent_siret', 'dev_reference', 'ent_devis_ht', 'ent_travaux_executes_ht', 'ent_pct_executes', 'ent_observations'],
  rfa_plan_final: ['fin_travaux_ttc', 'fin_aides', 'fin_reste_charge', 'fin_ecoptz', 'fin_apport', 'fin_autre_pret'],
  noms_postes: ['pst_intitule'],
  texte_libre: [],
  photos: ['rfa_photos'],
  etapes: ['etp_cases'],
  lignes_montants: [],
};

// Champs placés dans un document ; « signature » ajoute la zone de signature de la dernière page.
export function champsDuDocument(doc) {
  const ids = new Set();
  const visiter = (it) => {
    if (it.c) ids.add(it.c);
    if (it.calc) ids.add(it.calc);
    (it.compose || []).forEach((x) => ids.add(x));
    if (it.adresse) ['prop_adresse_differente', 'log_adresse', 'log_cp', 'log_commune'].forEach((x) => ids.add(x));
    if (it.filtre === 'eligibles') ids.add('pst_eligible');
    if (it.table) it.colonnes.forEach((col) => { if (col.c) ids.add(col.c); (col.details || []).forEach((x) => ids.add(x)); if (col.entreprise) ids.add('ent_nom'); });
    if (it.total) it.total.forEach((t) => ids.add(t.calc));
    if (it.bloc) (BLOCS[it.bloc] || []).forEach((x) => ids.add(x));
  };
  doc.sections.forEach((s) => s.items.forEach(visiter));
  if (doc.signature) {
    doc.signature.items.forEach(visiter);
    ids.add('doc_signature');
  }
  return ids;
}
