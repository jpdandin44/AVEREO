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

Ce dossier répond à la demande de préparer la suite après fusion des PR
[#83](https://github.com/jpdandin44/AVEREO/pull/83) et
[#84](https://github.com/jpdandin44/AVEREO/pull/84). Les deux fusions et les quatre
attestations humaines de chaque PR ont été relues sur GitHub. La revue de cette
préparation, en phase **3 Mise en production**, se fait en **préproduction** ;
les contrôles après livraison concernent la production réelle.

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
La provenance, l'empreinte et le statut local non publié de ce compte rendu sont
enregistrés dans l'observation. Le présent lot ne modifie ni le site Drupal ni sa
maintenance. L'intégration, la qualification et l'autorisation de son correctif
restent à effectuer dans le dépôt et le suivi du site.

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
