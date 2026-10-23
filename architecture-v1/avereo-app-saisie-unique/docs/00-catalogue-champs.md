---
project: avereo-app-saisie-unique
document_type: catalogue
title: Catalogue des champs AVEREO Saisie unique
status: draft
version: git
created: 2026-10-21
updated: 2026-10-21
owner: jpdandin
tags: [avereo, catalogue, phase-0]
---

# Catalogue des champs AVEREO Saisie unique

Phase 0 — Cadrage. Ce catalogue relève la structure des champs de la maquette, des captures de l'interface
actuelle, des imprimés officiels et des modèles du partenaire. Il ne contient aucune valeur de dossier réel :
les exemples sont fictifs et les valeurs de listes qui nomment un acteur réel sont rendues génériques
(question Q08 de [00-cadrage.md](00-cadrage.md)). Les identifiants sont proposés : ils sont arrêtés à la revue de la phase,
puis figés (jamais renommés ni réutilisés) en phase 1.

## Lecture du catalogue

- **251 champs**, chacun une seule fois, même s'il figure sur plusieurs imprimés (un seul identifiant).
- Statuts : repris de la maquette (18) ; nouveau (147) ; reporté en L6 (45) ;
  à confirmer (41). Les champs « à confirmer » ne sont pas repris en phase 1 tant que la question
  ouverte indiquée n'est pas tranchée.
