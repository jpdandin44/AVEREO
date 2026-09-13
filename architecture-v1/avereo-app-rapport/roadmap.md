---
project: avereo-app-rapport
document_type: roadmap
title: Feuille de route Rapport AVEREO
status: active
version: git
created: 2026-09-10
updated: 2026-09-13
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
- Le premier lot Habitologie et le retablissement du rapport officiel
  Georisques ont ete integres par les PR #57 et #58.
- La simplification du catalogue a ete integree par la PR #59 : deux
  categories visibles et modules historiques conserves mais masques.
- La PR #60 a confirme la priorite donnee au prototype fonctionnel et reporte
  le chantier TDD a la phase d'industrialisation.
- Une premiere tranche `Ecoute client` pour `Visite Globale` est implementee
  sur une branche dediee et reste soumise a revue humaine.
- La meme branche structure le protocole et les observations selon
  `Eau -> Air -> Terre -> Feu`, et affiche dans `Site` une synthese Georisques
  sourcee et horodatee. Elle reste soumise a revue humaine.

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
| DT-RAP-09 | Basse | Mettre a jour les dependances de build `browserslist` et `baseline-browser-mapping` signalees par `npm audit`, sans changement fonctionnel. L'audit limite aux dependances de production est actuellement sans alerte. | `npm audit` et `npm audit --omit=dev` ne signalent plus de vulnerabilite, avec tests et build toujours verts. |

Ces elements ne bloquent pas la reprise des evolutions fonctionnelles. Les sujets de securite de priorite haute doivent cependant rester visibles et etre traites avant d'etendre le perimetre de production.

## Logique de developpement du prototype fonctionnel

Pour chaque evolution :

1. confirmer le besoin fonctionnel et le resultat visible attendu ;
2. realiser une tranche courte et demonstrable sans architecture speculative ;
3. creer une branche et un worktree dedies a Rapport depuis `main` a jour ;
4. modifier uniquement Rapport et les fichiers partages explicitement autorises par son `AGENTS.md` ;
5. verifier manuellement le parcours et executer les controles automatises deja disponibles qui restent pertinents ;
6. mettre a jour la documentation impactee et relire le diff complet ;
7. preparer une pull request en conservant la checklist officielle entierement decochee ;
8. laisser le merge, la validation preproduction et le deploiement de production sous controle humain.

Le TDD n'est pas un prealable pendant cette phase. Sa strategie, l'outillage,
la couverture cible et l'automatisation seront etudies lors de
l'industrialisation en vue de la commercialisation.

## Propositions en etude

Le workflow operationnel cible de `Visite Globale` est maintenu dans
[`workflows/workflow-habitologie.md`](workflows/workflow-habitologie.md).
Il organise le parcours autour de `Ecoute`, `Observation/Analyse`,
`Explication` et `Pistes d'accompagnement`, avec validation humaine avant
publication. Cette proposition ne decrit pas une fonctionnalite deja livree.

Les points encore a arbitrer sont notamment l'architecture d'execution des
traitements, les regles de passage entre statuts, le fournisseur IA eventuel,
la conservation des donnees vocales et le role habilite a valider.

## Travail actuel et prochaine evolution

La branche de prototype enrichit l'ecoute et relie ses sujets explicites aux
suggestions du protocole, sans preselection globale. La confirmation du besoin
reste manuelle. La carte cadastrale directe IGN remplace l'iframe dont le fond
restait noir. Plan, vue aerienne et parcelles ont ete verifies localement ;
la confirmation et le retour au champ adresse sont fonctionnels. Il reste a
qualifier ce volet en preproduction avant tout deploiement de production.
Les supports Solive/Habitologue annonces ne sont pas encore fournis.

La tranche actuelle ajoute `Ecoute client` a `Visite Globale` sans modifier le
parcours des rapports techniques. Les donnees sont sauvegardees et exportees
dans le payload existant ; les accords conditionnent l'usage des photos et de
la dictee. Le motif et les attentes manquants restent des alertes non
bloquantes pendant le prototype. Le dossier distingue le type d'habitation du
parcours d'analyse commun `Eau -> Air -> Terre -> Feu`.

Le protocole detaille et les observations sont maintenant alignes sur ces
quatre phases. La synthese Georisques est integree a `Site` sans jeton et
reste consultable dans le rapport officiel. Apres revue et validation de cette
tranche, la prochaine evolution fonctionnelle consiste a enrichir les champs
metier de chaque phase, puis a cadrer `Explication` et
`Pistes d'accompagnement`.

Le cadrage, les hypotheses, les lots et le chiffrage sont decrits dans
`docs/habitologie-light-plan.md`.
