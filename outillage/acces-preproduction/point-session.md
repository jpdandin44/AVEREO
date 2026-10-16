---
project: avereo-acces-preproduction
document_type: session-handoff
title: Point de reprise — alignement des applications en préproduction
status: active
version: git
created: 2026-10-06
updated: 2026-10-16
owner: jpdandin
tags: [preproduction, reprise, applications, cockpit]
---

# Point de reprise

## Suite courante après fusion des PR #83 et #84

Les deux fusions et leurs attestations humaines sont vérifiées. Le [dossier de
production](preparation-production-rapport-passeport.md) et le bloc canonique
`selected_applications_delivery.productionPreparation` portent la suite : Rapport
attend la qualification de sa récupération/retour arrière et son accord exact de
livraison ; Passeport Immo est déjà activé avec un premier cron vérifié. Le point
OAuth de production répond 503 ; le correctif du fournisseur d'identité relève du
lot Drupal. Ne pas rejouer activation, reprise SCI ou installation du cron.

La copie de travail Passeport Immo est actualisée par son lot distinct ; ses travaux
locaux et ceux de Projet sont préservés. Les états plus anciens ci-dessous sont
historiques pour ce périmètre. Aucune validation de phase ni livraison Rapport
n'est effectuée dans cette préparation.

## Actualisation ciblée du 16 octobre — Rapport et Passeport Immo

Rapport est livré avec ses deux types ; Passeport Immo possède déjà le candidat courant et ses seize fichiers sont vérifiés sans réécriture. La [livraison et la recette](livraison-rapport-passeport.md) rassemblent les preuves, la levée de la réserve sur les accès du compte famille après confirmation humaine et les candidates exactes. Le bloc `selected_applications_delivery` du [suivi](suivi-chantier.json) fait référence pour ce périmètre. Les constats antérieurs ci-dessous restent historiques lorsqu’ils décrivent Rapport ancien ou Passeport Immo absent. Aucune livraison de production dans ce lot.


## Préparation CONNECT et vérification Passeport Immo — 14 octobre 2026

La demande porte sur la préparation du backend CONNECT préproduction, sa
sauvegarde de base et la migration d’activation, puis les prérequis de Passeport
Immo. Le nouveau lot est sur `codex/connect-preprod-activation-20261014` ; le lot
des cinq applications et ses accords restent distincts. La PR #77 est fusionnée,
et `main` observée contient aussi la fusion #78 de Passeport Immo.

La [procédure](preparer-connect-activation.md) décrit le candidat, les contrôles,
la sauvegarde privée et la restauration sur une base de test distincte, puis le
passage après accord exact. Le [suivi canonique](suivi-chantier.json), bloc
`connect_activation_preparation`, porte les preuves et blocages courants.
Le helper de sauvegarde ne possède aucune action de migration ni de déploiement.
Le navigateur intégré est ouvert pour la connexion du responsable ; aucun
identifiant, cookie ou jeton n’est enregistré dans ce relais.

Les contrôles publics du jour reçoivent 401 Basic sur CONNECT et 403 sur
Passeport Immo. Après connexion du responsable et démarrage de Docker, la
répétition locale complète passe. Les 37 tests du backend, le pont Drupal et les
six tests du nouveau préparateur passent. Les six tests Apache ne sont pas
exécutés sur ce poste ; la CI complète réussit sur la révision publiée indiquée ci-dessous.

Le [reçu réel du serveur](archives/connect-activation-preparation-20261014.json)
identifie une base CONNECT distincte de production, quatre migrations et trois
comptes. Le dump privé est créé et restauré dans une nouvelle base de test vide.
Les DDL et toutes les lignes sont identiques. Le candidat stagé est ensuite migré
sur ce clone seulement : quatre `SKIP`, un `UP`, puis cinq `SKIP`. Les anciens
champs et statuts des comptes sont conservés, sans envoi de mail ; la base source
reste inchangée. Les 33 fichiers existants et leurs modes sont sauvegardés et
restaurés en privé, ainsi que la configuration dédiée protégée.

