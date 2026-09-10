---
project: avereo-app-rapport
document_type: roadmap
title: Feuille de route Rapport AVEREO
status: active
version: git
created: 2026-09-10
updated: 2026-09-10
owner: jpdandin
tags:
  - rapport
  - roadmap
  - dette-technique
  - fonctionnalites
---

# Feuille de route Rapport AVEREO

## Situation actuelle

- La version actuelle du moteur Rapport est gelee comme demonstrateur officiel sous le tag `rapport-demo-v1.0.0`, au commit `c2d625a6f1b575f78ea35e90f19fc8e7df91c234`.
- Rapport est accessible en production uniquement depuis AVEREO CONNECT.
- Le sas `connect_gateway`, la base MySQL dediee et le healthcheck public sont operationnels.
- L'interface reconnait l'identite CONNECT et propose la sauvegarde en ligne.
- La derniere validation de production n'a cree aucune donnee metier ; le parcours complet creation, sauvegarde, rechargement et isolation multi-utilisateur reste a qualifier dans un environnement de test.
- La priorite suivante est la reprise des ameliorations fonctionnelles de Rapport, une evolution isolee a la fois.

## Dette technique non bloquante

| ID | Priorite | Optimisation | Critere de cloture |
| --- | --- | --- | --- |
| DT-RAP-01 | Haute | Renouveler le secret OAuth Drupal historique encore present dans la configuration privee, puis revoquer l'ancienne valeur. Le mode actif `connect_gateway` ne depend pas de ce secret. | Nouvelle valeur synchronisee avec le client OAuth, ancienne valeur revoquee et lancement CONNECT toujours fonctionnel. |
| DT-RAP-02 | Haute | Simplifier la configuration d'authentification privee : conserver une seule declaration effective de `auth_mode` et isoler clairement les parametres OAuth directs devenus historiques. | Configuration non ambigue, mode `connect_gateway` unique et strategie de retour arriere documentee. |
| DT-RAP-03 | Haute | Automatiser un test de bout en bout CONNECT vers Rapport dans un environnement representatif : ticket signe, identite, anti-rejeu, acces API, sauvegarde, rechargement et isolation utilisateur. | Test reproductible, sans secret versionne, couvrant les cas nominaux et les refus attendus. |
| DT-RAP-04 | Moyenne | Etendre le healthcheck MySQL au schema attendu au lieu de verifier uniquement la connexion PDO. | Le controle signale explicitement l'absence de la table ou d'une migration requise. |
| DT-RAP-05 | Moyenne | Mettre en place un suivi de version des migrations et une procedure d'application idempotente avec sauvegarde et retour arriere. | Etat de migration consultable et procedure testee sans modification destructive implicite. |
| DT-RAP-06 | Moyenne | Remplacer le message OAuth technique en anglais par une presentation francaise neutre, sans exposer Drupal comme moteur d'identite. | Aucun libelle technique Drupal/OAuth visible dans le parcours de connexion CONNECT. |
| DT-RAP-07 | Moyenne | Durcir les sauvegardes de configuration : repertoire prive lorsque compatible, fichiers `0600`, retention definie et suppression soumise a validation humaine. | Regles de permissions et de retention documentees puis verifiees sur cPanel. |
| DT-RAP-08 | Basse | Formaliser une procedure de rotation coordonnee des secrets CONNECT-Rapport avec sauvegarde, fenetre de synchronisation, controles et restauration. | Procedure Markdown reproductible ne contenant aucune valeur sensible. |

Ces elements ne bloquent pas la reprise des evolutions fonctionnelles. Les sujets de securite de priorite haute doivent cependant rester visibles et etre traites avant d'etendre le perimetre de production.

## Logique de developpement des ameliorations fonctionnelles

Pour chaque evolution :

1. definir le besoin, les resultats attendus et les cas invalides ;
2. traduire ces resultats en tests ou scenarios d'acceptation avant le code ;
3. appliquer le cycle TDD `rouge -> vert -> refactorisation` sur chaque tranche fonctionnelle ;
4. creer une branche et un worktree dedies a Rapport depuis `main` a jour ;
5. modifier uniquement Rapport et les fichiers partages explicitement autorises par son `AGENTS.md` ;
6. executer les tests cibles, le lint PHP, le build Vite et les controles de securite/donnees pertinents ;
7. mettre a jour la documentation impactee et relire le diff complet ;
8. preparer une pull request en conservant la checklist officielle entierement decochee ;
9. laisser le merge, la validation preproduction et le deploiement de production sous controle humain.

La strategie de tests automatisee detaillee est elaboree en parallele. Tant
qu'elle n'est pas validee, les evolutions doivent au minimum definir leurs
scenarios d'acceptation et ne doivent pas figer un choix d'outillage difficile
a remplacer.

## Prochaine evolution fonctionnelle

Concevoir puis livrer un parcours leger `Rapport d'habitologie`, sans remplacer
le moteur officiel existant. Le parcours cible suit la chaine : client, bien
immobilier, risques, analyse de visite, aides, synthese.

Le cadrage, les hypotheses, les lots et le chiffrage sont decrits dans
`docs/habitologie-light-plan.md`.
