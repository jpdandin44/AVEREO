---
project: avereo-app-rapport
document_type: integration
title: Contexte du bien - urbanisme, relief et orientation
status: active
version: git
created: 2026-09-14
updated: 2026-09-15
owner: jpdandin
tags:
  - rapport
  - ign
  - urbanisme
  - altimetrie
---

# Contexte du bien : urbanisme, relief et orientation

## Parcours implemente dans le prototype

Site distingue quatre vues, sans quitter l'assistant :

- **Cadastre / valider le bien** : plan ou photo aerienne, confirmation
  humaine du lieu et references cadastrales ;
- **Rapport des risques** : synthese interne, relance independante et lien
  vers le rapport officiel ; voir [Georisques](georisques.md) ;
- **Carte PLU / regles** : libelles de zonage, prescriptions et servitudes
  retournes au point de visite, textes sources et saisie des regles verifiees ;
- **Relief / orientation** : facade et direction renseignees par le
  professionnel, rose des vents, puis reperage altimetrique a la demande.

Ces vues sont communes aux types de rapport. Les champs cadastre ne sont plus
affiches sous la synthese des risques. Les donnees ne sont pas un diagnostic.

## Urbanisme : sources et limites

`urbanismContext.js` interroge `https://apicarto.ign.fr/api/gpu/`
avec `geom={"type":"Point","coordinates":[longitude,latitude]}`.
Couches : `zone-urba`, `prescription-surf`, `prescription-lin`,
`prescription-pct` et `assiette-sup-s`.

Seuls les attributs utiles sont conserves : libelles, detail, code, document,
date source si fournie et URL HTTPS sans identifiants. Ni geometrie complete
ni interpretation automatique des articles du PLU. Un libelle de protection
ou de secteur n'enumere pas les interdictions effectivement applicables.

Le point de visite n'est pas l'emprise de la propriete. Les servitudes
lineaires/ponctuelles de SUP et d'autres regimes locaux ne sont pas couverts.
Une liste vide ne signifie jamais absence de regle. Les erreurs de couche
et resultats partiels sont distincts ; les listes longues sont repliables.
Le lien GPU ouvre la carte reglementaire ; le plan cadastral integre ne
superpose pas le zonage PLU.

Le champ manuel demande la regle verifiee, l'article/page, la source et la
date. Ce texte est une saisie du professionnel, pas une extraction juridique
certifiee. La lecture des textes et la confirmation aupres du service
urbanisme restent necessaires.

## Altimetrie : methode du prototype

`terrainContext.js` appelle, sur action `Etudier le relief` :

`https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json`

Parametres : `resource=ign_rge_alti_wld`, `zonly=false`,
`measures=false`, `delimiter=|`, neuf longitudes et latitudes.
Une requete fournit une grille 3 x 3, nord en haut. L'emprise est un carre
approximatif de 50 ou 100 metres de cote autour du point de visite.
Conversion locale : 111320 m/degre en latitude, correction cosinus en
longitude ; latitudes au-dela de 80 degres exclues.

Affichage : neuf altitudes, minimum, maximum, ecart et baisse relative la plus
forte entre le centre et un point peripherique. La pente indicative vaut
`100 * (z_centre - z_point) / distance_horizontale`. Aucun seuil arbitraire
de « denivele important » ou de risque n'est applique.

Une altitude nulle ou negative valide est acceptee. `null`, valeur non
numerique, sentinelle IGN `-99999`, points manquants ou coordonnees
incoherentes rendent le resultat indisponible. Un resultat plat ou un centre
plus bas que les points voisins ne vaut pas absence de risque.

C'est un MNT, pas une mesure du toit, un releve de geometre ou une simulation
hydrologique. Precision variable ; emprise pouvant inclure voirie et voisins.
Gouttieres, seuils, murs, drains et sols impermeables ne sont pas modelises.
Les observations pluviales restent a recueillir sur place dans les notes.

### Altitudes sur le fond cadastral

Dans `Relief / orientation`, le fond IGN est visible avant meme le calcul.
Choisir `Etudier le relief` pour superposer les neuf altitudes a leurs
coordonnees geographiques : nord en haut, centre nomme `Visite` et entoure
en bleu. Les minima du releve sont en turquoise, les maxima en ocre ; a
altitudes toutes identiques, aucun contraste bas/haut n'est applique.
Ces couleurs sont relatives aux neuf points, pas des niveaux de risque.

