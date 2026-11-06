---
project: avereo-app-projet
document_type: changelog
title: Changelog de Projet
status: active
version: git
created: 2026-09-19
updated: 2026-11-06
owner: jpdandin
tags:
  - projet
  - changelog
---

# Changelog de Projet

## 2026-11-06 — Interface simple livrée en préproduction

Version fusionnée de #114 installée après accord explicite, sauvegarde et restauration sur copie. Paquet identique au candidat vérifié, 16 fichiers conformes, 74 contrôles HTTP synthétiques et deux projets relus ; huit JSON privés inchangés. Réserve de positionnement du menu à largeur intermédiaire consignée pour correction. Aucune production.


## 2026-11-06 — Correction du menu Projet et fichiers

Le menu reste maintenant au-dessus des barres et du tableau du planning. Les couches internes du Gantt sont isolées dans leur zone ; les fiches de tâche conservent leur priorité. Correction visuelle contrôlée sur ordinateur et mobile, sans changement des données.

## 2026-11-06 — Candidat local : interface simple et calendrier pluriannuel

Résultats attendus cochables, ajout/modification, vérification optionnelle, préférence de date contrainte, protection des brouillons de fiche, recherche et filtres combinés, colonnes secondaires et liens optionnels, densité et vues Mois/Années. Schéma des plannings conservé. Les préférences PHP sont compatibles en lecture avec les catalogues précédents. Aucun déploiement réalisé.


## 2026-11-06 — Acceptation #112 et cadrage de l’interface simple

Validation utilisateur des filtres/colonnes et merge #112 constatés. Code de main identique au candidat applicatif, CI réussie et assets préproduction conformes. Échecs des publications automatiques cPanel (authentification 401 avant transfert) et Pages du prototype (site introuvable) consignés sans relance. Proposition fonctionnelle et suivi distinct créés pour la simplification des fiches/planning et les échelles Mois/Années. Aucun code ni document de planning modifié.

## 2026-11-06 — Sujets et colonnes installés en préproduction

Installation autorisée, sauvegarde et restauration sur copie vérifiées, 65 contrôles HTTP sur fixtures hébergées réussis. Deux projets relus ; huit JSON privés identiques. [Preuves](data/preprod-sujets-colonnes/delivery-observation.json). PR #112 reste ouverte pour revue humaine ; aucune production engagée.

## 2026-11-06 — Sujets, priorité visible et colonnes ajustables, candidat local

- Filtrer le Gantt par sujet et priorité, avec compteur et avertissement de dépendances masquées.
- Confirmer un sujet et une priorité dans la fiche ; conserver les champs dans le JSON, le CSV étendu et l’API privée.
- Proposer un classement des anciennes tâches sans écriture implicite ; mettre en évidence les priorités hautes.
- Ajuster chaque colonne et la séparation tableau/calendrier au pointeur ou au clavier, mémoriser les largeurs dans le navigateur et les réinitialiser.
- PR #111 constatée fusionnée ; clôture documentaire précédente conservée. État de qualification et prochaines actions dans le [suivi](data/suivi-sujets-colonnes.json).


## 2026-11-05 — Clôture et besoins de la prochaine itération

Confirmation utilisateur du bon fonctionnement du menu enregistrée dans le suivi. Demandes de priorité emploi visible, filtres par sujet et colonnes ajustables consignées dans les exigences et la roadmap, sans implémentation. Écart entre merge #111 annoncé et PR encore ouverte enregistré pour reprise. Aucun test applicatif, déploiement ni écriture de planning exécuté pour la clôture.


## 2026-11-05 — Import privé réalisé et menu de compte livré en préproduction

- Import d’un projet indépendant autorisé ; rechargement et égalité du contenu vérifiés, document courant inchangé.
- Menu installé en préproduction après accord : déconnexion déplacée du bouton flottant vers Mon espace, fermeture clavier/extérieure et accès aux rubriques du compte. Les deux projets et tous les JSON privés restent identiques après recette.
- [Suivi import](data/suivi-import-prive.json) et [suivi menu](data/suivi-menu-compte.json) distincts.


## 2026-11-05 — Préparation d’un import de planning privé

