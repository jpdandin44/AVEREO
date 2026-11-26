---
project: avereo-app-rapport
document_type: architecture-index
title: Architecture de Rapport AVEREO
status: active
version: git
created: 2026-09-10
updated: 2026-11-26
owner: jpdandin
tags:
  - rapport
  - architecture
---

## 26 novembre — Conditions de visite et transfert Projet

`conditions_site` est une extension facultative du JSON existant ; le module `siteConditions` fixe l’attribution des anciennes mesures avant un changement de contexte et produit les mêmes lignes pour les deux restitutions. Les suggestions et l’état replié ne modifient pas les constats.

`auth/me` expose la capacité Projet calculée depuis la projection privée CONNECT. Le téléchargement officiel vérifie les actions ordinaires puis l’accès Projet courant avant de créer le fichier. Pas de nouveau stockage, migration SQL ou modification CONNECT. [Données, contrat d’autorisation et limites](docs/contexte-observations-export.md).

## Décision Word et PDF final séparés

La demande transporte les DOCX et le dossier complet, sans PDF préalable. La décision conserve les empreintes Word ; les PDF ultérieurs ont leurs propres versions privées, liées au Word client approuvé. Publication et sauvegarde conservent cette distinction, sans nouvelle migration SQL pour la correction. [Source fonctionnelle et critères](workflows/relecture-validation-pdf.md).


## Premier candidat — Revue privée par version

Rapport prépare un paquet de revue complet avec les deux PDF ; Passeport conserve les demandes dans la colonne nullable pi_biens.report_reviews et les paquets hors documents partageables. La nomination nominative réutilise le répertoire CONNECT ; seule la publication confirmée copie le PDF client approuvé dans pi_documents. Les sauvegardes incluent les archives privées. Pas de nouveau rôle global CONNECT. [Contrat et procédure](workflows/relecture-validation-pdf.md).


## 24 novembre — Capacité technique issue de CONNECT

