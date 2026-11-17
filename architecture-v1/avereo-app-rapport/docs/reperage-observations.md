---
project: avereo-app-rapport
document_type: functional-specification
title: Plans et vues du dossier liés aux observations
status: active
version: git
created: 2026-11-02
updated: 2026-11-17
owner: jpdandin
tags: [rapport, observations, plans, cricq, word]
---

# Plans et vues du dossier

## Cadrage

Le 17 novembre, le responsable valide la bibliothèque de plans et les fonds
cadastre, satellite et satellite + parcelles. L'import PDF est un complément
séparé. La source opérationnelle est
rapportV12CadrageProfils20261112.plansVuesMultitypes20261117 dans le
[suivi canonique](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>).
Le cadrage approuvé est conservé dans
[la proposition](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/cadrage-plans-multivues.md>).

Le signalement R12-12 du [point Philippe](<C:/Users/examg/Documents local/Habitologue/Opportunité_Connect/docs/rapport-v1-2/cadrage-retours-philippe.md#suite-2026-11-17>)
est rattaché à la qualification de sélection/localisation. La version et le cas
exact de l'échec initial ne sont pas établis ; aucune cause générale n'est déduite.
Le nom de prestation « Analyse globale » est confirmé mais son lot de libellés
reste préparé séparément, sans changement de vocabulaire dans ce candidat Plans.

## Développement local

### Parcours implémenté

Dans Observations, **Plans et vues du dossier** reste repliable. La bibliothèque
sépare Terrain et implantation du Bâti et autres vues ; titre, type et nombre de
repères identifient chaque vue. Une seule vue est affichée en grand.

- **Importer des plans** accepte plusieurs PNG/JPEG et un type commun facultatif ;
  à défaut le nom suggère un type, vérifiable dans Informations sur la vue.
- Types : cadastre, satellite, satellite + parcelles, plan de masse, niveau,
  coupe, façade et autre. Titre et source restent modifiables.
- **Récupérer une vue du terrain** propose les trois fonds pour le lieu confirmé
  dans Site, pour tous les profils. Les vues Site existantes restent disponibles.
- Le cadastre superpose plan IGN et parcelles. Satellite utilise les photographies
  aériennes IGN sans parcelles ; Satellite + parcelles ajoute le parcellaire.
  Le changement de fond dans le volet ouvert conserve centre et zoom.
- Une option ajoute aussi le cadastre au même cadrage que le fond satellite
  choisi. L'ajout du couple est atomique ; aucun fond partiel n'est conservé si
  l'autre échoue. Chaque vue reste indépendante, sans copie implicite de repères.
- Dans une fiche, **Localiser sur un plan** ouvre le repérage et les boutons
  **Voir [titre]** ouvrent directement une vue déjà liée. Sélectionner un repère
  retrouve le constat ; clavier, glissement, zoom et retrait sont conservés.
- En l'absence de choix explicite, la bibliothèque privilégie une vue déjà liée
  au constat sélectionné, puis la première vue disponible.
- **Retirer cette vue** demande confirmation avec le nombre de repères concernés.
  La confirmation est affichée dans la page. Seuls le fond et ses points sont
  retirés ; constats, photos et autres vues restent.

La capture conserve source, date d'enregistrement, nord et cadrage dans l'image
et les métadonnées. La date de photographie n'est pas inventée. Les fonds et les
coordonnées normalisées restent fixes dans le dossier. Une nouvelle capture crée
un nouvel identifiant, sans remplacer les anciens fonds.

### Conservation et limites

Le même constat peut porter un point par vue sur plusieurs vues. Ses identifiants
et ceux des plans sont stables ; T1/T2 pour le terrain et les numéros du bâti
suivent l'ordre existant. Renommer ou choisir une vue ne change aucun point.
Déplacer le point d'une vue ne déplace pas celui d'une autre vue.

Le payload plans/reperes existant reçoit seulement de nouveaux types et le mode
facultatif du cadrage. [Contrat complet](../api/dossiers-complets.json).
Aucune migration SQL ni modification d'authentification, de propriétaire ou de
préférence CONNECT. La validation PHP accepte les mêmes huit types que le client.
Bornes conservées : 20 vues, 4 Mio par image, 12 000 px/côté, 24 millions de pixels
et dossier de 50 Mio. Seules les images PNG/JPEG incorporées sont acceptées.

Le volet carte est monté à son ouverture, pour ne pas démarrer une carte dans un
conteneur fermé. Les requêtes de tuiles restent publiques, sans cookies, par
lots de quatre. Une erreur de tuile est retentée une seule fois en rechargeant sa
réponse ; l'échec persistant reste explicite. Les bitmaps sont libérés après
usage ou échec. Les imports et captures signalent leur activité à la sauvegarde,
et un résultat tardif ne doit pas s'attacher à un autre dossier.

Les actions de modification restent refusées en consultation : affichage, choix
de vue, zoom, navigation vers une fiche et ouverture des sections restent permis.
Les contrôles serveur des actions et du propriétaire de PR166 sont conservés.

### Restitutions

Les vues et sources restent incorporées dans les deux Word. Les libellés des
anciens types sont conservés ; ceux des nouveaux types sont explicites. L'expert
reprend les vues selon le parcours existant. La synthèse client garde seulement
les vues portant des repères de ses constats retenus, sans légende exclue.
Le moteur Word et les règles de sélection client restent inchangés.

### Qualification

245 contrôles Node réussis, dont le contrôle de reprise bornée d'une erreur
de tuile. La qualification finale
et les reçus HTTP/navigateur/Word sont consignés dans le suivi du candidat exact.
Le test de contrôleur Drupal sur doubles n'est pas une connexion Drupal hébergée.

TBD — import PDF multipage, moteur, stockage privé de l'original et quotas à
cadrer séparément. Pas de nouveau PDF direct, de mesure automatique ou de bornage.
Les vrais appareils photo/microphones et une nouvelle pagination Word/PDF native
ne sont pas qualifiés par les essais de cette première tranche.

## Préproduction

Non engagée pour ce candidat. Recette à faire sur le candidat autorisé, avec
nouvelle capture, sauvegarde/nouvelle session, propriétaire, droits et deux Word.
Les profils PR164/166 gardent leur report explicite de livraison.

## Mise en production

Non engagée et non autorisée par cette demande. Livraison et ouverture restent
séparées de la revue locale. Sauvegarde/restauration et retour arrière à préparer
pour le candidat retenu.

## Référence historique du 2 novembre

Les paragraphes ci-dessous décrivent la première tranche Cricq ; leurs limites
de types et de suppression sont remplacées par le contrat courant ci-dessus.

### Repérage initial des observations

### Périmètre autorisé

Première version locale centrée sur les rapports du Cricq : rattacher les cinq
images fournies au dossier, placer des repères sur les niveaux et coupes, et
les reprendre dans le Word natif. La dictée et l'enregistrement des attentes
du candidat précédent `63ec279` sont conservés.

Le suivi canonique est le bloc `rapportObservationPlans20261102` de
`C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json`.
Les quatre phases sont **Cadrage → Développement local → Préproduction → Mise en production**.
Ce document décrit la fonction ; les versions, contrôles et accords restent dans le suivi.

### Parcours

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

### Données de référence

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

### Word et aperçu

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

### Contrôles attendus

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

### Suite reportée

Sur instruction du responsable, la validation de l'expert et ses statuts sont
reportés. Leur futur périmètre est la génération des PDF finaux stockés dans
Passeport Immo. Aucun statut de revue, signature nouvelle, export PDF final ou
transfert vers Passeport Immo n'est réalisé dans ce lot. Les zones, tracés de fissures,
mesures et détection automatique de pièces restent hors de cette première version.
