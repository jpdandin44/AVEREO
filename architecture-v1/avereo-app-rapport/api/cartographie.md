---
project: avereo-app-rapport
document_type: integration
title: Plan IGN et confirmation du lieu
status: experimental
version: git
created: 2026-09-12
updated: 2026-09-12
owner: jpdandin
tags:
  - rapport
  - ign
  - localisation
---

# Plan IGN et confirmation du lieu

## Integration implementee

Apres geocodage, `LocationMap.jsx` affiche une iframe vers
`https://cartes.gouv.fr/explorer-les-cartes/embed`. `locationMap.js` valide les
coordonnees, construit les parametres `c` (centre), `p` (repere), `z` (zoom),
`l` (fond Plan IGN) et `permalink`. Aucun nom, email, note ou secret n'est
transmis. Le domaine est fixe, les coordonnees sont finies et bornees.

Le composant conserve une ouverture externe de secours et un recentrage. La
navigation dans l'iframe n'est pas recuperee dans Rapport. Pour changer de
bien, corriger l'adresse puis refaire la recherche. La confirmation stocke
l'adresse saisie, les coordonnees et la date ; un changement invalide celle-ci.
Ce n'est pas une preuve cadastrale ou de propriete.

## Sources officielles verifiees le 12 septembre 2026

- [Guide IGN : partager et integrer une carte](https://cartes.gouv.fr/aide/fr/guides-utilisateur/visualiseur-cartographique/partager-une-carte/).
- [Route embed du visualiseur](https://github.com/IGNF/cartes.gouv.fr-entree-carto/blob/main/src/router/index.ts).
- [Parametres de permalien du visualiseur](https://github.com/IGNF/cartes.gouv.fr-entree-carto/blob/main/src/composables/urlParams.js).
- [Modele iframe officiel](https://github.com/IGNF/cartes.gouv.fr-entree-carto/blob/main/src/components/carte/control/ShareModal.vue).

## Qualification et limites

Les tests unitaires verifient le domaine, les coordonnees, l'ordre lon/lat et
l'invalidation d'une confirmation apres modification. La route embed charge
les commandes de zoom et de couches dans le navigateur integre, mais le fond
est reste noir : le rendu et le repere ne sont pas valides a ce stade.

Prochaine action : tester dans Chrome sur un lieu public connu, verifier le
fond et le repere, puis le rendu dans l'iframe Rapport. En cas d'echec, verifier
les requetes de tuiles, la couche IGN et les restrictions du navigateur. Ne
pas assimiler un `load` d'iframe ou un build reussi a une carte exploitable.

La disponibilite du service, ses conditions d'utilisation et le reseau sont
externes. Aucun cache de carte hors ligne ou export de l'image IGN n'est
implemente ; le document Rapport conserve la confirmation du lieu, pas la carte.
