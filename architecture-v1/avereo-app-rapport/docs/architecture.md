---
project: avereo-app-rapport
document_type: architecture
title: Architecture technique de Rapport AVEREO
status: active
version: git
created: 2026-07-14
updated: 2026-09-15
owner: jpdandin
tags:
  - rapport
  - architecture
  - connect
---

# Architecture Rapport

## Decision monorepo

Rapport reste dans le monorepo AVEREO. Ce choix permet de reutiliser les controles CI et les scripts FTPS, de faire evoluer le contrat OAuth de facon coherente et de garder une seule politique de securite.

L'isolation ne repose pas sur le nombre de depots : Rapport possede son dossier, son workflow, son sous-domaine, ses ports, sa base, son utilisateur MySQL, sa configuration, ses roles, ses migrations et ses tests.

Un depot separe ne deviendrait pertinent que si Rapport avait une equipe et des droits Git distincts, un cycle de version autonome incompatible avec le monorepo, des exigences legales d'acces separees, ou si la taille/CI du monorepo devenait un frein mesure.

## Flux cible

1. Le navigateur passe par CONNECT, qui controle le compte et l'habilitation.
2. CONNECT emet un ticket serveur signe, consomme une seule fois par Rapport.
3. Rapport etablit son cookie de sas puis charge le build Vite.
4. Il utilise `/api/auth.php` pour relire l'identite signee du cookie local.
5. Le navigateur appelle `/api/reports.php` sans second bearer OAuth.
6. L'API exige le cookie de sas, valide l'identite CONNECT, les droits, la
   propriete et le payload.
7. PDO accede uniquement a la base MySQL Rapport.

Le frontend conserve le rapport complet sous forme d'un payload JSON. Pour un
dossier `Visite Globale`, l'objet `ecoute` ajoute le motif, les attentes, les
preoccupations, les usages, le contexte d'occupation et les deux accords
photo/dictee. Ce meme objet traverse le brouillon local, l'import/export JSON,
la sauvegarde API et l'export Word. La categorie conditionne uniquement
l'interface et la restitution. Le champ existant `sous_categorie` contient le
type d'habitation pour ce parcours, tandis que l'ordre d'analyse
`Eau -> Air -> Terre -> Feu` est defini dans le catalogue frontend. Aucun
endpoint ni schema MySQL supplementaire n'est requis.

Pour `Visite Globale`, `habitologie_protocoles` conserve les points retenus
pour chacune des quatre phases. Les observations reutilisent leur structure
existante et ajoutent les references facultatives `phase_habitologie` et
`controle_habitologie`. Une observation ancienne sans ces references reste
visible dans `A classer`.

Les nouveaux dossiers ne stockent pas de choix manuel de controle par defaut.
`ecoute.sujets_identifies` contient uniquement les sujets explicitement coches ;
la selection effective est calculee par `isHabitologieControlSelected`, utilise
par l'interface et l'export. Un booleen manuel conserve dans
`habitologie_protocoles` prime sur la suggestion. Les booleens des anciens
dossiers sont preserves. Les libelles d'entretien et d'export partagent la
definition `clientListening.js`.

Chaque entree `habitologie_protocoles[phase]` porte maintenant `enabled` :
seul `false` suspend la phase ; son absence dans un ancien brouillon equivaut
a `true`. `setHabitologieStageEnabled` fige les selections effectives dans
`controls` avant de suspendre la phase, puis les restaure a la reactivation.
`isHabitologieControlSelected` retourne toujours faux pour une phase suspendue,
meme si ses controles conserves ou les nouveaux sujets d'ecoute sont vrais.
Les observations ne sont ni filtrees ni modifiees par cette operation.
Le champ suit le payload JSON existant sans migration SQL ni nouvel endpoint.

