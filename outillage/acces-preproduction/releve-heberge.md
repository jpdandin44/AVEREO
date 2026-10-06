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

Accord de recette du lot préparé Rapport/Coupe/Projet/Thermo/Drone ; traiter séparément la migration CONNECT et les raccordements Recherche/Passeport. Aucun candidat applicatif installé à ce stade.

| Phase | État | Prochaine action |
| --- | --- | --- |
| Cadrage | À valider | Examiner la décision et le relevé des domaines. |
| Développement local | À valider | Examiner les fichiers, preuves et documentation de la PR #77. |
| Préproduction | En cours | Accord de recette du lot préparé Rapport/Coupe/Projet/Thermo/Drone ; traiter séparément la migration CONNECT et les raccordements Recherche/Passeport. Aucun candidat applicatif installé à ce stade. |
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
- CONNECT : onboarding_status et activation_email_sent_at absents de users ; migration et récupération de la base non préparées. Ne pas remplacer son backend en bloc.
- Recherche : cible, configuration de lancement et entrée catalogue absentes ; dépendance GED à établir.
- Passeport Immo : seule protection de fermeture installée ; frontend et contrat CONNECT absents.
- Coupe : base non configurée, auth_mode drupal_oauth ; ne pas activer MySQL ni inclure la PR #54 ouverte.
- Accord de livraison applicative du candidat préparé non enregistré ; les accords antérieurs couvrent le pilote d’accès et la réparation ciblée.
- Recette métier authentifiée sur les versions effectivement livrées : lancement, stockage lorsqu’il existe, réouverture, exports, déconnexion et révocation.

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

Contrôle du `2026-10-06T20:12:00.235+00:00` ; statut `host_inventory_verified_versions_differ_delivery_pending`.

Référence commune des huit candidats : `3d70b530acc236f36ade6c06a553d3c9f7ed07f1` (`origin/main`).
Ensemble local : `.local/alignement/ensemble-candidats.zip` ; SHA-256 `bd0b8e40ba55982a04e876b6753112a2d356c528d840fa62ad9b9c5283c79d75`.
[Inventaire des fichiers, builds et observations HTTP](archives/alignement-applications.json).
Les archives sont des candidats locaux. Aucune application n’a été remplacée par ces archives et aucune recette authentifiée n’est déclarée réussie.

| Application | Contrôles locaux | HTTPS / HTTP anonymes | Version et état hébergés |
| --- | --- | --- | --- |
| connect | 37 tests du backend, pont Drupal et six contrats de lancement réussis. | 401 / 403 | Sept fichiers de code diffèrent de main (normalisation LF) ; douze correspondent, dont l’émetteur de tickets. Base préproduction distincte ; migration onboarding_status/activation_email_sent_at absente. |
| rapport | 55 tests et build avec synchronisation en ligne activée. | 303 / 303 | Ancien bundle du 3 août confirmé, sans Visite Globale ; index, sas et déconnexion diffèrent du candidat. Base distincte et colonnes rapport_reports présentes ; restauration privée des fichiers réussie. |
| coupe | Build et sas PHP réussis ; contrat avec le vrai émetteur CONNECT réussi. | 303 / 303 | Index, interface historique, règle auth, sas et API diffèrent du candidat. Base non configurée, auth_mode drupal_oauth ; lancement dédié cohérent. PR #54 exclue. Restauration privée des fichiers réussie. |
| projet | 144 tests, planning cohérent et build ; 12 fichiers, aucune donnée/API de revue locale dans la livraison. | 303 / 303 | Index et interface historique diffèrent du candidat, bundle différent ; sas identique à main. Configuration préprod et secret de lancement cohérents ; restauration privée des fichiers réussie. |
| thermo | Build et contrat réel CONNECT réussis ; pas de suite métier dédiée dans le package. | 303 / 303 | Index et bundle différents du candidat ; sas identique à main. Configuration préprod et secret de lancement cohérents ; restauration privée des fichiers réussie. |
| drone | Build et contrat réel CONNECT réussis ; pas de suite métier dédiée dans le package. | 303 / 303 | Index et bundle différents du candidat ; sas identique à main. Configuration préprod et secret de lancement cohérents ; restauration privée des fichiers réussie. |
| recherche | 23 tests, build et contrat réel CONNECT réussis. | Indisponible / Indisponible | Domaine de recette non déclaré dans cPanel et non résolu ; configuration de lancement et entrée catalogue absentes. |
| passeport-immo | 14 tests, build, parité source et six tests de préparation fermée réussis. | 403 / 403 | Cible fermée : seul public/.htaccess est installé, sans frontend. Aucune entrée catalogue ni lancement CONNECT. Sauvegarde/restauration de cette fermeture vérifiée. |

Deux choix de création Rapport : Expertise & Visite technique, Visite Globale (Habitologie).
Les anciens types restent lisibles ; aucune donnée de rapport hébergée n’a été modifiée.

### Corrections et qualifications par cible

