---
project: avereo-app-projet
document_type: workflow
title: Revue locale et workflow de développement de Projet
status: active
version: git
created: 2026-09-24
updated: 2026-09-24
owner: jpdandin
tags: [projet, revue, local]
---

# Revue locale et workflow de développement de Projet

## Objectif et périmètre

La demande du 24 septembre 2026 autorise une évolution applicative locale
de Projet pour consulter, commenter et approuver les phases du chantier.
Ce lot est distinct des phases documentaires V8 : il ne valide pas l'audit
et ne lance pas la phase 2. Il prolonge le planning au commit `48ae277`
dans la branche `feat/projet-revue-phases`.

Le frontend hébergé conserve le planning statique. L'outil de revue s'exécute
uniquement avec le serveur de développement, sur la boucle locale. Il n'active
ni backend hébergé, ni MySQL, ni compte supplémentaire.

## Démarrer et reprendre

Prérequis : Node.js 22 ou ultérieur, npm, Python 3.10 ou ultérieur pour actualiser
les vues du chantier. Dépendances déclarées et verrouillées dans `frontend/`.

Double-cliquer sur [start-local.cmd](../start-local.cmd), puis ouvrir
[Projet local](http://127.0.0.1:5190/). Garder la fenêtre du lanceur ouverte.
Si un serveur fonctionne déjà sur ce port, réutiliser sa page ou arrêter son
terminal avant de relancer ; le lanceur refuse de changer silencieusement de port.

Équivalent depuis `frontend/` :

```powershell
npm.cmd ci
npm.cmd run dev:review
```

Le lanceur cherche d'abord `docs/chantier-optimisation/` à la racine de sa
copie Git, puis ce même dossier dans la copie sœur `architecture-documentation-avereo`.
Il affiche le chemin retenu dans le terminal et l'interface. Il ne copie pas
le chantier. Pour un autre dossier :

```powershell
npm.cmd run dev:review -- --chantier "C:\chemin\du\chantier" --port 5190
```

Le dossier doit contenir `suivi-chantier.json`, ses livrables Markdown et
`actualiser-tableau-de-bord.py` avec ses deux vues. La variable locale
`AVEREO_REVIEW_ROOT` est une autre façon de préciser ce dossier ;
`AVEREO_PYTHON` permet de choisir l'exécutable Python.

Pour essayer toutes les décisions sans toucher aux accords réels :

```powershell
npm.cmd run dev:review -- --demo
```

La [démonstration](http://127.0.0.1:5191/) affiche un bandeau jaune et utilise
un nouveau dossier temporaire à chaque lancement. Son journal survit au
rechargement de la page pendant cette session. Aucun accord de démonstration
ne migre vers le suivi réel.

## Revue depuis l'interface

Le [guide utilisateur](../docs/guide-utilisateur.md#examiner-une-phase-et-enregistrer-une-décision)
est la référence pour le parcours de lecture, les critères, les actions,
les confirmations et la reprise après correction ou changement de révision.
Il documente aussi le planning et ses sauvegardes distinctes. Le présent
workflow conserve les détails de stockage, de restauration et de développement.

## Sources, sauvegarde et confiance

`suivi-chantier.json` reste la référence : phases, décisions, preuves et
`reviewEvents` y sont remplacés dans une seule écriture atomique, sous verrou.
Chaque décision est liée aux empreintes SHA-256 des documents examinés et à
la révision du suivi. Les critères confirmés sont conservés dans l'événement
d'approbation. Les accords historiques par conversation sont gardés tels quels :
aucune empreinte ancienne n'est inventée.

Une copie préalable est créée dans `.review-backups/` du chantier.
Après sauvegarde, le générateur Python existant réaligne le HTML et le Markdown.
Une panne de génération est signalée comme **décision enregistrée, vues à
actualiser** ; ne pas répéter la décision pour corriger cet affichage.

```powershell
python "C:\chemin\du\chantier\actualiser-tableau-de-bord.py"
python "C:\chemin\du\chantier\actualiser-tableau-de-bord.py" --check
```

Le journal est un historique applicatif local, pas un registre inviolable :
une personne ayant accès aux fichiers peut les modifier. Le décideur est
une identité déclarée ; aucune authentification multiutilisateur n'est ajoutée.
La date complète des événements est en UTC. Git reste l'autorité de versionnage
après revue et commit des modifications.

Si `.projet-review.lock` subsiste après une interruption, arrêter tous les
serveurs de revue, contrôler le PID et la date contenus dans le verrou, puis
archiver ce verrou hors du dossier avant reprise. Ne pas contourner un verrou
d'un processus encore actif. Pour restaurer une sauvegarde, arrêter le serveur,
conserver une copie de l'état courant, examiner le JSON de sauvegarde puis
restaurer explicitement le fichier et régénérer les vues.

## Développement et contrôles

1. Travailler sur la branche dédiée ; inspecter l'état Git des deux copies.
2. Modifier le code Projet et ses documents. Les données du chantier réel
   restent dans sa copie de travail ; les tests utilisent des dossiers temporaires.
3. Exécuter depuis `frontend/` :

```powershell
npm.cmd run test:review
npm.cmd run build
```

Le build contrôle les dérivés du planning, exécute tous les tests Projet,
prépare le sas, compile Vite et contrôle l'artefact. La CI racine existante
exécute ce même build ; aucun workflow GitHub n'est modifié par ce lot.

4. Exécuter `npm.cmd run check` à la racine et `git diff --check`.
5. Faire la recette fictive puis consulter le chantier réel sans en simuler
   l'approbation. Les résultats et limites sont dans
   [la recette du lot](../docs/recette-revue-locale.md).
6. Relire le diff et préparer les commits. Les modifications des décisions
   réelles ne sont pas automatiquement commitées par l'application.
7. Une PR de développement, après publication de branche autorisée, utilisera
   le modèle racine avec toutes les cases humaines décochées. La branche part
   de `feat/projet-planning-local` : cibler cette base tant que son lot n'est
   pas intégré, ou réaligner explicitement après son intégration.
8. Faire valider la PR puis obtenir l'accord de fusion/publication applicable.
   Un push sur `main` peut déclencher le déploiement Projet existant.

Une approbation dans Projet ne coche pas de case GitHub, ne crée pas de PR,
ne commite pas, ne fusionne pas et ne publie pas. Les commandes de revue
n'exécutent aucun agent de développement en arrière-plan : l'accord enregistré
constitue le point de reprise du responsable ou de Codex.

## Limites restantes

La qualification du sas PHP/CONNECT hébergé, la synchronisation distante,
la preuve d'identité et les protections GitHub effectives restent hors de ce
lot local. Les limites historiques d'import XLSX/export navigateur du planning
restent documentées dans [l'audit](../docs/source-audit.md).

## Actualiser une vue de progression

L'interface relit automatiquement les états et jalons du snapshot existant ;
**Actualiser** permet aussi une lecture immédiate. La cadence, les sélections
conservées et les attestations à reprendre sont décrites dans
[le guide](../docs/guide-utilisateur.md#voir-la-progression-et-les-validations-acquises).
Aucune progression technique n'est estimée. Les références
`priorApprovals`, lorsqu'elles existent, sont entretenues par le chantier
consommateur depuis sa source autorisée. Elles ne remplacent jamais le journal
de décisions et n'entraînent aucune transition automatique.

Après une évolution de cette présentation, exécuter les tests ciblés de
`review-progress.test.mjs` et `review-refresh.test.mjs`, puis le build habituel qui inclut tous les tests.
Vérifier la vue réelle en lecture seule et les scénarios de décision sur fixtures.
