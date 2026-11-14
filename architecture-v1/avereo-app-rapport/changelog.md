---
project: avereo-app-rapport
document_type: changelog
title: Evolutions significatives de Rapport AVEREO
status: active
version: git
created: 2026-09-10
updated: 2026-11-13
owner: jpdandin
tags:
  - rapport
  - changelog
---

## 13 novembre 2026 — Photos préparées pour le rapport, candidat local

Recadrage, rectangle, flèche et commentaire sur copie JPEG, annuler/rétablir et choix explicite original/préparée. Original et référence privée intacts ; opérations et choix conservés dans le JSON, même source choisie dans les deux livrables avec filtrage client. Le quota privé compte les résidus après interruption et conserve les réservations SQL des fichiers manquants. 186 tests Node, contrôles PHP et deux builds réussis ; recette navigateur locale et contenu image des deux Word vérifiés. Recette MariaDB bloquée par Docker Desktop, aucun déploiement ni PDF nouveau. [Guide et preuves](docs/photos-rapport-edition.md).

## 13 novembre 2026 — Correctif de pagination vérifié en préproduction

Maintien des constats client avec conseils et photo, conclusion de décision regroupée et espacement des tableaux de décision ajusté. Tests de la structure OOXML et du contenu HTML ; 176 tests et deux compilations réussis. Les deux Word hébergés sont convertis en PDF dans Word : expert 20 pages, synthèse 6 pages, 26 pages relues et deux réserves résolues. Livraison bornée à trois fichiers ; 20 dossiers, propriétaires et contenus préservés. PR154 en brouillon pour revue, sans fusion ni production. [Qualification et limites](docs/partage-tests-et-stockage.md#correction-de-pagination--13-novembre).


## 13 novembre 2026 — Exports Word et conversion PDF contrôlés

Rapport expert complet et synthèse client générés depuis l’interface de préproduction, puis convertis en PDF dans Word : textes et médias attendus conservés sur les 27 pages inspectées. Deux réserves de pagination sont alors ouvertes et corrigées ensuite par le correctif ci-dessus ; aucun export PDF direct qualifié. [Méthode, sélection client et résultats](docs/partage-tests-et-stockage.md#contrôle-des-exports-word-et-pdf--13-novembre).


## 13 novembre 2026 — Recette complète PR152 en préproduction

Sauvegarde et copie indépendantes entre deux comptes fictifs CONNECT, puis réouverture depuis le serveur dans une nouvelle session sans brouillon local : contenu et médias conservés. Propriétaire et toutes les colonnes source inchangés ; refus d’accès croisés, 18 dossiers antérieurs préservés et état initial des comptes/brouillon restauré. [Preuves, normalisation des collections vides et limites](docs/partage-tests-et-stockage.md#recette-complète-entre-deux-comptes-fictifs--13-novembre). Aucun code applicatif ni production modifié.


## 13 novembre 2026 — PR152 installée en préproduction

Chargement et téléchargement de dossiers complets livrés avec le paquet qualifié, huit fichiers vérifiés, données et propriétaires des 18 dossiers conservés. Sauvegarde fraîche et répétition du retour arrière applicatif sur copie privée. Accès CONNECT, interface et téléchargement fictif contrôlés ; recette complète d’écriture/réouverture sur cible à poursuivre. Aucun changement de production ni activation des originaux privés. [Détail et réserves](docs/partage-tests-et-stockage.md#préproduction).


## 13 novembre 2026 — Réconciliation de PR152

Intégration de `main` après PR150 : conservation des deux fonctionnalités, imports photo et protections de sauvegarde réunis, documentation des deux lots conservée. Aucun déploiement ni nouvelle activation. [Périmètre de résolution](docs/source-audit.md).

## 13 novembre 2026 — Dossier complet, candidat local

Chargement JSON depuis l’accueil et Export avec contrôle du contenu et confirmation ; téléchargement complet et vérifié depuis la liste serveur ; structure de test renommée et signalée, nouvelles copies marquées. Import indépendant, brouillon protégé avant remplacement, sauvegarde en ligne relue avec compteurs et saisies récentes préservées. API additive sans migration et sans changement de droit ou propriétaire. [Parcours et qualification](docs/partage-tests-et-stockage.md). Aucun déploiement de ce correctif.

## 13 novembre 2026 — Première tranche locale des originaux privés

Vue agrandie et zoom des photos, conservation individuelle volontaire et réouverture de l’original privé vérifié par empreinte. API et migration additives, contrôle du propriétaire courant, stockage hors racine web, configuration désactivée par défaut. Tests locaux PHP/SQLite et HTTP/MariaDB, restauration sur copie séparée et parcours navigateur avec mire fictive. Les photos du rapport et les exports restent conservés ; compression, recadrage et annotations ne sont pas activés. [Détail et limites](docs/photos-originales-et-annotations.md). Aucun hébergement modifié pour ce lot.


## 12 novembre 2026 — Lot 0 Observations, complément local

Ordre commun des fiches, plans et Word, déplacement dans une même phase et vue compacte ; libellé « Conseils habitologue » pour tous les profils ; nouvelles créations en Visite Globale, anciens dossiers techniques conservés. Tests et structure des DOCX contrôlés ; revue visuelle en cours. [État exact du lot 0](docs/lot-0-observations.md). Aucun déploiement de ce complément.

## 12 novembre 2026 — Habitologue, candidat local vérifié

Profil de mission et explications entre constat et conseils ajoutés ; rubriques Export adaptées et deux Word fictifs contrôlés. [État et vérifications](docs/profil-habitologue.md). Aucun déploiement de cette évolution.


## 12 novembre 2026 — Photos : originaux privés cadrés, compression non activée

Le responsable demande de conserver les originaux dans un espace privé du dossier en ligne (CONNECT) avant toute version recadrée ou annotée. Le [cadrage](docs/photos-originales-et-annotations.md) est préparé ; le module de compression reste isolé et testé, [non branché](docs/compression-photos.md). L'import de photos est inchangé. Aucun déploiement.

## 12 novembre 2026 — export délégué interrompu

Le correctif local guide la relance d’un téléchargement interrompu. [Vérification dans Chrome](docs/source-audit.md#interruption-du-téléchargement-délégué).

## 2026-11-10 — Copie de test depuis Export

Ajout du partage de fichier et du téléchargement d’une [copie de test](docs/partage-tests-et-stockage.md).

## 2026-11-08 — Navigation de Rapport

Le bandeau commun identifie l’application. Le bouton Accueil rejoint la navigation des étapes et sauvegarde le brouillon avant le retour.

## 2026-11-06 — PR #122 en préproduction

Correction de Mes projets installée et vérifiée depuis la carte intégrée après rechargement. Réserve RGA levée ; aucune modification de données ni de production. [Livraison et recette](../avereo-platform/docs/livraison-mon-espace.md).


## 2026-11-06 — Correction locale du lien Mes projets RGA

Après la livraison PR #121, le changement de fragment de la carte intégrée est pris en compte pour ouvrir et rouvrir Mes projets. Correction locale vérifiée, non livrée. Le paquet PR #121 reste la version active en préproduction. [Livraison et réserves](../avereo-platform/docs/livraison-mon-espace.md).


## 2026-11-02 — Préparation locale des essais temporaires

Contrôle d’une période et d’une révocation avec identité signée, conservation de l’identité dans le sas RGA et essais d’isolement serveur. Aucun déploiement, compte réel ou mail. [Preuves et réserves](docs/essais-temporaires.md).


## 2026-11-02 — Candidat local de repérage Cricq

Ajout de plans et coupes privés au dossier, placement et déplacement de repères liés aux observations, zoom, légendes et export Word annoté. Import JSON porté à 50 Mio pour accueillir les médias et aligner le plafond sur l’API par défaut. Validation des nouvelles données côté navigateur et PHP. [Parcours et limites](docs/reperage-observations.md). Aucun déploiement ni statut de revue expert créé par cette entrée.

Réalignement sur `main` après les PR #93 et #95 : conflit documentaire résolu
en conservant les décisions RGA et repères, sans modification des apports
fonctionnels de la PR #94. [Contrôles du réalignement](docs/source-audit.md).


## 2026-11-02 — Dictée et sauvegarde des attentes livrées en préproduction

Micro dans les champs textuels de décision et de livrable ; mécanisme vocal partagé, accord conservé, ajout au texte courant. Bouton d'attente avec confirmation locale ou erreur explicite ; copie serveur distincte. Candidat fonctionnel `63ec279` installé sur [Rapport préproduction via CONNECT](https://connect-preprod.avereo.fr/?app=rapport), après accord explicite. Sauvegarde fraîche des 148 fichiers et de la configuration privée ; installation/restauration répétée sur copie privée, puis trois fichiers livrés et 147 fichiers préexistants conservés. Configuration inchangée, aucune migration ni écriture SQL de livraison. Les reçus sont rattachés à `finalisation20261102.exportInput20261102` dans le suivi canonique. [Recette et réserves](docs/reprise-demo-philippe.md).

## 2026-11-02 — Accès RGA indépendant

Ajout du sas RGA et de son contrôle dans la carte cadastrale et l’iframe. Un compte Rapport sans session RGA est invité à ouvrir RGA depuis CONNECT. Le point est conservé lors du passage et les résultats déjà enregistrés restent accessibles dans Rapport. Tests de tickets, cookies et accès HTTP croisés.

Complément Géorisques préparé localement : reprises limitées des interruptions
et conservation de la dernière synthèse au même point lors d'une recherche
cadastrale échouée. Le service externe reste intermittent ; aucun rétablissement
hébergé annoncé. [Comportement et diagnostic](api/georisques.md).


## 2026-11-02 — Nouvelle carte RGA intégrée

Correction après retour visuel : superposition RGA/cadastre dans la carte du
lieu, la carte autonome et l'iframe. Intensité réglable, contours cadastraux
au-dessus des couleurs, légende et repère conservés. Reprojection contrôlée
avec PROJ ; aucune modification du stockage ni de la lecture officielle.

Ajout de la carte fournie, recherche IGN, repère, lecture cartographique indicative, transfert explicite et restitution expert/client. Accès intégré au bloc Risques et raccourci CONNECT. La recherche d’adresse utilise le service IGN actuel. [Contrat et statut](api/rga.md).

## 2026-11-01 Corrections livrées et deux maisons vérifiées

Livraison préproduction `9ce22fd` de la clarification de complétude et du message photo/dictée, sans changement des droits, du calcul, de l'API ou du générateur Word. Sauvegarde de 31 fichiers et configuration, retour arrière répété sur copie privée, deux fichiers livrés et arbre de 32 fichiers vérifié. Les deux copies DEMO reçoivent les seuls compléments prévus ; JSON serveur exactement attendus, photos/annexes/accords conservés. Quatre Word natifs hébergés, 56 pages rendues et identiques aux préparations relues. La relance CONNECT après expiration de la session de 30 minutes est contrôlée. [Périmètre et réserves](docs/aide-decision-demo.md#corrections-du-1er-novembre).

## 2026-10-30 Aide à la décision de la Visite Globale

Ajout des attentes permanentes et du projet, liens constat/attentes, actions correctives/préventives/évolutives, incontournables et préalables ; deux options comparées sur neuf critères. Restitution expert et client, alertes sur références perdues et omissions, validation de la nouvelle donnée API. Candidat `9a4f414` livré en préproduction le 30 octobre après sauvegarde et répétition du retour arrière ; recette des deux maisons et Word expert/client contrôlés. Aucun chiffrage, classement automatique ou migration de base. [Critères et limites](docs/aide-decision-demo.md).


## 2026-10-24 — Intégration des restitutions AVEREO

- Choix rapport expert / synthèse client sur un dossier unique ; champs de
  synthèse, sélection de constats et d'illustrations, annexes propres au bien.
- Logo et palette AVEREO, tableaux des notes importées, en-tête et pagination.
- Export `.docx` réel avec images incorporées, en remplacement du HTML `.doc`.
- Valeurs libres importées visibles dans les listes sans changement de gravité.
- Procédure de transmission et reprise ; aucune modification de base ou d'OAuth.

# Evolutions significatives de Rapport AVEREO

## 2026-10-24 — Modèles locaux AVEREO pour revue

Enrichissement illustré : risques Géorisques, origines AQC, transferts ADEME, VMC et plan du Cricq, Mollier pédagogique et capture Ubakus historique. Sources et limites tracées dans le paquet de revue.

Deux modèles sur le cas Cricq : 26 pages expert et 6 pages client, Word/PDF
et rendus relus. Logo officiel, palette existante, photographies du dossier
et schémas explicatifs. Exemple JSON chargé dans les champs actuels, sauvegarde
et première réouverture locales réussies, exports natifs comparés (5 observations,
4 photos). Réserve d’affichage des valeurs libres importées et dernier
rechargement interrompu par erreur réseau consignés. Aucune modification du
code applicatif, intégration des modèles, livraison ou validation métier.
Les preuves et limites sont reliées au workflow et au point de reprise.

## 2026-10-24 — Cadrage des deux livrables AVEREO

Demande consignée : dossier expert détaillé à valider et synthèse client courte
et illustrée, avec branding commun. Structure du dossier du Cricq examinée ;
contenus, critères visuels et revue reliés au workflow existant. Cette entrée
décrit un cadrage documentaire, sans nouvel export implémenté ni déploiement.

## 2026-10-24 — Livraison en préproduction pour la démo

- Ajout de la liste des rapports en ligne et de la réouverture avec export préalable possible du brouillon.
- Retour à l’accueil après sauvegarde des dernières saisies.
- Encadré RGA et restitution dans l’export Word lorsque la synthèse existe ; information manquante explicitement distinguée.
- Empaquetage protégé des cartes RGA existantes, sans nouvelle dépendance npm.
- Correction du chevauchement « Se déconnecter » / « Suivant » : action déplacée dans l’en-tête, avec sauvegarde du brouillon avant sortie.
- Reprise du brouillon le plus récent entre IndexedDB et localStorage.
- 60 tests, build authentifié et contrôles GitHub réussis ; parcours local simulé et affichage bureau/mobile contrôlés. Candidat `7082d422` livré après sauvegarde/restauration, huit fichiers vérifiés ; recette authentifiée et rendu natif Word encore à réaliser.


## 2026-10-16 — Suite de production préparée

PR #84 fusionnée et candidate à deux types réempreintée. Inventaire de production
en lecture seule, plan exact de trois remplacements/deux ajouts, contraintes de
récupération et blocage OAuth consignés dans le [dossier commun](../../outillage/acces-preproduction/preparation-production-rapport-passeport.md).
README, déploiement, audit, matrice et roadmap alignés ; aucune livraison de production.

## 2026-09-15

- Relief : les neuf altitudes se superposent au fond cadastral ou aerien,
  avec point de visite, extremes relatifs, emprise pointillee et tableau
  repliable. Calcul et stockage inchanges ; voir
  [fonctionnement et recette](api/contexte-du-bien.md#altitudes-sur-le-fond-cadastral).

- Correction manuelle du point de visite dans Site : clic, glisser-deposer,
  saisie de coordonnees, validation/annulation. Actualisation au point corrige,
  nouvelle confirmation et preservation des notes/photos ; voir
  [la procedure et la recette](api/contexte-du-bien.md#correction-manuelle-du-point-de-visite).

- Evolution 2 : cartes GoRenove/Pro'Reno dans Site apres confirmation du bien,
  copie de l'adresse, liens et notes manuels dates, restitution dans l'export.
- Rattachement invalide apres modification du lien/lieu, sans perte des notes.
  Validation des URL officielles et tests de reprise/export ; aucune API ni
  dependance supplementaire. Voir [la recette](api/ressources-batiment.md).

- Evolution 1 : activation/desactivation complete d'une phase depuis son
  numero ou son nom dans Protocoles ; bouton accessible au clavier et etat visible.
- Conservation puis restauration des choix effectifs ; l'exclusion prime
  sur les sujets d'ecoute. Aucun constat ni photo supprime.
- Observations conservees, ajout bloque dans une phase suspendue jusqu'a
  reactivation, mentions alignees dans l'apercu et le document exporte.
- Ancien JSON sans `enabled` compatible ; fixture de recette synthetique,
  cinq tests cibles ajoutes (44 tests frontend au total).
- Livraison separee de l'evolution 2, sans changement MySQL, authentification,
  dependance ou workflow de deploiement. Voir la
  [recette](workflows/workflow-habitologie.md#recette-de-levolution-1).

## 2026-09-14

- Accords de Visite Globale places sous le titre de Dossier, avant l'ecoute.
- Vues Cadastre, Rapport des risques, Carte PLU / regles, Relief / orientation ;
  synthese interne et relance independante des risques.
- Attributs GPU sources, notes de verification, rose des vents et orientation
  manuelle, reperage altimetrique IGN de neuf points avec limites explicites.
- Payload, reprise JSON defensive et export alignes.
- Verrouillage de la dictee de Visite Globale egalement applique a Export.
- 39 tests et compilation finale reussis ; vues locales, reprise et apercu
  verifies selon le bilan de [contexte du bien](api/contexte-du-bien.md).
- Mise a jour de la PR #61 demandee ; checklist officielle conservee,
  sans cochage, migration, merge ni deploiement.

## 2026-09-13

- Remplacement de l'iframe cartographique par une carte cadastrale IGN directe
  (Leaflet 1.9.4), avec plan, photographies aeriennes et limites des parcelles.
- Bloc visuel simplifie : repere, adresse, statut, recentrage, confirmation
  du bien et retour au champ adresse ; annulation de confirmation disponible.
- Aucun compte Google, cle API, changement MySQL ou workflow de deploiement.
- Controle local du rendu et des transitions ; 31 tests et build reussis.
  La qualification en environnement heberge reste a effectuer.
- Retour utilisateur favorable sur l'apercu local : cette version de prototype
  est retenue pour revue dans la [PR #61](https://github.com/jpdandin44/AVEREO/pull/61).
  Ce jalon ne constitue ni une release de production ni une autorisation de merge.

## 2026-09-12

- Deplacement du fil conducteur de `Dossier` vers l'en-tete de `Protocoles`.
- Entretien enrichi : histoire du bien, travaux passes, vecu, besoin reformule,
  criteres de reussite, contraintes et confirmation de la reformulation.
- Controles Habitologie non selectionnes par defaut, suggestions basees sur
  les sujets coches a l'ecoute, priorite aux choix manuels et preservation des
  anciens dossiers ; libelles d'entretien et d'export mutualises.
- Integration experimentale du plan IGN dans `Site` avec confirmation du lieu
  liee a l'adresse ; rendu du fond non encore valide dans le navigateur integre.
- Affichage du lieu des le geocodage, delais de requetes et protection contre
  les reponses tardives apres sortie de l'etape Site.
- Transformation du fil `Eau -> Air -> Terre -> Feu` en protocole operationnel
  propre a `Visite Globale`, avec controles terrain activables par phase.
- Regroupement des observations d'habitologie dans le meme ordre, ajout d'un
  rattachement au point de protocole et conservation des anciennes
  observations dans une zone `A classer`.
- Affichage dans `Site` de la synthese JSON Georisques : risques naturels et
  technologiques presents, statuts a l'adresse et sur la commune, source,
  horodatage et acces au rapport officiel.
- Decouplage de la recherche cadastrale et de la synthese des risques : une
  parcelle non identifiee n'empeche plus la restitution Georisques.
- Ajout de controles unitaires pour l'ordre et la fusion du protocole ainsi
  que pour l'URL, la normalisation et les statuts Georisques.

## 2026-09-11

- Correction de la semantique de `Visite Globale` : le choix complementaire
  devient le type d'habitation (`Maison`, `Appartement`, `Immeuble collectif`
  ou `Autre habitation`).
- Positionnement de `Eau -> Air -> Terre -> Feu` comme ordre obligatoire des
  dimensions de l'analyse, commun a toutes les visites globales.
- Migration defensive des anciennes valeurs d'element vers `A preciser`, sans
  leur attribuer artificiellement un type de logement.
- Ajout conditionnel de la section `Ecoute client` pour `Visite Globale` :
  motif, attentes, preoccupations, usages et contexte d'occupation.
- Ajout des accords photo et dictee au payload existant ; commandes photo et
  micro desactivees tant que l'accord correspondant n'est pas enregistre.
- Reprise des donnees d'ecoute dans le brouillon, la sauvegarde JSON, l'apercu
  et l'export Word, sans schema MySQL supplementaire.
- Priorisation du prototype fonctionnel ; etude du TDD reportee a la phase
  d'industrialisation en vue de la commercialisation.
- Limitation des nouvelles creations aux categories
  `Expertise & Visite technique` et `Visite Globale`.
- Ajout des sous-categories techniques `Evaluation Energétique`, `Mesures`,
  `cartographie` et `pathologies`.
- Masquage reversible des modules `Assistance avant-projet`,
  `Diagnostic specifique` et `Reception de travaux`, sans suppression de leur
  definition ni de la compatibilite des anciens brouillons.
- Migration defensive des anciennes classifications techniques et Habitologie.
- Formalisation du workflow Habitologie dans une proposition en etude separee
  de l'etat implemente.

## 2026-09-10

- Retablissement dans l'etape `Site` du bouton `Rapport des risques`, omis lors
  de la migration statique de juillet 2026.
- Construction et validation testees du lien vers le rapport PDF officiel
  Georisques a partir des seules coordonnees longitude/latitude.
- Remplacement du type de dossier `Reception de travaux` par
  `Rapport Habitologue` pour les nouvelles creations.
- Reutilisation du meme assistant, du brouillon, des photos, de la dictee, de
  la sauvegarde et de l'export.
- Conservation des anciens dossiers Reception et conversion des prototypes de
  brouillon Habitologie vers le nouveau type.
- Extension de la suite a douze tests unitaires executables avec `npm test`.

## 6 novembre 2026 — Mon espace commun

Candidat local : L’en-tête Rapport réutilise le menu et conserve la sauvegarde avant déconnexion. RGA autonome reçoit le même menu et une sortie qui expire seulement le cookie RGA ; la carte intégrée masque le menu redondant. [Suivi du lot](../avereo-platform/data/suivi-fonctions-communes.json).

## 2026-11-06 — Projets et préférences propres

Mes projets revient à la liste native avec sauvegarde du brouillon avant sortie. Les préférences proposent le format expert/client pour les nouveaux rapports uniquement. RGA conserve ses points repérés et ses réglages dans des espaces de stockage locaux distincts de Rapport ; les résultats de risque sont consultés à nouveau à l’ouverture. Candidat local PR #121 ; installation hébergée distincte.

## 2026-11-06 — Présentation AVEREO des livrables, locale

Nom et logo raccordés à la source commune ; contenus métier et stockages conservés.
Informations légales et configuration par organisation encore à compléter.
[Qualification et limites](../avereo-platform/docs/identite-livrables.md). Aucun déploiement de ce candidat.

## 2026-11-07 — Informations provisoires AVEREO

Le livrable ajoute sous le logo l’identité de société en formation fournie par le
responsable. Les futurs champs d’immatriculation vides restent omis ; identité
fixe commune, sans réglage libre pour les membres. [Source, portée et contrôles](../avereo-platform/docs/identite-livrables.md).
Préparation locale, non déployée.

## 7 novembre 2026 — Missions depuis le dossier

Le candidat local raccorde le dossier au module commun. [Adaptation et preuves](docs/source-audit.md).

## 2026-11-09 — Rapports sauvegardés

L’accueil propose la recherche, un choix de cinq ou cinquante dossiers et la confirmation d’ouverture en tête de liste. [Utilisation](README.md#retrouver-un-rapport-en-ligne).

## 2026-11-09 — Pied de page de l’éditeur

Mon compte, Précédent et Suivant occupent une seule ligne. Les commandes de sauvegarde se trouvent en haut à droite.
