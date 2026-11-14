---
project: avereo-app-rapport
document_type: requirements
title: Exigences de Rapport AVEREO
status: active
version: git
created: 2026-09-10
updated: 2026-11-13
owner: jpdandin
tags:
  - rapport
  - exigences
  - habitologie
---

## Photos préparées — reprise du 13 novembre

Proposer recadrage, rectangle, flèche, commentaire, annuler/rétablir et choix explicite de la copie utilisée dans le rapport, sans réécrire `photo.src` ou le lien privé. Conserver les opérations et le choix après reprise du brouillon et export/import JSON. Les restitutions expert/client suivent le même choix tout en respectant le filtrage client. La copie peut retirer des métadonnées EXIF ; les octets d’origine restent conservés. Aucun gain de poids total du dossier n’est garanti : l’original et la copie restent dans le JSON, limité à 50 Mio.

Avant activation du stockage privé, les fichiers sans ligne SQL et les temporaires abandonnés doivent consommer le quota. Les réservations SQL restent comptées si le fichier manque ; aucun effacement automatique. [Critères, bornes et vérifications](docs/photos-rapport-edition.md). La recette MariaDB et les paramètres hébergés restent à qualifier.

## Dossier complet — demande du 13 novembre

Le responsable doit pouvoir charger et récupérer le contenu complet présent dans le dossier : écoute, textes, explications, conseils, photos, plans, signature et champs inconnus compatibles. Une ligne de résumé ou un horodatage seul ne constitue pas un dossier. Une copie de structure fictive doit être identifiée avant chargement ; elle ne peut reconstituer ce qui a été retiré.

Le téléchargement serveur conserve les octets et les droits existants. Avant remplacement d’un brouillon, présenter les compteurs et permettre son export ou l’annulation. Un import est indépendant du source ; une confirmation de sauvegarde en ligne doit correspondre au contenu relu, sans effacer les saisies intervenues pendant l’envoi. [Critères et réserves](docs/partage-tests-et-stockage.md).

## Photos — état vérifié le 13 novembre

La première tranche locale conserve et rouvre les octets originaux JPEG/PNG/WebP sous le propriétaire courant du dossier, avec empreinte contrôlée, refus des autres propriétaires et sauvegarde/restauration locale conjointe. Le lien facultatif ne doit altérer aucun champ existant ni `photo.src`. Une opération tardive ne doit pas rattacher un résultat à une photo ou un dossier remplacé ; l’enregistrement en ligne attend la fin d’un envoi.

L’allègement du JSON, la version recadrée/annotée, le choix avant export et la qualification hébergée restent des exigences à réaliser. Les limites d’hébergement, la rétention et les transferts de propriété sont encore à décider. [État par critère](docs/photos-originales-et-annotations.md).


## Lot 0 du 12 novembre — observations

