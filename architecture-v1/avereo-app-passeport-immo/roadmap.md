---
project: avereo-app-passeport-immo
document_type: roadmap
title: Roadmap Passeport Immo
status: active
version: git
created: 2026-10-03
updated: 2026-11-24
owner: jpdandin
tags: [avereo, documentation, local]
---

## 24 novembre — Priorité UX/UI locale

Premier lot Bibliothèque en développement et qualification locaux. Suite : revue humaine du candidat et de sa PR, puis préproduction de cette version après accord et préparation réelle de la cible. Le CIL complet, les opérations en masse et les vérifications hébergées antérieures restent distincts. [Suivi canonique](data/suivi-ux-ui.json).


## 22 novembre — R12-18 livré, recette hébergée volumineuse suivante

PR178 fusionnée et installée en préproduction, source `15f537a05b06a0ba589885b0945109c978afbc24`. Le plafond JSON est appliqué à **100 000 000 octets (100 Mo)** dans Rapport et Passeport, sans réduire les médias ni changer les 524 288 000 octets autorisés par paquet. Sauvegardes et restauration temporaire réussies ; 32 dossiers Rapport et leurs propriétaires, quatre tables Passeport et 30 fichiers privés exacts après livraison. [Reçu de conservation](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-volume-sans-perte-20261120/preproduction-20261122/final-verification.json>).

