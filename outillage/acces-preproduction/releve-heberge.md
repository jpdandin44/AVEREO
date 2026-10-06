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

Terminer la comparaison cPanel des huit applications avec les candidats issus de la même référence ; préparer sauvegardes/restauration et recette avant remplacement. Recherche et Passeport Immo restent à qualifier séparément.

| Phase | État | Prochaine action |
| --- | --- | --- |
| Cadrage | À valider | Examiner la décision et le relevé des domaines. |
| Développement local | À valider | Examiner les fichiers, preuves et documentation de la PR #77. |
| Préproduction | En cours | Terminer la comparaison cPanel des huit applications avec les candidats issus de la même référence ; préparer sauvegardes/restauration et recette avant remplacement. Recherche et Passeport Immo restent à qualifier séparément. |
| Mise en production | Non commencée | Hors périmètre ; aucun merge, déploiement de production ou ouverture demandé. |

## Accès pour la recette

- Application à tester : [CONNECT préproduction](https://connect-preprod.avereo.fr/). Démarrer une nouvelle connexion depuis cette adresse.
- Fournisseur d’identité concerné : [AVEREO Identité préproduction](https://auth-next-preprod.avereo.fr/user/login). Le parcours CONNECT y redirige automatiquement.
- Suivi du chantier : [Cockpit local du chantier](http://127.0.0.1:5196/). Il affiche les phases et les preuves ; il ne teste pas la connexion applicative.
- Tests locaux du correctif : [procédure de validation](README.md#validation-locale). Aucune interface locale du fournisseur d’identité n’est fournie.

Contrôle du lien le `2026-10-06T18:58:08.585+00:00` :

Lien de la première case cliqué depuis la PR #77 : destination CONNECT préproduction confirmée. Contrôle HTTPS indépendant : 401 avec challenge Basic attendu. Le navigateur intégré bloque à l’authentification avec ERR_INVALID_AUTH_CREDENTIALS ; le parcours après connexion n’est pas vérifié par ce contrôle.

## Domaines vérifiés

Racines relevées dans cPanel le 6 octobre 2026, sous `/home/daje3540`.
Contrôles sans identifiants, sans suivi des redirections, sans corps ni cookies.

| Domaine | Racine réelle | HTTPS | HTTP | Observation |
| --- | --- | --- | --- | --- |
| preprod.avereo.fr | `/home/daje3540/preprod.avereo.fr` | 401 | 401 | Basic existant ; challenge aussi sur HTTP, à corriger avant harmonisation. |
| connect-preprod.avereo.fr | `/home/daje3540/connect-preprod.avereo.fr/public` | 401 | 403 | Pilote Basic/HTTPS actif ; refus anonyme/incorrect et HTTP vérifiés. Accès de consultation franchi selon le responsable ; écran OAuth accessible, connexion authentifiée et recette métier à faire. |
| rapport-preprod.avereo.fr | `/home/daje3540/rapport-preprod.avereo.fr` | 303 | 303 | Lancement à ticket CONNECT ; Basic absent, aucun changement encore appliqué. Les refus descendants sont conservés. |
| coupe-preprod.avereo.fr | `/home/daje3540/coupe-preprod.avereo.fr` | 303 | 303 | Lancement à ticket CONNECT ; Basic absent, aucun changement encore appliqué. Les refus descendants sont conservés. |
| projet-preprod.avereo.fr | `/home/daje3540/projet-preprod.avereo.fr` | 303 | 303 | Lancement à ticket CONNECT ; Basic absent, aucun changement encore appliqué. Les refus descendants sont conservés. |
| thermo-preprod.avereo.fr | `/home/daje3540/thermo-preprod.avereo.fr` | 303 | 303 | Lancement à ticket CONNECT ; Basic absent, aucun changement encore appliqué. Les refus descendants sont conservés. |
| drone-preprod.avereo.fr | `/home/daje3540/drone-preprod.avereo.fr` | 303 | 303 | Lancement à ticket CONNECT ; Basic absent, aucun changement encore appliqué. Les refus descendants sont conservés. |
| auth-preprod.avereo.fr | `/home/daje3540/auth-preprod.avereo.fr` | 200 | 200 | Fournisseur identité ; aucune protection Basic indifférenciée avant qualification OAuth. |
| auth-next-preprod.avereo.fr | `/home/daje3540/auth-next-preprod.avereo.fr` | 200 | Non retesté | Dépendances manquantes réparées ; racine HTTPS 200 et écran OAuth accessible. |
| passeport-immo-preprod.avereo.fr | `/home/daje3540/passeport-immo-preprod.avereo.fr/public` | 403 | 403 | Fermeture initiale explicite Require all denied ; conserver jusqu’à qualification propre. |
| preprod-cv.avereo.fr | `/home/daje3540/cv-preproduction` | 403 | 301 | Préproduction CV fermée ; HTTP redirige vers HTTPS, accès privé à qualifier. |

## Candidat CONNECT et récupération

- Sauvegarde privée : `/home/daje3540/private/preprod-access/20261006T172103911203Z`.
- SHA-256 original : `5ab423f418b30de39ec0a5455a7b325a83a7cfdeaad908586fd99410e3952b7e`.
- SHA-256 candidat : `90c1ab2e443ffeb7efbe6408514abce7ac79d71a5400d881f83a9b768b39d155`.
- Copie de restauration vérifiée octet par octet dans le dossier privé.
- Pilote appliqué le `2026-10-06T17:31:40.100824+00:00` ; empreinte active vérifiée.
- Sur CONNECT, le seul fichier public modifié est le `.htaccess` de préproduction.
- Compte de consultation et fichiers de production inchangés.

## Contrôles et limites

- ci le `2026-10-06T17:19:21.381+00:00` : passed — https://github.com/jpdandin44/AVEREO/actions/runs/37497652175. Archive du candidat initial, 12 tests ; candidat suivant vérifié séparément.
- local le `2026-10-06T17:21:39.061+00:00` : passed — Tests locaux Docker/Apache : 14 tests réussis, aucun saut.. Apache réel et refus HTTP vérifiés localement ; ces tests ne remplacent pas la recette hébergée.
- documentation le `2026-10-06T17:21:39.061+00:00` : passed — 8 documents contrôlés : front matter, liens locaux et socle racine ; git diff --check réussi.. Audit global des autres sous-projets hors périmètre.
- ci le `2026-10-06T17:24:20.080+00:00` : passed — https://github.com/jpdandin44/AVEREO/actions/runs/37502834488. Tests dédiés réussis sur a0aa172 ; CI générale réussie (37502834464), PR Policy ignorée sur brouillon.
- cockpit le `2026-10-06T17:24:20.080+00:00` : passed — http://127.0.0.1:5196/. Moteur Projet raccordé à cette source canonique ; quatre phases, documents accessibles, zéro problème de lecture ; aucune décision créée.
- hosted_protection le `2026-10-06T17:33:13.331+00:00` : passed — Pilote hébergé : HTTPS 401/Basic sans identifiants et avec identifiants incorrects ; HTTP 403 sans challenge. Empreinte active vérifiée dans cPanel après remplacement atomique.. Aucun contrôle avec bon compte ni parcours métier déclaré réussi.
- identity_diagnostic le `2026-10-06T17:59:31.987+00:00` : failed — HTTP 500 reproduit ; erreur d’interface absente dans error_log et absence des deux bibliothèques vendor confirmées.. Diagnostic en lecture seule ; aucun test de réparation exécuté, aucun fichier hébergé modifié.
- identity_technical_acceptance le `2026-10-06T18:33:00.022890+00:00` : passed — /home/daje3540/private/identity-repair/20261006T182856355876Z/acceptance.json. Recette technique réussie : racine identité 200, OAuth anonyme 302 vers /user/login puis écran 200 ; CONNECT HTTPS anonyme/incorrect 401 Basic, HTTP 403 sans challenge ; Rapport 303 vers sa porte CONNECT. Aucun nouvel octet dans error_log pendant ces contrôles. Connexion avec le compte du responsable et parcours métier non vérifiés.

Les tests Apache locaux sont complétés par les contrôles hébergés enregistrés ci-dessus.
Le parcours CONNECT → Drupal → Rapport → sauvegarde → rechargement reste à recetter.
La protection doit survivre au prochain déploiement ; cette pérennité reste à qualifier.

## Points restant à traiter

- Connexion avec le compte du responsable, lancement Rapport, sauvegarde/rechargement, second réseau et révocation à recetter.
- Compatibilité des autres cibles, alias et pérennité au prochain déploiement à qualifier avant généralisation.
- Dépôt source du reste de l’instance d’identité à identifier avant une évolution plus large ; contrat de réparation conservé dans ce monorepo.
- Lecture cPanel interrompue : empreintes, racines réelles, configurations privées, catalogue actif et versions SQL de toutes les applications non qualifiés.
- Recherche : adresse attendue non résolue ; cible réelle et dépendance GED à établir.
- Passeport Immo : préproduction fermée ; aucun lancement CONNECT implémenté dans la référence retenue.
- Coupe : PR #54 ouverte ; changements hors de main à examiner séparément avant inclusion.
- Sauvegarde et restauration de chaque cible applicative non préparées ; aucun remplacement autorisable sur cette seule preuve locale.
- Parcours métier authentifiés, stockage, retour au portail et droits/revocation à recetter sur les versions effectivement livrées.

## Incident d’authentification

Diagnostic initial du `2026-10-06T17:59:31.987+00:00` sur `auth-next-preprod.avereo.fr`. Drupal renvoie une erreur inattendue pendant /oauth/authorize, avant connexion CONNECT et lancement des applications. HTTP 500 également sur la racine.

HTTP 500 enregistré le 6 octobre à 17:19 UTC, avant l’application du pilote CONNECT à 17:31 UTC.

Erreur du journal : `Interface OpenIDConnectServer\Repositories\IdentityProviderInterface not found` dans `modules/contrib/simple_oauth/src/OpenIdConnect/UserIdentityProvider.php:14`.
Drupal `11.4.6` ; Simple OAuth `6.1.1`.

Installation Simple OAuth incomplète : module présent, bibliothèques PHP qu’il requiert absentes. Le mécanisme d’installation historique n’a pas été établi.

Bibliothèques déclarées par le module et absentes du vendor lors du diagnostic initial :

- `steverhoades/oauth2-openid-connect-server` — contrainte `^3.0`.
- `league/oauth2-server` — contrainte `^9.0`.

Incident technique réparé ; recetter la connexion du responsable, le lancement des applications et le retour CONNECT avant généralisation.

Préserver comptes, configuration privée, base, clés OAuth et contrôles Basic CONNECT. Ne pas installer une mise à jour globale du site ou basculer vers auth-preprod sans qualification.

Réparation des dépendances versionnée dans jpdandin44/AVEREO, outillage/acces-preproduction ; dépôt du reste de l’instance Drupal non identifié, hors de cette réparation.

Diagnostic initial en lecture seule ; réparation distante enregistrée ci-dessous.
Les comptes et secrets sont inchangés.

## Réparation du fournisseur d’identité

Statut : `applied_technical_acceptance_passed`. Cible : `/home/daje3540/auth-next-preprod.avereo.fr`.

[Contrat Composer natif](identite/README.md) ; [script ciblé](repair_identity.py).

Candidat préparé le `2026-10-06T18:29:28.770515+00:00`.
Empreinte de l’artefact : `5cb737238ce549d20b8e660837f99941947c0bb0e08910f9f4b513c71929ce39`.
Sauvegarde privée : `/home/daje3540/private/identity-repair/20261006T182856355876Z` ; copie de restauration vérifiée.

Packages ajoutés (les packages préexistants restent inchangés) :

- `defuse/php-encryption` — `v2.4.0`.
- `lcobucci/jwt` — `5.6.0`.
- `league/event` — `3.0.3`.
- `league/oauth2-server` — `9.4.1`.
- `league/uri` — `7.8.1`.
- `league/uri-interfaces` — `7.8.1`.
- `paragonie/random_compat` — `v9.99.100`.
- `psr/clock` — `1.0.0`.
- `psr/http-server-handler` — `1.0.2`.
- `psr/http-server-middleware` — `1.0.2`.
- `steverhoades/oauth2-openid-connect-server` — `v3.0.1`.

Appliqué le `2026-10-06T18:31:21.138040+00:00` ; empreinte active identique au candidat.

Recette technique réussie : racine identité 200, OAuth anonyme 302 vers /user/login puis écran 200 ; CONNECT HTTPS anonyme/incorrect 401 Basic, HTTP 403 sans challenge ; Rapport 303 vers sa porte CONNECT. Aucun nouvel octet dans error_log pendant ces contrôles. Connexion avec le compte du responsable et parcours métier non vérifiés.

## Version Rapport en préproduction

Diagnostic du `2026-10-06T19:04:57.261+00:00` : `ancienne_version_hebergee`.

Le responsable confirme que l’accès fonctionne désormais, puis signale que Rapport ne présente pas la nouvelle version limitée à Expertise et Habitologie. Cette confirmation ne vaut pas validation complète des sauvegardes, exports, droits ou autres applications.

CONNECT vise le bon sous-domaine Rapport préproduction. Son index hébergé date du 3 août et charge un ancien bundle sans Visite Globale ; l’empreinte relevée sur le serveur correspond au fichier servi en HTTPS. Le catalogue courant de main propose exactement Expertise & Visite technique et Visite Globale (parcours Habitologie), déjà intégrés via la PR #61 fusionnée le 14 septembre. La réparation de connexion n’a pas livré cette version de Rapport.

- Lancement configuré : `https://rapport-preprod.avereo.fr/connect/entry.php`.
- Bundle hébergé : `https://rapport-preprod.avereo.fr/assets/index-C7slbMpC.js`.
- SHA-256 hébergé : `786a6d8c32bfc26c0b2d16f24a634ba774107c12d30d2a3a445305e0f9705360`.
- Catalogue de `main` : blob Git `72344607c1f67f1b5feb1e35fc195e22f09e8cd8`.
- Évolution intégrée : [PR #61](https://github.com/jpdandin44/AVEREO/pull/61) ; fusion le `2026-09-14T19:56:55Z`.

Préparer et qualifier le build courant de Rapport pour ce seul sous-domaine, préserver le sas CONNECT, la configuration privée et les données, puis effectuer sa livraison de préproduction avec sauvegarde et recette. Aucun déploiement supplémentaire effectué lors de ce diagnostic.

## Alignement des applications

Contrôle du `2026-10-06T19:35:06.261+00:00` ; statut `local_candidates_verified_hosted_alignment_not_qualified`.

Référence commune des huit candidats : `3d70b530acc236f36ade6c06a553d3c9f7ed07f1` (`origin/main`).
Ensemble local : `.local/alignement/ensemble-candidats.zip` ; SHA-256 `bd0b8e40ba55982a04e876b6753112a2d356c528d840fa62ad9b9c5283c79d75`.
[Inventaire des fichiers, builds et observations HTTP](archives/alignement-applications.json).
Les archives sont des candidats locaux. Aucune application n’a été remplacée par ces archives et aucune recette authentifiée n’est déclarée réussie.

| Application | Contrôles locaux | HTTPS / HTTP anonymes | Version et état hébergés |
| --- | --- | --- | --- |
| connect | 37 tests du backend, pont Drupal et six contrats de lancement réussis. | 401 / 403 | Version du code hébergé à comparer ; couche HTTPS 401 Basic et HTTP 403 vérifiée. |
| rapport | 55 tests et build avec synchronisation en ligne activée. | 303 / 303 | Ancien bundle confirmé lors du diagnostic précédent ; nouvelle version non livrée. |
| coupe | Build et sas PHP réussis ; contrat avec le vrai émetteur CONNECT réussi. | 303 / 303 | Version hébergée à comparer ; PR #54 encore ouverte, exclue du candidat main. |
| projet | 144 tests, planning cohérent et build ; 12 fichiers, aucune donnée/API de revue locale dans la livraison. | 303 / 303 | Version hébergée à comparer ; entrée sans ticket refusée. |
| thermo | Build et contrat réel CONNECT réussis ; pas de suite métier dédiée dans le package. | 303 / 303 | Version hébergée à comparer ; entrée sans ticket refusée. |
| drone | Build et contrat réel CONNECT réussis ; pas de suite métier dédiée dans le package. | 303 / 303 | Version hébergée à comparer ; entrée sans ticket refusée. |
| recherche | 23 tests, build et contrat réel CONNECT réussis. | Indisponible / Indisponible | Adresse de recette attendue non résolue depuis ce poste ; déclaration cPanel non vérifiée. |
| passeport-immo | 14 tests, build, parité source et six tests de préparation fermée réussis. | 403 / 403 | Préproduction fermée : HTTPS et HTTP 403 ; pas de contrat de lancement dans CONNECT courant. |

Deux choix de création Rapport : Expertise & Visite technique, Visite Globale (Habitologie).
Les anciens types restent lisibles ; aucune donnée de rapport hébergée n’a été modifiée.

### Corrections et qualifications par cible

- **connect** : Conserver la surcouche Basic active ; qualifier configuration privée et versions SQL avant tout remplacement.
- **rapport** : Livrer le candidat à deux types après inventaire, sauvegarde/restauration et accord applicable ; recetter sauvegarde et réouverture.
- **coupe** : Comparer au candidat main et examiner séparément la PR #54 avant de retenir ses évolutions ; qualifier le stockage existant sans nouvelle activation.
- **projet** : Comparer l’interface métier au candidat ; conserver le cockpit local hors de l’artefact hébergé.
- **thermo** : Comparer au candidat et recetter le métier avec données fictives autorisées.
- **drone** : Comparer au candidat et recetter le métier avec données fictives autorisées.
- **recherche** : Identifier une cible de recette réelle et vérifier GED, catalogue et configuration privée ; aucune cible créée ni habilitation accordée.
- **passeport-immo** : Conserver la fermeture ; qualifier son candidat et définir séparément l’intégration CONNECT avant toute ouverture.

### Dépendances et limites

- Réparation technique ciblée appliquée et accès confirmé par le responsable ; dépôt de l’instance complète encore inconnu.
- Les chargeurs applicatifs peuvent utiliser le repli de configuration sans suffixe préproduction ; une configuration dédiée et la séparation des bases doivent être constatées.
- Le healthcheck Coupe appelle api_ensure_schema lorsque la base est configurée. Il n’a pas été sollicité pour cet audit en lecture seule.

Le contrôle de passage multi-applications reste bloqué :

- Lecture cPanel interrompue : empreintes, racines réelles, configurations privées, catalogue actif et versions SQL de toutes les applications non qualifiés.
- Recherche : adresse attendue non résolue ; cible réelle et dépendance GED à établir.
- Passeport Immo : préproduction fermée ; aucun lancement CONNECT implémenté dans la référence retenue.
- Coupe : PR #54 ouverte ; changements hors de main à examiner séparément avant inclusion.
- Sauvegarde et restauration de chaque cible applicative non préparées ; aucun remplacement autorisable sur cette seule preuve locale.
- Parcours métier authentifiés, stockage, retour au portail et droits/revocation à recetter sur les versions effectivement livrées.

Les décisions historiques du pilote et de la réparation d’identité conservent leur portée.
Les candidats applicatifs ne possèdent encore ni accord de remplacement enregistré ni sauvegarde/restauration qualifiée.
Les workflows de production restent manuels ; le merge et l’ouverture publique sont des décisions distinctes.

## Source GitHub

[PR #77](https://github.com/jpdandin44/AVEREO/pull/77) — brouillon, observée le `2026-10-06T18:35:38.000Z`.
SHA source `9db26fd5afa63abc861b190f6b2dccf5cbf4f0f5`. Aucune validation de phase créée automatiquement.