Répertoire privé :
`/home/daje3540/private/connect-preprod-recovery/preparation-20261014T163531Z`.
La base `daje3540_connrest_20261014` conserve la répétition ; aucun nouveau compte
ou secret MySQL n’est créé. Le dump et les valeurs de configuration ne sont pas
exportés. Seul le reçu technique sans valeurs de secrets est archivé dans Git.

Le fournisseur `auth-next-preprod` ne possède pas le contrôleur et le formulaire
d’activation ; son module et ses routes diffèrent. Les variables d’activation
CONNECT sont absentes. Le ZIP de huit fichiers du pont est préparé depuis la même
source ; récupération du fournisseur, configuration partagée, transport de recette
et accords exacts restent à qualifier avant livraison. Le backend actif n’est ni
remplacé ni migré par cette préparation.

Dans le clone Passeport Immo, la préparation par défaut désignait encore l’ancien
prototype. Le candidat documentaire canonique de #78 a été retrouvé dans son
archive CI, vérifié et préparé séparément dans
`.local/preproduction-preparation/documents-20261014/`. Ses sept assets sont
conservés ; fermeture initiale, relecture et restauration locale des fichiers
passent. Onze tests Python, parité et contrat du cockpit passent. Le suivi vivant
contient l’approbation D05 du lot documents/coupes ; elle reste préservée.
Le sas, le catalogue et les paramètres privés CONNECT de Passeport Immo restent
des prérequis absents. Sa préparation de fichiers ne les implémente pas.

Prochaine action : terminer les prérequis du pont d’activation, préparer les accords exacts de mise à jour des deux cibles.
Pour Passeport Immo, réaliser ensuite le sas/catalogue et la qualification privée.
Les accords de phase, d’installation et d’ouverture restent distincts.

### Publication et contrôle de passage