Suite prioritaire : [recette authentifiée volumineuse](../avereo-app-rapport/docs/volume-sans-perte.md#préproduction), sauvegarde et réouverture serveur dans une nouvelle session ; garder séparés le rendu Microsoft Word et le cas réel de Philippe. Ne pas rejouer le lot Projet par périodes déjà acquis. Production non autorisée.

## Lot local du 21 novembre — R12-18

[Volume Rapport sans perte](../avereo-app-rapport/docs/volume-sans-perte.md) : paquet réel de 63 Mo avec le Word client natif généré dans Rapport, import UI, nouvelle session propriétaire, copie privée et reprise dans Rapport vérifiés. Sauvegarde/restauration temporaire réussie, 37 médias et source/propriétaires exacts. PDF de contrôle relus sous LibreOffice ; rendu Microsoft Word et capacité hébergée restent réservés avant autorisation de préproduction. Les lots historiques ci-dessous gardent leurs preuves et décisions.


## Lot actif du 19 novembre — Publication Rapport

Lot installé en préproduction après CI, sauvegarde/restauration et accord du responsable. Dépôt fictif, copie privée, partage du Word client, idempotence, nouvelle connexion, récupération serveur et réouverture indépendante dans Rapport vérifiés. Les accès temporaires sont rétablis. Suite : revue humaine PR173 ; merge et production distincts. [Reçu](api/report-publication-observation.json). Les sections antérieures ci-dessous conservent leurs constats historiques.
# Roadmap Passeport Immo

## Priorité — incident de partage

Le [partage nominatif](docs/partage-documents.md) est installé et techniquement vérifié en préproduction. Confirmer le seul accès demandé, puis l’expert termine son activation CONNECT et vérifie sa consultation réelle. La préparation de production corbeille/classement est différée ; sa recette est acceptée, PR155 reste ouverte.


## Travail courant — organisation documentaire

La PR153 est fusionnée et [corbeille, dossiers, apparence et ordre](docs/preproduction-organisation.md) sont livrés en préproduction privée. Recette humaine déclarée validée dans le chat ; PR155 opératoire encore ouverte. Sauvegardes et conservation des 28 documents vérifiées ; production et CIL restent distincts.

## Suite courante — reprise et fichiers compressés

Les PR145 et PR146 sont fusionnées. Le [correctif à 500 Mo](docs/preproduction-import-volumineux.md) est livré en préproduction privée : réception réelle, préservation et écran d’import contrôlés. Prochaine action : ajouter les archives d’origine, vérifier persistance et téléchargement, puis valider la revue hébergée du lot. La production antérieure garde ses reçus et limites : ne pas rejouer migration SCI, activation ou cron. Le CIL reste distinct.

## Évolution CIL proposée le 16 octobre

Le [plan d’action](docs/plan-action-cil.md) prépare une itération distincte :
contenu applicable, modèle du carnet, documents et travaux, caractéristiques
techniques, vérification, export et transmission. Il fixe quatorze actions et
douze scénarios proposés ; cadrage, moyens et calendrier restent à arrêter.
Le Word est dérivé de cette source. Ce travail accompagne la production actuelle
sans modifier son candidat ni ajouter de condition fonctionnelle à D06.

## Suite du 16 octobre — lever le blocage OAuth

La production privée est activée selon D06 ; le dossier SCI, la récupération isolée
et 57 contrôles HTTPS sont vérifiés. La sauvegarde quotidienne est active et le
premier vrai succès cron est constaté ; l’entrée temporaire de qualification est retirée.

Le [blocage courant](docs/blocage-oauth-production.md) porte sur l’échange de jetons
OAuth du site Drupal AVEREO, qui reçoit 503 pendant sa maintenance. Un correctif
limité à trois routes est autorisé et intégré dans la PR Drupal nº21 ; 66 contrôles
réussissent avec le vrai service de maintenance. Le précontrôle hébergé échoue sur
six alertes de dépendances : autoriser et qualifier ces lots de sécurité distincts,
puis reprendre installation OAuth et parcours complet CONNECT. D06 est conservé.
Le plan CIL reste une proposition pour l’itération suivante.

## Historique — suite après fusion de la PR nº81

L'inventaire cPanel et les contrôles publics sont réalisés. Le
[dossier de mise en production](docs/04-mise-en-production.md) décrit la cible
absente, les trois paramètres de code CONNECT à ajouter, les lots préparés et la
récupération à qualifier. L'outillage de sauvegarde adapté est testé localement.
L'archive applicative publique reste identique au candidat installé en préproduction.

Le dossier SCI de préproduction est retenu pour les données initiales, selon le
[plan de reprise](docs/04-mise-en-production.md#reprise-du-dossier-sci), sans transfert effectué.
Prochaines actions : appliquer la décision D06 existante, qualifier le propriétaire
CONNECT et actualiser l'inventaire SCI avant préparation de la cible fermée,
du raccordement et du transfert exacts de production.
La récupération hébergée, le compte destinataire et la recette authentifiée
restent à traiter avant activation. La phase 3 est en préparation, sans livraison.

La copie hors hébergement et les alertes de sauvegarde restent des propositions
à prioriser. L'échec du workflow GitHub Pages du prototype est consigné séparément
pour déterminer son utilité actuelle avant toute correction. Les statuts et
réserves sont portés par le [suivi canonique](docs/suivi-chantier.json).

## Historique — recette humaine préparée avant fusion

Suivre [le guide de recette](docs/recette-preproduction.md), lire les six livrables
et vérifier les huit critères de la phase Préproduction dans le cockpit. Examiner
la PR nº80 et consigner les anomalies ou la décision. L'installation et la première
sauvegarde restent des preuves techniques ; la production attend son accord distinct.

## Historique — sauvegarde automatique active avant revue

Le stockage partagé et sa sauvegarde quotidienne sont opérationnels. Le premier
déclenchement réel, les quatre tables, neuf fichiers et la récupération temporaire
sont vérifiés ; treize cas de sécurité/rotation passent aussi en CI.
Prochaine action : revue humaine de préproduction avec ces preuves dans la PR nº80.
Voir [la procédure](docs/sauvegarde-automatique.md).

## Historique — stockage livré en préproduction privée

Le stockage centralisé est installé et vérifié : base dédiée, session CONNECT réelle,
API et neuf documents SCI partagés entre sessions. La CI, la recette HTTPS,
l’import sans doublon et la sauvegarde avec restitution temporaire sont conformes.
Prochaine étape : revue humaine de préproduction et décision sur la PR.
Cette priorité remplace le choix encore ouvert « import Chrome ou stockage partagé »
du bilan précédent. Voir [le lot serveur](docs/stockage-serveur.md).

## Historique — bilan du sas avant stockage partagé

Le lot documents/coupes est approuvé dans le cockpit. Le sas, les paramètres
privés et le delta compatible CONNECT sont installés en préproduction, après
l'autorisation du responsable et son choix de compte. Catalogue et droits ciblés,
octets et permissions, tickets techniques et protection visiteur sont contrôlés.
Fichiers et lignes du catalogue/droits disposent de récupérations vérifiées.
Le lancement utilise désormais le sas pour toutes les ressources et ne présente
plus de porte Basic propre à Passeport Immo. Le dossier de la SCI est importé et
vérifié dans le navigateur intégré, six documents actifs et trois archivés.
Le responsable confirme dans Chrome la disparition de la troisième fenêtre.
La prochaine action est la revue humaine de préproduction avec sa déconnexion.
Le stockage par navigateur reste une limite : import
Chrome ou futur stockage partagé à choisir avant un usage sur plusieurs navigateurs.
Voir le [rapport courant](docs/03-preproduction.md).
Le [runbook](docs/deployment.md) garde les opérations concrètes. La production
reste distincte ; les statuts font foi uniquement dans le suivi canonique.

Le [suivi JSON](docs/suivi-chantier.json) fait foi sur les statuts et décisions.
Le découpage initial prévoyait : reprise/état des lieux, reprise identique, intégration
CONNECT, préproduction, préparation de production, spécification du passeport client.
La session autorise l'état des lieux puis un prototype local, sans valider les phases.
Les jalons ultérieurs et dates restent à décider ; aucun engagement de livraison.

Le prototype de session est disponible ; sa recette est préparée dans le livrable local.
La prochaine action est la revue par le responsable, puis sa décision sur la suite.

## Historique — premières itérations GitHub/cockpit
Le responsable a demandé « Raccordement et correction du PDF ». Le correctif court
et multipage est testé ; le candidat et les preuves sont liés à la fiche d'itération.
Le raccordement réutilise le cockpit Projet existant. Préproduction et production
restent bloquées par l'absence de cible Passeport Immo qualifiée et d'accord exact.
Prochaine action : revue du candidat, puis qualification de la cible et du lot CONNECT.
Les trois étapes du protocole sont affichées sans modifier les statuts formels.

La source du lot local est désormais fusionnée dans la PR nº71 après checklist humaine.
La suite retenue est la qualification d'une préproduction dédiée o2switch. L'adresse,
le dossier, le certificat et la fermeture initiale sont établis ; accès privé de test
et récupération restent à définir avant l'accord exact d'installation du candidat.
Les détails datés et les statuts sont conservés uniquement dans le suivi canonique.

Après fusion du complément nº72, le lot courant prépare l'archive privée et la
récupération locale. L'espace distant est créé et fermé ; qualification de l'accès
privé, récupération hébergée et lot CONNECT précèdent l'installation de l'application.
Le suivi conserve les preuves datées et la prochaine action.

## Cadre courant en quatre phases

Le cockpit présente Cadrage, Développement local, Préproduction et Mise en production.
Le [mapping](docs/mapping-phases.md) conserve l’ancien découpage et ses preuves.
Le lot documents client/bien est approuvé localement ; l’intégration CONNECT est
installée en préproduction privée, avec recette partielle décrite dans le rapport courant.
Le comparatif ExamIn fixe les réserves ; les prochaines étapes proposées sont
recette humaine du dossier et des coupes de principe, identité CONNECT,
puis stockage partagé et droits après cadrage. La production reste non livrée.

La revue approuvée du développement local portait sur le lot documents et coupes
de la PR nº78, après clarification du responsable. CONNECT reste un prérequis
de Préproduction à réaliser localement avant toute installation distante.
Le [mapping](docs/mapping-phases.md) conserve le périmètre initial et l’ajustement,
sans transformer la fusion GitHub en approbation de phase.
