---
project: avereo-app-passeport-immo
document_type: user-guide
title: Coupes avant et après travaux du cas local
status: active
version: git
created: 2026-10-14
updated: 2026-10-14
owner: jpdandin
tags: [passeport-immo, coupe, documents, local]
---

# Coupes avant et après travaux du cas local

Le responsable demande une comparaison avant/après, puis son intégration dans
le dossier documentaire du bien. Deux projets modifiables sont chargés dans
l’application Coupe locale, dans l’éditeur CAO, avec « Coupe projet ». Les SVG
sont exportés par Coupe ; ils constituent les sources vectorielles du PDF
comparatif A3 paysage de deux pages. Le PDF est importé dans Passeport Immo,
catégorie « Plans et façades », sous le titre « Coupes A-A — avant et après travaux ».

Le complément demandé le même jour enrichit le titre avec « lecture thermique ».
Il utilise les groupes thermiques natifs de Coupe et leurs commandes de couleur,
ainsi que les champs `thermalZone`, `boundaryType`, source, fiabilité et commentaire
des éléments traversés. Les scènes gardent leurs cotes lues ; aucun élément de
relevé n’est marqué validé.

Les plans fournis sont conservés dans chaque projet avec la ligne transversale
A-A. Les deux coupes représentent la distribution du niveau dessiné. Les vues
avant/après sont à la même échelle graphique indicative ; les cotes font foi.
Les pièces gauche, centrale et droite permettent de comparer les cloisons.

## Dimensions et limites

- Avant : largeurs lues de 3,13 / 4,40 / 2,26 m ; hauteur sous plafond de 2,48 m indiquée sur le plan.
- Après : largeurs lues de 3,13 / 3,83 / 2,70 m ; cloisons repérées à 10 cm. La hauteur de 2,48 m est reconduite par hypothèse et reste à confirmer.
- La cote d’ensemble « 1095 ENV. » est approximative. Les murs extérieurs sont schématiques, sans cote d’épaisseur.
- Épaisseurs des planchers, altimétrie et géométrie verticale de la toiture ne sont pas relevées. Les volumes adjacents renseignés par le responsable apportent le contexte, sans fournir leurs dimensions ou leur chauffage.

## Lecture thermique et provenance

Les groupes chauffés, non chauffés et les zones à confirmer sont distingués par
couleurs, hachures et libellés. Le support bas utilise une catégorie propre
terre/sol. La mitoyenneté d’une paroi et le caractère chauffé de son voisin sont
des informations distinctes ; un local adjacent non chauffé n’est pas assimilé
à l’extérieur. Les confirmations du responsable sont conservées dans les
projets privés et visibles sur le PDF, avec le sens gauche/droite annoncé.

Le DPE fourni date du 23 février 2012 : ses indications de chauffage et de support
bas sont des sources historiques. L’affectation du chauffage à chaque pièce est
déduite et reste à confirmer ; elle ne constitue pas un relevé après travaux.
Les renseignements actuels du responsable complètent les environnements voisins.
Le chauffage des volumes voisins et les épaisseurs restent inconnus.

Le tableau des éléments de Coupe arrondit ses métriques par pas de 5 cm. Il sert
au repérage approximatif. Les cotes lues sur les plans et la hauteur sous plafond
sont conservées dans la scène CAO et le PDF ; les commentaires des éléments
reprennent les largeurs sources. Le type natif des parois limites représente
l’enveloppe du volume et ne démontre pas leur rôle porteur.

Ces coupes de principe nécessitent un relevé complémentaire avant un usage
d’exécution. Aucun statut « éléments validés » n’est déclaré dans Coupe.

## Fichiers locaux et reprise

Le sous-dossier `coupes/` du dossier source réel contient :

- `coupe-a-a-avant-travaux.coupe.json` et `coupe-a-a-apres-travaux.coupe.json` : projets sauvegardés par Coupe, avec plans et scène CAO modifiable.
- `coupe-a-a-avant-travaux.svg` et `coupe-a-a-apres-travaux.svg` : exports vectoriels natifs.
- `coupes-a-a-avant-apres-travaux.pdf` : restitution comparée, consultable dans Passeport Immo.

Pour reprendre : « Charger » le projet, ouvrir « Éditeur CAO », puis « Coupe projet ».
Modifier la scène existante ; la régénération automatique nécessite de renseigner
les éléments et les épaisseurs manquants. La valeur de plancher du projet est
mise à zéro pour signaler qu’aucune épaisseur n’est retenue : elle n’est pas un
relevé. Le générateur Coupe peut appliquer ses valeurs par défaut et ses arrondis
lors d’une nouvelle génération ; ils ne doivent pas être assimilés aux mesures du bien.
Le paramètre de toiture par défaut n’est pas utilisé dans la scène CAO conservée.
Une nouvelle génération complète nécessite de renseigner les autres niveaux,
la toiture et les épaisseurs auparavant.

Les fichiers clients, images de plans, exports et reçus restent hors Git. Le
module documentaire accepte le PDF ; les projets JSON et SVG restent dans le
dossier source. L’import d’un dossier contenant ces formats nécessite de
sélectionner séparément les pièces prises en charge.

## Vérifications constatées

Les deux SVG sont exportés dans l’interface Coupe. Chaque page du PDF est rendue
et inspectée ; titres, cotes et réserves restent lisibles. Dans Passeport Immo,
les pages 1 et 2 sont consultées dans le lecteur intégré. La copie téléchargée
est identique au PDF source par son empreinte SHA-256. Le dossier comporte six
documents actifs : cinq PDF source de 33 pages et ce PDF comparatif de deux pages.
Les anciennes copies du diagnostic et les esquisses précédentes restent archivées.
La sauvegarde privée des premiers projets et exports est conservée dans
`coupes/.avant-thermique/`. Ces contrôles locaux ne créent
aucune acceptation humaine ni qualification distante.
