---
project: avereo-acces-preproduction
document_type: generated-hosted-record
title: Relevé des accès aux préproductions AVEREO
status: active
version: git
created: 2026-10-06
updated: 2026-10-06
owner: jpdandin
tags: [preproduction, exploitation, cockpit, derive]
---

# Relevé hébergé

Vue dérivée du [suivi canonique](suivi-chantier.json). Les observations ne valent
ni validation humaine ni bascule. La préparation initiale est conservée dans
[son archive](archives/preparation-initiale.json).

## État du lot

Confirmer l’accès avec le compte de consultation existant dans un navigateur habituel, puis recetter CONNECT/Drupal/Rapport avant généralisation.

| Phase | État | Prochaine action |
| --- | --- | --- |
| Cadrage | À valider | Examiner la décision et le relevé des domaines. |
| Développement local | À valider | Examiner la PR #76 et le candidat préparé. |
| Préproduction | En cours | Confirmer l’accès avec le compte de consultation existant dans un navigateur habituel, puis recetter CONNECT/Drupal/Rapport avant généralisation. |
| Mise en production | Non commencée | Hors périmètre ; aucun merge, déploiement de production ou ouverture demandé. |

## Domaines vérifiés

Racines relevées dans cPanel le 6 octobre 2026, sous `/home/daje3540`.
Contrôles sans identifiants, sans suivi des redirections, sans corps ni cookies.

| Domaine | Racine réelle | HTTPS | HTTP | Observation |
| --- | --- | --- | --- | --- |
| preprod.avereo.fr | `/home/daje3540/preprod.avereo.fr` | 401 | 401 | Basic existant ; challenge aussi sur HTTP, à corriger avant harmonisation. |
| connect-preprod.avereo.fr | `/home/daje3540/connect-preprod.avereo.fr/public` | 401 | 403 | Bloc IP remplacé par Basic avec le compte existant du site. HTTPS anonyme/incorrect : 401 ; HTTP : 403 sans challenge. Accès avec bons identifiants et recette métier en attente. |
| rapport-preprod.avereo.fr | `/home/daje3540/rapport-preprod.avereo.fr` | 303 | 303 | Lancement à ticket CONNECT ; Basic absent, aucun changement encore appliqué. Les refus descendants sont conservés. |
| coupe-preprod.avereo.fr | `/home/daje3540/coupe-preprod.avereo.fr` | 303 | 303 | Lancement à ticket CONNECT ; Basic absent, aucun changement encore appliqué. Les refus descendants sont conservés. |
| projet-preprod.avereo.fr | `/home/daje3540/projet-preprod.avereo.fr` | 303 | 303 | Lancement à ticket CONNECT ; Basic absent, aucun changement encore appliqué. Les refus descendants sont conservés. |
| thermo-preprod.avereo.fr | `/home/daje3540/thermo-preprod.avereo.fr` | 303 | 303 | Lancement à ticket CONNECT ; Basic absent, aucun changement encore appliqué. Les refus descendants sont conservés. |
| drone-preprod.avereo.fr | `/home/daje3540/drone-preprod.avereo.fr` | 303 | 303 | Lancement à ticket CONNECT ; Basic absent, aucun changement encore appliqué. Les refus descendants sont conservés. |
| auth-preprod.avereo.fr | `/home/daje3540/auth-preprod.avereo.fr` | 200 | 200 | Fournisseur identité ; aucune protection Basic indifférenciée avant qualification OAuth. |
| auth-next-preprod.avereo.fr | `/home/daje3540/auth-next-preprod.avereo.fr` | 500 | 500 | Fournisseur identité ; HTTP 500 observé, diagnostic nécessaire. |
| passeport-immo-preprod.avereo.fr | `/home/daje3540/passeport-immo-preprod.avereo.fr/public` | 403 | 403 | Fermeture initiale explicite Require all denied ; conserver jusqu’à qualification propre. |
| preprod-cv.avereo.fr | `/home/daje3540/cv-preproduction` | 403 | 301 | Préproduction CV fermée ; HTTP redirige vers HTTPS, accès privé à qualifier. |

## Candidat CONNECT et récupération

- Sauvegarde privée : `/home/daje3540/private/preprod-access/20261006T172103911203Z`.
- SHA-256 original : `5ab423f418b30de39ec0a5455a7b325a83a7cfdeaad908586fd99410e3952b7e`.
- SHA-256 candidat : `90c1ab2e443ffeb7efbe6408514abce7ac79d71a5400d881f83a9b768b39d155`.
- Copie de restauration vérifiée octet par octet dans le dossier privé.
- Pilote appliqué le `2026-10-06T17:31:40.100824+00:00` ; empreinte active vérifiée.
- Le seul fichier public modifié est le `.htaccess` de CONNECT préproduction.
- Compte de consultation et fichiers de production inchangés.

## Contrôles et limites

- ci : passed — https://github.com/jpdandin44/AVEREO/actions/runs/37497652175. Archive du candidat initial, 12 tests ; candidat suivant vérifié séparément.
- local : passed — Tests locaux Docker/Apache : 14 tests réussis, aucun saut.. Apache réel et refus HTTP vérifiés localement ; ces tests ne remplacent pas la recette hébergée.
- documentation : passed — 8 documents contrôlés : front matter, liens locaux et socle racine ; git diff --check réussi.. Audit global des autres sous-projets hors périmètre.
- ci : passed — https://github.com/jpdandin44/AVEREO/actions/runs/37502834488. Tests dédiés réussis sur a0aa172 ; CI générale réussie (37502834464), PR Policy ignorée sur brouillon.
- cockpit : passed — http://127.0.0.1:5196/. Moteur Projet raccordé à cette source canonique ; quatre phases, documents accessibles, zéro problème de lecture ; aucune décision créée.
- hosted_protection : passed — Pilote hébergé : HTTPS 401/Basic sans identifiants et avec identifiants incorrects ; HTTP 403 sans challenge. Empreinte active vérifiée dans cPanel après remplacement atomique.. Aucun contrôle avec bon compte ni parcours métier déclaré réussi.

Les tests Apache locaux sont complétés par les contrôles hébergés enregistrés ci-dessus.
Le parcours CONNECT → Drupal → Rapport → sauvegarde → rechargement reste à recetter.
La protection doit survivre au prochain déploiement ; cette pérennité reste à qualifier.

## Points restant à traiter

- Accès avec les bons identifiants à vérifier par le responsable : le navigateur intégré ne propose pas l’invite HTTP Basic (ERR_INVALID_AUTH_CREDENTIALS). Aucun secret demandé dans le chat.
- Parcours CONNECT/Drupal/Rapport, sauvegarde/rechargement, second réseau et révocation à recetter.
- Compatibilité OAuth, alias et pérennité au prochain déploiement à qualifier avant généralisation.

## Source GitHub

[PR #76](https://github.com/jpdandin44/AVEREO/pull/76) — brouillon observé,
SHA `3559d19603750751d3abbf58f6010e2545a8e50e`. Aucun merge ni validation de phase créée automatiquement.
