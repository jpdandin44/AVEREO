---
project: avereo-app-passeport-immo
document_type: tableau-de-bord
title: AVEREO – Passeport Immo
status: active
version: git
created: 2026-10-03
updated: 2026-10-14
owner: jpdandin
tags: [suivi, passeport-immo, genere]
---

# AVEREO – Passeport Immo

Vue générée depuis `suivi-chantier.json`. Ne pas modifier manuellement.
La revue et les décisions se font dans [Projet local](http://127.0.0.1:5193/).

<!-- BEGIN GENERATED: suivi-chantier.json -->
Mise à jour : **2026-10-14**. **1 phase livrée sur 4 ; 1 phase validée par le responsable.**

| Phase | Statut | Livrables | Livraison | Validation humaine |
|---|---|---|---|---|
| 0 — Cadrage | Validée | [iteration-developpement.md](iteration-developpement.md)<br>[00-etat-des-lieux.md](00-etat-des-lieux.md)<br>[source-audit.md](source-audit.md) | 2026-10-03 | 2026-10-03 |
| 1 — Développement local | En cours | `02-integration-connect.md` (prévu)<br>[documents-bien.md](documents-bien.md)<br>[progression-examin.md](progression-examin.md)<br>[source-audit-documents.md](source-audit-documents.md)<br>[mapping-phases.md](mapping-phases.md)<br>[coupes-bien.md](coupes-bien.md) | — | Non acquise |
| 2 — Préproduction | Non commencée | `03-preproduction.md` (prévu)<br>`deployment.md` (prévu) | — | Non acquise |
| 3 — Mise en production | Non commencée | `04-mise-en-production.md` (prévu) | — | Non acquise |

### Décisions attendues

Aucune décision en attente.

### Décisions enregistrées

| ID | Décision | Date | Référence de preuve |
|---|---|---|---|
| D01 | Valider le livrable de phase 0 — accord enregistré | 2026-10-03 | Décision et preuve consignées dans le JSON |
| D02 | Historique — Reprise à l’identique : Autoriser le passage en phase 1 — accord enregistré | 2026-10-03 | Décision et preuve consignées dans le JSON |
| D03 | Historique — Reprise à l’identique : Valider le livrable de phase 1 — accord enregistré | 2026-10-03 | Décision et preuve consignées dans le JSON |
| D04 | Historique — Intégration CONNECT : Autoriser le passage en phase 2 — accord enregistré | 2026-10-03 | Décision et preuve consignées dans le JSON |

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

Travail actuel : **Local — En cours**.
Examiner le dossier documentaire local ; poursuivre CONNECT puis qualifier la préproduction privée avant une installation distante.

Reprise demandée par le responsable dans AVEREO_2 le 2026-10-14T09:40:12+00:00.

Parcours formel : **phase 1 — Développement local**, en cours.
Validation formelle restant à consigner : phase 1. Les constats GitHub et les contrôles locaux ne remplacent pas les décisions de phase.


Adresse créée : `https://passeport-immo-preprod.avereo.fr`. Dossier dédié : `/home/daje3540/passeport-immo-preprod.avereo.fr/public` dans le compte parent. La lune gratuite `sc4daje3540` reste distincte de cette cible.

Certificat installé ; adresse HTTPS contrôlée avec accès refusé (403). Aucun fichier applicatif installé. Accès privé de consultation et récupération hébergée restent à qualifier.


## Itération GitHub et cockpit

**passeport-immo-documents-2026-10-14** — Cas documentaire concret client/bien en local et progression sourcée face à ExamIn.

Responsable : jpdandin. Étape : local. État : En cours.

Ces étapes techniques complètent les phases formelles du chantier ; une fusion GitHub ne modifie pas leurs décisions.

| Étape | État | Prochaine action |
|---|---|---|
| Local | En cours | Examiner le dossier documentaire local ; poursuivre CONNECT puis qualifier la préproduction privée avant une installation distante. |
| Préproduction | Bloquée | Définir et configurer l’accès privé de test avec saisie des identifiants par le responsable, qualifier la récupération et le lot CONNECT, puis présenter le candidat exact pour accord d’installation. Sous-domaine créé et HTTPS contrôlé ; accès actuellement fermé à tous. |
| Production | Bloquée | Attendre recette réelle préproduction, acceptation humaine et récupération qualifiée. |

### Candidat et GitHub

- SHA source : `322ad1275c240a9bc70ad8641102c58600c1f67c`.
- SHA-256 de l'archive : `bf9e285c1f34fbb0dc49deafccd32597bc514b41fe93c5f955a17e510fba0983`.
- PR : [Ouvrir la PR](https://github.com/jpdandin44/AVEREO/pull/78).
- Complément de suivi : [Ouvrir la PR de suivi](https://github.com/jpdandin44/AVEREO/pull/72).
- État du complément : Fusionnée ; observation : 2026-10-03T19:41:38.385Z.
- Dernière observation GitHub : 2026-10-14T12:27:15+02:00.
- Revue humaine de la source GitHub : Non consignée.
- Acceptation de l'archive exacte pour promotion : À consigner avant production.

### Contrôles datés

| Nature | Résultat | Observation |
|---|---|---|
| Sur le poste | Réussi | 2026-10-14T12:30:33+02:00 |
| Documentation | Réussi | 2026-10-14T12:30:33+02:00 |
| GitHub Actions | Réussi | 2026-10-14T12:30:33+02:00 |

Preuves du candidat identifié ci-dessus :

- Sur le poste : 26 tests frontend, 10 tests Python, parité a/b/c/d/e, build, contrat cockpit ; six PDF réels dans le navigateur, PDF comparatif consulté sur deux pages et téléchargement identique.
- Documentation : 31 documents Markdown et 104 liens locaux contrôlés ; socles racine et application présents ; progression et vues alignées ; empreintes approuvées historiques conservées.
- GitHub Actions : https://github.com/jpdandin44/AVEREO/actions/runs/38549381653 ; archive téléchargée identique au candidat local, manifeste et sept assets vérifiés.

### Contrôles de passage

- Préproduction : passage refusé (2026-10-14T12:32:31+02:00).
- Production : passage refusé (2026-10-14T12:32:31+02:00).
- Clôture : passage refusé (2026-10-14T12:32:31+02:00).

### Blocages de passage

- Sous-domaine et dossier créés, certificat installé et fermeture 403 vérifiée en HTTPS ; accès privé de consultation et récupération hébergée non qualifiés.
- Accord exact de préproduction absent ; vacuité/isolement ou sauvegarde restaurée non prouvés.
- Intégration CONNECT non réalisée ; recette humaine détaillée, cible de production et récupération à qualifier.

Prochaine action : Examiner le dossier documentaire local ; poursuivre CONNECT puis qualifier la préproduction privée avant une installation distante.

### Accords et livraison

Accords spécifiques enregistrés : 0. Sauvegardes qualifiées : 0.
Retour arrière : non testé. Livraison : non réalisée.
Les validations antérieures de phase ne sont ni remplacées ni déduites de ces constats.

### Suite proposée

- Intégration CONNECT après accord sur les fichiers concernés.
- Partage sécurisé et stockage centralisé à spécifier à la demande des clients.


## Livrables attendus par phase

Description issue du suivi JSON ; disponibilité vérifiée lors de la génération.

### Phase 0 — Cadrage

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

### Phase 1 — Développement local

**02 integration connect** — Prévu — document non produit (`02-integration-connect.md`).

Intégration CONNECT

- Sas et catalogue intégrés après autorisation des fichiers hors sous-projet.
- Tests CONNECT, ouverture locale et accès sans ticket 403 vérifiés.

**Documents du client et du bien** — Document disponible (`documents-bien.md`).

Lot local demandé le 14 octobre

- Cas concret et limites conservés ; aucune validation distante déduite.

**Progression face aux sources ExamIn** — Document disponible (`progression-examin.md`).

Lot local demandé le 14 octobre

- Cas concret et limites conservés ; aucune validation distante déduite.

**Audit du lot documentaire** — Document disponible (`source-audit-documents.md`).

Lot local demandé le 14 octobre

- Cas concret et limites conservés ; aucune validation distante déduite.

**Correspondance des phases** — Document disponible (`mapping-phases.md`).

Lot local demandé le 14 octobre

- Cas concret et limites conservés ; aucune validation distante déduite.

**Coupes avant/après préparées dans Coupe** — Document disponible (`coupes-bien.md`).

Sources, hypothèses et restitution comparative intégrée au bien

- Deux projets Coupe modifiables et SVG locaux ; PDF comparatif de deux pages consulté et téléchargé.

### Phase 2 — Préproduction

**03 preproduction** — Prévu — document non produit (`03-preproduction.md`).

Préproduction

- Procédure et workflow manuel préparés.
- Recette préproduction conforme, remplie par le responsable.

**deployment** — Prévu — document non produit (`deployment.md`).

Préproduction

- Procédure et workflow manuel préparés.
- Recette préproduction conforme, remplie par le responsable.

### Phase 3 — Mise en production

**04 mise en production** — Prévu — document non produit (`04-mise-en-production.md`).

Mise en production

- Autorisation humaine enregistrée après phase 3 validée.
- Procédure, fumée et retour arrière vérifiés par le responsable.
