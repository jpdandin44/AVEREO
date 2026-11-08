---
project: avereo-app-rapport
document_type: migration-matrix
title: Matrice de migration fonctionnelle
status: active
version: git
created: 2026-07-13
updated: 2026-11-08
owner: jpdandin
tags:
  - rapport
  - migration
  - fonctionnalites
---

## 2026-11-06 — Correction de navigation RGA déployée

Le fichier de navigation PR #122 est installé, sans migration SQL, changement de clé de stockage ni écriture de projet. La liste vide du navigateur de recette reste vide ; seul son déclenchement est testé. [Livraison et recette](../../avereo-platform/docs/livraison-mon-espace.md).


## 2026-11-06 — Navigation RGA sans migration

Le correctif préparé ne concerne que `frontend/public/rga/workspace.js`. Aucun schéma, clé de stockage, projet, résultat Géorisques ou contrôle d’identité ne change. Les données déjà enregistrées restent utilisables ; seul le déclenchement de la liste depuis la carte intégrée est corrigé. [Livraison et réserves](../../avereo-platform/docs/livraison-mon-espace.md).


## 2026-11-04 — Candidat d’archivage CONNECT

Changement du sas Rapport, réutilisé par le build RGA, et de l’entrée d’écriture des dossiers. Aucun changement SQL Rapport. Installer avant d’activer les actions d’administration CONNECT. [Contrat de projection](essais-temporaires.md).


## Essais temporaires — candidat local

Aucun changement SQL ni payload métier. La politique configurée exige une identité dans le cookie ; les anciens cookies RGA anonymes nécessitent une relance depuis CONNECT. Sans politique, compatibilité conservée. [Contrat](essais-temporaires.md).


## Repérage des observations

Les champs optionnels `plans` et `observations[].reperes` restent dans le payload existant : aucune migration SQL ni conversion destructive. Les anciens dossiers ne reçoivent aucun plan par défaut. Les cinq vues privées du Cricq sont ajoutées seulement à une copie locale de son dossier. [Contrat et état de qualification](reperage-observations.md).


## Saisie de Validation et export — préproduction du 2 novembre

Ajout de contrôles vocaux et d'un enregistrement explicite du brouillon d'attente. Les champs, identifiants, liens, accords, médias et contrats JSON restent ceux du dossier existant ; aucune migration. Anciens contenus longs conservés, aucun choix ou accord déduit d'une dictée ou d'un enregistrement. Les deux exports de recette gardent l'attente modifiée ; les quatre Word de présentation restent distincts. [Critères et limites](aide-decision-demo.md#saisie-vocale-et-enregistrement-explicite-des-attentes).



