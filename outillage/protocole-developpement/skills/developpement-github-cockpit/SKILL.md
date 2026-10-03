---
name: developpement-github-cockpit
description: "Conduire une itération de site, application ou agent avec GitHub et le cockpit : développement local, préproduction contrôlée, livraison autorisée en production et préparation de la suite. Utiliser pour un lot de développement ou sa reprise, pas pour une simple question sans avancement projet."
metadata:
  project: protocole-developpement
  document_type: skill
  title: Développement avec GitHub et cockpit
  status: active
  version: git
  created: 2026-10-03
  updated: 2026-10-03
  owner: jpdandin
  tags: [developpement, github, cockpit]
---

# Développement avec GitHub et cockpit

Appliquer le [protocole commun](references/protocole.md). Le responsable a demandé trois étapes : développer et corriger localement ; livrer et contrôler en préproduction ; livrer et contrôler en production, puis préparer la suite.

Le [skill DEV](../dev/SKILL.md) fournit l'appel court `$dev` et le préfixe conversationnel `DEV :`. Il renvoie à ces instructions ; le nom long reste utilisable.

## Reprise

Lire les AGENTS.md applicables, le dépôt, son état Git et le suivi existant. Identifier le cockpit et la fiche de l'itération. Actualiser les preuves GitHub utiles. Conserver les validations, brouillons et modifications des autres lots.

Pour un cockpit non raccordé, lire le [contrat](references/cockpit.md), identifier sa source canonique et réaliser le mapping dans le périmètre autorisé. Ne pas inventer une synchronisation ni un environnement. Le [modèle JSON](assets/iteration.json) initialise seulement une nouvelle itération ; ne jamais écraser un suivi existant avec ce modèle.

## Conduite

- Travailler sur un périmètre cohérent et une branche dédiée ; tests proportionnés, documentation impactée et PR liés à la version présentée.
- Mettre le cockpit à jour avant et après une action ou un changement de version : étape, état, prochaine action, blocages, candidat, preuves et décisions.
- Une correction produit un nouveau candidat et exige les contrôles concernés. Promouvoir le même artefact vérifié ; si un merge modifie le contenu ou qu'une reconstruction change l'artefact, refaire la qualification nécessaire.
- Avant chaque passage, exécuter `scripts/check-gate.py --state FICHE --gate preproduction|production|close` sur le bloc conforme. Ses résultats vérifient les déclarations ; contrôler également les preuves originales, la cible réelle et la fraîcheur de l'état.
- La préparation et la PR sont des travaux de développement. Les déploiements, le merge et l'ouverture publique gardent les accords humains applicables. Un accord déjà donné pour la même cible, version et effet reste valable ; ne pas le redemander sans changement de périmètre ou de risque.
- Ne pas cocher les validations humaines, convertir un test en accord ou modifier les preuves historiques. Ne pas contourner un contrôle en échec ; consigner le blocage et demander seulement l'information ou l'accord qui manque, après préparation concrète du résultat.
- Choisir les outils et modèles suffisants, respecter le budget autorisé, éviter les boucles de tentatives non informatives et arrêter les mutations distantes quand les prérequis ne sont pas maîtrisés. Si le responsable fixe un seuil de confiance, appliquer ce seuil sans inventer une probabilité.

## Clôture

Conserver le reçu et les contrôles réels de production, le retour arrière disponible, les réserves et le backlog de la suite. Archiver l'itération ; démarrer la suivante séparément. Fournir les liens du cockpit, de la PR, des preuves, le bilan documentaire et les éléments encore à qualifier.
