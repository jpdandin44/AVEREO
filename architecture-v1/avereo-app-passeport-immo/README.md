---
project: avereo-app-passeport-immo
document_type: readme
title: AVEREO – Passeport Immo
status: active
version: git
created: 2026-10-03
updated: 2026-11-13
owner: jpdandin
tags: [passeport-immo, local]
---

# AVEREO – Passeport Immo

## Partage des documents — incident prioritaire

Le [partage nominatif](docs/partage-documents.md) remplace le simple partage d’URL historique. Correctif installé et techniquement vérifié en préproduction privée : 210 assertions HTTPS, 26 documents conservés, écran interne nominatif. Confirmation du nouvel accès et activation normale du destinataire encore requises. Recette corbeille/classement acceptée dans le chat, PR155 non fusionnée ; production en attente.


## Organisation des documents — préproduction du 13 novembre

Le [nouveau lot](docs/organisation-documents.md) ajoute une corbeille restaurable, la suppression définitive confirmée, des dossiers parents par catégorie, leurs icônes/couleurs et l’ordre manuel par bien. Le paquet PR153 est [installé et techniquement vérifié en préproduction privée](docs/preproduction-organisation.md) après fusion et accord explicite : migration additive, 28 documents conservés, 247 assertions HTTPS et écran SCI contrôlés. La recette humaine est déclarée validée dans le chat ; PR155 reste ouverte, sans accord de production pour ce lot. La limite de 500 Mo est conservée. Les 28 documents décrivent le relevé de cette livraison ; le contrôle frais du partage constate ensuite 26 documents sans perte pendant son installation.

## Reprise du 12 novembre — état courant et archives

Le [correctif à 500 Mo](docs/import-volumineux.md) est [installé en préproduction privée](docs/preproduction-import-volumineux.md) après fusion des PR145/146 et accord explicite. Le rapport de 173 Mo et les quatorze archives de 203 Mo peuvent rester entiers, avec envois automatiques par lots. Réception réelle de 173 et 500 Mo, refus de 501 Mo, sauvegarde et conservation des treize documents vérifiés. La recette humaine des archives d’origine reste à réaliser depuis CONNECT.

La [reprise courante](docs/reprise-documents-compresses.md) rapproche le dépôt à jour, les accès hébergés et les preuves historiques. La PR85 est fusionnée, de même que Drupal23 ; les mentions du 16 octobre ci-dessous décrivent leur état à cette date. Le nouveau [lot archives](docs/documents-compresses.md) accepte ZIP, 7z, RAR, TAR, GZ et TGZ, conservés entiers selon le choix du responsable. Après fusion de la PR144 et accord explicite, il est [installé en préproduction privée](docs/preproduction-archives.md). La recette technique et les documents existants sont vérifiés ; la revue humaine et la production de ce lot restent distinctes. La [copie locale sur 5178](http://127.0.0.1:5178/) reste disponible. Les anciennes limites PR144 de 25/100 Mo sont remplacées en préproduction par 500 Mo par fichier et par lot ; le schéma et les droits existants sont réutilisés.

## Étude du carnet d’information du logement

Le [comparatif avec le guide ministériel](docs/comparatif-carnet-information-logement.md)
distingue le concept CIL, la réutilisation des contenus publics et les services tiers.
Il compare les capacités actuelles aux documents attendus, propose une évolution
et conserve les limites de complétude, de transmission et de responsabilité.
Cette étude ne modifie pas le candidat en cours de livraison ni les validations.

Le [plan d’action CIL](docs/plan-action-cil.md) propose quatorze actions avec
priorités, dépendances, livrables, critères et douze scénarios de recette. Son
[Word structuré](docs/livrables/plan-action-cil.docx) est généré depuis cette source
selon le [workflow documentaire](workflows/generation-plan-cil.md). Les évolutions
restent à cadrer dans une itération distincte de la production actuelle.

## Production privée activée — recette OAuth à terminer

L’activation est exécutée par le responsable le 16 octobre à 12 h 44, heure de Paris.
Le candidat signé de seize fichiers et le stockage serveur sont actifs pour `dandin`.
Un bien, un client, six documents actifs et trois archives SCI sont repris ; deux
sessions signées indépendantes retrouvent les neuf documents aux mêmes empreintes.
Les 57 contrôles HTTPS de l’application réussissent sans modifier les lignes métier.

La sauvegarde quotidienne de production est active à 03 h 20 Europe/Paris, avec
trente copies vérifiées et un rattrapage horaire. Le premier vrai cron réussit à
12 h 45 sur quatre tables et neuf fichiers ; l’entrée temporaire est retirée.
Les copies restent privées sur le même hébergement ; copie distante et alertes
restent à qualifier.

La recette navigateur depuis CONNECT est bloquée par le service de jetons OAuth
d’AVEREO, qui répond 503 pendant la maintenance. Le [correctif proposé](docs/blocage-oauth-production.md)
est maintenant autorisé et intégré dans la [PR Drupal nº21](https://github.com/jpdandin44/avereo-site-drupal/pull/21).
Ses 66 contrôles réussissent ; l’audit préalable du site échoue sur six alertes
touchant quatre composants. Aucune installation OAuth n’est effectuée. Les lots
de sécurité nécessaires font l’objet d’une demande distincte ; D06 est conservé.
Le compte famille conserve son accès de préproduction avec isolement SCI vérifié.

Le [reçu de vérification](api/production-verification-observation.json), le
[dossier de production](docs/04-mise-en-production.md) et le
[suivi canonique](docs/suivi-chantier.json) distinguent livraison, recette et validation.
La phase 3 reste en cours. La PR nº83 est fusionnée ; les vérifications après
activation font l’objet de la [PR nº85](https://github.com/jpdandin44/AVEREO/pull/85), en brouillon. Aucune ouverture publique.

## Recette de préproduction et décision de phase

Le [guide de recette de la PR nº80](docs/recette-preproduction.md) accompagne les
six livrables et les huit critères de la phase Préproduction dans le
[cockpit local](http://127.0.0.1:5193/). Cette phase est approuvée par D06 ; les six
livrables examinés sont désormais figés. La recette utilise l'application hébergée via
CONNECT et un bien fictif pour les écritures ; le prototype local conserve son
stockage navigateur. La revue de PR et l'autorisation de production restent distinctes.

## Sauvegarde automatique de préproduction

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
En mode local, les données et images du dossier de travaux restent dans
`localStorage`, les documents dans IndexedDB ; le partage nominatif exige le
stockage serveur et CONNECT. En préproduction privée, les documents sont centralisés
et le partage ouvre seulement les documents actifs du bien désigné, après confirmation.
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

## Mon espace — candidat commun du 6 novembre 2026

Le menu regroupe Mes biens, l’administration métier conditionnée au rôle et la déconnexion native. Le stockage serveur ou local conserve son mode existant.

[Règle commune](../avereo-platform/docs/fonctionnalites-communes.md) · [Qualification et suivi](../avereo-platform/docs/qualification-mon-espace.md). Ce candidat local ne prouve pas une installation hébergée.

L’[annexe d’audit Mon espace](docs/source-audit-mon-espace.md) décrit le nouvel écart
et sa parité, en conservant les preuves historiques approuvées.

## Espaces applicatifs — candidat PR #121

Mes projets reprend la liste native des biens. Les préférences de ce navigateur règlent le tri par adresse et l’affichage de la composition ; les biens et documents conservent leur stockage existant. Mon compte et Mes applications ouvrent CONNECT.

[Règle et portée](../avereo-platform/docs/fonctionnalites-communes.md) · [Qualification](../avereo-platform/docs/qualification-mon-espace.md).
