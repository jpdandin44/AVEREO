---
project: avereo-app-rapport
document_type: requirements
title: Exigences de Rapport AVEREO
status: active
version: git
created: 2026-09-10
updated: 2026-09-12
owner: jpdandin
tags:
  - rapport
  - exigences
  - habitologie
---

# Exigences de Rapport AVEREO

## Exigences fonctionnelles durables

- Le moteur de rapport technique, ses brouillons, photos, dictee, signature et
  exports restent disponibles sans regression volontaire.
- Une nouvelle creation propose uniquement les categories
  `Expertise & Visite technique` et `Visite Globale`.
- `Expertise & Visite technique` propose uniquement `Evaluation Energétique`,
  `Mesures`, `cartographie` et `pathologies`.
- `Visite Globale` demande un type d'habitation parmi `Maison`, `Appartement`,
  `Immeuble collectif` et `Autre habitation`, avec `A preciser` comme valeur
  transitoire non validante.
- Toute `Visite Globale` suit un seul parcours d'analyse dans l'ordre
  `Eau -> Air -> Terre -> Feu`. Ces dimensions ne sont ni des types
  d'habitation ni des sous-categories exclusives.
- L'etape `Protocoles` de `Visite Globale` propose des controles propres a
  chaque phase ; l'utilisateur peut retirer un point non applicable sans
  modifier l'ordre des phases.
- L'etape `Observations` de `Visite Globale` regroupe les constats par phase et
  permet de les rattacher a un point du protocole. Une observation historique
  sans phase reste visible dans `A classer` et n'est jamais reclassee
  automatiquement.
- Un dossier `Visite Globale` affiche dans l'etape `Dossier` une section
  `Ecoute client` pour le motif de visite, les attentes, les preoccupations,
  les usages du logement et le contexte d'occupation.
- Les accords pour les photos et la dictee sont conserves dans le dossier. Les
  commandes correspondantes restent desactivees tant que l'accord n'est pas
  enregistre. La dictee produit uniquement du texte et aucun fichier audio
  n'est conserve.
- Les donnees d'ecoute utilisent le brouillon, l'import/export JSON, la
  sauvegarde serveur et l'export Word existants. Elles ne sont pas affichees
  dans un rapport technique.
- `Assistance avant-projet`, `Diagnostic specifique` et
  `Reception de travaux` restent disponibles dans le code comme modules
  complementaires masques dans l'interface de creation.
- Tous les rapports utilisent le meme assistant : `Dossier`, `Site`,
  `Protocoles`, `Observations` et `Export`, avec des adaptations futures
  conditionnees par la categorie principale.
- Les brouillons historiques restent lisibles. Les anciennes denominations
  sont normalisees vers les categories actives et les sous-categories
  techniques historiques sont conservees sans reclassement metier arbitraire.
- Un ancien dossier `Reception de travaux` reste lisible mais ce type n'est
  plus selectionnable pour un nouveau dossier.
- Un ancien brouillon du prototype Habitologie ou du type
  `Rapport Habitologue` est converti vers `Visite Globale` sans ouvrir un
  second moteur ni lui attribuer artificiellement un type d'habitation. Une
  ancienne valeur `Eau`, `Air`, `Terre` ou `Feu` devient `A preciser`.
- Apres une recherche d'adresse ayant fourni des coordonnees valides, l'etape
  `Site` propose l'ouverture du rapport officiel Georisques correspondant.
- La meme recherche affiche une synthese des risques naturels et
  technologiques presents selon Georisques, avec le statut a l'adresse et sur
  la commune, la source et la date de consultation.
- L'absence de parcelle cadastrale ne bloque ni la localisation du bien ni la
  synthese Georisques. Une indisponibilite de Georisques est signalee sans
  produire de resultat artificiel.
- Le lien Georisques reste disponible pour tous les types de rapport : il fait
  partie du socle commun de localisation et ne modifie pas le dossier.

## Exigences techniques et securite

- La classification repose sur les champs existants `categorie` et
  `sous_categorie`. Pour `Visite Globale`, le second champ transporte le type
  d'habitation afin d'eviter une rupture de schema pendant le prototype.
- Les secrets et donnees d'authentification restent hors du navigateur et du
  depot.
- En environnement heberge, AVEREO CONNECT reste le point d'acces unique.
- Les sources externes futures doivent afficher leur origine et leur date, et
  disposer d'une saisie manuelle de secours lorsque le parcours l'exige.
- Pendant la phase de prototype fonctionnel, les evolutions privilegient la
  validation du besoin et du parcours utilisateur. Le TDD et la strategie de
  tests automatisee complete sont reportes a la phase d'industrialisation en
  vue de la commercialisation ; les controles existants et les validations
  proportionnees au risque restent executes.
- Les coordonnees transmises au service Georisques sont validees et aucun nom,
  email, commentaire, photo ou autre contenu du dossier n'est inclus dans le
  lien externe.
- L'integration Georisques utilise l'endpoint public V1 sans jeton et envoie
  uniquement les coordonnees longitude/latitude issues du geocodage. Les
  libelles et statuts affiches proviennent de la reponse officielle.

## Limites du lot courant

Le lot courant livre la phase `Ecoute` dans l'etape `Dossier`, le protocole
ordonne `Eau -> Air -> Terre -> Feu`, le classement des observations par phase
et la synthese Georisques dans `Site`. Les controles d'ecoute restent non
bloquants : un motif ou des attentes absents produisent une alerte metier,
sans empecher le brouillon.

L'enrichissement de `Observation/Analyse`, puis les phases `Explication` et
`Pistes d'accompagnement`, ainsi que la machine d'etats proposee, restent en etude dans
[`workflows/workflow-habitologie.md`](workflows/workflow-habitologie.md).
