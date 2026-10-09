---
project: avereo-acces-preproduction
document_type: session-handoff
title: Point de reprise — alignement des applications en préproduction
status: active
version: git
created: 2026-10-06
updated: 2026-10-09
owner: jpdandin
tags: [preproduction, reprise, applications, cockpit]
---

# Point de reprise

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