Candidat fonctionnel `63ec279` installé sur [Rapport préproduction via CONNECT](https://connect-preprod.avereo.fr/?app=rapport), après accord explicite. Sauvegarde fraîche des 148 fichiers et de la configuration privée ; installation/restauration répétée sur copie privée, puis trois fichiers livrés et 147 fichiers préexistants conservés. Configuration inchangée, aucune migration ni écriture SQL de livraison. Les reçus sont rattachés à `finalisation20261102.exportInput20261102` dans le suivi canonique.

Tilleuls et Cricq : confirmation « Enregistrer cette attente », reprise après rechargement, sauvegarde/réouverture serveur et conservation de toutes les données métier contrôlées (seul `updatedAt` évolue). Quatre DOCX hébergés valides ; textes et médias des deux Tilleuls identiques à la présentation, synthèse client Cricq identique. L'expert Cricq reflète des modifications antérieures de localisation, risques, cadastre, terrain et urbanisme ; ses notes détaillées terrain/urbanisme ont été remplacées ou vidées avant cette installation. Copie récente préservée, arbitrage de contenu demandé au responsable. Les quatre fichiers de présentation restent inchangés. Brouillon initial du navigateur restauré exactement avant nouvel enregistrement local.

Microphone et service vocal réels à essayer avec le responsable ; les essais vocaux antérieurs sont simulés. Contrôles micro présents et cohérents avec l'accord enregistré, sans nouvel accord ni permission micro accordée par l'agent. Revue métier et validation humaine restent distinctes ; aucun merge ni production.

## Lot RGA du 2 novembre

Le complément de superposition est purement visuel : mêmes coordonnées,
confirmation et données enregistrées ; ajout d'une couche dans la carte du
lieu et d'une vue cadastrale dans la carte autonome. Aucun champ ni migration.

Anciennes cartes conservées ; nouvelle carte et résultat `rga_cartographie` optionnel. Les anciens dossiers sans ce champ restent lisibles. Les autres données métier ne changent pas lors d’une reprise de lecture au même point. JSON et restitution utilisent le même bloc validé. [Critères et état de recette](../api/rga.md).

## Reprise Géorisques — candidat local du 2 novembre

Complément local Géorisques du 2 novembre : les champs `risques` et leur date
restent identiques. Seule la récupération évolue, avec reprises limitées et
conservation au même point en cas d'échec. Aucun changement de schéma, import,
export ou API PHP ; aucune migration. [Qualification et limites](../api/georisques.md).

## Corrections du 1er novembre

| Fonction | Contrôle réalisé | Qualification restante |
| --- | --- | --- |
| Complétude de saisie | Rappel visible à 100 % sur les deux copies hébergées ; calcul conservé | Revue métier indépendante du pourcentage |
| Message photo et dictée | Quatre états contrôlés localement ; états Tilleuls et Cricq vérifiés en préproduction, boutons cohérents | Essai matériel micro/caméra non réalisé |
| Compléments des deux maisons | JSON serveur exactement préparés, identifiants et médias conservés ; quatre Word hébergés, 56 pages contrôlées | Revue métier des fiches et des hypothèses |
| Session de démonstration | Durée de 1 800 secondes relevée ; renouvellement par CONNECT contrôlé | Prévoir une relance avant chaque maison pendant la répétition de 90 minutes |

Le candidat `9ce22fd` est livré et contrôlé le 1er novembre ; sauvegarde/restauration et reçus propres à ce lot. [Détail et limites](aide-decision-demo.md#corrections-du-1er-novembre).

## État du lot aide à la décision du 30 octobre

| Fonction | État local | Qualification restante |
| --- | --- | --- |
| Attentes et projet séparés | Rubriques optionnelles à Export ; deux cas modifiés, sauvés en ligne et rouverts sur `9a4f414` | Revue métier |
| Bilan et actions liés | Références et données conservées dans le JSON serveur ; alerte d’omission vérifiée puis sélection restaurée | Qualification métier des incontournables |
| Deux options et comparaison | Même grille ; Word expert Tilleuls/Cricq 17/26 pages et client 5/7 pages contrôlés | Revue des deux restitutions par le responsable |
| Dossiers antérieurs | Compatibilité contrôlée ; création de deux copies distinctes sans remplacement des rapports précédents | Isolation entre deux comptes non couverte par cette recette |

Le candidat `5d70e41` reste l’état antérieur sauvegardé. Les preuves de la recette du nouveau `9a4f414` sont propres à ce lot. [Spécification](aide-decision-demo.md).


# Matrice de migration fonctionnelle

## État du lot démo au 24 octobre

L’interface de réouverture depuis la liste serveur est implémentée et livrée en préproduction, en réutilisant les opérations API existantes. Le RGA dispose d’un affichage explicite et les cartes d’origine sont empaquetées derrière CONNECT. Le lien de déconnexion flottant a été remplacé par une action d’en-tête, contrôlée sur écran large et étroit ; le brouillon le plus récent est repris entre les deux stockages. Ces écarts et leurs sources sont décrits dans le [point de reprise](reprise-demo-philippe.md) et l’[architecture](architecture.md). Le build authentifié et les 60 tests réussissent ; les empreintes livrées, la restauration et les refus anonymes sont vérifiés ; la recette authentifiée et la revue native Word restent à effectuer.

Les états du 16 octobre ci-dessous sont historiques ; la production du 23 octobre est enregistrée dans le suivi opérationnel. Aucune preuve antérieure n’est réattribuée au nouveau code.


## Passage en production après fusion de la PR #84

La [préparation du 16 octobre](../../../outillage/acces-preproduction/preparation-production-rapport-passeport.md)
confirme l'identité des sources exécutables avec `main`, l'ancienne version encore
servie en production et le plan ciblé de cinq écritures. Le point OAuth répond 503 ;
la récupération et le retour arrière Rapport restent à qualifier. Aucun comportement
applicatif ni statut de qualification fonctionnelle n'est changé par ce dossier.

## Préproduction du 16 octobre 2026

Les deux types de rapport, leur sauvegarde/relecture en ligne, reprise du brouillon, aperçus et exports JSON/Word sont contrôlés sur le candidat livré. Les données métier existantes et le brouillon initial sont conservés. Le [compte rendu transverse](../../../outillage/acces-preproduction/livraison-rapport-passeport.md) fournit les empreintes et limites exactes. Cette recette ciblée ne requalifie pas les services géographiques, photos, dictée ni le rendu natif Word ; les limites spécifiques de la matrice restent valables.


| Fonctionnalite | Source | Donnees/services | Cible AVEREO et test | Statut |
| --- | --- | --- | --- | --- |
| Valeurs libres importées dans les observations | exemple Cricq du 24 octobre | `piece`, `surface`, `gravite` | Afficher la valeur conservée ; vérifier import, sauvegarde et export, voir [audit](source-audit.md#exemple-importé-et-modèles-éditoriaux-du-24-octobre) | corrigé et contrôlé localement ; deux sorties intégrées, recette hébergée à consigner |
| Relief sur cadastre | demande utilisateur | `terrain.analysis.samples`, tuiles IGN existantes | Neuf valeurs geolocalisees, extremes relatifs, emprise et tableau ; voir `../api/contexte-du-bien.md` | valide localement, qualification hebergee/tactile restante |
| Correction du repere | demande utilisateur | `cadastre.lon/lat`, `localisation.point_manuel` | Ajustement explicite, annulation, donnees derivees invalidees, notes conservees, reprise locale ; voir `../api/contexte-du-bien.md` | valide localement, qualification hebergee restante |
| Ressources du batiment (evolution 2) | demande utilisateur | `ressources_batiment`, liens manuels GoRenove/Pro'Reno | Sources/date/notes, URL validees, ancien brouillon compatible, rattachement caduc sans perte | prototype implemente, qualification hebergee restante ; voir `../api/ressources-batiment.md` |
| Phases activables (evolution 1) | demande utilisateur | `habitologie_protocoles[phase].enabled`, controles conserves | Sans indicateur : phase active ; desactivation/retablissement sans perte ; reprise et exports controles, 44 tests | valide localement, revue humaine et qualification hebergee restantes |
| Vues du contexte du bien | retour utilisateur du 14 septembre | Georisques, attributs GPU, neuf altitudes IGN, orientation manuelle | Synthese dans Site, relance, notes et exports ; 39 tests et build ; vues, reprise et apercu verifies | valide localement, qualification hebergee restante |
| Assistant multi-etapes | `Rapport_AVEREO_Pro.txt`, `frontend/src/App.jsx` | Donnees du rapport | Frontend Vite; navigation et reprise manuelles | conservee |
| Brouillon hors ligne | `App.jsx` | IndexedDB, `localStorage` | Mode local conserve; test de rechargement | conservee |
| Photos et camera | `App.jsx` | Fichiers, MediaDevices, data URLs | Frontend; taille bornee avant sauvegarde serveur | adaptee |
| Dictee vocale | `App.jsx` | Web Speech API | Frontend avec degradation gracieuse | conservee |
| Adresse et cadastre | `App.jsx` | BAN, API Carto IGN | Appels publics conserves; erreurs reseau gerees | conservee |
| Urbanisme et Geoportail | `App.jsx` | API Carto, Geoportail | Frontend; verification des liens | conservee |
| Rapport officiel des risques | `App.jsx` historique | Georisques, longitude et latitude | Bouton dans `Site`; URL validee par tests; ouverture du PDF officiel sans autre donnee du dossier | restauree |
| Synthese des risques | besoin Habitologie | Georisques V1 `resultats_rapport_risque`, longitude et latitude | Affichage dans `Site`; risques presents et statuts officiels; source, date et lien conserves dans le payload | integree, validee localement |
| Observations et protocoles | `App.jsx` | Donnees metier | Payload JSON du rapport; tests CRUD API | adaptee |
| Protocole Habitologie | besoin metier | Eau, Air, Terre, Feu et points de controle | Quatre phases dans `Protocoles`; observations groupees et rattachees; anciennes observations conservees dans `A classer` | integree, validee localement |
| Signature | `App.jsx` | Canvas/data URL | Frontend puis payload prive authentifie | adaptee |
| Apercu | `App.jsx` | HTML `srcDoc` | Iframe sandboxee sans permission et sans referrer | conservee |
| Export JSON | `App.jsx` | Blob | Frontend; import/export manuel | conservee |
| Export document | `reportDelivery.js`, `reportDocx.js` | DOCX avec images incorporées | Expert complet / client sélectionné ; Word natif et PDF contrôlés | intégré ; état hébergé dans le point de reprise |
| Sauvegarde en ligne | absente | PHP, PDO, MySQL | `/api/reports.php`, propriete utilisateur, CRUD | adaptee |
| Reouverture depuis la liste serveur | absente | PHP, MySQL | API existante et interface OnlineReports | livree en preproduction le 24 octobre, recette authentifiee restante |
| Authentification | absente | AVEREO CONNECT adosse a Drupal | ticket signe, cookie de sas, roles `utilisateur_rapport`/`administrateur_rapport` | adaptee |
| Mode technique local | absente | Jeton genere localement | `api_token`, ignore de Git, admin local temporaire | adaptee |
| Parcours CONNECT local reel | absent | CONNECT Docker, ticket HMAC, cookie de sas, MySQL Rapport | `gateway-up`, secret local ignore, vraie interface Rapport sur `127.0.0.1:8100` | adaptee |
| Catalogue de rapports simplifie | plusieurs categories visibles | `categorie`, `sous_categorie`, charge JSON existante | Deux categories visibles; type d'habitation pour Visite Globale; parcours d'analyse commun Eau, Air, Terre, Feu; modules complementaires masques | adapte, a valider |
| Ecoute client de Visite Globale | proposition de workflow | Objet `ecoute` dans le payload JSON existant | Section conditionnelle dans `Dossier`; saisie et dictee texte; accords photo/dictee; apercu et export Word | adaptee, validee localement |
| Entretien enrichi et suggestions | retour utilisateur | Champs ecoute, sujets explicites et choix manuels | Histoire du bien, travaux, besoin reformule et criteres de reussite ; aucun controle par defaut ; anciens choix preserves | implemente, a valider par l'utilisateur |
| Confirmation du lieu | retour utilisateur | Tuiles IGN WMTS / Leaflet, objet `localisation` | Cadastre sur plan ou vue aerienne ; confirmation datee, annulation et correction d'adresse ; aucune migration SQL | rendu et transitions valides localement, a qualifier en preproduction |
| Backend Node.js | absent | aucun | Aucun runtime Node.js en production | non integree |

Aucune fonctionnalite source n'est volontairement supprimee. La persistance serveur et l'authentification sont ajoutees sans retirer le brouillon hors ligne. La preversion reste utilisable sans OAuth avec les brouillons navigateur; la nouvelle interface de reouverture d’une copie serveur reste a qualifier en preproduction.

Le lien vers le rapport officiel Georisques conserve la fonction historique de
consultation. La synthese structuree, son horodatage et sa source sont
maintenant integres au dossier ; la confirmation ou le commentaire manuel des
risques reste a definir.

## 6 novembre 2026 — Navigation de compte

Mon espace remplace le bouton de déconnexion de l’en-tête ; le gestionnaire de sauvegarde est conservé. RGA garde son isolation et son cookie propre. [Règle et qualification](../../avereo-platform/docs/fonctionnalites-communes.md).

## 2026-11-06 — Identité des restitutions

Le PNG AVEREO est déplacé sans modification vers le socle partagé. Aucun changement
du schéma JSON, de la base ou des archives ; seuls les nouveaux exports utilisent
la source commune. [Contrat](../../avereo-platform/docs/identite-livrables.md).

## 2026-11-07 — Entreprise en formation

Les couvertures expert/client ajoutent le bloc commun d’entreprise ; le Word
natif conserve ces lignes groupées à 9 points. Aucun changement de schéma du
dossier. [Source et recette](../../avereo-platform/docs/identite-livrables.md).

## 7 novembre 2026 — Compatibilité des dossiers de mission

La génération décrite dans cette section concerne le dossier Rapport. Le candidat du 8 novembre retire cette action des surfaces RGA. Les points RGA, leurs préférences et le lien vers Rapport restent utilisables. [Périmètre des missions](../../avereo-platform/docs/protocole-missions.md#applications-qui-génèrent-des-missions).

Les champs client, adresse du logement, référence et date restent ceux du dossier. Les coordonnées complémentaires sont optionnelles et les anciens JSON restent lisibles. Aucun changement de table serveur. [Protocole](../../avereo-platform/docs/protocole-missions.md).

## 2026-11-08 — Présentation commune

Les actions communes réutilisent les handlers du rapport. Le point RGA reste distinct du dossier Rapport. [Matrice des actions](../../avereo-platform/docs/modele-affichage.md).

Dans l’éditeur, **Accueil** et **Mon compte → Mes projets** utilisent le même retour avec sauvegarde préalable du brouillon.
