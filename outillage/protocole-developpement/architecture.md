---
project: protocole-developpement
document_type: architecture
title: Architecture du protocole commun
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [developpement, github, cockpit]
---

# Architecture

Le skill décrit le cycle. Son protocole Markdown constitue l'unique source humaine du processus ; la fiche JSON contient les faits d'une itération. Le contrôleur vérifie la cohérence des preuves déclarées et des passages. GitHub porte branches, PR, commits et exécutions réelles. Le cockpit présente le suivi canonique, les décisions et les liens de preuve.

Le modèle conserve le suivi existant : ajouter ou mapper un bloc `developmentWorkflow` plutôt que créer un second journal concurrent. Le moteur de revue local AVEREO peut afficher trois phases et enregistrer les décisions humaines sous verrou. Les opérations de déploiement restent effectuées par les outils autorisés de chaque projet ; le cockpit de revue n'en exécute aucune.

La copie installée est un lien de dossier vers le skill de ce socle ; aucun texte concurrent n'est maintenu. Secrets et données sensibles restent dans les stockages privés des projets. Le présent socle contient uniquement instructions, modèles et tests fictifs.

L'alias utilisateur `dev` expose `$dev`. Son entrée lit le skill de référence sans recopier le processus. La consigne globale route également le préfixe `DEV :` vers cet alias. Les deux dossiers utilisateur `.agents/skills/dev` et `.codex/skills/dev` pointent vers la même source locale.

Le lanceur de raccordement utilise le moteur Projet existant sur la boucle locale, avec un port explicite. Il n'altère pas les chantiers déjà suivis. Sa dépendance au chemin local du moteur est déclarée dans la configuration ; la portabilité nécessite de renseigner ce chemin.

La source commune est intégrée dans le dossier d'outillage du dépôt AVEREO. L'installateur
ne copie pas le protocole dans les projets : il relie les deux skills au profil utilisateur.
Les autres dépôts réutilisent le processus avec leur propre suivi ; AVEREO sert de dépôt
de distribution, sans devenir leur dépôt applicatif.
