---
project: protocole-developpement
document_type: decisions
title: Décisions du protocole commun
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [developpement, github, cockpit]
---

# Décisions

## 2026-10-03 — Un seul cycle, plusieurs adaptations

Contexte : le responsable demande un protocole industrialisé dans tous ses développements.

Décision de réalisation : un skill commun, trois étapes et un contrat de preuves ; les commandes techniques restent dans chaque dépôt. Un raccordement réutilise le cockpit existant au lieu de modifier ses phases approuvées.

Raison : garder une conduite simple sans confondre les exigences d'un site, d'une application ou d'un agent.

Conséquence : la disponibilité réelle de chaque préproduction, workflow et cible doit être qualifiée lors de l'adoption. Le skill ne crée pas ces accès.

## 2026-10-03 — Sources et format natif du skill

Le protocole est maintenu dans `skills/developpement-github-cockpit/references/protocole.md`. Les autres documents y renvoient. Les instructions globales pointent vers le skill installé.

Exception de format : `SKILL.md` utilise le front matter natif Codex `name`, `description` et `metadata`. Les métadonnées documentaires sont dans `metadata`, car le validateur de skill refuse les autres clés à la racine. JSON et YAML conservent leurs formats natifs.

Le contrôleur est une vérification de cohérence de données fournies, pas un mécanisme d'authentification ou une autorisation de livraison.

## 2026-10-03 — Appel court DEV

Contexte : le responsable souhaite un mot-clé aussi simple à appeler qu'un plugin.

Décision : exposer le skill court `dev`, appelé par `$dev`, et router le préfixe conversationnel `DEV :` par les consignes globales. L'alias lit le skill de référence ; le nom long reste compatible.

Raison : permettre un appel mémorisable sans renommer le protocole ni en créer une copie.

Conséquence : l'alias est un skill local, sans paquet de plugin publié ni nouvelle permission. Les conditions de passage et décisions humaines du protocole restent applicables.

## 2026-10-03 — Source transverse dans AVEREO

Contexte : le responsable désigne `jpdandin44/AVEREO` et demande une utilisation commune à tous ses dépôts.

Décision : intégrer ce socle dans `outillage/protocole-developpement`, avec une installation des skills au niveau utilisateur. Les dépôts consommateurs conservent leurs propres cibles, outils et suivis ; le protocole n'est pas recopié dans chacun.

Raison : une source versionnée et réutilisable, sans nouveau dépôt obligatoire ni duplication des processus.

Conséquence : le rattachement passe par une PR d'AVEREO. Sur chaque autre poste, il faut récupérer cette source et installer ses liens. Cette installation ne configure pas automatiquement les environnements GitHub des autres dépôts.
