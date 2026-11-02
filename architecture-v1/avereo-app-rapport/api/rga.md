---
project: avereo-app-rapport
document_type: integration
title: Recherche RGA dans CONNECT et Rapport
status: active
version: git
created: 2026-11-02
updated: 2026-11-02
owner: jpdandin
tags: [rga, connect, risques, cartographie]
---

# Recherche RGA dans CONNECT et Rapport

## Objectif et périmètre

Le responsable demande le 2 novembre 2026 la nouvelle carte fournie dans
`RGA/RGA_carte_interactive/index.html`, une recherche d'adresse et la reprise
des résultats au même niveau que les risques dans Rapport. Il confirme une
tuile RGA dans CONNECT et un accès depuis Rapport, avec les droits de Rapport.

La copie de travail est isolée sur `feat/rga-connect-rapport-20261102`, à partir
de `2e3239b`, suite de la PR 91. Les dossiers de démonstration ne sont pas modifiés.
L'état de livraison est porté par le bloc `rgaIntegration20261102` du
[suivi canonique des accès](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>).
Ce document décrit le contrat fonctionnel, pas une preuve d'installation.

## Parcours

1. CONNECT affiche RGA comme raccourci de Rapport. La route de lancement reste
   `/api/v1/apps/rapport/launch?view=rga` : mêmes droits contrôlés au serveur,
   même ticket signé, consommation du nonce et durée de session inchangées.
2. Après échange du ticket, le seul paramètre reconnu est `view=rga`, qui ouvre
   `/rga/`. Toute autre valeur ouvre `/`. Aucun redirect libre n'est accepté.
3. La nouvelle carte `/rga/carte.php` recherche jusqu'à cinq adresses IGN. Le
   professionnel choisit l'adresse ; un repère est projeté en Lambert-93.
4. La lecture des contours locaux et la synthèse Géorisques sont présentées
   séparément. Le professionnel peut créer un nouveau dossier depuis RGA.
   Un transfert limité à l'onglet (`sessionStorage`, maximum 250 000 caractères)
   est proposé sur l'accueil de Rapport. Il ne crée aucun dossier automatiquement.
   Un brouillon existant exige la confirmation habituelle, avec export préalable
   proposé. Le point du nouveau dossier reste à confirmer dans Site.
5. Dans un dossier existant : Site → Rapport des risques → nouvelle carte.
   La carte reprend le point actuel, y compris son déplacement manuel. Le bouton
   « Utiliser dans ce rapport » transmet les résultats à la fenêtre parente.
   Le destinataire vérifie l'origine, la fenêtre émettrice, les coordonnées exactes,
   les formes attendues et les dates. Un résultat d'un autre point est refusé.
6. La donnée suit le brouillon, l'export/import JSON et le payload de sauvegarde
   serveur existant. La lecture locale est restituée dans les documents expert
   et client avec ses limites. Aucun résultat ne devient une mesure du sol.

## Sources et précision

La copie fournie est conservée sous `data/rga/interactive/` : 95 départements,
121 399 polygones déclarés, `AleaRG_2025_Fxx_L93.shp`, sans Paris. Le manifeste
`provenance.json` conserve les empreintes des 100 fichiers d'origine, dont
97 fichiers de données. Le générateur Python reste présent ; numpy est requis
seulement pour refaire les données depuis le shapefile externe.

La carte charge une géométrie simplifiée à 250 m puis des contours à 20 m au
zoom, quantifiés sur une grille de 10 m. Ces nombres décrivent le traitement
d'affichage ; ils ne garantissent aucune précision sur une parcelle. Le repère
est projeté en EPSG:2154 ; la lecture utilise les contours détaillés indépendamment
des filtres visibles. La disparition d'une petite zone ou une limite simplifiée
peut changer la lecture. Un résultat absent est « zone non classée dans les
contours affichés » ou « hors couverture », jamais « sans risque ».