- Préparateur local : validation du JSON complet sans perte, copie exacte et manifeste SHA-256.
- Refus d’écrasement et de destinations Git ou publiques connues ; tests sur données fictives.
- [Procédure](workflows/import-prive.md) d’import indépendant et [suivi canonique](data/suivi-import-prive.json).
- Aucun changement des assets applicatifs, de l’API ou des comptes ; contenu réel conservé hors dépôt.


## 2026-11-05 — Mon espace et plusieurs projets en ligne

Livré en préproduction ; planning courant préservé à l’identique, accueil et
ouverture du Gantt contrôlés après reconnexion et rechargement.

- Page du compte et accueil Mes projets : liste, recherche, tri, création, import.
- Référence client libre, archives réversibles et préférences mémorisées en ligne.
- Lien vers le profil et la gestion des accès existants dans CONNECT.
- Révisions et sauvegardes par projet, garde des modifications en attente.
- Reprise du document existant en place ; contrôles d’isolation et de récupération.
- État exact du candidat et de la livraison : [suivi](data/suivi-espace-projets.json).


## 2026-11-05 — Candidat de sauvegarde privée du Gantt

Livré en préproduction après qualification ; planning de 45 tâches enregistré
et repris sans perte. PR #107 en attente de revue humaine.

- Service PHP réservé au propriétaire CONNECT ; JSON complet, révisions et copies.
- Reprise entre navigateurs, copie locale en attente, refus des conflits et CSRF.
- Chargement actualisé du wrapper et des scripts ; ancien brouillon conservé.
- Tests de sessions indépendantes, pannes, droits, récupération et déploiement.
- État de livraison et preuves dans le suivi de l'itération ; production distincte.


## 2026-10-28 — Gantt personnel et livraison préproduction

- Défilement aligné, cartouches repliables et synthèses calendrier.
- Déplacements des dates et de l'ordre avec prévisualisation, annulation et gardes.
- Repère rouge du jour, zooms et calendrier local conservés, sans écriture des données.
- Reprise sur le main courant sans modifier les travaux d'autres copies.
- Préparation d'une livraison gardée de quatre fichiers, sans SQL ni modification d'accès.
- Livraison et empreintes serveur/HTTP vérifiées après sauvegarde/restauration réelle
  et contrôle de passage ; PR #90 en brouillon, CI réussie. Recette ciblée dans
  Chrome connecté : référence de 45 tâches importée, repli/repère du jour et
  export/rechargement contrôlés avec conservation stricte. Aucun merge ni production.
- Nouveau besoin consigné : clients/projets indépendants et enregistrement sur
  serveur. Exigences et piste d'architecture V2 proposées ; utilisateurs et droits
  à préciser, sans activation de backend, de MySQL ou de nouvelle API métier.

## 2026-09-25 — Revues complémentaires dans leur phase

- Les PR documentaires des observations de suivi sont affichées dans la phase
  concernée avec le libellé « Revue complémentaire » et leur portée.
- La PR principale et sa preuve sont conservées ; filtrage strict de la phase,
  mêmes contrôles URL/date/empreinte et dédoublonnage des références.
- Présentation en lecture seule, sans modification du journal, des statuts ou
  des transitions. Contrat et parcours utilisateur documentés.
- Dix tests ciblés PR et build complet réussis : 144 tests, contrôle du planning,
  compilation et vérification de l'artefact sans données ni API de revue.

## 2026-09-25 — PR associée à une phase

- Carte facultative dans la phase sélectionnée : lien GitHub validé, état
  consigné, date du constat, révision et preuves de fusion disponibles.
- Normalisation des URL, dépôt, numéro, état, dates et empreintes ; absence
  de carte pour les anciens suivis ou des références essentielles invalides.
- Lecture des seules métadonnées du chantier, sans requête GitHub, écriture,
  approbation ni transition automatique.
