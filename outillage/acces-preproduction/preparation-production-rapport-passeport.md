---
project: avereo
document_type: production-preparation
title: Mise en production de Rapport et suite de Passeport Immo
status: active
version: git
created: 2026-10-16
updated: 2026-10-16
owner: jpdandin
tags: [rapport, passeport-immo, production, cockpit]
---

# Mise en production de Rapport et suite de Passeport Immo

## Clôture du 16 octobre — suite prête à reprendre

La description de #23 est publiée dans le chat « Finaliser la préproduction OAuth ».
Sa tête `0f246525…` est conservée pour la revue. Le complément documentaire Drupal
de cette clôture reste dans un **commit local** de `codex/cloture-core-20261016` ;
le réconcilier à la reprise après vérification de GitHub. La PR #86 a été fusionnée ; un complément documentaire sur
`docs/closure-production-20261016` conserve le dossier actualisé et les [preuves des fusions](archives/preparation-production-rapport-passeport-20261016/drupal-integration-github.json).

Les PR Drupal #24 puis #25 sont fusionnées humainement dans Core #23. La
[preuve de clôture](archives/preparation-production-rapport-passeport-20261016/cloture-integration-drupal.json)
conserve les révisions et contrôles observés. #23 passe ses quatre contrôles
techniques, audit Composer inclus, sans conflit avec `main`. La description de
#23 est actualisée ; les anciennes cases humaines sont archivées et les nouvelles
attestations restent au responsable selon la règle du dépôt. Sa fusion dans
`main` reste à faire. #85 et #86 sont aussi fusionnées humainement à 20:16:37 et 20:19:32 UTC.
Les [preuves](archives/preparation-production-rapport-passeport-20261016/fusions-preparation-applications.json)
conservent leurs quatre attestations. Ces merges acceptent leurs dossiers, sans
livrer Rapport ni accomplir la recette finale Passeport.