La capacité technique de auth/me provient du booléen projeté par CONNECT. Les actions et la propriété restent contrôlées séparément ; les nouvelles créations/copies/conversions techniques exigent le droit explicite. Aucune table ni modification de la chaîne de médias. [Contrat](docs/rapport-technique.md#droit-administré-depuis-connect--24-novembre).

## 24 novembre — Deux présentations sur le même dossier

[Contrat du parcours technique](docs/rapport-technique.md#contrat-de-la-première-tranche-locale). La catégorie du dossier pilote les trois écrans techniques ou les cinq écrans globaux ; le profil de mission reste indépendant. Le nouveau composant de mission réutilise les champs client/bien et ajoute un objet JSON facultatif. Photos/plans/brouillons/API/Word restent partagés. auth/me expose une capacité calculée côté serveur ; reports POST contrôle création et conversion technique. Pas de table ni migration SQL supplémentaire.

## 21 novembre — Contrat commun de volumes

[Contrat et flux du candidat](docs/volume-sans-perte.md). Les limites proviennent de `avereo-platform/shared/report-volumes.json`, utilisées en JS et copiées avec leur helper PHP dans chaque API par le build. Contrôle du JSON stocké et reconstitué, enveloppe API distincte, budget mémoire et capacité du paquet MySQL vérifiés avant écriture. Le stockage et la lecture gardent les types JSON natifs ; la vue de validation reste séparée. Aucun changement SQL, identité ou droits.


## 19 novembre — Publication privée dans Passeport Immo

Le [lot de publication](docs/publication-passeport-immo.md) prépare un paquet `.avereo.zip` dans Rapport, puis le propriétaire l’importe dans le bien/client choisi dans Passeport. La restitution client Word utilise le moteur existant ; le JSON complet et les originaux photo restent dans la copie privée. La réouverture importe une copie indépendante dans Rapport, sans réutiliser la ligne serveur ou les références photo du propriétaire source. Aucun service à secret partagé supplémentaire ni transfert de propriété implicite.
## Libellé de prestation et métier — 17 novembre

reportProfiles porte le libellé de mission Analyse globale pour la clé habitologue ; reportDelivery le reprend dans les titres de couverture existants. Le même module fournit Conseils de l’expert à App, EnvironmentContext, reportHtml et reportDelivery. connectedMissionProfile conserve Habitologue pour le métier déclaré du compte. Aucun flux, stockage ou contrôle d’accès changé. [Contrat](docs/profils-professionnels.md#libellé-de-prestation--17-novembre).

## Plans et captures multiples — 17 novembre

ObservationPlans réutilise plans/reperes et les identifiants existants ; registry PLAN_KINDS partagée avec les libellés de restitution, validation PHP alignée. CadastralCapture et LocationMap utilisent les mêmes trois modes de tuiles publiques, image figée avec source/cadrage et ajout atomique d’un couple. Consultation conservée sous les droits existants. [Contrat](docs/reperage-observations.md). Aucun changement SQL ou d’authentification.

## 17 novembre — Actions issues de la politique CONNECT

La projection privée existante porte report_actions et access_profile pour les
seuls comptes affectés. Contrôles serveur à chaque requête, verrou des écritures
et propriété conservés ; contrôle frais pour les téléchargements officiels du
navigateur. Actualisation d'interface au focus/30 secondes et consultation
repliable utilisable sans modification. [Flux et frontières de garantie](../avereo-app-connect/docs/profils-et-droits.md).

## Titulaire des rapports et des originaux

Le titulaire courant, le rattachement vérifié, les métadonnées des originaux et le reçu évoluent dans une transaction Rapport. Le dépôt physique des photos reste stable. [Schéma et procédure](../../docs/administration-acces-exports.md#transférer-un-rapport-avant-fermeture).

## Profils de mission et défaut du compte — 16 novembre

Rapport lit les préférences privées du compte courant via le portail validé par Mon compte, puis vérifie la correspondance avec sa propre identité CONNECT. Lecture à l’ouverture/au retour de focus, 2,5 secondes maximum, choix manuel si indisponible ; aucun cache d’identité persistant. Le défaut est copié uniquement dans un nouveau `profil_metier`. Aucune application du défaut à une reprise/import/ouverture serveur. Une matrice de présentation commune aligne écrans et deux Word ; mêmes données/identifiants, médias et filtres. [Contrat et conservation](docs/profils-professionnels.md).

## 16 novembre — Projection des interventions vers Projet

InterventionProjectPanel lit les mêmes decision.actions, sauvegarde les seuls paramètres optionnels et affiche un aperçu dérivé. interventionProject.js importe le moteur Projet canonique pour normaliser/encoder/calculer le fichier, sans copie du calendrier ni nouvelle API interapplications. Le fichier est chargé par l’import privé existant de Projet, qui crée un projet indépendant sous ses droits habituels. [Flux, données et limites](api/interventions-projet.md). Les moteurs Word et les contrôles de propriétaire restent inchangés.

## Présentation progressive — 16 novembre

ScreenPresentation conserve les ouvertures uniquement en mémoire du wizard, par identifiant stable ; ScreenDisclosure garde les champs montés et contrôle leur visibilité. La création explicite initialise les ouvertures ; un import réinitialise le contexte, sans champ de présentation dans le JSON/API. App, InterventionsPanel et ObservationPlans réutilisent leurs données et commandes ; signature redessinée à dimension visible et dictée active protégée du repli. [Responsabilités et limites](docs/organisation-ecrans.md#composants-et-conservation).


## Interventions — complément du 16 novembre

InterventionsPanel réutilise decision.actions et les composants de dictée existants. interventions.js fournit le périmètre Habitologue/Visite Globale, les avertissements et le rendu partagé aperçu/Word. Champs facultatifs realisation et inclure_client validés dans decision-validation.php ; stockage JSON et rôles/propriété inchangés. reportHtml accepte un contenu additionnel après les recommandations ; reportDelivery insère le bloc expert et le bloc client filtré. [Données et flux](docs/interventions-proposees.md#données-et-compatibilité).

## Attentes et provenance — complément du 16 novembre

Le bloc decision porte notes_attentes et attentes[].provenance_ecoute (champ et texte_original), facultatifs, sans nouveau stockage ou schéma SQL. expectationListening.js fournit la copie explicite et les états de provenance ; DecisionSupportPanel utilise les attentes existantes pour la matrice de constats. VoiceField reste le composant de dictée ; decisionSupport produit les rendus expert/client. [Modèle et limites](docs/attentes-ecoute-client.md#données-et-compatibilité).


## Terrain dans Protocoles et Observations — révision locale du 14 novembre

VisitGuide.jsx présente le bloc 0 et le Bâti à l’horizontale. Les constats terrain utilisent le tableau observations avec phase_habitologie=terrain ; observationOrder.js dérive Tn et les numéros du bâti séparément, utilisés aussi dans plans, choix client, aide à la décision et Word. CadastralCapture.jsx utilise la carte existante, capture les seules tuiles publiques dans un PNG fixe et l’ajoute à plans avec kind=cadastre, cadrage et localisation. Les résultats tardifs sont écartés après changement de cible. PHP accepte ce type dans sa validation existante. EnvironmentContext.jsx demeure uniquement pour reprendre l’ancien contexte dans Observations ; Site ne le rend plus. Aucun nouveau stockage, endpoint, droit ou migration SQL. [Flux, bornes et composants](docs/environnement-terrain.md#données-et-composants).

## Copie photo du rapport — 13 novembre

`PhotoReportEditor.jsx` édite en mémoire un recadrage normalisé et une liste de rectangles/flèches/commentaires, avec historique local. `photoReportVersion.js` valide les opérations, peint une copie JPEG et choisit la source à afficher/exporter. `photo.src` reste l’original ; `photo.reportVersion` et `photo.reportPhotoChoice` sont facultatifs dans le payload existant. `reportHtml.js` et `reportDelivery.js` réutilisent le choix commun, sans modifier le convertisseur DOCX. L’attachement refuse une cible dont le dossier, la photo ou la source ont changé ; la conservation privée continue à lire l’original.

Sous le verrou existant par propriétaire, le service privé additionne réservations SQL et octets non enregistrés sur disque (ou surplus d’un fichier enregistré). Les fichiers manquants conservent leur réservation, les liens/chemins non conformes sont refusés ; aucune suppression ou réparation automatique. Aucune migration ni nouvelle route. [Contrat et limites](docs/photos-rapport-edition.md). La description « éditeur prévu » de la tranche initiale ci-dessous reste historique.

## Dossier complet — correctif local du 13 novembre

`reportFiles.js` valide le contenu reçu, identifie les structures fictives et prépare une copie d’import sans `onlineReportId`, en conservant les identifiants métier et leurs références. `ReportImport.jsx` confirme le remplacement du seul brouillon ; l’accueil et Export partagent ce composant. `OnlineReports.jsx` charge le payload complet pour ouvrir et propose le téléchargement de la sauvegarde sans changer le brouillon.

`reports.php?id=…&download=1` réutilise les contrôles existants de lecture puis diffuse `payload_json` en pièce jointe privée, sans décodage/réencodage. `report-download.php` valide et compte ce contenu ; son empreinte est contrôlée par le client. Après POST, une relecture SQL confirme les octets enregistrés avant l’accusé avec compteurs. Stockage, table, identité et propriétaire inchangés. [Contrat](api/dossiers-complets.json), [procédure](docs/partage-tests-et-stockage.md).


## Ordre commun des observations — lot 0 local

`observationOrder.js` fournit aux fiches, sélections, plans et restitutions un ordre commun et des numéros dérivés, tout en conservant les identifiants du payload. Aucun nouveau stockage ni migration. La création est initialisée en Visite Globale ; les catégories techniques existantes restent lisibles. [Composants et règles](docs/lot-0-observations.md#composants-et-stockage).

## Profil de mission et explications

`profil_metier` et `observations[].explications` étendent le payload JSON existant, sans migration SQL. Le profil adapte les formulaires et les restitutions, sans changer les rôles CONNECT ni la propriété. [Contrat et composants](docs/profil-habitologue.md).


## Photos originales et compression

L’import conserve la data URL dans `observations[].photos[]`. La première tranche locale ajoute une référence optionnelle `original`, un client `photoOriginals.js`, une vue `PhotoOriginals.jsx` et l’API `photo-originals.php`. `RapportPhotoOriginalStore` garde les octets dans un répertoire privé hors racine web et leurs métadonnées dans la table additive `rapport_photo_originals` (migration 003). Chaque opération vérifie le propriétaire courant du rapport et celui de l’original ; aucune exception administrateur. Le serveur réutilise le sas, l’identité et le verrou de révocation existants.

L’activation exige une configuration privée explicite et des limites positives ; elle reste désactivée par défaut. Fichiers et base doivent être sauvegardés ensemble. `photo.src`, Word et JSON restent inchangés, hormis la référence facultative. `photoCompression.js` est toujours un [module isolé non branché](docs/compression-photos.md). L’éditeur et la version rapport dérivée restent prévus. [Contrat et limites](docs/photos-originales-et-annotations.md), [API](api/photos-originales.json).

## Copie pour les tests

Le navigateur reconstruit un document indépendant à partir des choix du catalogue. L’import existant accepte cette copie. [Partage et supervision de la base](docs/partage-tests-et-stockage.md).

## Contrôle temporaire par identité — candidat local

Les sas Rapport et RGA lisent une politique privée de période au contrôle du cookie et à l’échange du ticket. RGA réutilise le sas porteur d’identité sans partager clé ni cookie. Aucune migration de dossier. [Contrat et limites](docs/essais-temporaires.md).


## Plans et repères du dossier

Les images et leurs métadonnées appartiennent au champ optionnel `plans` du payload privé. `reperes` sur chaque observation porte le lien vers la vue et ses coordonnées normalisées. `ObservationPlans.jsx` édite le repérage ; `reportHtml.js` compose les vues et légendes ; `reportDocx.js` incorpore les images dérivées avec leurs repères. Le fond source reste intact. La validation PHP rejoint les opérations existantes, sans nouvelle route, base ou migration. [Contrat et limites](docs/reperage-observations.md#données-de-référence).


## Champs vocaux et brouillon — candidat du 2 novembre

`VoiceField.jsx` mutualise le bouton micro et le cycle SpeechRecognition déjà utilisé dans App. Les rubriques de décision et les notes de livrable réutilisent ce composant ; les ajouts sont appliqués à la dernière valeur React. `dictationText.js` conserve le texte existant et la limite applicable.

Le bouton d'une attente délègue à `handleSave` et au stockage de brouillon existant (IndexedDB et secours localStorage). Il ne déclenche pas `saveOnlineReport`. Aucune API, table, migration ou extension du JSON métier n'est ajoutée. [Spécification](docs/aide-decision-demo.md#saisie-vocale-et-enregistrement-explicite-des-attentes).



## RGA — 2 novembre 2026

Le module cartographique reste hébergé sous `/rga/` sur le domaine de Rapport, avec un sas RGA indépendant. CONNECT le déclare comme application distincte ; l’hébergement commun ne donne aucun droit partagé. Le champ optionnel `rga_cartographie` conserve une lecture indicative, distincte de `risques.rga`. Les modules de validation sont communs à la carte et au formulaire. [Contrat et flux](api/rga.md).

## Bloc de décision du dossier

Le bloc optionnel `decision` demeure dans le payload JSON de Rapport, stocké dans `reports.payload_json` par les opérations existantes ; aucune migration de base. `DecisionSupportPanel.jsx` édite les données, `decisionSupport.js` compose bilan et comparaison pour `reportDelivery.js`, puis `reportDocx.js` produit le Word existant. `api/decision-validation.php` contrôle les types, listes (100 éléments), références et longueurs avant sauvegarde ; les droits/propriétés existants restent appliqués. Les anciens dossiers ne reçoivent aucun choix prérempli. [Contrat fonctionnel](docs/aide-decision-demo.md).


## Restitutions expert et client

Le champ optionnel `livrable` reste dans le payload JSON/MySQL existant. La
composition HTML commune et le module DOCX chargé à la demande consomment les
mêmes données ; aucun service d'export externe. Les illustrations pédagogiques
sont incorporées au frontend, les pièces privées uniquement dans leur dossier.
Sources, schéma et responsabilités : [procédure de transmission](docs/transmission-generation-rapports.md). Authentification et API inchangées.

# Architecture de Rapport AVEREO

Rapport est une application autonome du monorepo AVEREO : frontend React/Vite,
API PHP, base MySQL dediee et acces heberge par le sas AVEREO CONNECT.

La description technique detaillee et les flux restent maintenus dans
[`docs/architecture.md`](docs/architecture.md). L'authentification est decrite
dans [`docs/authentication.md`](docs/authentication.md) et les donnees dans
[`database/README.md`](database/README.md).

Depuis le lot 0 local, la classification des nouveaux dossiers expose uniquement
`Visite Globale`. `Expertise & Visite technique` demeure lisible pour les dossiers existants, avec ses sous-catégories, mais n'est plus proposée à la création. Les catégories
`Assistance avant-projet`, `Diagnostic specifique` et
`Reception de travaux` restent dans le catalogue du frontend avec le statut
masque. Elles demeurent chargeables pour assurer la compatibilite des dossiers
existants et pourront etre reactivees comme modules complementaires.

`Visite Globale` reutilise le meme assistant, la meme API et le meme stockage.
La valeur existante `categorie` conditionne l'affichage de la phase `Ecoute`
dans l'etape `Dossier`. Ses champs et consentements sont conserves dans l'objet
JSON `ecoute`, au sein du payload existant. Aucune nouvelle base, API, table ou
application n'est introduite.
Les anciennes classifications `Expertise & visite technique` et
`Rapport Habitologue` sont normalisees sans inventer un type d'habitation. Pour
`Visite Globale`, le champ technique historique `sous_categorie` conserve la
valeur du type d'habitation afin de preserver le schema existant. Les constantes
de workflow portent separement l'ordre d'analyse `Eau -> Air -> Terre -> Feu`.
Le payload conserve egalement `habitologie_protocoles` pour les points retenus,
`phase_habitologie` et `controle_habitologie` sur chaque observation, ainsi
qu'une synthese `risques` sourcee et horodatee issue de Georisques V1. Ces
ajouts restent compatibles avec les brouillons plus anciens grace a la fusion
des valeurs par defaut.

La selection Habitologie est resolue depuis les sujets explicites de `ecoute`
et les choix manuels de `habitologie_protocoles` (prioritaires), sous reserve
que la phase soit active. La suspension reversible est detaillee dans
[`docs/architecture.md`](docs/architecture.md). Le payload
`localisation` conserve l'adresse geocodee et la confirmation datee du lieu.
Leaflet 1.9.4 affiche les images WMTS publiques IGN dans le frontend, sans
iframe ni API interne supplementaire. Le stockage reste le payload JSON :
`urbanisme.context` conserve les attributs GPU et `terrain` les mesures
altimetriques, l'orientation et les notes. Voir
[`api/cartographie.md`](api/cartographie.md).

L'evolution 2 ajoute les liens externes et notes `ressources_batiment` au meme
payload. Aucun raccordement automatique aux fournisseurs : voir
[`api/ressources-batiment.md`](api/ressources-batiment.md).


## Mode relatif du planning

Le moteur Projet et sa validation PHP acceptent un mode optionnel sans ancrage calendaire ; Rapport utilise ce même contrat pour sa projection. Stockage privé et identité CONNECT conservés. [Planning Rapport vers Projet](docs/interventions-projet.md).
