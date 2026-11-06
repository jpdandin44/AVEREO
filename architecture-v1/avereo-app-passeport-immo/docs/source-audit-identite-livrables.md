---
project: avereo-app-passeport-immo
document_type: source-audit
title: Écart de présentation AVEREO dans le devis
status: active
version: git
created: 2026-11-06
updated: 2026-11-06
owner: jpdandin
tags: [avereo, livrables, organisation]
---

# Écart de présentation AVEREO dans le devis

Les audits et matrices historiques approuvés restent figés. Cette annexe documente
l’écart **i**, demandé par le responsable pour les livrables de toutes les applications.

| Élément | Écart i | Conservation |
| --- | --- | --- |
| Source | Import du nom et du logo officiel communs | Aucune lecture des préférences ou rôles simulés |
| Devis PDF | Logo embarqué et nom commun dans le titre | Données, montants et mise en page native |
| Pied de devis | Nom fourni par la même source | Date et libellé Passeport conservés |
| Parité | Inversion des trois raccordements exacts | Comparaison complète au frontend historique ensuite |

Le [contrat commun](../../avereo-platform/docs/identite-livrables.md) porte la
configuration future par administrateur d’organisation. Elle n’existe pas dans ce
candidat et n’utilisera pas le profil de démonstration pour autoriser les écritures.

Quatre tests de pagination et le contrôle de parité réussissent. Un PDF réel de
démonstration est généré puis rendu : une page A4, logo présent, montants inchangés.
Le test témoin de divergence hors des substitutions doit continuer à être refusé.