La [source Géorisques 2026](https://www.georisques.gouv.fr/donnees/bases-de-donnees/retrait-gonflement-des-argiles-version-2026)
et le [dossier expert](https://www.georisques.gouv.fr/consulter-les-dossiers-thematiques/retrait-gonflement-des-argiles)
sont consultés le 2 novembre 2026. L'échelle de validité de la carte officielle
est celle des données géologiques au 1/50 000. L'affichage ne remplace ni une
étude géotechnique ni une qualification réglementaire du terrain.

## Superposition cadastrale — correction du 2 novembre

La carte du lieu dans Rapport affiche par défaut une couche RGA avec une
intensité de 40 %, réglable de 0 à 80 %, et une case pour la masquer. La carte
RGA autonome et son iframe ouvrent « Cadastre + RGA » à l'échelle du bien dès
qu'un point est fourni ; la vue des territoires reste accessible. Le bouton
de recentrage retrouve le bien. Les trois niveaux ont une légende permanente.
Ces réglages sont visuels : ils ne déplacent pas le point, ne modifient pas la
confirmation du lieu et n'enregistrent aucune nouvelle conclusion dans le dossier.

`rgaOverlay.js` est partagé par React et la carte autonome. Il décode les
deltas Lambert-93, conserve les anneaux intérieurs et projette les coordonnées
en Web Mercator pour les tuiles Canvas de Leaflet. Ordre d'affichage : fond IGN,
couleurs RGA (pane 250), tracés cadastraux (pane 300), repère du bien (pane 600).
Seuls les départements intersectant la vue sont chargés ; contours détaillés
à partir du zoom 11, contours grossiers en dessous. Les filtres de niveaux et
le masquage des départements s'appliquent également à la superposition autonome.
Leaflet 1.9.4 et sa licence sont livrés localement à partir de la dépendance
existante ; aucun CDN ni nouveau service. Références de mise en œuvre :
[GridLayer Leaflet](https://leafletjs.com/reference.html#gridlayer) et
[projection Lambert conique conforme PROJ](https://proj.org/en/stable/operations/projections/lcc.html).

La reprojection est contrôlée avec cinq références indépendantes produites par
PROJ via pyproj 3.8.0 (tolérance 1e-8 degré), puis par comparaison visuelle du
repère et du cadastre. Les limites de précision de la source ci-dessus restent
applicables : la superposition ne transforme pas ces contours en limites cadastrales.
La couche locale reste affichable lorsque la synthèse Géorisques est indisponible ;
les fonds IGN nécessitent leur propre accès réseau.

## Services et données

| Élément | Contrat |
| --- | --- |
| Géocodage | `https://data.geopf.fr/geocodage/search?q=…&limit=5`, documentation [IGN](https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/geocodage/). Rapport utilise le même service, avec son choix historique du premier résultat à confirmer. |
| Synthèse officielle | `https://www.georisques.gouv.fr/api/v1/resultats_rapport_risque?latlon=longitude,latitude`, contrat existant de Rapport. Délai 15 s, erreurs explicites. Aucun millésime de réponse inventé. |
| Lecture locale | `rga_cartographie` optionnel : point, statut, niveau indicatif, département, fichier source, millésime, date et limites. Aucun schéma SQL ajouté. |
| Échange iframe | Message `avereo.rga.context.v1` accepté seulement de l'iframe de même origine et pour le point courant. Les anciens résultats ne remplacent pas une consultation plus récente. |
| Conservation | Un changement d'adresse ou de point efface la lecture dérivée. L'affichage et l'export refusent également une lecture liée à d'autres coordonnées. Les notes métier et les anciens dossiers sont conservés. |

Les requêtes transmettent à IGN le texte d'adresse et à Géorisques le point
choisi, sans nom de client, rapport ou photo. Les coordonnées et le libellé du
lien interne sont dans le fragment, absent de la requête HTTP au serveur.
Les liens et appels utilisent `no-referrer` lorsque prévu par l'intégration.
Les données géographiques publiques et les modules JavaScript sont publics ;
les pages applicatives PHP passent par le sas CONNECT. Aucun JSON client
n'est intégré aux fichiers de publication. Aucun secret nouveau n'est requis.

## Construction et contrôles

Depuis `frontend/` : `npm.cmd ci`, `npm.cmd test`, `npm.cmd run build`.
Pour le candidat hébergé, définir `VITE_ENABLE_ONLINE_SYNC=true` au build.
Le script `scripts/build-rga.mjs` vérifie les empreintes géographiques, copie
les modules communs et génère `carte.php` avec le sas en première ligne.
Il ne publie pas le HTML source, le générateur Python ni le routeur de test.

Prévisualisation locale sans compte ni sauvegarde serveur, après build sans
la variable de synchronisation : depuis la racine Rapport,
`php -S 127.0.0.1:5196 -t frontend/dist local/rga-preview.php`.
Le routeur refuse les API et CONNECT ; ce n'est pas une recette d'authentification.
Il est strictement local et doit rester hors de toute archive hébergée.

Critères : adresse choisie et repère ; filtres et zoom ; panne API distincte ;
transfert explicite ; préservation du brouillon ; rejet d'autre point/origine ;
JSON et restitutions ; refus anonyme du sas ; accès RGA refusé sans droit Rapport ;
sauvegarde et réouverture d'un dossier de test en préproduction.

## Quatre phases et livraison

| Phase | Travail |
| --- | --- |
| Cadrage | Source fournie identifiée, double accès confirmé, distinction carte/synthèse officielle. |
| Développement local | Nouvelle carte, recherche, transfert, données du rapport, contrôles et documentation. |
| Préproduction | Candidat exact, CI, cibles isolées, sauvegarde/restauration, installation ciblée puis recette authentifiée. |
| Mise en production | Revue du candidat et écarts avec la production, accords applicables, sauvegarde fraîche, livraison puis contrôles réels. |

Le déploiement doit conserver les fichiers privés, les bases et les fichiers
hébergés absents du lot. En particulier `connect/gate.php` hébergé diffère de
la copie Git consultée : il n'appartient pas aux fichiers à remplacer.
CONNECT ne nécessite que `src/Application.php` après comparaison exacte de sa
version active. Rapport nécessite ses assets construits, l'entrée CONNECT et
les pages/ressources RGA modifiées. Les anciennes cartes sont conservées.

TBD — rétablissement de Géorisques après l'indisponibilité constatée lors de la
recette hébergée, acceptation métier, version et livraison de production.
La recette serveur et les Word du premier candidat sont consignés dans le cockpit ;
la correction de superposition possède ses propres contrôles. Les résultats locaux
et l'accès à cPanel ne sont pas des preuves de livraison ni une revue humaine.
