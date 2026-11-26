---
project: avereo-app-passeport-immo
document_type: source-audit
title: Annexe de parité de la relecture experte
status: active
version: git
created: 2026-11-25
updated: 2026-11-25
owner: jpdandin
tags: [passeport-immo, relecture, parite]
---

## 25 novembre — Relecture sur Word confirmée

La décision porte désormais sur les Word privés. Le PDF client est préparé après approbation et contrôle du rendu ; les anciennes décisions PDF et les fichiers sont conservés sans conversion implicite en approbation Word. Pas de nouveau rôle ni migration SQL dans cette correction ; la sauvegarde inclut chaque mise en page PDF privée. [Contrat de référence](../../avereo-app-rapport/workflows/relecture-validation-pdf.md).


# Écart n — revue privée des rapports

Le lot demandé le 25 novembre ajoute au conteneur App.jsx l'import de ReportReviews et son affichage sous les documents partagés. Le composant est également raccordé à la rubrique des rapports privés du bien. Le calcul des travaux, la persistance du bien et le devis PDF ne sont pas modifiés.

[check-parity.mjs](../tests/check-parity.mjs) inverse exactement les deux nouvelles lignes du conteneur avant les huit substitutions UX existantes, puis conserve la comparaison intégrale avec la source CONNECT historique. Chaque ajout doit être présent une fois : un autre changement n'est pas ignoré par cette inversion. Le premier passage CI avait signalé le raccordement supplémentaire non déclaré ; cette déclaration rétablit le contrôle sans supprimer ni affaiblir ses assertions historiques.

Le [contrat de relecture](../../avereo-app-rapport/workflows/relecture-validation-pdf.md) décrit les nouveaux composants, les routes, la colonne nullable et les archives privées. Les demandes et décisions ont leur contrôle propre ; cette parité ne constitue pas leur validation métier. Les réserves du PDF automatique et du SSO hébergé restent ouvertes ; aucune livraison de ce complément.
