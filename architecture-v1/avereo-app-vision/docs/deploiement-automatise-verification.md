---
project: avereo-app-vision
document_type: verification
title: Vérifications locales du déploiement automatisé T-08
status: active
version: git
created: 2026-11-26
updated: 2026-11-26
owner: jpdandin
tags: [vision, deploiement, tests]
---

# Vérifications locales T-08

Branche : `vision/deploiement-auto`. Contrat : [brief T-08](codex/briefs/T-08-deploiement-automatise.md). Le suivi canonique conserve cette preuve dans [suivi-vision.json](../data/suivi-vision.json), sans modifier les décisions, accords ou jalons des lots précédents.

| Phase | État T-08 |
|---|---|
| Cadrage | Brief, règles, scripts mutualisés et configuration existante lus ; périmètre isolé |
| Développement local | Code et documentation préparés ; vérifications ci-dessous ; qualification stricte encore manquante |
| Préproduction | Aucune opération exécutée ; qualification hébergée à réaliser séparément |
| Mise en production | Aucune opération exécutée ; prérequis manuels et qualification du même SHA exigés |

## Résultats du 26 novembre 2026

- `npm ci` : réussi, sans changement du lockfile. Avertissement npm sur `glob` existant ; aucune dépendance mise à jour hors périmètre.
- `npm test` dans `frontend/` : **263 réussis, 0 échec, 0 ignoré**, Node 24.18.0 sur ce poste.
- `node --test deploiement/*.test.mjs` : **24 réussis, 0 échec**. Paquet conforme et empreinte ; refus de `local/`, `revue/`, `.env*`, configuration privée, jeton, fichier requis absent ; promotion même SHA/environnement, erreur API ; contrôles publics avec réponses simulées, erreurs de cache, santé, bibliothèques, redirection et TLS. Aucun accès aux domaines hébergés dans ces tests.
- `php tests/api/run.php` sous le PHP portable **8.4.23** du poste : **102 réussis, 0 échec, 39 ignorés** (configuration, MySQL et serveur local absents). Cette exécution ne valide pas le mode strict ni PHP 8.3.
- `php tests/api/run.php migrations --strict` : **échec attendu du contrôle strict**, six tests ignorés faute de base. Aucun résultat ignoré n'est présenté comme une réussite.
- `php tests/api/run.php deploiement` : **1 réussi, 0 échec, 0 ignoré**. Le test lance réellement le générateur CLI, lui transmet un mot de passe fictif comportant caractères spéciaux et saut de ligne par stdin, contrôle le remplacement des identifiants, la conservation des autres clés, l'absence de sortie et le refus des identifiants vides. Le contrôle POSIX 600 est exécuté sur Linux en CI ; Windows ne représente pas ces permissions.
- `php -l` : fichiers PHP publiés, scripts de déploiement et test ajoutés contrôlés sous PHP 8.4 ; nouvelle qualification 8.3 obligatoire sur le runner.
- `bash -n` : scripts `deploiement/*.sh` et tous les blocs `run` du workflow valides (Git Bash).
- Workflow analysé avec **yaml 2.9.1**, clés uniques contrôlées : YAML valide, jobs `verification` et `deploy`. Analyseur extrait du cache npm dans un dossier temporaire ; aucune dépendance de projet ajoutée.
- `npm run build` standard : échec lié au refus de lecture des répertoires parents par esbuild dans le bac à sable Windows. `npm run build -- --configLoader runner` : **réussi**, service worker et manifeste inclus. Avertissement Vite sur un chunk supérieur à 500 kB, sans changement de découpage.
- Paquet réel `frontend/dist` accepté par `valider-paquet.mjs`, SHA-256 déterministe : `6741f7dd1738a417ad66971a53254f615caa0c23a85ccf91156cb96c97f9c457` (build local ci-dessus, pas une preuve du futur artefact CI).

## Choix et limites

Les actions GitHub réutilisées sont déjà présentes dans le dépôt : checkout, setup-node, setup-php, ssh-agent et upload-artifact. Aucune nouvelle bibliothèque applicative, action ou licence à inscrire dans `licences.md`.

La promotion utilise la liste des déploiements `vision-preprod` filtrée par SHA et leurs statuts, avec pagination et refus sur erreur API : [API des déploiements GitHub](https://docs.github.com/en/rest/deployments/deployments#list-deployments), [API des statuts](https://docs.github.com/en/rest/deployments/statuses#list-deployment-statuses). Un succès historique peut précéder une inactivation. Si GitHub ne restitue plus cette preuve, il faut requalifier en préproduction ; aucune présomption de succès.

Les secrets de migration ne transitent que par stdin SSH ; la configuration temporaire est créée sous umask 077 et chmod 600, hors racine publique. Le trap distant et le nettoyage côté runner couvrent les échecs ordinaires, mais une perte totale de SSH peut laisser des outils à nettoyer. Le retrait de l'IP SSH est en `always()`, y compris après une tentative d'ajout partiellement échouée. La clé SSH est collectée par `ssh-keyscan`, sans vérification indépendante de son empreinte. FTPS reste non atomique et supprime les fichiers absents du paquet. Voir la [procédure et le retour arrière](deploiement-mutualise.md#déploiement-automatisé).

## Réserves et reprise

**Levée le 26/11/2026 par Claude Code** (relecture du travail de Codex) : dans la pile locale `vision-local.ps1 up -Php 8.3` (PHP 8.3.33, MySQL 8.4), `vision-local.ps1 test` donne **141 réussis, 0 échec, 0 ignoré** en mode strict, test `deploiement` compris ; `node --test deploiement/*.test.mjs` : 24 réussis ; `npm test` : 263 réussis ; `npm run build` puis `valider-paquet.mjs` avec le jeton local réel : paquet accepté ; `bash -n` sur les trois scripts shell : sans erreur. Seule correction apportée : le fichier de l'artefact de retour arrière s'appelle `candidat-livre-sha.txt` (il porte le SHA du candidat livré, pas celui de la version sauvegardée). L'exécution sur un runner GitHub reste à constater (vérification de la PR).

**À VÉRIFIER** après publication autorisée : exécution réelle GitHub, prérequis `workflow_dispatch` sur la branche par défaut, accès SSH/cPanel/FTPS depuis les runners, configuration des environnements et secrets, certificat AutoSSL, configuration privée complète, production créée manuellement et restauration réelle. Rien n'a été contrôlé ou modifié à distance par ce lot. Ni push, ni déploiement, ni réglage GitHub, ni connexion au serveur.

Documentation : socle du monorepo présent ; documents Vision existants conservés, métadonnées ajoutées aux documents touchés, commandes et contraintes du workflow reliées à la procédure, preuve rattachée au suivi JSON. Le schéma historique d'architecture reste une cible de cadrage, explicitement distinguée de l'implémentation. La revue porte sur ce périmètre, pas sur toute la documentation du monorepo.

## Commit bloqué par les permissions de la session

`git add` a échoué avant toute modification de l'index : `Unable to create .../.git/worktrees/avereo-vision-deploiement-auto/index.lock: Permission denied`. Le répertoire Git partagé du worktree est accessible en lecture seulement dans cette session ; aucune élévation n'est disponible. Aucun commit ni push effectué. Les changements restent dans l'arbre de travail sur la branche demandée. Reprendre dans une session autorisée à écrire dans les métadonnées Git du worktree, après les vérifications restantes.

Message de commit prévu :

```text
feat(vision): préparer le déploiement automatisé O2Switch

Co-Authored-By: Codex <noreply@openai.com>
```
