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

Préparer le candidat privé de dépendances, conserver son verrou Composer dans Git puis appliquer la réparation autorisée et recetter.

| Phase | État | Prochaine action |
| --- | --- | --- |
| Cadrage | À valider | Examiner la décision et le relevé des domaines. |
| Développement local | À valider | Examiner la PR #76 et le candidat préparé. |
| Préproduction | Bloquée | Préparer le candidat privé de dépendances, conserver son verrou Composer dans Git puis appliquer la réparation autorisée et recetter. |
| Mise en production | Non commencée | Hors périmètre ; aucun merge, déploiement de production ou ouverture demandé. |

## Domaines vérifiés

Racines relevées dans cPanel le 6 octobre 2026, sous `/home/daje3540`.
Contrôles sans identifiants, sans suivi des redirections, sans corps ni cookies.

| Domaine | Racine réelle | HTTPS | HTTP | Observation |
| --- | --- | --- | --- | --- |
| preprod.avereo.fr | `/home/daje3540/preprod.avereo.fr` | 401 | 401 | Basic existant ; challenge aussi sur HTTP, à corriger avant harmonisation. |
| connect-preprod.avereo.fr | `/home/daje3540/connect-preprod.avereo.fr/public` | 401 | 403 | Pilote Basic/HTTPS actif ; refus anonyme/incorrect et HTTP vérifiés. Accès de consultation franchi selon le responsable ; connexion bloquée au fournisseur d’identité, recette métier non réussie. |
| rapport-preprod.avereo.fr | `/home/daje3540/rapport-preprod.avereo.fr` | 303 | 303 | Lancement à ticket CONNECT ; Basic absent, aucun changement encore appliqué. Les refus descendants sont conservés. |
| coupe-preprod.avereo.fr | `/home/daje3540/coupe-preprod.avereo.fr` | 303 | 303 | Lancement à ticket CONNECT ; Basic absent, aucun changement encore appliqué. Les refus descendants sont conservés. |
| projet-preprod.avereo.fr | `/home/daje3540/projet-preprod.avereo.fr` | 303 | 303 | Lancement à ticket CONNECT ; Basic absent, aucun changement encore appliqué. Les refus descendants sont conservés. |
| thermo-preprod.avereo.fr | `/home/daje3540/thermo-preprod.avereo.fr` | 303 | 303 | Lancement à ticket CONNECT ; Basic absent, aucun changement encore appliqué. Les refus descendants sont conservés. |
| drone-preprod.avereo.fr | `/home/daje3540/drone-preprod.avereo.fr` | 303 | 303 | Lancement à ticket CONNECT ; Basic absent, aucun changement encore appliqué. Les refus descendants sont conservés. |
| auth-preprod.avereo.fr | `/home/daje3540/auth-preprod.avereo.fr` | 200 | 200 | Fournisseur identité ; aucune protection Basic indifférenciée avant qualification OAuth. |
| auth-next-preprod.avereo.fr | `/home/daje3540/auth-next-preprod.avereo.fr` | 500 | 500 | HTTP 500 reproduit ; Simple OAuth 6.1.1 chargé avec bibliothèques OIDC/OAuth absentes. Aucun fichier ni compte de ce serveur modifié. |
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
- identity_diagnostic : failed — HTTP 500 reproduit ; erreur d’interface absente dans error_log et absence des deux bibliothèques vendor confirmées.. Diagnostic en lecture seule ; aucun test de réparation exécuté, aucun fichier hébergé modifié.

Les tests Apache locaux sont complétés par les contrôles hébergés enregistrés ci-dessus.
Le parcours CONNECT → Drupal → Rapport → sauvegarde → rechargement reste à recetter.
La protection doit survivre au prochain déploiement ; cette pérennité reste à qualifier.

## Points restant à traiter

- Authentification bloquée sur auth-next-preprod.avereo.fr : HTTP 500, interface OpenID Connect introuvable ; bibliothèques OIDC et OAuth absentes du vendor hébergé.
- Réparation ciblée de l’installation Simple OAuth 6.1.1 à préparer et qualifier avec sauvegarde/retour arrière ; dépôt source du serveur d’identité à identifier avant changement.
- Parcours CONNECT/Drupal/Rapport, sauvegarde/rechargement, second réseau et révocation à recetter après réparation.
- Compatibilité des autres cibles, alias et pérennité au prochain déploiement à qualifier avant généralisation.

## Incident d’authentification

Cible : `auth-next-preprod.avereo.fr`. Drupal renvoie une erreur inattendue pendant /oauth/authorize, avant connexion CONNECT et lancement des applications. HTTP 500 également sur la racine.

HTTP 500 enregistré le 6 octobre à 17:19 UTC, avant l’application du pilote CONNECT à 17:31 UTC.

Erreur du journal : `Interface OpenIDConnectServer\Repositories\IdentityProviderInterface not found` dans `modules/contrib/simple_oauth/src/OpenIdConnect/UserIdentityProvider.php:14`.
Drupal `11.4.6` ; Simple OAuth `6.1.1`.

Installation Simple OAuth incomplète : module présent, bibliothèques PHP qu’il requiert absentes. Le mécanisme d’installation historique n’a pas été établi.

Bibliothèques déclarées par le module et absentes du vendor :

- `steverhoades/oauth2-openid-connect-server` — contrainte `^3.0`.
- `league/oauth2-server` — contrainte `^9.0`.

Préparer la réparation des dépendances Simple OAuth du seul serveur auth-next-preprod, puis refaire la connexion avant de qualifier les applications.

Préserver comptes, configuration privée, base, clés OAuth et contrôles Basic CONNECT. Ne pas installer une mise à jour globale du site ou basculer vers auth-preprod sans qualification.

Réparation des dépendances versionnée dans jpdandin44/AVEREO, outillage/acces-preproduction ; dépôt du reste de l’instance Drupal non identifié, hors de cette réparation.

Diagnostic en lecture seule ; aucune réparation distante effectuée. Les comptes et secrets sont inchangés.

## Source GitHub

[PR #76](https://github.com/jpdandin44/AVEREO/pull/76) — fusionnée, observée le `2026-10-06T17:58:36.522Z`.
SHA source `ecdfc330e2e709082268106e99583640b52fa20d`. Aucune validation de phase créée automatiquement.
Fusion enregistrée par GitHub le `2026-10-06T17:46:04Z` ; commit `3d70b530acc236f36ade6c06a553d3c9f7ed07f1`.
