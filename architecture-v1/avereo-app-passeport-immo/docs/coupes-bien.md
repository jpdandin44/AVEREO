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

Les plans fournis sont conservés dans chaque projet avec la ligne transversale
A-A. Les deux coupes représentent la distribution du niveau dessiné. Les vues
avant/après sont à la même échelle graphique indicative ; les cotes font foi.
Les pièces gauche, centrale et droite permettent de comparer les cloisons.

## Dimensions et limites

- Avant : largeurs lues de 3,13 / 4,40 / 2,26 m ; hauteur sous plafond de 2,48 m indiquée sur le plan.
- Après : largeurs lues de 3,13 / 3,83 / 2,70 m ; cloisons repérées à 10 cm. La hauteur de 2,48 m est reconduite par hypothèse et reste à confirmer.
- La cote d’ensemble « 1095 ENV. » est approximative. Les murs extérieurs sont schématiques, sans cote d’épaisseur.
- Planchers, altimétrie réelle, autres niveaux et géométrie verticale de la toiture ne sont pas relevés. Les façades apportent le contexte, sans combler ces inconnues.

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
relevé. Le générateur Coupe peut appliquer ses valeurs par défaut lors d’une
nouvelle génération ; elles ne doivent pas être assimilées aux mesures du bien.

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
Une ancienne copie du diagnostic reste archivée. Ces contrôles locaux ne créent
aucune acceptation humaine ni qualification distante.