La [PR nº79](https://github.com/jpdandin44/AVEREO/pull/79) est ouverte en brouillon,
avec quatre cases humaines décochées. La CI générale, la CI Passeport Immo et le
workflow d’accès réussissent sur `edcfac3`, dont le job de sauvegarde/restauration
et migration. Les sources runtime/SQL/pont sont identiques à celles du candidat ;
les observations de CI sont séparées de sa qualification hébergée et des accords.
Le contrôleur de passage reste en refus pour les blocages d’activation, la cible
non prête et l’accord exact absent. La récupération CONNECT restaurée est reconnue.

## Reprise active du 9 octobre 2026

Le responsable a demandé la reprise, donné accès à sa session cPanel et demandé
une revue dans Claude. Le dépôt de travail et le checkout de construction restent
ceux indiqués ci-dessous. La PR #77 est toujours ouverte en brouillon ; `main`
reste à la référence `3d70b530acc236f36ade6c06a553d3c9f7ed07f1`, la PR #54 ouverte.

Les archives originales, les huit cibles et les sept sauvegardes/restaurations
privées de fichiers/modes ont été revérifiées. Les racines actives sont inchangées.
Le [reçu du 9 octobre](archives/reprise-applications-20261009.json) conserve les
observations réelles, les conclusions de revue vérifiées et le nouveau plan exact.
Le [suivi canonique](suivi-chantier.json) identifie son archive et son empreinte.

Le lot corrigé est conservé dans `.local/alignement-reprise/`, à côté de l'ancien
lot conservé dans `.local/alignement/`. Les cinq ZIP applicatifs restent identiques,
mais le plan change : conserver le `.htaccess` hébergé des **cinq** cibles pour
préserver le retour OAuth de Coupe ; conserver les fichiers identiques après
normalisation LF ; contrôler tous les états avant écriture et distinguer création,
remplacement et conservation. Le retour arrière restaure les anciens fichiers et
modes, retire seulement les ajouts encore identiques au candidat et refuse toute
dérive. Aucun fichier applicatif actif n'a été remplacé.

Prochaine action : accord de préproduction sur ce lot corrigé, puis livraison
gardée par ses empreintes et recette réelle des cinq applications. Les deux choix
Rapport attendus restent « Expertise & Visite technique » et
« Visite Globale (Habitologie) ». CONNECT, Recherche et Passeport restent des
travaux distincts avec les prérequis décrits ci-dessous. Ni validation humaine
de phase, ni accord de merge, ni mise en production ne sont ajoutés à la reprise.

## Historique — clôture du 6 octobre 2026

Session arrêtée à la demande du responsable. Le lot de cinq applications est
préparé, **sans déploiement applicatif effectué et sans accord reçu sur ce nouveau
lot**. La fin de session ne vaut pas accord. Aucun merge, changement de production
ou validation humaine de phase n'a été réalisé.

Ce document sert de relais de reprise. Le [suivi canonique](suivi-chantier.json)
conserve les décisions et preuves ; le [relevé hébergé](releve-heberge.md) en est
la vue dérivée. Les constats ci-dessous sont datés du 6 octobre et doivent être
actualisés avant toute action distante. Le processus reste celui du
[protocole commun](../protocole-developpement/skills/developpement-github-cockpit/references/protocole.md) :
Cadrage, Développement local, Préproduction et Mise en production.

## Sources à rouvrir

- Dépôt du lot : `C:\Users\examg\OneDrive\Documents\AVEREO_2\preprod-acces-local`.
- Branche : `codex/diagnostic-auth-preprod-20261006` ; dernier commit technique
  vérifié avant cette clôture : `c1aa440b2876c54885cfd626fcc28016b406ad76`.
- [PR #77](https://github.com/jpdandin44/AVEREO/pull/77), ouverte en brouillon,
  « fix(preprod): fiabiliser CONNECT et qualifier les applications ».
- Checkout de construction à conserver :
  `C:\Users\examg\OneDrive\Documents\AVEREO_2\preprod-alignement-source`,
  référence `3d70b530acc236f36ade6c06a553d3c9f7ed07f1` de `main`.
- [Reçu des candidats et contrôles locaux](archives/alignement-applications.json)
  et [audit réel des applications hébergées](archives/audit-applications-hebergees.json).
  Le second contient aussi le plan exact de livraison et les reçus de récupération.

Les clones `connect-rapport-local` et `passeport-immo-local` appartiennent à d'autres
lots. Conserver les deux checkouts ci-dessus et leurs fichiers locaux ignorés par
Git ; les archives candidates ne sont pas récupérables depuis la seule PR.

## Constats à conserver

Le lien de Rapport depuis CONNECT atteint la bonne préproduction. Elle sert encore
l'ancien bundle à quatre catégories. La nouvelle source propose seulement
« Expertise & Visite technique » et « Visite Globale (Habitologie) » ; la lecture
des anciennes données reste préservée. Corriger l'écart de version par une livraison
qualifiée, puis contrôler le parcours réel.

L'audit serveur couvre huit applications. Les fichiers construits de Rapport,
Coupe, Projet, Thermo et Drone diffèrent des candidats préparés. Cette différence
prouve un écart d'artefact ; seule l'ancienne interface Rapport a été identifiée
fonctionnellement dans ce diagnostic. Les racines, configurations dédiées, liens
de lancement et règles d'accès des cinq cibles existantes figurent dans le reçu.

Trois applications restent hors de ce lot :

- **CONNECT** : sept fichiers de code diffèrent de la référence. La base ne possède
  ni la migration `20260804140000_account_activation_status`, ni les colonnes
  `onboarding_status` et `activation_email_sent_at` requises par le nouveau code.
  Préparer et qualifier séparément la sauvegarde de base, la migration et le
  contrat d'activation avant de remplacer le backend.
- **Recherche** : cible cPanel, configuration privée et entrée de catalogue absentes ;
  adresse non résolue pendant le contrôle. Qualifier ces prérequis avant livraison.
- **Passeport Immo** : seul le fichier de fermeture `.htaccess` est installé ;
  frontend et contrat CONNECT non installés. Conserver l'accès fermé et reprendre
  le lot dédié avant toute ouverture.

La [PR Coupe #54](https://github.com/jpdandin44/AVEREO/pull/54) reste ouverte et
n'est pas incluse dans le candidat commun de `main`. La configuration hébergée de
Coupe reste `drupal_oauth`, sans base configurée ; ne pas activer implicitement un
nouveau stockage ou une migration.

Le pilote de protection CONNECT et la réparation du fournisseur d'identité ont
déjà été autorisés et appliqués. Le responsable a ensuite confirmé que l'accès
fonctionne. Préserver les protections, sauvegardes et accords historiques ; ils ne
constituent pas un accord sur les cinq nouvelles versions. Le dépôt source complet
du fournisseur d'identité reste TBD. Le parcours métier complet reste à recetter.

## Lot préparé, accord en attente

Le périmètre proposé comprend **Rapport, Coupe, Projet, Thermo et Drone**.
Dans le dépôt du lot, l'archive locale est :

`outillage/acces-preproduction/.local/alignement/lot-recette-cinq-applications.zip`

SHA-256 : `e7302748033c3708b971f66dc8f35882ec08869732227c7ad7db037f0ccab324`.

Son plan est aussi conservé dans
`outillage/acces-preproduction/.local/alignement/plan-livraison-recette.json` ;
la copie de référence figure dans `delivery_plan` du reçu d'audit versionné.
Les configurations privées, données et droits actuels sont conservés. Les règles
d'accès restent celles du plan : `.htaccess` hébergé conservé pour quatre cibles,
règle `/auth` de Coupe alors prévue avec la redirection préparée. **Ce plan a été
supplanté lors de la reprise du 9 octobre et n'a jamais été appliqué.** Aucun backend CONNECT,
SQL, accès Recherche ou ouverture Passeport n'est inclus.

La demande d'accord sur cette cible, cette référence et cette archive est restée
sans réponse avant la clôture. Dans `application_alignment.delivery_batch_workflow`,
`approvals` est vide et le contrôle refuse le passage avec
« Accord humain exact absent : preproduction. ». Conserver ce refus jusqu'à un
accord explicite correspondant au lot exact.

Sept sauvegardes et restaurations privées de **fichiers et modes** ont été vérifiées
sans modifier les racines actives. Elles sont conservées sur le serveur dans :

`/home/daje3540/private/preprod-alignment/recovery-20261006T201027126442Z`

Ces reçus ne couvrent aucune sauvegarde/restauration de base ou de configuration
privée. Ils ne permettent pas de qualifier une migration CONNECT.

## Vérifications déjà réalisées

Sept frontends ont été construits depuis la même référence ; les suites existantes,
les contrôles de fermeture Passeport et les contrats de lancement CONNECT vers six
sas ont été vérifiés. Les archives et manifestes exacts sont conservés localement.
Les observations HTTP anonymes et l'inventaire serveur sont dans les reçus datés.
La qualification métier avec le compte du responsable n'est pas remplacée par ces
contrôles.

Sur le commit technique `c1aa440`, les workflows
[CI](https://github.com/jpdandin44/AVEREO/actions/runs/37526511382) et
[Accès préproduction](https://github.com/jpdandin44/AVEREO/actions/runs/37526511388)
ont réussi ; ce dernier a exécuté 27 tests sans test sauté. PR Policy est ignoré
pendant le brouillon, sans approbation humaine créée. Les archives locales ne sont
pas des artefacts produits par ces runs CI.

## Ordre de reprise

1. Lire ce relais, le suivi canonique et le plan versionné ; vérifier la branche,
   les modifications locales, la tête et le statut réel des PR #77/#54 et de `main`.
2. Vérifier à nouveau les empreintes des archives, la disponibilité des sauvegardes
   et l'état des cinq cibles. Une session cPanel ancienne ne garantit pas l'accès
   au prochain redémarrage ; utiliser une nouvelle session autorisée si nécessaire.
3. Obtenir l'accord explicite sur le lot exact, ou vérifier un accord correspondant
   reçu depuis cette clôture. Toute dérive de référence, archive, cible ou effet
   impose de requalifier le candidat et la portée de l'accord.
4. Après accord, suivre le plan : installer les cinq candidats, vérifier les
   empreintes et les règles d'accès, puis recetter les deux choix Rapport et les
   parcours des autres applications. Restaurer les fichiers si un contrôle échoue.
5. Enregistrer les preuves réelles dans le suivi et régénérer le relevé. Conserver
   la recette métier du responsable : connexion, lancement, sauvegarde/rechargement,
   export, déconnexion et révocation. Traiter séparément les trois applications
   bloquées ; aucune mise en production n'est incluse dans cette reprise.

L'agent doit vérifier lui-même les versions et contrôles techniques ; le responsable
intervient pour les accords et la recette métier, sans refaire l'inventaire technique.