Les accords conditionnels Drupal déjà reçus couvrent les quatre correctifs de
sécurité en lots séparés et les trois routes OAuth du site, après qualification
et récupération fraîche. Les [preuves d’accords](https://github.com/jpdandin44/avereo-site-drupal/blob/0f246525cb5b16a71b47fdf1cf865d6265d58549/data/securite-contrib-qualification.json)
et le [périmètre OAuth](https://github.com/jpdandin44/avereo-site-drupal/blob/0f246525cb5b16a71b47fdf1cf865d6265d58549/data/recette-oauth-maintenance-site.json)
restent acquis pour la même cible, la même version et les mêmes effets. L’accord
de livraison Rapport reste distinct et absent ; aucune ouverture publique autorisée.

Reprise uniquement sur demande du responsable :

1. Repartir des suivis et vérifier GitHub : #23 vers `main`, puis l’intégration acquise de #85/#86 dans `main`.
2. Dans le lot Drupal coordonné, recontrôler la production et les accès ; qualifier
   une sauvegarde fraîche restaurée et le retour arrière de chaque lot séparé
   Easy Breadcrumb, Leaflet, Core, Gin, puis OAuth. Préserver maintenance, clés,
   comptes et données. Les anciennes preuves de préproduction ne remplacent pas
   cette qualification de production.
3. Après livraison Drupal autorisée et contrôlée, vérifier la nouvelle connexion
   CONNECT et ses refus. Terminer le parcours Passeport avec `dandin`, la carte,
   le dossier SCI, six documents actifs et trois archives, puis la déconnexion.
   Conserver l’activation D06, l’import SCI et le cron existants.
4. Pour Rapport, qualifier sauvegarde fichiers/modes/configuration et base,
   restauration, promotion des cinq opérations du ZIP exact et retour arrière.
   Obtenir son accord précis, puis livrer et recetter les deux types de rapport.
5. Présenter les résultats réels à la revue humaine. La livraison, la recette
   finale et une éventuelle ouverture restent des décisions distinctes.

Copie Drupal courante :
`C:\Users\examg\Documents local\avereo-drupal-preparation-production`.
Copie du dossier de production (branche `docs/closure-production-20261016`) :
`C:\Users\examg\Documents local\avereo-preprod-rapport-passeport`.
Source locale vivante :
`C:\Users\examg\OneDrive\Documents\AVEREO_2\preprod-acces-local`.
Les modifications non commitées de l’ancienne copie Core et le guide/cockpit
local du chat « App Passeport Immo » sont préservés. Aucune opération hébergée,
fermeture de navigateur, déconnexion ou arrêt de service n’est revendiqué durant
cette clôture. Les observations hébergées plus bas restent datées ; la dernière
sonde OAuth de production enregistrée est celle de 15:27:57 UTC, toujours 503.

Ce dossier répond à la demande de préparer la suite après fusion des PR
[#83](https://github.com/jpdandin44/AVEREO/pull/83) et
[#84](https://github.com/jpdandin44/AVEREO/pull/84). Les deux fusions et les quatre
attestations humaines de chaque PR ont été relues sur GitHub. La revue de cette
préparation, en phase **3 Mise en production**, se fait en **préproduction** ;
les contrôles après livraison concernent la production réelle.

La [PR #86](https://github.com/jpdandin44/AVEREO/pull/86) porte ce dossier commun
et la préparation Rapport. Elle complète la
[PR #85](https://github.com/jpdandin44/AVEREO/pull/85), consacrée aux contrôles
Passeport Immo et à la proposition OAuth, sans reprendre ses modifications.

Le [suivi canonique](suivi-chantier.json), bloc
`selected_applications_delivery.productionPreparation`, porte la suite commune
et les références. Le [suivi Passeport Immo](../../architecture-v1/avereo-app-passeport-immo/docs/suivi-chantier.json)
conserve ses décisions humaines, notamment D06. Aucun événement de validation,
accord de livraison Rapport ou ouverture publique n'est créé par ce dossier.

## Cadrage

| Application | État de production observé le 16 octobre | Prochaine action |
| --- | --- | --- |
| Rapport | Ancienne interface encore installée ; base de production sans rapport au relevé de 12 h 58, heure de Paris | Résoudre la dépendance OAuth, qualifier sauvegarde et retour arrière, obtenir l'accord exact de livraison |
| Passeport Immo | Activation privée à 12 h 44 ; seize fichiers du candidat conformes ; première sauvegarde automatique vérifiée à 12 h 45 | Achever le parcours CONNECT/OAuth et la revue humaine ; conserver l'installation et la reprise SCI existantes |

La confirmation du compte **famille** reste limitée à la **préproduction**.
Le relevé de production confirme pour Passeport Immo l'accès du compte interne 1,
le refus de l'autre compte existant et les rôles inchangés. Aucune nouvelle
habilitation n'est demandée ou appliquée dans cette préparation.

Les [observations datées](archives/preparation-production-rapport-passeport-20261016/observation.json)
séparent les contrôles indépendants de cette intervention des résultats du lot
Passeport Immo mené dans sa propre copie de travail. Les anciens reçus de la PR #83
décrivant une installation fermée restent des preuves historiques ; ils ne sont
pas une raison de rejouer l'activation ni l'import SCI.

## Développement local

Les archives privées ont été réempreintées et leurs sources exécutables comparées
à `main` après fusion, commit `0fd533200d3044582d72003aa47eed1582a6dec4`.
Aucune différence dans les répertoires frontend, backend et database des deux
applications. Il n'y a ni nouvelle fonctionnalité, ni reconstruction du candidat.

| Candidat | Archive SHA-256 | Source applicative de référence |
| --- | --- | --- |
| Rapport | `6f1016bd44ce56204e2d174a927ec25c6dd5e5f9437afa337d66c704ac1b9366` | `3d70b530acc236f36ade6c06a553d3c9f7ed07f1` |
| Passeport Immo | `c44f397fd03daa433f19e6d4c72127f29e55dbf9fca679e8c7f41cc207a843cf` | `7209bf3334a5f3f98d422b41d177c734970a0750`, candidat D06 |

Le [manifeste de candidature](archives/livraison-rapport-passeport-20261016/candidats-production.json)
conserve aussi la révision `d95164e…` observée lors de la préparation du 16 octobre :
son exécutable Passeport est identique au candidat D06. Ces révisions documentaires
différentes ne désignent pas des versions applicatives différentes.

Les quinze documents approuvés de Passeport Immo sont identiques aux empreintes
conservées dans Git et dans la copie canonique. Dans cette nouvelle copie Windows,
le checkout convertit leurs fins de ligne en CRLF ; la vérification des octets Git
et des octets LF approuvés distingue ce changement de représentation d'un changement
de contenu. Ces fichiers et leurs empreintes de validation ne sont pas modifiés.
Le [contrôle documentaire actualisé](archives/preparation-production-rapport-passeport-20261016/follow-up-documentation-checks.json)
conserve le périmètre des vérifications de cette reprise.

La CI générale et les tests d'accès préproduction de `main` réussissent. Le workflow
distinct [Deploy Prototype To GitHub Pages](https://github.com/jpdandin44/AVEREO/actions/runs/38889877487)
échoue à `Setup Pages` avec `Not Found`. Ce workflow ne livre aucune des deux cibles
o2switch. Son utilité et sa configuration restent à traiter dans son lot propre.

## Préproduction

La [recette du candidat](livraison-rapport-passeport.md) conserve les preuves et
limites de la PR #84 : **Expertise & Visite technique** et **Visite Globale**,
sauvegarde/relecture, aperçus et exports Rapport ; données SCI conservées pour
Passeport Immo. Les attestations humaines cochées de la PR #84 sont conservées
dans le reçu de fusion. Elles ne sont pas transformées en autorisation de
livraison de Rapport en production.

Points d'entrée de revue :

- [CONNECT préproduction](https://connect-preprod.avereo.fr/).
- [Rapport préproduction](https://rapport-preprod.avereo.fr/).
- [Passeport Immo préproduction](https://passeport-immo-preprod.avereo.fr/).

Les limites précédentes restent explicites : pas de nouvelle qualification des
services géographiques, photos, dictée, rendu natif Microsoft Word ou second réseau.
Les deux rapports `RECETTE FICTIVE` restent en préproduction et ne font pas partie
du contenu initial à transférer en production.

## Mise en production

### Dépendance commune : connexion OAuth

Le contrôle indépendant du 16 octobre vers 13 h 08, heure de Paris, confirme une
réponse **503** à un POST vide, sans identifiant, sur `https://avereo.fr/oauth/token`.
La page de connexion Drupal répond 200 ; ce résultat ne qualifie pas l'échange OAuth.
Les racines des deux applications redirigent en 303 et leurs entrées CONNECT sans
ticket refusent en 403, avec vérification TLS stricte.

Le compte rendu local du lot Passeport Immo rapporte un échange authentifié rejeté
par `OAUTH_UPSTREAM_REJECTED`, puis la préparation d'un correctif limité aux trois
routes OAuth du site Drupal en maintenance. Il rapporte également 57 contrôles HTTPS
applicatifs réussis ; ces contrôles ne prouvent pas une connexion OAuth complète.
La provenance et l'empreinte de ce compte rendu sont enregistrées dans l'observation.
Initialement local, il est désormais publié dans la
[PR #85](https://github.com/jpdandin44/AVEREO/pull/85) ; le document publié est
strictement identique à celui consulté. Le présent lot ne modifie ni le site Drupal ni sa
maintenance. L’état initial de ce relevé est désormais complété par l’actualisation Drupal
ci-dessous ; les constats de production gardent leur date et leur périmètre.

### Actualisation du correctif Drupal

La [PR Drupal #22](https://github.com/jpdandin44/avereo-site-drupal/pull/22)
porte le correctif commun. Core 11.4.10 et Symfony corrigé sont installés sur
`auth-next-preprod.avereo.fr` après accord de sécurité ; l’audit est sans alerte.
Les deux fichiers OAuth y sont livrés à 15 h 18 UTC, avec sauvegarde fraîche restaurée,
retour arrière privé, 394 routes comparées et contrôles HTTPS réussis. Les 76 assertions
passent ; les contrôles de maintenance valident un jeton synthétique autorisé et
les refus. Ces données de test restent dans la copie privée et sont annulées.

Le [nouveau relevé de livraison](archives/preparation-production-rapport-passeport-20261016/oauth-preproduction-delivery.json)
renvoie aux reçus Drupal. L’ancien relevé de blocage est conservé comme historique.
Le responsable confirme ensuite dans Chrome une **nouvelle connexion CONNECT et
l’accès aux deux applications**. La [preuve humaine](https://github.com/jpdandin44/avereo-site-drupal/blob/8cd0d2a393e5f4172466fdab3ec442a1c43b3ebc/data/oauth-maintenance/qualification/human-access-confirmation.json)
lève la réserve de ce parcours d’accès en préproduction. Le blocage du navigateur
intégré reste historique. La déclaration ne vaut ni recette métier exhaustive,
ni revue GitHub, ni accord de livraison ou d’ouverture de production.

Gin est livré séparément et suivi dans la [PR Drupal #24](https://github.com/jpdandin44/avereo-site-drupal/pull/24).
Le chat « App Passeport Immo » porte les preuves et livraisons du site dans la
[PR Drupal #25](https://github.com/jpdandin44/avereo-site-drupal/pull/25), avec ses
accords propres. Cette PR suit la sauvegarde/restauration des clés OAuth externes,
la livraison et les contrôles du site actif. Ses reçus font foi pour cette cible.
L’identité et le site de préproduction restent deux cibles.

Le [relevé de fusion et de livraison du site](archives/preparation-production-rapport-passeport-20261016/oauth-merge-site-follow-up.json)
confirme la fusion humaine de #22 à **16 h 36 min 25 s UTC** dans **Gin #24**,
pas dans `main` : quatre attestations cochées, policy stricte réussie et candidat
inchangé. Le site a reçu ses quatre lots de sécurité et OAuth, avec audit final
sans alerte, 887 routes comparées et 23 assertions de rendu natif.
La revue GitHub des lots #24/#25 est acquise par leurs merges humains ; les limites
de la preuve visuelle restent explicites. Claro reste sélectionné, Gin installé
mais non activé. Le suivi courant se poursuit sur Core #23 après ces fusions.
L’audit de #23 réussit ; sa fusion humaine vers `main` reste à faire.
Le dernier contrôle de production, à 15 h 27 UTC dans le relevé de livraison OAuth,
reste 503 ; aucune nouvelle sonde de production n’est exécutée dans cette actualisation.
La suite de production reste une livraison Drupal autorisée selon son dossier, puis les prérequis
propres à Rapport et la recette finale Passeport. L’activation D06, la reprise SCI
et le cron existants ne sont pas rejoués.

### Rapport : plan exact de livraison

Cible confirmée dans cPanel : `https://rapport.avereo.fr/`, racine
`/home/daje3540/rapport.avereo.fr`. L'ancien dossier `public_html/rapport` appartient
à une autre entrée de domaine et est exclu. La configuration privée existante utilise
`connect_gateway`, le portail CONNECT de production et une clé déjà présente.

Le [plan détaillé des opérations](archives/preparation-production-rapport-passeport-20261016/operations-rapport.json)
est calculé depuis le manifeste candidat et l'inventaire réel :

| Action prévue | Fichiers |
| --- | --- |
| Remplacer | `connect/gate.php`, `connect/logout.php`, `index.html` |
| Ajouter | `assets/index-CKpXCVG6.js`, `assets/index-BnYLeEcL.css` |
| Conserver | Les neuf autres fichiers du manifeste, les anciens assets, les chemins non prévus et les configurations privées |

La comparaison LF identifie uniquement les fichiers existants à conserver.
Les cinq écritures prévues doivent utiliser les **octets exacts du ZIP**, avec
publication d'`index.html` en dernier. Les fichiers créés ou remplacés doivent
recevoir le mode 0644. Plusieurs fichiers historiques sont actuellement en 0666 :
leur correction éventuelle doit être qualifiée et ajoutée au plan avant livraison,
sans élargissement silencieux des écritures.

Séquence à exécuter après satisfaction des prérequis :

1. Relire cible, configuration, catalogue, état SQL et empreintes ; arrêter à la
   moindre divergence avec l'inventaire. Les zéro rapports observés ne garantissent
   pas que la base sera encore vide au moment de la livraison.
2. Sauvegarder hors web les fichiers/modes, la configuration privée et la base de
   production. Restaurer dans un dossier distinct et des tables temporaires ou une
   base isolée ; comparer fichiers, DDL et lignes. Conserver un reçu sans secret.
3. Répéter les cinq opérations et leur retour arrière sur cette copie. Vérifier
   l'intégrité du ZIP, l'absence d'écriture hors cible et la conservation du reste.
4. Obtenir l'accord humain exact pour `rapport.avereo.fr` et l'archive `6f1016bd…`.
   Confirmer que le parcours OAuth/CONNECT fonctionne avant la livraison.
5. Appliquer uniquement les opérations qualifiées, avec contrôle préalable des
   empreintes et remplacement atomique. Conserver anciens assets, données, brouillons
   utilisateur, clés, comptes et habilitations. Aucune migration ni import de
   rapports fictifs de préproduction n'est prévu.
6. Vérifier la version servie, le lancement CONNECT, les deux types, la sauvegarde
   et la reprise d'un rapport de recette clairement identifié, les exports et la
   déconnexion. Définir avec le responsable la conservation de ces données de
   recette ; aucune suppression automatique. Consigner les contrôles puis demander
   la revue humaine de fin de phase.

En cas d'échec, restaurer les trois fichiers remplacés avec leurs modes sauvegardés,
et retirer uniquement les deux ajouts encore identiques aux empreintes publiées.
Une modification concurrente impose un arrêt sans écrasement. Conserver la base et
les configurations ; une restauration de données après de nouvelles écritures
demande un plan spécifique, pas un retour arrière aveugle.

**Exécution encore non qualifiée :** le helper de la PR #84 est réservé à la
préproduction. Le workflow manuel `deploy-rapport-o2switch.yml` reconstruit un ZIP
et ne démontre pas la promotion de cette archive exacte ; sa sauvegarde de fichiers
ne prouve pas une restauration de la base. Le présent dossier prépare le plan,
sans adapter ni déclencher ces outils. Les reçus de sauvegarde/restauration et de
retour arrière de production restent à produire.

### Passeport Immo : terminer la qualification de l'installation existante

Le reçu serveur atteste une activation privée à **10:44:23 UTC** et le relevé
indépendant retrouve les **seize fichiers exacts** du candidat approuvé, stockage
web actif. La sauvegarde déclenchée par cron à **10:45:02 UTC** couvre quatre tables
et neuf documents, relecture et restauration temporaire réussies sans changement
des lignes actives. Le retrait de l'entrée temporaire est attesté à **10:45:51 UTC**
et confirmé dans le crontab réel.

La cadence est quotidienne à **03 h 20 Europe/Paris**, avec rattrapage horaire et
rétention de trente copies vérifiées. Une copie est présente lors du relevé. Il
s'agit d'un premier déclenchement réel après activation, pas encore de l'observation
d'une nuit complète. Les copies restent sur le même hébergement ; copie distante et
alertes ne sont pas qualifiées.

Ne pas rejouer l'activation, la reprise SCI ou l'installation du cron. Après
résolution OAuth, vérifier la connexion habituelle de `dandin`, la carte CONNECT,
le dossier SCI et ses six documents actifs/trois archives, le refus des comptes
non habilités et la déconnexion. Conserver D06 et laisser la revue finale au
responsable. Le plan CIL reste une itération suivante proposée.

### Résultat des contrôles de passage

Les [résultats du contrôleur commun](archives/preparation-production-rapport-passeport-20261016/gates.json)
sont volontairement conservés en échec : Rapport attend son accord de production,
sa récupération et son retour arrière, avec le blocage OAuth ; la clôture Passeport
attend la recette complète après résolution du même blocage. Une fusion de PR ne
lève pas ces conditions. Aucune production applicative n'a été modifiée par cette
préparation et aucune décision humaine n'a été ajoutée au cockpit.

Les [vérifications documentaires locales](archives/preparation-production-rapport-passeport-20261016/local-checks.json)
couvrent les documents de ce lot, leurs liens de fichiers, les trois socles
documentaires, les références approuvées et la génération du relevé. Elles ne
constituent pas une nouvelle recette applicative de production.
