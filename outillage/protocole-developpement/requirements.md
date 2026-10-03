---
project: protocole-developpement
document_type: requirements
title: Exigences du protocole commun
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [developpement, github, cockpit]
---

# Exigences

- Trois étapes communes avec boucles de correction : local, préproduction et production ; ensuite préparer une nouvelle itération.
- Un lot et une PR par périmètre cohérent ; préserver les autres applications et les travaux existants.
- Cockpit : état réel, responsable, prochaine action, blocages, budget, candidat, PR, tests, décisions, sauvegarde, restauration et retour arrière.
- Relier les preuves à un candidat exact et à leur environnement ; une nouvelle version exige les contrôles concernés à nouveau.
- Conserver les validations humaines ; merge, déploiement et ouverture publique restent des actes distincts.
- Tester la sauvegarde/restauration avant une écriture distante susceptible de perdre l'état existant. Pour une cible neuve, démontrer son isolement et sa vacuité ; ne pas simuler une sauvegarde inexistante.
- Contrôler la production après livraison ; ne pas restaurer une base complète en ignorant les données reçues depuis.
- Sites : recette des parcours et des formats d'écran pertinents. Applications : build et parcours métier. Agents : évaluations, outils, effets externes et budget d'exécution.
- Proportionner les tests au risque ; annoncer les preuves manquantes sans inventer de réussite.
- Respecter les plafonds et choisir les modèles suffisants ; ne pas déclencher Claude, une API payante ou une délégation sans besoin et cadre autorisé.

TBD : cockpit cible définitif, dépôt GitHub de distribution, configuration de chaque hébergeur et disponibilité des protections d'environnement de chaque dépôt. Ces inconnues empêchent une prétendue activation universelle des déploiements, sans empêcher l'utilisation du skill.
