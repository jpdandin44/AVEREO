---
project: avereo-app-rapport
document_type: architecture-index
title: Architecture de Rapport AVEREO
status: active
version: git
created: 2026-09-10
updated: 2026-11-12
owner: jpdandin
tags:
  - rapport
  - architecture
---

## Ordre commun des observations — lot 0 local

`observationOrder.js` fournit aux fiches, sélections, plans et restitutions un ordre commun et des numéros dérivés, tout en conservant les identifiants du payload. Aucun nouveau stockage ni migration. La création est initialisée en Visite Globale ; les catégories techniques existantes restent lisibles. [Composants et règles](docs/lot-0-observations.md#composants-et-stockage).

## Profil de mission et explications

`profil_metier` et `observations[].explications` étendent le payload JSON existant, sans migration SQL. Le profil adapte les formulaires et les restitutions, sans changer les rôles CONNECT ni la propriété. [Contrat et composants](docs/profil-habitologue.md).


## Copie pour les tests

Le navigateur reconstruit un document indépendant à partir des choix du catalogue. L’import existant accepte cette copie. [Partage et supervision de la base](docs/partage-tests-et-stockage.md).

## Contrôle temporaire par identité — candidat local

Les sas Rapport et RGA lisent une politique privée de période au contrôle du cookie et à l’échange du ticket. RGA réutilise le sas porteur d’identité sans partager clé ni cookie. Aucune migration de dossier. [Contrat et limites](docs/essais-temporaires.md).


## Plans et repères du dossier

Les images et leurs métadonnées appartiennent au champ optionnel `plans` du payload privé. `reperes` sur chaque observation porte le lien vers la vue et ses coordonnées normalisées. `ObservationPlans.jsx` édite le repérage ; `reportHtml.js` compose les vues et légendes ; `reportDocx.js` incorpore les images dérivées avec leurs repères. Le fond source reste intact. La validation PHP rejoint les opérations existantes, sans nouvelle route, base ou migration. [Contrat et limites](docs/reperage-observations.md#données-de-référence).


## Champs vocaux et brouillon — candidat du 2 novembre

`VoiceField.jsx` mutualise le bouton micro et le cycle SpeechRecognition déjà utilisé dans App. Les rubriques de décision et les notes de livrable réutilisent ce composant ; les ajouts sont appliqués à la dernière valeur React. `dictationText.js` conserve le texte existant et la limite applicable.

Le bouton d'une attente délègue à `handleSave` et au stockage de brouillon existant (IndexedDB et secours localStorage). Il ne déclenche pas `saveOnlineReport`. Aucune API, table, migration ou extension du JSON métier n'est ajoutée. [Spécification](docs/aide-decision-demo.md#saisie-vocale-et-enregistrement-explicite-des-attentes).



## RGA — 2 novembre 2026

Le module cartographique reste hébergé sous `/rga/` sur le domaine de Rapport, avec un sas RGA indépendant. CONNECT le déclare comme application distincte ; l’hébergement commun ne donne aucun droit partagé. Le champ optionnel `rga_cartographie` conserve une lecture indicative, distincte de `risques.rga`. Les modules de validation sont communs à la carte et au formulaire. [Contrat et flux](api/rga.md).

## Bloc de décision du dossier

Le bloc optionnel `decision` demeure dans le payload JSON de Rapport, stocké dans `reports.payload_json` par les opérations existantes ; aucune migration de base. `DecisionSupportPanel.jsx` édite les données, `decisionSupport.js` compose bilan et comparaison pour `reportDelivery.js`, puis `reportDocx.js` produit le Word existant. `api/decision-validation.php` contrôle les types, listes (100 éléments), références et longueurs avant sauvegarde ; les droits/propriétés existants restent appliqués. Les anciens dossiers ne reçoivent aucun choix prérempli. [Contrat fonctionnel](docs/aide-decision-demo.md).


## Restitutions expert et client

Le champ optionnel `livrable` reste dans le payload JSON/MySQL existant. La
composition HTML commune et le module DOCX chargé à la demande consomment les
mêmes données ; aucun service d'export externe. Les illustrations pédagogiques
sont incorporées au frontend, les pièces privées uniquement dans leur dossier.
Sources, schéma et responsabilités : [procédure de transmission](docs/transmission-generation-rapports.md). Authentification et API inchangées.

# Architecture de Rapport AVEREO

Rapport est une application autonome du monorepo AVEREO : frontend React/Vite,
API PHP, base MySQL dediee et acces heberge par le sas AVEREO CONNECT.

La description technique detaillee et les flux restent maintenus dans
[`docs/architecture.md`](docs/architecture.md). L'authentification est decrite
dans [`docs/authentication.md`](docs/authentication.md) et les donnees dans
[`database/README.md`](database/README.md).

Depuis le lot 0 local, la classification des nouveaux dossiers expose uniquement
`Visite Globale`. `Expertise & Visite technique` demeure lisible pour les dossiers existants, avec ses sous-catégories, mais n'est plus proposée à la création. Les catégories
`Assistance avant-projet`, `Diagnostic specifique` et
`Reception de travaux` restent dans le catalogue du frontend avec le statut
masque. Elles demeurent chargeables pour assurer la compatibilite des dossiers
existants et pourront etre reactivees comme modules complementaires.

`Visite Globale` reutilise le meme assistant, la meme API et le meme stockage.
La valeur existante `categorie` conditionne l'affichage de la phase `Ecoute`
dans l'etape `Dossier`. Ses champs et consentements sont conserves dans l'objet
JSON `ecoute`, au sein du payload existant. Aucune nouvelle base, API, table ou
application n'est introduite.
Les anciennes classifications `Expertise & visite technique` et
`Rapport Habitologue` sont normalisees sans inventer un type d'habitation. Pour
`Visite Globale`, le champ technique historique `sous_categorie` conserve la
valeur du type d'habitation afin de preserver le schema existant. Les constantes
de workflow portent separement l'ordre d'analyse `Eau -> Air -> Terre -> Feu`.
Le payload conserve egalement `habitologie_protocoles` pour les points retenus,
`phase_habitologie` et `controle_habitologie` sur chaque observation, ainsi
qu'une synthese `risques` sourcee et horodatee issue de Georisques V1. Ces
ajouts restent compatibles avec les brouillons plus anciens grace a la fusion
des valeurs par defaut.

La selection Habitologie est resolue depuis les sujets explicites de `ecoute`
et les choix manuels de `habitologie_protocoles` (prioritaires), sous reserve
que la phase soit active. La suspension reversible est detaillee dans
[`docs/architecture.md`](docs/architecture.md). Le payload
`localisation` conserve l'adresse geocodee et la confirmation datee du lieu.
Leaflet 1.9.4 affiche les images WMTS publiques IGN dans le frontend, sans
iframe ni API interne supplementaire. Le stockage reste le payload JSON :
`urbanisme.context` conserve les attributs GPU et `terrain` les mesures
altimetriques, l'orientation et les notes. Voir
[`api/cartographie.md`](api/cartographie.md).

L'evolution 2 ajoute les liens externes et notes `ressources_batiment` au meme
payload. Aucun raccordement automatique aux fournisseurs : voir
[`api/ressources-batiment.md`](api/ressources-batiment.md).