Ordre, numérotation et sélection cohérents entre saisie, plans et Word ; réorganisation dans une même phase sans perdre les données ; libellé partagé « Conseils habitologue » et nouvelle création en Visite Globale. Les [critères du lot 0](docs/lot-0-observations.md#critères-fonctionnels) sont la référence de ce complément et précisent les évolutions par rapport au candidat Habitologue ci-dessous.

## Lot Habitologue du 12 novembre — premier candidat

Choix explicite et réversible du profil ; Observations avec Constat, Explications et Conseils d’habitologue ; URL sûres et persistantes ; rubriques 4–6 masquées pour Habitologue dans l’écran et les deux Word. Anciens dossiers et données de décision conservés. [Critères](docs/profil-habitologue.md).


Le propriétaire doit pouvoir partager une copie indépendante du seul rapport ouvert avec les choix métier nécessaires aux tests. [Périmètre des champs et accès](docs/partage-tests-et-stockage.md).

## Photos originales et versions annotées — besoin du 12 novembre

Conserver les originaux dans un espace privé du dossier en ligne, accessible avec CONNECT, puis proposer recadrage, commentaires et formes sur une version dérivée du rapport. Aucune optimisation ne supprime le seul exemplaire d'un original : la compression de nouvelles photos (2400 px, JPEG 0,88, réglage proposé) reste un [module isolé non activé](docs/compression-photos.md) tant que les originaux ne sont pas conservés et qualifiés. Les 500 Mo concernent le chargement dans Passeport Immo, pas un quota de Rapport (JSON par défaut : 50 Mio). [Critères, phases et décisions à prendre](docs/photos-originales-et-annotations.md).

## Essai temporaire — besoin du 2 novembre

Limiter un compte personnel à Rapport et RGA pendant une période explicite de sept jours, avec refus des appels serveur après échéance, y compris depuis une session déjà ouverte. Vérifier la propriété des dossiers et distinguer brouillon de navigateur et dossier serveur. [État et critères](docs/essais-temporaires.md).


## Repérage sur les vues du Cricq

Localiser manuellement les constats sur les trois plans de niveau et les deux coupes fournis ; conserver les coordonnées, le lien au constat et les images avec le dossier. Même numérotation dans les vues et les restitutions. L’expert reçoit toutes les vues ; le client reçoit uniquement les repères des constats explicitement retenus. Les anciens dossiers doivent rester utilisables. [Critères détaillés](docs/reperage-observations.md#contrôles-attendus).


## Saisie de Validation et export — 2 novembre 2026

Les champs textuels de Validation et export doivent proposer la dictée selon l'accord existant de Visite Globale. Chaque attente doit disposer d'un enregistrement explicite, avec distinction visible entre brouillon local et copie serveur et sans validation métier implicite. [Comportement et critères](docs/aide-decision-demo.md#saisie-vocale-et-enregistrement-explicite-des-attentes).


## Droits RGA — précision du responsable

RGA doit être déclarée comme application distincte dans CONNECT. À la première déclaration, reprendre les droits actuels de Rapport puis les rendre indépendants. L’ouverture de la carte, son iframe et la superposition dans Rapport requièrent une session RGA valide. Les résultats déjà enregistrés dans un dossier restent consultables et exportables avec les droits de Rapport.


## RGA — demande du 2 novembre 2026

Complément demandé après essai : voir simultanément les couleurs RGA, les
parcelles, les bâtiments et le repère. Transparence réglable, masquage réversible
et recentrage sans déplacer ni reconfirmer le bien. Les contours simplifiés
conservent leurs limites de précision malgré le fond cadastral.

Rechercher un bien depuis une tuile CONNECT ou depuis Rapport, localiser son point, conserver séparément la lecture indicative de la carte et la réponse Géorisques datée. Aucun écrasement automatique de brouillon, aucune reprise depuis un autre point, aucune interprétation « sans risque » d’une absence de données. [Critères et parcours](api/rga.md).

## Aide à la décision demandée le 30 octobre

La séance du 3 novembre réserve une durée égale aux Tilleuls et au Cricq. Attentes/projet distincts, liens, actions et comparaison sont définis par la [spécification du lot](docs/aide-decision-demo.md), source unique des critères. La structure et les corrections du 1er novembre sont livrées et contrôlées en préproduction ; leurs preuves restent distinctes de celles du 24 octobre.

Le pourcentage de complétude représente les champs essentiels saisis, sans valoir revue métier ou accord des habitants, même à 100 %. Photo/caméra et dictée doivent être décrites selon leurs accords indépendants. Les cas de présentation conservent les inconnues et leurs sources ; l'âge d'un composant n'entraîne pas de durée résiduelle calculée. La séance de 90 minutes doit prévoir le renouvellement CONNECT de la session applicative de 30 minutes.


## Intégration des livrables — 24 octobre 2026

Le choix expert/client, le branding, quatre illustrations pédagogiques et les
annexes propres au dossier sont implémentés. Le Word est un `.docx` incorporant
les images ; le JSON conserve tous les champs même en mode client. Les anciens
dossiers s'ouvrent en expert sans visuel ajouté automatiquement. La synthèse
client est rédigée par le professionnel, avec au plus trois constats choisis.
Les valeurs libres importées restent affichées sans reclassement de gravité.
Critères et procédure : [procédure de transmission](docs/transmission-generation-rapports.md). Qualification hébergée et revue métier distinctes.

# Exigences de Rapport AVEREO

## Livrables expert et client demandés le 24 octobre

Le même dossier doit permettre de produire un rapport détaillé pour validation
experte, utilisable ensuite par les professionnels, et une synthèse illustrée
limitée à l'essentiel pour le client. Les deux doivent porter le branding
AVEREO et présenter des visuels lisibles, légendés et reliés au raisonnement.
Ces sorties sont distinctes des catégories de visite existantes. Leurs contenus,
critères de présentation, référence Maison du Cricq et circuit de revue sont
centralisés dans le [workflow Habitologie](workflows/workflow-habitologie.md#deux-livrables-avereo-demandés-le-24-octobre).
Modèles locaux préparés et rendus pour revue (26 pages expert, 6 pages client) ;
références éditoriales conservées. Les deux sorties sont désormais intégrées et livrées en préproduction ; voir le point de reprise. Chaque visuel doit être sourcé, relié à une question de l’expertise et identifié comme constat, principe ou simulation ; les résultats illustratifs ne sont pas des mesures du bâtiment. L’exemple Cricq conserve cinq
observations et quatre photos. Les listes doivent afficher fidèlement les
valeurs importées, notamment une gravité non qualifiée, sans substitution
visuelle par « Mineure » ; correction et recette à réaliser.

## Lot demandé le 24 octobre — critères à vérifier

- En préproduction, modifier un constat du cas fictif Tilleuls, sauvegarder en ligne, rouvrir depuis la liste, retrouver la modification dans l’aperçu et l’export Word/JSON.
- Conserver les photos et les champs existants ; proposer une sauvegarde JSON du brouillon avant remplacement. Vérifier erreur réseau, absence de rapport, refus d’accès et reprise d’un ancien dossier.
- Afficher explicitement le RGA, sa source et la date de consultation ; ne jamais assimiler une donnée absente à une absence de risque.
- Ouvrir les cartes France et Haute-Garonne depuis Rapport préproduction avec accès CONNECT obligatoire. Distinguer la carte territoriale du statut au point interrogé.
- Maintenir « Suivant » accessible : déconnexion dans l’en-tête, sans chevauchement sur bureau et écran étroit ; conserver la dernière saisie avant sortie.
- Garder AVEREO en maintenance. La nouvelle version n’a aucune autorisation de production ni de fusion implicite.

Ces critères ne sont pas encore tous exécutés : voir le [point de reprise](docs/reprise-demo-philippe.md).


## Exigences fonctionnelles durables

- Le moteur de rapport technique, ses brouillons, photos, dictee, signature et
  exports restent disponibles sans regression volontaire.
- Une nouvelle création propose uniquement `Visite Globale` et commence dans
  cette catégorie. Les dossiers techniques existants conservent leur catégorie
  et leurs sous-catégories ; ce type est masqué à la création depuis le lot 0 local.
- `Visite Globale` demande un type d'habitation parmi `Maison`, `Appartement`,
  `Immeuble collectif` et `Autre habitation`, avec `A preciser` comme valeur
  transitoire non validante.
- Toute `Visite Globale` suit un seul parcours d'analyse dans l'ordre
  `Eau -> Air -> Terre -> Feu`. Ces dimensions ne sont ni des types
  d'habitation ni des sous-categories exclusives.
- L'etape `Protocoles` de `Visite Globale` accueille le fil conducteur en
  en-tete. Les nouveaux dossiers commencent sans controle selectionne ; seuls
  les sujets explicitement identifies a l'ecoute suggerent des selections.
  Les choix manuels priment et les anciens brouillons conservent leurs choix.
  Un controle non retenu n'est jamais presente comme verifie.
- Chaque phase peut etre desactivee depuis son numero ou son nom, puis
  reactivee avec les choix precedents. Une exclusion manuelle prime sur les
  suggestions de l'ecoute ; aucun constat ni photo n'est supprime. La phase
  reste visible et explicitement non retenue dans l'interface et les exports.
  L'ajout/rattachement de nouveaux constats a cette phase demande sa
  reactivation. Les anciens brouillons sans indicateur restent disponibles
  dans les quatre phases, sans selection globale de controles.
- L'etape `Observations` de `Visite Globale` regroupe les constats par phase et
  permet de les rattacher a un point du protocole. Une observation historique
  sans phase reste visible dans `A classer` et n'est jamais reclassee
  automatiquement.
- Un dossier `Visite Globale` affiche dans l'etape `Dossier` une section
  `Ecoute client` pour le motif de visite, les attentes, les preoccupations,
  les usages du logement et le contexte d'occupation, ainsi que le choix du
  bien, les travaux passes, le besoin reformule, les criteres de reussite et
  les contraintes. La reformulation peut etre confirmee avec le client ; sa
  modification annule cette confirmation. Aucun besoin n'est deduit par IA.
- Les accords pour les photos et la dictee sont conserves dans le dossier. Les
  commandes correspondantes restent desactivees tant que l'accord n'est pas
  enregistre. La dictee produit uniquement du texte et aucun fichier audio
  n'est conserve.
- Les donnees d'ecoute utilisent le brouillon, l'import/export JSON, la
  sauvegarde serveur et l'export Word existants. Elles ne sont pas affichees
  dans un rapport technique.
- `Assistance avant-projet`, `Diagnostic specifique` et
  `Reception de travaux` restent disponibles dans le code comme modules
  complementaires masques dans l'interface de creation.
- Tous les rapports utilisent le meme assistant : `Dossier`, `Site`,
  `Protocoles`, `Observations` et `Export`, avec des adaptations futures
  conditionnees par la categorie principale.
- Les brouillons historiques restent lisibles. Les anciennes denominations
  sont normalisees vers les categories actives et les sous-categories
  techniques historiques sont conservees sans reclassement metier arbitraire.
- Un ancien dossier `Reception de travaux` reste lisible mais ce type n'est
  plus selectionnable pour un nouveau dossier.
- Un ancien brouillon du prototype Habitologie ou du type
  `Rapport Habitologue` est converti vers `Visite Globale` sans ouvrir un
  second moteur ni lui attribuer artificiellement un type d'habitation. Une
  ancienne valeur `Eau`, `Air`, `Terre` ou `Feu` devient `A preciser`.
- Apres une recherche d'adresse ayant fourni des coordonnees valides, l'etape
  `Site` propose l'ouverture du rapport officiel Georisques correspondant.
- La meme recherche affiche une synthese des risques naturels et
  technologiques presents selon Georisques, avec le statut a l'adresse et sur
  la commune, la source et la date de consultation.
- L'absence de parcelle cadastrale ne bloque ni la localisation du bien ni la
  synthese Georisques. Une indisponibilite de Georisques est signalee sans
  produire de resultat artificiel.
- Le lien Georisques reste disponible pour tous les types de rapport : il fait
  partie du socle commun de localisation et ne modifie pas le dossier.
- La carte IGN doit afficher les parcelles cadastrales dans `Site`, sur plan
  ou photographies aeriennes, sans compte Google ni cle API. L'adresse saisie
  et le resultat geocode restent distincts. Les boutons permettent de confirmer
  le bien ou de revenir directement au champ adresse, sans valeur de bornage.
- Une erreur ou un delai de chargement des tuiles doit etre signale sans
  empecher la saisie. Le recentrage et un lien externe restent disponibles.
- Une confirmation de lieu est liee a l'adresse et aux coordonnees. Elle
  devient caduque apres modification ou nouvelle recherche. Un deplacement
  dans la carte integree ne modifie pas implicitement le dossier.
- Le professionnel doit pouvoir corriger explicitement le point de visite,
  par clic, glisser-deposer ou coordonnees, puis valider ou annuler. Une
  correction conserve l'adresse et les notes, invalide les anciennes donnees
  derivees et exige une nouvelle confirmation. L'actualisation doit utiliser
  ce point sans le remplacer implicitement par le resultat du geocodage.

## Exigences techniques et securite

- Apres confirmation du lieu, proposer GoRenove et Pro'Reno dans Site pour
  les deux parcours, sans attribuer automatiquement de fiche au bien.
- Ouverture directe du bien reportee sur decision utilisateur : conserver
  les acces actuels et la recherche manuelle, sans pre-remplissage d'adresse.
  Pro'Reno reste une ressource typologique, pas une fiche a l'adresse. Voir
  les [conditions d'une reprise future](api/ressources-batiment.md#liens-directs-au-bien--evolution-reportee).
- Conserver liens choisis, notes et dates de consultation dans le dossier
  et ses exports. Distinguer simulations, donnees publiees et typologies generales.
- Invalider le rattachement d'une fiche apres changement de lien ou de lieu,
  sans supprimer les notes ; ne pas le restaurer implicitement.
- Refuser la navigation vers des URL non autorisees ; aucun scraping,
  abonnement, compte, cle ni acceptation de conditions automatique.

- Les accords de Visite Globale precedent l'entretien dans Dossier, sans
  accord photo ou dictee coche implicitement.
- Rapport des risques ouvre la synthese dans Site ; les erreurs sont
  explicites et une relance independante du cadastre est disponible.
- Carte PLU / regles restitue les informations sourcees au point d'adresse,
  sans deduire une interdiction du seul code de zone.
- Le relief est un reperage MNT indicatif, source et date visibles, sans
  confondre une erreur de couverture et un resultat plat.
- Les neuf altitudes doivent etre placees sur le fond cadastral a leurs
  coordonnees, avec point de visite, extremes relatifs, emprise explicite
  et tableau de secours. Ne pas confondre emprise mesuree et parcelle,
  altitude au sol et toit, ni contraste de couleur et risque.
- L'orientation de facade reste une saisie humaine, distincte du nord du plan.
- Notes et contexte enrichi suivent le dossier et les exports existants.

- La classification repose sur les champs existants `categorie` et
  `sous_categorie`. Pour `Visite Globale`, le second champ transporte le type
  d'habitation afin d'eviter une rupture de schema pendant le prototype.
- Les secrets et donnees d'authentification restent hors du navigateur et du
  depot.
- En environnement heberge, AVEREO CONNECT reste le point d'acces unique.
- Les sources externes futures doivent afficher leur origine et leur date, et
  disposer d'une saisie manuelle de secours lorsque le parcours l'exige.
- Pendant la phase de prototype fonctionnel, les evolutions privilegient la
  validation du besoin et du parcours utilisateur. Le TDD et la strategie de
  tests automatisee complete sont reportes a la phase d'industrialisation en
  vue de la commercialisation ; les controles existants et les validations
  proportionnees au risque restent executes.
- Les coordonnees transmises au service Georisques sont validees et aucun nom,
  email, commentaire, photo ou autre contenu du dossier n'est inclus dans le
  lien externe.
- L'integration Georisques utilise l'endpoint public V1 sans jeton et envoie
  uniquement les coordonnees longitude/latitude issues du geocodage. Les
  libelles et statuts affiches proviennent de la reponse officielle.
- Les interruptions ponctuelles peuvent être reprises un nombre limité de fois,
  avec délai et annulation. Un échec ne doit pas effacer une consultation datée
  au même point, ni conserver une synthèse pour un nouveau point. [Contrat](api/georisques.md).

## Limites du lot courant

Le lot courant livre la phase `Ecoute` dans l'etape `Dossier`, le protocole
ordonne `Eau -> Air -> Terre -> Feu`, le classement des observations par phase
et la synthese Georisques dans `Site`. Les controles d'ecoute restent non
bloquants : un motif ou des attentes absents produisent une alerte metier,
sans empecher le brouillon.

L'enrichissement de `Observation/Analyse`, puis les phases `Explication` et
`Pistes d'accompagnement`, ainsi que la machine d'etats proposee, restent en etude dans
[`workflows/workflow-habitologie.md`](workflows/workflow-habitologie.md).

## Consultation des rapports en ligne

Afficher les cinq dernières sauvegardes accessibles et permettre de porter la limite à cinquante. La recherche s’applique avant cette limite. La confirmation doit être visible au-dessus des résultats avant de remplacer un brouillon. [Contrat](api/README.md#recherche-des-sauvegardes-en-ligne).