`LocationMap.jsx` affiche les tuiles WMTS IGN via Leaflet 1.9.4 embarque dans
le build, sans iframe, CDN de code ou cle. `localisation` conserve l'adresse
geocodee et la confirmation liee aux coordonnees, a l'adresse saisie et a une
date. Le deplacement du fond de carte ne change pas le point du dossier.
Le mode explicite d'ajustement conserve un point provisoire dans l'etat local
de `LocationMap`, sans modifier le rapport avant validation. `visitPoint.js`
applique ensuite la transition et invalide les donnees derivees ; les champs,
flux et regles de conservation sont decrits dans
[le contexte du bien](../api/contexte-du-bien.md#correction-manuelle-du-point-de-visite).
Le geocodage expose immediatement la localisation ; les enrichissements sont
bordes par des delais et un compteur ignore les retours apres sortie de Site.
Les couches et limites de qualification sont centralisees dans
[`../api/cartographie.md`](../api/cartographie.md).

Apres le geocodage BAN ou la correction manuelle du point, le frontend appelle directement les services publics
API Carto et Georisques. Le cadastre, l'urbanisme et les risques sont traites
comme des enrichissements independants : l'absence de parcelle ne bloque pas
la synthese des risques. L'endpoint Georisques V1 public recoit uniquement
`longitude,latitude` et renvoie les statuts a l'adresse et sur la commune. La
synthese normalisee, sa source, sa date de consultation et le lien officiel
sont stockes dans l'objet `risques` du payload. Aucun jeton Georisques n'est
requis pour ce lot.

Dans Site, les vues risques, urbanisme et terrain sont montees a la demande.
`SiteInsights.jsx` utilise `urbanismContext.js` et `terrainContext.js`
pour des lectures publiques avec delai maximal et annulation au demontage.
Le payload ajoute `urbanisme.context`, `urbanisme.notes` et `terrain`,
sans table ni migration supplementaire. Les formats et limites sont
centralises dans [`../api/contexte-du-bien.md`](../api/contexte-du-bien.md).

`TerrainPanel` reutilise `CadastralMap` avec une superposition facultative.
`terrainMapSamples` valide les mesures du lieu courant avant de produire les
etiquettes Leaflet et les classes d'extremes relatifs. Aucune nouvelle
persistance, geometrie cadastrale ou interpolation ; voir
[la presentation du relief](../api/contexte-du-bien.md#altitudes-sur-le-fond-cadastral).

La configuration sensible est chargee depuis `/home/CPANEL_USERNAME/.avereo/rapport/config.php`, hors de `frontend/dist`.

## Structure

`BuildingResources.jsx` complete Site avec GoRenove et Pro'Reno.
`buildingResources.js` centralise les sources, routes autorisees, rattachement
au lieu confirme et restitution. Les donnees suivent `ressources_batiment`
dans le payload JSON. Les ouvertures externes sont manuelles, sans requete
d'enrichissement ni secret ; voir [le contrat fonctionnel](../api/ressources-batiment.md).

- `frontend/src/` : interface et mode brouillon local.
- `frontend/public/api/` : API PHP publiee au build.
- `frontend/public/auth/callback/` : callback OAuth.
- `backend/config.example.php` : modele de configuration sans secret.
- `database/migrations/` : schema versionne.
- `local/` et `docker-compose.local.yml` : environnement prod-like isole.
- `docs/` : audit, architecture, auth, exploitation et rollback.

## Plan d'integration

- Conserver la refonte React existante et son build Vite.
- Ajouter l'API PHP et la table `rapport_reports`.
- Garder IndexedDB comme brouillon hors ligne et ajouter la sauvegarde authentifiee par etapes.
- Utiliser le mock OAuth local avant l'activation Drupal.
- Publier uniquement `frontend/dist/` en FTPS.
- Revenir au commit/deploiement precedent en cas de probleme et restaurer une sauvegarde MySQL si une migration est impliquee.

## Routage local partage

Le compose isole conserve le port technique `8100` pour le diagnostic. Le gateway HTTP partage dans `avereo-platform/infra/local-gateway/` ecoute sur `127.0.0.1:80`, charge une route fichier propre a Rapport sans acces au socket Docker et transmet `http://rapport.avereo.localhost` vers le conteneur applicatif. La commande `down` de Rapport ne touche pas ce composant partage.
