---
project: avereo-app-rapport
document_type: implementation-plan
title: Plan de mise en oeuvre de Visite Globale en habitologie
status: in-progress
version: git
created: 2026-09-10
updated: 2026-09-13
owner: jpdandin
tags:
  - rapport
  - habitologie
  - light
  - prototype
---

# Rapport d'habitologie : version legere

## Objectif

Proposer un parcours client court et exploitable sur le terrain :

`Client -> Bien immobilier -> Risques -> Analyse -> Aides -> Synthese`

Le resultat doit privilegier la comprehension du client, la rapidite de saisie
pendant la visite et une synthese sourcee. Cette chaine est un ordre metier ;
elle est integree dans l'assistant Rapport existant, gele sous le tag
`rapport-demo-v1.0.0`, sans creer un second moteur.

## Architecture recommandee

Conserver une seule application Rapport, son acces CONNECT, son API, sa base
MySQL et son assistant `Dossier -> Site -> Protocoles -> Observations ->
Export`. L'etape `Dossier` affiche seulement `Expertise & Visite technique`
et `Visite Globale`. La seconde categorie porte le parcours Habitologie.

La classification reutilise principalement `categorie`, deja presente dans la
charge JSON et utilisable pour definir les adaptations de workflow. Aucun
`report_type`, nouveau schema, nouvel endpoint ou nouvelle colonne MySQL n'est
necessaire. Le brouillon, les photos, la camera, la dictee, l'identite CONNECT,
la sauvegarde et l'export restent ceux du moteur actuel. Les anciens dossiers
`Reception de travaux` restent lisibles mais ce type n'est plus propose lors
d'une nouvelle creation. `Assistance avant-projet` et `Diagnostic specifique`
sont egalement conserves dans le code comme modules complementaires masques.

Les classifications visibles sont :

- `Evaluation Energétique`, `Mesures`, `cartographie` et `pathologies` pour
  `Expertise & Visite technique` ;
- un type d'habitation `Maison`, `Appartement`, `Immeuble collectif` ou
  `Autre habitation` pour `Visite Globale`.

Les quatre dimensions `Eau`, `Air`, `Terre` et `Feu` constituent le parcours
d'analyse de chaque visite globale, dans cet ordre. Elles ne sont pas des
sous-categories exclusives.

Le prototype transpose maintenant cet ordre dans `Protocoles`, avec des
points de controle propres a chaque phase, puis dans `Observations`, ou chaque
constat peut etre rattache a la phase et au controle concernes. Les anciennes
observations sans rattachement restent visibles dans `A classer`.

Le fil conducteur est affiche en tete de `Protocoles`, pas dans `Dossier`.
L'ecoute est enrichie et les sujets explicitement coches suggerent les points
du protocole, initialement non selectionnes. Les choix manuels priment. Le
cadastre IGN direct et sa confirmation sont integres et verifies localement ;
la qualification hebergee reste a faire, comme precise dans le workflow de reference.

Le workflow operationnel futur est maintenu comme proposition en etude dans
[`../workflows/workflow-habitologie.md`](../workflows/workflow-habitologie.md).

Correspondance du besoin metier avec l'assistant :

| Besoin Habitologie | Etape Rapport reutilisee |
| --- | --- |
| Client et mission | Dossier |
| Bien immobilier, localisation, cadastre et risques | Site |
| Methode et perimetre de visite | Protocoles |
| Notes, photos, mesures, analyse et aides | Observations |
| Synthese, sources et document partageable | Export |

## Parcours fonctionnel cible

### 1. Client

- identite et coordonnees ;
- objet de la visite ;
- consentement necessaire aux photos et aux eventuelles donnees vocales ;
- rattachement aux dossiers existants lorsque cette fonction est disponible.

### 2. Bien immobilier

- adresse normalisee et position sur carte ;
- commune, parcelle et references cadastrales ;
- type, periode de construction, occupation et caracteristiques essentielles ;
- controle manuel possible lorsque la source externe est indisponible.

### 3. Risques

- risques naturels, miniers, technologiques et pollution connus ;
- niveau, source, date de consultation et avertissement sur les limites ;
- possibilite de confirmer, completer ou commenter les donnees officielles.

Le socle commun ouvre le rapport officiel Georisques a partir des coordonnees
du bien. Il affiche aussi directement la reponse structuree de l'endpoint V1
`resultats_rapport_risque` : risques presents, statuts a l'adresse et sur la
commune, source et date de consultation. La confirmation ou le commentaire
manuel des donnees officielles reste a definir dans une tranche ulterieure.

### 4. Analyse et visite

