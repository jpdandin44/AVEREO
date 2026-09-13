---
project: avereo-app-rapport
document_type: integration
title: Carte cadastrale IGN et confirmation du lieu
status: active
version: git
created: 2026-09-12
updated: 2026-09-13
owner: jpdandin
tags:
  - rapport
  - ign
  - localisation
---

# Carte cadastrale IGN et confirmation du lieu

## Fonctionnement implemente

Apres geocodage, `LocationMap.jsx` affiche une carte Leaflet 1.9.4 chargeant
directement les images publiques IGN. Elle remplace l'iframe dont le fond
restait noir. Aucun projet Google, compte, cle API ou service interne ajoute.

Deux vues sont disponibles : `Cadastre` (plan et parcelles) et `Vue aerienne`
(photographies et parcelles). Le repere correspond au point d'adresse, pas a
une parcelle selectionnee. Zoom et deplacement servent seulement a la lecture ;
`Recentrer` revient au point initial et recharge les couches.

Le bouton `Confirmer ce bien` conserve l'adresse saisie, les coordonnees et
la date dans `localisation.confirmation`. La confirmation peut etre annulee.
`Corriger l'adresse` l'annule et retourne au champ adresse dans Dossier.
Changer l'adresse ou refaire une recherche invalide la confirmation liee.
Aucun schema SQL n'est modifie. L'export conserve cette mention, pas la carte.

## Source cartographique et parametres

Endpoint public : `https://data.geopf.fr/wmts`.

| Usage | Couche | Format |
| --- | --- | --- |
| Plan | `GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2` | PNG |
| Vue aerienne | `ORTHOIMAGERY.ORTHOPHOTOS` | JPEG |
| Parcelles | `CADASTRALPARCELS.PARCELLAIRE_EXPRESS` | PNG |

Parametres communs : `SERVICE=WMTS`, `REQUEST=GetTile`, `VERSION=1.0.0`,
`STYLE=normal`, `TILEMATRIXSET=PM_0_19`. Les indices `z/y/x` sont calcules
par Leaflet. Zoom initial 18, maximum natif 19 (agrandissement possible a 20).
Les trois couches et la matrice sont confirmees par GetCapabilities le
13 septembre 2026. La couche parcellaire annonce alors l'edition 2026-06-01 ;
ce n'est pas une promesse de mise a jour quotidienne.

Les identifiants sont fixes dans `locationMap.js`. Le navigateur charge des
images de secteur ; ni nom, email, adresse en texte, notes, photos du client
ou jeton ne sont ajoutes aux requetes WMTS. Le service voit toutefois l'IP du
navigateur et le secteur consulte. Politique des images : `no-referrer`.
Leaflet et son CSS sont inclus dans le build, pas charges depuis un CDN.
Les attributions Leaflet, IGN et DGFiP restent visibles.

## Cadastre, PLU et secours

Les parcelles sont un fond de reperage, sans valeur de bornage ou preuve de
propriete. Le PLU reste consulte par le bouton existant `Carte PLU` ;
son zonage et son reglement ne sont pas superposes dans ce lot.

Une carte cadastrale visible ne garantit pas une reference dans le resultat
API Carto : les deux services sont independants. En cas de reference absente,
les champs restent renseignables manuellement ; aucune parcelle n'est deduite
du seul repere.

Une erreur de tuile ou un chargement depassant 15 secondes est signale sans
bloquer la saisie. Un chargement tardif reussi peut retablir le fond.
Le bouton Recentrer permet de reessayer ; le lien externe ouvre cartes.gouv.fr
avec les couches plan et cadastre. Sa disponibilite reste celle du fournisseur.

## Verification du 13 septembre 2026

- 31 tests frontend reussis, dont couches, formats, matrice, URL, coordonnees
  invalides et invalidation de confirmation ; build Vite reussi.
- Trois images WMTS renvoyees en HTTP 200 sur un point public de Nantes.
- Rendu reel du plan, numeros/contours cadastraux, vue aerienne et repere
  observe dans le navigateur integre sur un dossier de test nantais.
- Confirmation, correction avec focus sur l'adresse et retrait de la carte
  apres changement d'adresse verifies dans l'interface.
- Confirmation conservee apres enregistrement, rechargement du navigateur
  et reprise du brouillon local de demonstration.
- Audit dependances de production : aucune alerte. Les deux alertes de
  developpement existantes restent referencees dans la dette DT-RAP-09.

Restent a qualifier : environnement heberge, reseau interrompu et adresses
ambigues/territoires sans couverture. Aucun cache hors ligne ni export
d'image cartographique n'est implemente. Aucun deploiement realise dans ce lot.

## References officielles

- [IGN : images WMTS](https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/diffusion/wmts/).
- [Capacites publiques du service](https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetCapabilities).
- [Parcellaire Express PCI](https://www.data.gouv.fr/datasets/parcellaire-express-pci).
- [Documentation Leaflet 1.9.4](https://leafletjs.com/reference.html).
- [IGN : partage d'une carte, lien de secours](https://cartes.gouv.fr/aide/fr/guides-utilisateur/visualiseur-cartographique/partager-une-carte/).