- Contrat facultatif documenté dans [l’API locale](api/revue-locale.md#pull-request-de-phase).

## 2026-09-24 — Livrables attendus et actualisation du suivi

- Fiches de livrables avec titre, description et preuves attendues facultatifs.
- Distinction entre document à produire, document de travail et disponibilité
  pour revue, sans changement automatique des jalons du chantier.
- Lecture automatique du suivi à cadence limitée et au retour à la page ;
  saisies et sélections conservées, attestations invalidées de façon ciblée.
- Protection contre une ancienne lecture qui remplacerait une décision venant
  d'être enregistrée ; tests des changements de document sans modification du JSON.
- Résultats et limites consignés dans la
  [recette de l'actualisation](docs/recette-revue-locale.md#complément-du-24-septembre--livrables-attendus-et-actualisation).

## 2026-09-24 — Progression des phases et accords antérieurs

- Vue de progression sélectionnable, jalons, disponibilité et prochaines actions par phase.
- Compteurs distincts de validations, remises historiques et phases actuellement à valider.
- Affichage des accords antérieurs fournis par le chantier avec provenance, commentaires et nature de preuve.
- Calculs de présentation testés sans modifier les journaux ni les transitions du service.
- Guide utilisateur et sources structurantes actualisés ; accès toujours local.

## 2026-09-24 — Guide utilisateur du suivi

- Guide commun des revues, décisions, planning, risques et sauvegardes.
- Parcours utilisateur centralisé ; liens depuis le README et le workflow technique.
- Distinction entre JSON du chantier sur disque et planning conservé par origine navigateur.

## 2026-09-24 — Revue et approbation locales

- Espace intégré : lecture mise en forme/source, critères explicites et journal.
- Décisions dans le JSON existant, preuves SHA-256 et sauvegarde préalable.
- Approbation, autorisation et démarrage distincts ; corrections et nouvelle remise.
- Refus des révisions périmées, écritures concurrentes et accès hors du dossier.
- Lanceur Windows, démonstration isolée, tests et contrôle de l'artefact.
- Documentation du contrat, de la recette et du workflow de développement.

Résultats et limites dans [la recette](docs/recette-revue-locale.md).
Cette livraison ne valide aucune phase du chantier réel et ne publie aucun site.


## 2026-09-19 — Planning implémenté localement

- Dates/capacité configurables et charges décimales, calcul séquentiel par défaut.
- Validation des imports et dépendances, reprise navigateur et JSON/CSV.
- Source unique du pilote et diffusion réservée au développement local.
- Tests moteur, interactions et contrôleur ; recette navigateur du pilote,
  modification, reprise après rechargement et import CSV confirmé.
- Socle documentaire applicatif ; distinction local, sas et publication.

Les résultats exécutés et les limites restantes sont dans
[l'audit source](docs/source-audit.md). L'évolution est proposée pour revue
dans une PR brouillon dédiée.
Cette entrée n'atteste aucune publication ni qualification préproduction/production.

## 2026-09-19 — Fiches d'actions, checklists et risques détaillés

- Descriptions, actions, résultats attendus et sources ajoutés aux lots du pilote.
- Réalisation et validation humaine distinctes, preuves et vérificateur conservés
  dans le JSON ; aucun avancement de lot déduit automatiquement.
- Registre des risques avec causes, conséquences, qualification, mesures et suivi ;
  préqualification indicative argumentée, statut initial À qualifier maintenu,
  clôture ou acceptation justifiée.
- Enrichissement des fiches absentes compatible avec les anciens brouillons,
  complément des préqualifications encore vierges, conservation des détails
  d'une même tâche lors d'un réimport tabulaire.
- Consultation locale du document généré en texte brut et contrôles des limites
  de sauvegarde, y compris le volume UTF-8.

Extension préparée localement dans le périmètre de la PR #64. Sa recette ciblée
et ses limites sont détaillées dans l'audit : tests/build réussis et parcours
locaux constatés, sans publication hébergée.

## 6 novembre 2026 — Mon espace commun

Candidat local : Le pied de barre latérale réutilise le composant commun ; Mes projets, Préférences et Mon compte conservent les actions ProjectWorkspace. Le lien CONNECT dépend du portail configuré. [Suivi du lot](../avereo-platform/data/suivi-fonctions-communes.json).

## 2026-11-06 — Projets et préférences propres

Mes projets et Préférences conservent les actions natives de ProjectWorkspace. Mon compte ouvre désormais directement le profil CONNECT, comme dans les autres applications ; les plannings, sauvegardes et préférences natives restent inchangés. Candidat local PR #121 ; installation hébergée distincte.
