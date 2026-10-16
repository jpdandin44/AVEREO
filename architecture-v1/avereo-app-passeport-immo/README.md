---
project: avereo-app-passeport-immo
document_type: readme
title: AVEREO – Passeport Immo
status: active
version: git
created: 2026-10-03
updated: 2026-10-16
owner: jpdandin
tags: [passeport-immo, local]
---

# AVEREO – Passeport Immo

## Suite après fusion de la PR nº82 et validation de Préproduction

La PR nº82 est fusionnée et la décision D06 du 16 octobre approuve la Préproduction,
avec ses huit critères, dont la sauvegarde nocturne. Le commentaire du responsable
autorise le passage en production. La phase 3 est en préparation : domaine et base
de production toujours absents dans cPanel le 16 octobre ; le raccordement CONNECT,
le propriétaire, la reprise SCI et la récupération restent à qualifier.
Le [dossier de mise en production](docs/04-mise-en-production.md) donne les preuves,
les emplacements proposés et la séquence d'installation dans le périmètre autorisé.

Une archive initialement fermée et l'adaptation minimale de CONNECT sont préparées
localement. L'outillage de sauvegarde distingue désormais préproduction et production,
avec des tâches indépendantes ; cette évolution n'est pas installée sur l'hébergement.
Le responsable retient la reprise du dossier SCI de préproduction ; le
[plan de reprise](docs/04-mise-en-production.md#reprise-du-dossier-sci) inclut ses
documents actifs et archivés. Le [suivi canonique](docs/suivi-chantier.json) référence
l'accord D06 sans nouvelle décision ; le [reçu courant](api/production-readiness-observation.json)
vérifie le candidat identique après fusion. Aucun transfert ou déploiement effectué.

## Recette de préproduction et décision de phase

Le [guide de recette de la PR nº80](docs/recette-preproduction.md) accompagne les
six livrables et les huit critères de la phase Préproduction dans le
[cockpit local](http://127.0.0.1:5193/). Cette phase est approuvée par D06 ; les six
livrables examinés sont désormais figés. La recette utilise l'application hébergée via
CONNECT et un bien fictif pour les écritures ; le prototype local conserve son
stockage navigateur. La revue de PR et l'autorisation de production restent distinctes.

## Sauvegarde automatique active

Une [sauvegarde complète automatique](docs/sauvegarde-automatique.md) est active
chaque nuit à 03 h 20, heure de Paris, avec conservation de trente copies réussies.
Le premier déclenchement cron a sauvegardé les quatre tables et neuf documents ;
retour des lignes et empreintes des fichiers contrôlés. Copies et journal restent
sur le même hébergement, hors dossier public. Le [reçu](api/automatic-backup-observation.json)
consigne l’installation ; le statut privé sur le serveur indique les exécutions suivantes.
La [copie nocturne du 16 octobre](api/nightly-backup-observation.json) est observée
en succès à 03 h 20 min 02 s, avec quatre tables et neuf documents. Son accès et
les limites du constat sont dans la procédure datée ; l'examen humain est ensuite
consigné dans D06 le 16 octobre.

## Stockage serveur opérationnel en préproduction privée

Le [lot de stockage privé](docs/stockage-serveur.md) est installé : base dédiée,
fichiers privés et identité CONNECT réelle. Le dossier SCI contient six documents
actifs et trois archivés, vérifiés depuis deux sessions indépendantes. Aucun import
par navigateur n’est nécessaire en préproduction. Les données locales sont conservées.
Le [reçu courant](api/storage-observation.json) et le suivi canonique gardent les preuves.

## Historique — installation du sas et import navigateur

Le [sas CONNECT](docs/02-integration-connect.md) et les paramètres de lancement
sont installés sur la préproduction privée. Le build ajoute les fichiers PHP et règles
Apache ; l'application locale sur 5175 garde son fonctionnement. PHP 8.3 et
Apache avec réécriture sont requis pour le sas hébergé. Le
[runbook](docs/deployment.md) précise configuration privée, catalogue et droits,
archive fermée, récupération et recette. CONNECT conserve sa porte visiteur ;
Passeport Immo utilise le ticket et la session signée, y compris pour ses assets,
sans seconde demande visiteur. Le lancement reste réservé au compte choisi.
Les clés restent sur le serveur. Le [rapport de préproduction](docs/03-preproduction.md)
distingue contrôle avec ticket, confirmation Chrome du responsable et import de la SCI effectué
dans le navigateur intégré : six documents actifs, trois archivés, persistance
et neuf fichiers restitués vérifiés. Ce stockage n'est pas partagé avec Chrome.

## Objectif et état
Version locale du prototype de chiffrage, reprise après l'état des lieux puis raccordée
au protocole GitHub/cockpit. La pagination PDF a été corrigée sur accord explicite.
Biens, pièces, interventions, trois gammes, documents, PDF et catalogue CSV sont présents.
En mode local, la connexion Admin Démo/Pro est simulée et les données restent
dans le navigateur. En mode serveur, la session CONNECT et l’API prennent le relais ;
les erreurs sont visibles sans repli vers les données locales.

La demande « Phase 0 puis prototype local dans cette session » autorise ce lot.
Le [suivi JSON](docs/suivi-chantier.json) reste l'autorité des statuts de chantier :
aucune décision ni validation humaine n'a été créée par l'agent.

## Lancer sur le poste
Prérequis : Node.js 22.13 ou supérieur et npm. Après installation, double-cliquer sur
[start-local.cmd](start-local.cmd), puis ouvrir <http://127.0.0.1:5175/>.
Cliquer sur « Se connecter » pour accéder aux deux biens de démonstration.
Le lanceur reste ouvert ; Ctrl+C arrête son instance. Un port occupé provoque un
arrêt : ne pas arrêter un service inconnu.

Installation initiale ou après changement des dépendances, depuis `frontend/` :
```powershell
npm.cmd ci
npm.cmd run dev
```
Le serveur écoute uniquement sur `127.0.0.1`, port strict 5175. Aucun secret requis.

## Contrôles et construction
Depuis `frontend/` :
```powershell
npm.cmd test
npm.cmd run build
npm.cmd run preview
```
`build` produit `frontend/dist/`. `preview` écoute également sur 5175, après arrêt
du serveur de développement. Depuis la racine du sous-projet :
```powershell
node tests/check-parity.mjs
docker compose -f compose.local.yaml config --quiet
```
Le contrôle de parité nécessite la source historique présente dans ce monorepo.
Les 29 tests Vitest sont autonomes dans `frontend/`. Le modèle Docker local exécute
tests puis build ; sa configuration a été vérifiée, son image n'a pas été construite.
Après recette Docker séparée : `docker compose -f compose.local.yaml up --build`
sur ce même port (arrêter d'abord son propre serveur de développement).

## Suivi et sources de vérité
Le [guide de revue](docs/acces-suivi-local.md) décrit le lanceur AVEREO Projet sur 5193.
Python 3.10+ et le générateur mutualisé sont nécessaires pour régénérer les vues ;
le chemin du poste est dans `.local/review-settings.json`, hors Git.
- Comportement de référence : `../avereo-app-connect/frontend/src/App.jsx` (inchangé).
- Application exécutée : `frontend/` ; changements a/b/c initiaux et correctif PDF d autorisé.
- État des phases : [suivi JSON](docs/suivi-chantier.json), vues dérivées exclusivement.
- [État des lieux](docs/00-etat-des-lieux.md), [audit source](docs/source-audit.md),
  [contrôles et recette](docs/01-reprise-identique.md), [point de reprise](docs/point-session.md).

## Limites connues
Le partage transmet l'URL, sans transférer le dossier à un autre poste. Les données
et images du dossier de travaux sont dans `localStorage`, les documents dans
IndexedDB, sans synchronisation entre navigateurs ni stockage partagé par compte CONNECT.
Les unités h/ml restent à zéro selon le calcul historique ; deux pièces homonymes
peuvent mélanger leurs lignes dans le PDF. La page blanche finale de l'export court
a été corrigée et recettée techniquement. Les autres limites restent dans le suivi.
La recette humaine et l'usage sur téléphone réel restent à effectuer.

## Structure et documentation
`frontend/` : interface et calculs ; `docs/` : preuves et suivi ; `prompts/` : mission ;
`workflows/` : revue ; `tests/` : parité ; `data/` : fixtures fictives ; `api/` : intégrations ;
`docker/` : modèle local ; `.local/` : paramètres et preuves du poste, ignorés.
[Architecture](architecture.md) · [Exigences](requirements.md) ·
[Roadmap](roadmap.md) · [Décisions](decisions.md) · [Changelog](changelog.md).

## Candidat et protocole GitHub/cockpit
La [fiche d'itération initiale](docs/iteration-developpement.md) reste une preuve
historique conservée dans ses octets approuvés. Le [tableau courant](docs/tableau-de-bord.md)
donne le candidat, la PR, les contrôles et les blocages depuis le JSON canonique.
Le [raccordement local](workflows/developpement-github-cockpit.md) décrit les commandes.
Après build, `python workflows/package-candidate.py` produit une archive vérifiée
et son manifeste dans `.local/`. Les [preuves du correctif](docs/raccordement-cockpit.md)
distinguent recette technique et acceptation humaine. La préproduction est
installée ; recette réelle et import restent ouverts. La production reste à qualifier.

La [préparation privée de préproduction](workflows/preparer-preproduction.md) produit
un lot contrôlé du candidat, avec fermeture initiale et répétition locale de restauration.
Commande depuis le sous-projet : `python workflows/prepare-preproduction.py`.

L'espace o2switch héberge l'application sous protection visiteur et sas CONNECT,
avec certificat HTTPS validé et récupération des fichiers et données ciblées vérifiée.
La recette avec l'identité réelle et l'import du dossier restent à effectuer. Voir la
[qualification de la cible](docs/qualification-preproduction.md) pour les contrôles observés.

## Lot documents du 14 octobre 2026

La [gestion documentaire](docs/documents-bien.md) associe client, bien et fichiers
sur ce PC : import multiple, classement, aperçu, recherche et archives. Le stockage
documentaire utilise IndexedDB ; les biens et calculs gardent leur fonctionnement.
Les 26 tests frontend et le build réussissent. Les documents clients ne sont pas
commités. Le [comparatif ExamIn](docs/progression-examin.md) décrit les exigences
couvertes, partielles, simulées et absentes. La centralisation serveur reste prévue.

Le [cas de coupes avant/après](docs/coupes-bien.md) utilise Coupe pour préparer
deux scènes CAO, exporter leurs SVG et joindre un PDF comparatif au bien.
