---
project: avereo-app-rapport
document_type: implementation-plan
title: Plan de mise en oeuvre du Rapport d'habitologie
status: in-progress
version: git
created: 2026-09-10
updated: 2026-09-10
owner: jpdandin
tags:
  - rapport
  - habitologie
  - light
  - tdd
---

# Rapport d'habitologie : version legere

## Objectif

Proposer un parcours client court et exploitable sur le terrain :

`Client -> Bien immobilier -> Risques -> Analyse -> Aides -> Synthese`

Le resultat doit privilegier la comprehension du client, la rapidite de saisie
pendant la visite et une synthese sourcee. Il ne remplace pas le moteur Rapport
actuel, gele sous le tag `rapport-demo-v1.0.0`.

## Architecture recommandee

Conserver une seule application Rapport, son acces CONNECT, son API et sa base
MySQL. Ajouter un choix au demarrage :

1. `Rapport technique` ouvre le parcours actuel sans modification fonctionnelle ;
2. `Rapport d'habitologie` ouvre le nouveau parcours leger.

Chaque dossier porte un `report_type` et un `schema_version`. Le premier lot
peut conserver ces deux valeurs dans la charge JSON existante. Une colonne et
un index MySQL ne seront ajoutes que si la liste des rapports doit filtrer ou
trier ces valeurs cote serveur.

Le nouveau parcours est isole sous un module fonctionnel dedie. Les services
existants sont reutilises sans refactorisation generale : sauvegarde, brouillon,
photos, camera, dictee, identite CONNECT et export.

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
| Risques | API Georisques | Appeler l'API cote serveur, conserver la date et les niveaux tels que fournis, sans transformer l'information en diagnostic. |
| Aides nationales | API Mes Aides Reno | Commencer par les aides calculees par l'API et les liens officiels, puis elargir les criteres. |
| Aides locales | Catalogue Mes Aides Reno | Presenter une liste geolocalisee sourcee plutot qu'un moteur de regles local duplique. |
| CEE | Catalogue officiel des operations standardisees | Associer des fiches aux travaux selectionnes et enregistrer la version/date du catalogue. |
| AQC, ADEME, Ubakus, Guidance Wheel | Sites des editeurs | Utiliser des liens et credits dans le MVP. N'integrer une image, un calcul ou un contenu qu'apres validation explicite de la licence ou de l'autorisation. |

References consultees le 10 septembre 2026 :

- <https://geoservices.ign.fr/documentation/services/api-et-services-ogc/api-carto-rest>
- <https://adresse.data.gouv.fr/outils/api-doc/adresse>
- <https://www.georisques.gouv.fr/doc-api>
- <https://www.data.gouv.fr/dataservices/api-mes-aides-reno>
- <https://mesaides.france-renov.gouv.fr/locales>
- <https://www.ecologie.gouv.fr/politiques-publiques/operations-standardisees-deconomies-denergie>
- <https://responsible-retrofit.org/greenwheel/>
- <https://www.ubakus.de/u-wert-rechner/>

## Strategie TDD

La strategie de tests automatisee detaillee est definie en parallele. Le
developpement fonctionnel adopte des maintenant les invariants suivants :

1. un exemple metier et ses cas de refus sont rediges avant chaque tranche ;
2. un test echoue pour la bonne raison (`rouge`) ;
3. le minimum de code le fait reussir (`vert`) ;
4. la structure est simplifiee sans changer le comportement (`refactorisation`) ;
5. la tranche est verifiee via CONNECT local avant la pull request.

Niveaux a couvrir par la future strategie :

- logique pure : normalisation, calculs, classement et validation ;
- composants : saisie, navigation, erreurs et reprise ;
- contrats API : requetes, reponses, indisponibilite et donnees partielles ;
- integration : sauvegarde, rechargement et isolation par identite ;
- bout en bout : lancement CONNECT, creation d'un Rapport d'habitologie, export.

## Lots et estimation

L'estimation est exprimee en jours de developpement pour une personne et inclut
les tests TDD, la documentation, la revue et la validation locale. Elle exclut
les delais d'obtention d'autorisations de reproduction et les indisponibilites
des services tiers.

| Lot | Contenu | Estimation |
| --- | --- | ---: |
| 0 | Gel officiel, archive et manifeste du demonstrateur existant | 0,5 jour, realise |
| 1 | Scenarios d'acceptation, choix du type de rapport, squelette du parcours et schema versionne | 3 a 4 jours |
| 2 | Client, bien, geocodage, cadastre et saisie manuelle de secours | 4 a 6 jours |
| 3 | Risques Georisques, horodatage, sources, erreurs et confirmation manuelle | 3 a 5 jours |
| 4 | Visite : observations, photos, mesures, commentaires et dictee texte | 4 a 6 jours |
| 5 | Aides nationales, CEE et aides locales avec sources et liens | 4 a 7 jours |
| 6 | Synthese, illustrations AVEREO ou autorisees, apercu et export | 4 a 6 jours |
| 7 | Sauvegarde/rechargement, non-regression du moteur actuel, preproduction et corrections | 3 a 5 jours |

### Etat du lot 1 au 10 septembre 2026

Le lot 1 est implemente sur la branche `feat/rapport-habitologie-entry` et reste
soumis a la revue humaine :

- choix explicite entre le rapport technique et le Rapport d'habitologie ;
- compatibilite des brouillons historiques, interpretes comme techniques ;
- metadonnees `report_type` et `schema_version` ;
- parcours Habitologie navigable en six etapes ;
- sauvegarde et reprise du squelette dans le brouillon navigateur ;
- tests unitaires de la logique de type, de version et de normalisation.

Les champs metier, les appels externes, la sauvegarde serveur et l'export du
Rapport d'habitologie ne font pas partie de ce lot. Le parcours technique reste
fonctionnellement inchange.

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

1. valider le parcours et les donnees indispensables sur un exemple reel ;
2. livrer le bouton et un parcours vide navigable ;
3. rendre client, bien et visite utilisables sans aucune API externe ;
4. brancher geocodage, cadastre puis risques avec des modes de secours ;
5. ajouter les aides sans promettre automatiquement l'eligibilite ;
6. finaliser la synthese et l'export ;
7. qualifier la preproduction puis laisser le deploiement sous controle humain.

## Criteres de succes du MVP

- le moteur actuel reste accessible et ses dossiers restent compatibles ;
- un utilisateur CONNECT peut creer, reprendre et exporter un Rapport
  d'habitologie en six etapes maximum ;
- le parcours reste utilisable si une source externe est indisponible ;
- chaque donnee externe affiche sa source et sa date ;
- aucune illustration tierce n'est copiee sans droit verifie ;
- aucune donnee client n'est envoyee a un tiers sans necessite documentee ;
- les tests d'acceptation du lot sont ecrits avant son implementation.

## Hors perimetre initial

- remplacement du moteur Rapport officiel ;
- nouvelle application, nouveau sous-domaine ou nouvelle base dediee ;
- diagnostic reglementaire automatique ;
- garantie automatique d'eligibilite aux aides ;
- copie ou extraction automatisee de contenus AQC, ADEME, Ubakus ou Guidance
  Wheel sans autorisation ;
- stockage d'audio brut dans le MVP.
