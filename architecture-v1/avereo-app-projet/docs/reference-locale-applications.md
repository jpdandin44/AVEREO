---
project: avereo-app-projet
document_type: feature-guide
title: Dossiers locaux de référence dans Développements
status: active
version: git
created: 2026-11-10
updated: 2026-11-11
owner: jpdandin
tags: [cockpit, reference, chemins-locaux]
---

# Dossiers locaux de référence

La vue d’ensemble peut afficher une rubrique Référence locale des applications et, dans chaque application concernée, son dossier de référence. Les chemins sont sélectionnables et un bouton les copie pour les coller dans l’Explorateur Windows. Une page hébergée ne peut pas ouvrir directement un dossier du PC ; aucun protocole système, agent local ou exécution de commande n’est ajouté.

L’affichage est conditionné par les seules métadonnées `portfolio[].localReference` d’une publication privée signée. Sans ces métadonnées, l’ancienne vue est conservée. Le lecteur propriétaire/global, les quatre phases, les décisions et les badges existants ne sont pas modifiés. Les dossiers ne sont ni lus ni transférés sur l’hébergement.

## Publication explicite

`workflows/development-local-reference.mjs` qualifie un catalogue `avereo-local-reference-catalog` : dix identifiants attendus, SHA commun, date valide, chemins Windows confinés à `AVEREO-reference/depot/architecture-v1/` pour un catalogue `reference.mode = git-clone`. Le dépôt déclaré doit être `jpdandin44/AVEREO`, sur main, propre et non superficiel, avec HEAD cohérent. Les anciens catalogues sans mode restent lisibles, explicitement étiquetés archives sans historique Git. Les propriétés annexes du catalogue ne sont pas publiées. Le filtre générique d’export des chemins privés reste inchangé ; cette extension est un acte explicite limité au catalogue demandé.

`extendReferenceSnapshot` reprend une projection déjà qualifiée et y ajoute le seul suivi de référence et les métadonnées des dix dossiers. Les itérations antérieures, leurs phases et décisions, les déclarations de livraison, les reçus et la date d’observation GitHub sont conservés. Une séquence inattendue et un second ajout du même suivi sont refusés.

## Contrôles et livraison

La suite `tests/development-local-reference.test.mjs` couvre confinement, séquence, absence de données annexes, conservation des décisions et badges, copie du chemin, sélection de secours et ancienne publication. La préparation hébergée conserve son propre paquet, ses empreintes, sa sauvegarde et son retour arrière ; une réussite locale ne prouve pas l’installation.

Écart à la V1 statique historique : cette évolution complète uniquement l’interface du module privé Développements déjà existant, sans nouvelle API, base ou autorité. Les chemins publiés restent visibles au seul lecteur propriétaire/global ; les autres chemins et les secrets ne sont pas exportés.

## Référence Git et conservation des archives

Le clone Git complet est le point d’entrée aux développements, distinct du dossier versions qui conserve un export historique. La rubrique affiche la branche, le commit observé et le lien GitHub. Les dix chemins sont à copier dans l’Explorateur Windows ; aucun accès au contenu local ne passe par le serveur. Les observations sont datées et ne déclenchent aucune synchronisation continue.

`updateReferenceSnapshot` remplace les seules métadonnées localReference d’une publication existante, à la séquence suivante ; les itérations, badges, dates GitHub, reçus et accords restent identiques. Le remplacement d’un catalogue est distinct de l’ajout initial d’un suivi par extendReferenceSnapshot.

Le générateur `workflows/development-reference-catalogue.py` est versionné dans le dépôt AVEREO. Utilisation : `python -X utf8 workflows/development-reference-catalogue.py inventory --root CHEMIN_ORGANISATION`, ou `verify` avec le même root. La configuration de cette organisation désigne un clone dans depot et une archiveReference indépendante. Le générateur observe remote, main, origin/main, HEAD, nombre de commits accessibles et état propre. Il refuse une mauvaise cible ou des travaux non committés sans les modifier ; aucun fetch, pull, checkout ou reset. Il génère le catalogue, les inventaires, vues Markdown et spécifications des raccourcis. La création native des raccourcis est effectuée séparément par le script Windows existant de l’organisation.

Les commandes prepare/resume d’export initial ne font pas partie de ce générateur Git. L’archive existante reste vérifiée par ses empreintes ; elle n’est pas recréée pour suivre main. Après fusion et fast-forward volontaire du clone, l’entrée locale du générateur peut être raccordée au fichier intégré dans ce clone, après comparaison de son contenu. Avant fusion, le chemin de la copie de travail utilisée doit rester explicite.
