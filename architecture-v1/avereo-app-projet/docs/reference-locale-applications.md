---
project: avereo-app-projet
document_type: feature-guide
title: Dossiers locaux de référence dans Développements
status: active
version: git
created: 2026-11-10
updated: 2026-11-10
owner: jpdandin
tags: [cockpit, reference, chemins-locaux]
---

# Dossiers locaux de référence

La vue d’ensemble peut afficher une rubrique Référence locale des applications et, dans chaque application concernée, son dossier de référence. Les chemins sont sélectionnables et un bouton les copie pour les coller dans l’Explorateur Windows. Une page hébergée ne peut pas ouvrir directement un dossier du PC ; aucun protocole système, agent local ou exécution de commande n’est ajouté.

L’affichage est conditionné par les seules métadonnées `portfolio[].localReference` d’une publication privée signée. Sans ces métadonnées, l’ancienne vue est conservée. Le lecteur propriétaire/global, les quatre phases, les décisions et les badges existants ne sont pas modifiés. Les dossiers ne sont ni lus ni transférés sur l’hébergement.

## Publication explicite

`workflows/development-local-reference.mjs` qualifie un catalogue `avereo-local-reference-catalog` : dix identifiants attendus, SHA commun, date valide, chemins Windows confinés à la photographie `AVEREO-reference/versions/<sha>/architecture-v1/`. Les propriétés annexes du catalogue ne sont pas publiées. Le filtre générique d’export des chemins privés reste inchangé ; cette extension est un acte explicite limité au catalogue demandé.

`extendReferenceSnapshot` reprend une projection déjà qualifiée et y ajoute le seul suivi de référence et les métadonnées des dix dossiers. Les itérations antérieures, leurs phases et décisions, les déclarations de livraison, les reçus et la date d’observation GitHub sont conservés. Une séquence inattendue et un second ajout du même suivi sont refusés.

## Contrôles et livraison

La suite `tests/development-local-reference.test.mjs` couvre confinement, séquence, absence de données annexes, conservation des décisions et badges, copie du chemin, sélection de secours et ancienne publication. La préparation hébergée conserve son propre paquet, ses empreintes, sa sauvegarde et son retour arrière ; une réussite locale ne prouve pas l’installation.

Écart à la V1 statique historique : cette évolution complète uniquement l’interface du module privé Développements déjà existant, sans nouvelle API, base ou autorité. Les chemins publiés restent visibles au seul lecteur propriétaire/global ; les autres chemins et les secrets ne sont pas exportés.