Le cadre pointille relie les points peripheriques de l'emprise de 50 ou
100 metres. Ce n'est ni la delimitation de la parcelle, ni une emprise
cadastree extraite : les parcelles sont les images du fond IGN existant.
Aucune interpolation, courbe de niveau ou trajectoire d'ecoulement n'est
inventee. Les valeurs sont des altitudes du sol, pas du toit.

Le plan et la vue aerienne sont interchangeables. `Recentrer les mesures`
recadre les neuf points. Le tableau numerique reste consultable dans un
volet repliable, notamment si les tuiles ne repondent pas.
Changer l'emprise sans lancer un nouveau calcul laisse le releve precedent
affiche, avec sa largeur et un avertissement explicite.

`terrainMapSamples` reutilise la validation de reprise : aucun marqueur
altimetrique pour des mesures absentes, invalides ou liees a un autre lieu.
Le stockage, la methode IGN et l'export chiffre restent inchanges ; la carte
n'est pas ajoutee au document Word. Pas de compte, cle, dependance ou nouvel
endpoint. Seules les tuiles des fonds deja utilises sont chargees en plus
lors de la consultation de cette vue.

Recette locale du 15 septembre : 55 tests et build reussis. Fond avant calcul,
releves 50 et 100 m, changement de fond, recentrage, avertissement d'emprise,
correspondance carte/tableau et reprise du brouillon verifies dans le
navigateur integre sur un lieu public de demonstration. Les cas absents,
invalides, anciens points, altitudes nulles/negatives et terrain plat sont
couverts par les tests unitaires. La recette tactile, les tuiles hors ligne
et l'environnement heberge restent a qualifier avant production.

## Orientation

La carte garde le nord en haut. La rose des vents affiche une fleche bleue
apres selection manuelle d'une des huit directions. L'utilisateur nomme la
facade et indique sa direction exterieure. Aucune orientation du batiment
ni direction de vent n'est deduite de l'adresse ; aucun capteur sollicite.

## Donnees, persistance et erreurs

- `urbanisme.context` : source, date, coordonnees, resultats par couche ;
  `urbanisme.notes` : verification manuelle.
- `terrain` : `analysis` (emprise, neuf mesures, indicateurs), `facade`,
  `orientation`, `notes`.
- Brouillon et JSON conservent ces objets. Le document exporte reprend
  informations et avertissements, sans image de carte.
- Les anciens brouillons recoivent les valeurs par defaut. Les mesures
  importees sont validees et les indicateurs recalcules ; un resultat lie
  a d'autres coordonnees est ignore.
- Une actualisation echouee conserve le dernier resultat date. Changer
  l'adresse ou refaire la recherche d'adresse reinitialise le contexte du
  lieu et ses notes : enregistrer/exporter avant de changer de bien.
- Delai maximal de 15 secondes, annulation a la fermeture de la vue,
  protection contre les retours obsoletes.
- Aucun nouveau schema SQL, endpoint PHP, secret, compte ou dependance.

Seules les coordonnees sont transmises aux services. Ceux-ci voient aussi
l'IP et les metadonnees reseau usuelles, mais pas les noms, emails, notes,
photos ou donnees vocales. Nouveaux appels en `no-referrer`.
Disponibilite reseau et CORS dependent des fournisseurs.

## Correction manuelle du point de visite

Lorsque le geocodage place le repere sur la rue ou sur un autre batiment :

1. Dans Site, choisir `Deplacer le point` sur le plan ou la vue aerienne.
2. Cliquer sur le batiment ou faire glisser le repere bleu. Les champs
   latitude/longitude offrent aussi une saisie au clavier.
3. Choisir `Utiliser ce point`, puis `Confirmer ce bien` avec le client.
   `Annuler le deplacement` conserve le point et la confirmation precedents.

Le mode d'ajustement est explicite : deplacer le fond de carte seul ne change
pas le dossier. Les coordonnees vides, non numeriques ou hors bornes ne sont
pas validables. L'adresse saisie et le libelle BAN restent inchanges.
Le point courant devient `cadastre.lon/lat` ; `localisation.point_manuel`
conserve longitude, latitude et date du dernier ajustement. Le brouillon,
le JSON et le document exporte conservent le point corrige.

La transition pure `visitPoint.js` invalide confirmation, references
cadastrales, zonage/contexte GPU, risques et mesures de relief de l'ancien
point. Les notes terrain/urbanisme, orientation, ecoute, observations, photos
et ressources restent conservees et doivent etre reverifiees. Le rattachement
des ressources a l'ancien point devient caduc, sans effacer leur contenu.

