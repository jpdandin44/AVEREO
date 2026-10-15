---
project: avereo-app-passeport-immo
document_type: roadmap
title: Roadmap Passeport Immo
status: active
version: git
created: 2026-10-03
updated: 2026-10-15
owner: jpdandin
tags: [avereo, documentation, local]
---

# Roadmap Passeport Immo

## Recette humaine à réaliser

Suivre [le guide de recette](docs/recette-preproduction.md), lire les six livrables
et vérifier les huit critères de la phase Préproduction dans le cockpit. Examiner
la PR nº80 et consigner les anomalies ou la décision. L'installation et la première
sauvegarde restent des preuves techniques ; la production attend son accord distinct.

## Sauvegarde automatique active

Le stockage partagé et sa sauvegarde quotidienne sont opérationnels. Le premier
déclenchement réel, les quatre tables, neuf fichiers et la récupération temporaire
sont vérifiés ; treize cas de sécurité/rotation passent aussi en CI.
Prochaine action : revue humaine de préproduction avec ces preuves dans la PR nº80.
Voir [la procédure](docs/sauvegarde-automatique.md).

## Stockage livré en préproduction privée

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

## Itération GitHub/cockpit
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
