---
project: avereo-app-passeport-immo
document_type: tableau-de-bord
title: AVEREO – Passeport Immo
status: active
version: git
created: 2026-10-03
updated: 2026-10-15
owner: jpdandin
tags: [suivi, passeport-immo, genere]
---

# AVEREO – Passeport Immo

Vue générée depuis `suivi-chantier.json`. Ne pas modifier manuellement.
La revue et les décisions se font dans [Projet local](http://127.0.0.1:5193/).

<!-- BEGIN GENERATED: suivi-chantier.json -->
Mise à jour : **2026-10-15**. **2 phases livrées sur 4 ; 2 phases validées par le responsable.**

| Phase | Statut | Livrables | Livraison | Validation humaine |
|---|---|---|---|---|
| 0 — Cadrage | Validée | [iteration-developpement.md](iteration-developpement.md)<br>[00-etat-des-lieux.md](00-etat-des-lieux.md)<br>[source-audit.md](source-audit.md) | 2026-10-03 | 2026-10-03 |
| 1 — Développement local | Validée | [documents-bien.md](documents-bien.md)<br>[progression-examin.md](progression-examin.md)<br>[source-audit-documents.md](source-audit-documents.md)<br>[mapping-phases.md](mapping-phases.md)<br>[coupes-bien.md](coupes-bien.md) | 2026-10-14 | 2026-10-14 |
| 2 — Préproduction | Non commencée | [02-integration-connect.md](02-integration-connect.md)<br>[03-preproduction.md](03-preproduction.md)<br>[deployment.md](deployment.md) | — | Non acquise |
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
| D05 | Valider le livrable de phase 1 — accord enregistré | 2026-10-14 | Décision et preuve consignées dans le JSON |

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

Travail actuel : **Préproduction — En cours**.
Qualifier en CI le correctif qui protège aussi les assets, sauvegarder les deux fichiers installés puis remplacer la porte Basic redondante de Passeport Immo ; terminer la recette et le transfert du dossier.

Reprise demandée par le responsable dans AVEREO_2 le 2026-10-14T09:40:12+00:00.

Parcours formel : **phase 1 — Développement local**, validée.
Phases 0 et 1 validées dans le suivi. Les constats GitHub et les contrôles locaux ne remplacent pas les décisions de phase.


Adresse créée : `https://passeport-immo-preprod.avereo.fr`. Dossier dédié : `/home/daje3540/passeport-immo-preprod.avereo.fr/public` dans le compte parent. La lune gratuite `sc4daje3540` reste distincte de cette cible.

Application installée en préproduction privée ; HTTPS contrôlé avec protection visiteur (401). Recette avec l’identité réelle et import du dossier dans le navigateur restent à terminer.


## Itération GitHub et cockpit

**passeport-immo-documents-2026-10-14** — Cas documentaire concret client/bien en local et progression sourcée face à ExamIn.

Responsable : jpdandin. Étape : preproduction. État : En cours.

Ces étapes techniques complètent les phases formelles du chantier ; une fusion GitHub ne modifie pas leurs décisions.

| Étape | État | Prochaine action |
|---|---|---|
| Local | Validée | Lot documents/coupes approuvé ; intégration installée en préproduction privée, recette et import du dossier à terminer. |
| Préproduction | En cours | Qualifier en CI le correctif qui protège aussi les assets, sauvegarder les deux fichiers installés puis remplacer la porte Basic redondante de Passeport Immo ; terminer la recette et le transfert du dossier. |
| Production | Bloquée | Attendre recette réelle préproduction, acceptation humaine et récupération qualifiée. |

### Candidat et GitHub

- SHA source : `14d83041343c090ebed374f4e770fc2c1a86c244`.
- SHA-256 de l'archive : `4c603ffbd2a168709bcc89afb5bf26264c1d7d2624af1d071977ed868f162068`.
- PR : [Ouvrir la PR](https://github.com/jpdandin44/AVEREO/pull/80).
- Complément de suivi : [Ouvrir la PR de suivi](https://github.com/jpdandin44/AVEREO/pull/72).
- État du complément : Fusionnée ; observation : 2026-10-03T19:41:38.385Z.
- Dernière observation GitHub : 2026-10-15T08:09:46.044Z.
- Revue humaine de la source GitHub : Non consignée.
- Acceptation de l'archive exacte pour promotion : À consigner avant production.

### Contrôles datés

| Nature | Résultat | Observation |
|---|---|---|
| Sur le poste | Réussi | 2026-10-14T12:30:33+02:00 |
| Documentation | Réussi | 2026-10-14T12:30:33+02:00 |
| GitHub Actions | Réussi | 2026-10-14T12:30:33+02:00 |
| Sur le poste | Réussi | 2026-10-14T20:09:51.631Z |
| Documentation | Réussi | 2026-10-14T20:09:51.631Z |
| GitHub Actions | Réussi | 2026-10-14T20:13:18.664Z |
| Sur le poste | Réussi | 2026-10-15T06:36:09.982Z |
| GitHub Actions | Réussi | 2026-10-15T06:46:34.094Z |
| GitHub Actions | Réussi | 2026-10-15T07:53:22.944438+00:00 |
| Sur le poste | Réussi | 2026-10-15T08:13:50.587851+00:00 |
| GitHub Actions | Réussi | 2026-10-15T08:13:50.587851+00:00 |
| Documentation | Réussi | 2026-10-15T08:14:26.469641+00:00 |

Preuves du candidat identifié ci-dessus :

- Sur le poste : 26 tests frontend, 10 tests Python, parité a/b/c/d/e, build, contrat cockpit ; six PDF réels dans le navigateur, PDF comparatif consulté sur deux pages et téléchargement identique.
- Documentation : 31 documents Markdown et 104 liens locaux contrôlés ; socles racine et application présents ; progression et vues alignées ; empreintes approuvées historiques conservées.
- GitHub Actions : https://github.com/jpdandin44/AVEREO/actions/runs/38549381653 ; archive téléchargée identique au candidat local, manifeste et sept assets vérifiés.
- Sur le poste : 26 tests frontend, 15 tests Python, 38 tests backend, 15 assertions de contrat et 18 HTTP Apache ; build, parité, archive et restauration locale réussis.
- Documentation : Socles Passeport Immo et CONNECT vérifiés ; métadonnées, liens locaux, vues et 15 empreintes approuvées conformes.
- GitHub Actions : CI 01be7d2 : 18 contrôles réussis ; ZIP et inventaire identiques au candidat 91d8e466, aucun changement de runtime entre ces références. Policy humaine ignorée en brouillon.
- Sur le poste : Delta compatible 1cbd15edf31bfda766007a255de83e4f58f8192e1d2edd592b86165d6c3b106d (source 9bc5e351781a0a59169e4dc09ec29f67f9cb2dec) : 19 tests Python, 32 tests du backend historique, 15 assertions du sas. ZIP frontend inchangé ; reçu hébergé api/connect-hosted-observation.json.
- GitHub Actions : CI e26f564 : 18 contrôles réussis ; ZIP et inventaire identiques au candidat 91d8e466, aucun changement de runtime entre ces références. Policy humaine ignorée en brouillon.
- GitHub Actions : CI f6e5aaa : neuf contrôles techniques réussis ; archive téléchargée identique octet par octet à celle installée. Aucun changement applicatif dans le complément documentaire.
- Sur le poste : api/preproduction-sso-observation.json ; 12 fichiers dont deux modifiés, CI et Apache isolé conformes.
- GitHub Actions : api/preproduction-sso-observation.json ; 12 fichiers dont deux modifiés, CI et Apache isolé conformes.
- Documentation : 35 Markdown, 191 liens locaux et socles racine/application contrôlés ; sources de revue approuvées conservées, description locale et état installé initial distingués.

### Contrôles de passage

- Préproduction : passage refusé (2026-10-14T12:32:31+02:00).
- Production : passage refusé (2026-10-14T12:32:31+02:00).
- Clôture : passage refusé (2026-10-14T12:32:31+02:00).
- Préproduction : conditions remplies (2026-10-15T07:35:02.235103+00:00).

### Blocages de passage

Aucun blocage déclaré.

Prochaine action : Qualifier en CI le correctif qui protège aussi les assets, sauvegarder les deux fichiers installés puis remplacer la porte Basic redondante de Passeport Immo ; terminer la recette et le transfert du dossier.

### Accords et livraison

Accords spécifiques enregistrés : 2. Sauvegardes qualifiées : 3.
Retour arrière : non testé. Livraison : non réalisée.
Les validations antérieures de phase ne sont ni remplacées ni déduites de ces constats.

### Suite proposée

- Intégration CONNECT après accord sur les fichiers concernés.
- Partage sécurisé et stockage centralisé à spécifier à la demande des clients.

### Préparation locale de préproduction

- État : Installée en préproduction privée, recette à terminer ; observation : 2026-10-15T07:40:02+00:00.
- Empreinte du lot fermé : `c59311d764bbde23f0e4d0ad6c85a7d278c0eaedf073ecb2a57b75057b7a0c91`.
- Assets du candidat conservés : Oui.
- Relecture de l'archive : Réussie.
- Restauration : Réussie sur des fichiers temporaires locaux ; cible hébergée : passed_files_and_modes_private_rehearsal_no_database.
- Livraison distante : Installée en préproduction privée, recette à terminer.
- PR de préparation : Non publiée.

Cette préparation ne qualifie ni la cible ni l'accès privé. La récupération locale est distincte d'une sauvegarde restaurée de l'hébergement.


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

- Deux projets Coupe avec zones/interface/support, champs inconnus signalés ; SVG natifs et PDF comparatif consulté et téléchargé ; cotes CAO conservées.

### Phase 2 — Préproduction

**02 integration connect** — Document disponible (`02-integration-connect.md`).

Prérequis CONNECT conservé : travaux locaux à réaliser avant toute installation en préproduction.

- Sas et catalogue intégrés après autorisation des fichiers hors sous-projet.
- Tests CONNECT, ouverture locale et accès sans ticket 403 vérifiés.

**03 preproduction** — Document disponible (`03-preproduction.md`).

Préproduction

- Procédure et workflow manuel préparés.
- Recette préproduction conforme, remplie par le responsable.

**deployment** — Document disponible (`deployment.md`).

Préproduction

- Procédure et workflow manuel préparés.
- Recette préproduction conforme, remplie par le responsable.

### Phase 3 — Mise en production

**04 mise en production** — Prévu — document non produit (`04-mise-en-production.md`).

Mise en production

- Autorisation humaine enregistrée après phase 3 validée.
- Procédure, fumée et retour arrière vérifiés par le responsable.
