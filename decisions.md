---
project: avereo
document_type: decisions
title: Décisions du dépôt AVEREO
status: active
version: git
created: 2026-10-03
updated: 2026-10-06
owner: jpdandin
tags: [avereo, documentation, local]
---

# Décisions du dépôt AVEREO

Les décisions existantes restent dans leurs sources de chantier.
Voir le [cadre Passeport Immo](architecture-v1/avereo-app-passeport-immo/decisions.md).
TBD : index des décisions globales ; aucune approbation humaine créée par l’agent.

## 2026-10-03 — Source commune du protocole de développement

Le responsable a choisi AVEREO comme dépôt de rattachement du socle transverse.
Les [décisions du socle](outillage/protocole-developpement/decisions.md) conservent le détail.
Le protocole reste indépendant des applications ; son installation utilisateur permet
l'appel dans les autres dépôts, avec leurs cibles et contrôles propres.

## 2026-10-06 — Accès privés aux préproductions

Le responsable a demandé dans « Cahier des charges AVEREO » de remplacer le
filtrage IP de consultation par des identifiants, CONNECT d’abord puis les autres
préproductions. Le [lot d’accès](outillage/acces-preproduction/README.md) conserve
la méthode et ses contraintes ; le [suivi](outillage/acces-preproduction/suivi-chantier.json)
conserve les preuves, limites et décisions de bascule. Aucun accord de merge
ou de production n’est déduit de ce choix.

## 2026-10-06 — Réparation ciblée de l’identité de préproduction

Le responsable a demandé de corriger l’échec de connexion CONNECT. Le diagnostic
constate un module Simple OAuth présent avec ses bibliothèques absentes. Le
[contrat de réparation](outillage/acces-preproduction/identite/README.md) conserve
le verrou hébergé complété, pour rétablir le chargement sans mise à jour globale
de Drupal, modification de compte ou migration de base. La livraison est bornée
à `auth-next-preprod`, avec sauvegarde privée et restauration par empreinte.
Le reste de l’instance doit être rattaché à ses propres sources avant une évolution
plus large ; aucune validation de phase ni autorisation de merge n’est créée.

## 2026-10-06 — Cohérence de l’ensemble applicatif avant production

**Contexte :** après rétablissement de la connexion, Rapport ouvre une version
hébergée antérieure aux évolutions intégrées. Le responsable demande de vérifier
toutes les applications et leur cohérence avant la mise en production.

**Décision de préparation :** qualifier les applications du monorepo depuis une
même référence intégrée, identifier leurs archives et tester les contrats réels
de lancement. Traiter explicitement les changements encore en PR, les applications
fermées et les cibles non établies ; ne pas les considérer comme livrées.

**Raisons et conséquences :** comparer des versions identifiées et conserver les
droits/données existants. Les preuves locales et hébergées restent distinctes dans
[le suivi](outillage/acces-preproduction/suivi-chantier.json). Les configurations,
sauvegardes et recettes par cible restent nécessaires avant tout remplacement.
Cette préparation ne crée pas d’accord de merge, de production ou d’ouverture.
