---
project: avereo-app-projet
document_type: technical-guide
title: Cohérence locale du cockpit avec GitHub
status: active
version: git
created: 2026-11-09
updated: 2026-11-09
owner: jpdandin
tags: [cockpit, github, projections, lecture-seule]
---

# Cohérence locale avec GitHub

## Complément courant — qualification et collecte explicite

Le [guide des preuves et de l’actualisation](preuves-et-actualisation-github.md) complète cette étape initiale : qualification privée par empreintes, contexte non concluant et bouton local de collecte GET. Les sections ci-dessous conservent les principes du premier raccordement ; **Actualiser la vue** relit les fichiers, **Rafraîchir GitHub** effectue la collecte explicitement autorisée.

## Périmètre

Candidat local distinct de la PR #134, développé depuis son HEAD propre `9c6eab0b0ddf9db8ccd97495d5aaf196a156e064`. Aucun changement du Gantt, de son stockage, des droits ou du pont Drupal/CONNECT. Accès privé du poste, pas une attestation du rôle CONNECT. Aucune publication ou installation.

Les suivis métier restent les sources canoniques, toujours consultatives. Le registre privé référence les sources actives et conserve les historiques. Les observations GitHub sont une représentation dérivée datée, sans modification des phases, candidats livrés, décisions ou approbations de ces sources.

## Lecture et affichage

Le portefeuille distingue la copie locale réellement configurée de **GitHub — main et PR**. Le SHA de main et le dernier commit du périmètre applicatif sont séparés ; la comparaison utilise les SHA d’arbres committés, pas la seule différence des HEAD. Une copie locale modifiée est conservée et signalée. Cela ne mesure pas un retard de déploiement.

Le détail montre l’état **déclaré dans le suivi** et l’état **observé sur GitHub**. Une divergence est annoncée, jamais corrigée silencieusement dans le JSON ; la casse OPEN/open ne crée pas de faux écart. Les PR ouvertes sont présentées en priorité, sans déduire leur phase ni changer les dates métier. CI technique et PR Policy restent distincts. Les pièces sans phase explicite restent consultables dans une section distincte, sans rattachement arbitraire ; l’API les expose dans `unassignedProofs`.

`Actualiser` relit les fichiers locaux, dont la dernière observation GitHub. Il ne contacte pas GitHub. Aucune synchronisation continue n’est installée ; toute nouvelle collecte doit être explicitement réalisée en lecture seule. Une observation absente/invalide devient indisponible, pas un ancien succès.

## Configuration privée

Le registre accepte `githubObservationFile`, chemin privé hors frontend vers un JSON :

- `schema: development-github-observations`, `observedAt` daté ;
- `repositories` : main observé par dépôt ;
- `applications` : dépôt, mainSha, mainTree, applicationCommit, URL et PR ouvertes par périmètre ;
- `pullRequests` : objets indexés par URL GitHub exacte, avec état, tête, fusion, date et liens de contrôles.

Le lanceur transmet ce chemin à `createDevelopmentStore`. Les observations et les suivis restent derrière le garde privé existant. Aucun secret GitHub, compte réel, cookie distant ou jeton d’accès n’est inclus dans ces fichiers. L’extension d’actualisation ajoute uniquement la route locale protégée décrite dans le complément ; aucun droit ni endpoint de collecte hébergé n’est ajouté.

## Projections explicites, jamais d’écriture

Les extensions suivantes exigent `writable: false` :

| Paramètre | Fonction et garde |
| --- | --- |
| `dataPath` + `iterationKey` | Sélection d’un élément de tableau par son `iterationId` exact ; identifiant absent ou doublon refusé, aucun repli vers le parent. Le changement d’ordre du tableau ne change pas l’identité sélectionnée. |
| `includeRootPhases: true` | Pour un workflow et son enveloppe explicitement de même portée, lire les phases/états humains de la racine. Aucun accord parent n’est converti en décision individuelle. |
| `recordKind: receipt` | Lire un reçu sourceSha/artefact/cible/deployedAt avec environnement explicite ; l’afficher comme déclaration, pas comme nouveau contrôle hébergé. |
| `recordKind: declaration` | Donner une identité de projection à une déclaration sans iterationId. Phase inconnue conservée si aucune phase n’est déclarée. |
| `deliveryAdapter: missions-preproduction` | Lire le reçu imbriqué Missions installé/vérifié et son codeSourceSha ; `deliveryApplicationIds` limite les colonnes aux cibles explicitement qualifiées. Aucune livraison Recherche/Saisie n’est fabriquée. |
| `evidenceBase` | Résoudre les pièces relatives au bon dossier, toujours dans la racine privée autorisée ; aucun élargissement aux chemins absolus externes. |
| `githubPrUrls` | Rattacher des références GitHub complémentaires sans modifier le journal métier. |

Les quatre phases restent **Cadrage**, **Développement local**, **Préproduction**, **Mise en production**. Les critères non reconnus ou non reliés à des preuves restent annoncés comme tels. La présence d’un fichier ne prouve pas la réussite d’un test. Les anciennes preuves restent historiques, sans être effacées ou transférées à un nouveau candidat.

## Vérification

Depuis `frontend/` :

```powershell
npm.cmd run test:developments
npm.cmd run build
```

`development-coherence.test.mjs` couvre la sélection stable d’itérations, les refus d’ambiguïté/écriture, la conservation des accords, les divergences GitHub sans écriture, la disparition de l’observation, les PR dans les phases, les reçus et la limitation des cibles Missions. Les tests HTTP/access existants restent applicables. Le build normal exclut toujours données, module privé et API de revue.

Les chemins réels, la collecte datée, les empreintes de conservation et la recette navigateur appartiennent au dossier privé `avereo-pilotage/docs/coherence-cockpit-github.md` et au nouveau suivi `avereo-pilotage/data/suivi-coherence-cockpit.json`. Ils ne sont pas inclus au dépôt public. Le registre doit rester hors frontend et tous les suivis réels en lecture seule.

## Limites et suite

Aucune version complète réellement installée n’est qualifiée par les lots déclarés. Pas de nouvel examen des droits CONNECT, du serveur, des sauvegardes ou de la restauration. Pas de push, PR nouvelle, CI distante, merge ou déploiement.

Le candidat est en Développement local, à examiner par le responsable. Préproduction et Mise en production ne sont pas commencées. Une évolution hébergée et le rafraîchissement durable des observations GitHub constituent des étapes distinctes à qualifier et autoriser.
