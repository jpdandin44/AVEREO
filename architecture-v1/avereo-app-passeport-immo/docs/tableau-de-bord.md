---
project: avereo-app-passeport-immo
document_type: tableau-de-bord
title: AVEREO – Passeport Immo
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [suivi, passeport-immo, genere]
---

# AVEREO – Passeport Immo

Vue générée depuis `suivi-chantier.json`. Ne pas modifier manuellement.
La revue et les décisions se font dans [Projet local](http://127.0.0.1:5193/).

<!-- BEGIN GENERATED: suivi-chantier.json -->
Mise à jour : **2026-10-03**. **0 phase livrée sur 6 ; 0 phase validée par le responsable.**

| Phase | Statut | Livrables | Livraison | Validation humaine |
|---|---|---|---|---|
| 0 — Reprise et état des lieux | En cours | [iteration-developpement.md](iteration-developpement.md)<br>[00-etat-des-lieux.md](00-etat-des-lieux.md)<br>[source-audit.md](source-audit.md) | — | Non acquise |
| 1 — Reprise à l’identique | Non commencée | [01-reprise-identique.md](01-reprise-identique.md)<br>[iteration-developpement.md](iteration-developpement.md) | — | Non acquise |
| 2 — Intégration CONNECT | Non commencée | `02-integration-connect.md` (prévu) | — | Non acquise |
| 3 — Préproduction | Non commencée | `03-preproduction.md` (prévu)<br>`deployment.md` (prévu) | — | Non acquise |
| 4 — Mise en production | Non commencée | `04-mise-en-production.md` (prévu) | — | Non acquise |
| 5 — Spécification du passeport client | Non commencée | `05-specification-passeport.md` (prévu) | — | Non acquise |

### Décisions attendues

Aucune décision en attente.

### Décisions enregistrées

| ID | Décision | Date | Référence de preuve |
|---|---|---|---|

### Questions de vérification

| ID | Question | Impact | Prochaine action |
|---|---|---|---|
| Q01 | Comment traiter le partage d’URL sans données du bien ? | Un autre poste ne reçoit pas le dossier. | Décider le partage sécurisé dans un lot ultérieur. |
| Q02 | Conserver ou remplacer les accès et abonnement simulés derrière CONNECT ? | Aucune authentification ni facturation réelle dans le prototype. | Décision de phase 2. |
| Q03 | Quel sort réserver au frontend historique CONNECT ? | Deux sources de code après reprise. | Décision de phase 2 ; historique inchangé. |
| Q04 | Accepter les limites du calcul : h/ml à zéro, groupement PDF par nom de pièce ? | Certaines estimations peuvent être nulles ou fusionnées. | Recetter les cas limites puis autoriser un correctif distinct. |
| Q05 | Validation humaine du rendu, import CSV, PDF et usage mobile ? | Checklist de test local cochée humainement dans la PR nº71 ; résultats détaillés R01…R13 et téléphone réel non consignés. | Remplir le tableau R dans le livrable local. |
| Q07 | Les captures tiers confirment-elles les mêmes anomalies dans cette V1 ? | Les versions et parcours diffèrent ; les captures ne sont pas une preuve runtime. | Examiner les captures en recette ; conserver les références neutres. |
| Q08 | Faut-il corriger le placement conditionnel des hooks de la fenêtre bien ? | Placement conditionnel conservé ; aucune erreur reproduite sur création et édition locales, couverture de parcours limitée. | Recetter les autres parcours avant un éventuel correctif distinct. |
<!-- END GENERATED: suivi-chantier.json -->

## Où en est le développement ?

Travail actuel : **Préproduction — Bloquée**.
Reconnecter le compte principal cPanel, puis préparer un dossier dédié fermé aux visiteurs et créer passeport-immo-preprod.avereo.fr vers ce dossier. Qualifier ensuite DNS/HTTPS, accès privé et récupération avant tout déploiement du candidat.

Reprise demandée par le responsable dans AVEREO_2 le 2026-10-03T19:26:15+02:00.

Parcours formel : **phase 0 — Reprise et état des lieux**, en cours.
Validation formelle restant à consigner : phase 0, phase 1. Les constats GitHub et les contrôles locaux ne remplacent pas les décisions de phase.


Adresse demandée : `https://passeport-immo-preprod.avereo.fr`. Le responsable retient le compte du domaine parent, avec un dossier dédié protégé. La lune gratuite `sc4daje3540` est active, distincte de cette cible. Création du sous-domaine, dossier et accès privé restent à qualifier.


## Itération GitHub et cockpit

**passeport-immo-2026-10-03** — Qualifier et préparer la préproduction privée du prototype Passeport Immo après fusion du lot local et de son suivi.

Responsable : jpdandin. Étape : preproduction. État : Bloquée.

Ces étapes techniques complètent les phases formelles du chantier ; une fusion GitHub ne modifie pas leurs décisions.

| Étape | État | Prochaine action |
|---|---|---|
| Local | Validée | Source fusionnée après checklist GitHub humaine ; conserver les limites de recette non documentées. |
| Préproduction | Bloquée | Reconnecter le compte principal cPanel, puis préparer un dossier dédié fermé aux visiteurs et créer passeport-immo-preprod.avereo.fr vers ce dossier. Qualifier ensuite DNS/HTTPS, accès privé et récupération avant tout déploiement du candidat. |
| Production | Bloquée | Attendre recette réelle préproduction, acceptation humaine et récupération qualifiée. |

### Candidat et GitHub

- SHA source : `f076a9b1644ae9c0620aa77df8531773c8cb00af`.
- SHA-256 de l'archive : `84b4d07bb966bd674a98576c1fb3a9564e87cade118a01700f257091c099ceab`.
- PR : [Ouvrir la PR](https://github.com/jpdandin44/AVEREO/pull/71).
- Complément de suivi : [Ouvrir la PR de suivi](https://github.com/jpdandin44/AVEREO/pull/72).
- État du complément : Fusionnée ; observation : 2026-10-03T16:56:55+00:00.
- Dernière observation GitHub : 2026-10-03T12:52:58+00:00.
- Revue humaine de la source GitHub : Confirmée.
- Acceptation de l'archive exacte pour promotion : À consigner avant production.

### Contrôles datés

| Nature | Résultat | Observation |
|---|---|---|
| Sur le poste | Réussi | 2026-10-03T12:44:51+00:00 |
| GitHub Actions | Réussi | 2026-10-03T12:42:48+00:00 |
| Documentation | Réussi | 2026-10-03T12:44:51+00:00 |

Preuves du candidat identifié ci-dessus :

- Sur le poste : raccordement-cockpit.md : 14 tests, build, parité a/b/c+d ; PDF réel court 1 page complète ; archive relue et répétée.
- GitHub Actions : https://github.com/jpdandin44/AVEREO/actions/runs/37123530922
- Documentation : 32 documents, socles, métadonnées simples, liens locaux, matrice 40 lignes, vues générées ; lecture Projet sans mutation.

### Contrôles de passage

- Préproduction : passage refusé (2026-10-03T12:54:58+00:00).
- Production : passage refusé (2026-10-03T12:54:59+00:00).
- Clôture : passage refusé (2026-10-03T12:54:59+00:00).

### Blocages de passage

- Compte parent retenu après vérification de la restriction des sous-domaines entre comptes. Session cPanel à reconnecter ; sous-domaine, dossier protégé et qualification distante restent à réaliser.
- Accord exact de préproduction absent ; vacuité/isolement ou sauvegarde restaurée non prouvés.
- Intégration CONNECT non réalisée ; recette humaine détaillée, cible de production et récupération à qualifier.

Prochaine action : Reconnecter le compte principal cPanel, puis préparer un dossier dédié fermé aux visiteurs et créer passeport-immo-preprod.avereo.fr vers ce dossier. Qualifier ensuite DNS/HTTPS, accès privé et récupération avant tout déploiement du candidat.

### Accords et livraison

Accords spécifiques enregistrés : 0. Sauvegardes qualifiées : 0.
Retour arrière : non testé. Livraison : non réalisée.
Les validations antérieures de phase ne sont ni remplacées ni déduites de ces constats.

### Suite proposée

- Intégration CONNECT après accord sur les fichiers concernés.
- Partage sécurisé et stockage centralisé à spécifier à la demande des clients.

### Préparation locale de préproduction

- État : Préparée sur le poste ; observation : 2026-10-03T16:56:55+00:00.
- Empreinte du lot fermé : `ad0f6ab22fc6c117107c78c0f7b881e4b34faa1a98b62435b0fcbe7a9969804a`.
- Assets du candidat conservés : Oui.
- Relecture de l'archive : Réussie.
- Restauration : Réussie sur des fichiers temporaires locaux ; cible hébergée : Non vérifiée.
- Livraison distante : Non effectuée.
- PR de préparation : [Ouvrir la PR](https://github.com/jpdandin44/AVEREO/pull/74).

Cette préparation ne qualifie ni la cible ni l'accès privé. La récupération locale est distincte d'une sauvegarde restaurée de l'hébergement.


## Livrables attendus par phase

Description issue du suivi JSON ; disponibilité vérifiée lors de la génération.

### Phase 0 — Reprise et état des lieux

**Itération GitHub et cockpit** — Document disponible (`iteration-developpement.md`).

Projection générée du bloc canonique developmentWorkflow.

- Candidat, PR, contrôles datés, blocages et prochaine action.

**00 etat des lieux** — Document disponible (`00-etat-des-lieux.md`).

Reprise et état des lieux

- Sources et prérequis identifiés ; matrice de parité et cas tiers rattachés.
- Audit source et inconnues explicites ; vues générées contrôlées.

**source audit** — Document disponible (`source-audit.md`).

Reprise et état des lieux

- Sources et prérequis identifiés ; matrice de parité et cas tiers rattachés.
- Audit source et inconnues explicites ; vues générées contrôlées.

### Phase 1 — Reprise à l’identique

**01 reprise identique** — Document disponible (`01-reprise-identique.md`).

Reprise à l’identique

- Installation, tests et build réussis.
- Diff limité aux transformations autorisées ou écarts explicitement consignés.
- Recette locale préparée et contrôles techniques distincts de la validation humaine.

**Itération GitHub et cockpit** — Document disponible (`iteration-developpement.md`).

Projection générée du bloc canonique developmentWorkflow.

- Candidat, PR, contrôles datés, blocages et prochaine action.

### Phase 2 — Intégration CONNECT

**02 integration connect** — Prévu — document non produit (`02-integration-connect.md`).

Intégration CONNECT

- Sas et catalogue intégrés après autorisation des fichiers hors sous-projet.
- Tests CONNECT, ouverture locale et accès sans ticket 403 vérifiés.

### Phase 3 — Préproduction

**03 preproduction** — Prévu — document non produit (`03-preproduction.md`).

Préproduction

- Procédure et workflow manuel préparés.
- Recette préproduction conforme, remplie par le responsable.

**deployment** — Prévu — document non produit (`deployment.md`).

Préproduction

- Procédure et workflow manuel préparés.
- Recette préproduction conforme, remplie par le responsable.

### Phase 4 — Mise en production

**04 mise en production** — Prévu — document non produit (`04-mise-en-production.md`).

Mise en production

- Autorisation humaine enregistrée après phase 3 validée.
- Procédure, fumée et retour arrière vérifiés par le responsable.

### Phase 5 — Spécification du passeport client

**05 specification passeport** — Prévu — document non produit (`05-specification-passeport.md`).

Spécification du passeport client

- Exigences et modèle client/biens/documents proposés.
- Options de stockage comparées ; aucun code ajouté.
