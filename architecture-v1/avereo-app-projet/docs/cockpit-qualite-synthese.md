---
project: avereo-app-projet
document_type: guide-utilisateur
title: Synthèse des applications et qualité des preuves
status: active
version: git
created: 2026-11-19
updated: 2026-11-19
owner: jpdandin
tags: [cockpit, ux, criteres, preuves, lecture-seule]
---

# Synthèse et détail à la demande

La vue d’ensemble présente une carte par application, une recherche et des filtres
(réserves, liens ou pièces à compléter, critères absents). Les quatre indicateurs
comptent les applications, pas la somme des critères de plusieurs projets.
Un suivi commun peut appartenir à plusieurs applications. Les comptes portent sur
les suivis consultables, historique inclus : ils ne représentent pas une charge
restante ni une surveillance instantanée des applications.

Chaque carte distingue :

- critères avec décision individuelle humaine, sans preuve liée ou avec lien incomplet ;
- pièces consultables dans cet environnement, références externes, pièces disponibles
  à la source mais non publiées, et références manquantes/non qualifiées ;
- nombre de suivis dont la phase courante déclarée correspond à chacune des quatre
  phases **Cadrage, Développement local, Préproduction, Mise en production** ;
- prochaine action du premier suivi affiché, sans la présenter comme une priorité arbitrée.

« Versions, preuves et sources » déplie les badges de livraison, versions GitHub,
copies locales datées et indicateurs de date/version des pièces. Le bouton principal
ouvre les suivis existants et leurs critères. Gantt et Patrimoine restent disponibles.
Les dates de collecte/réception/publication sont regroupées dans un volet ; une
alimentation en défaut ou non attestée reste dépliée, jamais masquée en succès.

## Contrat des indicateurs

`iterations[].quality` est calculé à la lecture, depuis la vue effectivement servie,
sans migration des instantanés. Node et le lecteur PHP appliquent les mêmes comptes.
Le résumé ne charge aucun contenu de pièce dans le navigateur et ne déclenche pas
88 lectures de détail. Les anciennes publications restent compatibles.

La disponibilité ne prouve ni le respect du critère, ni sa version, ni une recette.
Un document sans SHA reste compté comme sans version même si son ancien libellé
de fraîcheur est `current`. Les catégories date/version peuvent se recouper.
Aucun pourcentage global arbitraire ou validation implicite n’est produit.

Les critères sans `proofIds` gardent ce champ inchangé. Un document explicitement
déclaré dans la même phase peut être un contexte, pas une preuve d’acceptation.
Les critères inexistants dans les sources restent à cadrer ; aucun modèle générique
n’est rempli automatiquement à la place du responsable.

## Sécurité et livraison

Authentification, autorisation exacte propriétaire/global et API GET uniquement
inchangées. Le lecteur calcule les comptes après autorisation, dans la même copie
privée signée. Aucun accès supplémentaire, écriture de décision ou accès production.
Le candidat local et la CI doivent être qualifiés avant une installation autorisée.
La qualification des données privées et son reçu sont conservés hors du dépôt public,
dans le pilotage AVEREO ; ils ne sont pas embarqués dans le paquet de code.

## Vérifications

Tests de comptage/dédoublonnage, inconnues, non-mutation, parité PHP/Node,
compatibilité de stockage signé, contrôles d’accès existants et compilation
publique/privée. La recette navigateur et l’état hébergé exigent un reçu distinct.