- observations par zone ou composant ;
- photos depuis le terminal ou la camera ;
- mesures simples avec unite et commentaire ;
- commentaires libres et dictee vocale convertie en texte ;
- priorite, anomalie, recommandation et action suivante.

La conservation d'un enregistrement audio brut est hors MVP. Elle exige un lot
specifique sur le consentement, les formats, le stockage, la retention et la
suppression.

### 5. Aides

- aides nationales et MaPrimeRenov' selon les donnees disponibles ;
- fiches CEE pertinentes pour les travaux envisages ;
- aides regionales et locales selon la localisation ;
- source, date de validite et lien officiel pour chaque resultat ;
- mention explicite que l'eligibilite doit etre confirmee avant engagement.

### 6. Synthese

- situation du bien et principaux risques ;
- constats de visite illustres ;
- priorites et pistes d'amelioration ;
- aides susceptibles d'etre mobilisees ;
- sources et date de consultation ;
- apercu puis export partageable.

## Sources externes envisagees

| Besoin | Source prioritaire | Strategie simple |
| --- | --- | --- |
| Adresse et localisation | Service de geocodage de la Geoplateforme | Appel avec temporisation, resultat modifiable manuellement et coordonnees conservees avec la source. |
| Cadastre | API Carto IGN, module Cadastre | Recuperer la parcelle depuis l'adresse ou les coordonnees ; garder une saisie manuelle de secours. |
| Risques | API Georisques V1 | Appel direct sans jeton avec les seules coordonnees, conservation de la source, de la date et des statuts fournis, sans transformer l'information en diagnostic. |
| Aides nationales | API Mes Aides Reno | Commencer par les aides calculees par l'API et les liens officiels, puis elargir les criteres. |
| Aides locales | Catalogue Mes Aides Reno | Presenter une liste geolocalisee sourcee plutot qu'un moteur de regles local duplique. |
| CEE | Catalogue officiel des operations standardisees | Associer des fiches aux travaux selectionnes et enregistrer la version/date du catalogue. |
| AQC, ADEME, Ubakus, Guidance Wheel | Sites des editeurs | Utiliser des liens et credits dans le MVP. N'integrer une image, un calcul ou un contenu qu'apres validation explicite de la licence ou de l'autorisation. |

References consultees ou reverifiees le 12 septembre 2026 :

- <https://geoservices.ign.fr/documentation/services/api-et-services-ogc/api-carto-rest>
- <https://adresse.data.gouv.fr/outils/api-doc/adresse>
- <https://www.georisques.gouv.fr/doc-api>
- <https://www.data.gouv.fr/dataservices/api-mes-aides-reno>
- <https://mesaides.france-renov.gouv.fr/locales>
- <https://www.ecologie.gouv.fr/politiques-publiques/operations-standardisees-deconomies-denergie>
- <https://responsible-retrofit.org/greenwheel/>
- <https://www.ubakus.de/u-wert-rechner/>

## Strategie de validation du prototype

La phase actuelle privilegie un prototype fonctionnel permettant de valider
les parcours metier. Le TDD n'est pas impose pendant cette phase. Il sera
etudie avec la strategie de tests automatisee lors de l'industrialisation en
vue de la commercialisation.

Pour le prototype :

1. chaque tranche produit un resultat fonctionnel observable ;
2. le parcours nominal et les principaux blocages sont verifies manuellement ;
3. les tests existants pertinents et le build continuent a etre executes ;
4. aucune nouvelle infrastructure de test n'est exigee sans besoin specifique ;
5. la tranche est verifiee via CONNECT local avant la pull request lorsque le
   changement concerne le parcours authentifie.

Niveaux a couvrir par la future strategie :

- logique pure : normalisation, calculs, classement et validation ;
- composants : saisie, navigation, erreurs et reprise ;
- contrats API : requetes, reponses, indisponibilite et donnees partielles ;
- integration : sauvegarde, rechargement et isolation par identite ;
- bout en bout : lancement CONNECT, creation d'un Rapport d'habitologie, export.

## Lots et estimation

L'estimation est exprimee en jours de developpement pour une personne et inclut
la validation fonctionnelle du prototype, la documentation, la revue et la
validation locale. Elle exclut l'industrialisation de la strategie de tests,
les delais d'obtention d'autorisations de reproduction et les indisponibilites
des services tiers.

