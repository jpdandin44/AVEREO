---
project: avereo-app-passeport-immo
document_type: source-audit
title: Écart de présentation AVEREO dans le devis
status: active
version: git
created: 2026-11-06
updated: 2026-11-07
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

## 2026-11-07 — Écart j, informations provisoires d’entreprise

Le responsable fournit les données de société en formation et demande la zone
d’immatriculation future. Deux raccordements précis sont ajoutés : import des
lignes d’entreprise, puis bloc de paragraphes sous le logo dans `PdfLayout`.
Le contrôle de parité inverse exactement ces deux ajouts avant les écarts antérieurs.
Les audits historiques et la matrice approuvée restent inchangés.

Le PDF de démonstration a été téléchargé de nouveau et rendu : une page A4,
quatre lignes complètes, montants inchangés. Champs vides omis, quatre tests PDF
et comparaison intégrale réussis. [Identité de référence et preuves datées](../../avereo-platform/docs/identite-livrables.md).
