---
project: avereo-app-rapport
document_type: changelog
title: Evolutions significatives de Rapport AVEREO
status: active
version: git
created: 2026-09-10
updated: 2026-11-21
owner: jpdandin
tags:
  - rapport
  - changelog
---

## 2026-11-21 — Candidat local de volume sans perte

Complément de recette : vrais Word expert/client, paquet final réel de 63 Mo, import Passeport, copie privée exacte après nouvelle session, reprise et sauvegarde indépendante dans Rapport puis nouvelle session serveur ; source et propriétaire conservés. 37 médias décodés identiques. PDF issus des DOCX relus sous LibreOffice (42/15 pages), export PDF Microsoft Word restant réservé. Aucun changement de moteur ni déploiement ; [preuves et portée](docs/volume-sans-perte.md#reprise-du-21-novembre-et-parcours-réel-dans-le-navigateur-local).

Limites Rapport/Passeport reliées à une source unique, gardes à 100 Mo pour le JSON, unités Mo/Mio corrigées, contrôles de mémoire et de paquet MySQL, export de récupération préservé. Reconstitution avec originaux mesurée avant génération et import. Types JSON natifs conservés lors de la sauvegarde et de la lecture. Tests de contenu, empreintes et nouvelles sessions locales réussis ; [périmètre exact et réserves](docs/volume-sans-perte.md). Aucun déploiement de ce candidat.


## 2026-11-19 — Publication Passeport en préproduction

Préparation d’une restitution client Word identifiée et d’une copie complète privée ; vérification des empreintes et des originaux photo. Réimport de la copie dans Rapport comme dossier indépendant. Confirmation de relecture professionnelle et distinction explicite entre fichier préparé et conservation serveur. Livré en préproduction après CI et sauvegarde/restauration ; recette native fictive et réouverture réussies. Source et données préexistantes conservées, accès temporaires rétablis. Revue humaine et merge restent à effectuer ; production distincte.
## 17 novembre — Candidat libellé Analyse globale

Option et résumé de mission, titres des couvertures expert/client : Analyse globale pour la clé habitologue. Complément avant revue : Conseils de l’expert dans les observations, le contexte extérieur et les deux Word. Métier CONNECT Habitologue, textes saisis, données et règles des autres parcours inchangés. [Périmètre](docs/profils-professionnels.md#libellé-de-prestation--17-novembre). Aucun déploiement.

## 17 novembre — Candidat Plans et vues du dossier

Bibliothèque de vues, huit types, fonds cadastre/satellite/satellite + parcelles et couple au même cadrage. Liens directs fiche/vue, retrait confirmé sans supprimer le constat, anciens repères et Word conservés. Carte chargée à l’ouverture du volet et reprise bornée d’erreur de tuile. [Parcours](docs/reperage-observations.md). Aucun déploiement.

## 17 novembre — Candidat droits d'action et consultation détaillée

API et téléchargements officiels raccordés au profil administré CONNECT.
Consultation sans édition avec sections, photos et vues accessibles ; options
expert/client permises pour l'export local. Défaut du parcours administré pour
une création, sans réécriture d'un dossier existant. [Qualification et limites](../avereo-app-connect/docs/profils-et-droits.md).
Aucun déploiement.

## 17 novembre — Candidat de transfert de propriété

Le candidat ajoute à CONNECT la confirmation du changement de titulaire d’un rapport et adapte la lecture des photos originales. [Procédure et retour arrière](../../docs/administration-acces-exports.md#transférer-un-rapport-avant-fermeture).

## 16 novembre — Candidat profils Architecte/Maître d’œuvre avec CONNECT

Sélecteur et résumés de mission, vocabulaire des étapes 4–6 et restitutions adaptés ; contexte Terrain, conseils client et modalités de réalisation conservés. Profil déclaré dans CONNECT et défaut limité aux créations, sans modification des dossiers ouverts. Copie fictive gardant les métiers reconnus. [Qualification et revue](docs/profils-professionnels.md). Aucun déploiement de ce candidat.

## 16 novembre — Planning Projet PR163 installé

Même artefact promu : validation PHP facultative, JS, CSS, module Word et index HTML en dernier. Sauvegarde relue et retour arrière sur copie vérifiés ; 24 dossiers/toutes colonnes/propriétaires inchangés. Aperçu, refus d’une capacité invalide, téléchargement Projet et Word expert/client contrôlés ; brouillon initial restauré. [Portée](docs/interventions-projet.md#préproduction).

## 16 novembre — Préparation d’un planning Projet depuis les interventions

Volet repliable avec estimations, aperçu dérivé et téléchargement d’une projection native Projet. Paramètres optionnels sauvegardés, validation client/PHP et refus sans perte ; import indépendant et réexport exact vérifiés localement. Aucun changement de Projet, des propriétaires ou des restitutions Word. [Qualification et limites](docs/interventions-projet.md#qualification-locale). Aucun déploiement de ce candidat.

## 16 novembre — PR162 installée en préproduction

Quatre fichiers d’interface promus depuis l’archive testée, sans reconstruction, index en dernier. Sauvegarde relue et restauration/rollback code répétés sur copie ; 24 dossiers/colonnes/propriétaires, configuration et production exacts. Trois écrans repliables, signature et deux Word hébergés contrôlés, brouillon initial restauré et relu. [Qualification et limites](docs/organisation-ecrans.md#préproduction). Aucun nouvel enregistrement serveur.

## 16 novembre — Affichage progressif de Dossier, Observations et Export

Organisation validée puis réalisée localement : sections d’écoute, fiches d’observations et interventions repliables, résumés utiles, ouvertures par défaut et accès clavier. États de présentation séparés des données, réorganisation et repères conservés ; Export réordonné avec alertes visibles et signature redessinée à l’ouverture. Séparation de la dictée Dossier corrigée avec le helper commun. Sauvegarde/réouverture et Word contrôlés, sans changement hébergé. [Qualification](docs/organisation-ecrans.md#qualification-effectuée).


## 16 novembre — Sauvegarde et réouverture Interventions vérifiées

Recette PR161 réussie sur un dossier fictif complet : deux sauvegardes sur le même identifiant, trois natures, modalités multilignes/URL et liens conservés ; déconnexion complète puis ouverture serveur sans brouillon dans une nouvelle session normale. JSON identique octet pour octet, dossiers/propriétaires antérieurs et brouillon initial préservés. Aucun code ou paquet modifié. [Résultats et limites](docs/interventions-proposees.md#recette-complète-du-16-novembre).


## 16 novembre — PR161 installée et vérifiée en préproduction

Quatre fichiers du paquet qualifié promus sans reconstruction : validation PHP, interface, module Word et index en dernier. Sauvegarde relue et retour arrière code répété sur copie ; 23 dossiers/propriétaires et configuration/production conservés. Interface et validation PHP actives, deux Word identiques en textes/liens/images aux références locales ; brouillon initial restauré. [Livraison et limites](docs/interventions-proposees.md#préproduction).

## 16 novembre — Interventions Habitologue sous Recommandations

Première tranche locale : réutilisation des actions, modalités de réalisation et inclusion client explicite ; liens aux constats/attentes, priorité/horizon/préalables et identifiants conservés. Bloc expert après Recommandations, bloc client limité aux constats retenus sans notes internes. Validation PHP facultative et contrôles de persistance/exports. [Qualification et limites](docs/interventions-proposees.md). Aucune livraison hébergée de ce candidat.

## 16 novembre — Sauvegarde et réouverture Attentes vérifiées

Recette fictive de PR159 en préproduction réussie : deux enregistrements sur un identifiant, attentes/notes/provenance/liens et contenu complet relus ; déconnexion complète, connexion normale et ouverture serveur sans brouillon, JSON identique octet pour octet. Dossiers/propriétaires antérieurs et brouillon initial préservés. Aucun code ou paquet modifié dans cette recette. [Preuves et limites](docs/attentes-ecoute-client.md#recette-complète-du-16-novembre).

## 16 novembre — PR159 installée et vérifiée en préproduction

Cinq fichiers du paquet qualifié promus sans reconstruction sur Rapport préproduction, index remplacé en dernier. Sauvegarde et retour arrière code sur copie vérifiés ; données/propriétaires/configuration/production conservés. Interface et validation PHP hébergées actives ; deux Word identiques en textes/liens/images aux références locales. [Livraison et limites](docs/attentes-ecoute-client.md#préproduction).

## 16 novembre — Attentes reprises de l’écoute, candidat local

Export propose de reprendre les attentes et le besoin reformulé, sans doublon ni écrasement des corrections. Ajout de notes complémentaires avec dictée existante, conservées dans les sauvegardes et la restitution expert. Provenance facultative validée côté PHP ; liens et client préservés. [Contrat et limites](docs/attentes-ecoute-client.md). Aucun déploiement dans ce lot à cette date.


## 14 novembre 2026 — Révision horizontale Terrain de PR158

Fil horizontal 0 Terrain/Bâti, fiches Terrain T1/T2… dans Observations, numéros du bâti préservés ; capture cadastrale fixe avec source/date/nord, repères conservés et import manuel. Site allégé, notes antérieures accessibles dans un volet. 202 tests Node, 13 contrôles PHP plans, téléchargement complet, deux builds et 38 contrôles HTTP/MariaDB locaux réussis. Reprise serveur dans une nouvelle session, source/propriétaire conservés. Lecture d’ensemble Word native 25 pages expert / 10 client ; après déplacement final de T2, expert équivalent en texte/mise en page et image inspectée, client final relu. Aucune nouvelle conversion PDF ni livraison. [Portée exacte des preuves](docs/environnement-terrain.md#qualification-effectuée). Les résultats du premier candidat ci-dessous sont historiques.

## 14 novembre 2026 — Contexte Environnement/Terrain, candidat local

Rubrique Site pour Habitologue : textes et liens, zone, photo avec source/légende et vue existante facultatives. Contexte non numéroté, choix client séparé, anciens JSON préservés, compteur photo intégré et sauvegarde protégée pendant la lecture. 194 tests Node, PHP, deux builds et 38 contrôles HTTP/MariaDB locaux réussis ; nouvelle session sans brouillon et quatre Word/PDF natifs vérifiés sur deux cas fictifs, 57 pages inspectées. La couverture client est isolée du contexte. Aucun déploiement de ce candidat ; [parcours, limites et preuves](docs/environnement-terrain.md).


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

## 18 novembre — Correction de pagination des interventions

Correction ciblée livrée et qualifiée en préproduction : voir [le périmètre et la qualification](docs/interventions-proposees.md#18-novembre--correction-de-pagination-des-interventions). Réserve levée après lecture native des deux Word et des 51 pages PDF ; textes, médias et propriétaire conservés. Revue humaine de la PR169 et production restent distinctes.

## 18 novembre — Aperçu refermable, candidat local

[Correction de la fermeture de l’aperçu](docs/source-audit.md#fermeture-de-laperçu--candidat-local-du-18-novembre) : bouton visible au-dessus du bandeau commun, retour au dossier et parcours clavier vérifiés sur ordinateur/mobile. Aucun changement de contenu ni de sauvegarde ; nouveau correctif non déployé.

## 18 novembre — PR170 en préproduction

CONNECT et Rapport livrés après fusion et accord humains ; six fichiers exacts, dossier fictif complet et propriétaire conservés, aperçus client/expert refermables. [Résultat et preuves](docs/source-audit.md#livraison-en-pr%C3%A9production-de-la-pr170). Cette mise à jour documentaire ne change pas les applications.


## 2026-11-19 — Planning relatif sans dates

Mode P1/P2 ajouté au contrat de projection et aux validations concernées ; aperçu Rapport, import indépendant et Gantt simplifié Projet. Livré en préproduction et recette technique réussie, avec réserves distinctes documentées dans la PR175 ; revue humaine en attente. [Planning Rapport vers Projet](docs/interventions-projet.md).
