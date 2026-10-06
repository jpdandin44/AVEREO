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

Confirmer la bascule du seul pilote CONNECT avec le compte existant du site ; appliquer puis recetter avant généralisation.

| Phase | État | Prochaine action |
| --- | --- | --- |
| Cadrage | À valider | Examiner la décision et le relevé des domaines. |
| Développement local | À valider | Examiner la PR #76 et le candidat préparé. |
| Préproduction | À valider | Confirmer le pilote CONNECT puis contrôler les accès et le parcours applicatif. |
| Mise en production | Non commencée | Hors périmètre ; aucun merge, déploiement de production ou ouverture demandé. |

## Domaines vérifiés

Racines relevées dans cPanel le 6 octobre 2026, sous `/home/daje3540`.
Contrôles sans identifiants, sans suivi des redirections, sans corps ni cookies.

| Domaine | Racine réelle | HTTPS | HTTP | Observation |
| --- | --- | --- | --- | --- |
| preprod.avereo.fr | `/home/daje3540/preprod.avereo.fr` | 401 | 401 | Basic existant ; challenge aussi sur HTTP, à corriger avant harmonisation. |
| connect-preprod.avereo.fr | `/home/daje3540/connect-preprod.avereo.fr/public` | 403 | 403 | Restriction IP observée dans public/.htaccess ; candidat ciblé en préparation. |
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

TBD — reçu de préparation privée à enregistrer avant bascule.

## Contrôles et limites

- ci : passed — https://github.com/jpdandin44/AVEREO/actions/runs/37497652175. Candidat initial, 12 tests ; nouveau candidat à contrôler.
- local : passed — Tests locaux Docker/Apache : 14 tests réussis, aucun saut.. Apache réel, refus HTTP sans challenge Basic ; la compatibilité TLS hébergée reste à recetter.
- documentation : passed — 8 documents contrôlés : front matter, liens locaux et socle racine ; git diff --check réussi.. Audit global des autres sous-projets hors périmètre.

Les tests Apache locaux ne prouvent pas la compatibilité du TLS hébergé.
Le parcours CONNECT → Drupal → Rapport → sauvegarde → rechargement reste à recetter.
La protection doit survivre au prochain déploiement ; cette pérennité reste à qualifier.

## Points restant à traiter

- Confirmation au moment du remplacement de la restriction IP par Basic sur CONNECT.
- Recette avec les identifiants de consultation et parcours CONNECT/Drupal/Rapport à effectuer.
- Compatibilité et pérennité des autres cibles à qualifier avant généralisation.

## Source GitHub

[PR #76](https://github.com/jpdandin44/AVEREO/pull/76) — brouillon observé,
SHA `121a0d0d576bdea39a423fc5fc981aadfe1cb502`. Aucun merge ni accord humain créé.