| Lot | Contenu | Estimation |
| --- | --- | ---: |
| 0 | Gel officiel, archive et manifeste du demonstrateur existant | 0,5 jour, realise |
| 1 | Scenarios d'acceptation, type Habitologue, preservation de Reception, normalisation et non-regression | 1 a 2 jours |
| 2 | Adaptation de Dossier et Site : client, bien, geocodage, cadastre et saisie manuelle de secours | 4 a 6 jours |
| 3 | Risques Georisques, horodatage, sources, erreurs et confirmation manuelle | 3 a 5 jours |
| 4 | Visite : observations, photos, mesures, commentaires et dictee texte | 4 a 6 jours |
| 5 | Aides nationales, CEE et aides locales avec sources et liens | 4 a 7 jours |
| 6 | Synthese, illustrations AVEREO ou autorisees, apercu et export | 4 a 6 jours |
| 7 | Sauvegarde/rechargement, non-regression du moteur actuel, preproduction et corrections | 3 a 5 jours |

### Etat du lot 1 au 11 septembre 2026

Le lot 1 a ete integre par la PR #57. L'alignement de classification demande le
11 septembre reste soumis a revue humaine :

- seulement deux categories proposees dans l'etape `Dossier` ;
- `Rapport Habitologue` renomme et normalise vers `Visite Globale` ;
- assistant historique unique conserve pour tous les rapports ;
- brouillon, sauvegarde, photos, dictee et export existants reutilises ;
- anciens dossiers `Reception de travaux` preserves en lecture ;
- migration defensive des deux prototypes de brouillon Habitologie ;
- tests unitaires de la classification, de la normalisation et de la migration.

Les champs metier et les appels externes specifiques ne font pas partie de ce
lot. La sauvegarde serveur et l'export sont deja ceux de Rapport ; leur contenu
sera enrichi au fil des adaptations metier.

### Premiere tranche du lot 2 au 11 septembre 2026

Une premiere tranche `Ecoute client` est implementee dans l'etape `Dossier`,
uniquement lorsque la categorie `Visite Globale` est selectionnee :

- motif de la visite ;
- attentes et priorites du client ;
- preoccupations exprimees ;
- usages du logement et habitudes ;
- occupants et contexte d'occupation ;
- accords distincts pour les photos et la dictee vocale.

Les champs acceptent la saisie manuelle et, apres accord, la dictee texte. Les
accords desactivent effectivement les commandes photo et micro lorsqu'ils ne
sont pas enregistres. Aucun audio brut n'est conserve. Les donnees sont
reprises par le brouillon, le payload JSON, la sauvegarde serveur et le document
Word sans evolution de schema MySQL.

Cette tranche ne livre pas encore la machine d'etats, la cloture de collecte,
les traitements d'analyse ni la synthese client.

### Delai global

- MVP vraiment leger : **15 a 20 jours**, soit environ **3 a 4 semaines**,
  avec dictée texte, aides principalement sourcees et illustrations sous forme
  de liens ou de schemas AVEREO.
- Version 1 robuste : **25 a 39 jours**, soit environ **6 a 8 semaines**, avec
  integrations officielles completes, cas de panne, synthese finalisee et
  qualification preproduction.
- Option enregistrement audio brut : ajouter **3 a 5 jours** apres validation
  du cadre de consentement et de conservation.

## Ordre de livraison recommande

1. valider les donnees indispensables sur un exemple reel ;
2. stabiliser la categorie `Visite Globale` et sa phase `Ecoute` dans le
   parcours actuel ;
3. adapter `Observation/Analyse` sans nouvelle API externe ;
4. brancher geocodage, cadastre puis risques avec des modes de secours ;
5. ajouter les aides sans promettre automatiquement l'eligibilite ;
6. finaliser la synthese et l'export ;
7. qualifier la preproduction puis laisser le deploiement sous controle humain.

## Criteres de succes du MVP

- le moteur actuel et ses dossiers restent compatibles ;
- un utilisateur CONNECT peut creer, reprendre et exporter un Rapport
  d'habitologie avec le meme assistant que les autres rapports ;
- le parcours reste utilisable si une source externe est indisponible ;
- chaque donnee externe affiche sa source et sa date ;
- aucune illustration tierce n'est copiee sans droit verifie ;
- aucune donnee client n'est envoyee a un tiers sans necessite documentee ;
- le parcours fonctionnel du lot est valide sur un exemple representatif.

## Hors perimetre initial

- remplacement du moteur Rapport officiel ;
- nouvelle application, nouveau sous-domaine ou nouvelle base dediee ;
- diagnostic reglementaire automatique ;
- garantie automatique d'eligibilite aux aides ;
- copie ou extraction automatisee de contenus AQC, ADEME, Ubakus ou Guidance
  Wheel sans autorisation ;
- stockage d'audio brut dans le MVP.
