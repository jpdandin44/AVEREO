---
project: avereo-app-rapport
document_type: functional-specification
title: Repérage des observations sur les vues du Cricq
status: active
version: git
created: 2026-11-02
updated: 2026-11-02
owner: jpdandin
tags: [rapport, observations, plans, cricq, word]
---

# Repérage des observations

## Périmètre autorisé

Première version locale centrée sur les rapports du Cricq : rattacher les cinq
images fournies au dossier, placer des repères sur les niveaux et coupes, et
les reprendre dans le Word natif. La dictée et l'enregistrement des attentes
du candidat précédent `63ec279` sont conservés.

Le suivi canonique est le bloc `rapportObservationPlans20261102` de
`C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json`.
Les quatre phases sont **Cadrage → Développement local → Préproduction → Mise en production**.
Ce document décrit la fonction ; les versions, contrôles et accords restent dans le suivi.

## Parcours

Dans Observations, « Repérage sur plans et coupes » reçoit plusieurs PNG/JPEG.
Choisir une vue et une observation, puis « Placer le repère » et cliquer/toucher
le fond. « Localiser sur un plan » dans une fiche sélectionne ce constat et
ramène vers le plan. Un repère se déplace par glissement, nouveau placement
ou flèches du clavier (Maj accélère). Le placement clavier commence au centre
avec Entrée dans la zone de placement. Le zoom va de 100 à 300 %, avec défilement.

Un constat peut avoir un point sur plusieurs vues, avec le même numéro dans
le dossier courant et le Word. Le numéro suit l'ordre des observations ; le
lien persistant utilise leur identifiant, pas ce numéro. Retirer un repère ne
supprime ni le constat ni ses photos. Les champs Pièce / zone et Élément restent
disponibles, y compris sans plan. Le titre, type et source des vues sont modifiables ;
le remplacement du fond et la suppression d'une vue ne font pas partie de cette première version.

## Données de référence

Le JSON du dossier est l'unique source de l'image et des coordonnées. Le bloc
optionnel `plans` contient des objets `id`, `title`, `kind` (`niveau` ou `coupe`),
`source`, `src` (image incorporée), `width`, `height`. Chaque observation peut
contenir `reperes: [{planId, x, y}]` : coordonnées entre 0 et 1, de gauche à droite
et de haut en bas, sur l'intégralité de l'image source. Un seul repère par constat
et par vue. Il n'existe aucun calcul automatique de correspondance niveau/coupe.

Ces champs suivent le brouillon, l'import/export JSON et le payload privé de
l'API existante. Aucune migration SQL. Le contrôle PHP borne et valide les images,
leurs dimensions, les identifiants et les références ; les contrôles d'accès existants
restent appliqués. Limites : 20 vues, 4 Mio par image, 24 millions de pixels par vue,
50 Mio pour l'import JSON (aligné sur le plafond API par défaut ; une configuration
serveur plus restrictive reste possible). Les anciens dossiers sans vues restent utilisables.

Les images fournies sont `RDC+Garage.png`, `R+1.png`, `COMBLE.png`, `CoupeA-A_2.png`
et `CoupeB-B_2.png`. Les originaux ne sont pas modifiés. La copie Cricq préparée
dans le répertoire privé `.local` contient les cinq vues sans emplacement inventé.
Ces pièces privées ne sont pas incorporées aux assets publics ni versionnées avec le code.
Les positions de recette sont conservées uniquement dans une copie distincte.

## Word et aperçu

L'expert reprend toutes les vues, leurs sources, les numéros et la légende des
constats repérés. Une vue vide indique qu'aucune observation n'y est repérée.
Chaque fiche renvoie aux vues qui portent son numéro.

La synthèse client reprend uniquement les vues portant un constat explicitement
sélectionné dans le livrable, et uniquement ses repères ; les numéros d'origine
sont conservés. Les constats non retenus ne sont pas révélés par une légende.

L'aperçu superpose les repères au fond. Pour Word, le navigateur produit une
image dérivée avec les mêmes coordonnées et numéros : les repères sont incorporés
au DOCX et restent visibles hors de l'application. Le fond original et les points
séparés restent dans le dossier JSON. Aucun service externe d'image ou d'export.

## Contrôles attendus

- Import des cinq images du Cricq, distinction niveau/coupe, sources lisibles.
- Placement, déplacement, zoom, retrait et lien fiche/plan sur bureau et petit écran.
- Même constat sur deux vues ; mêmes numéros dans l'aperçu, les légendes et Word.
- Sauvegarde/reprise et aller-retour JSON sans perte des vues ni des anciens champs.
- Rejet des images distantes, types non autorisés, dimensions et références invalides.
- Export expert/client, images incorporées, absence de fuite des constats non sélectionnés.
- Anciens dossiers conservés ; données Cricq originales et hébergées inchangées.
- Tests existants, contrôles PHP, build et inspection visuelle des documents de recette.

Les résultats réels et limites sont consignés dans le suivi canonique. Les essais
locaux ne constituent ni une recette authentifiée hébergée ni une validation métier.

## Suite reportée

Sur instruction du responsable, la validation de l'expert et ses statuts sont
reportés. Leur futur périmètre est la génération des PDF finaux stockés dans
Passeport Immo. Aucun statut de revue, signature nouvelle, export PDF final ou
transfert vers Passeport Immo n'est réalisé dans ce lot. Les zones, tracés de fissures,
mesures et détection automatique de pièces restent hors de cette première version.