[Inventaire hébergé, comparaison et reçus de récupération](archives/audit-applications-hebergees.json).
Sept cibles existantes sauvegardées ; copies restaurées en privé vérifiées le `2026-10-06T20:10:27.126+00:00`. Fichiers seulement : aucune récupération de base n’est attestée.
Dossier privé : `/home/daje3540/private/preprod-alignment/recovery-20261006T201027126442Z`.
Les empreintes frontend différentes établissent un écart d’artefact ; seule la version Rapport possède aussi une preuve fonctionnelle des anciens choix.

**Lot de recette préparé** : rapport, coupe, projet, thermo, drone.
Référence `3d70b530acc236f36ade6c06a553d3c9f7ed07f1` ; archive `.local/alignement/lot-recette-cinq-applications.zip` ; SHA-256 `e7302748033c3708b971f66dc8f35882ec08869732227c7ad7db037f0ccab324`.
Le plan exact figure dans le reçu. Configuration privée, habilitations et données conservées ; aucune migration SQL prévue. La règle auth de Coupe rejoint le portail, son sas historique restant protégé.
Ce lot attend son accord de préproduction. CONNECT, Recherche et Passeport Immo ont des prérequis distincts et sont exclus du remplacement préparé.

CI des outils sur `af17cb371469e503d6964dab391a4fffb1b8b1ca` : [27 tests sans saut](https://github.com/jpdandin44/AVEREO/actions/runs/37520544589) et [CI générale](https://github.com/jpdandin44/AVEREO/actions/runs/37520544556) réussis.
Ces runs valident les sources ; ils ne produisent pas les archives locales et ne prouvent pas le contenu hébergé. PR Policy reste ignorée sur le brouillon.

- **connect** : Préparer la migration requise et la sauvegarde/restauration de sa base distincte ; recetter le pont d’activation avant de remplacer le code. Conserver Basic.
- **rapport** : Promouvoir le candidat exact à deux types dans le lot de recette après accord applicable ; vérifier empreintes, lancement, sauvegarde/réouverture et exports.
- **coupe** : Promouvoir uniquement le candidat main, sans PR #54, activation MySQL ou modification du mode privé ; vérifier legacy-app et redirection auth, puis fonctionnement métier.
- **projet** : Promouvoir le candidat préparé après accord de recette ; conserver données/règles privées et cockpit local hors artefact ; vérifier le parcours métier.
- **thermo** : Promouvoir le candidat préparé après accord de recette, puis vérifier lancement, fonctions métier et sortie du portail.
- **drone** : Promouvoir le candidat préparé après accord de recette, puis vérifier lancement, fonctions métier et sortie du portail.
- **recherche** : Préparer séparément une cible isolée, son raccordement au catalogue, sa configuration de lancement et la dépendance GED ; aucune habilitation créée.
- **passeport-immo** : Conserver la fermeture ; préparer son installation et un contrat de lancement CONNECT séparé avant toute ouverture.

### Dépendances et limites

- Réparation technique ciblée appliquée et accès confirmé par le responsable ; dépôt de l’instance complète encore inconnu.
- Configurations dédiées et cinq paires de secrets de lancement cohérentes. CONNECT et Rapport ont une base distincte ; Coupe ne configure pas de base. Parcours réel, droits et replis restent à recetter.
- Le healthcheck Coupe appelle api_ensure_schema lorsque la base est configurée. Il n’a pas été sollicité pour cet audit en lecture seule.

Le contrôle de passage multi-applications reste bloqué :

- CONNECT : onboarding_status et activation_email_sent_at absents de users ; migration et récupération de la base non préparées. Ne pas remplacer son backend en bloc.
- Recherche : cible, configuration de lancement et entrée catalogue absentes ; dépendance GED à établir.
- Passeport Immo : seule protection de fermeture installée ; frontend et contrat CONNECT absents.
- Coupe : base non configurée, auth_mode drupal_oauth ; ne pas activer MySQL ni inclure la PR #54 ouverte.
- Accord de livraison applicative du candidat préparé non enregistré ; les accords antérieurs couvrent le pilote d’accès et la réparation ciblée.
- Recette métier authentifiée sur les versions effectivement livrées : lancement, stockage lorsqu’il existe, réouverture, exports, déconnexion et révocation.

Les décisions historiques du pilote et de la réparation d’identité conservent leur portée.
Les candidats applicatifs ne possèdent encore aucun accord de remplacement enregistré. Les reçus de fichiers qualifient les cibles existantes, sans couvrir les bases ni une recette authentifiée.
Les workflows de production restent manuels ; le merge et l’ouverture publique sont des décisions distinctes.

## Source GitHub

[PR #77](https://github.com/jpdandin44/AVEREO/pull/77) — brouillon, observée le `2026-10-06T18:35:38.000Z`.
SHA source `9db26fd5afa63abc861b190f6b2dccf5cbf4f0f5`. Aucune validation de phase créée automatiquement.