Cadastre, zonage et risques sont redemandes aux services existants avec les
nouvelles coordonnees, sans repasser par BAN. Les couches detaillees GPU sont
chargees dans Carte PLU ; le relief exige une nouvelle action explicite.
Les retours d'une recherche precedente sont ignores. Une erreur de service
ne restaure pas l'ancien point et n'invente pas de resultat.

`Actualiser ce point` reutilise la correction. Seule l'action distincte
`Rechercher l'adresse a nouveau` revient au geocodage et reinitialise son
contexte, selon la regle historique ci-dessus. Exporter le JSON avant cette
action si les notes doivent etre archivees. Aucun nouveau fournisseur,
compte, secret, endpoint PHP, schema SQL ou dependance.

### Verification du 15 septembre 2026

- `npm.cmd test` : 52/52 reussis ; `npm.cmd run build` reussi.
- Tests cibles : invalidation des donnees derivees et associations,
  conservation des notes/photos/adresse, valeurs invalides, passage JSON et
  nouvelle confirmation.
- Navigateur, brouillon fictif sur un lieu public nantais : clic, glisser-
  deposer, annulation, application du point, actualisation cadastre/PLU/risques,
  rechargement/reprise du point confirme, saisie vide bloquee et apercu
  exporte controles. Aucune erreur console observee. L'adresse de la capture
  utilisateur n'a pas ete utilisee pour la recette.
- La qualification hebergee via CONNECT, le reseau coupe et les interactions
  tactiles restent a tester, ainsi que le telechargement/reimport JSON et
  l'ouverture Word native. Les retours reseau desordonnes sont proteges par
  le compteur existant mais n'ont pas ete simules dans l'interface.
  Aucune mise en production dans ce lot.

## Verification du 14 septembre 2026

Les reponses publiques au point de demonstration nantais (-1.555923,
47.217762) contiennent un zonage US, trois prescriptions surfaciques, des
servitudes surfaciques et une altitude centrale de 7,4 m. Ce constat de test
n'est pas une garantie de couverture.

**39 tests passent et le build final est reussi** (1593 modules). Controle
dans l'apercu local `http://127.0.0.1:52872/` : accords places en tete,
activation/desactivation des commandes de dictee selon l'accord, synthese
des risques et actualisation dans la page, attributs GPU et note manuelle,
rose orientee sud-est et neuf altitudes. Le rechargement/reprise conserve
les donnees, dates et notes ; l'apercu du document reprend les nouvelles
sections et leurs limites. L'oubli du verrouillage de dictee dans l'etape
Export a ete corrige et son blocage sans accord verifie.

Les controles navigateur initialement indisponibles ont pu etre repris.
Les cas de reponse manquante/invalide, erreur GPU et reprise JSON sont
couverts par les tests automatises ; ils n'ont pas tous ete simules dans
l'interface. La dictee reelle, le fichier Word dans un traitement de texte,
le cycle de telechargement/reimport JSON et le parcours heberge via CONNECT
restent a qualifier. Aucun enregistrement micro, deploiement ou merge.

### Recette reproductible (perimetre verifie ci-dessus)

1. Reprendre un brouillon de demonstration Visite Globale : accords sous
   « Informations de base, client et mission », micro inactif sans accord.
2. Cocher/retirer l'accord dictee ; verifier l'activation/desactivation des
   commandes vocales sans changer les notes.
3. Rechercher une adresse publique, confirmer le lieu puis ouvrir
   Rapport des risques : synthese dans la page, pas de nouvel onglet.
4. Tester Actualiser, l'erreur reseau et le maintien du resultat date.
5. Ouvrir Carte PLU / regles, examiner sources et couches indisponibles,
   saisir une note referencee et ouvrir le lien reglementaire.
6. Choisir une facade et une direction, demander le relief ; verifier
   emprise, chiffres, avertissements et absence de couverture.
7. Enregistrer/reprendre et exporter/importer le JSON ; verifier aussi
   l'apercu du document et ses nouvelles sections.
8. Modifier l'adresse et verifier qu'aucun contexte de l'ancien bien
   n'est attribue au nouveau. Qualifier ensuite en preproduction.

## References officielles

- [API Carto : module GPU](https://apicarto.ign.fr/api/doc/gpu).
- [Contrat utilisateur GPU](https://apicarto.ign.fr/api/doc/pdf/docUser_moduleUrbanisme.pdf).
- [IGN : calcul altimetrique](https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/calcul-altimetrique/).
- [Reference du service altimetrique](https://data.geopf.fr/altimetrie/api/index.html).