- Types de dossier : « tous » (champs communs) ; « Énergie » (champs de l'onglet Énergie) ; « Adaptation, Insalubrité »
  (champs d'adaptation) ; « à confirmer (Qnn) » quand la règle arrêtée ne tranche pas (28 champs).
- Onglets : Administratif (59), Projet (31), Financement (70),
  Énergie (34), Travaux (55), hors dossier (2).
  Un champ figure dans l'onglet où la capture le montre ; à défaut, dans celui que ce catalogue lui attribue.
- Sensible : « oui » pour la santé et l'autonomie, la situation sociale ou familiale, les revenus et ressources,
  la naissance, l'identifiant fiscal et les textes libres (26 champs). Les données d'identité et de contact sont des
  données personnelles non sensibles au sens de cet indicateur (question Q28). En cas de doute, le champ est sensible.
- « Requis par » : champs signalés « À compléter » dans le document. Pour les quatre documents de la maquette, c'est la
  section « Contrôles et signalements » de sa description ; pour les autres, c'est une proposition (question Q14).
  Les champs de suivi ne comptent ni dans la progression des onglets ni dans les signalements, sauf s'ils sont requis par un document.
- Les champs « calculés » ne sont pas saisis ; les calculs de la V1 se limitent aux sommes, écarts et moyennes (Q13).
- « Ligne de poste » et « ligne répétée » désignent un champ porté par une ligne d'un tableau (postes de travaux, occupants,
  dérogations). Le plan Devis et le plan Factures portent chacun leur instance de la table des postes et de la section Énergie (question Q32).

### Documents

| Code | Document |
|---|---|
| PF | Plan de financement (cerfa 13460*03) |
| ATD | Attestation de travaux sur devis (SRC-04) |
| ATF | Attestation de travaux sur factures (SRC-05) |
| AVA | Demande de versement d'une avance (cerfa 13934*05) et demande d'avance de la maquette |
| ACO | Demande de paiement d'acompte (cerfa 13467*02) |
| SYN | Synthèse d'analyse du logement (maquette, L2) |
| DAP | Demande d'aide, propriétaire occupant (cerfa 12711*08, L6) |
| EXC | Attestation d'exclusivité du professionnel (sans numéro imprimé, L6) |
| PRS | Procuration pour signer les engagements (cerfa 13462*01, L6) |
| PRP | Procuration pour la perception des fonds (cerfa 13463*02, L6) |
| CEE | Engagements complémentaires CEE (sans numéro imprimé, L6) |
| RFA | Rapport de fin d'accompagnement (SRC-03, L6) |
| DPE | Dossier par étape (SRC-01, L6) |

Les documents prioritaires, dans l'ordre arrêté par le commanditaire, sont PF, ATD, ATF, AVA et ACO ; SYN est repris en L2.
Les autres (DAP, EXC, PRS, PRP, CEE, RFA, DPE) sont traités en L6 ; leurs champs entrent dans ce catalogue dès la phase 0.

### Sources

- Maquette : « maquette » (description détaillée et code).
- Réunion du 19/10/2026 : « transcript ».
- Imprimés officiels : cités par leur numéro de cerfa ; l'attestation d'exclusivité et les engagements complémentaires n'en portent pas d'imprimé.
- Autres fichiers du pack : alias SRC-01 à SRC-11, détaillés dans l'inventaire de [00-cadrage.md](00-cadrage.md).

## Catalogue

| id proposé | intitulé (imprimé ou capture) | onglet | type de saisie | liste de choix | types de dossier | documents qui l'utilisent | requis par | sensible | statut | sources |
|---|---|---|---|---|---|---|---|---|---|---|
| `dos_nom` | Nom du dossier | Administratif | texte | — | tous | — | — | non | nouveau | SRC-07 |
| `dos_parcelle` | Parcelle | Administratif | texte | — | tous | — | — | non | nouveau | SRC-07 |
| `dos_statut` | Statut | Administratif | choix unique | Nouveau ; En cours ; Déposer ; S'engager ; Avance ; Soldé ; Relance ; Abandonner | tous | — | — | non | nouveau | SRC-07 |
| `dos_abandon_cause` | Abandon de la cause | Administratif | liste | options non visibles sur la capture (Q09) | tous | — | — | oui | à confirmer | SRC-07 |
| `dos_programme` | Programme | Administratif | liste | Programme A ; autres options non visibles (Q08, Q09) | tous | — | — | non | nouveau | SRC-07 |
| `dos_observations` | Observations du conseiller | Administratif | texte long | — | tous | SYN | SYN | oui | repris de la maquette | maquette, SRC-07 |
| `dos_alarme` | Alarme ? | Administratif | oui/non | — | tous | — | — | non | nouveau | SRC-07 |
| `dos_origine_contact` | Origine du contact | Administratif | choix unique | le partenaire ; Espace conseil public ; Collectivités ; Travailleur social ; Entreprise ; Médias ; Bouche à oreille ; Autre (Q08) | tous | — | — | non | nouveau | SRC-07 |
| `dos_origine_contact_precision` | Origine du contact : précision (espace conseil public) | Administratif | texte | — | tous | — | — | non | nouveau | SRC-07 |
| `dos_alliances` | Alliances (intervenants affectés au dossier) | Administratif | affectation multiple | liste d'intervenants non visible (Q22) | à confirmer (Q22) | — | — | non | à confirmer | SRC-07 |
| `dos_delegation` | Délégation (bloc « Réservé à l'Anah ») | Administratif | texte | — | tous | PF, DAP, AVA, ACO, EXC, PRS, PRP | — | non | nouveau | cerfa 13460*03, cerfa 12711*08, cerfa 13934*05, cerfa 13467*02, attestation d'exclusivité, cerfa 13462*01, cerfa 13463*02 |
| `dos_num_anah` | N° de dossier Anah | Administratif | texte | — | tous | PF, DAP, AVA, ACO, EXC, PRS, PRP, CEE | — | non | nouveau | cerfa 13460*03, cerfa 12711*08, cerfa 13934*05, cerfa 13467*02, attestation d'exclusivité, cerfa 13462*01, cerfa 13463*02, engagements CEE, SRC-03 |
| `prop_nom` | Nom du propriétaire | Administratif | texte | — | tous | PF, ATD, ATF, AVA, ACO, SYN, DAP, EXC, PRS, PRP, CEE, RFA | PF, ATD, ATF, AVA, ACO, SYN | non | repris de la maquette | maquette, SRC-07, cerfa 13460*03, cerfa 12711*08, cerfa 13934*05, cerfa 13462*01, cerfa 13463*02, engagements CEE, SRC-04, SRC-05, SRC-03 |
| `prop_prenom` | Prénom du propriétaire | Administratif | texte | — | tous | PF, DAP, PRS, PRP | — | non | nouveau | cerfa 13460*03, cerfa 12711*08, cerfa 13462*01, cerfa 13463*02, SRC-07 |
| `prop_civilite` | Civilité (Mr ou Mme) | Administratif | choix unique | Mr ; Mme | tous | DAP, AVA | — | non | nouveau | cerfa 12711*08, cerfa 13934*05 |
| `prop_naissance` | Date de naissance | Administratif | date | — | tous | DAP | — | oui | nouveau | SRC-07, cerfa 12711*08 |
| `prop_telephone` | Téléphone | Administratif | texte | — | tous | PF, DAP, ACO | — | non | nouveau | SRC-07, cerfa 13460*03, cerfa 12711*08, cerfa 13467*02 |
| `prop_portable` | Portable | Administratif | texte | — | tous | DAP | — | non | reporté en L6 | cerfa 12711*08 |
| `prop_email` | E-mail | Administratif | texte | — | tous | PF, DAP | — | non | nouveau | SRC-07, cerfa 13460*03, cerfa 12711*08 |
| `prop_adresse_differente` | Adresse complète du propriétaire (si différente de l'adresse du projet) | Administratif | texte | — | tous | PF, AVA, PRS, PRP | — | non | nouveau | SRC-07, cerfa 13460*03, cerfa 13934*05, cerfa 13462*01, cerfa 13463*02 |
| `prop_qualite` | PO/PB (qualité du demandeur) | Administratif | choix unique | Propriétaire occupant ; Propriétaire bailleur ; Locataire ; Commune (Q08) | tous | CEE | — | non | nouveau | SRC-07, engagements CEE |
| `prop_qualite_occupation` | Vous occupez le logement en qualité de | Administratif | choix unique | propriétaire ou copropriétaire en pleine propriété ; propriétaire ou copropriétaire en indivision ; associé d'une SCI propriétaire du logement ; usufruitier ; titulaire d'un droit d'usage et d'habitation ; titulaire d'un droit réel immobilier ; locataire ; occupant d'un logement en viager | tous | DAP | — | non | reporté en L6 | cerfa 12711*08 |
| `prop_cas_particulier` | Cas particulier (vous n'occupez pas le logement) | Administratif | choix unique | charge des travaux pour des ascendants ou descendants de revenus modestes ; hébergement à titre gratuit d'un ménage de ressources modestes | tous | DAP | — | oui | reporté en L6 | cerfa 12711*08 |
| `prop_mandataire` | Mandataire ? | Administratif | oui/non | — | tous | DAP | — | non | nouveau | SRC-07, cerfa 12711*08 |
| `prop_mandataire_email` | Courriel du mandataire | Administratif | texte | — | tous | — | — | non | nouveau | SRC-07 |
| `foy_niveau_ressources` | Niveau (catégorie de ressources du ménage) | Administratif | liste | options non visibles sur la capture (Q09) | tous | — | — | oui | à confirmer | SRC-07 |
| `foy_rfr` | RFR (revenu fiscal de référence) | Administratif | montant | — | tous | DAP | — | oui | nouveau | SRC-07, cerfa 12711*08 |
| `foy_rfr_annee` | Année des revenus du RFR | Administratif | nombre | — | tous | DAP | — | oui | reporté en L6 | cerfa 12711*08 |
| `foy_composition` | Composition du foyer (nombre d'occupants) | Administratif | nombre | — | tous | DAP | — | oui | nouveau | SRC-07, cerfa 12711*08 |
| `foy_personnes_toit` | Nombre de personnes vivant sous le toit (cas particulier) | Administratif | nombre | — | tous | DAP | — | oui | reporté en L6 | cerfa 12711*08 |
| `foy_enfants_naitre` | Nombre d'enfants à naître | Administratif | nombre | — | tous | DAP | — | oui | reporté en L6 | cerfa 12711*08 |
| `foy_liste_papier` | Liste des occupants complétée sur papier libre | Administratif | oui/non | — | tous | DAP | — | non | reporté en L6 | cerfa 12711*08 |
| `foy_occ_civilite` | Occupant (hors demandeur) : civilité | Administratif | ligne répétée : choix unique | M. ; Mme | tous | DAP | — | oui | reporté en L6 | cerfa 12711*08 |
| `foy_occ_nom` | Occupant (hors demandeur) : nom | Administratif | ligne répétée : texte | — | tous | DAP | — | oui | reporté en L6 | cerfa 12711*08 |
| `foy_occ_prenom` | Occupant (hors demandeur) : prénom | Administratif | ligne répétée : texte | — | tous | DAP | — | oui | reporté en L6 | cerfa 12711*08 |
| `foy_occ_naissance` | Occupant (hors demandeur) : année de naissance | Administratif | ligne répétée : nombre | — | tous | DAP | — | oui | reporté en L6 | cerfa 12711*08 |
| `foy_monoparental` | Foyer monoparental ? | Administratif | oui/non | — | tous | — | — | oui | nouveau | SRC-07 |
| `foy_origine_socio` | Origine socio-économique | Administratif | liste | options non visibles sur la capture (Q09) | tous | — | — | oui | à confirmer | SRC-07 |
| `dos_niveau_apa` | Niveau APA (groupe iso-ressources) | Administratif | choix unique | Néant ; GIR 1 ; GIR 2 ; GIR 3 ; GIR 4 ; GIR 5 ; GIR 6 | Adaptation, Insalubrité | — | — | oui | nouveau | SRC-07 |
| `foy_invalidite80` | Invalidité 80 % | Administratif | oui/non | — | Adaptation, Insalubrité | — | — | oui | nouveau | SRC-07 |
| `ben_nom` | Nom et prénom du bénéficiaire | Administratif | texte | — | à confirmer (Q03) | — | — | non | à confirmer | SRC-07 |
| `log_adresse` | Adresse du logement | Administratif | texte | — | tous | PF, ATD, ATF, AVA, ACO, SYN, DAP, EXC, PRS, PRP, CEE, RFA | PF, ATD, ATF, AVA, ACO, SYN | non | repris de la maquette | maquette, SRC-07, cerfa 13460*03, cerfa 12711*08, cerfa 13934*05, cerfa 13467*02, attestation d'exclusivité, cerfa 13462*01, cerfa 13463*02, engagements CEE, SRC-04, SRC-05, SRC-03 |
| `log_batiment` | Bâtiment | Administratif | texte | — | tous | PF, DAP | — | non | nouveau | cerfa 13460*03, cerfa 12711*08 |
| `log_escalier` | Escalier | Administratif | texte | — | tous | PF, DAP | — | non | nouveau | cerfa 13460*03, cerfa 12711*08 |
| `log_etage` | Étage | Administratif | texte | — | tous | PF, DAP | — | non | nouveau | cerfa 13460*03, cerfa 12711*08 |
| `log_porte` | Porte | Administratif | texte | — | tous | PF, DAP | — | non | nouveau | cerfa 13460*03, cerfa 12711*08 |
| `log_cp` | Code postal | Administratif | texte | — | tous | PF, ATD, ATF, AVA, ACO, DAP, PRS, PRP | — | non | nouveau | SRC-07, cerfa 13460*03, cerfa 12711*08, cerfa 13934*05, cerfa 13467*02, cerfa 13462*01, cerfa 13463*02, SRC-04, SRC-05 |
| `log_commune` | Commune | Administratif | texte | — | tous | PF, ATD, ATF, AVA, ACO, DAP, PRS, PRP | — | non | nouveau | cerfa 13460*03, cerfa 12711*08, cerfa 13934*05, cerfa 13467*02, cerfa 13462*01, cerfa 13463*02, SRC-04, SRC-05 |
| `dos_projet_communal` | Projet communal | Administratif | texte | — | à confirmer (Q15) | — | — | non | à confirmer | SRC-07 |
| `log_epci` | EPCI | Administratif | liste | Territoire A ; autres options non visibles (Q08, Q09) | tous | — | — | non | nouveau | SRC-07 |
| `log_acq_3ans` | Date d'acquisition inférieure à 3 ans ? | Administratif | oui/non | — | tous | — | — | non | nouveau | SRC-07 |
| `log_quartier_prioritaire` | Quartier prioritaire ? | Administratif | oui/non | — | tous | — | — | non | nouveau | SRC-07 |
| `log_vacance` | Vacance | Administratif | date | — | tous | — | — | non | nouveau | SRC-07 |
| `dos_annee` | Année | Projet | nombre | — | tous | — | — | non | nouveau | SRC-08 |
| `dos_type_projet` | Type de projet (libellé de la capture : « Taper ») | Projet | choix unique | Petite LHI ; Grande LHI ; Énergie ; Handicap ; Mixte PO ; Mixte PB ; Décence ; TU ; FSL ; RSD/SI (Q07) | tous | — | — | non | nouveau | SRC-08 |
| `dos_details` | Détails | Projet | texte | — | tous | — | — | oui | nouveau | SRC-08 |
| `dos_loc1` | LOC1 | Projet | texte | — | à confirmer (Q15) | — | — | non | à confirmer | SRC-08 |
| `dos_loc2` | LOC2 | Projet | texte | — | à confirmer (Q15) | — | — | non | à confirmer | SRC-08 |
| `dos_loc3` | LOC3 | Projet | texte | — | à confirmer (Q15) | — | — | non | à confirmer | SRC-08 |
| `dos_details_loc` | Détails LOC | Projet | texte | — | à confirmer (Q15) | — | — | oui | à confirmer | SRC-08 |
| `dos_date_contact1` | 1er contact | Projet | date | — | tous | — | — | non | nouveau | SRC-08 |
| `dos_permanences` | Permanence (série de dates, au moins quatre visibles) | Projet | série de dates | — | tous | — | — | non | à confirmer | SRC-08 |
| `dos_date_visite1` | 1ère visite | Projet | date | — | tous | RFA | — | non | nouveau | SRC-08, SRC-03 |
| `dos_date_depot` | Dépôt du dossier | Projet | date | — | tous | PF, DAP, AVA, ACO, PRS, PRP | — | non | nouveau | SRC-08, cerfa 13460*03, cerfa 12711*08, cerfa 13934*05, cerfa 13467*02, cerfa 13462*01, cerfa 13463*02 |
| `dos_date_engagement` | Fiançailles (libellé de la capture) | Projet | date | — | à confirmer (Q15) | — | — | non | à confirmer | SRC-08 |
| `dos_avance_date` | Avance (première date de la ligne) | Projet | date | — | tous | — | — | non | à confirmer | SRC-08 |
| `dos_avance_depot` | Avance : dépôt | Projet | date | — | tous | — | — | non | nouveau | SRC-08 |
| `dos_avance_versement` | Avance : versement | Projet | date | — | tous | — | — | non | nouveau | SRC-08 |
| `dos_compte1_date` | Compte 1 (première date de la ligne) | Projet | date | — | tous | — | — | non | à confirmer | SRC-08 |
| `dos_compte1_depot` | Compte 1 : dépôt | Projet | date | — | tous | — | — | non | nouveau | SRC-08 |
| `dos_compte1_versement` | Compte 1 : versement | Projet | date | — | tous | — | — | non | nouveau | SRC-08 |
| `dos_compte2_date` | Compte 2 (première date de la ligne) | Projet | date | — | tous | — | — | non | à confirmer | SRC-08 |
| `dos_compte2_depot` | Compte 2 : dépôt | Projet | date | — | tous | — | — | non | nouveau | SRC-08 |
| `dos_compte2_versement` | Compte 2 : versement | Projet | date | — | tous | — | — | non | nouveau | SRC-08 |
| `dos_obs_avance` | Observation sur l'avance | Projet | texte | — | tous | — | — | oui | nouveau | SRC-08 |
| `dos_solde_anah` | Solde ANAH | Projet | date | — | tous | — | — | non | nouveau | SRC-08 |
| `dos_solde_epci` | Solde EPCI | Projet | date | — | tous | — | — | non | nouveau | SRC-08 |
| `dos_relance` | Relance | Projet | date | — | tous | — | — | non | nouveau | SRC-08 |
| `dos_date_visite_fin` | Date de visite de fin de travaux | Projet | date | — | tous | RFA | — | non | nouveau | SRC-03, transcript |
| `log_type` | Type de logement | Énergie | choix unique | Maison individuelle ; Appartement | tous | SYN, ATD, DAP | — | non | repris de la maquette | maquette, cerfa 12711*08 |
| `log_annee` | Année de construction | Énergie | nombre | — | tous | SYN, ATD, DAP | SYN | non | repris de la maquette | maquette, cerfa 12711*08, SRC-09 |
| `log_periode_construction` | Période de construction (tranche) | Énergie | choix unique | < 1949 ; 1949-1974 ; 1974-1990 ; 1990-2006 ; 2007-2012 ; 2013-2020 ; > 2020 (Q15, Q16) | tous | — | — | non | nouveau | SRC-09 |
| `log_surface` | Surface habitable (m²) | Énergie | nombre | — | tous | SYN | SYN | non | repris de la maquette | maquette, SRC-09 |
| `log_chauffage` | Énergie de chauffage actuelle | Énergie | liste | Fioul ; Gaz ; Électricité ; Bois ; Autre | à confirmer (Q03) | SYN | — | non | repris de la maquette | maquette |
| `log_fiscal_numero` | N° d'identification fiscale | Énergie | texte | — | à confirmer (Q03) | — | — | oui | à confirmer | SRC-09 |
| `log_ae_numero` | N° AE | Énergie | texte | — | à confirmer (Q03) | — | — | non | à confirmer | SRC-09 |
| `log_parties_communes` | Travaux sur les parties communes de l'immeuble | Énergie | oui/non | — | à confirmer (Q03) | DAP | — | non | reporté en L6 | cerfa 12711*08 |
| `log_plus_15ans` | Logement construit depuis plus de 15 ans | Énergie | oui/non | — | à confirmer (Q03) | DAP | — | non | reporté en L6 | cerfa 12711*08 |
| `log_ptz_5ans` | Prêt à taux zéro pour l'acquisition au cours des cinq dernières années | Énergie | oui/non | — | à confirmer (Q03) | DAP | — | oui | reporté en L6 | cerfa 12711*08 |
| `log_auto_rehab` | Travaux en auto-réhabilitation avec un opérateur spécialisé | Énergie | oui/non | — | à confirmer (Q03) | DAP | — | non | reporté en L6 | cerfa 12711*08 |
| `dos_travaux_nature` | Nature des travaux souhaités | Énergie | cases à cocher | rénovation énergétique ; adaptation à la perte d'autonomie et accessibilité ; rénovation lourde ; autres | à confirmer (Q07) | DAP | — | non | reporté en L6 | cerfa 12711*08 |
| `dos_travaux_nature_autre` | Autres travaux : nature | Énergie | texte | — | à confirmer (Q07) | DAP | — | non | reporté en L6 | cerfa 12711*08 |
| `ene_audit_date` | Date de réalisation de l'audit énergétique | Énergie | date | — | Énergie | ATD, ATF | — | non | nouveau | SRC-04, SRC-05 |
| `ene_audit_id` | Identifiant de l'audit énergétique (n°) | Énergie | texte | — | Énergie | ATD, ATF | — | non | nouveau | SRC-04, SRC-05, transcript |
| `ene_scenario_ref` | Référence ou n° du scénario retenu | Énergie | texte | — | Énergie | ATD, ATF | — | non | nouveau | SRC-04, SRC-05, transcript |
| `ene_classe_avant` | Lettre énergie avant travaux | Énergie | choix unique | ≤ 70 A ; 71 à 110 B ; 111 à 180 C ; 181 à 250 D ; 251 à 330 E ; 331 à 420 F ; ≥ 421 G (Q15) | à confirmer (Q03) | ATD, ATF, SYN | — | non | repris de la maquette | maquette, SRC-09, SRC-04, SRC-05, transcript |
| `ene_classe_apres` | Lettre énergie après travaux | Énergie | choix unique | mêmes sept choix que la lettre avant travaux | Énergie | ATD, ATF | — | non | nouveau | SRC-09, SRC-04, SRC-05, transcript |
| `ene_prim_avant` | Valeur énergie avant travaux (énergie primaire, kWh/m²/an) | Énergie | nombre | — | Énergie | ATD, ATF, DAP | — | non | nouveau | SRC-09, SRC-04, SRC-05, cerfa 12711*08, transcript |
| `ene_prim_apres` | Valeur énergie après travaux (énergie primaire, kWh/m²/an) | Énergie | nombre | — | Énergie | ATD, ATF, DAP | — | non | nouveau | SRC-09, SRC-04, SRC-05, cerfa 12711*08, transcript |
| `ene_fin_avant` | Énergie finale avant travaux (kWh/m²/an) | Énergie | nombre | — | Énergie | ATD, ATF | — | non | nouveau | SRC-04, SRC-05, transcript |
| `ene_fin_apres` | Énergie finale après travaux (kWh/m²/an) | Énergie | nombre | — | Énergie | ATD, ATF | — | non | nouveau | SRC-04, SRC-05, transcript |
| `ene_ges_classe_avant` | Lettre GES avant travaux | Énergie | choix unique | ≤ 6 A ; 7 à 11 B ; 12 à 30 C ; 31 à 50 D ; 51 à 70 E ; 71 à 100 F ; ≥ 101 G (Q15) | Énergie | — | — | non | nouveau | SRC-09 |
| `ene_ges_classe_apres` | Lettre GES après travaux | Énergie | choix unique | mêmes sept choix que la lettre GES avant travaux | Énergie | — | — | non | nouveau | SRC-09 |
| `ene_ges_avant` | Valeur GES avant travaux (kgCO2eq/m²/an) | Énergie | nombre | — | Énergie | ATD, ATF | — | non | nouveau | SRC-09, SRC-04, SRC-05, transcript |
| `ene_ges_apres` | Valeur GES après travaux (kgCO2eq/m²/an) | Énergie | nombre | — | Énergie | ATD, ATF | — | non | nouveau | SRC-09, SRC-04, SRC-05, transcript |
| `ene_surface_ref_avant` | Surface de référence du logement avant travaux (m²) | Énergie | nombre | — | Énergie | ATD, ATF | — | non | nouveau | SRC-04, SRC-05 |
| `ene_surface_ref_apres` | Surface de référence du logement après travaux (m²) | Énergie | nombre | — | Énergie | ATD, ATF | — | non | nouveau | SRC-04, SRC-05 |
| `ene_gain_classes` | Gain énergétique (nombre de lettres) | Énergie | calculé | — | Énergie | ATD, ATF | — | non | nouveau | SRC-09, SRC-04, SRC-05 |
| `ene_gain_pct` | Gain énergétique (%) | Énergie | calculé | — | Énergie | — | — | non | à confirmer | SRC-09 |
| `ene_ges_gain_classes` | Gain GES (nombre de lettres) | Énergie | calculé | — | Énergie | — | — | non | nouveau | SRC-09 |
| `ene_ges_gain_pct` | Gain GES (%) | Énergie | calculé | — | Énergie | — | — | non | à confirmer | SRC-09 |
| `ene_derogation_paroi` | Dérogation : paroi opaque ou vitrée concernée | Énergie | ligne répétée : texte | — | Énergie | ATD, ATF | — | non | nouveau | SRC-04, SRC-05 |
| `ene_derogation_motif` | Dérogation : motif (contrainte technique, architecturale ou patrimoniale) | Énergie | ligne répétée : texte | — | Énergie | ATD, ATF | — | non | nouveau | SRC-04, SRC-05 |
| `fin_apport` | Apport personnel (apport de fonds personnels) | Financement | montant | — | tous | PF | — | non | repris de la maquette | maquette, cerfa 13460*03, SRC-02 |
| `fin_aides` | Aides sollicitées (total saisi) | Financement | montant | — | à confirmer (Q11) | PF | — | non | repris de la maquette | maquette |
| `fin_pret` | Prêt (montant saisi) | Financement | montant | — | à confirmer (Q11) | PF | — | non | repris de la maquette | maquette, cerfa 13460*03 |
| `fin_pret1_type` | Type de prêt 1 | Financement | liste | options non visibles sur la capture (Q09) | tous | — | — | non | à confirmer | SRC-06 |
| `fin_pret1_montant` | Montant du prêt 1 | Financement | montant | — | tous | — | — | non | nouveau | SRC-06 |
| `fin_pret2_type` | Type de prêt 2 | Financement | liste | options non visibles sur la capture (Q09) | tous | — | — | non | à confirmer | SRC-06 |
| `fin_pret2_montant` | Montant du prêt 2 | Financement | montant | — | tous | — | — | non | nouveau | SRC-06 |
| `fin_pret3_type` | Type de prêt 3 | Financement | liste | options non visibles sur la capture (Q09) | tous | — | — | non | à confirmer | SRC-06 |
| `fin_pret3_montant` | Montant du prêt 3 | Financement | montant | — | tous | — | — | non | nouveau | SRC-06 |
| `fin_ecoptz` | Éco-PTZ | Financement | montant | — | tous | PF, RFA | — | non | nouveau | SRC-02, SRC-03 |
| `fin_autre_pret` | Autre prêt | Financement | montant | — | tous | PF | — | non | nouveau | SRC-02 |
| `fin_autres_primes` | Autres primes | Financement | montant | — | tous | PF | — | non | nouveau | SRC-02 |
| `fin_travaux_ht` | Travaux HT (coût total des travaux à réaliser) | Financement | calculé (somme des postes de l'onglet Travaux) | — | tous | PF, AVA, ACO | — | non | nouveau | SRC-06, cerfa 13460*03, SRC-03 |
| `fin_travaux_ttc` | Travaux TTC | Financement | calculé (somme des postes de l'onglet Travaux) | — | tous | PF, RFA | — | non | nouveau | SRC-06, SRC-03 |
| `fin_eligibles_ht` | Coût total des travaux éligibles, HT | Financement | calculé (somme des postes éligibles) | — | tous | ATD, ATF | — | non | nouveau | SRC-04, SRC-05 |
| `fin_eligibles_ttc` | Coût total des travaux éligibles, TTC | Financement | calculé (somme des postes éligibles) | — | tous | ATD, ATF | — | non | nouveau | SRC-04, SRC-05 |
| `fin_travaux_energie_ht` | Travaux énergie HT | Financement | montant | — | à confirmer (Q04) | — | — | non | à confirmer | SRC-06 |
| `fin_travaux_handicap_ht` | Travaux handicap HT | Financement | montant | — | Adaptation, Insalubrité | — | — | non | nouveau | SRC-06 |
| `fin_travaux_lhi_ht` | Travaux LHI HT | Financement | montant | — | à confirmer (Q04) | — | — | non | à confirmer | SRC-06 |
| `fin_travaux_autres_ht` | Autres travaux HT | Financement | montant | — | à confirmer (Q04) | — | — | non | à confirmer | SRC-06 |
| `fin_travaux_subv` | Travaux subventionnés | Financement | montant | — | tous | — | — | non | nouveau | SRC-06 |
| `fin_honoraires_amo` | Honoraires d'assistance à maîtrise d'ouvrage (HT) | Financement | montant | — | tous | PF | — | non | nouveau | cerfa 13460*03, SRC-02 |
| `fin_honoraires_moe` | Honoraires de maîtrise d'œuvre (HT) | Financement | montant | — | tous | PF | — | non | nouveau | cerfa 13460*03, SRC-02 |
| `fin_depenses_ht` | Montant total des dépenses HT | Financement | calculé | — | tous | PF | — | non | nouveau | cerfa 13460*03 |
| `fin_depenses_ttc` | Montant total des dépenses TTC | Financement | calculé | — | tous | PF | — | non | nouveau | cerfa 13460*03 |
| `fin_cases_marge` | Cases de marge du plan de financement (lignes retenues) | Financement | calculé (dérivé des montants renseignés) | — | tous | PF | — | non | à confirmer | cerfa 13460*03 |
| `fin_pct_anah` | Pourcentage de subvention ANAH | Financement | pourcentage | — | tous | — | — | non | nouveau | SRC-06 |
| `fin_aide_anah` | Subvention ANAH (aide de l'Anah) | Financement | montant | — | tous | PF | — | non | nouveau | SRC-06, cerfa 13460*03, SRC-02 |
| `fin_aide_fart` | Aide du FART (programme historique) | Financement | montant | — | tous | PF | — | non | à confirmer | cerfa 13460*03 |
| `fin_energie_primaire` | Énergie primaire (ligne de subvention de la capture) | Financement | montant | — | à confirmer (Q04) | — | — | non | à confirmer | SRC-06 |
| `fin_prime_cee` | Primes CEE | Financement | montant | — | tous | PF | — | non | nouveau | SRC-06, SRC-02 |
| `fin_aide_sans_nom` | « subventions » (libellé incomplet de la capture) | Financement | montant | — | à confirmer (Q04) | — | — | non | à confirmer | SRC-06 |
| `fin_aide_epci` | Subvention EPCI (commune ou EPCI) | Financement | montant | — | tous | PF | — | non | nouveau | SRC-06, cerfa 13460*03 |
| `fin_prime_epci` | Prime EPCI | Financement | montant | — | tous | PF | — | non | nouveau | SRC-06, SRC-02 |
| `fin_aide_cd` | Subvention du département (« CD de subvention ») | Financement | montant | — | tous | PF | — | non | nouveau | SRC-06, cerfa 13460*03 |
| `fin_prime_cd` | Prime CD | Financement | montant | — | tous | PF | — | non | nouveau | SRC-06 |
| `fin_aide_region` | Aide de la région | Financement | montant | — | tous | PF | — | non | nouveau | cerfa 13460*03 |
| `fin_prime_cr` | Prime CR | Financement | montant | — | tous | PF | — | non | nouveau | SRC-06 |
| `fin_aide_ue` | Aide de l'Union européenne | Financement | montant | — | tous | PF | — | non | nouveau | cerfa 13460*03 |
| `fin_aide_retraite` | Subvention caisse de retraite (libellé de la capture) | Financement | montant | — | à confirmer (Q04) | — | — | non | à confirmer | SRC-06 |
| `fin_aide_retraite_base` | Caisses de retraite, régime de base | Financement | montant | — | tous | PF | — | non | nouveau | cerfa 13460*03 |
| `fin_retraite_org_base` | Caisses de retraite, régime de base : organisme | Financement | cases à cocher | CNAV/CARSAT ; MSA ; RSI ; Autres | tous | PF | — | non | nouveau | cerfa 13460*03 |
| `fin_aide_retraite_compl` | Caisses de retraite complémentaires obligatoires | Financement | montant | — | tous | PF | — | non | nouveau | cerfa 13460*03 |
| `fin_retraite_org_compl` | Caisses de retraite complémentaires : organisme | Financement | cases à cocher | AGIRC ; ARRCO ; IRCANTEC ; Autres | tous | PF | — | non | nouveau | cerfa 13460*03 |
| `fin_aide_mdph` | MDPH | Financement | montant | — | Adaptation, Insalubrité | — | — | non | nouveau | SRC-06 |
| `fin_aide_fap` | Subvention FAP | Financement | montant | — | à confirmer (Q04) | — | — | non | à confirmer | SRC-06 |
| `fin_aide_sla` | SLA | Financement | montant | — | à confirmer (Q04) | — | — | non | à confirmer | SRC-06 |
| `fin_aide_autre_publique` | Autre aide publique (ADEME, agence de l'eau…) | Financement | montant | — | tous | PF | — | non | nouveau | cerfa 13460*03 |
| `fin_aide_autre_publique_nature` | Autre aide publique : à préciser | Financement | texte | — | tous | PF | — | non | à confirmer | cerfa 13460*03 |
| `fin_autres_aides` | Autres aides (non publiques) | Financement | montant | — | tous | PF | — | non | nouveau | cerfa 13460*03 |
| `fin_total_aides_publiques` | Total des aides publiques | Financement | calculé | — | tous | PF | — | non | nouveau | cerfa 13460*03 |
| `fin_subv_total_prev` | Total des subventions (prévisionnelles) | Financement | calculé | — | tous | PF | — | non | à confirmer | SRC-06 |
| `fin_subv_total_reel` | Subventions totales (réel) | Financement | calculé | — | tous | PF | — | non | à confirmer | SRC-06, SRC-02 |
| `fin_reste_charge` | Reste à charge | Financement | calculé | — | tous | PF, RFA | — | non | nouveau | SRC-06, SRC-02, SRC-03 |
| `fin_total_ressources` | Total des ressources (total financé) | Financement | calculé | — | tous | PF | — | non | repris de la maquette | maquette, cerfa 13460*03 |
| `fin_solde_projet` | Solde du projet | Financement | calculé | — | tous | PF | — | non | nouveau | SRC-02 |
| `fin_devis_fige` | Plan Devis figé au dépôt (état et date) | Financement | état et date | — | tous | PF | — | non | nouveau | transcript |
| `fin_ecart_ht` | Écart total devis-factures, HT | Financement | calculé | — | tous | — | — | non | nouveau | SRC-02, transcript |
| `fin_ecart_ttc` | Écart total devis-factures, TTC | Financement | calculé | — | tous | — | — | non | nouveau | SRC-02, transcript |
| `ava_montant` | Avance demandée | Financement | montant | — | tous | AVA | AVA | non | repris de la maquette | maquette |
| `acp_rang` | Rang de l'acompte (1er ou 2e) | Financement | choix unique | 1er acompte ; 2e acompte | tous | ACO | — | non | nouveau | cerfa 13467*02 |
| `acp_contact_verification` | Contact pour vérification par l'Anah (nom, prénom, adresse, téléphone) | Financement | texte | — | tous | ACO | — | non | nouveau | cerfa 13467*02 |
| `acp_declarant` | Déclarant de la demande de paiement (nom, prénom, adresse, téléphone) | Financement | calculé (composé depuis l'identité du propriétaire) | — | tous | ACO | — | non | nouveau | cerfa 13467*02 |
| `pst_travail` | Travail (catégorie de travaux) | Travaux | liste | Isolation des planchers ; autres options non visibles (Q09) | tous | ATD, ATF | — | non | nouveau | SRC-10, SRC-02, SRC-04 |
| `pst_localisation` | Localisation | Travaux | liste | options non visibles sur la capture (Q09) | tous | — | — | non | à confirmer | SRC-10 |
| `pst_intitule` | Intitulé du poste | Travaux | ligne de poste : texte | — | tous | PF, ATD, ATF, AVA, ACO, SYN | PF, ATD, ATF, AVA, ACO, SYN | non | repris de la maquette | maquette, SRC-02, SRC-04, SRC-05, SRC-03 |
| `pst_eligible` | Poste éligible | Travaux | ligne de poste : oui/non | — | tous | ATD, ATF | — | non | à confirmer | SRC-04, SRC-05 |
| `pst_surface` | Surface ou quantité (m²) | Travaux | ligne de poste : nombre | — | tous | ATD, ATF, RFA | — | non | nouveau | SRC-10, SRC-02, SRC-04, SRC-03 |
| `pst_ht` | Montant HT | Travaux | ligne de poste : montant | — | tous | PF, ATD, ATF, AVA, ACO | PF, ATD, ATF, AVA, ACO | non | repris de la maquette | maquette, SRC-10, SRC-02, SRC-04, cerfa 13460*03 |
| `pst_prix_ht_m2` | Prix HT (m²) | Travaux | calculé (E08) | — | tous | — | — | non | nouveau | SRC-10, transcript |
| `pst_tva` | TVA | Travaux | ligne de poste : liste | Mixte ; autres options non visibles (Q09) | tous | — | — | non | nouveau | SRC-10 |
| `pst_ttc` | Montant TTC | Travaux | ligne de poste : montant | — | tous | ATD, ATF, PF, RFA | — | non | nouveau | SRC-10, SRC-02, SRC-04, SRC-03 |
| `pst_prix_ttc_m2` | Prix TTC (m²) | Travaux | calculé (E08) | — | tous | — | — | non | nouveau | SRC-10, transcript |
| `pst_ecart_ht` | Écart devis-facture du poste, HT | Travaux | calculé | — | tous | — | — | non | nouveau | SRC-02, transcript |
| `pst_ecart_ttc` | Écart devis-facture du poste, TTC | Travaux | calculé | — | tous | — | — | non | nouveau | SRC-02, transcript |
| `pst_materiau` | Matériau ou type | Travaux | ligne de poste : liste | liste ouverte à construire (exemples du modèle : ouate de cellulose, laine de verre, polystyrène graphité) (Q09) | tous | ATD, RFA | — | non | nouveau | SRC-04, SRC-05, SRC-03, SRC-02, transcript |
| `pst_marque` | Marque | Travaux | ligne de poste : texte | — | tous | ATD | — | non | nouveau | SRC-04, transcript |
| `pst_gamme` | Gamme | Travaux | ligne de poste : texte | — | tous | ATD | — | non | nouveau | SRC-04 |
| `pst_reference` | Référence | Travaux | ligne de poste : texte | — | tous | ATD | — | non | nouveau | SRC-04, transcript |
| `pst_acermi` | N° ACERMI (numéro d'identification de l'isolant) | Travaux | ligne de poste : texte | — | tous | ATD | — | non | nouveau | SRC-04, transcript |
| `pst_resistance_r` | Résistance thermique R (m².K/W) | Travaux | ligne de poste : nombre | — | tous | ATD | — | non | nouveau | SRC-04, transcript |
| `pst_epaisseur` | Épaisseur (mm) | Travaux | ligne de poste : nombre | — | tous | ATD | — | non | nouveau | SRC-04, transcript |
| `pst_uw` | Uw (W/m².K) | Travaux | ligne de poste : nombre | — | tous | ATD | — | non | nouveau | SRC-04 |
| `pst_sw` | Sw | Travaux | ligne de poste : nombre | — | tous | ATD | — | non | nouveau | SRC-04 |
| `pst_ud` | Ud (W/m².K) | Travaux | ligne de poste : nombre | — | tous | ATD | — | non | nouveau | SRC-04 |
| `pst_delta_r` | ΔR (m².K/W) | Travaux | ligne de poste : nombre | — | tous | ATD | — | non | nouveau | SRC-04 |
| `pst_puissance` | Puissance (kW) | Travaux | ligne de poste : nombre | — | tous | ATD | — | non | nouveau | SRC-04 |
| `pst_regulation` | Régulation | Travaux | ligne de poste : texte | — | tous | ATD | — | non | nouveau | SRC-04 |
| `pst_scop` | SCOP | Travaux | ligne de poste : nombre | — | tous | ATD | — | non | nouveau | SRC-04 |
| `pst_seer` | SEER | Travaux | ligne de poste : nombre | — | tous | ATD | — | non | nouveau | SRC-04 |
| `pst_fluide` | Fluide | Travaux | ligne de poste : texte | — | tous | ATD | — | non | nouveau | SRC-04 |
| `pst_capacite` | Capacité (L) | Travaux | ligne de poste : nombre | — | tous | ATD | — | non | nouveau | SRC-04 |
| `pst_cop` | COP | Travaux | ligne de poste : nombre | — | tous | ATD | — | non | nouveau | SRC-04 |
| `pst_etas` | ETAS (%) | Travaux | ligne de poste : nombre | — | tous | ATD | — | non | nouveau | SRC-04 |
| `pst_profil_soutirage` | Profil de soutirage | Travaux | ligne de poste : texte | — | tous | ATD | — | non | nouveau | SRC-04 |
| `pst_rendement` | Rendement | Travaux | ligne de poste : nombre | — | tous | ATD | — | non | nouveau | SRC-04 |
| `pst_unite` | Unité (devis type) | Travaux | ligne de poste : texte | — | tous | DPE | — | non | reporté en L6 | SRC-01 |
| `pst_prix_unitaire` | Prix unitaire (devis type) | Travaux | ligne de poste : montant | — | tous | DPE | — | non | reporté en L6 | SRC-01 |
| `ent_nom` | Entreprise (raison sociale) | Travaux | texte | — | tous | AVA, ACO, DPE | AVA, ACO | non | repris de la maquette | maquette, SRC-02, SRC-03, cerfa 13467*02, SRC-01, transcript |
| `ent_adresse` | Adresse de l'entreprise | Travaux | texte | — | tous | ACO, DPE | — | non | nouveau | cerfa 13467*02, SRC-01 |
| `ent_siret` | SIRET de l'entreprise (14 chiffres, Q19) | Travaux | texte | — | tous | ACO, DPE | — | non | nouveau | SRC-02, cerfa 13467*02, SRC-01, transcript |
| `ent_siren` | N° SIREN (déduit du SIRET) | Travaux | calculé | — | tous | EXC | — | non | reporté en L6 | attestation d'exclusivité |
| `ent_telephone` | Téléphone de l'entreprise | Travaux | texte | — | tous | DPE | — | non | reporté en L6 | SRC-01 |
| `ent_email` | Courriel de l'entreprise | Travaux | texte | — | tous | DPE | — | non | reporté en L6 | SRC-01 |
| `ent_representant` | Représentant de l'entreprise (M. et/ou Mme) | Travaux | texte | — | tous | EXC | — | non | reporté en L6 | attestation d'exclusivité |
| `ent_rge` | N° de certificat RGE | Travaux | texte | — | tous | DPE | — | non | reporté en L6 | SRC-01 |
| `ent_assurance` | Assurance décennale : nom et n° de contrat | Travaux | texte | — | tous | DPE | — | non | reporté en L6 | SRC-01 |
| `ent_devis_ht` | Montant HT du devis de l'entreprise | Travaux | calculé | — | tous | ACO | — | non | nouveau | cerfa 13467*02 |
| `ent_travaux_executes_ht` | Montant HT des travaux exécutés sur devis | Travaux | montant | — | tous | ACO | — | non | nouveau | cerfa 13467*02 |
| `ent_pct_executes` | Pourcentage de travaux exécutés | Travaux | calculé | — | tous | ACO | — | non | à confirmer | cerfa 13467*02 |
| `ent_observations` | Observations sur l'entreprise (demande d'acompte) | Travaux | texte | — | tous | ACO | — | oui | nouveau | cerfa 13467*02 |
| `dev_reference` | Référence du devis | Travaux | texte | — | tous | AVA, ACO, DPE | AVA, ACO | non | repris de la maquette | maquette, SRC-01 |
| `dev_date_edition` | Date d'édition du devis | Travaux | date | — | tous | DPE | — | non | reporté en L6 | SRC-01 |
| `dev_date_validite` | Date de validité du devis | Travaux | date | — | tous | DPE | — | non | reporté en L6 | SRC-01 |
| `dev_date_previsite` | Date de pré-visite du chantier | Travaux | date | — | tous | DPE | — | non | reporté en L6 | SRC-01 |
| `dev_date_travaux` | Date prévisionnelle des travaux | Travaux | date | — | tous | DPE | — | non | reporté en L6 | SRC-01 |
| `dev_acompte_pct` | Pourcentage de l'acompte mentionné au devis | Travaux | pourcentage | — | tous | DPE | — | non | reporté en L6 | SRC-01 |
| `doc_lieu` | Fait à | Financement | texte | — | tous | PF, ATD, ATF, AVA, ACO, DAP, EXC, CEE, RFA | — | non | nouveau | cerfa 13460*03, cerfa 12711*08, cerfa 13934*05, cerfa 13467*02, attestation d'exclusivité, engagements CEE, SRC-04, SRC-05 |
| `doc_date` | Date des documents | Financement | date | — | tous | PF, ATD, ATF, AVA, ACO, DAP, EXC, CEE, RFA | ATD, ATF, AVA, ACO | non | repris de la maquette | maquette, cerfa 13460*03, cerfa 12711*08, cerfa 13934*05, cerfa 13467*02, attestation d'exclusivité, engagements CEE, SRC-04, SRC-05, SRC-03 |
| `doc_signataire_qualite` | En qualité de (demandeur ou mandataire) | Financement | choix unique | Demandeur de l'aide ; Mandataire | tous | DAP | — | non | reporté en L6 | cerfa 12711*08 |
| `doc_signature` | Zone de signature (dernière page de chaque document) | Financement | zone non saisie | — | tous | PF, ATD, ATF, AVA, ACO, DAP, EXC, PRS, PRP, CEE, RFA | — | non | nouveau | transcript, tous les imprimés |
| `mand_identite` | Mandataire désigné (nom, prénom, qualité, adresse) | Administratif | texte | — | tous | PRS, PRP | — | non | reporté en L6 | cerfa 13462*01, cerfa 13463*02 |
| `mand_personne_morale` | Représentant légal de la personne morale (mandant) | Administratif | texte | — | tous | PRS, PRP | — | non | reporté en L6 | cerfa 13462*01, cerfa 13463*02 |
| `mand_siege` | Siège de la personne morale (mandant) | Administratif | texte | — | tous | PRS, PRP | — | non | reporté en L6 | cerfa 13462*01, cerfa 13463*02 |
| `mand_lieu` | Fait à (signature du mandataire) | Administratif | texte | — | tous | PRS, PRP | — | non | reporté en L6 | cerfa 13462*01, cerfa 13463*02 |
| `mand_date` | Date de signature du mandataire | Administratif | date | — | tous | PRS, PRP | — | non | reporté en L6 | cerfa 13462*01, cerfa 13463*02 |
| `org_raison_sociale` | Raison sociale de l'organisation accompagnatrice | hors dossier (paramètres) | texte | — | tous | ATD, ATF, RFA | — | non | à confirmer | SRC-04, SRC-05, SRC-03 |
| `org_siret` | SIRET de l'organisation accompagnatrice | hors dossier (paramètres) | texte | — | tous | ATD, ATF, RFA | — | non | à confirmer | SRC-04, SRC-05, SRC-03 |
| `rfa_date` | Date du rapport de fin d'accompagnement | Projet | date | — | tous | RFA | — | non | reporté en L6 | SRC-03 |
| `rfa_prestations` | Prestations facultatives réalisées | Projet | cases à cocher | test d'étanchéité à l'air et contrôle de la ventilation ; prêt d'outils de mesure ; visites complémentaires ; mandataire financier ; mandataire administratif ; auto-rénovation accompagnée ; suivi des consommations post-travaux | tous | RFA | — | non | reporté en L6 | SRC-03 |
| `rfa_documents_cases` | Documents téléversés (une case par pièce, huit pièces) | Projet | ligne répétée : case à cocher | huit pièces de l'annexe I (synthèse d'analyse du logement, plan de financement, audit, attestations, devis et factures, rapports, contrat de sous-traitance) | tous | RFA | — | non | reporté en L6 | SRC-03 |
| `rfa_photos` | Rapport photographique de fin de travaux (21 emplacements d'images) | Travaux | images | — | tous | RFA | — | oui | reporté en L6 | SRC-03 |
| `etp_conseiller` | Contact conseiller (choix entre deux contacts) | Projet | choix unique | deux contacts du partenaire (valeurs non reprises) | tous | DPE | — | non | reporté en L6 | SRC-01 |
| `etp_cases` | Étapes du dossier : 27 cases à cocher réparties en 11 phases | Projet | cases à cocher | cases des phases 1 à 11 de la feuille de route | tous | DPE | — | non | reporté en L6 | SRC-01 |
| `etp_acces_compte` | Identifiant et mot de passe du compte (zones de texte) | Administratif | texte | — | tous | DPE | — | oui | à confirmer | SRC-01 |
| `etp_presentation_date` | Présentation du plan de financement faite le | Financement | date | — | tous | DPE | — | non | reporté en L6 | SRC-01 |
| `etp_nature_travaux` | Nature des travaux financés | Financement | texte | — | tous | DPE | — | non | reporté en L6 | SRC-01 |
| `etp_plan_lignes` | Plan prévisionnel du dossier par étape : lignes propres (audit, prêts d'organismes, mensualités) | Financement | ligne répétée : montant | — | tous | DPE | — | non | reporté en L6 | SRC-01 |

## Éléments des imprimés non catalogués comme champs

- Cases « non » et « oui » des aides publiques de l'imprimé de plan de financement : elles se déduisent du montant de la
  ligne (oui si le montant est renseigné) et ne sont pas saisies.
- Zones « Réservé à l'Anah » : la délégation, le numéro de dossier et la date de dépôt sont catalogués, mais non pré-remplis
  tant que le partenaire ne les a pas saisis ; l'Anah les complète à réception du dossier.
- Mentions légales, textes d'engagement, notes de bas de page et listes de pièces à joindre : textes fixes des aperçus,
  sans champ.
- Dans le dossier par étape : texte des phases, barème d'aides et consignes du devis type (textes fixes) ; les lignes calculées
  du plan prévisionnel intégré (totaux, reste à charge) se déduisent des champs de financement.
- Pièce SRC-11 : image de type QR code, sans champ.
- Feuilles « SURFACES », « TOITURE » et « PLANCHERS » du classeur SRC-02 : calculateurs de surfaces (dimensions de pièces
  et de parois) qui alimentent les surfaces des postes. Ils ne sont pas repris : piste (Q29).
- Colonnes des scénarios 1 à 3, suivi de trésorerie par étapes, plafonds et taux d'aides du classeur SRC-02 : non repris
  (scénarios et trésorerie : question Q29 ; calcul d'aide : piste du cadrage).
